/**
 * GitHub API Types
 */

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
 * Octokit APIから返されるエラーオブジェクトの型
 */
export interface OctokitError extends Error {
  status?: number;
  response?: {
    url?: string;
    status?: number;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

/**
 * Result型
 */
export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
