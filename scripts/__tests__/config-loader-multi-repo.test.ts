/**
 * Config Loader - Multi-Repo機能のテスト
 * Task 1.3: 設定管理APIの拡張
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  addMultiRepoProject,
  addRepositoryToProject,
  findProject,
  clearConfigCache,
} from '../utils/config-loader';

// テスト用の一時ディレクトリ
const TEST_PROJECT_ROOT = resolve(__dirname, '../__test-tmp__/multi-repo-test');

describe('Multi-Repo Config Management', () => {
  beforeEach(() => {
    // テスト用ディレクトリを作成
    mkdirSync(resolve(TEST_PROJECT_ROOT, '.michi'), { recursive: true });
    clearConfigCache();
  });

  afterEach(() => {
    // テスト用ディレクトリをクリーンアップ
    if (existsSync(TEST_PROJECT_ROOT)) {
      rmSync(TEST_PROJECT_ROOT, { recursive: true, force: true });
    }
    clearConfigCache();
  });

  describe('addMultiRepoProject', () => {
    it('新しいプロジェクトを追加できる', () => {
      const project = {
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = addMultiRepoProject(project, TEST_PROJECT_ROOT);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(project);

      // 設定ファイルが作成されたことを確認
      const configPath = resolve(TEST_PROJECT_ROOT, '.michi/config.json');
      expect(existsSync(configPath)).toBe(true);
    });

    it('既存のプロジェクトに新しいプロジェクトを追加できる', () => {
      // 1つ目のプロジェクトを追加
      const project1 = {
        name: 'project1',
        jiraKey: 'PROJA',
        confluenceSpace: 'SPACE1',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };
      addMultiRepoProject(project1, TEST_PROJECT_ROOT);

      // 2つ目のプロジェクトを追加
      const project2 = {
        name: 'project2',
        jiraKey: 'PROJB',
        confluenceSpace: 'SPACE2',
        createdAt: '2025-12-14T11:00:00Z',
        repositories: [],
      };
      const result = addMultiRepoProject(project2, TEST_PROJECT_ROOT);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(project2);

      // 両方のプロジェクトが存在することを確認
      const found1 = findProject('project1', TEST_PROJECT_ROOT);
      const found2 = findProject('project2', TEST_PROJECT_ROOT);

      expect(found1).toEqual(project1);
      expect(found2).toEqual(project2);
    });

    it('重複するプロジェクト名の場合はエラー', () => {
      const project = {
        name: 'duplicate-project',
        jiraKey: 'DUP',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      // 1回目は成功
      addMultiRepoProject(project, TEST_PROJECT_ROOT);

      // 2回目は失敗
      const result = addMultiRepoProject(project, TEST_PROJECT_ROOT);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('無効なプロジェクト情報の場合はエラー', () => {
      const invalidProject = {
        name: '../etc/passwd', // パストラバーサル
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = addMultiRepoProject(invalidProject, TEST_PROJECT_ROOT);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('無効なJIRAキーの場合はエラー', () => {
      const invalidProject = {
        name: 'test-project',
        jiraKey: 'abc', // 小文字は不可
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = addMultiRepoProject(invalidProject, TEST_PROJECT_ROOT);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addRepositoryToProject', () => {
    beforeEach(() => {
      // テスト用プロジェクトを作成
      const project = {
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };
      addMultiRepoProject(project, TEST_PROJECT_ROOT);
    });

    it('プロジェクトにリポジトリを追加できる', () => {
      const repository = {
        name: 'repo1',
        url: 'https://github.com/owner/repo1',
        branch: 'main',
      };

      const result = addRepositoryToProject(
        'test-project',
        repository,
        TEST_PROJECT_ROOT,
      );

      expect(result.success).toBe(true);
      expect(result.repository).toEqual(repository);

      // プロジェクトにリポジトリが追加されたことを確認
      const project = findProject('test-project', TEST_PROJECT_ROOT);
      expect(project?.repositories).toHaveLength(1);
      expect(project?.repositories[0]).toEqual(repository);
    });

    it('複数のリポジトリを追加できる', () => {
      const repo1 = {
        name: 'repo1',
        url: 'https://github.com/owner/repo1',
        branch: 'main',
      };
      const repo2 = {
        name: 'repo2',
        url: 'https://github.com/owner/repo2',
        branch: 'develop',
      };

      addRepositoryToProject('test-project', repo1, TEST_PROJECT_ROOT);
      const result = addRepositoryToProject(
        'test-project',
        repo2,
        TEST_PROJECT_ROOT,
      );

      expect(result.success).toBe(true);

      const project = findProject('test-project', TEST_PROJECT_ROOT);
      expect(project?.repositories).toHaveLength(2);
      expect(project?.repositories).toContainEqual(repo1);
      expect(project?.repositories).toContainEqual(repo2);
    });

    it('存在しないプロジェクトの場合はエラー', () => {
      const repository = {
        name: 'repo1',
        url: 'https://github.com/owner/repo1',
        branch: 'main',
      };

      const result = addRepositoryToProject(
        'non-existent',
        repository,
        TEST_PROJECT_ROOT,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('無効なリポジトリURLの場合はエラー', () => {
      const invalidRepo = {
        name: 'repo1',
        url: 'https://gitlab.com/owner/repo1', // GitLabは非対応
        branch: 'main',
      };

      const result = addRepositoryToProject(
        'test-project',
        invalidRepo,
        TEST_PROJECT_ROOT,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('重複するリポジトリ名の場合はエラー', () => {
      const repository = {
        name: 'duplicate-repo',
        url: 'https://github.com/owner/repo1',
        branch: 'main',
      };

      // 1回目は成功
      addRepositoryToProject('test-project', repository, TEST_PROJECT_ROOT);

      // 2回目は失敗
      const result = addRepositoryToProject(
        'test-project',
        repository,
        TEST_PROJECT_ROOT,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('findProject', () => {
    beforeEach(() => {
      // テスト用プロジェクトを複数作成
      const project1 = {
        name: 'project1',
        jiraKey: 'PROJA',
        confluenceSpace: 'SPACE1',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [
          {
            name: 'repo1',
            url: 'https://github.com/owner/repo1',
            branch: 'main',
          },
        ],
      };
      const project2 = {
        name: 'project2',
        jiraKey: 'PROJB',
        confluenceSpace: 'SPACE2',
        createdAt: '2025-12-14T11:00:00Z',
        repositories: [],
      };

      addMultiRepoProject(project1, TEST_PROJECT_ROOT);
      addMultiRepoProject(project2, TEST_PROJECT_ROOT);
    });

    it('プロジェクト名で検索できる', () => {
      const project = findProject('project1', TEST_PROJECT_ROOT);

      expect(project).toBeDefined();
      expect(project?.name).toBe('project1');
      expect(project?.jiraKey).toBe('PROJA');
      expect(project?.repositories).toHaveLength(1);
    });

    it('存在しないプロジェクトの場合はnullを返す', () => {
      const project = findProject('non-existent', TEST_PROJECT_ROOT);

      expect(project).toBeNull();
    });

    it('設定ファイルが存在しない場合はnullを返す', () => {
      const emptyRoot = resolve(__dirname, '../__test-tmp__/empty-project');
      mkdirSync(emptyRoot, { recursive: true });

      const project = findProject('project1', emptyRoot);

      expect(project).toBeNull();

      rmSync(emptyRoot, { recursive: true, force: true });
    });
  });

  describe('アトミック更新', () => {
    it('設定ファイルの更新中にエラーが発生しても既存の設定が破損しない', () => {
      // 初期設定を作成
      const configPath = resolve(TEST_PROJECT_ROOT, '.michi/config.json');
      const initialConfig = {
        multiRepoProjects: [
          {
            name: 'existing-project',
            jiraKey: 'EXIST',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-14T10:00:00Z',
            repositories: [],
          },
        ],
      };
      writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

      // 無効なプロジェクトを追加しようとする（失敗するはず）
      const invalidProject = {
        name: '../etc/passwd',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T11:00:00Z',
        repositories: [],
      };
      addMultiRepoProject(invalidProject, TEST_PROJECT_ROOT);

      // 既存の設定が破損していないことを確認
      const existingProject = findProject('existing-project', TEST_PROJECT_ROOT);
      expect(existingProject).toBeDefined();
      expect(existingProject?.name).toBe('existing-project');
    });
  });
});
