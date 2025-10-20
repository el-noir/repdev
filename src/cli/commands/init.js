import fs from 'fs';
import path from 'path';
import { logger } from '../../core/logger.js';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

function presetsDir() {
  return path.dirname(fileURLToPath(new URL('../../templates/presets/mern.yml', import.meta.url)));
}

async function promptForNetworkConfiguration() {
  const { useCustomNetwork } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomNetwork',
      message: 'Do you want to configure custom networks?',
      default: false
    }
  ]);

  if (!useCustomNetwork) {
    return null;
  }

  const { networkMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'networkMode',
      message: 'Select network mode:',
      choices: [
        { name: 'Bridge (creates isolated network for your app - recommended)', value: 'bridge' },
        { name: 'Host (use host network stack - high performance)', value: 'host' },
        { name: 'Custom networks (multi-tier architecture with multiple networks)', value: 'custom' },
        { name: 'None (no networking)', value: 'none' }
      ],
      default: 'bridge'
    }
  ]);

  if (networkMode === 'custom') {
    const { networkNames } = await inquirer.prompt([
      {
        type: 'input',
        name: 'networkNames',
        message: 'Enter network names (comma-separated, e.g., frontend,backend,database):',
        default: 'frontend,backend'
      }
    ]);

    const { useStaticIp } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useStaticIp',
        message: 'Do you want to configure static IPs?',
        default: false
      }
    ]);

    let subnet = null;
    if (useStaticIp) {
      const subnetAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'subnet',
          message: 'Enter subnet (e.g., 172.25.0.0/16):',
          default: '172.25.0.0/16'
        }
      ]);
      subnet = subnetAnswer.subnet;
    }

    return {
      mode: 'custom',
      networks: networkNames.split(',').map(n => n.trim()),
      subnet: subnet
    };
  }

  return { mode: networkMode };
}

async function promptForCustomization(presetName) {
  const prompts = [];
  
  if (presetName === 'mern') {
    prompts.push(
      { type: 'input', name: 'backendDir', message: 'Backend directory:', default: './backend' },
      { type: 'input', name: 'frontendDir', message: 'Frontend directory:', default: './frontend' },
      { type: 'input', name: 'backendPort', message: 'Backend port:', default: '3000' },
      { type: 'input', name: 'frontendPort', message: 'Frontend port:', default: '5173' },
      { type: 'list', name: 'packageManager', message: 'Package manager:', choices: ['npm', 'yarn', 'pnpm'], default: 'npm' }
    );
  } else if (presetName === 'django' || presetName === 'django-drf') {
    prompts.push(
      { type: 'input', name: 'appDir', message: 'Django app directory:', default: './app' },
      { type: 'input', name: 'webPort', message: 'Django port:', default: '8000' },
      { type: 'input', name: 'dbPort', message: 'Postgres port:', default: '5432' }
    );
  }
  
  if (prompts.length === 0) {
    // For presets without specific prompts, just ask about network
    const networkConfig = await promptForNetworkConfiguration();
    return { networkConfig };
  }
  
  const answers = await inquirer.prompt(prompts);
  
  // Ask about network configuration
  const networkConfig = await promptForNetworkConfiguration();
  answers.networkConfig = networkConfig;
  
  return answers;
}

