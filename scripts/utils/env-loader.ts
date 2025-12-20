/**
 * 環境変数読み込みユーティリティ
 * グローバル設定（~/.michi/.env）とローカル設定（.env）を読み込む
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * 環境変数を読み込む
 * グローバル設定（~/.michi/.env）→ローカル設定（.env）の順で読み込み
 * ローカル設定がグローバル設定を上書きする
 */
export function loadEnv(): void {
  // 1. グローバル設定 ~/.michi/.env を読み込む
  const globalEnvPath = join(homedir(), '.michi', '.env');
  if (existsSync(globalEnvPath)) {
    config({ path: globalEnvPath });
  }

  // 2. ローカル設定 .env を読み込む（グローバル設定を上書き）
  config({ override: true });
}
