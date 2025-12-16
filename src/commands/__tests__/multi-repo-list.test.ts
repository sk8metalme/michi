/**
 * Tests for multi-repo:list command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiRepoList } from '../multi-repo-list.js';
import * as configLoader from '../../../scripts/utils/config-loader.js';

vi.mock('../../../scripts/utils/config-loader.js');

describe('multiRepoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('プロジェクト一覧表示', () => {
    it('プロジェクトが存在しない場合は空の配列を返す', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockReturnValue({
        multiRepoProjects: [],
      });

      const result = await multiRepoList();

      expect(result.projects).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('プロジェクトが1件存在する場合はそれを返す', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockReturnValue({
        multiRepoProjects: [
          {
            name: 'project-a',
            jiraKey: 'PROJA',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-14T10:00:00Z',
            repositories: [],
          },
        ],
      });

      const result = await multiRepoList();

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].name).toBe('project-a');
      expect(result.projects[0].jiraKey).toBe('PROJA');
      expect(result.projects[0].repositoryCount).toBe(0);
      expect(result.totalCount).toBe(1);
    });

    it('複数のプロジェクトが存在する場合は全て返す', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockReturnValue({
        multiRepoProjects: [
          {
            name: 'project-a',
            jiraKey: 'PROJA',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-14T10:00:00Z',
            repositories: [
              { name: 'repo1', url: 'https://github.com/owner/repo1', branch: 'main' },
            ],
          },
          {
            name: 'project-b',
            jiraKey: 'PROJB',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-15T10:00:00Z',
            repositories: [
              { name: 'repo2', url: 'https://github.com/owner/repo2', branch: 'main' },
              { name: 'repo3', url: 'https://github.com/owner/repo3', branch: 'main' },
            ],
          },
        ],
      });

      const result = await multiRepoList();

      expect(result.projects.length).toBe(2);
      expect(result.projects[0].repositoryCount).toBe(2); // project-b (新しい)
      expect(result.projects[1].repositoryCount).toBe(1); // project-a (古い)
      expect(result.totalCount).toBe(2);
    });

    it('リポジトリ数を正しくカウントする', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockReturnValue({
        multiRepoProjects: [
          {
            name: 'project-a',
            jiraKey: 'PROJA',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-14T10:00:00Z',
            repositories: [
              { name: 'repo1', url: 'https://github.com/owner/repo1', branch: 'main' },
              { name: 'repo2', url: 'https://github.com/owner/repo2', branch: 'main' },
              { name: 'repo3', url: 'https://github.com/owner/repo3', branch: 'main' },
            ],
          },
        ],
      });

      const result = await multiRepoList();

      expect(result.projects[0].repositoryCount).toBe(3);
    });
  });

  describe('ソート順序', () => {
    it('作成日時の降順（新しい順）でソートされる', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockReturnValue({
        multiRepoProjects: [
          {
            name: 'project-a',
            jiraKey: 'PROJA',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-14T10:00:00Z',
            repositories: [],
          },
          {
            name: 'project-b',
            jiraKey: 'PROJB',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-16T10:00:00Z',
            repositories: [],
          },
          {
            name: 'project-c',
            jiraKey: 'PROJC',
            confluenceSpace: 'SPACE',
            createdAt: '2025-12-15T10:00:00Z',
            repositories: [],
          },
        ],
      });

      const result = await multiRepoList();

      expect(result.projects[0].name).toBe('project-b'); // 最新
      expect(result.projects[1].name).toBe('project-c'); // 2番目
      expect(result.projects[2].name).toBe('project-a'); // 最古
    });
  });

  describe('エラーハンドリング', () => {
    it('config読み込みエラー時は例外をスロー', async () => {
      vi.spyOn(configLoader, 'loadConfig').mockImplementation(() => {
        throw new Error('Config read error');
      });

      await expect(multiRepoList()).rejects.toThrow('設定ファイルの読み込みに失敗しました: Config read error');
    });
  });
});
