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
  getGlobalEnvPath,
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

    // HOMEディレクトリをテスト用に変更（グローバル設定の影響を排除）
    process.env.HOME = testProjectRoot;

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
      } catch {
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

  describe('5層階層対応', () => {
    describe('getGlobalEnvPath', () => {
      it('~/.michi/.envのパスを返す', () => {
        const envPath = getGlobalEnvPath();
        expect(envPath).toBe(join(process.env.HOME as string, '.michi', '.env'));
      });
    });

    describe('グローバル.envからの設定読み込み', () => {
      it('グローバル.envからAtlassian設定を読み込む', () => {
        clearConfigCache();

        // ~/.michi/.env を作成
        const globalEnvPath = join(testProjectRoot, '.michi', '.env');
        writeFileSync(globalEnvPath, 'ATLASSIAN_URL=https://test.atlassian.net\n');

        const config = loadConfig(testProjectRoot);

        // グローバル.envの値が読み込まれることを確認
        expect(config).toHaveProperty('atlassian');
        // 注: 実装後に具体的なアサーションを追加
      });

      it('グローバル.envが存在しない場合でもエラーにならない', () => {
        clearConfigCache();

        // ~/.michi/.env を削除
        const globalEnvPath = join(testProjectRoot, '.michi', '.env');
        if (existsSync(globalEnvPath)) {
          unlinkSync(globalEnvPath);
        }

        expect(() => {
          loadConfig(testProjectRoot);
        }).not.toThrow();
      });
    });

    describe('project.jsonからの設定読み込み', () => {
      it('project.jsonからプロジェクトメタデータを読み込む', () => {
        clearConfigCache();

        // .kiro/project.json を作成
        const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
        mkdirSync(join(testProjectRoot, '.kiro'), { recursive: true });
        writeFileSync(projectJsonPath, JSON.stringify({
          projectId: 'test-project',
          projectName: 'Test Project',
          jiraProjectKey: 'TP'
        }));

        const config = loadConfig(testProjectRoot);

        // project.jsonの値が読み込まれることを確認
        expect(config).toHaveProperty('project');
        // 注: 実装後に具体的なアサーションを追加
      });

      it('project.jsonが存在しない場合でもエラーにならない', () => {
        clearConfigCache();

        // .kiro/project.json を削除
        const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
        if (existsSync(projectJsonPath)) {
          unlinkSync(projectJsonPath);
        }

        expect(() => {
          loadConfig(testProjectRoot);
        }).not.toThrow();
      });
    });

    describe('優先順位の検証', () => {
      it('プロジェクト.envがグローバル.envより優先される', () => {
        clearConfigCache();

        // グローバル.env
        const globalEnvPath = join(testProjectRoot, '.michi', '.env');
        writeFileSync(globalEnvPath, 'CONFLUENCE_PRD_SPACE=GLOBAL\n');

        // プロジェクト.env
        const projectEnvPath = join(testProjectRoot, '.env');
        writeFileSync(projectEnvPath, 'CONFLUENCE_PRD_SPACE=PROJECT\n');

        const config = loadConfig(testProjectRoot);

        // プロジェクト.envの値が優先されることを確認
        expect(config.confluence?.spaces?.requirements).toBe('PROJECT');
      });
    });

    describe('キャッシュ無効化', () => {
      it('グローバル.envを変更するとキャッシュが無効化される', async () => {
        clearConfigCache();

        // 最初の設定
        const globalEnvPath = join(testProjectRoot, '.michi', '.env');
        writeFileSync(globalEnvPath, 'CONFLUENCE_PRD_SPACE=INITIAL\n');

        const config1 = getConfig(testProjectRoot);

        // ファイルシステムのmtime精度を考慮して少し待つ
        await new Promise(resolve => setTimeout(resolve, 10));

        // 設定を更新
        writeFileSync(globalEnvPath, 'CONFLUENCE_PRD_SPACE=UPDATED\n');

        const config2 = getConfig(testProjectRoot);

        // 異なる値が返されることを確認（キャッシュが無効化された）
        expect(config1.confluence?.spaces?.requirements).toBe('INITIAL');
        expect(config2.confluence?.spaces?.requirements).toBe('UPDATED');
      });

      it('project.jsonを変更するとキャッシュが無効化される', async () => {
        clearConfigCache();

        // 最初の設定
        const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
        mkdirSync(join(testProjectRoot, '.kiro'), { recursive: true });
        writeFileSync(projectJsonPath, JSON.stringify({
          projectId: 'initial-id',
          projectName: 'Initial Name'
        }));

        const config1 = getConfig(testProjectRoot);

        // ファイルシステムのmtime精度を考慮して少し待つ
        await new Promise(resolve => setTimeout(resolve, 10));

        // 設定を更新
        writeFileSync(projectJsonPath, JSON.stringify({
          projectId: 'updated-id',
          projectName: 'Updated Name'
        }));

        const config2 = getConfig(testProjectRoot);

        // 異なるオブジェクトが返されることを確認（キャッシュが無効化された）
        expect(config1).not.toBe(config2);
      });
    });
  });
});

