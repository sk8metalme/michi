#!/usr/bin/env tsx
/**
 * 既存プロジェクトにMichiワークフローを追加するスクリプト
 * 
 * 使い方:
 * cd /path/to/existing-repo
 * npx tsx /path/to/michi/scripts/setup-existing-project.ts \
 *   --michi-path /path/to/michi \
 *   --project-name "既存プロジェクト" \
 *   --jira-key "EXIST"
 */

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, join, basename } from 'path';
import { execSync } from 'child_process';

interface SetupConfig {
  michiPath: string;      // Michiリポジトリのパス
  projectName: string;    // プロジェクト表示名
  jiraKey: string;        // JIRAプロジェクトキー
  labels?: string[];      // Confluenceラベル（オプション）
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
    }
  }
  
  // デフォルト値
  if (!config.michiPath) {
    config.michiPath = resolve(__dirname, '..');
  }
  
  // 必須フィールドチェック
  if (!config.projectName || !config.jiraKey) {
    console.error('Missing required parameters');
    console.error('Usage: tsx setup-existing-project.ts --project-name <name> --jira-key <key> [--michi-path <path>]');
    process.exit(1);
  }
  
  return config as SetupConfig;
}

async function setupExistingProject(config: SetupConfig): Promise<void> {
  const currentDir = process.cwd();
  const projectId = basename(currentDir);
  
  console.log('🚀 既存プロジェクトにMichiワークフローを追加');
  console.log(`   プロジェクト: ${config.projectName}`);
  console.log(`   ディレクトリ: ${currentDir}`);
  console.log(`   Michiパス: ${config.michiPath}`);
  console.log('');
  
  // Step 1: cc-sdd導入確認
  console.log('📦 Step 1: Checking cc-sdd installation...');
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
    repoUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
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
  
  // Step 4: Michiから共通ルールをコピー
  console.log('\n📋 Step 4: Copying common rules from Michi...');
  
  const rulesToCopy = [
    'multi-project.mdc',
    'github-ssot.mdc',
    'atlassian-mcp.mdc'
  ];
  
  for (const rule of rulesToCopy) {
    const src = join(config.michiPath, '.cursor/rules', rule);
    const dest = join(currentDir, '.cursor/rules', rule);
    if (existsSync(src)) {
      cpSync(src, dest);
      console.log(`   ✅ ${rule}`);
    } else {
      console.log(`   ⚠️  ${rule} not found in Michi`);
    }
  }
  
  // Step 5: カスタムコマンドをコピー
  console.log('\n🔧 Step 5: Copying custom commands...');
  
  const commandsToCopy = [
    'confluence-sync.md',
    'project-switch.md'
  ];
  
  for (const cmd of commandsToCopy) {
    const src = join(config.michiPath, '.cursor/commands/kiro', cmd);
    const dest = join(currentDir, '.cursor/commands/kiro', cmd);
    if (existsSync(src)) {
      cpSync(src, dest);
      console.log(`   ✅ ${cmd}`);
    }
  }
  
  // Step 6: Steeringテンプレートをコピー
  console.log('\n📚 Step 6: Copying steering templates...');
  
  const steeringDir = join(config.michiPath, '.kiro/steering');
  if (existsSync(steeringDir)) {
    cpSync(steeringDir, '.kiro/steering', { recursive: true });
    console.log('   ✅ product.md, tech.md, structure.md');
  }
  
  // Step 7: テンプレートをコピー
  console.log('\n📄 Step 7: Copying spec templates...');
  
  const templatesDir = join(config.michiPath, '.kiro/settings/templates');
  if (existsSync(templatesDir)) {
    cpSync(templatesDir, '.kiro/settings/templates', { recursive: true });
    console.log('   ✅ requirements.md, design.md, tasks.md');
  }
  
  // Step 8: CLIツールのセットアップ案内
  console.log('\n⚙️  Step 8: Setting up Michi CLI...');
  console.log('   ✅ Michi CLI setup complete!');
  console.log('');
  console.log('   📋 使用方法:');
  console.log('      npx @michi/cli jira:sync <feature>');
  console.log('      npx @michi/cli confluence:sync <feature> requirements');
  console.log('      npx @michi/cli phase:run <feature> tasks');
  console.log('');
  console.log('   または、グローバルインストール:');
  console.log('      npm install -g @michi/cli');
  console.log('      michi jira:sync <feature>');
  
  // Step 9: package.json と tsconfig.json をコピー
  console.log('\n📦 Step 9: Setting up package.json and TypeScript...');
  
  // 既存の package.json があるかチェック
  const hasPackageJson = existsSync('package.json');
  
  if (!hasPackageJson) {
    // package.json がない場合はコピー
    const src = join(config.michiPath, 'package.json');
    if (existsSync(src)) {
      cpSync(src, 'package.json');
      console.log('   ✅ package.json created');
    }
  } else {
    // 既存の package.json にスクリプトを追加
    console.log('   ℹ️  Existing package.json found');
    console.log('   📝 手動で以下のスクリプトを追加してください:');
    console.log('');
    console.log('   "scripts": {');
    console.log('     "jira:sync": "npx @michi/cli jira:sync",');
    console.log('     "confluence:sync": "npx @michi/cli confluence:sync",');
    console.log('     "phase:run": "npx @michi/cli phase:run",');
    console.log('     "validate:phase": "npx @michi/cli validate:phase",');
    console.log('     "preflight": "npx @michi/cli preflight",');
    console.log('     "project:list": "npx @michi/cli project:list",');
    console.log('     "project:dashboard": "npx @michi/cli project:dashboard",');
    console.log('     "workflow:run": "npx @michi/cli workflow:run"');
    console.log('   }');
    console.log('');
  }
  
  // tsconfig.json をコピー
  if (!existsSync('tsconfig.json')) {
    const src = join(config.michiPath, 'tsconfig.json');
    if (existsSync(src)) {
      cpSync(src, 'tsconfig.json');
      console.log('   ✅ tsconfig.json created');
    }
  } else {
    console.log('   ℹ️  Existing tsconfig.json found (kept)');
  }
  
  // Step 10: .env テンプレート作成
  console.log('\n🔐 Step 10: Creating .env template...');
  
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
  
  if (!existsSync('.env')) {
    writeFileSync('.env', envTemplate);
    console.log('   ✅ .env template created');
  } else {
    console.log('   ℹ️  .env already exists (kept)');
  }
  
  // Step 11: README.md を更新（オプション）
  console.log('\n📖 Step 11: Updating documentation...');
  
  const readmePath = 'README.md';
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
  
  // Step 12: .gitignore 更新
  console.log('\n🚫 Step 12: Updating .gitignore...');
  
  const gitignoreEntries = [
    '# AI Development Workflow',
    'node_modules/',
    '.env',
    '.env.local',
    'dist/',
    '*.log'
  ];
  
  let gitignore = '';
  if (existsSync('.gitignore')) {
    gitignore = readFileSync('.gitignore', 'utf-8');
  }
  
  let updated = false;
  for (const entry of gitignoreEntries) {
    if (!gitignore.includes(entry)) {
      gitignore += `\n${entry}`;
      updated = true;
    }
  }
  
  if (updated) {
    writeFileSync('.gitignore', gitignore);
    console.log('   ✅ .gitignore updated');
  } else {
    console.log('   ℹ️  .gitignore already up to date');
  }
  
  // 完了メッセージ
  console.log('\n');
  console.log('🎉 セットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('  1. .env ファイルを編集して認証情報を設定');
  console.log('  2. package.json が既存の場合、スクリプトを手動追加');
  console.log('  3. npm install で依存関係をインストール');
  console.log('  4. jj commit でセットアップをコミット');
  console.log('  5. Cursor で開く: cursor .');
  console.log('  6. /kiro:spec-init <機能説明> で開発開始');
  console.log('');
  console.log('作成されたファイル:');
  console.log('  - .kiro/project.json');
  console.log('  - .cursor/rules/ (3ファイル)');
  console.log('  - .cursor/commands/kiro/ (2ファイル)');
  console.log('  - .kiro/steering/ (3ファイル)');
  console.log('  - .kiro/settings/templates/ (3ファイル)');
  console.log('  - scripts/ (7+ ファイル)');
  console.log('  - package.json (新規の場合)');
  console.log('  - tsconfig.json (新規の場合)');
  console.log('  - .env (テンプレート)');
}

// 実行
const config = parseArgs();
setupExistingProject(config).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

