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
 */

import { Command } from 'commander';
import { loadEnv } from '../../scripts/utils/env-loader.js';
import { getMichiVersion } from './cli/version.js';

// Command imports (will be migrated to ./commands/ in Phase 5, Tasks 6.2-6.4)
import { syncTasksToJIRA, JIRAClient } from '../../scripts/jira-sync.js';
import { syncToConfluence } from '../../scripts/confluence-sync.js';
import { runPhase } from '../../scripts/phase-runner.js';
import { validatePhase } from '../../scripts/validate-phase.js';
import { runPreFlightCheck } from '../../scripts/pre-flight-check.js';
import { WorkflowOrchestrator } from '../../scripts/workflow-orchestrator.js';
import { validateAndReport } from '../../scripts/utils/config-validator.js';
import { initProject } from '../commands/init.js';
import { migrate } from '../commands/migrate.js';
import { convertTasksFile } from '../../scripts/utils/tasks-converter.js';
import { isAIDLCFormat } from '../../scripts/utils/aidlc-parser.js';
import { specArchiveCommand } from '../commands/spec-archive.js';
import { specListCommand } from '../commands/spec-list.js';
import { existsSync } from 'fs';
import { safeReadFileOrThrow } from '../../scripts/utils/safe-file-reader.js';
import { join } from 'path';
import { getApprovalGates } from './cli/config.js';

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

  // Register commands
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

/**
 * Register JIRA-related commands
 */
function registerJiraCommands(program: Command): void {
  program
    .command('jira:sync')
    .description('Sync tasks.md to JIRA Epic/Stories')
    .argument('<feature>', 'Feature name')
    .action(async (feature: string) => {
      try {
        await syncTasksToJIRA(feature);
      } catch (error) {
        handleError('JIRA sync failed', error);
      }
    });

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
        const { url, email, apiToken } = getJiraCredentials();
        const client = new JIRAClient({ url, email, apiToken });
        await client.transitionIssue(issueKey, status);
      } catch (error) {
        handleError('JIRA transition failed', error);
      }
    });

  program
    .command('jira:comment')
    .description('Add comment to JIRA ticket')
    .argument('<issueKey>', 'JIRA issue key (e.g., PROJ-123)')
    .argument('<comment>', 'Comment text')
    .action(async (issueKey: string, comment: string) => {
      try {
        const { url, email, apiToken } = getJiraCredentials();
        const client = new JIRAClient({ url, email, apiToken });
        await client.addComment(issueKey, comment);
      } catch (error) {
        handleError('JIRA comment failed', error);
      }
    });
}

/**
 * Register Confluence-related commands
 */
function registerConfluenceCommands(program: Command): void {
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
 * Register phase-related commands
 */
function registerPhaseCommands(program: Command): void {
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
        handleError('Phase execution failed', error);
      }
    });

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
        process.exit(result.success ? 0 : 1);
      } catch (error) {
        handleError('Validation failed', error);
      }
    });

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
        handleError('Pre-flight check failed', error);
      }
    });
}

/**
 * Register spec-related commands
 */
function registerSpecCommands(program: Command): void {
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
 * Register workflow-related commands
 */
function registerWorkflowCommands(program: Command): void {
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
        handleError('Workflow failed', error);
      }
    });
}

/**
 * Register config-related commands
 */
function registerConfigCommands(program: Command): void {
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
        const { configValidate } = await import('../commands/config-validate.js');
        await configValidate();
        process.exit(0);
      } catch (error) {
        handleError('Security check failed', error);
      }
    });
}

/**
 * Register init and migration commands
 */
