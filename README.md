# RepDev 🚀

> **Reproducible Development Environments Made Simple**

A lightweight CLI tool that makes setting up development environments as easy as running a single command. No more "it works on my machine" - RepDev ensures consistent environments across your entire team using Docker containers with intelligent orchestration.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Required-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ Features

- 🎯 **One Command Setup** - `repdev up` starts your entire stack
- 📦 **Pre-built Presets** - MERN, Django, Next.js, and more
- 🎨 **Interactive CLI** - Guided setup with smart prompts
- 🔄 **Lifecycle Hooks** - Run scripts before/after container events
- ⏱️ **Readiness Checks** - Wait for services to be truly ready
- 🔐 **Environment Files** - Secure `.env` file support
- 🌐 **Network Control** - Host, bridge, and custom networks
- 🛠️ **DX Commands** - logs, exec, restart without leaving RepDev
- 🏥 **Health Checks** - `repdev doctor` diagnoses issues
- 📊 **State Tracking** - Know what's running and when

---

## 🚀 Quick Start

### Installation

```bash
npm install -g repdev
```

### Create Your First Project

```bash
# Initialize with interactive prompts
repdev init

# Or use a preset
repdev init -p mern

# Start your environment
repdev up

# Check status
repdev status

# View logs
repdev logs backend -f

# Stop everything
repdev down
```

---

## 📋 Table of Contents

