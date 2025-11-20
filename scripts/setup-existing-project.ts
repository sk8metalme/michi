#!/usr/bin/env tsx
/**
 * 既存プロジェクトにMichiワークフローを追加するスクリプト
 * 
 * 使い方:
 * cd /path/to/existing-repo
 * npx tsx /path/to/michi/scripts/setup-existing-project.ts \
 *   --michi-path /path/to/michi \
 *   --project-name "既存プロジェクト" \
 *   --jira-key "EXIST" \
 *   --environment cursor \
 *   --lang ja
 */

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { resolve, join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { findRepositoryRoot } from './utils/project-finder.js';
import { 
  type Environment, 
  getEnvironmentConfig, 
  isSupportedEnvironment 
} from './constants/environments.js';
import { 
  type SupportedLanguage, 
  isSupportedLanguage 
} from './constants/languages.js';
import { 
  createTemplateContext, 
  renderTemplate 
} from './template/renderer.js';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupConfig {
  michiPath: string;      // Michiリポジトリのパス
  projectName: string;    // プロジェクト表示名
  jiraKey: string;        // JIRAプロジェクトキー
  labels?: string[];      // Confluenceラベル（オプション）
  environment: Environment;   // cc-sdd環境: 'claude' | 'claude-agent' | 'cursor'
  langCode: SupportedLanguage;      // 言語コード: 'ja'
}

function parseArgs(): SetupConfig {
  const args = process.argv.slice(2);
  const config: Partial<SetupConfig> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    switch (key) {
    case 'michi-path':
      config.michiPath = value;
      break;
    case 'project-name':
      config.projectName = value;
      break;
    case 'jira-key':
      config.jiraKey = value;
      break;
    case 'environment':
      config.environment = value as Environment;
      break;
    case 'lang':
      config.langCode = value as SupportedLanguage;
      break;
    }
  }
  
  // デフォルト値
  if (!config.michiPath) {
    config.michiPath = resolve(__dirname, '..');
  }
  if (!config.environment) {
    config.environment = 'claude';
  }
  if (!config.langCode) {
    config.langCode = 'ja';
  }
  
  // 必須フィールドチェック
  if (!config.projectName || !config.jiraKey) {
    console.error('Missing required parameters');
    console.error('Usage: tsx setup-existing-project.ts --project-name <name> --jira-key <key> [--michi-path <path>] [--environment <env>] [--lang <code>]');
    process.exit(1);
  }
  
  // 環境バリデーション
  if (!isSupportedEnvironment(config.environment)) {
    console.error(`Unsupported environment: ${config.environment}`);
    console.error('Supported environments: claude, claude-agent, cursor');
    process.exit(1);
  }
  
  // 言語バリデーション
  if (!isSupportedLanguage(config.langCode)) {
    console.error(`Unsupported language: ${config.langCode}`);
    console.error('Supported languages: ja, en, zh-TW, zh, es, pt, de, fr, ru, it, ko, ar');
    process.exit(1);
  }
  
  return config as SetupConfig;
}

