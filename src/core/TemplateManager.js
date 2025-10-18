import fs from "fs";
import yaml from "js-yaml";
import {logger} from './logger.js'
import Ajv from 'ajv';

// Load JSON schema at runtime to avoid import-assertion syntax issues
const schemaPath = new URL('./template.schema.json', import.meta.url);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const validate = ajv.compile(schema);

export function loadTemplate(templatePath)
{
    try {
        if(!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }
        const fileContents = fs.readFileSync(templatePath, 'utf8');
        const config = yaml.load(fileContents);
        // Coerce YAML-parsed dates into strings (js-yaml may parse ISO-like values as Date)
        if (config && config.metadata && config.metadata.created_at && config.metadata.created_at instanceof Date) {
            config.metadata.created_at = config.metadata.created_at.toISOString();
        }

        // Validate template against schema
        const valid = validate(config);
        if (!valid) {
            const errs = validate.errors.map(e => `${e.instancePath} ${e.message}`).join('; ');
            throw new Error(`Template validation error: ${errs}`);
        }
        logger.info(`Template loaded successfully: ${config.version}`);
        return config;
    } catch (error) {
        logger.error(`Error loading template: ${error.message}`);
        throw error;
    }
}