/**
 * setup-existing command
 * 既存プロジェクトにMichiワークフローを追加するコマンド
 *
 * 使い方:
 * npx @sk8metal/michi-cli setup-existing --cursor --lang ja
 * npm run michi:setup:cursor
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

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupOptions {
  cursor?: boolean;
  claude?: boolean;
  claudeAgent?: boolean; // camelCase
  gemini?: boolean;
  codex?: boolean;
  cline?: boolean;
  lang?: string;
  projectName?: string; // camelCase
  jiraKey?: string; // camelCase
  withAgentSkills?: boolean; // camelCase
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
  if (/[/\\]/.test(trimmed)) {
    throw new Error(
      'プロジェクト名にパス区切り文字（/ または \\）は使用できません',
    );
  }

  // 相対パス攻撃対策
  if (/^\.\.?$|^\.\.?\//.test(trimmed)) {
    throw new Error('プロジェクト名に相対パス（. または ..）は使用できません');
  }

  // 制御文字対策
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

  // JIRAキー形式: 2-10文字の大文字英字
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
 * 環境を決定（オプションまたは対話的）
 */
async function determineEnvironment(
  options: SetupOptions,
): Promise<Environment> {
  if (options.cursor) return 'cursor';
  if (options.claude) return 'claude';
  if (options.claudeAgent) return 'claude-agent';
  if (options.gemini) return 'gemini';
  if (options.codex) return 'codex';
  if (options.cline) return 'cline';

  console.log('');
  console.log('環境を選択してください:');
  console.log('  1) Cursor IDE (推奨)');
  console.log('  2) Claude Code');
  console.log('  3) Claude Code Subagents');
  console.log('  4) Gemini CLI');
  console.log('  5) Codex CLI');
  console.log('  6) Cline');
  console.log('');

  const choice = await prompt('選択 [1-6] (デフォルト: 1): ');

  switch (choice || '1') {
  case '1':
    return 'cursor';
  case '2':
    return 'claude';
  case '3':
    return 'claude-agent';
  case '4':
    return 'gemini';
  case '5':
    return 'codex';
  case '6':
    return 'cline';
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
  if (projectName === undefined) {
    console.log('');
    projectName = await prompt('プロジェクト名（例: プロジェクトA）: ');
  }

  // バリデーション
  projectName = validateProjectName(projectName || '');

  // JIRAキー（対話的プロンプト）
  let jiraKey = options.jiraKey;
  if (jiraKey === undefined) {
    jiraKey = await prompt('JIRAプロジェクトキー（例: PRJA）: ');
  }

  // バリデーション
  jiraKey = validateJiraKey(jiraKey || '');

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
    langCode,
  };
}

/**
 * テンプレートディレクトリのパスを解決
 */