/**
 * Copy and render templates recursively
 * 
 * @param sourceDir - Source directory containing templates
 * @param destDir - Destination directory for rendered files
 * @param context - Template context for rendering
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
      // ディレクトリは再帰的にコピー
      mkdirSync(destPath, { recursive: true });
      copyAndRenderTemplates(sourcePath, destPath, context);
    } else if (entry.isFile()) {
      // ファイルはレンダリングしてコピー
      const content = readFileSync(sourcePath, 'utf-8');
      const rendered = renderTemplate(content, context);
      writeFileSync(destPath, rendered, 'utf-8');
    }
  }
}

async function setupExistingProject(config: SetupConfig): Promise<void> {
  const currentDir = process.cwd();
  const projectId = basename(currentDir);
  
  console.log('🚀 既存プロジェクトにMichiワークフローを追加');
  console.log(`   プロジェクト: ${config.projectName}`);
  console.log(`   ディレクトリ: ${currentDir}`);
  console.log(`   Michiパス: ${config.michiPath}`);
  console.log(`   環境: ${config.environment}`);
  console.log(`   言語: ${config.langCode}`);
  console.log('');
  
  // リポジトリルートを検出
  const repoRoot = findRepositoryRoot(currentDir);
  
  // projects/{project-id}/配下にプロジェクトを作成
  const projectsDir = join(repoRoot, 'projects');
  const projectDir = join(projectsDir, projectId);
  
  console.log(`📁 リポジトリルート: ${repoRoot}`);
  console.log(`📁 プロジェクトディレクトリ: ${projectDir}`);
  console.log('');
  
  // projects/ディレクトリとプロジェクトディレクトリを作成
  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir, { recursive: true });
    console.log(`   ✅ Created: ${projectsDir}`);
  }
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
    console.log(`   ✅ Created: ${projectDir}`);
  }
  
  // 元の作業ディレクトリを保存
  const originalCwd = process.cwd();
  
  try {
    // プロジェクトディレクトリに移動
    process.chdir(projectDir);
    
    // Step 1: cc-sdd導入確認
    console.log('\n📦 Step 1: Checking cc-sdd installation...');
    if (!existsSync('.cursor/commands/kiro')) {
      console.log('   Installing cc-sdd...');
      execSync('npx cc-sdd@latest --cursor --lang ja --yes', { stdio: 'inherit' });
      console.log('   ✅ cc-sdd installed');
    } else {
      console.log('   ✅ cc-sdd already installed');
    }
  
    // Step 2: .kiro ディレクトリ作成
    console.log('\n📁 Step 2: Creating .kiro directory structure...');
    mkdirSync('.kiro/settings/templates', { recursive: true });
    mkdirSync('.kiro/steering', { recursive: true });
    mkdirSync('.kiro/specs', { recursive: true });
    console.log('   ✅ Directory structure created');

    // Step 3: プロジェクトメタデータ作成
    console.log('\n📝 Step 3: Creating project metadata...');
  
    // GitHub URLを取得（既存リポジトリから）
    let repoUrl = '';
    try {
      repoUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8', cwd: repoRoot }).trim();
      // SSH形式をHTTPS形式に変換
      if (repoUrl.startsWith('git@github.com:')) {
        repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
      }
    } catch {
      repoUrl = `https://github.com/org/${projectId}`;
    }
  
    const labels = config.labels || (() => {
    // プロジェクトIDからプロジェクトラベル生成
      const projectLabel = projectId.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const labelSet = new Set([`project:${projectLabel}`]);
    
      // ハイフンが存在する場合のみサービスラベルを生成
      if (projectId.includes('-')) {
        const parts = projectId.split('-');
        const servicePart = parts[parts.length - 1];
        const serviceLabel = servicePart.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
        // サービスラベルがプロジェクトラベルと異なる場合のみ追加
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
  
    writeFileSync('.kiro/project.json', JSON.stringify(projectJson, null, 2));
    console.log('   ✅ project.json created');
  
    // Step 4: 環境別テンプレートのコピーとレンダリング
    console.log('\n📋 Step 4: Copying and rendering templates from Michi...');
  
    const envConfig = getEnvironmentConfig(config.environment);
    const templateContext = createTemplateContext(
      config.langCode,
      '.kiro',
      envConfig.rulesDir.startsWith('.') ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1)) : envConfig.rulesDir.split('/')[0]
    );
  
    // テンプレートソースディレクトリ
    const templateSourceDir = join(config.michiPath, 'templates', envConfig.templateSource);
  
    if (!existsSync(templateSourceDir)) {
      console.log(`   ⚠️  Template source not found: ${templateSourceDir}`);
      console.log('   Skipping template copy');
    } else {
      // rulesディレクトリのコピーとレンダリング
      const rulesTemplateDir = join(templateSourceDir, 'rules');
      const rulesDestDir = join(projectDir, envConfig.rulesDir);
      
      if (existsSync(rulesTemplateDir)) {
        mkdirSync(rulesDestDir, { recursive: true });
        copyAndRenderTemplates(rulesTemplateDir, rulesDestDir, templateContext);
        console.log(`   ✅ Rules copied and rendered to ${envConfig.rulesDir}`);
      }
  
      // commandsディレクトリのコピーとレンダリング
      const commandsTemplateDir = join(templateSourceDir, 'commands');
      const commandsDestDir = join(projectDir, envConfig.commandsDir);
      
      if (existsSync(commandsTemplateDir)) {
        mkdirSync(commandsDestDir, { recursive: true });
        copyAndRenderTemplates(commandsTemplateDir, commandsDestDir, templateContext);
        console.log(`   ✅ Commands copied and rendered to ${envConfig.commandsDir}`);
      }
    }
  
    // Step 5: Steeringテンプレートをコピー
    console.log('\n📚 Step 5: Copying steering templates...');
  
    const steeringDir = join(config.michiPath, '.kiro/steering');
    if (existsSync(steeringDir)) {
      cpSync(steeringDir, join(projectDir, '.kiro/steering'), { recursive: true });
      console.log('   ✅ product.md, tech.md, structure.md');
    }
  
    // Step 6: テンプレートをコピー
    console.log('\n📄 Step 6: Copying spec templates...');
  
    const templatesDir = join(config.michiPath, '.kiro/settings/templates');
    if (existsSync(templatesDir)) {
      cpSync(templatesDir, join(projectDir, '.kiro/settings/templates'), { recursive: true });
      console.log('   ✅ requirements.md, design.md, tasks.md');
    }
  
    // Step 7: CLIツールのセットアップ案内
    console.log('\n⚙️  Step 7: Setting up Michi CLI...');
    console.log('   ✅ Michi CLI setup complete!');
    console.log('');
    console.log('   📋 使用方法:');
    console.log('      npx @sk8metal/michi-cli jira:sync <feature>');
    console.log('      npx @sk8metal/michi-cli confluence:sync <feature> requirements');
    console.log('      npx @sk8metal/michi-cli phase:run <feature> tasks');
    console.log('');
    console.log('   または、グローバルインストール:');
    console.log('      npm install -g @sk8metal/michi-cli');
    console.log('      michi jira:sync <feature>');
  
    // Step 8: package.json と tsconfig.json をリポジトリルートにコピー
    console.log('\n📦 Step 8: Setting up package.json and TypeScript...');
  
    // 既存の package.json があるかチェック（リポジトリルート）
    const hasPackageJson = existsSync(join(repoRoot, 'package.json'));
  
    if (!hasPackageJson) {
    // package.json がない場合はリポジトリルートにコピー
      const src = join(config.michiPath, 'package.json');
      const dest = join(repoRoot, 'package.json');
      if (existsSync(src)) {
        cpSync(src, dest);
        console.log('   ✅ package.json created (in repository root)');
      }
    } else {
    // 既存の package.json にスクリプトを追加
      console.log('   ℹ️  Existing package.json found');
      console.log('   📝 手動で以下のスクリプトを追加してください:');
      console.log('');
      console.log('   "scripts": {');
      console.log('     "jira:sync": "npx @sk8metal/michi-cli jira:sync",');
      console.log('     "confluence:sync": "npx @sk8metal/michi-cli confluence:sync",');
      console.log('     "phase:run": "npx @sk8metal/michi-cli phase:run",');
      console.log('     "validate:phase": "npx @sk8metal/michi-cli validate:phase",');
      console.log('     "preflight": "npx @sk8metal/michi-cli preflight",');
      console.log('     "project:list": "npx @sk8metal/michi-cli project:list",');
      console.log('     "project:dashboard": "npx @sk8metal/michi-cli project:dashboard",');
      console.log('     "workflow:run": "npx @sk8metal/michi-cli workflow:run"');
      console.log('   }');
      console.log('');
    }
  
    // tsconfig.json をリポジトリルートにコピー
    if (!existsSync(join(repoRoot, 'tsconfig.json'))) {
      const src = join(config.michiPath, 'tsconfig.json');
      const dest = join(repoRoot, 'tsconfig.json');
      if (existsSync(src)) {
        cpSync(src, dest);
        console.log('   ✅ tsconfig.json created (in repository root)');
      }
    } else {
      console.log('   ℹ️  Existing tsconfig.json found (kept)');
    }
  
    // Step 9: .env テンプレート作成（プロジェクトディレクトリに）
    console.log('\n🔐 Step 9: Creating .env template...');
  
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
`;
  
    if (!existsSync(join(projectDir, '.env'))) {
      writeFileSync(join(projectDir, '.env'), envTemplate);
      console.log('   ✅ .env template created');
    } else {
      console.log('   ℹ️  .env already exists (kept)');
    }
  
    // Step 10: README.md を更新（オプション、プロジェクトディレクトリに）
    console.log('\n📖 Step 10: Updating documentation...');
  
    const readmePath = join(projectDir, 'README.md');
    if (existsSync(readmePath)) {
      const currentReadme = readFileSync(readmePath, 'utf-8');
    
      // Michiワークフロー情報を追加
      const workflowSection = `

## AI開発ワークフロー

このプロジェクトは Michi AI開発フロー自動化システムを使用しています。

### 開発フロー

\`\`\`
/kiro:spec-init <機能説明>
→ /kiro:spec-requirements <feature>
→ /kiro:spec-design <feature>
→ /kiro:spec-tasks <feature>
→ /kiro:spec-impl <feature> <tasks>
\`\`\`

### Confluence/JIRA連携

\`\`\`bash
npm run confluence:sync <feature>   # Confluence同期
npm run jira:sync <feature>         # JIRA連携
npm run github:create-pr <branch>   # PR作成
\`\`\`

詳細: [Michi Documentation](https://github.com/sk8metalme/michi)
`;
    
      if (!currentReadme.includes('AI開発ワークフロー')) {
        writeFileSync(readmePath, currentReadme + workflowSection);
        console.log('   ✅ README.md updated');
      } else {
        console.log('   ℹ️  README.md already has workflow section');
      }
    }
  
    // Step 11: .gitignore 更新（リポジトリルートに）
    console.log('\n🚫 Step 11: Updating .gitignore...');
  
    const gitignoreEntries = [
      '# AI Development Workflow',
      'node_modules/',
      '.env',
      '.env.local',
      'dist/',
      '*.log'
    ];
  
    const gitignorePath = join(repoRoot, '.gitignore');
    let gitignore = '';
    if (existsSync(gitignorePath)) {
      gitignore = readFileSync(gitignorePath, 'utf-8');
    }
  
    let updated = false;
    for (const entry of gitignoreEntries) {
      if (!gitignore.includes(entry)) {
        gitignore += `\n${entry}`;
        updated = true;
      }
    }
  
    if (updated) {
      writeFileSync(gitignorePath, gitignore);
      console.log('   ✅ .gitignore updated (in repository root)');
    } else {
      console.log('   ℹ️  .gitignore already up to date');
    }
  
    // 完了メッセージ
    console.log('\n');
    console.log('🎉 セットアップ完了！');
    console.log('');
    console.log('次のステップ:');
    console.log(`  1. cd ${projectDir}`);
    console.log('  2. .env ファイルを編集して認証情報を設定');
    console.log('  3. package.json が既存の場合、スクリプトを手動追加');
    console.log('  4. npm install で依存関係をインストール（リポジトリルートで実行）');
    console.log(`  5. cc-sddを導入: npx cc-sdd@latest --lang ${config.langCode} --${config.environment}`);
    console.log('  6. jj commit でセットアップをコミット');
    console.log('  7. Cursor で開く: cursor .');
    console.log('  8. /kiro:spec-init <機能説明> で開発開始');
    console.log('');
    console.log('作成されたファイル:');
    console.log(`  - ${projectDir}/.kiro/project.json`);
    console.log(`  - ${projectDir}/${envConfig.rulesDir}/`);
    console.log(`  - ${projectDir}/${envConfig.commandsDir}/`);
    console.log(`  - ${projectDir}/.kiro/steering/ (3ファイル)`);
    console.log(`  - ${projectDir}/.kiro/settings/templates/ (3ファイル)`);
    console.log(`  - ${repoRoot}/package.json (新規の場合)`);
    console.log(`  - ${repoRoot}/tsconfig.json (新規の場合)`);
    console.log(`  - ${projectDir}/.env (テンプレート)`);
  
  } finally {
    // 元の作業ディレクトリに戻る
    process.chdir(originalCwd);
  }
}

// 実行
const config = parseArgs();
setupExistingProject(config).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
