/**
 * Tests for GitHub Actions Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Octokit } from '@octokit/rest';

// GitHubActionsClientの型定義（実装前）
interface IGitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: 'completed' | 'in_progress' | 'queued';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

type GitHubAPIError =
  | { type: 'RATE_LIMIT_EXCEEDED'; retryAfter: number }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'SERVER_ERROR'; message: string; statusCode: number };

type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

interface GitHubActionsClient {
  getLatestWorkflowRun(
    owner: string,
    repo: string,
    branch: string
  ): Promise<Result<IGitHubWorkflowRun, GitHubAPIError>>;
}

// モック用
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));

describe('GitHubActionsClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('初期化', () => {
    it('GITHUB_TOKENが設定されている場合、正常に初期化される', async () => {
      process.env.GITHUB_TOKEN = 'test-token';

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      expect(client).toBeDefined();
    });

    it('GITHUB_TOKENが未設定の場合、エラーをスロー', async () => {
      delete process.env.GITHUB_TOKEN;

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );

      expect(() => new GitHubActionsClient()).toThrow(
        'GITHUB_TOKENが設定されていません'
      );
    });
  });

  describe('getLatestWorkflowRun', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'test-token';
    });

    it('正常ケース: 最新のWorkflow Runを取得', async () => {
      const mockRun: IGitHubWorkflowRun = {
        id: 123,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'success',
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2025-12-15T10:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/123',
      };

      const mockListWorkflowRunsForRepo = vi
        .fn()
        .mockResolvedValue({
          data: {
            workflow_runs: [mockRun],
          },
        });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
        expect(result.data.conclusion).toBe('success');
      }
    });

    it('404 Not Found: リポジトリが存在しない', async () => {
      const mockListWorkflowRunsForRepo = vi.fn().mockRejectedValue({
        status: 404,
        message: 'Not Found',
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NOT_FOUND');
      }
    });

    it('403 Rate Limit: レート制限超過', async () => {
      const mockListWorkflowRunsForRepo = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Rate limit exceeded',
        response: {
          headers: {
            'x-ratelimit-reset': String(
              Math.floor(Date.now() / 1000) + 3600
            ),
          },
        },
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RATE_LIMIT_EXCEEDED');
        if (result.error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(result.error.retryAfter).toBeGreaterThan(0);
        }
      }
    });

    it('401 Unauthorized: 認証エラー', async () => {
      const mockListWorkflowRunsForRepo = vi.fn().mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UNAUTHORIZED');
      }
    });

    it('500 Server Error: サーバーエラー', async () => {
      const mockListWorkflowRunsForRepo = vi.fn().mockRejectedValue({
        status: 500,
        message: 'Internal Server Error',
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SERVER_ERROR');
        if (result.error.type === 'SERVER_ERROR') {
          expect(result.error.statusCode).toBe(500);
        }
      }
    });

    it('ブランチ指定でフィルタリング', async () => {
      const mockRun: IGitHubWorkflowRun = {
        id: 456,
        name: 'CI',
        head_branch: 'develop',
        status: 'completed',
        conclusion: 'failure',
        created_at: '2025-12-15T11:00:00Z',
        updated_at: '2025-12-15T11:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/456',
      };

      const mockListWorkflowRunsForRepo = vi
        .fn()
        .mockResolvedValue({
          data: {
            workflow_runs: [mockRun],
          },
        });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      await client.getLatestWorkflowRun('owner', 'repo', 'develop');

      expect(mockListWorkflowRunsForRepo).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          branch: 'develop',
          status: 'completed',
          per_page: 1,
        })
      );
    });
  });

  describe('exponentialBackoff (Task 6.2)', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = 'test-token';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('再試行ロジック: 1秒、2秒、4秒の待機', async () => {
      let attemptCount = 0;
      const mockListWorkflowRunsForRepo = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject({
            status: 403,
            message: 'Rate limit exceeded',
            response: {
              headers: {
                'x-ratelimit-reset': String(
                  Math.floor(Date.now() / 1000) + 3600
                ),
              },
            },
          });
        }
        return Promise.resolve({
          data: {
            workflow_runs: [
              {
                id: 789,
                name: 'CI',
                head_branch: 'main',
                status: 'completed',
                conclusion: 'success',
                created_at: '2025-12-15T12:00:00Z',
                updated_at: '2025-12-15T12:05:00Z',
                html_url: 'https://github.com/owner/repo/actions/runs/789',
              },
            ],
          },
        });
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const resultPromise = client.getLatestWorkflowRun('owner', 'repo', 'main');

      // 1回目の失敗後、1秒待機
      await vi.advanceTimersByTimeAsync(1000);
      // 2回目の失敗後、2秒待機
      await vi.advanceTimersByTimeAsync(2000);
      // 3回目は成功

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('最大再試行回数: 3回', async () => {
      const mockListWorkflowRunsForRepo = vi.fn().mockRejectedValue({
        status: 403,
        message: 'Rate limit exceeded',
        response: {
          headers: {
            'x-ratelimit-reset': String(
              Math.floor(Date.now() / 1000) + 3600
            ),
          },
        },
      });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const resultPromise = client.getLatestWorkflowRun('owner', 'repo', 'main');

      // 3回すべて失敗
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(mockListWorkflowRunsForRepo).toHaveBeenCalledTimes(3);
    });

    it('成功時の早期リターン', async () => {
      const mockRun: IGitHubWorkflowRun = {
        id: 999,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'success',
        created_at: '2025-12-15T13:00:00Z',
        updated_at: '2025-12-15T13:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/999',
      };

      const mockListWorkflowRunsForRepo = vi
        .fn()
        .mockResolvedValue({
          data: {
            workflow_runs: [mockRun],
          },
        });

      vi.mocked(Octokit).mockImplementation(
        function (this: any) {
          this.actions = {
            listWorkflowRunsForRepo: mockListWorkflowRunsForRepo,
          };
        } as any
      );

      const { GitHubActionsClient } = await import(
        '../github-actions-client.js'
      );
      const client = new GitHubActionsClient();

      const result = await client.getLatestWorkflowRun('owner', 'repo', 'main');

      expect(result.success).toBe(true);
      expect(mockListWorkflowRunsForRepo).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseGitHubWorkflowRun (Task 6.3)', () => {
    it('status/conclusionマッピング: completed + success → success', async () => {
      const { parseGitHubWorkflowRun } = await import(
        '../github-actions-client.js'
      );

      const run: IGitHubWorkflowRun = {
        id: 1,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'success',
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2025-12-15T10:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/1',
      };

      const result = parseGitHubWorkflowRun(run);

      expect(result.status).toBe('success');
      expect(result.testStatus).toBe('passed');
    });

    it('status/conclusionマッピング: completed + failure → failure', async () => {
      const { parseGitHubWorkflowRun } = await import(
        '../github-actions-client.js'
      );

      const run: IGitHubWorkflowRun = {
        id: 2,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'failure',
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2025-12-15T10:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/2',
      };

      const result = parseGitHubWorkflowRun(run);

      expect(result.status).toBe('failure');
      expect(result.testStatus).toBe('failed');
      expect(result.failureDetails).toContain('https://github.com');
    });

    it('status/conclusionマッピング: in_progress → running', async () => {
      const { parseGitHubWorkflowRun } = await import(
        '../github-actions-client.js'
      );

      const run: IGitHubWorkflowRun = {
        id: 3,
        name: 'CI',
        head_branch: 'main',
        status: 'in_progress',
        conclusion: null,
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2025-12-15T10:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/3',
      };

      const result = parseGitHubWorkflowRun(run);

      expect(result.status).toBe('running');
      expect(result.testStatus).toBe('unknown');
    });

    it('status/conclusionマッピング: cancelled → unknown', async () => {
      const { parseGitHubWorkflowRun } = await import(
        '../github-actions-client.js'
      );

      const run: IGitHubWorkflowRun = {
        id: 4,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'cancelled',
        created_at: '2025-12-15T10:00:00Z',
        updated_at: '2025-12-15T10:05:00Z',
        html_url: 'https://github.com/owner/repo/actions/runs/4',
      };

      const result = parseGitHubWorkflowRun(run);

      expect(result.status).toBe('unknown');
      expect(result.testStatus).toBe('skipped');
    });

    it('日時変換: ISO 8601形式 → Date オブジェクト', async () => {
      const { parseGitHubWorkflowRun } = await import(
        '../github-actions-client.js'
      );

      const run: IGitHubWorkflowRun = {
        id: 5,
        name: 'CI',
        head_branch: 'main',
        status: 'completed',
        conclusion: 'success',
        created_at: '2025-12-15T10:30:45Z',
        updated_at: '2025-12-15T10:35:30Z',
        html_url: 'https://github.com/owner/repo/actions/runs/5',
      };

      const result = parseGitHubWorkflowRun(run);

      expect(result.lastExecutionTime).toBeInstanceOf(Date);
      expect(result.lastExecutionTime.toISOString()).toBe(
        '2025-12-15T10:35:30.000Z'
      );
    });
  });
});
