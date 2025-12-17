/**
 * Task 12.2: リポジトリ登録フロー全体の統合テスト
 * AddRepoCommand + ConfigManagement + Validator の統合テスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { multiRepoAddRepo } from '../../src/commands/multi-repo-add-repo.js';
import type { AppConfig } from '../../scripts/config/config-schema.js';

describe('Task 12.2: リポジトリ登録フロー全体の統合テスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-integration-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    // テストプロジェクトを含むconfig.jsonを作成
    const initialConfig: AppConfig = {
      multiRepoProjects: [
        {
          name: 'test-multi-repo',
          jiraKey: 'PROJ',
          confluenceSpace: 'SPACE',
          createdAt: '2024-01-01T00:00:00.000Z',
          repositories: [],
        },
      ],
    };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

    // カレントディレクトリを変更
    process.chdir(testRoot);
  });

  afterEach(() => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // テスト用ディレクトリを削除
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('正常ケース', () => {
    it('リポジトリ登録、config.json更新', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = 'my-repo';
      const url = 'https://github.com/owner/my-repo';
      const branch = 'main';

      const result = await multiRepoAddRepo(
        projectName,
        repositoryName,
        url,
        branch,
        testRoot
      );

      // 結果検証
      expect(result.success).toBe(true);
      expect(result.projectName).toBe(projectName);
      expect(result.repositoryName).toBe(repositoryName);
      expect(result.url).toBe(url);
      expect(result.branch).toBe(branch);

      // config.json更新の検証
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      expect(config.multiRepoProjects).toBeDefined();
      expect(config.multiRepoProjects!.length).toBe(1);

      const project = config.multiRepoProjects![0];
      expect(project.repositories.length).toBe(1);
      expect(project.repositories[0].name).toBe(repositoryName);
      expect(project.repositories[0].url).toBe(url);
      expect(project.repositories[0].branch).toBe(branch);
    });

    it('ブランチ名のデフォルト値（"main"）', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = 'my-repo';
      const url = 'https://github.com/owner/my-repo';

      const result = await multiRepoAddRepo(
        projectName,
        repositoryName,
        url,
        '', // 空文字列を渡す
        testRoot
      );

      // ブランチ名がデフォルトの "main" になることを確認
      expect(result.branch).toBe('main');

      // config.json更新の検証
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      const project = config.multiRepoProjects![0];
      expect(project.repositories[0].branch).toBe('main');
    });

    it('複数のリポジトリを登録', async () => {
      const projectName = 'test-multi-repo';

      // 1つ目のリポジトリ
      await multiRepoAddRepo(
        projectName,
        'repo1',
        'https://github.com/owner/repo1',
        'main',
        testRoot
      );

      // 2つ目のリポジトリ
      await multiRepoAddRepo(
        projectName,
        'repo2',
        'https://github.com/owner/repo2',
        'develop',
        testRoot
      );

      // config.json検証
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      const project = config.multiRepoProjects![0];
      expect(project.repositories.length).toBe(2);
      expect(project.repositories[0].name).toBe('repo1');
      expect(project.repositories[1].name).toBe('repo2');
    });
  });

  describe('プロジェクト未存在', () => {
    it('存在しないプロジェクト名を指定', async () => {
      const projectName = 'non-existent-project';
      const repositoryName = 'my-repo';
      const url = 'https://github.com/owner/my-repo';

      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/プロジェクト「non-existent-project」が見つかりません/);
    });
  });

  describe('重複リポジトリ', () => {
    it('同一プロジェクト内で同名リポジトリ', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = 'duplicate-repo';
      const url = 'https://github.com/owner/duplicate-repo';

      // 1回目: 成功
      await multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot);

      // 2回目: 重複エラー
      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/リポジトリ「duplicate-repo」は既に存在します/);
    });
  });

  describe('無効なリポジトリURL', () => {
    it('GitHub形式でないURL', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = 'my-repo';
      const url = 'https://example.com/not-github';

      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/リポジトリURLが無効です/);
    });

    it('無効なURL形式', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = 'my-repo';
      const url = 'not-a-url';

      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/リポジトリURLが無効です/);
    });
  });

  describe('無効なリポジトリ名', () => {
    it('空のリポジトリ名', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = '';
      const url = 'https://github.com/owner/my-repo';

      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/リポジトリ名が空です/);
    });

    it('空白のみのリポジトリ名', async () => {
      const projectName = 'test-multi-repo';
      const repositoryName = '   ';
      const url = 'https://github.com/owner/my-repo';

      await expect(
        multiRepoAddRepo(projectName, repositoryName, url, 'main', testRoot)
      ).rejects.toThrow(/リポジトリ名が空です/);
    });
  });
});
