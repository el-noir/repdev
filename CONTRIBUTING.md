# Contributing to RepDev

Thank you for your interest in contributing to RepDev! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make RepDev better.

## How Can I Contribute?

### 🐛 Reporting Bugs

Found a bug? Please [open an issue](https://github.com/el-noir/repdev/issues/new) with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, Docker version)
- Relevant logs or screenshots

### 💡 Suggesting Features

Have an idea? [Open a feature request](https://github.com/el-noir/repdev/issues/new) with:
- Clear use case
- Why it would be valuable
- Example usage
- Potential implementation approach

### 📝 Improving Documentation

Documentation improvements are always welcome:
- Fix typos or unclear wording
- Add missing examples
- Improve existing guides
- Translate documentation

### 🎨 Creating Presets

Add presets for popular stacks:
1. Create YAML file in `src/templates/presets/`
2. Add inline documentation
3. Test thoroughly
4. Update README with preset info

## Development Setup

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Clone and Install

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/repdev.git
cd repdev

# Install dependencies
npm install

# Link for local testing
npm link

# Test it works
repdev --version
```

### Running Locally

```bash
# Run directly with node
node src/index.js <command>

# Or use the linked command
repdev <command>
```

## Project Structure

```
repdev/
├── src/
│   ├── cli/
│   │   └── commands/           # CLI command implementations
│   │       ├── up.js          # repdev up
│   │       ├── down.js        # repdev down
│   │       ├── init.js        # repdev init
│   │       ├── status.js      # repdev status
│   │       ├── logs.js        # repdev logs
│   │       ├── exec.js        # repdev exec
│   │       ├── restart.js     # repdev restart
│   │       ├── validate.js    # repdev validate
│   │       └── doctor.js      # repdev doctor
│   ├── core/
│   │   ├── dockerManager.js   # Docker orchestration
│   │   ├── TemplateManager.js # Template loading/validation
│   │   ├── HooksRunner.js     # Lifecycle hooks executor
│   │   ├── ComposeGenerator.js # docker-compose.yml generator
│   │   ├── template.schema.json # JSON Schema for validation
│   │   └── logger.js          # Winston logger
│   ├── utils/
│   │   ├── envFileLoader.js   # .env file parser
│   │   ├── errorHandler.js    # Enhanced error handling
│   │   └── stateManager.js    # Container state tracking
│   ├── templates/
│   │   ├── node_template.yml  # Default template
│   │   └── presets/           # Pre-built templates
│   │       ├── mern.yml
│   │       ├── django.yml
│   │       ├── django-drf.yml
│   │       ├── nextjs-express.yml
│   │       └── basic-node.yml
│   └── index.js               # CLI entry point
├── test/                      # Test files
├── docs/                      # Documentation
├── README.md
├── CUSTOMIZATION.md
├── CONTRIBUTING.md
└── package.json
```

## Coding Guidelines

### JavaScript Style

- **ES6 Modules**: Use `import`/`export`
- **Async/Await**: Prefer over callbacks/promises
- **Explicit Extensions**: Always include `.js` in imports
- **Named Exports**: Prefer named exports over default
- **Error Handling**: Always use try/catch for async functions

### Example Code

```javascript
// Good ✅
import { logger } from '../core/logger.js';

export async function myCommand(options) {
  try {
    // Implementation
    logger.info('Success');
  } catch (error) {
    handleError(error, { command: 'myCommand' });
    throw error;
  }
}

// Bad ❌
const logger = require('../core/logger');  // Use import

export default function(opts) {  // Use named exports
  // No error handling
}
```

### File Naming

- **Commands**: lowercase with descriptive names (`init.js`, `doctor.js`)
- **Core Modules**: PascalCase for classes (`TemplateManager.js`)
- **Utils**: camelCase for functions (`errorHandler.js`)
- **Templates**: lowercase-with-hyphens (`nextjs-express.yml`)

### Comments

- Use JSDoc for functions
- Explain *why*, not *what*
- Keep comments up-to-date

```javascript
/**
 * Load environment variables from .env file(s)
 * 
 * @param {string|string[]} envFiles - Path(s) to .env file(s)
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Object} Merged environment variables
 */
export function loadEnvFiles(envFiles, projectRoot) {
  // Implementation
}
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description

Longer explanation if needed

Fixes #123
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(cli): add doctor command for health checks

Implements a new 'repdev doctor' command that checks:
- Node.js version
- Docker connectivity
- Template validity
- Port availability

Closes #42

---

fix(docker): handle port conflicts gracefully

Checks for port conflicts before starting containers
and provides actionable error messages.

Fixes #35

---

docs(readme): add troubleshooting section

Adds common error scenarios with solutions
```

## Pull Request Process

### Before Submitting

1. **Test Locally**
   ```bash
   # Test your changes
   npm link
   repdev doctor
   repdev up -p mern
   ```

2. **Check for Errors**
   ```bash
   # Run linter if available
   npm run lint
   
   # Run tests if available
   npm test
   ```

3. **Update Documentation**
   - Update README.md if adding features
   - Update CUSTOMIZATION.md if changing templates
   - Add inline comments for complex logic

### Submitting PR

1. **Fork and Branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make Changes**
   - Write clean, documented code
   - Follow coding guidelines
   - Test thoroughly

3. **Commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feat/my-feature
   ```
   Then open PR on GitHub

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tested locally
```

## Testing

### Manual Testing

```bash
# Test init command
repdev init -p mern

# Test up command
repdev up

# Test status
repdev status

# Test logs
repdev logs backend

# Test exec
repdev exec backend bash

# Test restart
repdev restart backend

# Test down
repdev down

# Test doctor
repdev doctor --ports

# Test with custom template
repdev up -t test/custom.yml

# Test validation
repdev validate -p django
```

### Testing Checklist

- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Works on Linux
- [ ] Error messages are helpful
- [ ] Handles edge cases gracefully
- [ ] No breaking changes (or documented)

## Adding a New Command

### 1. Create Command File

```javascript
// src/cli/commands/mycommand.js
import { logger } from '../../core/logger.js';
import { handleError } from '../../utils/errorHandler.js';

/**
 * My new command
 */
export async function myCommand(arg, options) {
  try {
    logger.info('Running my command...');
    
    // Implementation
    
    logger.info('✅ Success!');
  } catch (error) {
    handleError(error, { command: 'mycommand' });
    throw error;
  }
}
```

### 2. Register in index.js

```javascript
// src/index.js
import { myCommand } from './cli/commands/mycommand.js';

program.command('mycommand <arg>')
    .description('Description of my command')
    .option('-f, --flag', 'Optional flag')
    .action(myCommand);
```

### 3. Test

```bash
repdev mycommand testarg --flag
```

### 4. Document

- Add to README.md
- Add usage examples
- Add to help text

## Adding a New Preset

### 1. Create Preset File

```yaml
# src/templates/presets/mystack.yml
version: '1.0'
metadata:
  name: mystack
  description: My awesome stack
  author: Your Name
  created_at: 2025-10-20

# Add inline documentation
# Explain what each service does
# Add customization tips

services:
  app:
    image: node:20
    # ... rest of config
```

### 2. Add Customization Prompts (Optional)

```javascript
// src/cli/commands/init.js

if (presetName === 'mystack') {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'appDir',
      message: 'Application directory?',
      default: './app'
    },
    // ... more prompts
  ]);
  
  template = applyCustomization(template, {
    './app': answers.appDir,
    // ... more replacements
  });
}
```

### 3. Test Preset

```bash
repdev init -p mystack
repdev up
repdev status
repdev down
```

### 4. Document

- Add to README preset section
- Add example `.env` file if needed
- Add to CUSTOMIZATION.md

## Questions?

- 💬 [GitHub Discussions](https://github.com/el-noir/repdev/discussions)
- 🐛 [GitHub Issues](https://github.com/el-noir/repdev/issues)
- 📧 Email: [your-email]

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to RepDev! 🚀**
