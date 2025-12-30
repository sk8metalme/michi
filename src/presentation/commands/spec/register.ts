/**
 * Spec Command Registration
 *
 * Registers all spec-related CLI commands
 */

import { Command } from 'commander';
import { specArchiveCommand } from '../../../commands/spec-archive.js';
import { specListCommand } from '../../../commands/spec-list.js';

/**
 * Register spec-related commands
 */
export function registerSpecCommands(program: Command): void {
  program
    .command('spec:archive')
    .description('Archive a completed specification')
    .argument('<feature>', 'Feature name')
    .option('--reason <reason>', 'Archive reason')
    .action(async (feature: string, options: { reason?: string }) => {
      try {
        await specArchiveCommand(feature, options);
      } catch (error) {
        handleError('Failed to archive specification', error);
      }
    });

  program
    .command('spec:list')
    .description('List specifications')
    .option('--all', 'Include archived specifications')
    .action(async (options: { all?: boolean }) => {
      try {
        await specListCommand(options);
      } catch (error) {
        handleError('Failed to list specifications', error);
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
