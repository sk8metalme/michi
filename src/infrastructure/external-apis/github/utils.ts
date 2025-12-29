/**
 * GitHub API Utilities
 */

import type { IGitHubWorkflowRun, IRepositoryCIStatus, OctokitError } from './types.js';

/**
 * Exponential Backoffで再試行
 * @param fn 実行する関数
 * @param maxRetries 最大再試行回数
 * @returns 関数の実行結果
 */
export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: OctokitError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const octokitError = error as OctokitError;
      lastError = octokitError;

      // レート制限エラーでない場合は即座にスロー
      if (octokitError.status !== 403 || !octokitError.response?.headers) {
        throw octokitError;
      }

      // 最後の試行の場合はスロー
      if (attempt === maxRetries - 1) {
        throw octokitError;
      }

      // Exponential Backoff: 1秒、2秒、4秒
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError ?? new Error('Unexpected error in exponentialBackoff');
}

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
