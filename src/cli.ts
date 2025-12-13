#!/usr/bin/env node
/**
 * Michi CLI Tool
 * AI駆動開発ワークフロー自動化コマンドラインツール
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';
import { syncTasksToJIRA, JIRAClient } from '../scripts/jira-sync.js';
import { syncToConfluence } from '../scripts/confluence-sync.js';
import { runPhase } from '../scripts/phase-runner.js';
import { validatePhase } from '../scripts/validate-phase.js';
import { runPreFlightCheck } from '../scripts/pre-flight-check.js';
import { listProjects } from '../scripts/list-projects.js';
import { createResourceDashboard } from '../scripts/resource-dashboard.js';
import { WorkflowOrchestrator } from '../scripts/workflow-orchestrator.js';
import { validateAndReport } from '../scripts/utils/config-validator.js';
import { setupExisting } from './commands/setup-existing.js';
import { initProject } from './commands/init.js';
import { migrate } from './commands/migrate.js';
import { convertTasksFile } from '../scripts/utils/tasks-converter.js';
import { isAIDLCFormat } from '../scripts/utils/aidlc-parser.js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// package.jsonからバージョンを読み込む
// Michi自身のpackage.jsonのみを読み込み、利用者のpackage.jsonは読まない
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Michi自身のpackage.jsonからバージョンを取得
 * 利用者のプロジェクトがNode.jsでなくてもMichiを使えるようにする
 */
function getMichiVersion(): string {
  // package.jsonの場所を探索
  // - ビルド後/npm実行時: __dirname/../../package.json (dist/src/cli.js)
  // - 開発時: __dirname/../package.json (src/cli.ts)
  const possiblePaths = [
    join(__dirname, '..', '..', 'package.json'),
    join(__dirname, '..', 'package.json'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        const packageJson = JSON.parse(readFileSync(path, 'utf-8'));
        // name フィールドで確実にMichiのpackage.jsonか確認
        if (packageJson.name === '@sk8metal/michi-cli') {
          return packageJson.version;
        }
      } catch {
        // 次のパスを試す
        continue;
      }
    }
  }

  // どこにも見つからない場合はデフォルト値（開発環境など）
  return '0.0.0-dev';
}

const michiVersion = getMichiVersion();

// 環境変数読み込み
config();

/**
 * 環境変数から承認ゲートのロールリストを取得
 * @param envVar 環境変数名
 * @param defaultValue デフォルト値（環境変数が存在しない場合）
 * @returns ロール名の配列
 */
