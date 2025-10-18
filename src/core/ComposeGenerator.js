import yaml from 'js-yaml';

// Convert repdev config to a docker-compose v3.9 YAML string
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
    compose.services[name] = svcDef;
  }

  return yaml.dump(compose, { noRefs: true, lineWidth: -1 });
}
