# Network Configuration Quick Start

## Using the Network Demo Preset

```bash
# Initialize a new project with network demo
repdev init -p network-demo

# Start the environment
repdev up

# Check status
repdev status

# View logs
repdev logs nginx
repdev logs api

# Test connectivity between services
repdev exec api ping worker
repdev exec api curl http://nginx

# Stop everything
repdev down
```

## Quick Examples

### Example 1: Host Network (High Performance)

```yaml
version: '1.0'
services:
  api:
    image: node:20
    network_mode: host  # Uses host's network
    environment:
      PORT: 3000
    # No port mapping needed!
```

### Example 2: Multi-Tier with Isolation

```yaml
version: '1.0'

networks:
  frontend:    # Public tier
  backend:     # Application tier
  database:    # Data tier (most isolated)

services:
  nginx:
    image: nginx:alpine
    networks: [frontend]
    ports: ["80:80"]
  
  api:
    image: node:20
    networks: [frontend, backend]  # Bridge between tiers
  
  postgres:
    image: postgres:15
    networks: [database]  # Only backend can reach it
```

### Example 3: Static IP for Database

```yaml
version: '1.0'

networks:
  app_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
          gateway: 172.25.0.1

services:
  db:
    image: postgres:15
    networks:
      app_net:
        ipv4_address: 172.25.0.10  # Fixed IP
        aliases:
          - database
          - postgres-server
```

### Example 4: Service Network Sharing (Sidecar)

```yaml
version: '1.0'
services:
  app:
    image: node:20
    container_name: main_app
    ports: ["3000:3000"]
  
  monitor:
    image: alpine:latest
    network_mode: "service:app"  # Shares app's network
    # Can access localhost:3000 directly
```

## Testing Your Network Config

1. **Validate template:**
   ```bash
   repdev validate
   ```

2. **Check network connectivity:**
   ```bash
   # Start environment
   repdev up
   
   # Test DNS resolution
   repdev exec api ping postgres
   
   # Test HTTP connectivity
   repdev exec api curl http://backend:3000
   
   # Check network details
   docker network inspect repdev_frontend
   ```

3. **View network IPs:**
   ```bash
   docker inspect <container_name> | grep IPAddress
   ```

## Common Use Cases

### Development Environment
```yaml
# Use host network for hot reload and debugging
services:
  frontend:
    network_mode: host
```

### Microservices
```yaml
# Separate networks for security
networks:
  public:
  internal:
  data:
```

### Shared Network Between Projects
```yaml
# Project 1 creates network
networks:
  company_network:
    name: my_company_network

# Project 2 uses existing network
networks:
  company_network:
    external: true
    name: my_company_network
```

## Full Documentation

See `docs/NETWORK_CONFIGURATION.md` for:
- Complete network mode reference
- IPAM configuration
- Best practices
- Troubleshooting guide
- Advanced examples
