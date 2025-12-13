/**
 * migrate command
 * 既存の .env を新しい3層設定アーキテクチャに移行するコマンド
 *
 * 使い方:
 * npx @sk8metal/michi-cli migrate
 * npx @sk8metal/michi-cli migrate --dry-run
 * npx @sk8metal/michi-cli migrate --force
 * npx @sk8metal/michi-cli migrate --rollback .michi-backup-20250112143022
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  chmodSync,
} from 'fs';
import { resolve, join, dirname } from 'path';
import { parse as dotenvParse } from 'dotenv';
import * as readline from 'readline';
import { getGlobalEnvPath } from '../../scripts/utils/config-loader.js';

/**
 * 組織レベル環境変数（~/.michi/.env に移行）
 */
const ORG_LEVEL_VARS = [
  'ATLASSIAN_URL',
  'ATLASSIAN_EMAIL',
  'ATLASSIAN_API_TOKEN',
  'GITHUB_ORG',
  'GITHUB_TOKEN',
  'CONFLUENCE_PRD_SPACE',
  'CONFLUENCE_QA_SPACE',
  'CONFLUENCE_RELEASE_SPACE',
  'JIRA_ISSUE_TYPE_STORY',
  'JIRA_ISSUE_TYPE_SUBTASK',
];

/**
 * migrate コマンドのオプション
 */
export interface MigrateOptions {
  dryRun?: boolean;
  backupDir?: string;
  force?: boolean;
  verbose?: boolean;
  rollback?: string;
}

/**
 * 移行前の状態
 */
interface MigrationState {
  globalEnvPath: string;
  projectEnvPath: string;
  projectJsonPath: string;
  globalEnvExists: boolean;
  projectEnvExists: boolean;
  projectJsonExists: boolean;
  currentEnvVars: Map<string, string>;
}

/**
 * 移行内容
 */
interface MigrationChanges {
  toGlobalEnv: Map<string, string>;
  toKeepInProjectEnv: Map<string, string>;
  toProjectJson: { repository?: string };
  removedVars: string[];
}

/**
 * 現在の設定状態をスキャン
 */
function scanCurrentState(): MigrationState {
  const projectRoot = process.cwd();
  const globalEnvPath = getGlobalEnvPath();
  const projectEnvPath = resolve(projectRoot, '.env');
  const projectJsonPath = resolve(projectRoot, '.kiro', 'project.json');

  // .env ファイルが存在しない場合はエラー
  if (!existsSync(projectEnvPath)) {
    throw new Error(`.env file not found in ${projectRoot}`);
  }

  // .env ファイルを読み込み
  const envContent = readFileSync(projectEnvPath, 'utf-8');
  const parsed = dotenvParse(envContent);
  const currentEnvVars = new Map(Object.entries(parsed));

  return {
    globalEnvPath,
    projectEnvPath,
    projectJsonPath,
    globalEnvExists: existsSync(globalEnvPath),
    projectEnvExists: existsSync(projectEnvPath),
    projectJsonExists: existsSync(projectJsonPath),
    currentEnvVars,
  };
}

/**
 * 移行内容を分析
 */
function analyzeChanges(state: MigrationState): MigrationChanges {
  const toGlobalEnv = new Map<string, string>();
  const toKeepInProjectEnv = new Map<string, string>();
  const removedVars: string[] = [];
  const toProjectJson: { repository?: string } = {};

  // 環境変数を分類
  for (const [key, value] of state.currentEnvVars.entries()) {
    if (key === 'GITHUB_REPO') {
      // GITHUB_REPO は project.json の repository に移行
      const repoUrl = convertGithubRepoToUrl(value);
      toProjectJson.repository = repoUrl;
      removedVars.push(key);
    } else if (ORG_LEVEL_VARS.includes(key)) {
      // 組織レベル変数は ~/.michi/.env に移行
      toGlobalEnv.set(key, value);
      removedVars.push(key);
    } else {
      // その他はプロジェクトに維持
      toKeepInProjectEnv.set(key, value);
    }
  }

  return {
    toGlobalEnv,
    toKeepInProjectEnv,
    toProjectJson,
    removedVars,
  };
}

/**
 * GITHUB_REPO 形式を GitHub URL に変換
 * 例: "myorg/myrepo" -> "https://github.com/myorg/myrepo.git"
 */
