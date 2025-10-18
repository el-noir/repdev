import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { loadTemplate } from '../../core/TemplateManager.js';
import { logger } from '../../core/logger.js';

function presetsDir() {
    return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

export async function validateCommand(options){
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
        logger.info(`Validating template: ${templatePath}`);
        loadTemplate(templatePath);
        logger.info('✅ Template is valid.');
    } catch (err) {
        logger.error(`Template is invalid: ${err.message}`);
        process.exitCode = 2;
    }
}