function applyCustomization(yaml, presetName, vars) {
  if (!vars) return yaml;
  
  // Apply preset-specific customizations
  if (presetName === 'mern') {
    if (vars.backendDir) yaml = yaml.replace(/\.\/backend/g, vars.backendDir);
    if (vars.frontendDir) yaml = yaml.replace(/\.\/frontend/g, vars.frontendDir);
    if (vars.backendPort) {
      yaml = yaml.replace(/"3000:3000"/g, `"${vars.backendPort}:${vars.backendPort}"`);
      yaml = yaml.replace(/PORT: 3000/g, `PORT: ${vars.backendPort}`);
      yaml = yaml.replace(/localhost:3000/g, `localhost:${vars.backendPort}`);
    }
    if (vars.frontendPort) {
      yaml = yaml.replace(/"5173:5173"/g, `"${vars.frontendPort}:${vars.frontendPort}"`);
      yaml = yaml.replace(/localhost:5173/g, `localhost:${vars.frontendPort}`);
    }
    if (vars.packageManager && vars.packageManager !== 'npm') {
      yaml = yaml.replace(/npm install/g, `${vars.packageManager} install`);
      yaml = yaml.replace(/npm run/g, `${vars.packageManager} run`);
    }
  }
  
  if (presetName === 'django' || presetName === 'django-drf') {
    if (vars.appDir) yaml = yaml.replace(/\.\/app/g, vars.appDir);
    if (vars.webPort) {
      yaml = yaml.replace(/"8000:8000"/g, `"${vars.webPort}:${vars.webPort}"`);
      yaml = yaml.replace(/0\.0\.0\.0:8000/g, `0.0.0.0:${vars.webPort}`);
    }
    if (vars.dbPort) {
      yaml = yaml.replace(/"5432:5432"/g, `"${vars.dbPort}:${vars.dbPort}"`);
    }
  }
  
  // Apply network configuration
  if (vars.networkConfig) {
    yaml = applyNetworkConfiguration(yaml, vars.networkConfig, presetName);
  }
  
  return yaml;
}

function applyNetworkConfiguration(yaml, networkConfig, presetName) {
  if (!networkConfig) return yaml;
  
  const lines = yaml.split('\n');
  const servicesIndex = lines.findIndex(line => line.trim() === 'services:');
  
  if (networkConfig.mode === 'bridge') {
    // Create a single custom bridge network for the entire application
    let networksYaml = '\nnetworks:\n';
    networksYaml += `  app_network:\n`;
    networksYaml += `    driver: bridge\n`;
    
    // Insert networks before services
    if (servicesIndex !== -1) {
      lines.splice(servicesIndex, 0, ...networksYaml.split('\n').slice(1, -1));
    }
    
    // Add app_network to all services
    let result = lines.join('\n');
    const serviceMatches = [...result.matchAll(/^  \w+:\n/gm)];
    for (let i = serviceMatches.length - 1; i >= 0; i--) {
      const match = serviceMatches[i];
      const insertIndex = match.index + match[0].length;
      result = result.slice(0, insertIndex) + 
              '    networks:\n      - app_network\n' + 
              result.slice(insertIndex);
    }
    return result;
  }
  
  if (networkConfig.mode === 'host') {
    // Add network_mode: host to all services
    let result = yaml;
    // Remove existing port mappings as they're not needed with host mode
    result = result.replace(/    ports:\n      - "[0-9]+:[0-9]+"/g, '    # Ports not needed with host mode');
    
    // Add network_mode to each service
    const serviceMatches = [...result.matchAll(/^  \w+:\n/gm)];
    for (let i = serviceMatches.length - 1; i >= 0; i--) {
      const match = serviceMatches[i];
      const insertIndex = match.index + match[0].length;
      result = result.slice(0, insertIndex) + '    network_mode: host\n' + result.slice(insertIndex);
    }
    return result;
  }
  
  if (networkConfig.mode === 'none') {
    // Add network_mode: none to all services
    let result = yaml;
    const serviceMatches = [...result.matchAll(/^  \w+:\n/gm)];
    for (let i = serviceMatches.length - 1; i >= 0; i--) {
      const match = serviceMatches[i];
      const insertIndex = match.index + match[0].length;
      result = result.slice(0, insertIndex) + '    network_mode: none\n' + result.slice(insertIndex);
    }
    return result;
  }
  
  if (networkConfig.mode === 'custom' && networkConfig.networks) {
    // Add networks section at top level
    let networksYaml = '\nnetworks:\n';
    networkConfig.networks.forEach(net => {
      networksYaml += `  ${net}:\n`;
      if (networkConfig.subnet && net === networkConfig.networks[0]) {
        // Apply subnet to first network
        networksYaml += `    driver: bridge\n`;
        networksYaml += `    ipam:\n`;
        networksYaml += `      driver: default\n`;
        networksYaml += `      config:\n`;
        networksYaml += `        - subnet: ${networkConfig.subnet}\n`;
      }
    });
    
    // Insert networks before services
    if (servicesIndex !== -1) {
      lines.splice(servicesIndex, 0, ...networksYaml.split('\n').slice(1, -1));
    }
    
    // Add networks to services based on preset
    let result = lines.join('\n');
    
    if (presetName === 'mern') {
      // Backend: frontend + backend networks
      result = result.replace(
        /(backend:[\s\S]*?)(    container_name:)/,
        `$1    networks:\n      - ${networkConfig.networks[0] || 'frontend'}\n      - ${networkConfig.networks[1] || 'backend'}\n$2`
      );
      // Frontend: frontend network only
      result = result.replace(
        /(frontend:[\s\S]*?)(    container_name:)/,
        `$1    networks:\n      - ${networkConfig.networks[0] || 'frontend'}\n$2`
      );
    } else {
      // For other presets, add first network to all services
      const serviceMatches = [...result.matchAll(/^  \w+:\n/gm)];
      for (let i = serviceMatches.length - 1; i >= 0; i--) {
        const match = serviceMatches[i];
        const insertIndex = match.index + match[0].length;
        result = result.slice(0, insertIndex) + 
                `    networks:\n      - ${networkConfig.networks[0]}\n` + 
                result.slice(insertIndex);
      }
    }
    
    return result;
  }
  
  return yaml;
}

