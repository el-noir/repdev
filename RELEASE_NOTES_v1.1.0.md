# RepDev v1.1.0 - Major Update Summary

## 🎯 Overview
Major enhancement to RepDev adding comprehensive network configuration support and improved UX with mandatory preset selection.

**Release Date:** October 21, 2025  
**Version:** 1.1.0  
**Type:** Feature Release + Breaking Changes

---

## ⚠️ BREAKING CHANGES

### 1. **Preset Selection Now Required**

**Before (v1.0.0):**
```bash
repdev init  # Created generic YAML template
```

**After (v1.1.0):**
```bash
repdev init  # ❌ Error: No preset specified
repdev init -p mern  # ✅ Required
```

**Reason:** 
- Generic templates provided minimal value
- Forced users to manually configure everything
- Curated presets provide better starting point
- Ensures best practices from the start

**Migration:**
- If you have existing `repdev.yml`: No changes needed
- For new projects: Use `repdev init -p <preset>`
- See available presets: `repdev init --list`

### 2. **Removed Presets**

Removed 2 underutilized presets:
- ❌ `basic-node` - Too minimal, redundant with MERN
- ❌ `nextjs-express` - Less commonly used

Remaining **4 core presets**:
- ✅ `mern` - MERN stack (most popular)
- ✅ `django` - Django + PostgreSQL
- ✅ `django-drf` - Django REST + React
- ✅ `network-demo` - Network architecture examples

---

## 🆕 NEW FEATURES

### 1. **Interactive Network Configuration**

When initializing with a preset, RepDev now asks:

**Prompt Flow:**
```
? Do you want to configure custom networks? (Y/n)
? Select network mode:
  > Bridge (default - isolated container network)
    Host (use host network stack - high performance)
    Custom networks (multi-tier architecture)
    None (no networking)

# If "Custom networks" selected:
? Enter network names (comma-separated): frontend,backend,database
? Do you want to configure static IPs? (y/N)
? Enter subnet: 172.25.0.0/16
```

**Generated Configuration:**
```yaml
networks:
  frontend:
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16

services:
  frontend:
    networks: [frontend]
  api:
    networks: [frontend, backend]
  db:
    networks: [backend]
```

**Supported Network Modes:**
1. **Bridge** - Default Docker networking (isolated)
2. **Host** - High performance, uses host network stack
3. **Custom** - Multi-tier with isolated networks
4. **None** - No networking (offline processing)

### 2. **Network Feature - Complete Docker Networking Support**

**Top-Level Networks:**
- Custom network definitions
- Network drivers (bridge, overlay, host, macvlan, none)
- IPAM configuration (subnet, gateway)
- External network support

**Service-Level Configuration:**
- Network mode (`network_mode: host|bridge|none`)
- Multiple networks per service
- Static IPv4/IPv6 addresses
- Network aliases for service discovery

**Example:**
```yaml
networks:
  app_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
          gateway: 172.25.0.1

services:
  api:
    networks:
      app_net:
        ipv4_address: 172.25.0.10
        aliases: [api-server, backend]
```

### 3. **Enhanced Error Messages and UX**

**Better Guidance:**
```bash
# Before
$ repdev init
✅ Created repdev.yml  # Generic, unhelpful

# After
$ repdev init
❌ No preset specified!

💡 RepDev requires a preset to initialize.
   Run: repdev init --list    (to see available presets)
   Or:  repdev init -p <preset>  (to initialize with a preset)

📋 Example:
   repdev init -p mern
```

**Improved Preset Listing:**
```bash
$ repdev init --list
📋 Available presets:
   - django-drf
   - django
   - mern
   - network-demo

💡 Usage: repdev init -p <preset>
```

---

## 📝 UPDATED

### Core Files
- **`src/core/ComposeGenerator.js`** - Network generation logic
- **`src/core/template.schema.json`** - Network validation schema
- **`src/cli/commands/init.js`** - Network prompts + preset requirement

### Documentation
- **`README.md`** - Updated Quick Start, removed old presets
- **`CUSTOMIZATION.md`** - Enhanced network configuration section
- **`ACCOMPLISHMENTS.md`** - Updated with network feature

### New Documentation
- **`docs/NETWORK_CONFIGURATION.md`** (400+ lines)
  - Complete network guide
  - 5 network modes explained
  - 4 practical examples
  - Best practices & troubleshooting

- **`docs/NETWORK_FEATURE.md`**
  - Implementation summary
  - Testing results
  - Use cases

