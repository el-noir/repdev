# RepDev Testing Guide

This guide walks you through testing RepDev on real projects.

---

## 🎯 Testing Strategy

Test RepDev on:
1. **Existing MERN project** (ai-ticket-system) - Already has repdev.yml
2. **New project with preset** - Test init and up from scratch
3. **Edge cases** - Test error handling, port conflicts, etc.

---

## 📋 Test Checklist

### ✅ Pre-Testing Setup

- [x] RepDev installed globally: `npm link` in repdev directory
- [x] Docker Desktop running: `docker ps`
- [ ] No port conflicts: `repdev doctor --ports`

---

## 🧪 Test 1: Existing MERN Project (ai-ticket-system)

### Location
```bash
cd D:\Projects\Web\ai-ticket-system
```

### Test Steps

#### 1.1 Validate Template
```bash
repdev validate
```
**Expected:** ✅ Template is valid

#### 1.2 Check Status (Before Up)
```bash
repdev status
```
**Expected:** Shows no containers or existing state

#### 1.3 Run Health Check
```bash
repdev doctor
repdev doctor --ports
```
**Expected:** 
- ✅ Node.js OK
- ✅ Docker OK
- ⚠️ Port 3000 may be in use (if backend running)
- Shows all system checks

#### 1.4 Start Environment
```bash
repdev up
```
**Expected:**
- ✅ Loads template
- ✅ Runs preUp hooks
- ✅ Pulls images (if needed)
- ✅ Creates containers
- ✅ Runs beforeStart hooks (npm install)
- ✅ Starts containers
- ✅ Waits for readiness (if configured)
- ✅ Runs afterStart hooks
- ✅ Runs postUp hooks
- ✅ Shows success message with URLs

#### 1.5 Check Status (After Up)
```bash
repdev status
```
**Expected:**
- Shows 2 containers (backend, frontend)
- Both marked as running 🟢
- Shows ports, images, timestamps
- Template path displayed

#### 1.6 View Logs
```bash
# View backend logs
repdev logs backend

# Follow frontend logs
repdev logs frontend -f

# Last 50 lines
repdev logs backend --tail 50
```
**Expected:**
- Logs stream correctly
- -f flag follows in real-time
- --tail limits output
- Can exit with Ctrl+C

#### 1.7 Execute Commands
```bash
# Interactive shell
repdev exec backend bash

# In the shell, test:
ls
npm list
exit

# One-off command
repdev exec backend npm --version
repdev exec backend node --version
```
**Expected:**
- Interactive shell works
- Commands execute in container
- Can navigate and run commands
- Exit works cleanly

#### 1.8 Restart Services
```bash
# Restart backend
repdev restart backend

# Restart all
repdev restart --all
```
**Expected:**
- Container stops and starts
- Logs show restart
- Service comes back up
- --all restarts everything

#### 1.9 Stop Environment
```bash
repdev down
```
**Expected:**
- ✅ Runs preDown hooks
- ✅ Stops containers
- ✅ Removes containers
- ✅ Runs postDown hooks
- ✅ Success message

#### 1.10 Check Status (After Down)
```bash
repdev status
```
**Expected:**
- Shows containers as stopped ⚪
- Shows last up/down timestamps

---

## 🆕 Test 2: New Project with Preset

### 2.1 Create Test Directory
```bash
cd D:\Projects\
mkdir test-repdev-django
cd test-repdev-django
```

### 2.2 Initialize with Preset
```bash
repdev init -p django
```
**Expected:**
- Shows customization prompts (if implemented)
- Creates repdev.yml
- Shows success message
- File exists and is valid

### 2.3 Validate
```bash
repdev validate
```
**Expected:** ✅ Template is valid

### 2.4 Start Environment
```bash
repdev up
```
**Expected:**
- Pulls Django and PostgreSQL images
- Starts both containers
- Runs migrations (if in hooks)
- Shows URLs

### 2.5 Test Commands
```bash
repdev status
repdev logs app
repdev exec app python manage.py --version
repdev exec db psql --version
```

