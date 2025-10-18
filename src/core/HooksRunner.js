import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const exec = promisify(_exec);

export async function runHooks(label, hooks = [], { dryRun = false } = {}) {
  if (!hooks || hooks.length === 0) return;
  logger.info(`Running hooks: ${label}`);
  for (const cmd of hooks) {
    if (dryRun) {
      logger.info(`[dry-run] Would run hook: ${cmd}`);
      continue;
    }
    try {
      const { stdout, stderr } = await exec(cmd);
      if (stdout) logger.info(stdout.trim());
      if (stderr) logger.info(stderr.trim());
    } catch (err) {
      logger.error(`Hook failed (${cmd}): ${err.message}`);
      throw err;
    }
  }
}
