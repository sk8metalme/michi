/**
 * init command
 * プロジェクト初期設定を統合したコマンド
 *
 * 使い方:
 * michi init [options]
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  chmodSync,
} from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { findRepositoryRoot } from '../../scripts/utils/project-finder.js';
import {
  type Environment,
  getEnvironmentConfig,
} from '../../scripts/constants/environments.js';
import {
  type SupportedLanguage,
  isSupportedLanguage,
} from '../../scripts/constants/languages.js';
import {
  createTemplateContext,
  renderTemplate,
} from '../../scripts/template/renderer.js';
import * as readline from 'readline';
import {
  getConfluenceConfig,
  getJiraConfig,
  getWorkflowConfig,
} from '../../scripts/utils/config-sections.js';
import { getGlobalConfigPath } from '../../scripts/utils/config-loader.js';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InitOptions {
  name?: string; // projectId
  projectName?: string;
  jiraKey?: string;
  michiPath?: string;
  skipConfig?: boolean;
  yes?: boolean;
  existing?: boolean; // 既存プロジェクトモード
  claude?: boolean;
  claudeAgent?: boolean;
  lang?: string;
}

interface InitConfig {
  projectId: string;
  projectName: string;
  jiraKey: string;
  michiPath?: string;
  environment: Environment;
  langCode: SupportedLanguage;
  skipWorkflowConfig: boolean;
  interactive: boolean;
}

/**
 * プロジェクトIDのバリデーション
 */
function validateProjectId(projectId: string): boolean {
  if (!projectId.trim() || /^\s+$/.test(projectId)) {
    return false;
  }
  if (projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(projectId);
}

/**
 * プロジェクト名のバリデーション
 */
function validateProjectName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new Error('プロジェクト名が空です');
  }
  if (trimmed.length > 100) {
    throw new Error('プロジェクト名が長すぎます（最大100文字）');
  }

  if (/[/\\]/.test(trimmed)) {
    throw new Error('プロジェクト名にパス区切り文字（/ または \\）は使用できません');
  }

  if (/^\.\.?$|^\.\.?\//.test(trimmed)) {
    throw new Error('プロジェクト名に相対パス（. または ..）は使用できません');
  }

  // eslint-disable-next-line no-control-regex
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

  if (!/^[A-Z]{2,10}$/.test(trimmed)) {
    throw new Error(
      'JIRAキーの形式が不正です（2-10文字の大文字英字のみ、例: PRJA）',
    );
  }

  return trimmed;
}

/**
 * 対話的にユーザー入力を取得
 */
async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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
 * 既存プロジェクトかどうかを検出
 */
function detectExistingProject(currentDir: string): boolean {
  const indicators = [
    'package.json',    // Node.js
    'pom.xml',         // Java/Maven
    'build.gradle',    // Java/Gradle
    'composer.json',   // PHP
  ];

  return indicators.some((file) => existsSync(join(currentDir, file)));
}

/**
 * 環境を決定（オプションまたは対話的）
 */
async function determineEnvironment(options: InitOptions): Promise<Environment> {
  if (options.claude) return 'claude';
  if (options.claudeAgent) return 'claude-agent';

  console.log('');
  console.log('環境を選択してください:');
  console.log('  1) Claude Code (推奨)');
  console.log('  2) Claude Code Subagents');
  console.log('');

  const choice = await prompt('選択 [1-2] (デフォルト: 1): ');

  switch (choice || '1') {
  case '1':
    return 'claude';
  case '2':
    return 'claude-agent';
  default:
    console.log('無効な選択です。Claude Codeを使用します。');
    return 'claude';
  }
}

/**
 * オプションから設定を構築（対話的プロンプトを含む）
 */
