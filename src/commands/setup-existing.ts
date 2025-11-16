/**
 * setup-existing command
 * 既存プロジェクトにMichiワークフローを追加するコマンド
 * 
 * 使い方:
 * npx @sk8metal/michi-cli setup-existing --cursor --lang ja
 * npm run michi:setup:cursor
 */

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { resolve, join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { findRepositoryRoot } from '../../scripts/utils/project-finder.js';
import {
  type Environment,
  getEnvironmentConfig,
  isSupportedEnvironment
} from '../../scripts/constants/environments.js';
import {
  type SupportedLanguage,
  isSupportedLanguage
} from '../../scripts/constants/languages.js';
import {
  createTemplateContext,
  renderTemplate
} from '../../scripts/template/renderer.js';
import * as readline from 'readline';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupOptions {
  cursor?: boolean;
  claude?: boolean;
  claudeAgent?: boolean; // camelCase
  lang?: string;
  projectName?: string; // camelCase
  jiraKey?: string; // camelCase
}

interface SetupConfig {
  projectName: string;
  jiraKey: string;
  labels?: string[];
  environment: Environment;
  langCode: SupportedLanguage;
}

/**
 * プロジェクト名のバリデーション
 */
function validateProjectName(name: string): string {
  const trimmed = name.trim();
  
  // 長さチェック
  if (!trimmed || trimmed.length === 0) {
    throw new Error('プロジェクト名が空です');
  }
  if (trimmed.length > 100) {
    throw new Error('プロジェクト名が長すぎます（最大100文字）');
  }
  
  // パストラバーサル対策
  if (/[\/\\]/.test(trimmed)) {
    throw new Error('プロジェクト名にパス区切り文字（/ または \\）は使用できません');
  }
  
  // 相対パス攻撃対策
  if (/^\.\.?$|^\.\.?\//.test(trimmed)) {
    throw new Error('プロジェクト名に相対パス（. または ..）は使用できません');
  }
  
  // 制御文字対策
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new Error('プロジェクト名に制御文字は使用できません');
  }
  
  return trimmed;
}

/**
 * JIRAキーのバリデーション
 */
function validateJiraKey(key: string): string {
  const trimmed = key.trim().toUpperCase();
  
  // JIRAキー形式: 2-10文字の大文字英字
  if (!/^[A-Z]{2,10}$/.test(trimmed)) {
    throw new Error('JIRAキーの形式が不正です（2-10文字の大文字英字のみ、例: PRJA）');
  }
  
  return trimmed;
}

/**
 * 対話的にユーザー入力を取得
 */
async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    return await new Promise<string>((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * 環境を決定（オプションまたは対話的）
 */
async function determineEnvironment(options: SetupOptions): Promise<Environment> {
  if (options.cursor) return 'cursor';
  if (options.claude) return 'claude';
  if (options.claudeAgent) return 'claude-agent';

  console.log('');
  console.log('環境を選択してください:');
  console.log('  1) Cursor IDE (推奨)');
  console.log('  2) Claude Code');
  console.log('  3) Claude Code Subagents');
  console.log('');

  const choice = await prompt('選択 [1-3] (デフォルト: 1): ');
  
  switch (choice || '1') {
  case '1':
    return 'cursor';
  case '2':
    return 'claude';
  case '3':
    return 'claude-agent';
  default:
    console.log('無効な選択です。Cursor IDEを使用します。');
    return 'cursor';
  }
}

/**
 * オプションから設定を構築（対話的プロンプトを含む）
 */
async function buildConfig(options: SetupOptions): Promise<SetupConfig> {
  // 環境を決定
  const environment = await determineEnvironment(options);

  // 言語コード
  const langCode = (options.lang || 'ja') as SupportedLanguage;
  if (!isSupportedLanguage(langCode)) {
    throw new Error(`Unsupported language: ${langCode}`);
  }

  // プロジェクト名（対話的プロンプト）
  let projectName = options.projectName;
  if (!projectName) {
    console.log('');
    projectName = await prompt('プロジェクト名（例: プロジェクトA）: ');
  }
  
  // バリデーション
  try {
    projectName = validateProjectName(projectName);
  } catch (error) {
    throw new Error(`プロジェクト名が不正です: ${error instanceof Error ? error.message : error}`);
  }

  // JIRAキー（対話的プロンプト）
  let jiraKey = options.jiraKey;
  if (!jiraKey) {
    jiraKey = await prompt('JIRAプロジェクトキー（例: PRJA）: ');
  }
  
  // バリデーション
  try {
    jiraKey = validateJiraKey(jiraKey);
  } catch (error) {
    throw new Error(`JIRAキーが不正です: ${error instanceof Error ? error.message : error}`);
  }

  // 確認
  console.log('');
  console.log('✅ 設定:');
  console.log(`   プロジェクト名: ${projectName}`);
  console.log(`   JIRA: ${jiraKey}`);
  console.log(`   環境: ${environment}`);
  console.log(`   言語: ${langCode}`);
  console.log('');

  const confirm = await prompt('この設定で続行しますか？ [Y/n]: ');
  if (confirm.toLowerCase() === 'n') {
    throw new Error('ユーザーによりキャンセルされました');
  }

  return {
    projectName,
    jiraKey,
    environment,
    langCode
  };
}

/**
 * テンプレートディレクトリのパスを解決
 */
function resolveTemplatesDir(): string {
  const candidates = [
    {
      path: join(__dirname, '..', '..', '..', 'templates'),
      description: 'Production (compiled)'
    },
    {
      path: join(__dirname, '..', '..', 'templates'),
      description: 'Development (source)'
    }
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate.path)) {
      if (process.env.DEBUG) {
        console.log(`📋 Template path resolved: ${candidate.path} (${candidate.description})`);
      }
      return candidate.path;
    }
  }

  // エラー時は試行したパスを表示
  const triedPaths = candidates.map(c => `  - ${c.path} (${c.description})`).join('\n');
  throw new Error(`Templates directory not found. Tried:\n${triedPaths}`);
}