function getApprovalGates(envVar: string, defaultValue: string[]): string[] {
  const envValue = process.env[envVar];
  if (!envValue) {
    return defaultValue;
  }
  // カンマ区切りを配列に変換し、空白をトリム
  return envValue
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

/**
 * CLIツールを作成
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('michi')
    .description(
      '🛣️  Michi(道) - Managed Intelligent Comprehensive Hub for Integration',
    )
    .version(michiVersion);

  // jira:sync コマンド
  program
    .command('jira:sync')
    .description('Sync tasks.md to JIRA Epic/Stories')
    .argument('<feature>', 'Feature name')
    .action(async (feature: string) => {
      try {
        await syncTasksToJIRA(feature);
      } catch (error) {
        console.error(
          '❌ JIRA sync failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // confluence:sync コマンド
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
        console.error(
          '❌ Confluence sync failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // phase:run コマンド
  program
    .command('phase:run')
    .description('Run complete phase workflow')
    .argument('<feature>', 'Feature name')
    .argument(
      '<phase>',
      'Phase name (requirements, design, tasks, environment-setup, phase-a, phase-b)',
    )
    .action(async (feature: string, phase: string) => {
      const validPhases = [
        'requirements',
        'design',
        'tasks',
        'environment-setup',
        'phase-a',
        'phase-b',
      ];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await runPhase(
          feature,
          phase as
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'environment-setup'
            | 'phase-a'
            | 'phase-b',
        );
        if (result.success) {
          console.log('\n✅ Phase completed');
        } else {
          console.log('\n❌ Phase incomplete (check errors above)');
          process.exit(1);
        }
      } catch (error) {
        console.error(
          '❌ Phase execution failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // validate:phase コマンド
  program
    .command('validate:phase')
    .description('Validate phase completion')
    .argument('<feature>', 'Feature name')
    .argument(
      '<phase>',
      'Phase name (requirements, design, tasks, environment-setup, phase-a, phase-b)',
    )
    .action(async (feature: string, phase: string) => {
      const validPhases = [
        'requirements',
        'design',
        'tasks',
        'environment-setup',
        'phase-a',
        'phase-b',
      ];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = validatePhase(
          feature,
          phase as
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'environment-setup'
            | 'phase-a'
            | 'phase-b',
        );
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error(
          '❌ Validation failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // preflight コマンド
  program
    .command('preflight')
    .description('Run pre-flight checks')
    .argument('[phase]', 'Check phase (confluence, jira, all)', 'all')
    .action(async (phase: string) => {
      const validPhases = ['confluence', 'jira', 'all'];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await runPreFlightCheck(
          phase as 'confluence' | 'jira' | 'all',
        );
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error(
          '❌ Pre-flight check failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // project:list コマンド
  program
    .command('project:list')
    .description('List all projects')
    .action(async () => {
      try {
        await listProjects();
      } catch (error) {
        console.error(
          '❌ Failed to list projects:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // project:dashboard コマンド
  program
    .command('project:dashboard')
    .description('Create resource dashboard')
    .action(async () => {
      try {
        await createResourceDashboard();
      } catch (error) {
        console.error(
          '❌ Failed to create dashboard:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // workflow:run コマンド
  program
    .command('workflow:run')
    .description('Run complete workflow')
    .requiredOption('--feature <name>', 'Feature name')
    .action(async (options: { feature: string }) => {
      try {
        const workflowConfig = {
          feature: options.feature,
          stages: [
            'requirements',
            'design',
            'tasks',
            'implement',
            'test',
            'release',
          ] as (
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'implement'
            | 'test'
            | 'release'
          )[],
          approvalGates: {
            requirements: getApprovalGates('APPROVAL_GATES_REQUIREMENTS', [
              'pm',
              'director',
            ]),
            design: getApprovalGates('APPROVAL_GATES_DESIGN', [
              'architect',
              'director',
            ]),
            release: getApprovalGates('APPROVAL_GATES_RELEASE', [
              'sm',
              'director',
            ]),
          },
        };

        const orchestrator = new WorkflowOrchestrator(workflowConfig);
        await orchestrator.run();
      } catch (error) {
        console.error(
          '❌ Workflow failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // config:validate コマンド
  program
    .command('config:validate')
    .description('Validate .michi/config.json')
    .action(async () => {
      try {
        const valid = validateAndReport();
        process.exit(valid ? 0 : 1);
      } catch (error) {
        console.error(
          '❌ Validation failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // config:check-security コマンド
  program
    .command('config:check-security')
    .description('Check security of environment variables and configuration')
    .action(async () => {
      try {
        const { configValidate } = await import('./commands/config-validate.js');
        await configValidate();
        process.exit(0);
      } catch (error) {
        console.error(
          '❌ Security check failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // init コマンド（統合セットアップ）
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
    .option('--cursor', 'Use Cursor IDE environment')
    .option('--claude', 'Use Claude Code environment')
    .option('--claude-agent', 'Use Claude Code Subagents environment')
    .option('--gemini', 'Use Gemini CLI environment')
    .option('--codex', 'Use Codex CLI environment')
    .option('--cline', 'Use Cline environment')
    .option('--lang <code>', 'Language code (default: ja)', 'ja')
    .action(async (options) => {
      try {
        await initProject(options);
      } catch (error) {
        console.error(
          '❌ Initialization failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // setup-existing コマンド (非推奨)
  program
    .command('setup-existing')
    .description('[DEPRECATED] Use "michi init --existing" instead')
    .option('--cursor', 'Use Cursor IDE environment')
    .option('--claude', 'Use Claude Code environment')
    .option('--claude-agent', 'Use Claude Code Subagents environment')
    .option('--gemini', 'Use Gemini CLI environment')
    .option('--codex', 'Use Codex CLI environment')
    .option('--cline', 'Use Cline environment')
    .option('--lang <code>', 'Language code (default: ja)', 'ja')
    .option('--project-name <name>', 'Project name')
    .option('--jira-key <key>', 'JIRA project key')
    .option('--no-agent-skills', 'Skip installing agent skills and sub-agents to ~/.claude/')
    .action(async (options) => {
      console.warn('⚠️  このコマンドは非推奨です。代わりに "michi init --existing" を使用してください。');
      console.warn('   This command is deprecated. Please use "michi init --existing" instead.');
      console.log('');

      try {
        await setupExisting(options);
      } catch (error) {
        console.error(
          '❌ Setup failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // migrate コマンド
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
        console.error(
          '❌ Migration failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // tasks:convert コマンド
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

          // AI-DLC形式かチェック
          const content = readFileSync(tasksPath, 'utf-8');
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

          console.log('');
          console.log('📊 Conversion Statistics:');
          console.log(
            `   Original categories: ${result.stats.originalCategories}`,
          );
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

          if (options.dryRun) {
            console.log('');
            console.log('📝 Preview (first 50 lines):');
            console.log('---');
            const previewLines = result.convertedContent
              .split('\n')
              .slice(0, 50);
            console.log(previewLines.join('\n'));
            if (result.convertedContent.split('\n').length > 50) {
              console.log('... (truncated)');
            }
            console.log('---');
          } else {
            console.log('');
            console.log('✅ Conversion completed!');
            console.log(`   Output: ${tasksPath}`);
          }
        } catch (error) {
          console.error(
            '❌ Conversion failed:',
            error instanceof Error ? error.message : error,
          );
          process.exit(1);
        }
      },
    );

  // jira:transition コマンド
  program
    .command('jira:transition')
    .description('Change JIRA ticket status')
    .argument('<issueKey>', 'JIRA issue key (e.g., PROJ-123)')
    .argument(
      '<status>',
      'Target status name (e.g., "In Progress", "Ready for Review")',
    )
    .action(async (issueKey: string, status: string) => {
      try {
        const url = process.env.ATLASSIAN_URL;
        const email = process.env.ATLASSIAN_EMAIL;
        const apiToken = process.env.ATLASSIAN_API_TOKEN;

        if (!url || !email || !apiToken) {
          console.error('❌ Missing JIRA credentials in .env');
          console.error(
            '   Required: ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN',
          );
          process.exit(1);
        }

        const client = new JIRAClient({ url, email, apiToken });
        await client.transitionIssue(issueKey, status);
      } catch (error) {
        console.error(
          '❌ JIRA transition failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  // jira:comment コマンド
  program
    .command('jira:comment')
    .description('Add comment to JIRA ticket')
    .argument('<issueKey>', 'JIRA issue key (e.g., PROJ-123)')
    .argument('<comment>', 'Comment text')
    .action(async (issueKey: string, comment: string) => {
      try {
        const url = process.env.ATLASSIAN_URL;
        const email = process.env.ATLASSIAN_EMAIL;
        const apiToken = process.env.ATLASSIAN_API_TOKEN;

        if (!url || !email || !apiToken) {
          console.error('❌ Missing JIRA credentials in .env');
          console.error(
            '   Required: ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN',
          );
          process.exit(1);
        }

        const client = new JIRAClient({ url, email, apiToken });
        await client.addComment(issueKey, comment);
      } catch (error) {
        console.error(
          '❌ JIRA comment failed:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });

  return program;
}

// CLI実行（直接実行時）
// import.meta.urlとprocess.argv[1]を正規化して比較（シンボリックリンク対応）
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