async function buildConfig(options: InitOptions, currentDir: string, isExistingMode: boolean): Promise<InitConfig> {
  // 環境を決定
  const environment = await determineEnvironment(options);

  // 言語コード
  const langCode = (options.lang || 'ja') as SupportedLanguage;
  if (!isSupportedLanguage(langCode)) {
    throw new Error(`Unsupported language: ${langCode}`);
  }

  // 既存プロジェクトモードの場合、ディレクトリ名をデフォルトとして使用
  const projectIdDefault = isExistingMode ? basename(currentDir) : (options.name || basename(currentDir));

  // プロジェクトID
  let projectId = options.name;
  if (!projectId && !options.yes) {
    console.log('');
    projectId = await prompt(`プロジェクトID [${projectIdDefault}]: `);
  }
  projectId = projectId || projectIdDefault;

  if (!validateProjectId(projectId)) {
    throw new Error('無効なプロジェクトIDです。英数字、ハイフン、アンダースコアのみ使用できます。');
  }

  // プロジェクト名
  let projectName = options.projectName;
  if (!projectName && !options.yes) {
    projectName = await prompt('プロジェクト名（例: プロジェクトA）: ');
  }

  if (!projectName) {
    throw new Error('プロジェクト名は必須です');
  }

  projectName = validateProjectName(projectName);

  // JIRAキー
  let jiraKey = options.jiraKey;
  if (!jiraKey && !options.yes) {
    jiraKey = await prompt('JIRAプロジェクトキー（例: PRJA）: ');
  }

  if (!jiraKey) {
    throw new Error('JIRAプロジェクトキーは必須です');
  }

  jiraKey = validateJiraKey(jiraKey);

  // 確認
  if (!options.yes) {
    console.log('');
    console.log('✅ 設定:');
    console.log(`   プロジェクトID: ${projectId}`);
    console.log(`   プロジェクト名: ${projectName}`);
    console.log(`   JIRA: ${jiraKey}`);
    console.log(`   環境: ${environment}`);
    console.log(`   言語: ${langCode}`);
    console.log('');

    const confirm = await prompt('この設定で続行しますか？ [Y/n]: ');
    if (confirm.toLowerCase() === 'n') {
      throw new Error('ユーザーによりキャンセルされました');
    }
  }

  return {
    projectId,
    projectName,
    jiraKey,
    michiPath: options.michiPath,
    environment,
    langCode,
    skipWorkflowConfig: options.skipConfig || false,
    interactive: !options.yes,
  };
}

/**
 * テンプレートディレクトリのパスを解決
 */
function resolveTemplatesDir(michiPath?: string): string {
  if (michiPath && existsSync(join(michiPath, 'templates'))) {
    return join(michiPath, 'templates');
  }

  const candidates = [
    {
      path: join(__dirname, '..', '..', '..', 'templates'),
      description: 'Production (compiled)',
    },
    {
      path: join(__dirname, '..', '..', 'templates'),
      description: 'Development (source)',
    },
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate.path)) {
      return candidate.path;
    }
  }

  const triedPaths = candidates
    .map((c) => `  - ${c.path} (${c.description})`)
    .join('\n');
  throw new Error(`Templates directory not found. Tried:\n${triedPaths}`);
}

/**
 * テンプレートをコピーしてレンダリング
 */
