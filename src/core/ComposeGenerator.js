import yaml from 'js-yaml';

export function toComposeYaml(config) {
  const compose = { version: '3.9', services: {} };

  for (const [name, svc] of Object.entries(config.services || {})) {
    const svcDef = {};
    if (svc.image) svcDef.image = svc.image;
    if (svc.container_name) svcDef.container_name = svc.container_name;
    if (svc.working_dir) svcDef.working_dir = svc.working_dir;
    if (svc.volumes && Array.isArray(svc.volumes) && svc.volumes.length > 0) {
      svcDef.volumes = svc.volumes.slice();
    }
    if (svc.ports && Array.isArray(svc.ports) && svc.ports.length > 0) {
      svcDef.ports = svc.ports.slice();
    }
    if (svc.environment && typeof svc.environment === 'object') {
      svcDef.environment = { ...svc.environment };
    }
    if (svc.command) {
      svcDef.command = Array.isArray(svc.command) ? svc.command.slice() : svc.command;
    }
    if (svc.depends_on && Array.isArray(svc.depends_on) && svc.depends_on.length > 0) {
      svcDef.depends_on = svc.depends_on.slice();
    }
    
    // Network configuration - supports both network_mode and networks
    if (svc.network_mode) {
      svcDef.network_mode = svc.network_mode;
    }
    if (svc.networks) {
      if (Array.isArray(svc.networks) && svc.networks.length > 0) {
        // Simple array: ['net1', 'net2']
        svcDef.networks = svc.networks.slice();
      } else if (typeof svc.networks === 'object' && !Array.isArray(svc.networks)) {
        // Advanced config: { net1: { aliases: [...], ipv4_address: ... }, net2: null }
        svcDef.networks = {};
        for (const [netName, netConfig] of Object.entries(svc.networks)) {
          if (netConfig === null || netConfig === undefined) {
            svcDef.networks[netName] = null;
          } else if (typeof netConfig === 'object') {
            svcDef.networks[netName] = { ...netConfig };
          }
        }
      }
    }
    
    compose.services[name] = svcDef;
  }

  // Add top-level networks definition if specified
  if (config.networks && typeof config.networks === 'object' && Object.keys(config.networks).length > 0) {
    compose.networks = {};
    for (const [name, netConfig] of Object.entries(config.networks)) {
      if (netConfig === null || netConfig === true) {
        // Simple network declaration: networks: { mynet: null }
        compose.networks[name] = null;
      } else if (typeof netConfig === 'object') {
        // Full network configuration
        compose.networks[name] = { ...netConfig };
      }
    }
  }

  return yaml.dump(compose, { noRefs: true, lineWidth: -1 });
}
