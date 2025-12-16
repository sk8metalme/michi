/**
 * Tests for multi-repo:ci-status command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiRepoCIStatus } from '../multi-repo-ci-status.js';
import * as configLoader from '../../../scripts/utils/config-loader.js';
import * as fs from 'fs';
import * as path from 'path';

// GitHubActionsClientのモックをhoistで定義
const { mockGitHubClient } = vi.hoisted(() => {
  return {
    mockGitHubClient: {
      getLatestWorkflowRun: vi.fn(),
    },
  };
});

vi.mock('fs');
vi.mock('../../../scripts/utils/config-loader.js');
vi.mock('../../../scripts/github-actions-client.js', () => {
  return {
    GitHubActionsClient: function () {
      return mockGitHubClient;
    },
    parseGitHubWorkflowRun: vi.fn((run) => ({
      status:
        run.status === 'completed'
          ? run.conclusion === 'success'
            ? 'success'
            : run.conclusion === 'failure'
              ? 'failure'
              : 'unknown'
          : run.status === 'in_progress' || run.status === 'queued'
            ? 'running'
            : 'unknown',
      testStatus:
        run.status === 'completed'
          ? run.conclusion === 'success'
            ? 'passed'
            : run.conclusion === 'failure'
              ? 'failed'
              : 'unknown'
          : 'unknown',
      lastExecutionTime: new Date(run.updated_at),
      failureDetails:
        run.status === 'completed' && run.conclusion === 'failure'
          ? run.html_url
          : undefined,
    })),
  };
});

describe('multiRepoCIStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  describe('バリデーション', () => {
    it('プロジェクトが存在しない場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);

      await expect(
        multiRepoCIStatus('non-existent-project')
      ).rejects.toThrow('プロジェクト「non-existent-project」が見つかりません');
    });

    it('GITHUB_TOKENが未設定の場合はエラー', async () => {
      delete process.env.GITHUB_TOKEN;

      await expect(
        multiRepoCIStatus('my-project')
      ).rejects.toThrow('GITHUB_TOKENが設定されていません');
    });

    it('リポジトリが登録されていない場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'my-project',
        jiraKey: 'MYPROJ',
        confluenceSpace: 'MYSPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });

      await expect(
        multiRepoCIStatus('my-project')
      ).rejects.toThrow('プロジェクト「my-project」にリポジトリが登録されていません');
    });
  });

  describe('正常ケース', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [
        {
          name: 'repo1',
          url: 'https://github.com/owner/repo1',
          branch: 'main',
        },
        {
          name: 'repo2',
          url: 'https://github.com/owner/repo2',
          branch: 'develop',
        },
      ],
    };

    const mockWorkflowRun = {
      id: 123,
      name: 'CI',
      head_branch: 'main',
      status: 'completed' as const,
      conclusion: 'success' as const,
      created_at: '2025-12-14T10:00:00Z',
      updated_at: '2025-12-14T10:05:00Z',
      html_url: 'https://github.com/owner/repo1/actions/runs/123',
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    });

    it('複数リポジトリのCI結果を取得する', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: mockWorkflowRun,
      });

      const result = await multiRepoCIStatus('my-project');

      expect(result.success).toBe(true);
      expect(result.repositories.length).toBe(2);
      expect(mockGitHubClient.getLatestWorkflowRun).toHaveBeenCalledTimes(2);
    });

    it('CI結果をMarkdownファイルに出力する', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: mockWorkflowRun,
      });

      await multiRepoCIStatus('my-project');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('docs/michi/my-project/docs/ci-status.md'),
        expect.stringContaining('repo1'),
        'utf-8'
      );
    });

    it('成功ステータスを正しくマッピングする', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: mockWorkflowRun,
      });

      const result = await multiRepoCIStatus('my-project');

      expect(result.repositories[0].status).toBe('success');
      expect(result.repositories[0].testStatus).toBe('passed');
    });

    it('失敗ステータスを正しくマッピングする', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          ...mockWorkflowRun,
          conclusion: 'failure',
        },
      });

      const result = await multiRepoCIStatus('my-project');

      expect(result.repositories[0].status).toBe('failure');
      expect(result.repositories[0].testStatus).toBe('failed');
      expect(result.repositories[0].failureDetails).toBeDefined();
    });

    it('実行中ステータスを正しくマッピングする', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          ...mockWorkflowRun,
          status: 'in_progress',
          conclusion: null,
        },
      });

      const result = await multiRepoCIStatus('my-project');

      expect(result.repositories[0].status).toBe('running');
      expect(result.repositories[0].testStatus).toBe('unknown');
    });
  });

  describe('エラーハンドリング', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [
        {
          name: 'repo1',
          url: 'https://github.com/owner/repo1',
          branch: 'main',
        },
      ],
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    });

    it('GitHub APIエラー時はステータスをunknownに設定', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'リポジトリが見つかりません',
        },
      });

      const result = await multiRepoCIStatus('my-project');

      expect(result.success).toBe(true);
      expect(result.repositories[0].status).toBe('unknown');
      expect(result.repositories[0].testStatus).toBe('unknown');
    });

    it('レート制限エラー時は警告メッセージを表示', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 3600,
        },
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await multiRepoCIStatus('my-project');

      expect(result.success).toBe(true);
      expect(result.repositories[0].status).toBe('unknown');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('レート制限')
      );

      consoleSpy.mockRestore();
    });

    it('ファイル書き込みエラー時はエラーをスロー', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          id: 123,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: '2025-12-14T10:00:00Z',
          updated_at: '2025-12-14T10:05:00Z',
          html_url: 'https://github.com/owner/repo1/actions/runs/123',
        },
      });
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });

      await expect(
        multiRepoCIStatus('my-project')
      ).rejects.toThrow('Markdownファイルの書き込みに失敗しました');
    });
  });

  describe('--diffオプション', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [
        {
          name: 'repo1',
          url: 'https://github.com/owner/repo1',
          branch: 'main',
        },
      ],
    };

    const mockCache = {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分前
      repositories: [
        {
          name: 'repo1',
          url: 'https://github.com/owner/repo1',
          branch: 'main',
          status: 'failure' as const,
          testStatus: 'failed' as const,
          lastExecutionTime: new Date('2025-12-14T09:55:00Z'),
        },
      ],
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    });

    it('前回結果との差分を表示する', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(mockCache)
      );
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          id: 124,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: '2025-12-14T10:00:00Z',
          updated_at: '2025-12-14T10:05:00Z',
          html_url: 'https://github.com/owner/repo1/actions/runs/124',
        },
      });

      const result = await multiRepoCIStatus('my-project', { diff: true });

      expect(result.success).toBe(true);
      expect(result.diff).toBeDefined();
      expect(result.diff!.newSuccesses).toContain('repo1');
    });

    it('キャッシュが存在しない場合は差分なし', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          id: 123,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: '2025-12-14T10:00:00Z',
          updated_at: '2025-12-14T10:05:00Z',
          html_url: 'https://github.com/owner/repo1/actions/runs/123',
        },
      });

      const result = await multiRepoCIStatus('my-project', { diff: true });

      expect(result.success).toBe(true);
      expect(result.diff).toBeUndefined();
    });

    it('キャッシュの有効期限切れの場合は差分なし', async () => {
      const expiredCache = {
        ...mockCache,
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20分前
      };

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify(expiredCache)
      );
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          id: 123,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: '2025-12-14T10:00:00Z',
          updated_at: '2025-12-14T10:05:00Z',
          html_url: 'https://github.com/owner/repo1/actions/runs/123',
        },
      });

      const result = await multiRepoCIStatus('my-project', { diff: true });

      expect(result.success).toBe(true);
      expect(result.diff).toBeUndefined();
    });
  });

  describe('並列処理', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: Array.from({ length: 10 }, (_, i) => ({
        name: `repo${i + 1}`,
        url: `https://github.com/owner/repo${i + 1}`,
        branch: 'main',
      })),
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    });

    it('最大10並列でCI結果を取得する', async () => {
      mockGitHubClient.getLatestWorkflowRun.mockResolvedValue({
        success: true,
        data: {
          id: 123,
          name: 'CI',
          head_branch: 'main',
          status: 'completed',
          conclusion: 'success',
          created_at: '2025-12-14T10:00:00Z',
          updated_at: '2025-12-14T10:05:00Z',
          html_url: 'https://github.com/owner/repo1/actions/runs/123',
        },
      });

      const startTime = Date.now();
      const result = await multiRepoCIStatus('my-project');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.repositories.length).toBe(10);
      expect(mockGitHubClient.getLatestWorkflowRun).toHaveBeenCalledTimes(10);

      // 並列処理なので、10リポジトリでも逐次処理の1/10程度の時間で完了するはず
      // （モックなので実際の時間は極めて短い）
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
