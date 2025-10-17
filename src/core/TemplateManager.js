import fs from "fs";
import yaml from "js-yaml";
import {logger} from './logger.js'

export function loadTemplate(templatePath)
{
    try {
        if(!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        const fileContents = fs.readFileSync(templatePath, 'utf8');
        const config = yaml.load(fileContents);
        logger.info(`Template loaded successfully: ${config.version}`);
        return config;
    } catch (error) {
        logger.error(`Error loading template: ${error.message}`);
        throw error;
    }
}