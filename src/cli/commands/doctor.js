import Docker from 'dockerode';
import { logger } from '../../core/logger.js';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docker = new Docker();

/**
 * Check if a TCP port is available
 */
async function isPortAvailable(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, host);
  });
}

/**
 * Check Docker connectivity
 */
async function checkDocker() {
  try {
    await new Promise((resolve, reject) => 
      docker.ping((err, data) => err ? reject(err) : resolve(data))
    );
    
    // Get Docker version
    const version = await docker.version();
    
    return {
      status: 'ok',
      version: version.Version,
      apiVersion: version.ApiVersion,
      os: version.Os,
      arch: version.Arch
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      suggestion: 'Start Docker Desktop or check DOCKER_HOST environment variable'
    };
  }
}

/**
 * Check Node.js version
 */
function checkNode() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  return {
    status: major >= 18 ? 'ok' : 'warning',
    version,
    suggestion: major < 18 ? 'Node.js 18+ recommended for best compatibility' : null
  };
}

/**
 * Check if repdev.yml exists
 */
function checkTemplate() {
  const templatePath = path.join(process.cwd(), 'repdev.yml');
  const exists = fs.existsSync(templatePath);
  
  if (exists) {
    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      return {
        status: 'ok',
        path: templatePath,
        size: Buffer.byteLength(content, 'utf-8')
      };
    } catch (error) {
      return {
        status: 'error',
        error: 'Cannot read repdev.yml',
        suggestion: 'Check file permissions'
      };
    }
  }
  
  return {
    status: 'warning',
    message: 'No repdev.yml found in current directory',
    suggestion: 'Run "repdev init" to create one'
  };
}

/**
 * Check common ports used by presets
 */
async function checkPorts() {
  const commonPorts = [
    { port: 3000, service: 'Node.js/React/Express' },
    { port: 5173, service: 'Vite' },
    { port: 8000, service: 'Django' },
    { port: 8080, service: 'Generic HTTP' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 27017, service: 'MongoDB' },
    { port: 6379, service: 'Redis' },
    { port: 3306, service: 'MySQL' }
  ];
  
  const results = [];
  
  for (const { port, service } of commonPorts) {
    const available = await isPortAvailable(port);
    results.push({
      port,
      service,
      available,
      status: available ? 'ok' : 'warning'
    });
  }
  
  return results;
}

/**
 * Check running RepDev containers
 */
async function checkContainers() {
  try {
    const containers = await docker.listContainers({ all: true });
    const repdevContainers = containers.filter(c => 
      c.Names.some(name => 
        name.includes('mern_') || 
        name.includes('django_') || 
        name.includes('node_') ||
        name.includes('nextjs_')
      )
    );
    
    return {
      status: 'ok',
      total: repdevContainers.length,
      running: repdevContainers.filter(c => c.State === 'running').length,
      stopped: repdevContainers.filter(c => c.State === 'exited').length,
      containers: repdevContainers.map(c => ({
        name: c.Names[0].replace('/', ''),
        state: c.State,
        image: c.Image,
        status: c.Status
      }))
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check disk space
 */
function checkDiskSpace() {
  try {
    // This is a simplified check - in production you'd use a library like 'diskusage'
    // For now, we'll just check if we can write to temp
    const tempFile = path.join(process.cwd(), '.repdev-health-check');
    fs.writeFileSync(tempFile, 'test');
    fs.unlinkSync(tempFile);
    
    return {
      status: 'ok',
      message: 'Disk writable'
    };
  } catch (error) {
    return {
      status: 'error',
      error: 'Cannot write to disk',
      suggestion: 'Check disk space and permissions'
    };
  }
}

/**
 * Print check result
 */
function printCheck(emoji, label, result) {
  const statusEmoji = {
    ok: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`\n${emoji} ${label}`);
  console.log(`   Status: ${statusEmoji[result.status]} ${result.status.toUpperCase()}`);
  
  if (result.version) console.log(`   Version: ${result.version}`);
  if (result.apiVersion) console.log(`   API Version: ${result.apiVersion}`);
  if (result.os) console.log(`   OS: ${result.os} (${result.arch})`);
  if (result.path) console.log(`   Path: ${result.path}`);
  if (result.size) console.log(`   Size: ${result.size} bytes`);
  if (result.total !== undefined) console.log(`   Total: ${result.total} (${result.running} running, ${result.stopped} stopped)`);
  if (result.message) console.log(`   ${result.message}`);
  if (result.error) console.log(`   Error: ${result.error}`);
  if (result.suggestion) console.log(`   💡 Suggestion: ${result.suggestion}`);
}

/**
 * Doctor command - run system health checks
 */
export async function doctorCommand(options) {
  console.log('\n🏥 RepDev System Health Check\n');
  console.log('='.repeat(50));
  
  // Check Node.js
  const nodeCheck = checkNode();
  printCheck('🟢', 'Node.js', nodeCheck);
  
  // Check Docker
  const dockerCheck = await checkDocker();
  printCheck('🐳', 'Docker', dockerCheck);
  
  // Check Template
  const templateCheck = checkTemplate();
  printCheck('📄', 'Template (repdev.yml)', templateCheck);
  
  // Check Disk Space
  const diskCheck = checkDiskSpace();
  printCheck('💾', 'Disk Space', diskCheck);
  
  // Check Containers (only if Docker is ok)
  if (dockerCheck.status === 'ok') {
    const containersCheck = await checkContainers();
    printCheck('📦', 'RepDev Containers', containersCheck);
    
    if (containersCheck.containers && containersCheck.containers.length > 0) {
      console.log('\n   Containers:');
      containersCheck.containers.forEach(c => {
        const stateEmoji = c.state === 'running' ? '🟢' : '⚪';
        console.log(`     ${stateEmoji} ${c.name} (${c.state}) - ${c.image}`);
      });
    }
  }
  
  // Check Ports
  if (options.ports) {
    console.log('\n\n🔌 Common Port Availability Check\n');
    console.log('='.repeat(50));
    
    const portsCheck = await checkPorts();
    portsCheck.forEach(p => {
      const emoji = p.available ? '✅' : '⚠️';
      const status = p.available ? 'Available' : 'In Use';
      console.log(`${emoji} Port ${p.port} (${p.service}): ${status}`);
    });
  }
  
  // Summary
  console.log('\n\n📊 Summary\n');
  console.log('='.repeat(50));
  
  const checks = [nodeCheck, dockerCheck, templateCheck, diskCheck];
  const errors = checks.filter(c => c.status === 'error').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const oks = checks.filter(c => c.status === 'ok').length;
  
  console.log(`✅ OK: ${oks}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Errors: ${errors}`);
  
  if (errors > 0) {
    console.log('\n🔧 Action Required: Fix errors above before running RepDev');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Some warnings detected, but RepDev should work');
  } else {
    console.log('\n✨ All systems operational! RepDev is ready to use.');
  }
  
  console.log('\n💡 Tip: Run "repdev doctor --ports" to check common port availability\n');
}
