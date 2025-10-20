import { loadTemplate } from "../../core/TemplateManager.js";
import { startContainers } from "../../core/dockerManger.js";
import { logger } from "../../core/logger.js";
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { toComposeYaml } from '../../core/ComposeGenerator.js';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
const exec = promisify(_exec);

function presetsDir() {
    return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

async function promptForPreset() {
    const dir = presetsDir();
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml'));
    if (files.length === 0) {
        logger.error('No presets available.');
        return null;
    }
    const choices = files.map(f => path.basename(f, '.yml'));
    choices.push('Skip (use default template)');
    const answer = await inquirer.prompt([{
        type: 'list',
        name: 'preset',
        message: 'Select a preset template:',
        choices
    }]);
    if (answer.preset === 'Skip (use default template)') return null;
    return path.join(dir, `${answer.preset}.yml`);
}

export async function upCommand(options){
    try {
        const defaultTemplatePath = fileURLToPath(new URL('../../templates/node_template.yml', import.meta.url));
        // Resolve template path: explicit -t > --preset > local repdev.yml > prompt > default
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
        // If no explicit template/preset and no local repdev.yml, prompt
        if (!templatePath && !fs.existsSync(localPath)) {
            const chosen = await promptForPreset();
            if (chosen) templatePath = chosen;
        }
        if (!templatePath) templatePath = fs.existsSync(localPath) ? localPath : defaultTemplatePath;
        logger.info(`Using template: ${templatePath}`);

    const config = loadTemplate(templatePath);
    // Add a run label to identify containers created by this template run
    const runLabel = `repdev.template=${encodeURIComponent(templatePath)}`;
    config.__repdev = { runLabel };

    // Parse services filter if provided
    let serviceFilter = null;
    if (options.services) {
        serviceFilter = options.services.split(',').map(s=>s.trim()).filter(Boolean);
    }

    // If --compose, generate compose file (optionally filtered) and run docker compose up -d
    if (options.compose) {
        const filtered = { ...config, services: { ...config.services } };
        if (serviceFilter && serviceFilter.length > 0) {
            filtered.services = Object.fromEntries(Object.entries(config.services).filter(([n]) => serviceFilter.includes(n)));
        }
        const composeYaml = toComposeYaml(filtered);
        const outPath = path.join(process.cwd(), 'docker-compose.yml');
        fs.writeFileSync(outPath, composeYaml, 'utf8');
        logger.info(`Wrote ${outPath}`);
        if (options.dryRun) {
            logger.info('[dry-run] Would run: docker compose up -d');
        } else {
            const { stdout, stderr } = await exec('docker compose up -d');
            if (stdout) logger.info(stdout.trim());
            if (stderr) logger.info(stderr.trim());
        }
    } else {
        await startContainers(config, { force: options.force, dryRun: options.dryRun, services: serviceFilter, noWait: options.wait === false });
    }
        logger.info("✅ Environment is up and running.");
    } catch (error) {
        logger.error(`Failed to start environment: ${error.message}`);
    }
}