function convertGithubRepoToUrl(repo: string): string {
  // 既に URL 形式の場合はそのまま返す
  if (repo.startsWith('http://') || repo.startsWith('https://') || repo.startsWith('git@')) {
    return repo.endsWith('.git') ? repo : `${repo}.git`;
  }

  // org/repo 形式を URL に変換
  return `https://github.com/${repo}.git`;
}

/**
 * 変更内容を表示
 */
function displayChanges(changes: MigrationChanges, dryRun: boolean): void {
  console.log('');
  console.log('🔄 Michi 設定移行ツール');
  if (dryRun) {
    console.log('   (ドライランモード - 実際の変更は行われません)');
  }
  console.log('================================================');
  console.log('');

  console.log('[移行内容]');
  console.log(`  グローバル設定に移行: ${changes.toGlobalEnv.size}項目`);
  if (changes.toGlobalEnv.size > 0) {
    for (const key of changes.toGlobalEnv.keys()) {
      console.log(`    - ${key}`);
    }
  }

  console.log(`  プロジェクト設定に維持: ${changes.toKeepInProjectEnv.size}項目`);
  if (changes.toKeepInProjectEnv.size > 0) {
    for (const key of changes.toKeepInProjectEnv.keys()) {
      console.log(`    - ${key}`);
    }
  }

  if (changes.toProjectJson.repository) {
    console.log('  project.jsonに移行: repository');
    console.log(`    - ${changes.toProjectJson.repository}`);
  }

  console.log('');
}

/**
 * ユーザー確認プロンプト
 */
