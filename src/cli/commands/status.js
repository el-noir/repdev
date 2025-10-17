import Docker from 'dockerode';
import { logger } from '../../core/logger.js';

const docker = new Docker();

export async function statusCommand() {
    try {
        const containers = await docker.listContainers({ all: true });
        if(containers.length ===0){
            logger.info("No containers found.");
            return;
        } 
        logger.info("Container Status:");
        containers.forEach(container => {
            logger.info(`- ${container.Names[0].substring(1)} -${container.Image} - ${container.State} (${container.Status})`);
        })
    } catch (error) {
        logger.error(`Failed to retrieve container status: ${error.message}`);
    }
}