- [Why RepDev?](#-why-repdev)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Available Presets](#-available-presets)
- [CLI Commands](#-cli-commands)
- [Template Structure](#-template-structure)
- [Advanced Features](#-advanced-features)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why RepDev?

### The Problem

Setting up development environments is painful:
- ❌ Complex Docker Compose files
- ❌ Manual dependency installation
- ❌ Different environments across team members
- ❌ "Works on my machine" syndrome
- ❌ No standardized onboarding process

### The Solution

RepDev provides:
- ✅ Simple YAML templates
- ✅ Interactive setup wizards
- ✅ Consistent environments everywhere
- ✅ Automated health checks
- ✅ New developers productive in minutes

### Comparison

| Feature | Docker Compose | RepDev |
|---------|---------------|--------|
| **Syntax** | Verbose YAML | Simple YAML |
| **Setup** | Manual | Interactive prompts |
| **Hooks** | Limited | Full lifecycle |
| **Readiness** | Depends on | Built-in wait_for |
| **Presets** | None | MERN, Django, etc. |
| **Port Checks** | No | Automatic |
| **Error Help** | Generic | Actionable suggestions |
| **State Tracking** | No | Yes |

---

## 📥 Installation

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))

### Install RepDev

```bash
# Global installation
npm install -g repdev

# Verify installation
repdev --version

# Check system health
repdev doctor
```

---

## 🎯 Available Presets

RepDev comes with battle-tested presets for popular stacks:

### 🟢 **MERN Stack**
```bash
repdev init -p mern
```
- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Features**: Hot reload, auto-install deps

### 🐍 **Django**
```bash
repdev init -p django
```
- **Framework**: Django
- **Database**: PostgreSQL
- **Features**: Auto migrations, static files

### ⚡ **Next.js + Express**
```bash
repdev init -p nextjs-express
```
- **Frontend**: Next.js
- **API**: Express backend
- **Features**: SSR, API routes

### 🔥 **Django REST + React**
```bash
repdev init -p django-drf
```
- **Backend**: Django REST Framework
- **Frontend**: React
- **Database**: PostgreSQL

### 🔵 **Basic Node.js**
```bash
repdev init -p basic-node
```
- **Runtime**: Node.js + PostgreSQL
- **Purpose**: Minimal starting point
- **Docs**: Heavily commented template

---

## 🖥️ CLI Commands

### Core Commands

#### `repdev init`
Create a new `repdev.yml` template.

```bash
# Interactive mode
repdev init

# Use a preset
repdev init -p mern

# List available presets
repdev init --list

# Force overwrite existing file
repdev init -p django --force
```

#### `repdev up`
Start your development environment.

```bash
# Start all services
repdev up

# Use specific template
repdev up -t custom-template.yml

# Use preset
repdev up -p mern

# Force recreate containers
repdev up --force

# Skip readiness checks
repdev up --no-wait

# Start specific services
repdev up -s backend,db
```

#### `repdev down`
Stop and remove containers.

```bash
# Stop all services
repdev down

# Stop specific services
repdev down -s frontend

# Force removal
repdev down --force
```

#### `repdev status`
Check environment status.

```bash
repdev status
```

**Output:**
```
📊 RepDev Status

Template: /path/to/repdev.yml
Preset: mern

Containers: 2 total, 2 running, 0 stopped
Last Up: 10/20/2025, 2:30:15 PM

📦 Containers:

🟢 backend (mern_backend)
   Image: node:20
   Status: running
   Ports: 3000:3000

🟢 frontend (mern_frontend)
   Image: node:20
   Status: running
   Ports: 5173:5173
```

### DX Commands

#### `repdev logs <service>`
View container logs.

```bash
# View logs
repdev logs backend

# Follow logs (like tail -f)
repdev logs backend -f

# Show last 50 lines
repdev logs backend --tail 50
```

#### `repdev exec <service> [command...]`
Execute commands in containers.

```bash
# Interactive shell
repdev exec backend bash

# Run a command
repdev exec backend npm run test

# Database access
repdev exec db psql -U postgres mydb
```

#### `repdev restart [service]`
Restart containers.

```bash
# Restart a service
repdev restart backend

# Restart all services
repdev restart --all
```

### Utility Commands

#### `repdev validate`
Validate template syntax.

```bash
# Validate local repdev.yml
repdev validate

# Validate specific file
repdev validate -t custom.yml

# Validate preset
repdev validate -p mern
```

#### `repdev doctor`
Run system health checks.

```bash
# Basic health check
repdev doctor

# Include port availability
repdev doctor --ports
```

**Output:**
```
🏥 RepDev System Health Check

🟢 Node.js
   Status: ✅ OK
   Version: v20.10.0

🐳 Docker
   Status: ✅ OK
   Version: 24.0.6

📄 Template (repdev.yml)
   Status: ✅ OK

💾 Disk Space
   Status: ✅ OK

📦 RepDev Containers
   Status: ✅ OK
   Total: 2 (2 running, 0 stopped)

✨ All systems operational!
```

---

## 📝 Template Structure

### Basic Template

```yaml
version: '1.0'

metadata:
  name: my-app
  description: My awesome application
  author: Your Name

services:
  app:
    image: node:20-alpine
    container_name: my_app
    working_dir: /app
    volumes:
      - ./app:/app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
    command:
      - sh
      - -c
      - |
        npm install
        npm run dev
```

### Advanced Template

```yaml
version: '1.0'

metadata:
  name: advanced-app

hooks:
  preUp:
    - echo "🚀 Starting environment..."
  postUp:
    - echo "✅ Environment ready!"
    - 'echo "🌐 Visit: http://localhost:3000"'
  preDown:
    - echo "🧹 Cleaning up..."
  postDown:
    - echo "✅ Cleanup complete"

services:
  backend:
    image: node:20
    container_name: app_backend
    working_dir: /app
    volumes:
      - ./backend:/app
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    environment:
      NODE_ENV: development
    hooks:
      beforeStart:
        - echo "Installing backend dependencies..."
      afterStart:
        - echo "Backend started!"
    wait_for:
      type: http
      url: http://localhost:3000/health
      timeout: 60000
      retries: 30
      interval: 2000
    command:
      - sh
      - -c
      - |
        npm install
        npm run dev
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: app_db
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: devdb
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    wait_for:
      type: tcp
      host: localhost
      port: 5432
```

---

## 🔧 Advanced Features

### Lifecycle Hooks

Execute scripts at specific points in the container lifecycle:

```yaml
hooks:
  preUp: ["echo Starting..."]
  postUp: ["echo Ready!"]
  preDown: ["echo Stopping..."]
  postDown: ["echo Stopped"]

services:
  app:
    hooks:
      beforeStart: ["npm install"]
      afterStart: ["npm run migrate"]
```

### Readiness Checks

Wait for services to be truly ready:

```yaml
services:
  api:
    wait_for:
      type: http
      url: http://localhost:3000/health
      timeout: 60000
      retries: 30
      interval: 2000

  db:
    wait_for:
      type: tcp
      host: localhost
      port: 5432

  container:
    wait_for:
      type: container_healthy
```

### Environment Files

Keep secrets out of version control:

```yaml
services:
  app:
    env_file:
      - .env              # Base config
      - .env.local        # Local overrides
    environment:
      NODE_ENV: development  # Overrides .env
```

**Priority**: inline `environment` > `env_file`

### Network Configuration

```yaml
services:
  app:
    network_mode: host  # Use host networking
    # OR
    network_mode: bridge  # Isolated (default)
    # OR
    networks:
      - my-network
      - shared-network
```

---

## 🎨 Customization

See [CUSTOMIZATION.md](CUSTOMIZATION.md) for detailed customization guide.

### Quick Tips

**Change directories:**
```yaml
volumes:
  - ./backend:/app  # Change to ./server:/app
```

**Change ports:**
```yaml
ports:
  - "3000:3000"  # Change to "4000:4000"
```

**Change package manager:**
```yaml
command:
  - npm install   # Change to 'yarn install' or 'pnpm install'
```

**Use environment files:**
```yaml
env_file:
  - .env
```

---

## 🐛 Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solutions:**
1. Start Docker Desktop
2. Check if Docker daemon is running: `docker ps`
3. On Linux: `sudo systemctl start docker`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**
1. Find the process: `netstat -ano | findstr :<port>` (Windows)
2. Stop conflicting containers: `repdev down`
3. Change the port in `repdev.yml`
4. Kill the process or use a different port

### Container Name Conflict

**Error:** `container name already in use`

**Solutions:**
1. Use `--force` flag: `repdev up --force`
2. Stop existing containers: `repdev down`
3. Remove conflicting container: `docker rm -f <name>`

### Image Not Found

**Error:** `pull access denied` or `not found`

**Solutions:**
1. Check image name spelling in `repdev.yml`
2. Verify image exists on Docker Hub
3. Try pulling manually: `docker pull <image>`
4. Login if needed: `docker login`

### Template Not Found

**Error:** `no such file or directory: repdev.yml`

**Solutions:**
1. Run `repdev init` to create a template
2. Use `-t` flag: `repdev up -t /path/to/template.yml`
3. Use a preset: `repdev up -p mern`

### Permission Denied

**Error:** `permission denied`

**Solutions:**
1. On Linux: `sudo usermod -aG docker $USER`
2. On Windows: Run as Administrator
3. Check file/directory permissions

---

## 🏥 Health Checks

Run diagnostic checks:

```bash
repdev doctor
```

This checks:
- ✅ Node.js version
- ✅ Docker connectivity
- ✅ Template validity
- ✅ Disk space
- ✅ Container status

With port check:

```bash
repdev doctor --ports
```

---

## 🏗️ Architecture

```
repdev/
├── src/
│   ├── cli/
│   │   └── commands/      # CLI command implementations
│   ├── core/
│   │   ├── dockerManager.js    # Docker orchestration
│   │   ├── TemplateManager.js  # Template loading
│   │   ├── HooksRunner.js      # Lifecycle hooks
│   │   └── logger.js           # Logging
│   ├── utils/
│   │   ├── envFileLoader.js    # .env file parsing
│   │   ├── errorHandler.js     # Error handling
│   │   └── stateManager.js     # State tracking
│   └── templates/
│       └── presets/       # Pre-built templates
└── docs/                  # Documentation
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Clone the repo
git clone https://github.com/el-noir/repdev.git
cd repdev

# Install dependencies
npm install

# Test locally
node src/index.js --help

# Run tests
npm test
```

---

## 📜 License

MIT © [el-noir](https://github.com/el-noir)

---

## 🙏 Acknowledgments

Built with:
- [Docker](https://www.docker.com/) - Container platform
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) - Interactive prompts
- [Dockerode](https://github.com/apocas/dockerode) - Docker API client

---

## 📚 Resources

- **Documentation**: [Full Docs](https://github.com/el-noir/repdev/wiki)
- **Customization Guide**: [CUSTOMIZATION.md](CUSTOMIZATION.md)
- **Issue Tracker**: [GitHub Issues](https://github.com/el-noir/repdev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/el-noir/repdev/discussions)

---

## ⭐ Star History

If RepDev helped you, please give it a ⭐ on [GitHub](https://github.com/el-noir/repdev)!

---

<div align="center">

**Made with ❤️ by developers, for developers**

[Report Bug](https://github.com/el-noir/repdev/issues) · [Request Feature](https://github.com/el-noir/repdev/issues) · [Documentation](https://github.com/el-noir/repdev/wiki)

</div>