/**
 * テンプレートをコピーしてレンダリング
 */
function copyAndRenderTemplates(
  sourceDir: string,
  destDir: string,
  context: ReturnType<typeof createTemplateContext>
): void {
  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyAndRenderTemplates(sourcePath, destPath, context);
    } else if (entry.isFile()) {
      const content = readFileSync(sourcePath, 'utf-8');
      const rendered = renderTemplate(content, context);
      writeFileSync(destPath, rendered, 'utf-8');
    }
  }
}

/**
 * setup-existing コマンドのメイン処理
 */
export async function setupExisting(options: SetupOptions): Promise<void> {
  console.log('🚀 既存プロジェクトにMichiワークフローを追加');
  console.log('');

  // 設定を構築（対話的プロンプトを含む）
  const config = await buildConfig(options);

  const currentDir = process.cwd();
  const projectId = basename(currentDir);

  console.log(`📁 現在のディレクトリ: ${currentDir}`);
  console.log(`📦 プロジェクトID: ${projectId}`);
  console.log('');

  // リポジトリルートを検出
  const repoRoot = findRepositoryRoot(currentDir);
  console.log(`📁 リポジトリルート: ${repoRoot}`);
  
  // repoRootの安全性を検証
  if (!repoRoot || !existsSync(repoRoot)) {
    throw new Error('リポジトリルートが見つかりません');
  }
  
  const gitDir = join(repoRoot, '.git');
  if (!existsSync(gitDir)) {
    throw new Error(`Gitリポジトリではありません: ${repoRoot}`);
  }

  // テンプレートディレクトリを解決
  const templatesDir = resolveTemplatesDir();
  console.log(`📋 テンプレート: ${templatesDir}`);
  console.log('');

  // .kiro ディレクトリ作成
  console.log('📁 Step 1: Creating .kiro directory structure...');
  mkdirSync('.kiro/settings/templates', { recursive: true });
  mkdirSync('.kiro/steering', { recursive: true });
  mkdirSync('.kiro/specs', { recursive: true });
  console.log('   ✅ Directory structure created');

  // プロジェクトメタデータ作成
  console.log('\n📝 Step 2: Creating project metadata...');

  // GitHub URLを取得
  let repoUrl = '';
  try {
    repoUrl = execSync('git config --get remote.origin.url', { 
      encoding: 'utf-8', 
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    
    if (repoUrl.startsWith('git@github.com:')) {
      repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
    } else if (repoUrl.endsWith('.git')) {
      repoUrl = repoUrl.replace('.git', '');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not retrieve Git remote URL');
    console.warn(`   Using placeholder: https://github.com/org/${projectId}`);
    if (error instanceof Error && error.message) {
      console.warn(`   Reason: ${error.message}`);
    }
    repoUrl = `https://github.com/org/${projectId}`;
  }

  // Confluenceラベル生成
  const labels = (() => {
    const projectLabel = projectId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const labelSet = new Set([`project:${projectLabel}`]);

    if (projectId.includes('-')) {
      const parts = projectId.split('-');
      const servicePart = parts[parts.length - 1];
      const serviceLabel = servicePart.toLowerCase().replace(/[^a-z0-9-]/g, '');

      if (serviceLabel !== projectLabel) {
        labelSet.add(`service:${serviceLabel}`);
      }
    }

    return Array.from(labelSet);
  })();

  const projectJson = {
    projectId,
    projectName: config.projectName,
    language: config.langCode,
    jiraProjectKey: config.jiraKey,
    confluenceLabels: labels,
    status: 'active',
    team: [],
    stakeholders: ['@企画', '@部長'],
    repository: repoUrl,
    description: `${config.projectName}の開発`
  };

  try {
    writeFileSync('.kiro/project.json', JSON.stringify(projectJson, null, 2), 'utf-8');
    console.log('   ✅ project.json created');
  } catch (error) {
    throw new Error(`Failed to write project.json: ${error instanceof Error ? error.message : error}`);
  }

  // 環境別テンプレートのコピーとレンダリング
  console.log('\n📋 Step 3: Copying and rendering templates...');

  const envConfig = getEnvironmentConfig(config.environment);
  const templateContext = createTemplateContext(
    config.langCode,
    '.kiro',
    envConfig.rulesDir.startsWith('.') ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1)) : envConfig.rulesDir.split('/')[0]
  );

  const templateSourceDir = join(templatesDir, envConfig.templateSource);

  if (!existsSync(templateSourceDir)) {
    console.log(`   ⚠️  Template source not found: ${templateSourceDir}`);
  } else {
    // rulesディレクトリ
    const rulesTemplateDir = join(templateSourceDir, 'rules');
    const rulesDestDir = join(currentDir, envConfig.rulesDir);

    if (existsSync(rulesTemplateDir)) {
      mkdirSync(rulesDestDir, { recursive: true });
      copyAndRenderTemplates(rulesTemplateDir, rulesDestDir, templateContext);
      console.log(`   ✅ Rules copied to ${envConfig.rulesDir}`);
    }

    // commandsディレクトリ
    const commandsTemplateDir = join(templateSourceDir, 'commands');
    const commandsDestDir = join(currentDir, envConfig.commandsDir);

    if (existsSync(commandsTemplateDir)) {
      mkdirSync(commandsDestDir, { recursive: true });
      copyAndRenderTemplates(commandsTemplateDir, commandsDestDir, templateContext);
      console.log(`   ✅ Commands copied to ${envConfig.commandsDir}`);
    }
  }

  // Steeringテンプレートをコピー（Michiリポジトリから）
  console.log('\n📚 Step 4: Copying steering templates...');
  const michiSteeringDir = join(templatesDir, '..', '.kiro', 'steering');
  if (existsSync(michiSteeringDir)) {
    try {
      cpSync(michiSteeringDir, join(currentDir, '.kiro/steering'), { recursive: true });
      console.log('   ✅ Steering templates copied');
    } catch (error) {
      throw new Error(`Failed to copy steering templates: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log('   ⚠️  Steering templates not found (skipped)');
  }

  // Specテンプレートをコピー
  console.log('\n📄 Step 5: Copying spec templates...');
  const michiSpecTemplatesDir = join(templatesDir, '..', '.kiro', 'settings', 'templates');
  if (existsSync(michiSpecTemplatesDir)) {
    try {
      cpSync(michiSpecTemplatesDir, join(currentDir, '.kiro/settings/templates'), { recursive: true });
      console.log('   ✅ Spec templates copied');
    } catch (error) {
      throw new Error(`Failed to copy spec templates: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log('   ⚠️  Spec templates not found (skipped)');
  }

  // .env テンプレート作成
  console.log('\n🔐 Step 6: Creating .env template...');

  const envTemplate = `# Atlassian設定（MCP + REST API共通）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=${repoUrl.replace('https://github.com/', '')}

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

  if (!existsSync('.env')) {
    try {
      writeFileSync('.env', envTemplate, 'utf-8');
      console.log('   ✅ .env template created');
    } catch (error) {
      throw new Error(`Failed to write .env template: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log('   ℹ️  .env already exists (kept)');
  }

  // 完了メッセージ
  console.log('\n');
  console.log('🎉 セットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('  1. .env ファイルを編集して認証情報を設定');
  console.log('  2. npm install で依存関係をインストール（リポジトリルートで実行）');
  console.log('  3. Cursor で開く: cursor .');
  console.log('  4. /kiro:spec-init <機能説明> で開発開始');
  console.log('');
  console.log('詳細: https://github.com/sk8metalme/michi');
  console.log('');
}

