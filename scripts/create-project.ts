#!/usr/bin/env tsx
/**
 * 新規プロジェクト自動セットアップスクリプト
 * 
 * 使い方:
 * npm run create-project -- \
 *   --name "customer-a-service-1" \
 *   --project-name "A社 サービス1" \
 *   --jira-key "PRJA"
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotenv } from 'dotenv';

// ESモジュール対応: __dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadDotenv();

interface ProjectConfig {
  name: string;           // リポジトリ名: customer-a-service-1
  projectName: string;    // 表示名: A社 サービス1
  jiraKey: string;        // JIRAキー: PRJA
  org?: string;           // GitHub組織名（デフォルト: .envから）
  labels?: string[];      // Confluenceラベル（デフォルト: 自動生成）
}

function parseArgs(): ProjectConfig {
  const args = process.argv.slice(2);
  const config: Partial<ProjectConfig> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    switch (key) {
    case 'name':
      config.name = value;
      break;
    case 'project-name':
      config.projectName = value;
      break;
    case 'jira-key':
      config.jiraKey = value;
      break;
    case 'org':
      config.org = value;
      break;
    case 'labels':
      // カンマ区切りでラベル配列に変換
      config.labels = value.split(',').map(l => l.trim());
      break;
    }
  }
  
  // 必須フィールドチェック
  if (!config.name || !config.projectName || !config.jiraKey) {
    console.error('Missing required parameters');
    console.error('Usage: npm run create-project -- --name <name> --project-name <display> --jira-key <key>');
    process.exit(1);
  }
  
  return config as ProjectConfig;
}

async function createProject(config: ProjectConfig): Promise<void> {
  const org = config.org || process.env.GITHUB_ORG;
  
  if (!org) {
    console.error('❌ GitHub organization not specified');
    console.error('   Set GITHUB_ORG in .env or use --org parameter');
    process.exit(1);
  }
  
  const repoName = config.name;
  const repoUrl = `https://github.com/${org}/${repoName}`;
  const projectDir = resolve(`../${repoName}`);
  
  console.log(`🚀 Creating new project: ${config.projectName}`);
  console.log(`   Repository: ${org}/${repoName}`);
  console.log(`   JIRA: ${config.jiraKey}`);
  console.log('');
  
  // Step 1: GitHubリポジトリ作成
  console.log('📦 Step 1: Creating GitHub repository...');
  try {
    execSync(
      `gh repo create ${org}/${repoName} --private --description "${config.projectName}"`,
      { stdio: 'inherit' }
    );
    console.log('   ✅ Repository created');
  } catch (error) {
    console.log('   ⚠️  Repository may already exist');
  }
  
  // Step 2: リポジトリクローン
  console.log('\n📥 Step 2: Cloning repository...');
  try {
    execSync(`jj git clone ${repoUrl} ${projectDir}`, { stdio: 'inherit' });
    console.log('   ✅ Repository cloned');
  } catch (error) {
    console.log('   ⚠️  Clone failed, checking if directory exists...');
  }
  
  // Step 3: ディレクトリ存在確認と移動
  if (!existsSync(projectDir)) {
    console.error('   ❌ Project directory does not exist. Clone may have failed.');
    console.error(`   Expected directory: ${projectDir}`);
    process.exit(1);
  }
  
  process.chdir(projectDir);
  console.log(`   📂 Working directory: ${projectDir}`);
  
  // Step 4: cc-sdd導入
  console.log('\n⚙️  Step 4: Installing cc-sdd...');
  execSync('npx cc-sdd@latest --cursor --lang ja --yes', { stdio: 'inherit' });
  console.log('   ✅ cc-sdd installed');
  
  // Step 5: .kiro/project.json 作成
  console.log('\n📝 Step 5: Creating project metadata...');
  mkdirSync('.kiro', { recursive: true });
  
  // ラベル生成（安全なフォールバック付き）
  const labels = config.labels || (() => {
    // プロジェクトIDからプロジェクトラベル生成
    const projectLabel = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const labelSet = new Set([`project:${projectLabel}`]);
    
    // ハイフンが存在する場合のみサービスラベルを生成
    if (repoName.includes('-')) {
      const parts = repoName.split('-');
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
    projectId: repoName,
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
  
  // Step 6: Michiから共通ファイルをコピー
  console.log('\n📋 Step 6: Copying common files from Michi...');
  const michiPath = resolve(__dirname, '..');
  
  // コピー先ディレクトリを事前に作成
  mkdirSync('.cursor/rules', { recursive: true });
  mkdirSync('.cursor/commands/kiro', { recursive: true });
  mkdirSync('.kiro/steering', { recursive: true });
  mkdirSync('.kiro/settings/templates', { recursive: true });
  mkdirSync('scripts/utils', { recursive: true });
  
  // ルールファイル
  const rulesToCopy = [
    'multi-project.mdc',
    'github-ssot.mdc',
    'atlassian-mcp.mdc'
  ];
  
  for (const rule of rulesToCopy) {
    const src = join(michiPath, '.cursor/rules', rule);
    const dest = join(projectDir, '.cursor/rules', rule);
    if (existsSync(src)) {
      cpSync(src, dest);
      console.log(`   ✅ Copied: .cursor/rules/${rule}`);
    }
  }
  
  // カスタムコマンド
  const commandsToCopy = [
    'confluence-sync.md',
    'project-switch.md'
  ];
  
  for (const cmd of commandsToCopy) {
    const src = join(michiPath, '.cursor/commands/kiro', cmd);
    const dest = join(projectDir, '.cursor/commands/kiro', cmd);
    if (existsSync(src)) {
      cpSync(src, dest);
      console.log(`   ✅ Copied: .cursor/commands/kiro/${cmd}`);
    }
  }
  
  // Steering
  const steeringDir = join(michiPath, '.kiro/steering');
  if (existsSync(steeringDir)) {
    mkdirSync('.kiro/steering', { recursive: true });
    cpSync(steeringDir, '.kiro/steering', { recursive: true });
    console.log('   ✅ Copied: .kiro/steering/');
  }
  
  // Scripts（必要なスクリプトのみコピー）
  const scriptsDir = join(michiPath, 'scripts');
  if (existsSync(scriptsDir)) {
    const scriptsToCopy = [
      'confluence-sync.ts',
      'jira-sync.ts',
      'pr-automation.ts',
      'markdown-to-confluence.ts',
      'workflow-orchestrator.ts',
      'list-projects.ts',
      'resource-dashboard.ts',
      'multi-project-estimate.ts',
      'utils/project-meta.ts'
    ];
    
    for (const script of scriptsToCopy) {
      const src = join(scriptsDir, script);
      const dest = join(projectDir, 'scripts', script);
      if (existsSync(src)) {
        // ディレクトリが必要な場合は作成
        const destDir = dirname(dest);
        mkdirSync(destDir, { recursive: true });
        cpSync(src, dest);
        console.log(`   ✅ Copied: scripts/${script}`);
      }
    }
  }
  
  // package.json, tsconfig.json
  ['package.json', 'tsconfig.json'].forEach(file => {
    const src = join(michiPath, file);
    if (existsSync(src)) {
      cpSync(src, file);
      console.log(`   ✅ Copied: ${file}`);
    }
  });
  
  // Step 7: .env テンプレート作成
  console.log('\n🔐 Step 7: Creating .env template...');
  execSync('npm run setup:env', { stdio: 'inherit' });
  console.log('   ✅ .env created');
  
  // Step 8: npm install
  console.log('\n📦 Step 8: Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed');
  
  // Step 9: 初期コミット
  console.log('\n💾 Step 9: Creating initial commit...');
  execSync(`jj commit -m "chore: プロジェクト初期化

- cc-sdd導入
- プロジェクトメタデータ設定（${config.jiraKey}）
- 自動化スクリプト追加
- Confluence/JIRA連携設定"`, { stdio: 'inherit' });
  
  execSync('jj bookmark create main -r "@-"', { stdio: 'inherit' });
  console.log('   ✅ Initial commit created');
  
  // 完了メッセージ
  console.log('\n');
  console.log('🎉 プロジェクトセットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log(`  1. cd ${projectDir}`);
  console.log('  2. .env ファイルを編集して認証情報を設定');
  console.log('  3. jj git push --bookmark main --allow-new');
  console.log('  4. Cursor で開く: cursor .');
  console.log('  5. /kiro:spec-init <機能説明> で開発開始');
  console.log('');
  console.log('詳細: docs/new-project-setup.md');
}

// 実行
const config = parseArgs();
createProject(config).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

