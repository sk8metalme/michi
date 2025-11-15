#!/usr/bin/env tsx
/**
 * 既存プロジェクトにMichi共通ルール・コマンド・テンプレートをコピーするスクリプト
 * 
 * Issue #35: cc-sdd準拠の多環境対応基盤
 * - templates/ディレクトリから読み込み
 * - プレースホルダーはそのまま（実行時にAIが解釈）
 * 
 * 使い方:
 * cd /path/to/existing-repo
 * npx tsx /path/to/michi/scripts/setup-existing-project.ts [--michi-path /path/to/michi]
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import { findRepositoryRoot } from './utils/project-finder.js';
import { findTemplateFile, validateRequiredTemplates } from './utils/template-finder.js';

interface SetupConfig {
  michiPath: string;      // Michiリポジトリのパス
}

function parseArgs(): SetupConfig {
  const args = process.argv.slice(2);
  const config: Partial<SetupConfig> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'michi-path') {
      config.michiPath = value;
    }
  }
  
  // デフォルト値
  if (!config.michiPath) {
    config.michiPath = resolve(__dirname, '..');
  }
  
  return config as SetupConfig;
}

async function setupExistingProject(config: SetupConfig): Promise<void> {
  const currentDir = process.cwd();
  const projectId = basename(currentDir);
  
  console.log('🚀 Michi共通ルール・コマンド・テンプレートをコピー');
  console.log(`   プロジェクトID: ${projectId}`);
  console.log(`   ディレクトリ: ${currentDir}`);
  console.log(`   Michiパス: ${config.michiPath}`);
  console.log('');
  
  // リポジトリルートを検出
  const repoRoot = findRepositoryRoot(currentDir);
  
  // projects/{project-id}/配下にプロジェクトを作成（既存の場合はそのまま使用）
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
    
    // 必須テンプレートのバリデーション
    const requiredTemplates = [
      'rules/github-ssot.mdc',
      'rules/multi-project.mdc',
      'commands/michi/confluence-sync.md',
      'commands/michi/project-switch.md'
    ];
    
    try {
      validateRequiredTemplates(config.michiPath, requiredTemplates);
    } catch (error) {
      console.error('\n❌ Template validation failed:');
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
    
    // Step 1: Michiから共通ルールをコピー（templates/から）
    console.log('\n📋 Step 1: Copying common rules from Michi templates...');
    console.log('   ℹ️  Issue #35: cc-sdd compliant approach (placeholders preserved)');
    
    // ディレクトリを事前に作成
    mkdirSync(join(projectDir, '.cursor/rules'), { recursive: true });
    mkdirSync(join(projectDir, '.cursor/commands/michi'), { recursive: true });
    
    const rulesToCopy = [
      'rules/multi-project.mdc',
      'rules/github-ssot.mdc',
      'rules/atlassian-mcp.mdc'
    ];
    
    for (const rulePath of rulesToCopy) {
      const src = findTemplateFile(config.michiPath, rulePath);
      const fileName = basename(rulePath);
      const dest = join(projectDir, '.cursor/rules', fileName);
      
      if (src) {
        cpSync(src, dest);
        console.log(`   ✅ ${fileName} (from templates/)`);
      } else {
        console.log(`   ⚠️  ${fileName} not found in templates/`);
      }
    }
    
    // Step 2: カスタムコマンドをコピー（templates/から）
    console.log('\n🔧 Step 2: Copying custom commands from templates...');
    
    const commandsToCopy = [
      'commands/michi/confluence-sync.md',
      'commands/michi/project-switch.md'
    ];
    
    for (const cmdPath of commandsToCopy) {
      const src = findTemplateFile(config.michiPath, cmdPath);
      const fileName = basename(cmdPath);
      const dest = join(projectDir, '.cursor/commands/michi', fileName);
      
      if (src) {
        cpSync(src, dest);
        console.log(`   ✅ ${fileName} (from templates/)`);
      } else {
        console.log(`   ⚠️  ${fileName} not found in templates/`);
      }
    }
    
    // Step 3: Steeringテンプレートをコピー
    console.log('\n📚 Step 3: Copying steering templates...');
    
    const steeringDir = join(config.michiPath, '.kiro/steering');
    if (existsSync(steeringDir)) {
      mkdirSync(join(projectDir, '.kiro/steering'), { recursive: true });
      cpSync(steeringDir, join(projectDir, '.kiro/steering'), { recursive: true });
      console.log('   ✅ product.md, tech.md, structure.md');
    }
    
    // Step 4: Specテンプレートをコピー
    console.log('\n📄 Step 4: Copying spec templates...');
    
    const templatesDir = join(config.michiPath, '.kiro/settings/templates');
    if (existsSync(templatesDir)) {
      mkdirSync(join(projectDir, '.kiro/settings/templates'), { recursive: true });
      cpSync(templatesDir, join(projectDir, '.kiro/settings/templates'), { recursive: true });
      console.log('   ✅ requirements.md, design.md, tasks.md');
    }
    
    // 完了メッセージ
    console.log('\n');
    console.log('🎉 共通ルール・コマンド・テンプレートのコピー完了！');
    console.log('');
    console.log('ℹ️  Issue #35: cc-sdd準拠アプローチ');
    console.log('   - templates/から読み込み');
    console.log('   - プレースホルダーは実行時にAIが解釈');
    console.log('');
    console.log('次のステップ:');
    console.log(`  1. cd ${projectDir}`);
    console.log('  2. cc-sddを導入: npx cc-sdd@latest --lang ja --cursor');
    console.log('     （使用する環境に合わせて --cursor / --claude / --gemini などを指定）');
    console.log('  3. 設定を対話的に作成: npm run setup:interactive');
    console.log('     （または: npx @sk8metal/michi-cli setup:interactive）');
    console.log('  4. Cursor で開く: cursor .');
    console.log('  5. /kiro:spec-init <機能説明> で開発開始');
    console.log('');
    console.log('作成されたファイル:');
    console.log(`  - ${projectDir}/.cursor/rules/ (3ファイル)`);
    console.log(`  - ${projectDir}/.cursor/commands/michi/ (2ファイル)`);
    console.log(`  - ${projectDir}/.kiro/steering/ (3ファイル)`);
    console.log(`  - ${projectDir}/.kiro/settings/templates/ (3ファイル)`);
    console.log('');
    console.log('プレースホルダー（AIが実行時に解釈）:');
    console.log('  - {{LANG_CODE}}: 言語コード');
    console.log('  - {{DEV_GUIDELINES}}: 開発ガイドライン');
    console.log('  - {{KIRO_DIR}}: Kiroディレクトリ');
    console.log('  - {{PROJECT_ID}}: プロジェクトID');
  
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

