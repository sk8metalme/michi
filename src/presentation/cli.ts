#!/usr/bin/env node
/**
 * Michi CLI - Command Registration Layer
 *
 * This module is responsible for:
 * - Registering all CLI commands
 * - Global option configuration
 * - Error handling and logging
 *
 * Business logic is delegated to command handlers in ./commands/
 *
 * Phase 5, Task 6.1: CLI分割完了
 * - コマンド登録ロジックのみを保持
 * - 各コマンドグループは ./commands/{group}/register.ts に分離
 * - グローバルオプション設定とエラーハンドリングを実装
 */

import { Command } from 'commander';
import { loadEnv } from '../../scripts/utils/env-loader.js';
import { getMichiVersion } from './cli/version.js';

// Command registration imports
import { registerJiraCommands } from './commands/jira/register.js';
import { registerConfluenceCommands } from './commands/confluence/register.js';
import { registerPhaseCommands } from './commands/phase/register.js';
import { registerSpecCommands } from './commands/spec/register.js';
import { registerWorkflowCommands } from './commands/workflow/register.js';
import { registerConfigCommands } from './commands/config/register.js';
import { registerInitCommands } from './commands/init/register.js';
import { registerMultiRepoCommands } from './commands/multi-repo/register.js';

// Load environment variables (Global → Local)
loadEnv();

// Get Michi version
const michiVersion = getMichiVersion();

/**
 * Create and configure CLI program
 */
export function createCLI(): Command {
  const program = new Command();

  // Global configuration
  program
    .name('michi')
    .description(
      '🛣️  Michi(道) - Managed Intelligent Comprehensive Hub for Integration',
    )
    .version(michiVersion);

  // Global error handler
  program.exitOverride((err) => {
    if (err.code === 'commander.help') {
      process.exit(0);
    }
    if (err.code === 'commander.version') {
      process.exit(0);
    }
    console.error('❌ Command failed:', err.message);
    process.exit(1);
  });

  // Register command groups (delegated to ./commands/*/register.ts)
  registerJiraCommands(program);
  registerConfluenceCommands(program);
  registerPhaseCommands(program);
  registerSpecCommands(program);
  registerWorkflowCommands(program);
  registerConfigCommands(program);
  registerInitCommands(program);
  registerMultiRepoCommands(program);

  return program;
}

// CLI execution (when run directly)
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';

if (process.argv[1]) {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const executedFile = realpathSync(process.argv[1]);
    if (currentFile === executedFile) {
      const program = createCLI();
      program.parse();
    }
  } catch {
    // realpathSyncが失敗した場合は、直接比較を試みる
    if (fileURLToPath(import.meta.url) === process.argv[1]) {
      const program = createCLI();
      program.parse();
    }
  }
}
