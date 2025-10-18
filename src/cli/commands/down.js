import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import { loadTemplate } from '../../core/TemplateManager.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { toComposeYaml } from '../../core/ComposeGenerator.js';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { runHooks } from '../../core/HooksRunner.js';
const exec = promisify(_exec);

const docker = new Docker();

function presetsDir() {
    return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

export async function downCommand(options) {
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
        logger.info(`Using template: ${templatePath}`);

        const config = loadTemplate(templatePath);
        // Parse optional services filter
        let serviceFilter = null;
        if (options.services) serviceFilter = options.services.split(',').map(s=>s.trim()).filter(Boolean);

        if (options.compose) {
            await runHooks('preDown', config.hooks?.preDown, { dryRun: options.dryRun });
            const filtered = { ...config, services: { ...config.services } };
            if (serviceFilter && serviceFilter.length > 0) {
                filtered.services = Object.fromEntries(Object.entries(config.services).filter(([n]) => serviceFilter.includes(n)));
            }
            const composeYaml = toComposeYaml(filtered);
            const outPath = path.join(process.cwd(), 'docker-compose.yml');
            fs.writeFileSync(outPath, composeYaml, 'utf8');
            logger.info(`Wrote ${outPath}`);
            if (options.dryRun) {
                logger.info('[dry-run] Would run: docker compose down');
            } else {
                const { stdout, stderr } = await exec('docker compose down');
                if (stdout) logger.info(stdout.trim());
                if (stderr) logger.info(stderr.trim());
            }
            await runHooks('postDown', config.hooks?.postDown, { dryRun: options.dryRun });
            return;
        }

    // If a run label exists for this template, prefer to remove containers by label
    await runHooks('preDown', config.hooks?.preDown, { dryRun: options.dryRun });
        const runLabel = `repdev.template=${encodeURIComponent(templatePath)}`;
    // List all containers with this label
    const labeled = await docker.listContainers({ all: true, filters: { label: [runLabel] } });
    // serviceFilter already parsed above
        
        if (labeled && labeled.length > 0) {
            for (const info of labeled) {
                // If service filter provided and this container's names don't match, skip
                if (serviceFilter && !info.Names.some(n => serviceFilter.includes(n.replace(/^\//, '')))) continue;

                const c = docker.getContainer(info.Id);
                logger.info(`Found labeled container ${info.Names.join(', ')} (${info.Id}) state=${info.State}`);
                if (info.State === 'running' && !options.force) {
                    logger.info(`Skipping running container ${info.Names.join(', ')} (use --force to remove)`);
                    continue;
                }
                if (!options.force) {
                    logger.info(`Stopping container ${info.Names.join(', ')} (${info.Id})`);
                    await c.stop().catch(()=>{});
                }
                logger.info(`Removing container ${info.Id}`);
                await c.remove({ force: !!options.force }).catch((e)=>{ logger.error(`Failed to remove ${info.Id}: ${e.message}`) });
            }
            logger.info("✅ Labeled containers processed.");
            await runHooks('postDown', config.hooks?.postDown, { dryRun: options.dryRun });
            return;
        }

        // Fallback: remove containers listed in the template by name
        for(const [name, service] of Object.entries(config.services)){
            if (serviceFilter && !serviceFilter.includes(name)) continue;
            try {
                const container = docker.getContainer(service.container_name);
                // if running and not forced, skip removal
                const listed = await docker.listContainers({ all: true, filters: { name: [service.container_name] } });
                const isRunning = listed && listed.length > 0 && listed[0].State === 'running';
                if (isRunning && !options.force) {
                    logger.info(`Skipping running container ${service.container_name} (use --force to remove)`);
                    continue;
                }
                await container.stop().catch(()=>{});
                await container.remove({ force: !!options.force }).catch(()=>{});
                logger.info(`Container removed: ${service.container_name}`);
            } catch (e) {
                logger.error(`Error removing container ${service.container_name}: ${e.message}`);
            }
        }
    logger.info("✅ All containers have been removed (fallback path).");
    await runHooks('postDown', config.hooks?.postDown, { dryRun: options.dryRun });

    } catch (error) {
        logger.error(`Failed to remove containers: ${error.message}`);
    }
}
