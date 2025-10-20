# RepDev Command Reference - Common Mistakes

## ❌ Common Mistake: Using -p flag with `repdev up`

### Wrong:
```bash
repdev up -p mern  # ❌ This doesn't work!
```

### Correct:
```bash
# Step 1: Initialize with preset (one time only)
repdev init -p mern

# Step 2: Start environment (uses existing repdev.yml)
repdev up
```

## 📋 Command Flags Reference

### `repdev init` - Initialize template
- `-p, --preset <name>` - Use a preset template
- `-f, --force` - Overwrite existing repdev.yml
- `--list` - List available presets

```bash
# List presets
repdev init --list

# Initialize with preset
repdev init -p mern

# Force overwrite
repdev init -p django --force
```

### `repdev up` - Start environment
- `-f, --force` - Force recreate containers
- No preset flag! Uses existing repdev.yml

```bash
# Normal start
repdev up

# Force recreate (if port conflicts)
repdev up --force
```

### `repdev down` - Stop environment
- No flags needed

```bash
repdev down
```

### `repdev status` - Check status
- No flags needed

```bash
repdev status
```

### `repdev logs` - View logs
- `-f, --follow` - Follow log output
- `<service>` - Service name (optional)

```bash
# All logs
repdev logs

# Specific service
repdev logs backend

# Follow logs
repdev logs backend -f
```

### `repdev exec` - Execute command
- `<service>` - Service name (required)
- `<command>` - Command to run (required)

```bash
# Execute command
repdev exec backend npm install
repdev exec backend node --version
repdev exec frontend ls -la
```

### `repdev validate` - Validate template
- No flags needed

```bash
repdev validate
```

### `repdev doctor` - System health check
- `--ports` - Check ports only

```bash
# Full check
repdev doctor

# Ports only
repdev doctor --ports
```

### `repdev restart` - Restart containers
- `<service>` - Service name (optional, restarts all if omitted)

```bash
# Restart all
repdev restart

# Restart specific service
repdev restart backend
```

## 🔄 Typical Workflow

### First Time Setup
```bash
# 1. Initialize project
cd my-project
repdev init -p mern

# 2. Edit repdev.yml if needed
# (customize ports, directories, etc.)

# 3. Start environment
repdev up
```

### Daily Usage
```bash
# Start
repdev up

# Check status
repdev status

# View logs
repdev logs backend -f

# Execute commands
repdev exec backend npm install
repdev exec backend npm run dev

# Stop
repdev down
```

### Troubleshooting
```bash
# Port conflicts?
repdev down
repdev up

# Or force recreate
repdev up --force

# Check system health
repdev doctor

# Validate template
repdev validate
```

## 🚨 Common Issues

### Issue 1: Port Conflicts
```
⚠️  Port conflicts detected:
   Port 5173 already in use by mern_frontend
```

**Solution:**
```bash
repdev down
repdev up
```

### Issue 2: Can't Use Preset with `up`
```
repdev up -p mern  # ❌ Wrong!
```

**Solution:**
```bash
# Presets are for init only
repdev init -p mern  # Initialize first
repdev up           # Then start
```

### Issue 3: Want to Switch Presets
```bash
# Option 1: Use --force
repdev init -p django --force

# Option 2: Manual
rm repdev.yml
repdev init -p django
```

## 📚 Available Presets

```bash
repdev init --list
```

Current presets:
- `mern` - MongoDB + Express + React + Node.js
- `django` - Django + PostgreSQL
- `django-drf` - Django REST Framework + React + PostgreSQL
- `nextjs-express` - Next.js + Express API
- `basic-node` - Node.js + PostgreSQL
- `network-demo` - Multi-tier network architecture

## 🎯 Quick Commands

| What I Want | Command |
|-------------|---------|
| List presets | `repdev init --list` |
| Create new project | `repdev init -p mern` |
| Start environment | `repdev up` |
| Stop environment | `repdev down` |
| Check status | `repdev status` |
| View logs | `repdev logs backend -f` |
| Run command | `repdev exec backend npm install` |
| Restart service | `repdev restart backend` |
| Check health | `repdev doctor` |
| Validate template | `repdev validate` |
| Force recreate | `repdev up --force` |
