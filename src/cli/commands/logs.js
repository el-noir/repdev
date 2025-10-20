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

export async function logsCommand(serviceName, options) {
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
            return;
        }

        const service = config.services[serviceName];
        if (!service) {
            logger.error(`Service '${serviceName}' not found in template.`);
            logger.info('Available services: ' + Object.keys(config.services).join(', '));
            return;
        }

        const containerName = service.container_name;
        if (!containerName) {
            logger.error(`Service '${serviceName}' does not have a container_name defined.`);
            return;
        }

        // Get container
        const container = docker.getContainer(containerName);
        
        // Check if container exists
        try {
            await container.inspect();
        } catch (err) {
            logger.error(`Container '${containerName}' not found. Is it running?`);
            logger.info(`Hint: Run 'repdev up' first to start containers.`);
            return;
        }

        logger.info(`📋 Logs for ${serviceName} (${containerName})`);
        if (options.follow) {
            logger.info('Following logs (Ctrl+C to stop)...\n');
        }

        const logOptions = {
            follow: options.follow || false,
            stdout: true,
            stderr: true,
            tail: options.tail || (options.follow ? 'all' : 100)
        };

        const logStream = await container.logs(logOptions);
        
        logStream.on('data', (chunk) => {
            // Docker multiplexes stdout/stderr, strip the 8-byte header
            const message = chunk.toString('utf8').substring(8);
            process.stdout.write(message);
        });

        logStream.on('end', () => {
            if (!options.follow) {
                logger.info('\n✅ Logs displayed.');
            }
        });

        // If following, keep process alive
        if (options.follow) {
            process.on('SIGINT', () => {
                logger.info('\n\n✅ Stopped following logs.');
                process.exit(0);
            });
        }

    } catch (error) {
        logger.error(`Failed to get logs: ${error.message}`);
    }
}
