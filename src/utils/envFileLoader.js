import fs from 'fs';
import path from 'path';
import { logger } from '../core/logger.js';

/**
 * Parse a .env file into key-value pairs
 * Supports:
 * - KEY=value
 * - KEY="value"
 * - KEY='value'
 * - Comments with #
 * - Empty lines
 * - Export statements (export KEY=value)
 * 
 * @param {string} content - Raw .env file content
 * @returns {Object} Parsed environment variables
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (let line of lines) {
    // Remove whitespace
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Handle export statements
    if (line.startsWith('export ')) {
      line = line.substring(7).trim();
    }

    // Find the first = sign
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      continue; // Skip invalid lines
    }

    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }

    // Handle escaped characters
    value = value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');

    env[key] = value;
  }

  return env;
}

/**
 * Load environment variables from .env file(s)
 * 
 * @param {string|string[]} envFiles - Path(s) to .env file(s) relative to project root
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Object} Merged environment variables from all files
 */
export function loadEnvFiles(envFiles, projectRoot) {
  if (!envFiles) {
    return {};
  }

  // Normalize to array
  const files = Array.isArray(envFiles) ? envFiles : [envFiles];
  const mergedEnv = {};

  for (const file of files) {
    const filePath = path.isAbsolute(file) ? file : path.join(projectRoot, file);

    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`env_file not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseEnvFile(content);
      
      // Later files override earlier ones (same as docker-compose)
      Object.assign(mergedEnv, parsed);
      
      logger.debug(`Loaded ${Object.keys(parsed).length} variables from ${file}`);
    } catch (error) {
      logger.error(`Failed to load env_file ${file}: ${error.message}`);
    }
  }

  return mergedEnv;
}

/**
 * Merge env_file variables with environment variables
 * Priority: environment > env_file
 * 
 * @param {Object} envVars - Environment variables from template
 * @param {Object} envFileVars - Variables loaded from env_file
 * @returns {Object} Merged environment variables
 */
export function mergeEnvironment(envVars = {}, envFileVars = {}) {
  // env_file provides defaults, environment overrides
  return { ...envFileVars, ...envVars };
}