function copyAndRenderTemplates(
  sourceDir: string,
  destDir: string,
  context: ReturnType<typeof createTemplateContext>,
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
 * ワークフロー設定を作成
 */
async function setupWorkflowConfig(
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
 * init コマンドのメイン処理
 */
export async function initProject(options: InitOptions): Promise<void> {
  console.log('🚀 プロジェクト初期設定');
  console.log('');

  const currentDir = process.cwd();

  // 既存プロジェクトの自動検出
  let isExistingMode = options.existing || false;

  if (!isExistingMode && !options.yes && detectExistingProject(currentDir)) {
    console.log('⚠️  既存のプロジェクトが検出されました');
    console.log('   既存プロジェクトモードで初期化しますか？ (Y/n)');
    const answer = await prompt('選択: ');
    isExistingMode = answer.toLowerCase() !== 'n';
  }

  if (isExistingMode) {
    console.log('📦 既存プロジェクトモード');
  }

  // 設定を構築（対話的プロンプトを含む）
  const config = await buildConfig(options, currentDir, isExistingMode);

  console.log(`📁 現在のディレクトリ: ${currentDir}`);
  console.log(`📦 プロジェクトID: ${config.projectId}`);
  console.log('');

  // リポジトリルートを検出
  const repoRoot = findRepositoryRoot(currentDir);
  console.log(`📁 リポジトリルート: ${repoRoot}`);

  if (!repoRoot || !existsSync(repoRoot)) {
    throw new Error('リポジトリルートが見つかりません');
  }

  // Step 1: .kiro ディレクトリ作成
  console.log('\n📁 Step 1: Creating .kiro directory structure...');
  mkdirSync('.kiro/settings/templates', { recursive: true });
  mkdirSync('.kiro/steering', { recursive: true });
  mkdirSync('.kiro/specs', { recursive: true });
  console.log('   ✅ Directory structure created');

  // Step 2: プロジェクトメタデータ作成
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

  // Step 3: .env テンプレート作成
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

  // Step 4: テンプレート/ルールのコピー
  console.log('\n📋 Step 4: Copying templates and rules...');

  try {
    const templatesDir = resolveTemplatesDir(config.michiPath);
    const envConfig = getEnvironmentConfig(config.environment);
    const templateContext = createTemplateContext(
      config.langCode,
      '.kiro',
      envConfig.rulesDir.startsWith('.')
        ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1))
        : envConfig.rulesDir.split('/')[0],
    );

    const templateSourceDir = join(templatesDir, envConfig.templateSource);

    if (existsSync(templateSourceDir)) {
      // rulesディレクトリ（claude-agent環境では agents と rules の両方をコピー）
      if (config.environment === 'claude-agent') {
        // 1. agents ディレクトリをコピー
        const agentsTemplateDir = join(templateSourceDir, 'agents');
        const agentsDestDir = join(currentDir, '.claude/agents');
        if (existsSync(agentsTemplateDir)) {
          mkdirSync(agentsDestDir, { recursive: true });
          copyAndRenderTemplates(
            agentsTemplateDir,
            agentsDestDir,
            templateContext,
          );
          console.log('   ✅ Agents copied to .claude/agents');
        }

        // 2. rules ディレクトリをコピー
        const rulesTemplateDir = join(templateSourceDir, 'rules');
        const rulesDestDir = join(currentDir, '.claude/rules');
        if (existsSync(rulesTemplateDir)) {
          mkdirSync(rulesDestDir, { recursive: true });
          copyAndRenderTemplates(
            rulesTemplateDir,
            rulesDestDir,
            templateContext,
          );
          console.log('   ✅ Rules copied to .claude/rules');
        }
      } else {
        // その他の環境では従来通り rules のみコピー
        const rulesTemplateDir = join(templateSourceDir, 'rules');
        const rulesDestDir = join(currentDir, envConfig.rulesDir);
        if (existsSync(rulesTemplateDir)) {
          mkdirSync(rulesDestDir, { recursive: true });
          copyAndRenderTemplates(
            rulesTemplateDir,
            rulesDestDir,
            templateContext,
          );
          console.log(`   ✅ Rules copied to ${envConfig.rulesDir}`);
        }
      }

      // commandsディレクトリ
      const commandsTemplateDir = join(templateSourceDir, 'commands');
      const commandsDestDir = join(currentDir, envConfig.commandsDir);

      if (existsSync(commandsTemplateDir)) {
        mkdirSync(commandsDestDir, { recursive: true });
        copyAndRenderTemplates(
          commandsTemplateDir,
          commandsDestDir,
          templateContext,
        );
        console.log(`   ✅ Commands copied to ${envConfig.commandsDir}`);
      }

      // Steeringテンプレート
      const michiSteeringDir = join(templatesDir, '..', '.kiro', 'steering');
      if (existsSync(michiSteeringDir)) {
        cpSync(michiSteeringDir, join(currentDir, '.kiro/steering'), {
          recursive: true,
        });
        console.log('   ✅ Steering templates copied');
      }

      // Specテンプレート
      const michiSpecTemplatesDir = join(
        templatesDir,
        '..',
        '.kiro',
        'settings',
        'templates',
      );
      if (existsSync(michiSpecTemplatesDir)) {
        cpSync(
          michiSpecTemplatesDir,
          join(currentDir, '.kiro/settings/templates'),
          { recursive: true },
        );
        console.log('   ✅ Spec templates copied');
      }
    } else {
      console.log(`   ⚠️  Template source not found: ${templateSourceDir}`);
    }
  } catch (error) {
    console.error(
      '   ⚠️  Template copying failed:',
      error instanceof Error ? error.message : error,
    );
    console.log('   Continuing with project initialization...');
  }

  // Step 5: ワークフロー設定
  if (!config.skipWorkflowConfig) {
    console.log('\n⚙️  Step 5: Setting up workflow configuration...');
    await setupWorkflowConfig(config, repoRoot);
  } else {
    console.log('\n⚠️  Step 5: Skipped (--skip-config specified)');
  }

  // 完了メッセージ
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
