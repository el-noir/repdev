import Docker from 'dockerode';

import { logger } from './logger.js';
import { runHooks } from './HooksRunner.js';
import http from 'http';
import net from 'net';

const docker = new Docker();

export async function startContainers(config, options = { force: false, dryRun: false }){
    if (!options.dryRun) {
        try {
            // docker.ping uses a callback API so wrap it in a Promise
            await new Promise((resolve, reject) => docker.ping((err, data) => err ? reject(err) : resolve(data)));
        } catch (err) {
            logger.error('Cannot connect to the Docker daemon. Make sure Docker is running.');
            logger.error(`Docker connectivity error: ${err.message}`);
            logger.error('On Windows, start Docker Desktop or set the DOCKER_HOST environment variable to a valid Docker daemon (e.g., tcp://127.0.0.1:2375)');
            throw new Error('Docker daemon not reachable: ' + err.message);
        }
    } else {
        logger.info('[dry-run] Skipping Docker daemon connectivity check');
    }

    // Global preUp hooks
    await runHooks('preUp', config.hooks?.preUp, { dryRun: options.dryRun });

    for (const [name, service] of Object.entries(config.services)){
        // If services filter is provided, skip services not in the list
        if (options.services && Array.isArray(options.services) && options.services.length > 0) {
            if (!options.services.includes(name)) {
                logger.info(`Skipping service ${name} (not in filter)`);
                continue;
            }
        }
        logger.info(`Starting container: ${name}`);

        // Per-service beforeStart hooks
        await runHooks(`service:${name}:beforeStart`, service.hooks?.beforeStart, { dryRun: options.dryRun });

        // Pull the image (or dry-run)
        if (options.dryRun) {
            logger.info(`[dry-run] Would pull image: ${service.image}`);
        } else {
            await new Promise((resolve, reject) => {
                docker.pull(service.image, (err, stream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(stream, (err, output) => err ? reject(err) : resolve(output), (event) => {
                        if (event && event.status) logger.info(`Pull: ${service.image} - ${event.status}${event.progress ? ` ${event.progress}` : ''}`);
                    });
                });
            });
        }

        // Check for an existing container with the same name
        if (service.container_name) {
            try {
                const existing = await docker.listContainers({ all: true, filters: { name: [service.container_name] } });
                if (existing && existing.length > 0) {
                    const existingMeta = existing[0];
                    const existingId = existingMeta.Id;
                    const state = existingMeta.State;
                    logger.info(`Container name "${service.container_name}" already in use by ${existingId} (state=${state}).`);

                    if (state !== 'running' || options.force) {
                        if (options.dryRun) {
                            logger.info(`[dry-run] Would remove existing container ${existingId}`);
                        } else {
                            logger.info(`Removing existing container ${existingId}...`);
                            const existingContainer = docker.getContainer(existingId);
                            await existingContainer.remove({ force: true });
                            logger.info(`Removed existing container ${existingId}.`);
                        }
                    } else {
                        logger.info(`Container ${service.container_name} is running. Use --force to recreate.`);
                        continue;
                    }
                }
            } catch (err) {
                logger.error(`Error checking/removing existing container ${service.container_name}: ${err.message}`);
                throw err;
            }
        }

        // Prepare labels
        const labels = {};
        if (config.__repdev && config.__repdev.runLabel) {
            const labelParts = config.__repdev.runLabel.split('=');
            if (labelParts.length === 2) labels[labelParts[0]] = decodeURIComponent(labelParts[1]);
        }

        // Create/start container (or dry-run)
        if (options.dryRun) {
            logger.info(`[dry-run] Would create container ${service.container_name} with image ${service.image}`);
        } else {
            const container = await docker.createContainer({
                Image: service.image,
                name: service.container_name,
                Tty: true,
                HostConfig: {
                    PortBindings: mapPorts(service.ports),
                    Binds: mapVolumes(service.volumes)
                },
                Env: mapEnv(service.environment),
                Labels: labels
            });
            await container.start();
            logger.info(`Container started: ${name}`);
        }

        // Readiness checks
        await waitForService(name, service, { dryRun: options.dryRun });

        // Per-service afterStart hooks
        await runHooks(`service:${name}:afterStart`, service.hooks?.afterStart, { dryRun: options.dryRun });
        
    }

    // Global postUp hooks
    await runHooks('postUp', config.hooks?.postUp, { dryRun: options.dryRun });
}

function mapPorts(ports){
    const map = {}
    if(!ports) return map;

    for (const portMapping of ports){
        const [host, container] = portMapping.split(':');
        map[`${container}/tcp`] = [{ HostPort: host }];
    }
    return map;
}

function mapVolumes(volumes){
    if(!volumes) return [];
    return volumes.map(v=> {
        const [src, dest] = v.split(':');
        return `${process.cwd()}/${src}:${dest}`;
    })
}

function mapEnv(environment){
    return environment ? Object.entries(environment).map(([key, value])=> `${key}=${value}`) : [];
}

async function waitForService(name, service, { dryRun }) {
    const wf = service.wait_for;
    if (!wf) return;
    const interval = Math.max(100, wf.interval || 1000);
    const timeout = wf.timeout || 60000;
    const retries = wf.retries || Math.floor(timeout / interval);

    logger.info(`Waiting for ${name} (${wf.type})...`);
    if (dryRun) {
        logger.info(`[dry-run] Would wait with interval=${interval}ms, retries=${retries}`);
        return;
    }

    const start = Date.now();
    for (let attempt = 1; attempt <= retries; attempt++) {
        const ok = await checkOnce(wf, service);
        if (ok) {
            logger.info(`${name} is ready (after ${attempt} checks, ${Date.now() - start}ms).`);
            return;
        }
        await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(`Service ${name} readiness timed out after ${Date.now() - start}ms.`);
}

function checkOnce(wf, service) {
    return new Promise((resolve) => {
        if (wf.type === 'http' && wf.url) {
            const req = http.get(wf.url, (res) => {
                const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
                res.resume();
                resolve(ok);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => { req.destroy(); resolve(false); });
            return;
        }
        if (wf.type === 'tcp' && wf.host && wf.port) {
            const socket = net.createConnection({ host: wf.host, port: wf.port, timeout: 5000 }, () => {
                socket.end();
                resolve(true);
            });
            socket.on('error', () => resolve(false));
            socket.setTimeout(5000, () => { socket.destroy(); resolve(false); });
            return;
        }
        if (wf.type === 'container_healthy') {
            // Determine container name to check
            const containerName = wf.container || service.container_name;
            if (!containerName) return resolve(false);
            const container = docker.getContainer(containerName);
            container.inspect((err, data) => {
                if (err || !data) return resolve(false);
                const health = data.State && data.State.Health && data.State.Health.Status;
                resolve(health === 'healthy');
            });
            return;
        }
        resolve(true);
    });
}