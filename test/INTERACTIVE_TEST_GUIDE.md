# Interactive Network Configuration Test

## Test Scenario 1: MERN Stack with Custom Networks

```bash
cd d:\Projects\Startup\repdev\test\test-network-project
repdev init -p mern
```

### Expected Prompts:

1. **Backend directory:** `./backend` ← (press Enter)
2. **Frontend directory:** `./frontend` ← (press Enter)
3. **Backend port:** `3000` ← (press Enter)
4. **Frontend port:** `5173` ← (press Enter)
5. **Package manager:** `npm` ← (select with arrow keys)
6. **Do you want to configure custom networks?** `Y` ← (Yes)
7. **Select network mode:**
   - Bridge (default - isolated container network)
   - Host (use host network stack - high performance)
   - **Custom networks (multi-tier architecture)** ← (select this)
   - None (no networking)
8. **Enter network names:** `frontend,backend,database` ← (type this)
9. **Do you want to configure static IPs?** `Y` ← (Yes)
10. **Enter subnet:** `172.25.0.0/16` ← (press Enter)

### Expected Result:

The generated `repdev.yml` should have:

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

---

## Test Scenario 2: Django with Host Network

```bash
cd d:\Projects\Startup\repdev\test
mkdir test-django-host
cd test-django-host
repdev init -p django
```

### Prompts:
1. **Django app directory:** `./app` ← (press Enter)
2. **Django port:** `8000` ← (press Enter)
3. **Postgres port:** `5432` ← (press Enter)
4. **Do you want to configure custom networks?** `Y` ← (Yes)
5. **Select network mode:** **Host** ← (select this)

### Expected Result:

```yaml
services:
  web:
    network_mode: host
    # Ports commented out (not needed with host mode)
  
  db:
    network_mode: host
    # ... rest of config
```

---

## Test Scenario 3: No Custom Networks (Default)

```bash
cd d:\Projects\Startup\repdev\test
mkdir test-default
cd test-default
repdev init -p mern
```

### Prompts:
1. **Backend directory:** `./backend` ← (press Enter)
2. **Frontend directory:** `./frontend` ← (press Enter)
3. **Backend port:** `3000` ← (press Enter)
4. **Frontend port:** `5173` ← (press Enter)
5. **Package manager:** `npm` ← (press Enter)
6. **Do you want to configure custom networks?** `N` ← (No)

### Expected Result:

```yaml
# No networks section
services:
  backend:
    # No network configuration (uses default bridge)
    # ... rest of config
  
  frontend:
    # No network configuration (uses default bridge)
    # ... rest of config
```

---

## Manual Testing Instructions

### Step 1: Test Init Without Preset
```powershell
cd d:\Projects\Startup\repdev\test
mkdir test-no-preset
cd test-no-preset
repdev init
```

**Expected:** Error message saying preset is required ✅

### Step 2: List Presets
```powershell
repdev init --list
```

**Expected:** Shows 4 presets (mern, django, django-drf, network-demo) ✅

### Step 3: Test MERN with Custom Networks
```powershell
cd d:\Projects\Startup\repdev\test
mkdir test-mern-custom
cd test-mern-custom
repdev init -p mern
```

**Follow prompts above for Scenario 1**

### Step 4: Verify Generated YAML
```powershell
cat repdev.yml
```

**Check for:**
- ✅ Networks section at top
- ✅ Services have `networks:` property
- ✅ Subnet configuration if specified

### Step 5: Validate Template
```powershell
repdev validate
```

**Expected:** Template is valid ✅

### Step 6: Test Starting Environment
```powershell
repdev up
```

**Expected:** Containers start with custom networks ✅

### Step 7: Verify Networks Created
```powershell
docker network ls | Select-String "frontend|backend|database"
```

**Expected:** See custom networks created ✅

---

## Quick Test Script

Run this to test all scenarios automatically:

```powershell
# Navigate to test directory
cd d:\Projects\Startup\repdev\test

# Clean up
Get-ChildItem -Directory -Filter "test-*" | Remove-Item -Recurse -Force

# Test 1: No preset (should fail)
Write-Host "`n=== Test 1: Init without preset ===" -ForegroundColor Cyan
mkdir test-no-preset | Out-Null
cd test-no-preset
repdev init
cd ..

# Test 2: List presets
Write-Host "`n=== Test 2: List presets ===" -ForegroundColor Cyan
repdev init --list

# Test 3: Network demo preset
Write-Host "`n=== Test 3: Network demo preset ===" -ForegroundColor Cyan
mkdir test-network-demo | Out-Null
cd test-network-demo
# This preset already has networks configured
# No custom prompts, just verify it works
cd ..

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
Write-Host "Manual test: Run 'repdev init -p mern' in a new directory" -ForegroundColor Yellow
```

---

## Verification Checklist

After running `repdev init -p mern` with custom networks:

- [ ] Prompts appeared in correct order
- [ ] Network configuration prompts showed up
- [ ] Generated `repdev.yml` exists
- [ ] `networks:` section at top of YAML
- [ ] Services have `networks:` property
- [ ] `repdev validate` passes
- [ ] `repdev up` creates networks successfully
- [ ] `docker network ls` shows custom networks
- [ ] Containers can communicate across networks

---

## Common Issues

### Issue: Prompts not showing
**Solution:** Make sure you're using the latest version:
```bash
cd d:\Projects\Startup\repdev
npm link
repdev --version  # Should show 1.0.0
```

### Issue: Network not applied
**Solution:** Check the `applyNetworkConfiguration` function is working:
```bash
cat repdev.yml | Select-String "networks"
```

### Issue: Validation fails
**Solution:** Check schema supports networks:
```bash
repdev validate
# Should show specific error if schema issue
```
