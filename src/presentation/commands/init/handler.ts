/**
 * init command - Main handler
 * プロジェクト初期設定のメインハンドラー
 */

import { existsSync } from 'fs';
import { ProjectAnalyzer } from '../../../../scripts/utils/project-analyzer.js';
import type { InitOptions } from './prompts.js';
import { prompt, buildConfig } from './prompts.js';
import { detectExistingProject } from './validation.js';
import {
  createKiroDirectories,
  createProjectMetadata,
  createEnvTemplate,
  setupWorkflowConfig,
  displayCompletionMessage,
} from './setup.js';
import { copyProjectTemplates } from './templates.js';

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
  const analyzer = new ProjectAnalyzer();
  const repoRootResult = analyzer.findProjectRoot(currentDir);

  if (!repoRootResult.success || !repoRootResult.value) {
    throw new Error('リポジトリルートが見つかりません');
  }

  const repoRoot: string = repoRootResult.value;
  console.log(`📁 リポジトリルート: ${repoRoot}`);

  if (!existsSync(repoRoot)) {
    throw new Error('リポジトリルートが見つかりません');
  }

  // Step 1: .kiro ディレクトリ作成
  createKiroDirectories();

  // Step 2: プロジェクトメタデータ作成
  createProjectMetadata(config, repoRoot);

  // Step 3: .env テンプレート作成
  createEnvTemplate(config);

  // Step 4: テンプレート/ルールのコピー
  copyProjectTemplates(config, currentDir);

  // Step 5: ワークフロー設定
  if (!config.skipWorkflowConfig) {
    console.log('\n⚙️  Step 5: Setting up workflow configuration...');
    await setupWorkflowConfig(config, repoRoot);
  } else {
    console.log('\n⚠️  Step 5: Skipped (--skip-config specified)');
  }

  // 完了メッセージ
  displayCompletionMessage(config);
}
