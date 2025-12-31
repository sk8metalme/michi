/**
 * Config Command Registration
 *
 * Registers all config-related CLI commands
 */

import { Command } from 'commander';
import { validateAndReport } from '../../../../scripts/utils/config-validator.js';

/**
 * Register config-related commands
 */
export function registerConfigCommands(program: Command): void {
  program
    .command('config:validate')
    .description('Validate .michi/config.json')
    .action(async () => {
      try {
        const valid = validateAndReport();
        process.exit(valid ? 0 : 1);
      } catch (error) {
        handleError('Validation failed', error);
      }
    });

  program
    .command('config:check-security')
    .description('Check security of environment variables and configuration')
    .action(async () => {
      try {
        const { configValidate } = await import('../../../commands/config-validate.js');
        await configValidate();
        process.exit(0);
      } catch (error) {
        handleError('Security check failed', error);
      }
    });
}

/**
 * Handle command errors
 */
function handleError(message: string, error: unknown): never {
  console.error(
    `❌ ${message}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
