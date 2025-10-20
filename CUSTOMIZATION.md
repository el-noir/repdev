# RepDev Customization Guide

## Quick Start

### 1. Interactive Init with Prompts
```powershell
repdev init -p mern
```

You'll be asked:
- Backend directory? (default: `./backend`)
- Frontend directory? (default: `./frontend`)
- Backend port? (default: `3000`)
- Frontend port? (default: `5173`)
- Package manager? (npm/yarn/pnpm)

RepDev will customize the template based on your answers!

### 2. Available Presets

```powershell
repdev init --list
```

Current presets:
- **mern** - MongoDB Atlas + Express + React (Vite)
- **django** - Django + PostgreSQL
- **django-drf** - Django REST Framework + React + PostgreSQL
- **nextjs-express** - Next.js + Express API
- **basic-node** - Simple Node.js + PostgreSQL

### 3. Manual Customization

After running `repdev init -p <preset>`, edit `repdev.yml`:

#### Change directories:
```yaml
volumes:
  - ./backend:/app  # Change to ./server:/app
```

#### Change ports:
```yaml
ports:
  - "3000:3000"  # Change to "4000:4000"
```

#### Change package manager:
```yaml
command:
  - npm install   # Change to 'yarn install' or 'pnpm install'
  - npm run dev   # Change to 'yarn dev' or 'pnpm dev'
```

#### Change environment variables:
```yaml
# Option 1: Inline environment (for non-sensitive or override values)
environment:
  PORT: 3000
  NODE_ENV: development

# Option 2: Use env_file (recommended for secrets)
env_file:
  - .env              # Single file
  - ./backend/.env    # Relative path
  
# Option 3: Multiple env files (later files override earlier)
env_file:
  - .env              # Base config
  - .env.local        # Local overrides
  - .env.production   # Environment-specific

# Priority: inline environment > env_file
# So you can set defaults in .env and override specific values inline
```

### 4. Environment File (.env) Support

RepDev supports loading environment variables from `.env` files:

#### Create a .env file:
```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=secret123

API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret

NODE_ENV=development
PORT=3000
```

#### Use in repdev.yml:
```yaml
services:
  backend:
    image: node:20
    env_file: .env  # or ./backend/.env
    environment:
      NODE_ENV: development  # Overrides .env value
```

#### .env File Format:
- Supports `KEY=value` syntax
- Handles quotes: `KEY="value"` or `KEY='value'`
- Comments with `#`
- Export statements: `export KEY=value`
- Escape sequences: `\n`, `\r`, `\t`, `\\`

**Best Practice:** 
- Keep `.env` in `.gitignore`
- Commit `.env.example` with dummy values
- Use env_file for secrets, inline environment for non-sensitive config

### 5. Network Options

Add network configuration to services:

#### Use host networking:
```yaml
services:
  api:
    network_mode: host  # Use host's network stack
```

#### Use bridge (default):
```yaml
services:
  api:
    network_mode: bridge  # Isolated container network
```

#### Connect to custom networks:
```yaml
services:
  api:
    networks:
      - my-network
      - shared-network
```

### 5. Common Customizations by Framework

#### MERN Stack
- Update `./backend` and `./frontend` paths
- Change ports: 3000 (backend), 5173 (frontend)
- Update MongoDB connection string
- Switch npm/yarn/pnpm

#### Django
- Update `./app` path
- Change port: 8000
- Update PostgreSQL credentials
- Modify requirements.txt path

#### Next.js + Express
- Update `./app` and `./api` paths
- Change ports: 3000 (Next.js), 4000 (API)
- Update API_URL environment variable

### 6. Project Structure Variations

RepDev adapts to your structure:

**Monorepo:**
```yaml
volumes:
  - ./packages/backend:/app
  - ./packages/frontend:/app
```

**Different names:**
```yaml
volumes:
  - ./server:/app
  - ./client:/app
```

**Nested structure:**
```yaml
volumes:
  - ./apps/api:/app
  - ./apps/web:/app
```

### 7. Tips

- **Use `--no-wait`** first time (dependencies need to install)
- **Add inline comments** to remember customizations
- **Use `repdev validate`** to check syntax after editing
- **Keep sensitive data in .env** (don't commit MONGO_URI, etc.)
- **Use `repdev down --force`** to clean up and restart fresh

### 8. Example Workflow

```powershell
# Navigate to your project
cd my-mern-project

# Init with customization
repdev init -p mern
? Backend directory: ./server
? Frontend directory: ./client
? Backend port: 4000
? Frontend port: 3000
? Package manager: pnpm

# Review and edit repdev.yml if needed
code repdev.yml

# Start environment
repdev up --no-wait

# Wait 30-60 seconds for deps to install
# Check logs:
docker logs mern_backend
docker logs mern_frontend

# Visit your app
# Backend: http://localhost:4000
# Frontend: http://localhost:3000
```

### 9. Network Mode Examples

**When to use `host` mode:**
- Need to access localhost services from container
- Debugging with external tools
- Performance-critical applications

```yaml
services:
  api:
    network_mode: host
    # Note: port mappings ignored in host mode
```

**When to use `bridge` mode (default):**
- Standard isolation between containers
- Port mapping needed
- Multiple services on same ports

```yaml
services:
  api:
    network_mode: bridge
    ports:
      - "3000:3000"
```

### 10. Next Steps

For more advanced scenarios:
- Variable interpolation (coming in Phase 2)
- Environment profiles (dev/test/prod)
- Template composition and inheritance
- Auto-detection of project structure

## Need Help?

- Run `repdev init --list` to see all presets
- Check preset files for inline documentation
- Use `repdev validate` to check your template
- Use `--dry-run` to preview actions
