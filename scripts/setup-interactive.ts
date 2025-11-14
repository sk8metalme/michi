/**
 * 対話式設定ツール
 * project.jsonと.envを対話的に作成・更新
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import * as readline from 'readline';
import { findCurrentProject, findAllProjects, selectProject, findRepositoryRoot } from './utils/project-finder.js';
import type { ProjectMetadata } from './utils/project-meta.js';

/**
 * プロジェクトIDのバリデーション
 * パストラバーサル攻撃を防ぐため、安全な文字のみを許可
 */
function validateProjectId(projectId: string): boolean {
  // 空文字、空白のみを拒否
  if (!projectId.trim() || /^\s+$/.test(projectId)) {
    return false;
  }
  // パストラバーサル文字を拒否
  if (projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
    return false;
  }
  // 許可する文字のみ（英数字、ハイフン、アンダースコア）
  return /^[A-Za-z0-9_-]+$/.test(projectId);
}

/**
 * readlineインターフェースを作成
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 質問を表示して回答を取得
 */
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Yes/No質問
 */
async function confirm(rl: readline.Interface, prompt: string, defaultValue: boolean = true): Promise<boolean> {
  const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await question(rl, `${prompt} ${defaultText}: `);
  
  if (!answer) {
    return defaultValue;
  }
  
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * プロジェクトメタデータを対話的に取得
 */
async function getProjectMetadata(
  rl: readline.Interface,
  existingMeta: Partial<ProjectMetadata> | null,
  projectPath: string
): Promise<ProjectMetadata> {
  console.log('\n📦 プロジェクトメタデータ設定');
  console.log('='.repeat(60));
  
  // projectId
  const projectIdDefault = existingMeta?.projectId || basename(projectPath);
  const projectId = await question(
    rl,
    `プロジェクトID [${projectIdDefault}]: `
  ) || projectIdDefault;
  
  // projectName
  const projectName = await question(
    rl,
    `プロジェクト名${existingMeta?.projectName ? ` [${existingMeta.projectName}]` : ''}: `
  ) || existingMeta?.projectName || '';
  
  if (!projectName) {
    throw new Error('プロジェクト名は必須です');
  }
  
  // jiraProjectKey
  const jiraProjectKey = await question(
    rl,
    `JIRAプロジェクトキー${existingMeta?.jiraProjectKey ? ` [${existingMeta.jiraProjectKey}]` : ''}: `
  ) || existingMeta?.jiraProjectKey || '';
  
  if (!jiraProjectKey) {
    throw new Error('JIRAプロジェクトキーは必須です');
  }
  
  // confluenceLabels
  const existingLabels = existingMeta?.confluenceLabels || [];
  const labelsInput = await question(
    rl,
    `Confluenceラベル（カンマ区切り）${existingLabels.length > 0 ? ` [${existingLabels.join(', ')}]` : ''}: `
  );
  
  const confluenceLabels = labelsInput
    ? labelsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : existingLabels;
  
  // プロジェクトラベルが含まれていない場合は自動追加
  const projectLabel = `project:${projectId}`;
  if (!confluenceLabels.includes(projectLabel)) {
    confluenceLabels.unshift(projectLabel);
  }
  
  // status
  const statusChoices = [
    { value: 'active', label: 'active（開発中）' },
    { value: 'inactive', label: 'inactive（休止中）' },
    { value: 'completed', label: 'completed（完了）' }
  ];
  
  console.log('\nステータスを選択してください:');
  statusChoices.forEach((choice, index) => {
    const defaultMark = existingMeta?.status === choice.value ? ' (現在の値)' : '';
    console.log(`  ${index + 1}. ${choice.label}${defaultMark}`);
  });
  
  const statusAnswer = await question(rl, `選択 [${existingMeta?.status || 'active'}]: `);
  const statusIndex = statusAnswer ? parseInt(statusAnswer, 10) - 1 : -1;
  const status = (statusIndex >= 0 && statusIndex < statusChoices.length)
    ? statusChoices[statusIndex].value
    : (existingMeta?.status || 'active');
  
  // team
  const existingTeam = existingMeta?.team || [];
  const teamInput = await question(
    rl,
    `チームメンバー（カンマ区切り、@プレフィックス付き）${existingTeam.length > 0 ? ` [${existingTeam.join(', ')}]` : ''}: `
  );
  const team = teamInput
    ? teamInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : existingTeam;
  
  // stakeholders
  const existingStakeholders = existingMeta?.stakeholders || [];
  const stakeholdersInput = await question(
    rl,
    `ステークホルダー（カンマ区切り、@プレフィックス付き）${existingStakeholders.length > 0 ? ` [${existingStakeholders.join(', ')}]` : ''}: `
  );
  const stakeholders = stakeholdersInput
    ? stakeholdersInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : existingStakeholders;
  
  // repository
  const repository = await question(
    rl,
    `リポジトリURL${existingMeta?.repository ? ` [${existingMeta.repository}]` : ''}: `
  ) || existingMeta?.repository || '';
  
  // description
  const description = await question(
    rl,
    `説明${existingMeta?.description ? ` [${existingMeta.description}]` : ''}: `
  ) || existingMeta?.description || '';
  
  return {
    projectId,
    projectName,
    jiraProjectKey,
    confluenceLabels,
    status: status as 'active' | 'inactive' | 'completed',
    team,
    stakeholders,
    repository,
    description: description || undefined
  };
}

/**
 * 環境変数を対話的に取得
 */
async function getEnvConfig(
  rl: readline.Interface,
  existingEnv: Record<string, string> | null
): Promise<Record<string, string>> {
  console.log('\n🔐 環境変数設定');
  console.log('='.repeat(60));
  
  const env: Record<string, string> = {};
  
  // Atlassian設定
  console.log('\n📋 Atlassian設定');
  env.ATLASSIAN_URL = await question(
    rl,
    `Atlassian URL${existingEnv?.ATLASSIAN_URL ? ` [${existingEnv.ATLASSIAN_URL}]` : ''}: `
  ) || existingEnv?.ATLASSIAN_URL || '';
  
  env.ATLASSIAN_EMAIL = await question(
    rl,
    `Atlassian Email${existingEnv?.ATLASSIAN_EMAIL ? ` [${existingEnv.ATLASSIAN_EMAIL}]` : ''}: `
  ) || existingEnv?.ATLASSIAN_EMAIL || '';
  
  env.ATLASSIAN_API_TOKEN = await question(
    rl,
    `Atlassian API Token${existingEnv?.ATLASSIAN_API_TOKEN ? ` [***]` : ''}: `
  ) || existingEnv?.ATLASSIAN_API_TOKEN || '';
  
  // GitHub設定
  console.log('\n🐙 GitHub設定');
  env.GITHUB_ORG = await question(
    rl,
    `GitHub組織名${existingEnv?.GITHUB_ORG ? ` [${existingEnv.GITHUB_ORG}]` : ''}: `
  ) || existingEnv?.GITHUB_ORG || '';
  
  env.GITHUB_TOKEN = await question(
    rl,
    `GitHub Token${existingEnv?.GITHUB_TOKEN ? ` [***]` : ''}: `
  ) || existingEnv?.GITHUB_TOKEN || '';
  
  env.GITHUB_REPO = await question(
    rl,
    `GitHubリポジトリ（org/repo形式）${existingEnv?.GITHUB_REPO ? ` [${existingEnv.GITHUB_REPO}]` : ''}: `
  ) || existingEnv?.GITHUB_REPO || '';
  
  // Confluence設定
  console.log('\n📄 Confluence設定');
  env.CONFLUENCE_PRD_SPACE = await question(
    rl,
    `PRDスペースキー${existingEnv?.CONFLUENCE_PRD_SPACE ? ` [${existingEnv.CONFLUENCE_PRD_SPACE}]` : ''}: `
  ) || existingEnv?.CONFLUENCE_PRD_SPACE || '';
  
  env.CONFLUENCE_QA_SPACE = await question(
    rl,
    `QAスペースキー${existingEnv?.CONFLUENCE_QA_SPACE ? ` [${existingEnv.CONFLUENCE_QA_SPACE}]` : ''}: `
  ) || existingEnv?.CONFLUENCE_QA_SPACE || '';
  
  env.CONFLUENCE_RELEASE_SPACE = await question(
    rl,
    `RELEASEスペースキー${existingEnv?.CONFLUENCE_RELEASE_SPACE ? ` [${existingEnv.CONFLUENCE_RELEASE_SPACE}]` : ''}: `
  ) || existingEnv?.CONFLUENCE_RELEASE_SPACE || '';
  
  // JIRA設定
  console.log('\n📋 JIRA設定');
  env.JIRA_PROJECT_KEYS = await question(
    rl,
    `JIRAプロジェクトキー（カンマ区切り）${existingEnv?.JIRA_PROJECT_KEYS ? ` [${existingEnv.JIRA_PROJECT_KEYS}]` : ''}: `
  ) || existingEnv?.JIRA_PROJECT_KEYS || '';
  
  env.JIRA_ISSUE_TYPE_STORY = await question(
    rl,
    `JIRA Story Issue Type ID${existingEnv?.JIRA_ISSUE_TYPE_STORY ? ` [${existingEnv.JIRA_ISSUE_TYPE_STORY}]` : ''}: `
  ) || existingEnv?.JIRA_ISSUE_TYPE_STORY || '';
  
  env.JIRA_ISSUE_TYPE_SUBTASK = await question(
    rl,
    `JIRA Subtask Issue Type ID${existingEnv?.JIRA_ISSUE_TYPE_SUBTASK ? ` [${existingEnv.JIRA_ISSUE_TYPE_SUBTASK}]` : ''}: `
  ) || existingEnv?.JIRA_ISSUE_TYPE_SUBTASK || '';
  
  // Slack設定（オプション）
  const configureSlack = await confirm(rl, '\nSlack通知を設定しますか？', false);
  if (configureSlack) {
    env.SLACK_WEBHOOK_URL = await question(
      rl,
      `Slack Webhook URL${existingEnv?.SLACK_WEBHOOK_URL ? ` [***]` : ''}: `
    ) || existingEnv?.SLACK_WEBHOOK_URL || '';
  }
  
  return env;
}

/**
 * .envファイルを読み込む
 */
function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  
  if (!existsSync(envPath)) {
    return env;
  }
  
  try {
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // コメント行と空行をスキップ
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    }
  } catch (error) {
    // 読み込みエラーを警告として表示
    console.warn(`⚠️  .envファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return env;
}

/**
 * .envファイルを保存
 */
function saveEnvFile(envPath: string, env: Record<string, string>): void {
  const lines: string[] = [];
  
  // Atlassian設定
  lines.push('# Atlassian設定');
  lines.push(`ATLASSIAN_URL=${env.ATLASSIAN_URL || ''}`);
  lines.push(`ATLASSIAN_EMAIL=${env.ATLASSIAN_EMAIL || ''}`);
  lines.push(`ATLASSIAN_API_TOKEN=${env.ATLASSIAN_API_TOKEN || ''}`);
  lines.push('');
  
  // GitHub設定
  lines.push('# GitHub設定');
  lines.push(`GITHUB_ORG=${env.GITHUB_ORG || ''}`);
  lines.push(`GITHUB_TOKEN=${env.GITHUB_TOKEN || ''}`);
  lines.push(`GITHUB_REPO=${env.GITHUB_REPO || ''}`);
  lines.push('');
  
  // Confluence設定
  lines.push('# Confluence設定');
  lines.push(`CONFLUENCE_PRD_SPACE=${env.CONFLUENCE_PRD_SPACE || ''}`);
  lines.push(`CONFLUENCE_QA_SPACE=${env.CONFLUENCE_QA_SPACE || ''}`);
  lines.push(`CONFLUENCE_RELEASE_SPACE=${env.CONFLUENCE_RELEASE_SPACE || ''}`);
  lines.push('');
  
  // JIRA設定
  lines.push('# JIRA設定');
  lines.push(`JIRA_PROJECT_KEYS=${env.JIRA_PROJECT_KEYS || ''}`);
  lines.push('');
  lines.push('# JIRA Issue Type IDs（JIRAインスタンス固有の値 - 必須）');
  lines.push(`JIRA_ISSUE_TYPE_STORY=${env.JIRA_ISSUE_TYPE_STORY || ''}`);
  lines.push(`JIRA_ISSUE_TYPE_SUBTASK=${env.JIRA_ISSUE_TYPE_SUBTASK || ''}`);
  lines.push('');
  
  // Slack設定（オプション）
  if (env.SLACK_WEBHOOK_URL) {
    lines.push('# Slack通知（オプション）');
    lines.push(`SLACK_WEBHOOK_URL=${env.SLACK_WEBHOOK_URL}`);
    lines.push('');
  }
  
  writeFileSync(envPath, lines.join('\n'), 'utf-8');
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  const rl = createInterface();
  
  try {
    console.log('🎨 Michi プロジェクト設定ツール');
    console.log('='.repeat(60));
    console.log('このツールで project.json と .env を対話的に設定できます。\n');
    
    // リポジトリルートを検出
    const repoRoot = findRepositoryRoot();
    const projectsDir = join(repoRoot, 'projects');
    
    // プロジェクト検出
    const currentProject = findCurrentProject();
    const allProjects = findAllProjects();
    
    let projectPath: string;
    let existingMeta: Partial<ProjectMetadata> | null = null;
    let isNewProject = false;
    
    if (allProjects.length === 0) {
      // プロジェクトが見つからない場合、新規プロジェクトを作成
      // プロジェクトIDを取得（ディレクトリ名から推測、または対話的に入力）
      const defaultProjectId = basename(repoRoot);
      let projectId: string;
      let isValid = false;
      
      while (!isValid) {
        const projectIdInput = await question(
          rl,
          `新規プロジェクトID [${defaultProjectId}]: `
        );
        projectId = projectIdInput.trim() || defaultProjectId;
        
        if (validateProjectId(projectId)) {
          isValid = true;
        } else {
          console.log('❌ 無効なプロジェクトIDです。英数字、ハイフン、アンダースコアのみ使用できます。');
        }
      }
      
      // projects/{project-id}/配下に作成
      projectPath = join(projectsDir, projectId!);
      isNewProject = true;
      
      console.log(`\n📁 新規プロジェクトを作成します: ${projectPath}\n`);
    } else if (allProjects.length === 1) {
      // 1つのプロジェクトのみ
      projectPath = allProjects[0].path;
      console.log(`📦 プロジェクト: ${allProjects[0].projectName} (${allProjects[0].projectId})`);
      console.log(`📁 パス: ${projectPath}\n`);
      
      // 既存のproject.jsonを読み込む
      const projectJsonPath = join(projectPath, '.kiro', 'project.json');
      if (existsSync(projectJsonPath)) {
        try {
          const content = readFileSync(projectJsonPath, 'utf-8');
          existingMeta = JSON.parse(content);
        } catch (error) {
          // 読み込みエラーは無視
        }
      }
    } else {
      // 複数プロジェクトが見つかった場合、選択
      const selected = await selectProject(allProjects, question.bind(null, rl));
      if (!selected) {
        console.log('プロジェクトが選択されませんでした。');
        process.exit(0);
      }
      
      projectPath = selected.path;
      console.log(`\n📦 選択されたプロジェクト: ${selected.projectName} (${selected.projectId})`);
      console.log(`📁 パス: ${projectPath}\n`);
      
      // 既存のproject.jsonを読み込む
      const projectJsonPath = join(projectPath, '.kiro', 'project.json');
      if (existsSync(projectJsonPath)) {
        try {
          const content = readFileSync(projectJsonPath, 'utf-8');
          existingMeta = JSON.parse(content);
        } catch (error) {
          // 読み込みエラーは無視
        }
      }
    }
    
    // 設定する項目を選択
    const configureProject = await confirm(rl, 'project.jsonを設定しますか？', true);
    const configureEnv = await confirm(rl, '.envを設定しますか？', true);
    
    if (!configureProject && !configureEnv) {
      console.log('設定する項目がありません。');
      process.exit(0);
    }
    
    let projectMeta: ProjectMetadata | null = null;
    let envConfig: Record<string, string> | null = null;
    
    // project.json設定
    if (configureProject) {
      projectMeta = await getProjectMetadata(rl, existingMeta, projectPath);
    }
    
    // .env設定
    if (configureEnv) {
      const envPath = join(projectPath, '.env');
      const existingEnv = loadEnvFile(envPath);
      envConfig = await getEnvConfig(rl, existingEnv);
    }
    
    // 確認
    console.log('\n📋 設定内容の確認');
    console.log('='.repeat(60));
    
    if (projectMeta) {
      console.log('\n📦 project.json:');
      console.log(JSON.stringify(projectMeta, null, 2));
    }
    
    if (envConfig) {
      console.log('\n🔐 .env:');
      // 機密情報をマスク
      const maskedEnv = { ...envConfig };
      if (maskedEnv.ATLASSIAN_API_TOKEN) {
        maskedEnv.ATLASSIAN_API_TOKEN = '***';
      }
      if (maskedEnv.GITHUB_TOKEN) {
        maskedEnv.GITHUB_TOKEN = '***';
      }
      if (maskedEnv.SLACK_WEBHOOK_URL) {
        maskedEnv.SLACK_WEBHOOK_URL = '***';
      }
      Object.entries(maskedEnv).forEach(([key, value]) => {
        if (value) {
          console.log(`${key}=${value}`);
        }
      });
    }
    
    console.log('');
    const confirmSave = await confirm(rl, 'この設定を保存しますか？', true);
    
    if (!confirmSave) {
      console.log('保存をキャンセルしました。');
      process.exit(0);
    }
    
    // 保存
    if (projectMeta) {
      // 新規プロジェクトの場合はディレクトリを作成
      if (isNewProject) {
        if (!existsSync(projectsDir)) {
          mkdirSync(projectsDir, { recursive: true });
        }
        if (!existsSync(projectPath)) {
          mkdirSync(projectPath, { recursive: true });
        }
      }
      
      const projectJsonPath = join(projectPath, '.kiro', 'project.json');
      const projectJsonDir = join(projectPath, '.kiro');
      
      if (!existsSync(projectJsonDir)) {
        mkdirSync(projectJsonDir, { recursive: true });
      }
      
      writeFileSync(projectJsonPath, JSON.stringify(projectMeta, null, 2) + '\n', 'utf-8');
      console.log(`\n✅ project.jsonを保存しました: ${projectJsonPath}`);
    }
    
    if (envConfig) {
      const envPath = join(projectPath, '.env');
      saveEnvFile(envPath, envConfig);
      console.log(`✅ .envを保存しました: ${envPath}`);
    }
    
    console.log('\n🎉 設定が完了しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { main as setupInteractive };

