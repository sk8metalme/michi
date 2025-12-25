/**
 * init command のテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readFileSync,
} from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { initProject } from '../init.js';

describe('init command', () => {
  let testProjectRoot: string;
  let testHomeDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // テスト用の一時ディレクトリを作成
    testProjectRoot = resolve(
      tmpdir(),
      `michi-test-init-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );
    testHomeDir = resolve(
      tmpdir(),
      `michi-test-home-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );

    // 既存のディレクトリがあれば削除
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
    }

    // テスト用ディレクトリ構造を作成
    mkdirSync(testProjectRoot, { recursive: true });
    mkdirSync(testHomeDir, { recursive: true });
    mkdirSync(join(testHomeDir, '.michi'), { recursive: true });

    // 環境変数をバックアップ
    originalEnv = { ...process.env };

    // HOMEディレクトリをテスト用に変更
    process.env.HOME = testHomeDir;

    // プロジェクトルートに移動
    process.chdir(testProjectRoot);

    // .gitディレクトリを作成（リポジトリルート検出のため）
    mkdirSync(join(testProjectRoot, '.git'), { recursive: true });
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;

    // テスト用ディレクトリを削除
    if (existsSync(testProjectRoot)) {
      try {
        rmSync(testProjectRoot, { recursive: true, force: true });
      } catch {
        // 削除失敗は無視
      }
    }
    if (existsSync(testHomeDir)) {
      try {
        rmSync(testHomeDir, { recursive: true, force: true });
      } catch {
        // 削除失敗は無視
      }
    }
  });

  describe('新規プロジェクト初期化', () => {
    it('基本的な初期化が成功する（--yes で自動承認）', async () => {
      // 実行
      await initProject({
        name: 'test-project',
        projectName: 'テストプロジェクト',
        jiraKey: 'TEST',
        yes: true,
        claude: true,
        lang: 'ja',
        skipConfig: true,
      });

      // .kiro/project.json が作成されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);

      const projectJson = JSON.parse(
        readFileSync(projectJsonPath, 'utf-8'),
      );
      expect(projectJson.projectId).toBe('test-project');
      expect(projectJson.projectName).toBe('テストプロジェクト');
      expect(projectJson.jiraProjectKey).toBe('TEST');
      expect(projectJson.language).toBe('ja');

      // .env テンプレートが作成されたことを確認
      const envPath = join(testProjectRoot, '.env');
      expect(existsSync(envPath)).toBe(true);
    });
  });

  describe('既存プロジェクトモード (--existing)', () => {
    it('--existing フラグで既存プロジェクトとして初期化', async () => {
      // 既存のpackage.jsonを作成（既存プロジェクトをシミュレート）
      writeFileSync(
        join(testProjectRoot, 'package.json'),
        JSON.stringify({ name: 'existing-app', version: '1.0.0' }),
      );

      // 実行（projectIdを指定しない → ディレクトリ名から自動生成）
      await initProject({
        existing: true,
        projectName: 'Existing Application',
        jiraKey: 'EXIST',
        yes: true,
        claude: true,
        lang: 'ja',
        skipConfig: true,
      });

      // .kiro/project.json が作成されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);

      const projectJson = JSON.parse(
        readFileSync(projectJsonPath, 'utf-8'),
      );

      // projectIdはディレクトリ名から自動生成される
      expect(projectJson.projectId).toMatch(/michi-test-init-/);
      expect(projectJson.projectName).toBe('Existing Application');
      expect(projectJson.jiraProjectKey).toBe('EXIST');
    });

    it('既存の .env がある場合はスキップ', async () => {
      // 既存の.envを作成
      const existingEnvContent = 'EXISTING_VAR=value';
      writeFileSync(join(testProjectRoot, '.env'), existingEnvContent);

      // 実行
      await initProject({
        existing: true,
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      // .env が上書きされていないことを確認
      const envContent = readFileSync(join(testProjectRoot, '.env'), 'utf-8');
      expect(envContent).toBe(existingEnvContent);
    });
  });

  describe('自動検出', () => {
    it('package.json が存在する場合、既存プロジェクトと自動判定', async () => {
      // package.jsonを作成
      writeFileSync(
        join(testProjectRoot, 'package.json'),
        JSON.stringify({ name: 'my-app' }),
      );

      // --existing なしで実行した場合、自動検出ロジックが動く
      // （このテストでは --yes があるため自動で既存モードになる）
      await initProject({
        name: 'my-app',
        projectName: 'My Application',
        jiraKey: 'MYAPP',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      // 正常に初期化されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);
    });

    it('pom.xml が存在する場合、既存プロジェクトと自動判定', async () => {
      // pom.xmlを作成（Java/Maven）
      writeFileSync(
        join(testProjectRoot, 'pom.xml'),
        '<project></project>',
      );

      await initProject({
        name: 'java-app',
        projectName: 'Java Application',
        jiraKey: 'JAVA',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      // 正常に初期化されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);
    });

    it('build.gradle が存在する場合、既存プロジェクトと自動判定', async () => {
      // build.gradleを作成（Java/Gradle）
      writeFileSync(
        join(testProjectRoot, 'build.gradle'),
        'plugins { }',
      );

      await initProject({
        name: 'gradle-app',
        projectName: 'Gradle Application',
        jiraKey: 'GRAD',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      // 正常に初期化されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);
    });

    it('composer.json が存在する場合、既存プロジェクトと自動判定', async () => {
      // composer.jsonを作成（PHP）
      writeFileSync(
        join(testProjectRoot, 'composer.json'),
        JSON.stringify({ name: 'php/app' }),
      );

      await initProject({
        name: 'php-app',
        projectName: 'PHP Application',
        jiraKey: 'PHP',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      // 正常に初期化されたことを確認
      const projectJsonPath = join(testProjectRoot, '.kiro', 'project.json');
      expect(existsSync(projectJsonPath)).toBe(true);
    });
  });

  describe('グローバル設定の利用', () => {
    it('グローバル設定がある場合、.michi/config.jsonにコピー', async () => {
      // グローバル設定を作成
      const globalConfig = {
        confluence: {
          pageCreationGranularity: 'single',
        },
        jira: {
          createEpic: true,
        },
        workflow: {
          enabledPhases: ['requirements', 'design'],
        },
      };

      mkdirSync(join(testHomeDir, '.michi'), { recursive: true });
      writeFileSync(
        join(testHomeDir, '.michi', 'config.json'),
        JSON.stringify(globalConfig, null, 2),
      );

      // 実行（skipConfig: false）
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        claude: true,
        skipConfig: false,
      });

      // .michi/config.json が作成され、グローバル設定がコピーされたことを確認
      const projectConfigPath = join(
        testProjectRoot,
        '.michi',
        'config.json',
      );
      expect(existsSync(projectConfigPath)).toBe(true);

      const projectConfig = JSON.parse(
        readFileSync(projectConfigPath, 'utf-8'),
      );
      expect(projectConfig.confluence.pageCreationGranularity).toBe('single');
      expect(projectConfig.jira.createEpic).toBe(true);
    });
  });

  describe('バリデーション', () => {
    it('無効なプロジェクトIDはエラー', async () => {
      await expect(
        initProject({
          name: '../invalid',
          projectName: 'Test',
          jiraKey: 'TEST',
          yes: true,
          claude: true,
          skipConfig: true,
        }),
      ).rejects.toThrow(/無効なプロジェクトID/);
    });

    it('無効なプロジェクト名はエラー', async () => {
      await expect(
        initProject({
          name: 'test-project',
          projectName: '', // 空のプロジェクト名
          jiraKey: 'TEST',
          yes: true,
          claude: true,
          skipConfig: true,
        }),
      ).rejects.toThrow(/プロジェクト名/);
    });

    it('無効なJIRAキーはエラー', async () => {
      await expect(
        initProject({
          name: 'test-project',
          projectName: 'Test Project',
          jiraKey: 'TOOLONGKEY123', // 10文字超
          yes: true,
          claude: true,
          skipConfig: true,
        }),
      ).rejects.toThrow(/JIRAキー/);
    });
  });
});
