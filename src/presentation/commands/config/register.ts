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
    .command('config:init')
    .description('Create configuration file interactively')
    .option('--global', 'Create global config (~/.michi/config.json)')
    .option('--global-env', 'Create global .env (~/.michi/.env)')
    .option('--project', 'Create project config (.michi/config.json)')
    .option('--env', 'Create project .env file with secrets')
    .option('--all', 'Create all configuration files')
    .action(async (options) => {
      try {
        // オプションが何も指定されていない場合は --all として扱う
        if (!options.global && !options.globalEnv && !options.project && !options.env && !options.all) {
          options.all = true;
        }

        // グローバル .env 作成
        if (options.globalEnv || options.all) {
          const { createEnvInteractively } = await import('../../interactive/config/index.js');
          await createEnvInteractively('~/.michi/.env');
        }

        // プロジェクト .env 作成
        if (options.env || options.all) {
          const { createEnvInteractively } = await import('../../interactive/config/index.js');
          await createEnvInteractively('.env');
        }

        // グローバル設定 作成
        if (options.global || options.all) {
          const { configGlobal } = await import('../../../../scripts/config-global.js');
          await configGlobal();
        }

        // プロジェクト設定 作成
        if (options.project || options.all) {
          const { setupWorkflowConfig } = await import('../init/setup.js');
          const config = {
            projectId: 'default',
            projectName: 'Default Project',
            langCode: 'ja' as const,
            jiraKey: 'PROJ',
            interactive: true,
            skipWorkflowConfig: false,
            environment: 'claude' as const,
          };
          await setupWorkflowConfig(config, process.cwd());
        }

        console.log('');
        console.log('✅ 設定ファイルの作成が完了しました。');
        console.log('');
        process.exit(0);
      } catch (error) {
        handleError('Configuration initialization failed', error);
      }
    });

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
