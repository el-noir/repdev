import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import { loadTemplate } from '../../core/TemplateManager.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const docker = new Docker();

function presetsDir() {
    return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

export async function restartCommand(serviceName, options) {
    try {
        const defaultTemplatePath = fileURLToPath(new URL('../../templates/node_template.yml', import.meta.url));
        const localPath = path.join(process.cwd(), 'repdev.yml');
        let templatePath = options.template || null;
        
        if (!templatePath && options.preset) {
            const dir = presetsDir();
            const presetPath = path.join(dir, `${options.preset}.yml`);
            if (!fs.existsSync(presetPath)) {
                logger.error(`Unknown preset: ${options.preset}`);
                return;
            }
            templatePath = presetPath;
        }
        if (!templatePath) templatePath = fs.existsSync(localPath) ? localPath : defaultTemplatePath;

        const config = loadTemplate(templatePath);
        
        // Find the service
        if (!serviceName) {
            logger.error('Please specify a service name. Available services:');
            for (const name of Object.keys(config.services)) {
                logger.info(`  - ${name}`);
            }
            logger.info('\nOr use "repdev restart --all" to restart all services.');
            return;
        }

        // Handle --all flag
        if (options.all) {
            logger.info('🔄 Restarting all services...');
            for (const [name, service] of Object.entries(config.services)) {
                await restartSingleService(name, service);
            }
            logger.info('✅ All services restarted.');
            return;
        }

        const service = config.services[serviceName];
        if (!service) {
            logger.error(`Service '${serviceName}' not found in template.`);
            logger.info('Available services: ' + Object.keys(config.services).join(', '));
            return;
        }

        await restartSingleService(serviceName, service);
        logger.info('✅ Service restarted.');

    } catch (error) {
        logger.error(`Failed to restart: ${error.message}`);
    }
}

async function restartSingleService(serviceName, service) {
    const containerName = service.container_name;
    if (!containerName) {
        logger.error(`Service '${serviceName}' does not have a container_name defined.`);
        return;
    }

    const container = docker.getContainer(containerName);
    
    try {
        await container.inspect();
    } catch (err) {
        logger.error(`Container '${containerName}' not found.`);
        logger.info(`Hint: Run 'repdev up' first to start containers.`);
        return;
    }

    logger.info(`🔄 Restarting ${serviceName} (${containerName})...`);
    await container.restart();
    logger.info(`✅ ${serviceName} restarted.`);
}
