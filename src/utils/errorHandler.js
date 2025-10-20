import { logger } from '../core/logger.js';

/**
 * Known error patterns and their solutions
 */
const ERROR_PATTERNS = [
  {
    pattern: /cannot connect to the docker daemon/i,
    name: 'Docker Not Running',
    suggestions: [
      'Start Docker Desktop',
      'Check if Docker daemon is running: docker ps',
      'On Windows: Ensure Docker Desktop is set to start on login',
      'On Linux: sudo systemctl start docker',
      'Verify DOCKER_HOST environment variable if using remote Docker'
    ]
  },
  {
    pattern: /EADDRINUSE|address already in use/i,
    name: 'Port Already in Use',
    suggestions: [
      'Another process is using the port',
      'Find the process: netstat -ano | findstr :<port> (Windows) or lsof -i :<port> (Mac/Linux)',
      'Stop the conflicting container: repdev down',
      'Change the port in repdev.yml',
      'Kill the process or use a different port'
    ]
  },
  {
    pattern: /no such file or directory.*repdev\.yml/i,
    name: 'Template Not Found',
    suggestions: [
      'Run "repdev init" to create a template',
      'Run "repdev init -p <preset>" to use a preset',
      'Ensure you\'re in the correct project directory',
      'Use -t flag to specify template path: repdev up -t /path/to/template.yml'
    ]
  },
  {
    pattern: /container name.*already in use/i,
    name: 'Container Name Conflict',
    suggestions: [
      'Use --force flag to recreate: repdev up --force',
      'Stop existing containers: repdev down',
      'Change container_name in repdev.yml',
      'Remove conflicting container: docker rm -f <container_name>'
    ]
  },
  {
    pattern: /pull access denied|not found/i,
    name: 'Docker Image Not Found',
    suggestions: [
      'Check image name spelling in repdev.yml',
      'Verify image exists on Docker Hub',
      'Try pulling manually: docker pull <image_name>',
      'Check if you need authentication: docker login',
      'Use correct image tag (e.g., node:20 instead of node:latest)'
    ]
  },
  {
    pattern: /ENOENT.*\.env/i,
    name: 'Environment File Not Found',
    suggestions: [
      'Create the .env file specified in env_file',
      'Check the path in env_file is relative to project root',
      'Remove env_file from repdev.yml if not needed',
      'Copy from example: cp .env.example .env'
    ]
  },
  {
    pattern: /validation error|schema/i,
    name: 'Invalid Template',
    suggestions: [
      'Run "repdev validate" to see validation errors',
      'Check YAML syntax (indentation, colons, quotes)',
      'Ensure required fields are present: version, services, image',
      'Check examples in presets: repdev init --list',
      'Refer to schema: src/core/template.schema.json'
    ]
  },
  {
    pattern: /ETIMEDOUT|ECONNREFUSED|timeout/i,
    name: 'Connection Timeout',
    suggestions: [
      'Check your internet connection',
      'Docker registry might be slow - retry the command',
      'Increase timeout in wait_for configuration',
      'Check if firewall is blocking Docker',
      'Verify the service is actually starting (check logs)'
    ]
  },
  {
    pattern: /permission denied/i,
    name: 'Permission Denied',
    suggestions: [
      'On Linux: Add user to docker group: sudo usermod -aG docker $USER',
      'On Windows: Run as Administrator or check Docker Desktop settings',
      'Check file/directory permissions',
      'Ensure Docker has access to mounted volumes',
      'Try: sudo repdev <command> (Linux only)'
    ]
  },
  {
    pattern: /disk|space|storage/i,
    name: 'Disk Space Issue',
    suggestions: [
      'Free up disk space',
      'Clean Docker resources: docker system prune -a',
      'Remove unused images: docker image prune -a',
      'Remove unused volumes: docker volume prune',
      'Check disk space: df -h (Linux/Mac) or Get-PSDrive (Windows)'
    ]
  }
];

/**
 * Match error message to known pattern
 */
function matchErrorPattern(error) {
  const message = error.message || error.toString();
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(message)) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Enhanced error handler with suggestions
 */
export function handleError(error, context = {}) {
  logger.error('\n❌ Error occurred\n');
  
  // Log the error message
  logger.error(`Message: ${error.message || error}`);
  
  // Add context if provided
  if (context.command) {
    logger.error(`Command: repdev ${context.command}`);
  }
  
  if (context.service) {
    logger.error(`Service: ${context.service}`);
  }
  
  // Match to known pattern
  const pattern = matchErrorPattern(error);
  
  if (pattern) {
    logger.error(`\n🔍 Identified Issue: ${pattern.name}\n`);
    logger.error('💡 Suggestions:\n');
    pattern.suggestions.forEach((suggestion, index) => {
      logger.error(`   ${index + 1}. ${suggestion}`);
    });
  } else {
    // Generic suggestions for unknown errors
    logger.error('\n💡 General Troubleshooting:\n');
    logger.error('   1. Run "repdev doctor" to check system health');
    logger.error('   2. Check Docker is running: docker ps');
    logger.error('   3. Validate template: repdev validate');
    logger.error('   4. Check logs: repdev logs <service>');
    logger.error('   5. Try with --force flag to recreate containers');
  }
  
  // Add debug info suggestion
  if (error.stack && !process.env.DEBUG) {
    logger.error('\n🐛 For detailed error stack trace, run with DEBUG=1');
  }
  
  // Show stack trace in debug mode
  if (error.stack && process.env.DEBUG) {
    logger.error('\n📋 Stack Trace:\n');
    logger.error(error.stack);
  }
  
  logger.error('\n📚 Documentation: https://github.com/el-noir/repdev#readme');
  logger.error('🐛 Report issues: https://github.com/el-noir/repdev/issues\n');
}

/**
 * Wrap async command with error handling
 */
export function withErrorHandling(commandFn, context = {}) {
  return async (...args) => {
    try {
      await commandFn(...args);
    } catch (error) {
      handleError(error, context);
      process.exit(1);
    }
  };
}

/**
 * Validate environment before running commands
 */
export async function validateEnvironment() {
  const issues = [];
  
  // Check Node version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major < 16) {
    issues.push({
      level: 'error',
      message: `Node.js ${nodeVersion} is too old. RepDev requires Node.js 16+`,
      suggestion: 'Update Node.js: https://nodejs.org'
    });
  }
  
  // Check if in a directory
  try {
    process.cwd();
  } catch (error) {
    issues.push({
      level: 'error',
      message: 'Cannot determine current directory',
      suggestion: 'Ensure you are in a valid directory'
    });
  }
  
  return issues;
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown() {
  const shutdown = (signal) => {
    logger.info(`\n\n🛑 Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
  };
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
