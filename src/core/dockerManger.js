import Docker from 'dockerode';

import { logger } from './logger.js';

const docker = new Docker();

export async function startContainers(config){
    try {
        // docker.ping uses a callback API so wrap it in a Promise
        await new Promise((resolve, reject) => docker.ping((err, data) => err ? reject(err) : resolve(data)));
    } catch (err) {
        logger.error('Cannot connect to the Docker daemon. Make sure Docker is running.');
        logger.error(`Docker connectivity error: ${err.message}`);
        logger.error('On Windows, start Docker Desktop or set the DOCKER_HOST environment variable to a valid Docker daemon (e.g., tcp://127.0.0.1:2375)');
        throw new Error('Docker daemon not reachable: ' + err.message);
    }

    for (const [name, service] of Object.entries(config.services)){
        logger.info(`Starting container: ${name}`);
        // Pull the image and wait for the pull to complete using dockerode's followProgress
        await new Promise((resolve, reject) => {
            docker.pull(service.image, (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err, output) => err ? reject(err) : resolve(output), (event) => {
                    // Optionally log progress events for visibility
                    if (event && event.status) {
                        logger.info(`Pull: ${service.image} - ${event.status}${event.progress ? ` ${event.progress}` : ''}`);
                    }
                });
            });
        });
            // Check for existing container with the same name and remove it
            if (service.container_name) {
                try {
                    const existing = await docker.listContainers({ all: true, filters: { name: [service.container_name] } });
                    if (existing && existing.length > 0) {
                        const existingId = existing[0].Id;
                        logger.info(`Container name "${service.container_name}" already in use by ${existingId}. Removing existing container...`);
                        const existingContainer = docker.getContainer(existingId);
                        await existingContainer.remove({ force: true });
                        logger.info(`Removed existing container ${existingId}.`);
                    }
                } catch (err) {
                    logger.error(`Error checking/removing existing container ${service.container_name}: ${err.message}`);
                    throw err;
                }
            }

        const container = await docker.createContainer({
            Image: service.image,
            name: service.container_name,
            Tty: true,
            HostConfig: {
                PortBindings: mapPorts(service.ports),
                Binds: mapVolumes(service.volumes)
            },
            Env: mapEnv(service.environment)
        })
        await container.start();
        logger.info(`Container started: ${name}`);
    }
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