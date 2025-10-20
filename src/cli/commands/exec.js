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

export async function execCommand(serviceName, commandArgs, options) {
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

        if (!commandArgs || commandArgs.length === 0) {
            logger.error('Please specify a command to execute.');
            logger.info('Example: repdev exec backend bash');
            logger.info('Example: repdev exec backend npm install');
            return;
        }

        // Get container
        const container = docker.getContainer(containerName);
        
        // Check if container exists and is running
        let containerInfo;
        try {
            containerInfo = await container.inspect();
        } catch (err) {
            logger.error(`Container '${containerName}' not found.`);
            logger.info(`Hint: Run 'repdev up' first to start containers.`);
            return;
        }

        if (!containerInfo.State.Running) {
            logger.error(`Container '${containerName}' is not running.`);
            logger.info(`Hint: Run 'repdev up' to start it.`);
            return;
        }

        logger.info(`🔧 Executing in ${serviceName} (${containerName}): ${commandArgs.join(' ')}`);

        const exec = await container.exec({
            Cmd: commandArgs,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true
        });

        const stream = await exec.start({ hijack: true, stdin: true, Tty: true });

        // Pipe stdin/stdout
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.pipe(stream);
        stream.pipe(process.stdout);

        stream.on('end', () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            logger.info('\n✅ Command execution finished.');
            process.exit(0);
        });

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            stream.end();
            process.stdin.setRawMode(false);
            process.stdin.pause();
            logger.info('\n✅ Execution interrupted.');
            process.exit(0);
        });

    } catch (error) {
        logger.error(`Failed to execute command: ${error.message}`);
    }
}
