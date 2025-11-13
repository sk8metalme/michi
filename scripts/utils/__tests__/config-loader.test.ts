/**
 * config-loader.ts のユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import {
  loadConfig,
  getConfig,
  getConfigPath,
  clearConfigCache
} from '../config-loader.js';

describe('config-loader', () => {
  let testProjectRoot: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // テスト用の一時ディレクトリを作成（ランダム要素を追加して衝突を防ぐ）
    testProjectRoot = resolve(tmpdir(), `michi-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);

    // 既存のディレクトリがあれば削除
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }

    mkdirSync(testProjectRoot, { recursive: true });
    mkdirSync(join(testProjectRoot, '.michi'), { recursive: true });

    // 環境変数をバックアップ
    originalEnv = { ...process.env };

    // キャッシュをクリア（クリーンな状態から開始）
    clearConfigCache();
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;

    // テスト用ディレクトリを削除
    if (existsSync(testProjectRoot)) {
      // ファイルを削除
      const configPath = join(testProjectRoot, '.michi/config.json');
      if (existsSync(configPath)) {
        unlinkSync(configPath);
      }
      // ディレクトリを削除
      try {
        rmSync(testProjectRoot, { recursive: true, force: true });
      } catch (e) {
        // 削除失敗は無視
      }
    }

    // キャッシュをクリア（ディレクトリ削除後に実行）
    clearConfigCache();
  });

  describe('getConfigPath', () => {
    it('.michi/config.jsonのパスを返す', () => {
      clearConfigCache();
      const configPath = getConfigPath(testProjectRoot);
      expect(configPath).toBe(join(testProjectRoot, '.michi/config.json'));
    });

    it('設定ファイルが存在しない場合でも.michi/config.jsonのパスを返す', () => {
      clearConfigCache();
      const configPath = getConfigPath(testProjectRoot);
      expect(configPath).toBe(join(testProjectRoot, '.michi/config.json'));
      expect(existsSync(configPath)).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('設定ファイルが存在しない場合はデフォルト設定を返す', () => {
      clearConfigCache();
      const config = loadConfig(testProjectRoot);

      expect(config).toBeDefined();
      expect(config.confluence).toBeDefined();
      expect(config.confluence?.pageCreationGranularity).toBe('single');
    });

    it('設定ファイルが存在する場合はマージされた設定を返す', () => {
      clearConfigCache();
      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-hierarchy',
          spaces: {
            requirements: 'TestSpace'
          }
        }
      }));

      const config = loadConfig(testProjectRoot);

      expect(config.confluence?.pageCreationGranularity).toBe('by-hierarchy');
      expect(config.confluence?.spaces?.requirements).toBe('TestSpace');
    });

    it('無効なJSONの場合はエラーをスロー', () => {
      clearConfigCache(); // キャッシュをクリア
      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, '{ invalid json }');

      expect(() => {
        loadConfig(testProjectRoot);
      }).toThrow(/Invalid JSON/);

      // テスト後にファイルを削除して次のテストへの影響を防ぐ
      if (existsSync(configPath)) {
        unlinkSync(configPath);
      }
    });
  });

  describe('getConfig (キャッシュ付き)', () => {
    // キャッシュテストでは、beforeEachでキャッシュをクリアしない
    // 代わりに、各テストの最後にキャッシュをクリアする

    it('設定ファイルが存在しない場合はデフォルト設定を返す', () => {
      clearConfigCache(); // テスト開始時にクリア
      const config = getConfig(testProjectRoot);

      expect(config).toBeDefined();
      expect(config.confluence).toBeDefined();
    });

    it('同じ設定ファイルを2回読み込む場合はキャッシュが使用される', () => {
      clearConfigCache(); // テスト開始時にクリア

      // .kiro/が存在しないことを確認（legacy警告を防ぐ）
      const legacyDir = join(testProjectRoot, '.kiro');
      if (existsSync(legacyDir)) {
        rmSync(legacyDir, { recursive: true, force: true });
      }

      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-hierarchy'
        }
      }));

      const config1 = getConfig(testProjectRoot);
      const config2 = getConfig(testProjectRoot);

      // 同じオブジェクト参照であることを確認（キャッシュが使用されている）
      expect(config1).toBe(config2);
    });

    it('設定ファイルを変更するとキャッシュが無効化される', async () => {
      clearConfigCache(); // テスト開始時にクリア

      // .michiディレクトリが存在することを確認（前のテストで削除されている可能性）
      const michiDir = join(testProjectRoot, '.michi');
      if (!existsSync(michiDir)) {
        mkdirSync(michiDir, { recursive: true });
      }

      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'single'
        }
      }));

      const config1 = getConfig(testProjectRoot);
      expect(config1.confluence?.pageCreationGranularity).toBe('single');

      // ファイルシステムのmtime精度を考慮して少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      // 設定ファイルを更新（ディレクトリが削除されている可能性があるため再確認）
      if (!existsSync(michiDir)) {
        mkdirSync(michiDir, { recursive: true });
      }

      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-hierarchy'
        }
      }));

      const config2 = getConfig(testProjectRoot);
      expect(config2.confluence?.pageCreationGranularity).toBe('by-hierarchy');
    });
  });

  describe('警告メッセージ', () => {
    it('legacyパス（.kiro/config.json）が存在する場合は警告を表示', () => {
      // .michi/config.jsonが存在しないことを確認（警告が表示される条件）
      const michiConfigPath = join(testProjectRoot, '.michi/config.json');
      const michiDir = join(testProjectRoot, '.michi');

      // .michi/config.jsonとディレクトリを削除
      if (existsSync(michiConfigPath)) {
        unlinkSync(michiConfigPath);
      }
      if (existsSync(michiDir)) {
        rmSync(michiDir, { recursive: true, force: true });
      }

      // legacyパスにファイルを作成
      mkdirSync(join(testProjectRoot, '.kiro'), { recursive: true });
      const legacyConfigPath = join(testProjectRoot, '.kiro/config.json');
      writeFileSync(legacyConfigPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'single'
        }
      }));

      // 警告が表示されることを確認（console.warnをモック）
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // loadConfigを呼ぶことでresolveConfigPathが実行され、警告が表示される
      loadConfig(testProjectRoot);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Deprecated');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('.kiro/config.json');

      consoleWarnSpy.mockRestore();

      // 次のテストのために.michiディレクトリを再作成
      mkdirSync(michiDir, { recursive: true });
    });

    it('legacyパスと新規パスの両方が存在する場合は警告を表示しない', () => {
      // 両方のパスにファイルを作成
      mkdirSync(join(testProjectRoot, '.kiro'), { recursive: true });
      const legacyConfigPath = join(testProjectRoot, '.kiro/config.json');
      const michiConfigPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(legacyConfigPath, JSON.stringify({}));
      writeFileSync(michiConfigPath, JSON.stringify({}));

      // 警告が表示されないことを確認
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // loadConfigを呼ぶことでresolveConfigPathが実行される
      loadConfig(testProjectRoot);

      // 警告は表示されない（新規パスが存在するため）
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});