### 2.6 Cleanup
```bash
repdev down
cd ..
rm -r test-repdev-django
```

---

## 🆕 Test 3: New Project with Interactive Selection

### 3.1 Create Test Directory
```bash
cd D:\Projects\
mkdir test-repdev-interactive
cd test-repdev-interactive
```

### 3.2 Run Up Without Template
```bash
repdev up
```
**Expected:**
- Shows interactive preset menu
- Can navigate with arrow keys
- Select a preset (e.g., basic-node)
- Creates repdev.yml automatically
- Starts environment

### 3.3 Cleanup
```bash
repdev down
cd ..
rm -r test-repdev-interactive
```

---

## ⚠️ Test 4: Error Handling

### 4.1 Test Docker Not Running
```bash
# Stop Docker Desktop
# Then run:
repdev up
```
**Expected:**
- ❌ Error: Cannot connect to Docker daemon
- 💡 Suggestions displayed:
  - Start Docker Desktop
  - Check Docker is running
  - Set DOCKER_HOST

### 4.2 Test Port Conflict
```bash
cd D:\Projects\Web\ai-ticket-system

# Start backend manually
repdev up

# Try to start again without --force
repdev up
```
**Expected:**
- ⚠️ Warning: Port conflicts detected
- Shows which ports are in use
- Suggests --force flag

### 4.3 Test with --force
```bash
repdev up --force
```
**Expected:**
- Removes existing containers
- Creates new ones
- Starts successfully

### 4.4 Test Invalid Template
```bash
# Create invalid YAML
echo "invalid: yaml: structure:" > bad-template.yml

repdev validate -t bad-template.yml
```
**Expected:**
- ❌ Validation error
- Shows what's wrong
- Suggests fixes

### 4.5 Test Missing Template
```bash
cd D:\Projects\
mkdir empty-test
cd empty-test

repdev up -t nonexistent.yml
```
**Expected:**
- ❌ Error: Template not found
- 💡 Suggestions:
  - Run repdev init
  - Check file path
  - Use -p for preset

### 4.6 Test Container Name Conflict
```bash
cd D:\Projects\Web\ai-ticket-system

repdev up
# Then manually create conflicting container
docker run -d --name mern_backend alpine sleep 1000

# Try to start
repdev up
```
**Expected:**
- ⚠️ Warning: Container name already in use
- 💡 Suggest --force flag

---

## 🔧 Test 5: Advanced Features

### 5.1 Test env_file
```bash
cd D:\Projects\Web\ai-ticket-system

# Create .env file
echo "TEST_VAR=hello" > backend/.env

# Update repdev.yml to use env_file
# Then:
repdev up
repdev exec backend bash
# In container:
echo $TEST_VAR
# Should output: hello
```

### 5.2 Test Hooks
```bash
# Check that hooks run
repdev up
# Watch for hook messages:
# - "🚀 Starting environment..." (preUp)
# - "Installing dependencies..." (beforeStart)
# - "✅ Environment ready!" (postUp)

repdev down
# Watch for:
# - "🧹 Cleaning up..." (preDown)
# - "✅ Cleanup complete" (postDown)
```

### 5.3 Test Readiness Checks
```bash
# With wait_for configured:
repdev up

# Should wait for:
# - HTTP endpoint to respond
# - TCP port to be available
# - Container to be healthy

# Test --no-wait flag:
repdev up --no-wait
# Should skip waiting
```

### 5.4 Test State Tracking
```bash
repdev up

# Check state file
cat .repdev/state.json
# Should show:
# - Running containers
# - Timestamps
# - Template path

repdev status
# Should match state.json

repdev down

# Check state again
cat .repdev/state.json
# Should show stopped status
```

---

## 📊 Test 6: All Commands

### Command Matrix

