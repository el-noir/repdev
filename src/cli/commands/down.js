import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import { loadTemplate } from '../../core/TemplateManager.js';
import { fileURLToPath } from 'url';

const docker = new Docker();

export async function downCommand(options) {
    try {
        const defaultTemplatePath = fileURLToPath(new URL('../../templates/node_template.yml', import.meta.url));
        const templatePath = options.template || defaultTemplatePath;
        logger.info(`Using template: ${templatePath}`);

        const config = loadTemplate(templatePath);
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