function resolveTemplatesDir(): string {
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
      if (process.env.DEBUG) {
        console.log(
          `📋 Template path resolved: ${candidate.path} (${candidate.description})`,
        );
      }
      return candidate.path;
    }
  }

  // エラー時は試行したパスを表示
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
    console.warn('⚠️  Warning: Not a Git repository');
    console.warn(`   Directory: ${repoRoot}`);
    console.warn(
      '   Recommendation: Run "git init" to initialize a repository',
    );
    console.warn('   Continuing without Git...');
    console.log('');
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
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    if (repoUrl.startsWith('git@github.com:')) {
      repoUrl = repoUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
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
    description: `${config.projectName}の開発`,
  };

  try {
    writeFileSync(
      '.kiro/project.json',
      JSON.stringify(projectJson, null, 2),
      'utf-8',
    );
    console.log('   ✅ project.json created');
  } catch (error) {
    throw new Error(
      `Failed to write project.json: ${error instanceof Error ? error.message : error}`,
    );
  }

  // Codex環境の場合: cc-sddのインストールを促す
  if (config.environment === 'codex') {
    console.log('\n📦 Step 3: Setting up Codex CLI integration...');
    console.log('');
    console.log('⚠️  Codex CLIではcc-sddのインストールが必要です:');
    console.log('');
    console.log('   npx cc-sdd@latest --codex --lang ja');
    console.log('');
    console.log('このコマンドにより以下がインストールされます:');
    console.log('  - 11個の /kiro:* コマンド (.codex/commands/)');
    console.log('  - AGENTS.md (.codex/docs/)');
    console.log('  - .kiro/ ディレクトリ構造');
    console.log('');

    const shouldInstall = await prompt(
      '今すぐcc-sddをインストールしますか？ [Y/n]: ',
    );

    if (shouldInstall.toLowerCase() !== 'n') {
      console.log('\n🚀 Installing cc-sdd...');
      try {
        execSync('npx cc-sdd@latest --codex --lang ja', {
          stdio: 'inherit',
          cwd: currentDir,
        });
        console.log('✅ cc-sdd installed successfully');
      } catch (error) {
        console.error('❌ cc-sdd installation failed');
        console.error(
          '   Please run manually: npx cc-sdd@latest --codex --lang ja',
        );
        throw error;
      }
    } else {
      console.log('⚠️  cc-sddをスキップしました');
      console.log(
        '   後で手動で実行してください: npx cc-sdd@latest --codex --lang ja',
      );
    }
  }

  // 環境別テンプレートのコピーとレンダリング
  console.log('\n📋 Step 3: Copying and rendering templates...');

  const envConfig = getEnvironmentConfig(config.environment);
  const templateContext = createTemplateContext(
    config.langCode,
    '.kiro',
    envConfig.rulesDir.startsWith('.')
      ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1))
      : envConfig.rulesDir.split('/')[0],
  );

  const templateSourceDir = join(templatesDir, envConfig.templateSource);

  if (!existsSync(templateSourceDir)) {
    console.log(`   ⚠️  Template source not found: ${templateSourceDir}`);
  } else {
    // rulesディレクトリ（環境別にテンプレートディレクトリ名が異なる）
    // cursor/claude: 'rules', claude-agent: 'agents'
    const templateDirName =
      config.environment === 'claude-agent' ? 'agents' : 'rules';
    const rulesTemplateDir = join(templateSourceDir, templateDirName);
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
      copyAndRenderTemplates(
        commandsTemplateDir,
        commandsDestDir,
        templateContext,
      );
      console.log(`   ✅ Commands copied to ${envConfig.commandsDir}`);
    }
  }

  // Steeringテンプレートをコピー（Michiリポジトリから）
  console.log('\n📚 Step 4: Copying steering templates...');
  const michiSteeringDir = join(templatesDir, '..', '.kiro', 'steering');
  if (existsSync(michiSteeringDir)) {
    try {
      cpSync(michiSteeringDir, join(currentDir, '.kiro/steering'), {
        recursive: true,
      });
      console.log('   ✅ Steering templates copied');
    } catch (error) {
      throw new Error(
        `Failed to copy steering templates: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else {
    console.log('   ⚠️  Steering templates not found (skipped)');
  }

  // Codex環境の場合: Michi独自の拡張ファイルをコピー
  if (config.environment === 'codex') {
    console.log('\n🎯 Step 4.1: Installing Michi extensions for Codex...');

    // 1. Confluence同期プロンプトをコピー
    const confluenceSyncSource = join(
      templatesDir,
      'codex/prompts/confluence-sync.md',
    );
    const codexPromptsDir = join(currentDir, '.codex/prompts');

    if (existsSync(confluenceSyncSource)) {
      try {
        mkdirSync(codexPromptsDir, { recursive: true });
        cpSync(
          confluenceSyncSource,
          join(codexPromptsDir, 'confluence-sync.md'),
        );
        console.log('   ✅ Confluence sync command installed');
        console.log(
          '      Usage: /prompts:confluence-sync FEATURE=<機能名>',
        );
      } catch (error) {
        console.warn('   ⚠️  Failed to copy confluence-sync.md');
        if (error instanceof Error && error.message) {
          console.warn(`   Reason: ${error.message}`);
        }
      }
    } else {
      console.log(
        `   ⚠️  Confluence sync template not found: ${confluenceSyncSource}`,
      );
    }

    // 2. AGENTS.override.mdをプロジェクトルートにコピー
    const agentsOverrideSource = join(
      templatesDir,
      'codex/AGENTS.override.md',
    );
    const agentsOverrideDest = join(currentDir, 'AGENTS.override.md');

    if (existsSync(agentsOverrideSource)) {
      try {
        cpSync(agentsOverrideSource, agentsOverrideDest);
        console.log('   ✅ AGENTS.override.md installed');
        console.log('      (Michi-specific rules added to Codex AGENTS.md)');
      } catch (error) {
        console.warn('   ⚠️  Failed to copy AGENTS.override.md');
        if (error instanceof Error && error.message) {
          console.warn(`   Reason: ${error.message}`);
        }
      }
    } else {
      console.log(
        `   ⚠️  AGENTS.override.md template not found: ${agentsOverrideSource}`,
      );
    }

    console.log('');
    console.log('📝 Codex extensions summary:');
    console.log('  ✓ cc-sdd provides: /kiro:* commands (11 total)');
    console.log('  ✓ Michi adds: /prompts:confluence-sync command');
    console.log('  ✓ Michi adds: AGENTS.override.md (project-specific rules)');
  }

  // Specテンプレートをコピー
  console.log('\n📄 Step 5: Copying spec templates...');
  const michiSpecTemplatesDir = join(
    templatesDir,
    '..',
    '.kiro',
    'settings',
    'templates',
  );
  if (existsSync(michiSpecTemplatesDir)) {
    try {
      cpSync(
        michiSpecTemplatesDir,
        join(currentDir, '.kiro/settings/templates'),
        { recursive: true },
      );
      console.log('   ✅ Spec templates copied');
    } catch (error) {
      throw new Error(
        `Failed to copy spec templates: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else {
    console.log('   ⚠️  Spec templates not found (skipped)');
  }

  // Specルールをコピー
  const michiSpecRulesDir = join(
    templatesDir,
    '..',
    '.kiro',
    'settings',
    'rules',
  );
  if (existsSync(michiSpecRulesDir)) {
    try {
      cpSync(michiSpecRulesDir, join(currentDir, '.kiro/settings/rules'), {
        recursive: true,
      });
      console.log('   ✅ Spec rules copied');
    } catch (error) {
      throw new Error(
        `Failed to copy spec rules: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else {
    console.log('   ⚠️  Spec rules not found (skipped)');
  }

  // kiro-spec-tasksテンプレートを上書き（cc-sddのAI-DLC形式をMichiワークフロー形式に置換）
  console.log('\n📋 Step 5.1: Overriding kiro-spec-tasks template...');
  const kiroSpecTasksSource = join(
    templatesDir,
    envConfig.templateSource,
    'commands',
    'kiro',
    'kiro-spec-tasks.md',
  );
  const kiroSpecTasksDest = join(currentDir, '.kiro', 'commands', 'kiro');

  if (existsSync(kiroSpecTasksSource)) {
    try {
      mkdirSync(kiroSpecTasksDest, { recursive: true });
      cpSync(
        kiroSpecTasksSource,
        join(kiroSpecTasksDest, 'kiro-spec-tasks.md'),
      );
      console.log(
        '   ✅ kiro-spec-tasks.md overridden with Michi workflow format',
      );
      console.log(
        '      (This ensures /kiro:spec-tasks generates Phase-based tasks.md)',
      );
    } catch (error) {
      throw new Error(
        `Failed to copy kiro-spec-tasks template: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else {
    console.log(
      `   ⚠️  kiro-spec-tasks template not found: ${kiroSpecTasksSource}`,
    );
    console.log('      (cc-sdd default template will be used)');
  }

  // .env 対話的設定
  console.log('\n🔐 Step 6: Configuring environment variables...');

  const envConfigPath = '.env';

  // 動的インポート（env-config.tsが新規作成されたため）
  const { parseEnvFile, configureEnvInteractive, generateEnvContent } =
    await import('../../scripts/utils/env-config.js');

  let existingEnvValues: Map<string, string> | undefined;

  if (existsSync(envConfigPath)) {
    console.log('   ℹ️  既存の .env ファイルを検出しました');
    existingEnvValues = parseEnvFile(envConfigPath);

    const overwrite = await prompt(
      '既存値を表示して上書き確認しますか？ [Y/n]: ',
    );
    if (overwrite.toLowerCase() !== 'n') {
      // 対話的設定を実行
      const newEnvValues = await configureEnvInteractive(
        existingEnvValues,
        config.jiraKey,
        repoUrl,
      );
      const envContent = generateEnvContent(newEnvValues);
      try {
        writeFileSync(envConfigPath, envContent, 'utf-8');
        chmodSync(envConfigPath, 0o600);
        console.log('   ✅ .env updated (permissions: 600)');
      } catch (error) {
        throw new Error(
          `Failed to update .env: ${error instanceof Error ? error.message : error}`,
        );
      }
    } else {
      console.log('   ℹ️  .env file kept unchanged');
    }
  } else {
    // 新規作成の場合
    // テスト環境かどうかを判定（process.env.NODE_ENVまたはプロセスが対話的かどうか）
    const isInteractive =
      process.stdin.isTTY && process.env.NODE_ENV !== 'test';

    if (isInteractive) {
      // 対話的環境では、ユーザーに確認
      const shouldConfigure = await prompt(
        '.env を対話的に設定しますか？ [Y/n]: ',
      );
      if (shouldConfigure.toLowerCase() !== 'n') {
        const newEnvValues = await configureEnvInteractive(
          undefined,
          config.jiraKey,
          repoUrl,
        );
        const envContent = generateEnvContent(newEnvValues);
        try {
          writeFileSync(envConfigPath, envContent, 'utf-8');
          chmodSync(envConfigPath, 0o600);
          console.log('   ✅ .env created (permissions: 600)');
        } catch (error) {
          throw new Error(
            `Failed to create .env: ${error instanceof Error ? error.message : error}`,
          );
        }
        return; // 早期リターン
      }
    }

    // 非対話的環境、またはユーザーが'n'と答えた場合: テンプレート作成
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
    try {
      writeFileSync(envConfigPath, envTemplate, 'utf-8');
      chmodSync(envConfigPath, 0o600);
      console.log('   ✅ .env template created (permissions: 600)');
    } catch (error) {
      throw new Error(
        `Failed to write .env template: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  // .gitignore 更新
  console.log('\n📝 Step 7: Updating .gitignore...');

  const gitignorePath = join(repoRoot, '.gitignore');
  let gitignoreContent = '';

  if (existsSync(gitignorePath)) {
    try {
      gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    } catch (error) {
      console.warn('   ⚠️  Warning: Failed to read .gitignore');
      if (error instanceof Error && error.message) {
        console.warn(`   Reason: ${error.message}`);
      }
    }
  }

  const entriesToAdd = [
    '# Environment variables',
    '.env',
    '.env.local',
    '.env.*.local',
  ];

  let modified = false;
  const lines = gitignoreContent.split('\n').map((l) => l.trim());

  for (const entry of entriesToAdd) {
    if (!lines.includes(entry.trim())) {
      if (!modified) {
        gitignoreContent += '\n\n# Added by michi setup\n';
        modified = true;
      }
      gitignoreContent += entry + '\n';
    }
  }

  if (modified) {
    try {
      writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
      console.log('   ✅ .gitignore updated');
    } catch (error) {
      console.warn('   ⚠️  Warning: Failed to update .gitignore');
      if (error instanceof Error && error.message) {
        console.warn(`   Reason: ${error.message}`);
      }
      console.warn('   Please manually add .env to .gitignore');
    }
  } else {
    console.log('   ℹ️  .gitignore already contains .env entries');
  }

  // スキル/サブエージェントのインストール（オプション）
  if (
    options.withAgentSkills &&
    (config.environment === 'claude' || config.environment === 'claude-agent')
  ) {
    console.log('\n🎯 Step 7.5: Installing skills and agents...');

    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      console.warn('   ⚠️  Warning: Could not determine home directory');
    } else {
      const claudeSkillsDir = join(homeDir, '.claude', 'skills');
      const claudeAgentsDir = join(homeDir, '.claude', 'agents');

      // スキルのコピー
      const skillsTemplateDir = join(templatesDir, 'claude', 'skills');
      if (existsSync(skillsTemplateDir)) {
        mkdirSync(claudeSkillsDir, { recursive: true });
        cpSync(skillsTemplateDir, claudeSkillsDir, { recursive: true });
        console.log(`   ✅ Skills installed to ${claudeSkillsDir}`);
      } else {
        console.warn(`   ⚠️  Skills template not found: ${skillsTemplateDir}`);
      }

      // サブエージェントのコピー
      const agentsTemplateDir = join(templatesDir, 'claude', 'agents');
      if (existsSync(agentsTemplateDir)) {
        mkdirSync(claudeAgentsDir, { recursive: true });
        cpSync(agentsTemplateDir, claudeAgentsDir, { recursive: true });
        console.log(`   ✅ Agents installed to ${claudeAgentsDir}`);
      } else {
        console.warn(
          `   ⚠️  Agents template not found: ${agentsTemplateDir}`,
        );
      }
    }
  }

  // セットアップバリデーション
  console.log('\n🔍 Step 8: Validating setup...');

  const expectedFiles = [
    '.kiro/settings/templates/specs/tasks.md',
    '.kiro/settings/templates/specs/requirements.md',
    '.kiro/settings/templates/specs/design.md',
    '.kiro/settings/rules/tasks-generation.md',
  ];

  const missingFiles = expectedFiles.filter(
    (f) => !existsSync(join(currentDir, f)),
  );
  if (missingFiles.length > 0) {
    console.log(
      '   ⚠️  Some template files not found (will be created by cc-sdd):',
    );
    missingFiles.forEach((f) => console.log(`      - ${f}`));
  } else {
    console.log('   ✅ All template files present');
  }

  // 完了メッセージ（環境別）
  console.log('\n');
  console.log('🎉 セットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('  1. .env ファイルの内容を確認（必要に応じて追加編集）');
  console.log(
    '  2. npm install で依存関係をインストール（リポジトリルートで実行）',
  );

  // 環境別のメッセージ
  switch (config.environment) {
  case 'cursor':
    console.log('  3. Cursor で開く: cursor .');
    console.log('  4. Cursorを起動したら ~/.cursor/mcp.json の設定を確認');
    console.log(
      '     MCP設定の詳細: https://github.com/sk8metalme/michi/issues',
    );
    console.log('     （環境別MCP設定の対話的セットアップ機能は開発中）');
    console.log('  5. /kiro:spec-init <機能説明> で開発開始');
    break;

  case 'claude':
    console.log('  3. Claude Code で開く');
    console.log('  4. .claude/rules/ のルールファイルを確認');
    console.log('  5. Claude Code コマンドで開発開始');
    break;

  case 'claude-agent':
    console.log('  3. Claude Code で開く');
    console.log('  4. .claude/agents/ のサブエージェントを確認');
    console.log('  5. サブエージェントを活用して開発開始');
    break;

  case 'gemini':
    console.log('  3. Gemini CLI で開く');
    console.log('  4. .gemini/GEMINI.md のプロジェクトコンテキストを確認');
    console.log('  5. Gemini CLI コマンドで開発開始');
    console.log('     （階層的コンテキストロード機能を活用）');
    break;

  case 'codex':
    console.log('  3. cc-sddとMichi拡張の統合を確認');
    console.log('     - cc-sdd: /kiro:* コマンド（11個）');
    console.log('     - Michi: /prompts:confluence-sync コマンド');
    console.log('     - Michi: AGENTS.override.md（Michi固有ルール）');
    console.log('  4. 開発開始:');
    console.log('     /kiro:spec-init FEATURE=<機能名>');
    console.log('     /kiro:spec-requirements FEATURE=<機能名>');
    console.log('     /kiro:spec-design FEATURE=<機能名>');
    console.log('     /prompts:confluence-sync FEATURE=<機能名>');
    console.log('  5. 環境変数の設定（Confluence連携用）:');
    console.log('     ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN');
    break;

  case 'cline':
    console.log('  3. VSCode + Cline 拡張で開く');
    console.log('  4. .clinerules/rules/ のルールファイルを確認');
    console.log('  5. Clineのルールトグル機能（v3.13+）を活用');
    console.log('     （各ルールファイルを個別に有効/無効化可能）');
    break;

  default:
    console.log('  3. AI開発環境で開く');
    console.log('  4. 生成されたルールファイルを確認');
    console.log('  5. 開発開始');
  }

  console.log('');
  console.log('詳細: https://github.com/sk8metalme/michi');
  console.log('');
}
