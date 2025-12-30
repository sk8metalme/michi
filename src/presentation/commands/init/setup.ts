/**
 * init command - Setup execution logic
 * セットアップ実行ロジック（ディレクトリ作成、メタデータ、ワークフロー設定）
 */

import {
  mkdirSync,
  writeFileSync,
  existsSync,
  chmodSync,
  cpSync,
} from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';
import {
  getConfluenceConfig,
  getJiraConfig,
  getWorkflowConfig,
} from '../../../../scripts/utils/config-sections.js';
import { getGlobalConfigPath } from '../../../../scripts/utils/config-loader.js';
import type { InitConfig } from './prompts.js';

/**
 * .kiro ディレクトリ構造を作成
 */
export function createKiroDirectories(): void {
  console.log('\n📁 Step 1: Creating .kiro directory structure...');
  mkdirSync('.kiro/settings/templates', { recursive: true });
  mkdirSync('.kiro/steering', { recursive: true });
  mkdirSync('.kiro/specs', { recursive: true });
  console.log('   ✅ Directory structure created');
}

/**
 * プロジェクトメタデータを作成
 */
export function createProjectMetadata(
  config: InitConfig,
  repoRoot: string,
): void {
  console.log('\n📝 Step 2: Creating project metadata...');

  // GitHub URLを取得
  let repoUrl = '';
  try {
    repoUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf-8',
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    if (repoUrl.startsWith('git@github.com:')) {
      repoUrl = repoUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
    } else if (repoUrl.endsWith('.git')) {
      repoUrl = repoUrl.replace('.git', '');
    }
  } catch {
    repoUrl = `https://github.com/org/${config.projectId}`;
  }

  // Confluenceラベル生成
  const labels = (() => {
    const projectLabel = config.projectId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const labelSet = new Set([`project:${projectLabel}`]);

    if (config.projectId.includes('-')) {
      const parts = config.projectId.split('-');
      const servicePart = parts[parts.length - 1];
      const serviceLabel = servicePart.toLowerCase().replace(/[^a-z0-9-]/g, '');

      if (serviceLabel !== projectLabel) {
        labelSet.add(`service:${serviceLabel}`);
      }
    }

    return Array.from(labelSet);
  })();

  const projectJson = {
    projectId: config.projectId,
    projectName: config.projectName,
    language: config.langCode,
    jiraProjectKey: config.jiraKey,
    confluenceLabels: labels,
    status: 'active',
    team: [],
    stakeholders: ['@企画', '@部長'],
    repository: repoUrl,
    description: `${config.projectName}の開発`,
  };

  writeFileSync(
    '.kiro/project.json',
    JSON.stringify(projectJson, null, 2) + '\n',
    'utf-8',
  );
  console.log('   ✅ project.json created');
}

/**
 * .env テンプレートを作成
 */
export function createEnvTemplate(config: InitConfig): void {
  console.log('\n🔐 Step 3: Creating .env template...');

  if (!existsSync('.env')) {
    const envTemplate = `# Atlassian設定（MCP + REST API共通）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRAプロジェクトキー
JIRA_PROJECT_KEYS=${config.jiraKey}

# JIRA Issue Type IDs（JIRAインスタンス固有 - 必須）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
`;

    writeFileSync('.env', envTemplate, 'utf-8');
    chmodSync('.env', 0o600);
    console.log('   ✅ .env template created (permissions: 600)');
  } else {
    console.log('   ℹ️  .env already exists (skipped)');
  }
}

/**
 * ワークフロー設定を作成
 */
export async function setupWorkflowConfig(
  config: InitConfig,
  repoRoot: string,
): Promise<void> {
  const globalConfigPath = getGlobalConfigPath();
  const projectConfigPath = join(repoRoot, '.michi', 'config.json');

  // グローバル設定が存在する場合
  if (existsSync(globalConfigPath)) {
    mkdirSync(dirname(projectConfigPath), { recursive: true });
    cpSync(globalConfigPath, projectConfigPath);
    console.log('   ✅ グローバル設定をコピーしました: ~/.michi/config.json → .michi/config.json');
    console.log('      プロジェクト固有のカスタマイズが必要な場合は .michi/config.json を編集してください。');
    return;
  }

  // グローバル設定がない場合
  console.log('   ℹ️  グローバル設定が見つかりません。');

  if (config.interactive) {
    // 対話的に設定を作成
    console.log('   対話的に設定を作成します。');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const confluenceConfig = await getConfluenceConfig(rl);
      const jiraConfig = await getJiraConfig(rl);
      const workflowConfig = await getWorkflowConfig(rl);

      const projectConfig = {
        confluence: confluenceConfig,
        jira: jiraConfig,
        workflow: workflowConfig,
      };

      mkdirSync(dirname(projectConfigPath), { recursive: true });
      writeFileSync(
        projectConfigPath,
        JSON.stringify(projectConfig, null, 2) + '\n',
        'utf-8',
      );
      console.log('   ✅ .michi/config.json created');
    } finally {
      rl.close();
    }
  } else {
    // デフォルト設定で作成
    const defaultConfig = {
      confluence: {
        pageCreationGranularity: 'single',
      },
      jira: {
        createEpic: true,
        storyCreationGranularity: 'all',
        storyPoints: 'auto',
      },
      workflow: {
        enabledPhases: ['requirements', 'design', 'tasks'],
      },
    };

    mkdirSync(dirname(projectConfigPath), { recursive: true });
    writeFileSync(
      projectConfigPath,
      JSON.stringify(defaultConfig, null, 2) + '\n',
      'utf-8',
    );
    console.log('   ✅ .michi/config.json created (default settings)');
  }
}

/**
 * 完了メッセージを表示
 */
export function displayCompletionMessage(config: InitConfig): void {
  console.log('\n');
  console.log('🎉 セットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('  1. .env ファイルの内容を確認・編集');

  if (!config.skipWorkflowConfig) {
    console.log('  2. .michi/config.json の内容を確認（必要に応じて編集）');
  }

  switch (config.environment) {
  case 'claude':
  case 'claude-agent':
    console.log('  3. Claude Code で開く');
    console.log('  4. /kiro:spec-init <機能説明> で開発開始');
    break;
  default:
    console.log('  3. AI開発環境で開く');
    console.log('  4. 開発開始');
  }

  console.log('');
  console.log('詳細: https://github.com/sk8metalme/michi');
  console.log('');
}
