/**
 * GitHub Actions Client
 * GitHub Actions APIへのアクセスを抽象化し、Workflow Runsの取得とレート制限対策を提供
 */

import { Octokit } from '@octokit/rest';
import type { IGitHubWorkflowRun, GitHubAPIError, OctokitError, Result } from './types.js';
import { exponentialBackoff } from './utils.js';

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
    } catch (error) {
      // エラーハンドリング
      const octokitError = error as OctokitError;
      if (octokitError.status === 404) {
        return {
          success: false,
          error: {
            type: 'NOT_FOUND',
            message: octokitError.message || 'リポジトリが見つかりません',
          },
        };
      } else if (octokitError.status === 403) {
        // レート制限
        const resetTime = octokitError.response?.headers?.['x-ratelimit-reset'];
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
      } else if (octokitError.status === 401) {
        return {
          success: false,
          error: {
            type: 'UNAUTHORIZED',
            message: octokitError.message || '認証エラー',
          },
        };
      } else {
        return {
          success: false,
          error: {
            type: 'SERVER_ERROR',
            message: octokitError.message || 'サーバーエラー',
            statusCode: octokitError.status || 500,
          },
        };
      }
    }
  }

  /**
   * リソースをクリーンアップ
   */
  destroy(): void {
    // Octokitは特にクリーンアップ不要だが、将来的な拡張のためにメソッドを用意
  }
}
