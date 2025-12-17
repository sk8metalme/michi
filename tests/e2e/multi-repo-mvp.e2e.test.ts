/**
 * Task 13.1: Phase 1 (MVP) E2Eテスト
 * プロジェクト初期化 → リポジトリ登録 → プロジェクト一覧表示
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  cpSync,
} from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { AppConfig } from '../../scripts/config/config-schema.js';

describe('Task 13.1: Phase 1 (MVP) E2Eテスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let cliPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-e2e-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // テンプレートディレクトリをコピー
    const sourceTemplateDir = join(originalCwd, 'templates');
    const destTemplateDir = join(testRoot, 'templates');
    cpSync(sourceTemplateDir, destTemplateDir, { recursive: true });

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    const initialConfig: AppConfig = {
      multiRepoProjects: [],
    };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

    // CLIパスを取得（ビルド後のdist/src/cli.js）
    cliPath = join(originalCwd, 'dist', 'src', 'cli.js');

    // カレントディレクトリを変更
    process.chdir(testRoot);
  });

  afterEach(() => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // テスト用ディレクトリを削除（リトライ付き）
    if (existsSync(testRoot)) {
      rmSync(testRoot, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  });

  describe('MVP ユーザーシナリオ', () => {
    it('プロジェクト初期化 → リポジトリ登録 → プロジェクト一覧表示', () => {
      const projectName = 'my-multi-repo';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      // 1. プロジェクト初期化
      const initOutput = execSync(
        `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 初期化出力の検証
      expect(initOutput).toContain('Multi-Repoプロジェクトの初期化が完了しました');
      expect(initOutput).toContain(projectName);

      // ディレクトリ構造の検証
      const projectDir = join(testRoot, 'docs', 'michi', projectName);
      expect(existsSync(projectDir)).toBe(true);
      expect(existsSync(join(projectDir, 'overview'))).toBe(true);
      expect(existsSync(join(projectDir, 'steering'))).toBe(true);
      expect(existsSync(join(projectDir, 'tests'))).toBe(true);
      expect(existsSync(join(projectDir, 'docs'))).toBe(true);

      // テンプレートファイルの検証
      const requirementsFile = join(projectDir, 'overview', 'requirements.md');
      expect(existsSync(requirementsFile)).toBe(true);
      const requirementsContent = readFileSync(requirementsFile, 'utf-8');
      expect(requirementsContent).toContain(projectName);
      expect(requirementsContent).toContain(jiraKey);

      // config.json更新の検証
      let config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      expect(config.multiRepoProjects).toBeDefined();
      expect(config.multiRepoProjects!.length).toBe(1);
      expect(config.multiRepoProjects![0].name).toBe(projectName);
      expect(config.multiRepoProjects![0].jiraKey).toBe(jiraKey);
      expect(config.multiRepoProjects![0].confluenceSpace).toBe(confluenceSpace);
      expect(config.multiRepoProjects![0].repositories).toEqual([]);

      // 2. リポジトリ登録
      const repoName = 'repo1';
      const repoUrl = 'https://github.com/owner/repo1';
      const repoBranch = 'main';

      const addRepoOutput = execSync(
        `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${repoBranch}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // リポジトリ登録出力の検証
      expect(addRepoOutput).toContain('リポジトリの追加が完了しました');
      expect(addRepoOutput).toContain(repoName);

      // config.json更新の検証
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      expect(config.multiRepoProjects![0].repositories.length).toBe(1);
      expect(config.multiRepoProjects![0].repositories[0].name).toBe(repoName);
      expect(config.multiRepoProjects![0].repositories[0].url).toBe(repoUrl);
      expect(config.multiRepoProjects![0].repositories[0].branch).toBe(repoBranch);

      // 3. プロジェクト一覧表示
      const listOutput = execSync(`node "${cliPath}" multi-repo:list`, {
        cwd: testRoot,
        encoding: 'utf-8',
      });

      // 一覧表示出力の検証
      expect(listOutput).toContain('Multi-Repoプロジェクト一覧');
      expect(listOutput).toContain('(1件)');
      expect(listOutput).toContain(projectName);
      expect(listOutput).toContain(`JIRA Key: ${jiraKey}`);
      expect(listOutput).toContain('リポジトリ数: 1');
    });

    it('複数リポジトリの登録', () => {
      const projectName = 'multi-repo-project';
      const jiraKey = 'MRP';
      const confluenceSpace = 'MRP';

      // プロジェクト初期化
      execSync(
        `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 複数のリポジトリを登録
      execSync(
        `node "${cliPath}" multi-repo:add-repo ${projectName} --name repo1 --url https://github.com/owner/repo1 --branch main`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      execSync(
        `node "${cliPath}" multi-repo:add-repo ${projectName} --name repo2 --url https://github.com/owner/repo2 --branch develop`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      execSync(
        `node "${cliPath}" multi-repo:add-repo ${projectName} --name repo3 --url https://github.com/owner/repo3 --branch main`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 一覧表示
      const listOutput = execSync(`node "${cliPath}" multi-repo:list`, {
        cwd: testRoot,
        encoding: 'utf-8',
      });

      // 検証
      expect(listOutput).toContain('リポジトリ数: 3');

      // config.json検証
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      expect(config.multiRepoProjects![0].repositories.length).toBe(3);
    });
  });

  describe('エラーケース', () => {
    it('無効なプロジェクト名でエラー', () => {
      const invalidProjectName = '../invalid-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      expect(() => {
        execSync(
          `node "${cliPath}" multi-repo:init ${invalidProjectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );
      }).toThrow();
    });

    it('重複プロジェクト名でエラー', () => {
      const projectName = 'duplicate-project';
      const jiraKey = 'PROJ';
      const confluenceSpace = 'SPACE';

      // 1回目: 成功
      execSync(
        `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 2回目: エラー
      expect(() => {
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );
      }).toThrow();
    });

    it('存在しないプロジェクトへのリポジトリ追加でエラー', () => {
      const projectName = 'non-existent-project';
      const repoName = 'repo1';
      const repoUrl = 'https://github.com/owner/repo1';
      const repoBranch = 'main';

      expect(() => {
        execSync(
          `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${repoBranch}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );
      }).toThrow();
    });
  });
});
