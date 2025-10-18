import fs from 'fs';
import path from 'path';
import { logger } from '../../core/logger.js';
import { fileURLToPath } from 'url';

const SAMPLE_YAML = `version: '1.0'
metadata:
  name: sample-project
  description: Starter RepDev template
  author: your-name
  created_at: ${new Date().toISOString()}

services:
  app:
    image: node:20
    container_name: sample_app
    working_dir: /usr/src/app
    volumes:
      - ./app:/usr/src/app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
    command: ["npm", "run", "dev"]
    depends_on:
      - db

  db:
    image: postgres:15
    container_name: sample_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - ./data/db:/var/lib/postgresql/data
`;

function presetsDir() {
  return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
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
      const yaml = fs.readFileSync(presetPath, 'utf8');
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
