import fs from 'fs';
import path from 'path';
import { logger } from '../../core/logger.js';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const SAMPLE_YAML = `version: '1.0'
metadata:
  name: my-project
  description: Development environment
  author: ${process.env.USER || process.env.USERNAME || 'developer'}

services:
  app:
    image: node:20-alpine
    container_name: my_app
    ports:
      - "3000:3000"

# Next steps:
# 1. Edit this file to add your services
# 2. Or scaffold from a preset: repdev init -p mern --force
# 3. Run: repdev up
`;

function presetsDir() {
  return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

async function promptForCustomization(presetName) {
  if (presetName === 'mern') {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'backendDir', message: 'Backend directory:', default: './backend' },
      { type: 'input', name: 'frontendDir', message: 'Frontend directory:', default: './frontend' },
      { type: 'input', name: 'backendPort', message: 'Backend port:', default: '3000' },
      { type: 'input', name: 'frontendPort', message: 'Frontend port:', default: '5173' },
      { type: 'list', name: 'packageManager', message: 'Package manager:', choices: ['npm', 'yarn', 'pnpm'], default: 'npm' }
    ]);
    return answers;
  }
  if (presetName === 'django') {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'appDir', message: 'Django app directory:', default: './app' },
      { type: 'input', name: 'webPort', message: 'Django port:', default: '8000' },
      { type: 'input', name: 'dbPort', message: 'Postgres port:', default: '5432' }
    ]);
    return answers;
  }
  return null;
}

function applyCustomization(yaml, presetName, vars) {
  if (!vars) return yaml;
  
  if (presetName === 'mern') {
    yaml = yaml.replace(/\.\/backend/g, vars.backendDir);
    yaml = yaml.replace(/\.\/frontend/g, vars.frontendDir);
    yaml = yaml.replace(/"3000:3000"/g, `"${vars.backendPort}:${vars.backendPort}"`);
    yaml = yaml.replace(/PORT: 3000/g, `PORT: ${vars.backendPort}`);
    yaml = yaml.replace(/localhost:3000/g, `localhost:${vars.backendPort}`);
    yaml = yaml.replace(/"5173:5173"/g, `"${vars.frontendPort}:${vars.frontendPort}"`);
    yaml = yaml.replace(/localhost:5173/g, `localhost:${vars.frontendPort}`);
    if (vars.packageManager !== 'npm') {
      yaml = yaml.replace(/npm install/g, `${vars.packageManager} install`);
      yaml = yaml.replace(/npm run/g, `${vars.packageManager} run`);
    }
  }
  
  if (presetName === 'django') {
    yaml = yaml.replace(/\.\/app/g, vars.appDir);
    yaml = yaml.replace(/"8000:8000"/g, `"${vars.webPort}:${vars.webPort}"`);
    yaml = yaml.replace(/0\.0\.0\.0:8000/g, `0.0.0.0:${vars.webPort}`);
    yaml = yaml.replace(/"5432:5432"/g, `"${vars.dbPort}:${vars.dbPort}"`);
  }
  
  return yaml;
}

export async function initCommand(options) {
    const cwd = process.cwd();
    const target = path.join(cwd, 'repdev.yml');
    try {
    if (options.list) {
      const dir = presetsDir();
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml'));
      logger.info('Available presets:');
      for (const f of files) logger.info(' - ' + path.basename(f, '.yml'));
      return;
    }

    if (options.preset) {
      const dir = presetsDir();
      const presetPath = path.join(dir, `${options.preset}.yml`);
      if (!fs.existsSync(presetPath)) {
        logger.error(`Unknown preset: ${options.preset}`);
        return;
      }
      let yaml = fs.readFileSync(presetPath, 'utf8');
      
      // Prompt for customization
      const vars = await promptForCustomization(options.preset);
      if (vars) {
        yaml = applyCustomization(yaml, options.preset, vars);
      }
      
      if (fs.existsSync(target) && !options.force) {
        logger.info(`repdev.yml already exists at ${target}. Use --force to overwrite.`);
        return;
      }
      fs.writeFileSync(target, yaml, 'utf8');
      logger.info(`✅ Created ${target} from preset '${options.preset}'`);
      return;
    }

        if (fs.existsSync(target) && !options.force) {
            logger.info(`repdev.yml already exists at ${target}. Use --force to overwrite.`);
            return;
        }
        fs.writeFileSync(target, SAMPLE_YAML, 'utf8');
        logger.info(`✅ Created ${target}`);
    } catch (err) {
        logger.error(`Failed to create repdev.yml: ${err.message}`);
        process.exitCode = 1;
    }
}
