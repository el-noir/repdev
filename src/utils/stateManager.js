import fs from 'fs';
import path from 'path';
import { logger } from '../core/logger.js';

const STATE_DIR = '.repdev';
const STATE_FILE = 'state.json';

/**
 * Get state file path
 */
function getStatePath() {
  const stateDir = path.join(process.cwd(), STATE_DIR);
  return path.join(stateDir, STATE_FILE);
}

/**
 * Ensure state directory exists
 */
function ensureStateDir() {
  const stateDir = path.join(process.cwd(), STATE_DIR);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
}

/**
 * Load state from disk
 */
export function loadState() {
  try {
    const statePath = getStatePath();
    
    if (!fs.existsSync(statePath)) {
      return {
        version: '1.0',
        containers: {},
        lastUp: null,
        lastDown: null,
        templatePath: null,
        preset: null
      };
    }
    
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Failed to load state: ${error.message}`);
    return {
      version: '1.0',
      containers: {},
      lastUp: null,
      lastDown: null,
      templatePath: null,
      preset: null
    };
  }
}

/**
 * Save state to disk
 */
export function saveState(state) {
  try {
    ensureStateDir();
    const statePath = getStatePath();
    const content = JSON.stringify(state, null, 2);
    fs.writeFileSync(statePath, content, 'utf-8');
    logger.debug(`State saved to ${statePath}`);
  } catch (error) {
    logger.warn(`Failed to save state: ${error.message}`);
  }
}

/**
 * Record container start
 */
export function recordContainerStart(serviceName, containerName, config) {
  const state = loadState();
  
  state.containers[serviceName] = {
    containerName,
    image: config.image,
    ports: config.ports || [],
    startedAt: new Date().toISOString(),
    status: 'running'
  };
  
  state.lastUp = new Date().toISOString();
  
  saveState(state);
}

/**
 * Record container stop
 */
export function recordContainerStop(serviceName) {
  const state = loadState();
  
  if (state.containers[serviceName]) {
    state.containers[serviceName].status = 'stopped';
    state.containers[serviceName].stoppedAt = new Date().toISOString();
  }
  
  saveState(state);
}

/**
 * Record all containers stopped
 */
export function recordAllContainersStopped() {
  const state = loadState();
  
  Object.keys(state.containers).forEach(serviceName => {
    state.containers[serviceName].status = 'stopped';
    state.containers[serviceName].stoppedAt = new Date().toISOString();
  });
  
  state.lastDown = new Date().toISOString();
  
  saveState(state);
}

/**
 * Remove container from state
 */
export function removeContainer(serviceName) {
  const state = loadState();
  delete state.containers[serviceName];
  saveState(state);
}

/**
 * Clear all state
 */
export function clearState() {
  const state = {
    version: '1.0',
    containers: {},
    lastUp: null,
    lastDown: null,
    templatePath: null,
    preset: null
  };
  saveState(state);
}

/**
 * Get running containers from state
 */
export function getRunningContainers() {
  const state = loadState();
  return Object.entries(state.containers)
    .filter(([_, info]) => info.status === 'running')
    .map(([serviceName, info]) => ({
      service: serviceName,
      ...info
    }));
}

/**
 * Check if service is running (according to state)
 */
export function isServiceRunning(serviceName) {
  const state = loadState();
  return state.containers[serviceName]?.status === 'running';
}

/**
 * Get container name from service name
 */
export function getContainerName(serviceName) {
  const state = loadState();
  return state.containers[serviceName]?.containerName;
}

/**
 * Set template info
 */
export function setTemplateInfo(templatePath, preset = null) {
  const state = loadState();
  state.templatePath = templatePath;
  state.preset = preset;
  saveState(state);
}

/**
 * Get state summary for status command
 */
export function getStateSummary() {
  const state = loadState();
  
  const running = Object.values(state.containers).filter(c => c.status === 'running').length;
  const stopped = Object.values(state.containers).filter(c => c.status === 'stopped').length;
  const total = Object.keys(state.containers).length;
  
  return {
    total,
    running,
    stopped,
    lastUp: state.lastUp,
    lastDown: state.lastDown,
    templatePath: state.templatePath,
    preset: state.preset,
    containers: state.containers
  };
}

/**
 * Check for port conflicts with existing state
 */
export function checkPortConflicts(newPorts) {
  const state = loadState();
  const conflicts = [];
  
  Object.entries(state.containers).forEach(([serviceName, info]) => {
    if (info.status !== 'running') return;
    
    info.ports?.forEach(portMapping => {
      const hostPort = portMapping.split(':')[0];
      
      newPorts.forEach(newPortMapping => {
        const newHostPort = newPortMapping.split(':')[0];
        
        if (hostPort === newHostPort) {
          conflicts.push({
            service: serviceName,
            port: hostPort,
            container: info.containerName
          });
        }
      });
    });
  });
  
  return conflicts;
}
