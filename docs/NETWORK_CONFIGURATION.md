# Network Configuration Guide

RepDev provides flexible network configuration options for your Docker development environments. This guide covers all available network modes and configurations.

## Table of Contents
- [Network Modes](#network-modes)
- [Custom Networks](#custom-networks)
- [Network Configuration Examples](#network-configuration-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Network Modes

Docker supports several network modes for containers. You can specify the mode using the `network_mode` property in your service definition.

### Available Network Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `bridge` | Default. Containers on same bridge can communicate | Most common for isolated services |
| `host` | Container shares host's network stack | High performance, direct host access |
| `none` | Disables all networking | Security isolation, offline processing |
| `service:<name>` | Shares network with another service | Debugging, tight coupling |
| `container:<id>` | Shares network with specific container | Advanced scenarios |

### Example: Using Network Modes

```yaml
version: '1.0'
services:
  # Default bridge network (implicit)
  app:
    image: node:20
    container_name: my_app
    ports:
      - "3000:3000"
  
  # Host network mode - container uses host networking
  nginx:
    image: nginx:latest
    container_name: nginx_proxy
    network_mode: host
  
  # No network - completely isolated
  batch_processor:
    image: python:3.11
    container_name: processor
    network_mode: none
```

---

## Custom Networks

You can define custom Docker networks for better service isolation and communication. This is useful for multi-tier applications.

### Basic Custom Network

```yaml
version: '1.0'

# Define custom networks at top level
networks:
  frontend:
  backend:
  database:

services:
  web:
    image: nginx:latest
    networks:
      - frontend
  
  api:
    image: node:20
    networks:
      - frontend
      - backend
  
  db:
    image: postgres:15
    networks:
      - backend
      - database
```

### Advanced Network Configuration

```yaml
version: '1.0'

networks:
  # Custom bridge network with specific subnet
  app_network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
  
  # External network (managed outside RepDev)
  shared_network:
    external: true
    name: my_existing_network

services:
  app:
    image: node:20
    networks:
      app_network:
        ipv4_address: 172.28.0.10
        aliases:
          - api
          - backend
      shared_network: {}
```

---

## Network Configuration Examples

### Example 1: Microservices Architecture

```yaml
version: '1.0'
metadata:
  name: microservices-app
  description: Microservices with separate networks

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
  data:
    driver: bridge

services:
  # Public-facing web server
  nginx:
    image: nginx:latest
    container_name: nginx_gateway
    networks:
      - public
    ports:
      - "80:80"
  
  # API gateway (public + internal)
  api_gateway:
    image: node:20
    container_name: api_gateway
    networks:
      - public
      - internal
    environment:
      NODE_ENV: development
  
  # Auth service (internal only)
  auth_service:
    image: node:20
    container_name: auth_service
    networks:
      - internal
      - data
  
  # Database (data network only)
  postgres:
    image: postgres:15
    container_name: postgres_db
    networks:
      - data
    environment:
      POSTGRES_PASSWORD: secret
```

### Example 2: Development with Host Network

Useful when you need direct access to host services or performance is critical:

```yaml
version: '1.0'
metadata:
  name: host-network-dev
  description: Development setup with host networking

services:
  # Backend running on host network
  backend:
    image: node:20
    container_name: dev_backend
    network_mode: host
    working_dir: /app
    volumes:
      - ./backend:/app
    command: npm run dev
    # No port mapping needed - uses host's network
    environment:
      PORT: 3000
  
  # Database on custom network
  db:
    image: postgres:15
    container_name: dev_db
    networks:
      - db_net
    ports:
      - "5432:5432"

networks:
  db_net:
    driver: bridge
```

### Example 3: Multi-Project Shared Network

Share network between multiple RepDev projects:

**Project 1 (API):**
```yaml
version: '1.0'
metadata:
  name: api-project

networks:
  shared_services:
    name: company_shared_network
    driver: bridge

services:
  api:
    image: node:20
    networks:
      - shared_services
    ports:
      - "3000:3000"
```

**Project 2 (Frontend):**
```yaml
version: '1.0'
metadata:
  name: frontend-project

networks:
  shared_services:
    external: true
    name: company_shared_network

services:
  frontend:
    image: node:20
    networks:
      - shared_services
    ports:
      - "5173:5173"
    environment:
      API_URL: http://api:3000
```

### Example 4: Service Network Sharing

One service can share network with another:

```yaml
version: '1.0'
services:
  app:
    image: node:20
    container_name: main_app
    ports:
      - "3000:3000"
  
  # Sidecar shares network with app
  redis:
    image: redis:alpine
    container_name: redis_cache
    network_mode: "service:app"
    # No ports needed - uses app's network
```

---

## Best Practices

### 1. **Use Custom Networks for Isolation**
```yaml
# ✅ Good: Separate frontend and backend networks
networks:
  frontend:
  backend:

services:
  web:
    networks: [frontend]
  api:
    networks: [frontend, backend]
  db:
    networks: [backend]
```

### 2. **Avoid Host Mode in Production**
```yaml
# ❌ Avoid in production (security risk)
services:
  app:
    network_mode: host

# ✅ Better: Use bridge with port mapping
services:
  app:
    ports:
      - "3000:3000"
```

### 3. **Use External Networks for Shared Resources**
```yaml
# ✅ Good: Share network across projects
networks:
  monitoring:
    external: true
    name: shared_monitoring_network
```

### 4. **Set Static IPs for Critical Services**
```yaml
# ✅ Good: Database with predictable IP
networks:
  backend:
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  postgres:
    networks:
      backend:
        ipv4_address: 172.20.0.10
```

### 5. **Use Network Aliases for Service Discovery**
```yaml
# ✅ Good: Multiple aliases for service
services:
  api:
    networks:
      app_net:
        aliases:
          - api
          - backend
          - api-server
```

---

## Troubleshooting

### Issue: Services Can't Communicate

**Problem:** Services on default network can't reach each other.

**Solution:** Define a custom network and add services to it:
```yaml
networks:
  app_network:

services:
  service1:
    networks: [app_network]
  service2:
    networks: [app_network]
```

### Issue: Port Already in Use

**Problem:** Port mapping fails because host port is occupied.

**Solution:** Use host network mode or change port mapping:
```yaml
# Option 1: Different host port
services:
  app:
    ports:
      - "3001:3000"  # Changed from 3000:3000

# Option 2: Host network (no port mapping)
services:
  app:
    network_mode: host
```

### Issue: Cannot Connect to External Network

**Problem:** External network doesn't exist.

**Solution:** Create network first or check name:
```bash
# Check existing networks
docker network ls

# Create external network
docker network create my_shared_network
```

### Issue: IP Address Already in Use

**Problem:** Static IP conflicts with another container.

**Solution:** Use different subnet or remove static IP:
```yaml
networks:
  app_net:
    ipam:
      config:
        - subnet: 172.30.0.0/16  # Different subnet
```

---

## Network Configuration Reference

### Top-Level Networks Schema

```yaml
networks:
  <network_name>:
    driver: bridge|overlay|host|macvlan|none
    driver_opts:
      key: value
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
    external: true|false
    name: custom_network_name
```

### Service-Level Network Configuration

```yaml
services:
  <service_name>:
    # Option 1: Simple network mode
    network_mode: bridge|host|none|service:name|container:id
    
    # Option 2: Custom networks (array)
    networks:
      - network1
      - network2
    
    # Option 3: Advanced network config
    networks:
      network1:
        aliases:
          - alias1
          - alias2
        ipv4_address: 172.28.0.10
        ipv6_address: "2001:3984:3989::10"
```

---

## Testing Your Network Configuration

1. **Validate template:**
   ```bash
   repdev validate
   ```

2. **Start environment:**
   ```bash
   repdev up
   ```

3. **Check network connectivity:**
   ```bash
   # List networks
   docker network ls
   
   # Inspect network
   docker network inspect <network_name>
   
   # Test connectivity from container
   repdev exec <service> ping <other_service>
   repdev exec <service> curl http://<other_service>:port
   ```

4. **Monitor network traffic:**
   ```bash
   # Check service IPs
   docker inspect <container_name> | grep IPAddress
   
   # Test DNS resolution
   repdev exec <service> nslookup <other_service>
   ```

---

## Examples in Practice

All RepDev presets support network configuration. Try:

```bash
# Initialize with a preset
repdev init -p mern

# Edit repdev.yml to add custom networks
# Run and test
repdev up
repdev doctor --ports
```

For more examples, see the templates in `src/templates/presets/`.

---

## See Also

- [Docker Networking Documentation](https://docs.docker.com/network/)
- [CUSTOMIZATION.md](../CUSTOMIZATION.md) - General customization guide
- [README.md](../README.md) - Getting started
- [template.schema.json](../src/core/template.schema.json) - Full schema reference
