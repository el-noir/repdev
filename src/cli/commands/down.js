import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import { loadTemplate } from '../../core/TemplateManager.js';

const docker = new Docker();

export async function downCommand(options) {
    try {
        const templatePath = options.template || './templates/node_template.yml';
        logger.info(`Using template: ${templatePath}`);

        for(const service of Object.values(config.services)){
            const container = docker.getContainer(service.container_name);
            await container.stop().catch(()=>{});
            await container.remove().catch(()=>{});
            logger.info(`Container removed: ${service.container_name}`);
        }
        logger.info("✅ All containers have been removed.");

    } catch (error) {
        logger.error(`Failed to remove containers: ${error.message}`);
    }
}
