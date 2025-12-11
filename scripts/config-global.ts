/**
 * グローバル設定ツール
 * ~/.michi/config.json を対話的に作成・更新
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { createInterface, confirm } from './utils/interactive-helpers.js';
import {
  getConfluenceConfig,
  getJiraConfig,
  getWorkflowConfig,
  type ConfluenceConfigResult,
  type JiraConfigResult,
  type WorkflowConfigResult,
} from './utils/config-sections.js';
import { getGlobalConfigPath } from './utils/config-loader.js';
import { AppConfigSchema } from './config/config-schema.js';

/**
 * プロジェクト設定全体
 */
interface ProjectConfig {
  confluence?: ConfluenceConfigResult;
  jira?: JiraConfigResult;
  workflow?: WorkflowConfigResult;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  const rl = createInterface();

  try {
    console.log('🌐 Michi グローバル設定ツール');
    console.log('='.repeat(60));
    console.log('このツールで ~/.michi/config.json を作成・更新できます。');
    console.log('');
    console.log('グローバル設定は、すべてのプロジェクトに適用されます。');
    console.log('プロジェクト固有の設定は .michi/config.json で上書きできます。');
    console.log('');

    const globalConfigPath = getGlobalConfigPath();
    const globalConfigDir = dirname(globalConfigPath);

    let existingConfig: ProjectConfig | null = null;

    // 既存の設定ファイルを確認
    if (existsSync(globalConfigPath)) {
      console.log(`⚠️  既存のグローバル設定ファイルが見つかりました: ${globalConfigPath}`);
      const overwrite = await confirm(rl, '上書きしますか？', false);

      if (!overwrite) {
        console.log('中止しました。');
        process.exit(0);
      }

      try {
        const content = readFileSync(globalConfigPath, 'utf-8');
        existingConfig = JSON.parse(content) as ProjectConfig;
        console.log('既存の設定を読み込みました。\n');
      } catch {
        console.log(
          '既存の設定ファイルの読み込みに失敗しました。新規作成します。\n',
        );
      }
    }

    // 設定を対話的に取得
    const config: ProjectConfig = existingConfig || {};

    // Confluence設定
    const configureConfluence = await confirm(
      rl,
      'Confluence設定をカスタマイズしますか？',
      false,
    );
    if (configureConfluence) {
      config.confluence = await getConfluenceConfig(rl);
    }

    // JIRA設定
    const configureJira = await confirm(
      rl,
      'JIRA設定をカスタマイズしますか？',
      false,
    );
    if (configureJira) {
      config.jira = await getJiraConfig(rl);
    }

    // ワークフロー設定
    const configureWorkflow = await confirm(
      rl,
      'ワークフロー設定をカスタマイズしますか？',
      false,
    );
    if (configureWorkflow) {
      config.workflow = await getWorkflowConfig(rl);
    }

    // 設定の確認
    console.log('\n📋 設定内容の確認');
    console.log('='.repeat(60));
    console.log(JSON.stringify(config, null, 2));
    console.log('');

    const confirmSave = await confirm(rl, 'この設定を保存しますか？', true);

    if (!confirmSave) {
      console.log('保存をキャンセルしました。');
      process.exit(0);
    }

    // ディレクトリを作成（存在しない場合）
    if (!existsSync(globalConfigDir)) {
      mkdirSync(globalConfigDir, { recursive: true });
      console.log(`\n📁 ディレクトリを作成しました: ${globalConfigDir}`);
    }

    // 設定ファイルを保存
    writeFileSync(globalConfigPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    console.log(`\n✅ グローバル設定ファイルを保存しました: ${globalConfigPath}`);

    // バリデーション（スキーマチェックのみ）
    console.log('\n🔍 設定ファイルのバリデーション...');
    try {
      AppConfigSchema.parse(config);
      console.log('✅ 設定ファイルは有効です。');
    } catch (error) {
      console.warn('⚠️  設定ファイルに問題があります:');
      console.warn(error instanceof Error ? error.message : error);
      console.warn('   プロジェクト固有の設定で補完することができます。');
    }

    console.log('\n🎉 グローバル設定が完了しました！');
    console.log('   この設定はすべてのプロジェクトに適用されます。');
    console.log('   プロジェクト固有の設定で上書きしたい場合は:');
    console.log('   グローバル設定をコピーして .michi/config.json として編集してください');
  } catch (error) {
    console.error(
      '❌ エラーが発生しました:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    rl.close();
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { main as configGlobal };