- **`docs/NETWORK_QUICKSTART.md`**
  - Quick examples
  - Common patterns
  - Testing commands

- **`docs/COMMAND_REFERENCE.md`**
  - Common mistakes guide
  - Correct usage patterns
  - Command flags reference

### Templates
- **`src/templates/presets/network-demo.yml`** (NEW)
  - 7 services, 3 networks
  - Shows microservices patterns
  - Static IPs, host mode, sidecars

---

## 📊 STATISTICS

| Metric | v1.0.0 | v1.1.0 | Change |
|--------|--------|--------|--------|
| **Presets** | 6 | 4 | -2 (focused) |
| **Network Modes** | 3 | 5 | +2 |
| **Documentation** | 4 files | 7 files | +3 |
| **Lines of Code** | ~4,000 | ~4,500 | +500 |
| **Features** | 20 | 22 | +2 |

---

## 🧪 TESTING

### Manual Testing Completed
✅ `repdev init` without preset shows error  
✅ `repdev init --list` shows 4 presets  
✅ `repdev init -p mern` works with network prompts  
✅ Network configuration applied correctly  
✅ Template validation passes  
✅ Docker Compose generation correct  

### Test Files Added
- `test/network-test.yml` - Validation test
- `test/test-network-init.ps1` - Init test script

---

## 📦 UPGRADE GUIDE

### For Existing Users

**Your existing projects are NOT affected:**
- Existing `repdev.yml` files continue to work
- All commands (`up`, `down`, `status`, etc.) unchanged
- No migration needed for current projects

**For new projects:**
```bash
# Old way (no longer works)
repdev init

# New way (required)
repdev init --list        # See available presets
repdev init -p mern       # Initialize with preset
```

### For New Users

**Installation:**
```bash
npm install -g repdev
```

**Getting Started:**
```bash
# Step 1: List presets
repdev init --list

# Step 2: Initialize with preset
repdev init -p mern

# Step 3: Answer prompts
# - Directory paths
# - Ports
# - Package manager
# - Network configuration (NEW!)

# Step 4: Start environment
repdev up
```

---

## 🎯 USE CASES

### 1. **Simple Development (Default)**
```bash
repdev init -p mern
# Choose "No" for custom networks
# Uses default bridge networking
```

### 2. **High Performance (Host Network)**
```bash
repdev init -p django
# Choose "Yes" for custom networks
# Select "Host" network mode
# Direct host networking for maximum speed
```

### 3. **Multi-Tier Architecture (Custom Networks)**
```bash
repdev init -p django-drf
# Choose "Yes" for custom networks
# Select "Custom networks"
# Enter: "frontend,backend,database"
# Each tier is isolated for security
```

### 4. **Learning Network Configuration**
```bash
repdev init -p network-demo
# Pre-configured with 3 networks, 7 services
# Shows patterns: microservices, host mode, sidecars
# Great for learning Docker networking
```

---

## 🐛 KNOWN ISSUES

None at this time.

---

## 🔮 FUTURE ENHANCEMENTS

### Planned for v1.2.0
- Automated testing (Jest/Mocha)
- Cross-platform testing (macOS, Linux)
- Additional presets (FastAPI, Ruby on Rails)

### Considering
- `repdev network ls` - List networks
- `repdev network test` - Test connectivity
- Visual network topology diagrams
- Pre-configured network templates

---

## 📚 DOCUMENTATION

### Quick References
- [README.md](../README.md) - Getting started
- [CUSTOMIZATION.md](../CUSTOMIZATION.md) - Customization guide
- [COMMAND_REFERENCE.md](docs/COMMAND_REFERENCE.md) - Common mistakes

### Network Documentation
- [NETWORK_CONFIGURATION.md](docs/NETWORK_CONFIGURATION.md) - Complete guide
- [NETWORK_QUICKSTART.md](docs/NETWORK_QUICKSTART.md) - Quick examples
- [NETWORK_FEATURE.md](docs/NETWORK_FEATURE.md) - Implementation details

---

## 🙏 FEEDBACK

We'd love to hear from you!

- **Issues:** [GitHub Issues](https://github.com/el-noir/repdev/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/el-noir/repdev/discussions)
- **Email:** [Your email]

---

## 📄 LICENSE

MIT License - See [LICENSE](../LICENSE) file

---

## 🎉 ACKNOWLEDGMENTS

Thank you to all users and contributors who helped shape this release!

**Special Thanks:**
- Community feedback on network configuration needs
- Testing and bug reports
- Feature suggestions and use case discussions

---

**RepDev Team**  
Making reproducible development environments simple.
