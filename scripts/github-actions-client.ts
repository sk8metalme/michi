/**
 * GitHub Actions Client
 *
 * このファイルは後方互換性のための再エクスポートです。
 * 実装は src/infrastructure/external-apis/github/ に移行されました。
 */

export {
  GitHubActionsClient,
  exponentialBackoff,
  parseGitHubWorkflowRun,
} from '../src/infrastructure/external-apis/github/index.js';

export type {
  IGitHubWorkflowRun,
  IRepositoryCIStatus,
  GitHubAPIError,
  OctokitError,
  Result,
} from '../src/infrastructure/external-apis/github/index.js';