| Command | Test | Expected Result |
|---------|------|-----------------|
| `repdev --version` | Show version | `1.0.0` |
| `repdev --help` | Show help | Lists all commands |
| `repdev init` | Create template | Creates repdev.yml |
| `repdev init -p mern` | Use preset | Creates MERN template |
| `repdev init --list` | List presets | Shows 5 presets |
| `repdev up` | Start environment | Starts containers |
| `repdev up --force` | Force recreate | Removes and recreates |
| `repdev up --no-wait` | Skip readiness | Starts without waiting |
| `repdev up -s backend` | Start specific | Starts only backend |
| `repdev down` | Stop environment | Stops all containers |
| `repdev down -s backend` | Stop specific | Stops only backend |
| `repdev status` | Show status | Lists containers |
| `repdev validate` | Validate template | Checks schema |
| `repdev logs backend` | View logs | Shows logs |
| `repdev logs backend -f` | Follow logs | Streams logs |
| `repdev exec backend bash` | Interactive shell | Opens shell |
| `repdev restart backend` | Restart service | Restarts container |
| `repdev restart --all` | Restart all | Restarts everything |
| `repdev doctor` | Health check | Shows system status |
| `repdev doctor --ports` | Port check | Shows port availability |

---

## 🎯 Success Criteria

### Must Pass ✅
- [ ] All 9 commands work without errors
- [ ] Can start/stop environments
- [ ] Logs stream correctly
- [ ] Exec provides interactive shell
- [ ] Status shows accurate information
- [ ] Doctor diagnoses issues
- [ ] Error messages are helpful
- [ ] State tracking works

### Nice to Have ✅
- [ ] Hooks execute in correct order
- [ ] Readiness checks wait properly
- [ ] env_file loads variables
- [ ] Port conflicts detected
- [ ] Network modes work
- [ ] Interactive prompts function

---

## 🐛 Bug Tracking

If you find issues, document them:

### Issue Template
```markdown
**Command:** `repdev <command>`
**Environment:** Windows/macOS/Linux
**Docker Version:** `docker --version`
**Node Version:** `node --version`

**Steps to Reproduce:**
1. ...
2. ...

**Expected:**
...

**Actual:**
...

**Error Message:**
```
...
```

**Logs:**
...
```

---

## 📝 Testing Script

Quick test all commands:

```powershell
# Quick smoke test
cd D:\Projects\Web\ai-ticket-system

Write-Host "Testing RepDev Commands..." -ForegroundColor Cyan

# 1. Version
Write-Host "`n1. Version Check" -ForegroundColor Yellow
repdev --version

# 2. Doctor
Write-Host "`n2. Health Check" -ForegroundColor Yellow
repdev doctor

# 3. Validate
Write-Host "`n3. Validate Template" -ForegroundColor Yellow
repdev validate

# 4. Up
Write-Host "`n4. Starting Environment" -ForegroundColor Yellow
repdev up

# 5. Status
Write-Host "`n5. Check Status" -ForegroundColor Yellow
repdev status

# 6. Logs (10 lines)
Write-Host "`n6. View Logs" -ForegroundColor Yellow
repdev logs backend --tail 10

# 7. Exec
Write-Host "`n7. Execute Command" -ForegroundColor Yellow
repdev exec backend node --version

# 8. Restart
Write-Host "`n8. Restart Service" -ForegroundColor Yellow
repdev restart backend

# 9. Down
Write-Host "`n9. Stop Environment" -ForegroundColor Yellow
repdev down

Write-Host "`nAll tests complete!" -ForegroundColor Green
```

---

## 🚀 Next Steps After Testing

1. **Document Issues** - Create GitHub issues for bugs
2. **Fix Critical Bugs** - Resolve blockers
3. **Test on Other OS** - macOS and Linux
4. **Performance Test** - Large projects
5. **User Testing** - Get feedback from others

---

## 📞 Getting Help

If something doesn't work:

1. Run `repdev doctor` to diagnose
2. Check logs: `repdev logs <service>`
3. Enable debug: `DEBUG=1 repdev up`
4. Check state: `cat .repdev/state.json`
5. Check Docker: `docker ps -a`

---

Happy Testing! 🎉
