/**
 * GitHub Actions Client
 * GitHub Actions APIへのアクセスを抽象化し、Workflow Runsの取得とレート制限対策を提供
 */

import { Octokit } from '@octokit/rest';

/**
 * GitHub Workflow Run情報
 */
export interface IGitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: 'completed' | 'in_progress' | 'queued';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

/**
 * リポジトリのCI結果
 */
export interface IRepositoryCIStatus {
  name: string;
  url: string;
  branch: string;
  status: 'success' | 'failure' | 'running' | 'unknown';
  testStatus: 'passed' | 'failed' | 'skipped' | 'unknown';
  coverage?: number;
  lastExecutionTime: Date;
  failureDetails?: string;
}

/**
 * GitHub APIエラー
 */
export type GitHubAPIError =
  | { type: 'RATE_LIMIT_EXCEEDED'; retryAfter: number }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'SERVER_ERROR'; message: string; statusCode: number };

/**
 * Result型
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * GitHub Workflow Runを解析してCI結果に変換
 * @param run GitHub Workflow Run情報
 * @returns CI結果
 */
export function parseGitHubWorkflowRun(
  run: IGitHubWorkflowRun
): Omit<IRepositoryCIStatus, 'name' | 'url' | 'branch'> {
  // statusマッピング
  let status: 'success' | 'failure' | 'running' | 'unknown';
  let testStatus: 'passed' | 'failed' | 'skipped' | 'unknown';

  if (run.status === 'completed') {
    if (run.conclusion === 'success') {
      status = 'success';
      testStatus = 'passed';
    } else if (run.conclusion === 'failure') {
      status = 'failure';
      testStatus = 'failed';
    } else if (run.conclusion === 'cancelled') {
      status = 'unknown';
      testStatus = 'skipped';
    } else if (run.conclusion === 'skipped') {
      status = 'unknown';
      testStatus = 'skipped';
    } else {
      status = 'unknown';
      testStatus = 'unknown';
    }
  } else if (run.status === 'in_progress' || run.status === 'queued') {
    status = 'running';
    testStatus = 'unknown';
  } else {
    status = 'unknown';
    testStatus = 'unknown';
  }

  // 日時変換
  const lastExecutionTime = new Date(run.updated_at);

  // 失敗詳細
  const failureDetails =
    status === 'failure' ? run.html_url : undefined;

  return {
    status,
    testStatus,
    lastExecutionTime,
    failureDetails,
  };
}

/**
 * Exponential Backoffで再試行
 * @param fn 実行する関数
 * @param maxRetries 最大再試行回数
 * @returns 関数の実行結果
 */
async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // レート制限エラーでない場合は即座にスロー
      if (error.status !== 403 || !error.response?.headers) {
        throw error;
      }

      // 最後の試行の場合はスロー
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential Backoff: 1秒、2秒、4秒
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * GitHub Actions Client
 */
export class GitHubActionsClient {
  private octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKENが設定されていません');
    }

    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * リポジトリの最新Workflow Runを取得
   * @param owner リポジトリオーナー
   * @param repo リポジトリ名
   * @param branch ブランチ名
   * @returns Workflow Run情報（成功/失敗）
   */
  async getLatestWorkflowRun(
    owner: string,
    repo: string,
    branch: string
  ): Promise<Result<IGitHubWorkflowRun, GitHubAPIError>> {
    try {
      const response = await exponentialBackoff(async () => {
        return await this.octokit.actions.listWorkflowRunsForRepo({
          owner,
          repo,
          branch,
          status: 'completed',
          per_page: 1,
        });
      });

      if (
        !response.data.workflow_runs ||
        response.data.workflow_runs.length === 0
      ) {
        return {
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: `リポジトリ ${owner}/${repo} のWorkflow Runが見つかりません`,
          },
        };
      }

      const run = response.data.workflow_runs[0] as IGitHubWorkflowRun;
      return {
        success: true,
        data: run,
      };
    } catch (error: any) {
      // エラーハンドリング
      if (error.status === 404) {
        return {
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: error.message || 'リポジトリが見つかりません',
          },
        };
      } else if (error.status === 403) {
        // レート制限
        const resetTime = error.response?.headers?.['x-ratelimit-reset'];
        const retryAfter = resetTime
          ? parseInt(resetTime, 10) - Math.floor(Date.now() / 1000)
          : 3600;

        return {
          success: false,
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.max(retryAfter, 0),
          },
        };
      } else if (error.status === 401) {
        return {
          success: false,
          error: {
            type: 'UNAUTHORIZED',
            message: error.message || '認証エラー',
          },
        };
      } else {
        return {
          success: false,
          error: {
            type: 'SERVER_ERROR',
            message: error.message || 'サーバーエラー',
            statusCode: error.status || 500,
          },
        };
      }
    }
  }
}
