import { load } from "js-yaml";
import { loadTemplate } from "../../core/TemplateManager.js";
import { startContainers } from "../../core/dockerManger.js";
import { logger } from "../../core/logger.js";
import { fileURLToPath } from 'url';

export async function upCommand(options){
    try {
        const defaultTemplatePath = fileURLToPath(new URL('../../templates/node_template.yml', import.meta.url));
        const templatePath = options.template || defaultTemplatePath;
        logger.info(`Using template: ${templatePath}`);

        const config = loadTemplate(templatePath);
        await startContainers(config);
        logger.info("✅ Environment is up and running.");
    } catch (error) {
        logger.error(`Failed to start environment: ${error.message}`);
    }
}

