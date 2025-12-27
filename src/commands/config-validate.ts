/**
 * config-validate command
 * 設定ファイルのセキュリティ検証を実行するコマンド
 *
 * 使い方:
 * npx @sk8metal/michi-cli config:validate
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadDotenv } from 'dotenv';
import { loadProjectMeta } from '../../scripts/utils/project-meta.js';
import { validateEnvironmentConfig } from '../../scripts/utils/security-validator.js';

export async function configValidate(): Promise<void> {
  console.log('');
  console.log('🔍 Michi 設定検証ツール');
  console.log('================================================');
  console.log('');

  try {
    // .env ファイルを読み込み
    const projectRoot = process.cwd();
    const envPath = resolve(projectRoot, '.env');

    if (!existsSync(envPath)) {
      throw new Error(`.env file not found in ${projectRoot}`);
    }

    // 環境変数を読み込み
    const envResult = loadDotenv({ path: envPath });

    if (envResult.error) {
      throw envResult.error;
    }

    const env = envResult.parsed || {};

    // project.json から repository情報を取得
    let repositoryUrl: string | undefined;
    try {
      const meta = loadProjectMeta(projectRoot);
      repositoryUrl = meta.repository;
    } catch {
      // project.json がない場合はスキップ
      repositoryUrl = undefined;
    }

    // 検証実行
    console.log('[検証中...]');
    const result = validateEnvironmentConfig({
      atlassianUrl: env.ATLASSIAN_URL,
      atlassianEmail: env.ATLASSIAN_EMAIL,
      atlassianApiToken: env.ATLASSIAN_API_TOKEN,
      githubOrg: env.GITHUB_ORG,
      githubToken: env.GITHUB_TOKEN,
      repositoryUrl,
    });

    // 結果表示
    console.log('');

    if (result.errors.length > 0) {
      console.log('❌ エラー検出:');
      result.errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  警告:');
      result.warnings.forEach((warning) => {
        console.log(`  - ${warning}`);
      });
      console.log('');
    }

    if (result.success && result.warnings.length === 0) {
      console.log('✅ 検証成功: 設定に問題はありません');
      console.log('');
    } else if (result.success) {
      console.log('✅ 検証成功: エラーはありませんが、警告があります');
      console.log('');
    } else {
      console.log('❌ 検証失敗: 設定にエラーがあります');
      console.log('');
      throw new Error('Configuration validation failed');
    }

    console.log('================================================');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ 検証エラー:', error instanceof Error ? error.message : error);
    console.error('');
    throw error;
  }
}
