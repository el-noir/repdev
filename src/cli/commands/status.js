import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import { getStateSummary } from '../../utils/stateManager.js';

const docker = new Docker();

export async function statusCommand() {
    try {
        logger.info('\n📊 RepDev Status\n');
        
        // Get state summary
        const state = getStateSummary();
        
        if (state.total === 0) {
            logger.info('No containers tracked by RepDev');
            logger.info('\n💡 Run "repdev up" to start your environment\n');
            return;
        }
        
        logger.info(`Template: ${state.templatePath || 'Unknown'}`);
        if (state.preset) {
            logger.info(`Preset: ${state.preset}`);
        }
        
        logger.info(`\nContainers: ${state.total} total, ${state.running} running, ${state.stopped} stopped`);
        
        if (state.lastUp) {
            logger.info(`Last Up: ${new Date(state.lastUp).toLocaleString()}`);
        }
        if (state.lastDown) {
            logger.info(`Last Down: ${new Date(state.lastDown).toLocaleString()}`);
        }
        
        // Check actual Docker status for tracked containers
        const containers = await docker.listContainers({ all: true });
        
        logger.info('\n📦 Containers:\n');
        
        for (const [serviceName, info] of Object.entries(state.containers)) {
            const dockerContainer = containers.find(c => 
                c.Names.includes(`/${info.containerName}`)
            );
            
            const statusEmoji = dockerContainer?.State === 'running' ? '🟢' : '⚪';
            const actualStatus = dockerContainer ? dockerContainer.State : 'not found';
            const ports = info.ports?.join(', ') || 'none';
            
            logger.info(`${statusEmoji} ${serviceName} (${info.containerName})`);
            logger.info(`   Image: ${info.image}`);
            logger.info(`   Status: ${actualStatus}`);
            logger.info(`   Ports: ${ports}`);
            
            if (dockerContainer?.Status) {
                logger.info(`   ${dockerContainer.Status}`);
            }
            
            logger.info('');
        }
        
    } catch (error) {
        logger.error(`Failed to get status: ${error.message}`);
        logger.info('\n💡 Run "repdev doctor" to check system health\n');
    }
}