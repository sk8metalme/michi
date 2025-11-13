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
    // テスト用の一時ディレクトリを作成
    testProjectRoot = resolve(tmpdir(), `michi-test-${Date.now()}`);
    mkdirSync(testProjectRoot, { recursive: true });
    mkdirSync(join(testProjectRoot, '.michi'), { recursive: true });

    // 環境変数をバックアップ
    originalEnv = { ...process.env };
    
    // キャッシュをクリア
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
    
    // キャッシュをクリア
    clearConfigCache();
  });

  describe('getConfigPath', () => {
    it('.michi/config.jsonのパスを返す', () => {
      const configPath = getConfigPath(testProjectRoot);
      expect(configPath).toBe(join(testProjectRoot, '.michi/config.json'));
    });

    it('設定ファイルが存在しない場合でも.michi/config.jsonのパスを返す', () => {
      const configPath = getConfigPath(testProjectRoot);
      expect(configPath).toBe(join(testProjectRoot, '.michi/config.json'));
      expect(existsSync(configPath)).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('設定ファイルが存在しない場合はデフォルト設定を返す', () => {
      const config = loadConfig(testProjectRoot);
      
      expect(config).toBeDefined();
      expect(config.confluence).toBeDefined();
      expect(config.confluence.pageCreationGranularity).toBe('single');
    });

    it('設定ファイルが存在する場合はマージされた設定を返す', () => {
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
      
      expect(config.confluence.pageCreationGranularity).toBe('by-hierarchy');
      expect(config.confluence.spaces?.requirements).toBe('TestSpace');
    });

    it('無効なJSONの場合はエラーをスロー', () => {
      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, '{ invalid json }');

      expect(() => {
        loadConfig(testProjectRoot);
      }).toThrow();
    });
  });

  describe('getConfig (キャッシュ付き)', () => {
    it('設定ファイルが存在しない場合はデフォルト設定を返す', () => {
      const config = getConfig(testProjectRoot);
      
      expect(config).toBeDefined();
      expect(config.confluence).toBeDefined();
    });

    it('同じ設定ファイルを2回読み込む場合はキャッシュが使用される', () => {
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

    it('設定ファイルを変更するとキャッシュが無効化される', () => {
      const configPath = join(testProjectRoot, '.michi/config.json');
      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'single'
        }
      }));

      const config1 = getConfig(testProjectRoot);
      expect(config1.confluence.pageCreationGranularity).toBe('single');

      // 設定ファイルを更新
      writeFileSync(configPath, JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-hierarchy'
        }
      }));

      const config2 = getConfig(testProjectRoot);
      expect(config2.confluence.pageCreationGranularity).toBe('by-hierarchy');
    });
  });

  describe('警告メッセージ', () => {
    it('legacyパス（.kiro/config.json）が存在する場合は警告を表示', () => {
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

      getConfigPath(testProjectRoot);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Deprecated');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('.kiro/config.json');

      consoleWarnSpy.mockRestore();
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

      getConfigPath(testProjectRoot);

      // 警告は表示されない（新規パスが存在するため）
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});

