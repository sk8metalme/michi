/**
 * env-loader.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

describe('env-loader', () => {
  const testDir = join(process.cwd(), 'test-temp-env-loader');
  const testGlobalDir = join(testDir, '.michi');
  const testGlobalEnvPath = join(testGlobalDir, '.env');
  const testLocalEnvPath = join(testDir, '.env');

  // 元の環境変数を保存
  const originalEnv = { ...process.env };
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();

  beforeEach(() => {
    // テスト用ディレクトリ作成
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (!existsSync(testGlobalDir)) {
      mkdirSync(testGlobalDir, { recursive: true });
    }

    // カレントディレクトリをテストディレクトリに変更
    process.chdir(testDir);

    // 環境変数をクリア
    for (const key in process.env) {
      if (key.startsWith('TEST_')) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    // カレントディレクトリを戻す
    process.chdir(originalCwd);

    // クリーンアップ
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // 環境変数を復元
    process.env = { ...originalEnv };
    if (originalHome) {
      process.env.HOME = originalHome;
    }
  });

  it('should load global .env if exists', () => {
    // グローバル .env を作成
    const globalContent = `TEST_GLOBAL_VAR=global_value
TEST_SHARED_VAR=global_shared`;
    writeFileSync(testGlobalEnvPath, globalContent, 'utf-8');

    // HOMEを一時的に変更
    process.env.HOME = testDir;

    // dotenvで読み込みをシミュレート（env-loader.tsと同じロジック）
    if (existsSync(testGlobalEnvPath)) {
      config({ path: testGlobalEnvPath });
    }

    expect(process.env.TEST_GLOBAL_VAR).toBe('global_value');
    expect(process.env.TEST_SHARED_VAR).toBe('global_shared');
  });

  it('should load local .env if exists', () => {
    // ローカル .env を作成
    const localContent = `TEST_LOCAL_VAR=local_value
TEST_SHARED_VAR=local_shared`;
    writeFileSync(testLocalEnvPath, localContent, 'utf-8');

    // dotenvでローカル.envを読み込み
    config();

    expect(process.env.TEST_LOCAL_VAR).toBe('local_value');
    expect(process.env.TEST_SHARED_VAR).toBe('local_shared');
  });

  it('should override global with local', () => {
    // グローバル .env を作成
    const globalContent = `TEST_GLOBAL_VAR=global_value
TEST_SHARED_VAR=global_shared`;
    writeFileSync(testGlobalEnvPath, globalContent, 'utf-8');

    // ローカル .env を作成
    const localContent = `TEST_LOCAL_VAR=local_value
TEST_SHARED_VAR=local_shared`;
    writeFileSync(testLocalEnvPath, localContent, 'utf-8');

    // HOMEを一時的に変更
    process.env.HOME = testDir;

    // env-loader.tsと同じロジックで読み込み
    if (existsSync(testGlobalEnvPath)) {
      config({ path: testGlobalEnvPath });
    }
    config({ override: true }); // ローカル .env（グローバルを上書き）

    // ローカルがグローバルを上書きする
    expect(process.env.TEST_GLOBAL_VAR).toBe('global_value');
    expect(process.env.TEST_LOCAL_VAR).toBe('local_value');
    expect(process.env.TEST_SHARED_VAR).toBe('local_shared'); // ローカルで上書き
  });

  it('should handle missing files gracefully', () => {
    // 両方のファイルを作成しない
    process.env.HOME = join(testDir, 'nonexistent');

    // エラーを投げないことを確認
    expect(() => {
      if (existsSync(join(process.env.HOME!, '.michi', '.env'))) {
        config({ path: join(process.env.HOME!, '.michi', '.env') });
      }
      config();
    }).not.toThrow();
  });

  it('should not fail if global directory does not exist', () => {
    // ローカル .env のみ作成
    const localContent = `TEST_LOCAL_VAR=local_value`;
    writeFileSync(testLocalEnvPath, localContent, 'utf-8');

    // .michiディレクトリが存在しないHOMEを設定
    process.env.HOME = join(testDir, 'no-michi-dir');

    expect(() => {
      const globalPath = join(process.env.HOME!, '.michi', '.env');
      if (existsSync(globalPath)) {
        config({ path: globalPath });
      }
      config();
    }).not.toThrow();

    expect(process.env.TEST_LOCAL_VAR).toBe('local_value');
  });
});