function registerInitCommands(program: Command): void {
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
 * Register multi-repo commands
 * TODO: Migrate to ./commands/multi-repo/ in Task 6.4
 */
function registerMultiRepoCommands(program: Command): void {
  program
    .command('multi-repo:init')
    .description('Initialize new Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption('--jira <KEY>', 'JIRA project key (2-10 uppercase letters)')
    .requiredOption('--confluence-space <SPACE>', 'Confluence space key')
    .action(
      async (
        projectName: string,
        options: { jira: string; confluenceSpace: string },
      ) => {
        try {
          const { multiRepoInit } = await import(
            '../commands/multi-repo-init.js'
          );
          const result = await multiRepoInit(
            projectName,
            options.jira,
            options.confluenceSpace,
          );

          console.log('');
          console.log('✅ Multi-Repoプロジェクトの初期化が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   JIRAキー: ${result.jiraKey}`);
          console.log(`   Confluenceスペース: ${result.confluenceSpace}`);
          console.log(
            `   作成されたディレクトリ数: ${result.createdDirectories.length}`,
          );
          console.log(`   作成されたファイル数: ${result.createdFiles.length}`);
          console.log('');
          console.log(
            `📁 プロジェクトディレクトリ: docs/michi/${result.projectName}/`,
          );
          console.log('');
        } catch (error) {
          handleError('Multi-Repoプロジェクトの初期化に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:add-repo')
    .description('Add repository to Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption('--name <repo-name>', 'Repository name')
    .requiredOption('--url <URL>', 'Repository URL (GitHub HTTPS format)')
    .option('--branch <branch>', 'Branch name (default: main)', 'main')
    .action(
      async (
        projectName: string,
        options: { name: string; url: string; branch: string },
      ) => {
        try {
          const { multiRepoAddRepo } = await import(
            '../commands/multi-repo-add-repo.js'
          );
          const result = await multiRepoAddRepo(
            projectName,
            options.name,
            options.url,
            options.branch,
          );

          console.log('');
          console.log('✅ リポジトリの追加が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   リポジトリ名: ${result.repositoryName}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   ブランチ: ${result.branch}`);
          console.log('');
        } catch (error) {
          handleError('リポジトリの追加に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:list')
    .description('List Multi-Repo projects')
    .action(async () => {
      try {
        const { multiRepoList } = await import(
          '../commands/multi-repo-list.js'
        );
        const result = await multiRepoList();

        console.log('');
        if (result.totalCount === 0) {
          console.log('Multi-Repoプロジェクトは登録されていません');
          console.log('');
          return;
        }

        console.log(`Multi-Repoプロジェクト一覧 (${result.totalCount}件)`);
        console.log('');

        result.projects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   JIRA Key: ${project.jiraKey}`);
          console.log(`   リポジトリ数: ${project.repositoryCount}`);
          console.log(`   作成日時: ${project.createdAt}`);
          console.log('');
        });
      } catch (error) {
        handleError('プロジェクト一覧の取得に失敗しました', error);
      }
    });

  program
    .command('multi-repo:ci-status')
    .description('Aggregate CI results for Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .option('--diff', 'Show diff with previous results')
    .action(
      async (projectName: string, options: { diff?: boolean }) => {
        try {
          const { multiRepoCIStatus } = await import(
            '../commands/multi-repo-ci-status.js'
          );
          const result = await multiRepoCIStatus(projectName, {
            diff: options.diff,
          });

          console.log('');
          console.log('✅ CI結果の集約が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   リポジトリ数: ${result.summary.total}`);
          console.log(`   成功: ${result.summary.success}`);
          console.log(`   失敗: ${result.summary.failure}`);
          console.log(`   実行中: ${result.summary.running}`);
          console.log(`   不明: ${result.summary.unknown}`);
          console.log('');
          console.log(`📄 出力ファイル: ${result.outputPath}`);
          console.log('');

          if (result.diff) {
            console.log('📊 差分情報:');
            if (result.diff.newFailures.length > 0) {
              console.log(
                `   🆕 新規失敗: ${result.diff.newFailures.join(', ')}`,
              );
            }
            if (result.diff.newSuccesses.length > 0) {
              console.log(
                `   ✨ 新規成功: ${result.diff.newSuccesses.join(', ')}`,
              );
            }
            if (result.diff.unchanged.length > 0) {
              console.log(
                `   ➖ 変化なし: ${result.diff.unchanged.length}件`,
              );
            }
            console.log('');
          }
        } catch (error) {
          handleError('CI結果の集約に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:confluence-sync')
    .description('Sync Multi-Repo project documents to Confluence')
    .argument('<project-name>', 'Project name')
    .option(
      '--doc-type <type>',
      'Document type to sync (requirements, architecture, sequence, strategy, ci-status, release-notes)',
    )
    .action(
      async (
        projectName: string,
        options: { docType?: string },
      ) => {
        try {
          const { multiRepoConfluenceSync } = await import(
            '../commands/multi-repo-confluence-sync.js'
          );
          const result = await multiRepoConfluenceSync(projectName, {
            docType: options.docType as
              | 'requirements'
              | 'architecture'
              | 'sequence'
              | 'strategy'
              | 'ci-status'
              | 'release-notes'
              | undefined,
          });

          console.log('');
          console.log('✅ Confluence同期が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   成功: ${result.totalSuccess}件`);
          console.log(`   失敗: ${result.totalFailed}件`);
          console.log('');

          result.syncedDocs.forEach((doc) => {
            if (doc.success) {
              console.log(`✅ ${doc.docType}: ${doc.pageUrl}`);
            } else {
              console.log(`❌ ${doc.docType}: ${doc.error}`);
            }
          });
          console.log('');
        } catch (error) {
          handleError('Confluence同期に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:test')
    .description('Run tests for Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption(
      '--type <type>',
      'Test type (e2e, integration, performance)',
    )
    .option('--skip-health-check', 'Skip health check before test execution')
    .action(
      async (
        projectName: string,
        options: { type: string; skipHealthCheck?: boolean },
      ) => {
        try {
          const { multiRepoTest } = await import(
            '../commands/multi-repo-test.js'
          );
          const result = await multiRepoTest(projectName, options.type, {
            skipHealthCheck: options.skipHealthCheck,
          });

          console.log('');
          if (result.success) {
            console.log('✅ テスト実行が完了しました');
          } else {
            console.log('❌ テスト実行が失敗しました');
          }
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   テストタイプ: ${result.testType}`);
          console.log(`   終了コード: ${result.executionResult.exitCode}`);
          console.log(
            `   実行時間: ${result.executionResult.executionTime.toFixed(2)}秒`,
          );
          console.log('');
          console.log(`📄 出力ファイル: ${result.executionResult.outputPath}`);
          console.log('');

          if (result.healthCheckWarning) {
            console.log('⚠️  ヘルスチェック警告:');
            console.log(`   ${result.healthCheckWarning}`);
            console.log('');
          }

          process.exit(result.success ? 0 : 1);
        } catch (error) {
          handleError('テスト実行に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:sync')
    .description('Sync Multi-Repo project documentation to Confluence')
    .argument('<project-name>', 'Project name')
    .option(
      '--doc-type <type>',
      'Document type (requirements, architecture, sequence, strategy, ci-status, release-notes)',
    )
    .action(
      async (projectName: string, options: { docType?: string }) => {
        try {
          const { multiRepoConfluenceSync } = await import(
            '../commands/multi-repo-confluence-sync.js'
          );
          const result = await multiRepoConfluenceSync(projectName, {
            docType: options.docType as
              | 'requirements'
              | 'architecture'
              | 'sequence'
              | 'strategy'
              | 'ci-status'
              | 'release-notes'
              | undefined,
          });

          console.log('');
          console.log('✅ Confluence同期が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   成功: ${result.totalSuccess}`);
          console.log(`   失敗: ${result.totalFailed}`);
          console.log('');

          if (result.totalSuccess > 0) {
            console.log('📄 同期されたドキュメント:');
            result.syncedDocs
              .filter((d) => d.success)
              .forEach((doc) => {
                console.log(`   ✅ ${doc.docType}: ${doc.pageUrl}`);
              });
            console.log('');
          }

          if (result.totalFailed > 0) {
            console.log('❌ 同期に失敗したドキュメント:');
            result.syncedDocs
              .filter((d) => !d.success)
              .forEach((doc) => {
                console.log(`   ❌ ${doc.docType}: ${doc.error}`);
              });
            console.log('');
          }

          process.exit(result.totalFailed > 0 ? 1 : 0);
        } catch (error) {
          handleError('Confluence同期に失敗しました', error);
        }
      },
    );
}

// Helper functions

/**
 * Get JIRA credentials from environment
 */
function getJiraCredentials(): { url: string; email: string; apiToken: string } {
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

  return { url, email, apiToken };
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
