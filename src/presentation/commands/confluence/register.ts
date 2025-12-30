/**
 * Confluence Command Registration
 *
 * Registers all Confluence-related CLI commands
 */

import { Command } from 'commander';
import { syncToConfluence } from '../../../../scripts/confluence-sync.js';

/**
 * Register Confluence-related commands
 */
export function registerConfluenceCommands(program: Command): void {
  program
    .command('confluence:sync')
    .description('Sync spec to Confluence')
    .argument('<feature>', 'Feature name')
    .argument('[type]', 'Document type (requirements, design)', 'requirements')
    .action(async (feature: string, type?: string) => {
      try {
        await syncToConfluence(
          feature,
          type as 'requirements' | 'design' | 'tasks' | undefined,
        );
      } catch (error) {
        handleError('Confluence sync failed', error);
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
