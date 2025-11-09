#!/usr/bin/env node
/**
 * Michi CLI Tool
 * AI駆動開発ワークフロー自動化コマンドラインツール
 */

import { Command } from 'commander';
import { syncTasksToJIRA } from '../scripts/jira-sync.js';
import { syncToConfluence } from '../scripts/confluence-sync.js';
import { runPhase } from '../scripts/phase-runner.js';
import { validatePhase } from '../scripts/validate-phase.js';
import { runPreFlightCheck } from '../scripts/pre-flight-check.js';
import { listProjects } from '../scripts/list-projects.js';
import { createResourceDashboard } from '../scripts/resource-dashboard.js';
import { WorkflowOrchestrator } from '../scripts/workflow-orchestrator.js';
import { configInteractive } from '../scripts/config-interactive.js';
import { validateAndReport } from '../scripts/utils/config-validator.js';
import { config } from 'dotenv';

// 環境変数読み込み
config();

const packageJson = {
  name: '@michi/cli',
  version: '1.0.0'
};

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
  return envValue.split(',').map(role => role.trim()).filter(role => role.length > 0);
}

/**
 * CLIツールを作成
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('michi')
    .description('🛣️  Michi(道) - Managed Intelligent Comprehensive Hub for Integration')
    .version(packageJson.version);

  // jira:sync コマンド
  program
    .command('jira:sync')
    .description('Sync tasks.md to JIRA Epic/Stories')
    .argument('<feature>', 'Feature name')
    .action(async (feature: string) => {
      try {
        await syncTasksToJIRA(feature);
      } catch (error) {
        console.error('❌ JIRA sync failed:', error instanceof Error ? error.message : error);
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
        await syncToConfluence(feature, type as 'requirements' | 'design' | 'tasks' | undefined);
      } catch (error) {
        console.error('❌ Confluence sync failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // phase:run コマンド
  program
    .command('phase:run')
    .description('Run complete phase workflow')
    .argument('<feature>', 'Feature name')
    .argument('<phase>', 'Phase name (requirements, design, tasks)')
    .action(async (feature: string, phase: string) => {
      const validPhases = ['requirements', 'design', 'tasks'];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await runPhase(feature, phase as 'requirements' | 'design' | 'tasks');
        if (result.success) {
          console.log('\n✅ Phase completed');
        } else {
          console.log('\n❌ Phase incomplete (check errors above)');
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Phase execution failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // validate:phase コマンド
  program
    .command('validate:phase')
    .description('Validate phase completion')
    .argument('<feature>', 'Feature name')
    .argument('<phase>', 'Phase name (requirements, design, tasks)')
    .action(async (feature: string, phase: string) => {
      const validPhases = ['requirements', 'design', 'tasks'];
      if (!validPhases.includes(phase)) {
        console.error(`❌ Invalid phase. Must be: ${validPhases.join(', ')}`);
        process.exit(1);
      }

      try {
        const result = validatePhase(feature, phase as 'requirements' | 'design' | 'tasks');
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
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
        const result = await runPreFlightCheck(phase as 'confluence' | 'jira' | 'all');
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        console.error('❌ Pre-flight check failed:', error instanceof Error ? error.message : error);
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
        console.error('❌ Failed to list projects:', error instanceof Error ? error.message : error);
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
        console.error('❌ Failed to create dashboard:', error instanceof Error ? error.message : error);
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
          stages: ['requirements', 'design', 'tasks', 'implement', 'test', 'release'] as ('requirements' | 'design' | 'tasks' | 'implement' | 'test' | 'release')[],
          approvalGates: {
            requirements: getApprovalGates('APPROVAL_GATES_REQUIREMENTS', ['pm', 'director']),
            design: getApprovalGates('APPROVAL_GATES_DESIGN', ['architect', 'director']),
            release: getApprovalGates('APPROVAL_GATES_RELEASE', ['sm', 'director'])
          }
        };

        const orchestrator = new WorkflowOrchestrator(workflowConfig);
        await orchestrator.run();
      } catch (error) {
        console.error('❌ Workflow failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // config:interactive コマンド
  program
    .command('config:interactive')
    .alias('config:init')
    .description('Interactive configuration setup for .kiro/config.json')
    .action(async () => {
      try {
        await configInteractive();
      } catch (error) {
        console.error('❌ Configuration setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // config:validate コマンド
  program
    .command('config:validate')
    .description('Validate .kiro/config.json')
    .action(async () => {
      try {
        const valid = validateAndReport();
        process.exit(valid ? 0 : 1);
      } catch (error) {
        console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return program;
}

// CLI実行（直接実行時）
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = createCLI();
  program.parse();
}