export async function initCommand(options) {
    const cwd = process.cwd();
    const target = path.join(cwd, 'repdev.yml');
    
    try {
      // List presets
      if (options.list) {
        const dir = presetsDir();
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml'));
        logger.info('📋 Available presets:');
        for (const f of files) {
          const presetName = path.basename(f, '.yml');
          logger.info(`   - ${presetName}`);
        }
        logger.info('\n💡 Usage: repdev init -p <preset>');
        return;
      }

      // Initialize with preset
      if (options.preset) {
        const dir = presetsDir();
        const presetPath = path.join(dir, `${options.preset}.yml`);
        
        if (!fs.existsSync(presetPath)) {
          logger.error(`❌ Unknown preset: ${options.preset}`);
          logger.info('\n💡 Available presets:');
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml'));
          for (const f of files) {
            logger.info(`   - ${path.basename(f, '.yml')}`);
          }
          return;
        }
        
        let yaml = fs.readFileSync(presetPath, 'utf8');
        
        // Prompt for customization
        const vars = await promptForCustomization(options.preset);
        if (vars) {
          yaml = applyCustomization(yaml, options.preset, vars);
        }
        
        // Check if file exists
        if (fs.existsSync(target) && !options.force) {
          logger.info(`⚠️  repdev.yml already exists at ${target}`);
          logger.info('💡 Use --force to overwrite.');
          return;
        }
        
        fs.writeFileSync(target, yaml, 'utf8');
        logger.info(`✅ Created ${target} from preset '${options.preset}'`);
        logger.info('\n📝 Next steps:');
        logger.info('   1. Review and edit repdev.yml if needed');
        logger.info('   2. Run: repdev up');
        return;
      }

      // No preset specified - show error and help
      logger.error('❌ No preset specified!');
      logger.info('\n💡 RepDev requires a preset to initialize.');
      logger.info('   Run: repdev init --list    (to see available presets)');
      logger.info('   Or:  repdev init -p <preset>  (to initialize with a preset)');
      logger.info('\n📋 Example:');
      logger.info('   repdev init -p mern');
      
    } catch (err) {
        logger.error(`❌ Failed to create repdev.yml: ${err.message}`);
        process.exitCode = 1;
    }
}
