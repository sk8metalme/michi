/**
 * Init Command Registration
 *
 * Registers init and migration commands
 */

import { Command } from 'commander';
import { initProject } from '../../../commands/init.js';
import { migrate } from '../../../commands/migrate.js';
import { convertTasksFile } from '../../../../scripts/utils/tasks-converter.js';
import { isAIDLCFormat } from '../../../../scripts/utils/aidlc-parser.js';
import { existsSync } from 'fs';
import { safeReadFileOrThrow } from '../../../../scripts/utils/safe-file-reader.js';
import { join } from 'path';

/**
 * Register init and migration commands
 */
export function registerInitCommands(program: Command): void {
  program
    .command('init')
    .description('Initialize new or existing project with Michi workflow')
    .option('--name <project-id>', 'Project ID')
    .option('--project-name <name>', 'Project name')
    .option('--jira-key <key>', 'JIRA project key')
    .option('--existing', 'Initialize existing project mode (auto-detects by default)')
    .option('--michi-path <path>', 'Path to Michi repository (for template copying)')
    .option('--skip-config', 'Skip workflow configuration setup')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--claude', 'Use Claude Code environment')
    .option('--claude-agent', 'Use Claude Code Subagents environment')
    .option('--lang <code>', 'Language code (default: ja)', 'ja')
    .action(async (options) => {
      try {
        await initProject(options);
      } catch (error) {
        handleError('Initialization failed', error);
      }
    });

  program
    .command('migrate')
    .description('Migrate .env to new 3-layer configuration format')
    .option('--dry-run', 'Preview changes without modifying files')
    .option('--backup-dir <dir>', 'Specify backup directory')
    .option('--force', 'Skip confirmation prompts')
    .option('--verbose', 'Show detailed logs')
    .option('--rollback <dir>', 'Restore from backup directory')
    .action(async (options) => {
      try {
        await migrate(options);
      } catch (error) {
        handleError('Migration failed', error);
      }
    });

  program
    .command('tasks:convert')
    .description('Convert AI-DLC format tasks.md to Michi workflow format')
    .argument('<feature>', 'Feature name')
    .option('--dry-run', 'Preview conversion without modifying files')
    .option('--backup', 'Create backup of original file')
    .option('--lang <code>', 'Output language (ja/en)', 'ja')
    .action(
      async (
        feature: string,
        options: { dryRun?: boolean; backup?: boolean; lang?: string },
      ) => {
        try {
          const kiroDir = '.kiro';
          const tasksPath = join(kiroDir, 'specs', feature, 'tasks.md');

          if (!existsSync(tasksPath)) {
            console.error(`❌ tasks.md not found: ${tasksPath}`);
            process.exit(1);
          }

          const content = safeReadFileOrThrow(tasksPath, 'utf-8');
          if (!isAIDLCFormat(content)) {
            console.log(
              'ℹ️  File is not in AI-DLC format (may already be in Michi format)',
            );
            console.log('   No conversion needed.');
            process.exit(0);
          }

          console.log(
            '🔄 Converting AI-DLC format to Michi workflow format...',
          );
          console.log(`   Input: ${tasksPath}`);

          const result = convertTasksFile(tasksPath, undefined, {
            dryRun: options.dryRun,
            backup: options.backup,
            language: (options.lang || 'ja') as 'ja' | 'en',
            projectName: feature,
          });

          if (!result.success) {
            console.error('❌ Conversion failed:');
            result.warnings.forEach((w) => console.error(`   ${w}`));
            process.exit(1);
          }

          displayConversionResults(result, options.dryRun);
        } catch (error) {
          handleError('Conversion failed', error);
        }
      },
    );
}

/**
 * Display task conversion results
 */
function displayConversionResults(
  result: {
    success: boolean;
    convertedContent: string;
    stats: {
      originalCategories: number;
      originalTasks: number;
      convertedPhases: number;
      convertedStories: number;
    };
    backupPath?: string;
    warnings: string[];
  },
  dryRun?: boolean,
): void {
  console.log('');
  console.log('📊 Conversion Statistics:');
  console.log(`   Original categories: ${result.stats.originalCategories}`);
  console.log(`   Original tasks: ${result.stats.originalTasks}`);
  console.log(`   Converted phases: ${result.stats.convertedPhases}`);
  console.log(`   Converted stories: ${result.stats.convertedStories}`);

  if (result.backupPath) {
    console.log(`   Backup created: ${result.backupPath}`);
  }

  if (result.warnings.length > 0) {
    console.log('');
    console.log('⚠️  Warnings:');
    result.warnings.forEach((w) => console.log(`   ${w}`));
  }

  if (dryRun) {
    console.log('');
    console.log('📝 Preview (first 50 lines):');
    console.log('---');
    const previewLines = result.convertedContent.split('\n').slice(0, 50);
    console.log(previewLines.join('\n'));
    if (result.convertedContent.split('\n').length > 50) {
      console.log('... (truncated)');
    }
    console.log('---');
  } else {
    console.log('');
    console.log('✅ Conversion completed!');
  }
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