async function promptConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('[移行を実行しますか？] (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * バックアップを作成
 */
function createBackup(backupDirPath?: string): string {
  const projectRoot = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('').substring(0, 15);
  const backupDir = backupDirPath || resolve(projectRoot, `.michi-backup-${timestamp}`);

  console.log('');
  console.log('[バックアップ作成中...]');

  // バックアップディレクトリを作成
  mkdirSync(backupDir, { recursive: true });

  // .env をバックアップ
  const projectEnvPath = resolve(projectRoot, '.env');
  if (existsSync(projectEnvPath)) {
    cpSync(projectEnvPath, join(backupDir, '.env'));
    console.log(`  ✓ .env -> ${backupDir}/.env`);
  }

  // .michi/ をバックアップ
  const michiDir = resolve(projectRoot, '.michi');
  if (existsSync(michiDir)) {
    cpSync(michiDir, join(backupDir, '.michi'), { recursive: true });
    console.log(`  ✓ .michi/ -> ${backupDir}/.michi/`);
  }

  // .kiro/project.json をバックアップ
  const projectJsonPath = resolve(projectRoot, '.kiro', 'project.json');
  if (existsSync(projectJsonPath)) {
    mkdirSync(join(backupDir, '.kiro'), { recursive: true });
    cpSync(projectJsonPath, join(backupDir, '.kiro', 'project.json'));
    console.log(`  ✓ .kiro/project.json -> ${backupDir}/.kiro/project.json`);
  }

  console.log('');
  console.log(`✅ バックアップ完了: ${backupDir}`);

  return backupDir;
}

/**
 * 移行を実行
 */
function executeMigration(state: MigrationState, changes: MigrationChanges): void {
  console.log('');
  console.log('[移行実行中...]');

  // ~/.michi/.env を作成
  if (changes.toGlobalEnv.size > 0) {
    const globalEnvDir = dirname(state.globalEnvPath);
    mkdirSync(globalEnvDir, { recursive: true });

    const globalEnvContent = Array.from(changes.toGlobalEnv.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    writeFileSync(state.globalEnvPath, globalEnvContent + '\n');
    chmodSync(state.globalEnvPath, 0o600); // rw-------

    console.log(`  ✓ ~/.michi/.env 作成 (${changes.toGlobalEnv.size}項目)`);
  }

  // プロジェクト .env を更新
  const projectEnvContent = Array.from(changes.toKeepInProjectEnv.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  writeFileSync(state.projectEnvPath, projectEnvContent + '\n');
  console.log(`  ✓ .env 更新 (${changes.toKeepInProjectEnv.size}項目)`);

  // .kiro/project.json を更新
  if (changes.toProjectJson.repository) {
    const projectJsonDir = dirname(state.projectJsonPath);
    mkdirSync(projectJsonDir, { recursive: true });

    let projectJson: Record<string, unknown> = {};
    if (existsSync(state.projectJsonPath)) {
      const content = readFileSync(state.projectJsonPath, 'utf-8');
      projectJson = JSON.parse(content);
    }

    projectJson.repository = changes.toProjectJson.repository;

    writeFileSync(state.projectJsonPath, JSON.stringify(projectJson, null, 2) + '\n');
    console.log('  ✓ .kiro/project.json 更新');
  }

  console.log('');
}

/**
 * バックアップから復元
 */
function rollbackFromBackup(backupDir: string): void {
  const projectRoot = process.cwd();

  console.log('');
  console.log('🔄 バックアップから復元中...');
  console.log('================================================');
  console.log('');

  // バックアップディレクトリが存在しない場合はエラー
  if (!existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  // .env を復元
  const backupEnvPath = join(backupDir, '.env');
  if (existsSync(backupEnvPath)) {
    cpSync(backupEnvPath, resolve(projectRoot, '.env'));
    console.log('  ✓ .env 復元');
  }

  // .michi/ を復元
  const backupMichiDir = join(backupDir, '.michi');
  if (existsSync(backupMichiDir)) {
    cpSync(backupMichiDir, resolve(projectRoot, '.michi'), { recursive: true });
    console.log('  ✓ .michi/ 復元');
  }

  // .kiro/project.json を復元
  const backupProjectJsonPath = join(backupDir, '.kiro', 'project.json');
  if (existsSync(backupProjectJsonPath)) {
    const projectJsonDir = resolve(projectRoot, '.kiro');
    mkdirSync(projectJsonDir, { recursive: true });
    cpSync(backupProjectJsonPath, resolve(projectRoot, '.kiro', 'project.json'));
    console.log('  ✓ .kiro/project.json 復元');
  }

  console.log('');
  console.log('✅ ロールバック完了');
}

/**
 * 移行を検証
 */
async function validateMigration(): Promise<void> {
  // ConfigLoader を使用して設定が正しく読み込まれることを確認
  try {
    const configLoaderModule = await import('../../scripts/utils/config-loader.js');
    configLoaderModule.loadConfig();
    console.log('✅ 移行後の設定検証: 成功');
  } catch (error) {
    console.error('❌ 移行後の設定検証: 失敗', error);
    throw error;
  }
}

/**
 * migrate コマンドのメイン処理
 */
export async function migrate(options: MigrateOptions = {}): Promise<void> {
  try {
    // ロールバックモード
    if (options.rollback) {
      rollbackFromBackup(options.rollback);
      return;
    }

    // 1. 現在の状態をスキャン
    console.log('');
    console.log('[1] 現在の設定を検出中...');
    const state = scanCurrentState();
    console.log(`  ✓ プロジェクトディレクトリ: ${process.cwd()}`);
    console.log('  ✓ .env 検出');
    if (state.projectJsonExists) {
      console.log('  ✓ .kiro/project.json 検出');
    }

    // 2. 変更内容を分析
    console.log('');
    console.log('[2] 移行内容を分析中...');
    const changes = analyzeChanges(state);

    // ~/.michi/.env が既に存在する場合の確認
    if (state.globalEnvExists && !options.force) {
      throw new Error('~/.michi/.env already exists. Use --force to overwrite.');
    }

    // 3. 変更内容を表示
    displayChanges(changes, !!options.dryRun);

    // ドライランモードの場合はここで終了
    if (options.dryRun) {
      console.log('⚠️  --dry-run モードのため、実際の変更は行われませんでした');
      console.log('');
      console.log('実際に移行を実行する場合:');
      console.log('  $ michi migrate');
      console.log('');
      return;
    }

    // 4. ユーザー確認（--force でスキップ）
    if (!options.force) {
      const confirmed = await promptConfirmation();
      if (!confirmed) {
        console.log('');
        console.log('⚠️  移行をキャンセルしました');
        console.log('');
        return;
      }
    }

    // 5. バックアップ作成
    const backupDir = createBackup(options.backupDir);

    // 6. 移行実行
    executeMigration(state, changes);

    // 7. 検証
    await validateMigration();

    // 8. 完了報告
    console.log('✅ 移行完了');
    console.log('================================================');
    console.log('');
    console.log('[次のステップ]');
    console.log('  1. 設定を確認: michi config:validate');
    console.log('  2. 動作確認: michi confluence:sync {feature} --dry-run');
    console.log(`  3. 問題があれば: michi migrate --rollback ${backupDir}`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ 移行失敗:', error instanceof Error ? error.message : error);
    console.error('');
    throw error;
  }
}
