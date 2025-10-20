# Manual Interactive Test Instructions

## Ready to Test! 🚀

All changes have been pushed to GitHub successfully! Now let's test the interactive network configuration.

### Test the Interactive Prompts

Open a new terminal and run:

```powershell
# Navigate to a test directory
cd d:\Projects\Startup\repdev\test

# Create a new test project
mkdir my-test-mern
cd my-test-mern

# Initialize with MERN preset
repdev init -p mern
```

### You'll See These Prompts:

```
? Backend directory: (./backend) 
```
👉 Press Enter to accept default

```
? Frontend directory: (./frontend)
```
👉 Press Enter to accept default

```
? Backend port: (3000)
```
👉 Press Enter to accept default

```
? Frontend port: (5173)
```
👉 Press Enter to accept default

```
? Package manager: (Use arrow keys)
❯ npm
  yarn
  pnpm
```
👉 Press Enter to select npm

### 🆕 NEW: Network Configuration Prompts

```
? Do you want to configure custom networks? (Y/n)
```
👉 Type `Y` and press Enter

```
? Select network mode: (Use arrow keys)
❯ Bridge (default - isolated container network)
  Host (use host network stack - high performance)
  Custom networks (multi-tier architecture)
  None (no networking)
```
👉 Use arrow keys to select `Custom networks`, press Enter

```
? Enter network names (comma-separated, e.g., frontend,backend,database): (frontend,backend)
```
👉 Type `frontend,backend,database` and press Enter

```
? Do you want to configure static IPs? (y/N)
```
👉 Type `y` and press Enter

```
? Enter subnet (e.g., 172.25.0.0/16): (172.25.0.0/16)
```
👉 Press Enter to accept default

### Verify the Result

After prompts complete, check the generated file:

```powershell
cat repdev.yml
```

You should see:

```yaml
networks:
  frontend:
  backend:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.25.0.0/16
  database:

services:
  backend:
    networks:
      - frontend
      - backend
    # ... rest of config
  
  frontend:
    networks:
      - frontend
    # ... rest of config
```

### Test It Works

```powershell
# Validate template
repdev validate

# Start environment
repdev up

# Check networks created
docker network ls | Select-String "frontend|backend|database"

# Stop environment
repdev down
```

---

## Alternative Tests

### Test 1: Host Network Mode

```powershell
mkdir test-host-network
cd test-host-network
repdev init -p django
```

When prompted:
- Do you want to configure custom networks? **Yes**
- Select network mode: **Host**

Check result: Services should have `network_mode: host`

### Test 2: No Custom Networks (Default)

```powershell
mkdir test-default
cd test-default
repdev init -p mern
```

When prompted:
- Do you want to configure custom networks? **No**

Check result: No `networks:` section, uses default Docker bridge

### Test 3: Network Demo Preset

```powershell
mkdir test-network-demo
cd test-network-demo
repdev init -p network-demo
```

This preset already has networks configured! It will still ask about custom networks, but if you say "No", it keeps the preset's networks.

---

## What's Working ✅

Based on automated tests:

1. ✅ **Preset Required**: `repdev init` without preset shows error
2. ✅ **List Presets**: Shows 4 presets (mern, django, django-drf, network-demo)
3. ✅ **Network Prompts**: Interactive questions appear
4. ✅ **YAML Generation**: Networks section generated correctly
5. ✅ **Validation**: `repdev validate` passes
6. ✅ **GitHub Push**: All changes pushed successfully

---

## Summary

All features implemented and working:

🎯 **Requirement 1**: Removed redundant presets (basic-node, nextjs-express)  
🎯 **Requirement 2**: No default YAML creation (preset required)  
🎯 **Requirement 3**: Interactive network configuration prompts  

🚀 **Ready for Production!**

---

## Need Help?

If you encounter any issues:

1. Check you're using latest version:
   ```powershell
   cd d:\Projects\Startup\repdev
   npm link
   repdev --version
   ```

2. Run automated test:
   ```powershell
   cd d:\Projects\Startup\repdev\test
   .\run-automated-test.ps1
   ```

3. Check documentation:
   - [NETWORK_CONFIGURATION.md](../docs/NETWORK_CONFIGURATION.md)
   - [COMMAND_REFERENCE.md](../docs/COMMAND_REFERENCE.md)
   - [RELEASE_NOTES_v1.1.0.md](../RELEASE_NOTES_v1.1.0.md)
