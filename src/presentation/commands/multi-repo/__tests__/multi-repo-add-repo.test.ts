/**
 * Tests for multi-repo:add-repo command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiRepoAddRepo } from '../add-repo.js';
import * as configLoader from '../../../../../scripts/utils/config-loader.js';
import * as validator from '../../../../../scripts/utils/multi-repo-validator.js';

vi.mock('../../../../../scripts/utils/config-loader.js');
vi.mock('../../../../../scripts/utils/multi-repo-validator.js');

describe('multiRepoAddRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('バリデーション', () => {
    it('プロジェクトが存在しない場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);

      await expect(
        multiRepoAddRepo('non-existent', 'my-repo', 'https://github.com/owner/repo', 'main')
      ).rejects.toThrow('プロジェクト「non-existent」が見つかりません');
    });

    it('無効なリポジトリURLの場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        isValid: false,
        errors: ['Invalid GitHub URL'],
        warnings: [],
      });

      await expect(
        multiRepoAddRepo('test-project', 'my-repo', 'invalid-url', 'main')
      ).rejects.toThrow('リポジトリURLが無効です: Invalid GitHub URL');
    });

    it('リポジトリ名が空の場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });

      await expect(
        multiRepoAddRepo('test-project', '', 'https://github.com/owner/repo', 'main')
      ).rejects.toThrow('リポジトリ名が空です');
    });

    it('ブランチ名が空の場合はデフォルト値"main"を使用', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'main',
        },
      });

      const result = await multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo');

      expect(result.branch).toBe('main');
    });
  });

  describe('重複チェック', () => {
    it('既存リポジトリと同名の場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [
          {
            name: 'existing-repo',
            url: 'https://github.com/owner/existing',
            branch: 'main',
          },
        ],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });

      await expect(
        multiRepoAddRepo('test-project', 'existing-repo', 'https://github.com/owner/new', 'main')
      ).rejects.toThrow('リポジトリ「existing-repo」は既に存在します');
    });

    it('既存リポジトリが存在しない場合は続行', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'new-repo',
          url: 'https://github.com/owner/new',
          branch: 'main',
        },
      });

      const result = await multiRepoAddRepo('test-project', 'new-repo', 'https://github.com/owner/new', 'main');

      expect(result.success).toBe(true);
    });
  });

  describe('正常ケース', () => {
    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });
    });

    it('有効なリポジトリ情報で登録成功', async () => {
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'main',
        },
      });

      const result = await multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo', 'main');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-project');
      expect(result.repositoryName).toBe('my-repo');
      expect(result.url).toBe('https://github.com/owner/repo');
      expect(result.branch).toBe('main');
    });

    it('カスタムブランチ名を指定できる', async () => {
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'develop',
        },
      });

      const result = await multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo', 'develop');

      expect(result.branch).toBe('develop');
    });

    it('config.jsonにリポジトリ情報を登録する', async () => {
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'main',
        },
      });

      await multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo', 'main');

      expect(configLoader.addRepositoryToProject).toHaveBeenCalledWith(
        'test-project',
        expect.objectContaining({
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'main',
        }),
        process.cwd()
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('config.json更新失敗時はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: false,
        error: 'Config update failed',
      });

      await expect(
        multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo', 'main')
      ).rejects.toThrow('設定ファイルの更新に失敗しました: Config update failed');
    });
  });

  describe('成功メッセージ', () => {
    it('成功時は詳細な情報を返す', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'test-project',
        jiraKey: 'TEST',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });
      vi.spyOn(validator, 'validateRepositoryUrl').mockReturnValue({
        success: true,
        errors: [],
        warnings: [],
      });
      vi.spyOn(configLoader, 'addRepositoryToProject').mockReturnValue({
        success: true,
        repository: {
          name: 'my-repo',
          url: 'https://github.com/owner/repo',
          branch: 'develop',
        },
      });

      const result = await multiRepoAddRepo('test-project', 'my-repo', 'https://github.com/owner/repo', 'develop');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-project');
      expect(result.repositoryName).toBe('my-repo');
      expect(result.url).toBe('https://github.com/owner/repo');
      expect(result.branch).toBe('develop');
    });
  });
});
