/**
 * multi-repo:ci-status command implementation
 * リポジトリのCI結果を集約して表示
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { safeReadFileOrThrow } from '../../../../scripts/utils/safe-file-reader.js';
import { join } from 'path';
import { findProject } from '../../../../scripts/utils/config-loader.js';
import {
  GitHubActionsClient,
  parseGitHubWorkflowRun,
  type IRepositoryCIStatus,
} from '../../../../scripts/github-actions-client.js';

/**
 * CI結果集約のオプション
 */
export interface CIStatusOptions {
  diff?: boolean; // 前回結果との差分表示
}

/**
 * CI結果の差分情報
 */
export interface CIStatusDiff {
  newFailures: string[]; // 新規失敗（前回成功 → 今回失敗）
  newSuccesses: string[]; // 新規成功（前回失敗 → 今回成功）
  unchanged: string[]; // 変化なし
}

/**
 * CI結果集約結果
 */
export interface CIStatusResult {
  success: boolean;
  projectName: string;
  repositories: IRepositoryCIStatus[];
  outputPath: string;
  diff?: CIStatusDiff;
  summary: {
    total: number;
    success: number;
    failure: number;
    running: number;
    unknown: number;
  };
}

/**
 * キャッシュの型定義
 */
interface CIStatusCache {
  timestamp: string;
  repositories: IRepositoryCIStatus[];
}

/**
 * GitHub URLからowner/repoを抽出
 * @param url GitHub URL
 * @returns {owner, repo} または null
 */
function extractGitHubOwnerRepo(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * Markdownテーブル形式でCI結果を出力
 * @param repositories リポジトリのCI結果
 * @param diff 差分情報（オプション）
 * @returns Markdown形式の文字列
 */
function formatCIStatusMarkdown(
  repositories: IRepositoryCIStatus[],
  diff?: CIStatusDiff
): string {
  const statusIcon = {
    success: '✅',
    failure: '❌',
    running: '⏳',
    unknown: '❓',
  };

  const testStatusIcon = {
    passed: '✅',
    failed: '❌',
    skipped: '⏭️',
    unknown: '❓',
  };

  const diffIcon = (repoName: string): string => {
    if (!diff) return '';
    if (diff.newFailures.includes(repoName)) return ' 🆕';
    if (diff.newSuccesses.includes(repoName)) return ' ✨';
    if (diff.unchanged.includes(repoName)) return ' ➖';
    return '';
  };

  let markdown = '# CI結果集約\n\n';
  markdown += `更新日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n\n`;

  markdown += '| リポジトリ名 | ビルドステータス | テストステータス | カバレッジ | 最終実行日時 | 失敗詳細 |\n';
  markdown += '|---|---|---|---|---|---|\n';

  for (const repo of repositories) {
    const name = repo.name + diffIcon(repo.name);
    const buildStatus = statusIcon[repo.status];
    const testStatus = testStatusIcon[repo.testStatus];
    const coverage = repo.coverage !== undefined ? `${repo.coverage}%` : 'N/A';
    const lastExecution = repo.lastExecutionTime.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const failureDetails = repo.failureDetails
      ? `[詳細](${repo.failureDetails})`
      : '-';

    markdown += `| ${name} | ${buildStatus} | ${testStatus} | ${coverage} | ${lastExecution} | ${failureDetails} |\n`;
  }

  if (diff) {
    markdown += '\n## 差分情報\n\n';
    if (diff.newFailures.length > 0) {
      markdown += `🆕 **新規失敗** (${diff.newFailures.length}件): ${diff.newFailures.join(', ')}\n\n`;
    }
    if (diff.newSuccesses.length > 0) {
      markdown += `✨ **新規成功** (${diff.newSuccesses.length}件): ${diff.newSuccesses.join(', ')}\n\n`;
    }
    if (diff.unchanged.length > 0) {
      markdown += `➖ **変化なし** (${diff.unchanged.length}件): ${diff.unchanged.join(', ')}\n\n`;
    }
  }

  return markdown;
}

/**
 * キャッシュを読み込む
 * @param cachePath キャッシュファイルパス
 * @returns キャッシュデータ（存在しない場合はnull）
 */
function loadCache(cachePath: string): CIStatusCache | null {
  try {
    if (!existsSync(cachePath)) {
      return null;
    }

    const content = safeReadFileOrThrow(cachePath, 'utf-8');
    const cache = JSON.parse(content) as CIStatusCache;

    // キャッシュの有効期限チェック（15分）
    const cacheTime = new Date(cache.timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - cacheTime.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      return null; // 有効期限切れ
    }

    // lastExecutionTimeをDateオブジェクトに変換
    cache.repositories = cache.repositories.map((repo) => ({
      ...repo,
      lastExecutionTime: new Date(repo.lastExecutionTime),
    }));

    return cache;
  } catch (error) {
    console.warn('キャッシュの読み込みに失敗しました:', error);
    return null;
  }
}

/**
 * キャッシュを保存
 * @param cachePath キャッシュファイルパス
 * @param data キャッシュデータ
 */
function saveCache(cachePath: string, data: CIStatusCache): void {
  try {
    const cacheDir = join(cachePath, '..');
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('キャッシュの保存に失敗しました:', error);
  }
}

/**
 * 差分を計算
 * @param previousResults 前回のCI結果
 * @param currentResults 今回のCI結果
 * @returns 差分情報
 */
function calculateDiff(
  previousResults: IRepositoryCIStatus[],
  currentResults: IRepositoryCIStatus[]
): CIStatusDiff {
  const diff: CIStatusDiff = {
    newFailures: [],
    newSuccesses: [],
    unchanged: [],
  };

  for (const current of currentResults) {
    const previous = previousResults.find((r) => r.name === current.name);

    if (!previous) {
      // 新規リポジトリ
      diff.unchanged.push(current.name);
      continue;
    }

    if (previous.status === 'success' && current.status === 'failure') {
      diff.newFailures.push(current.name);
    } else if (previous.status === 'failure' && current.status === 'success') {
      diff.newSuccesses.push(current.name);
    } else {
      diff.unchanged.push(current.name);
    }
  }

  return diff;
}

/**
 * Multi-RepoプロジェクトのCI結果を集約
 *
 * @param projectName プロジェクト名
 * @param options オプション
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
 * @returns CI結果集約結果
 */
export async function multiRepoCIStatus(
  projectName: string,
  options: CIStatusOptions = {},
  projectRoot: string = process.cwd()
): Promise<CIStatusResult> {
  // 1. GitHub Token存在確認
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      'GITHUB_TOKENが設定されていません。環境変数にGitHub Personal Access Tokenを設定してください。'
    );
  }

  // 2. プロジェクト存在確認
  const project = await findProject(projectName, projectRoot);
  if (!project) {
    throw new Error(`プロジェクト「${projectName}」が見つかりません`);
  }

  // 3. リポジトリ存在確認
  if (!project.repositories || project.repositories.length === 0) {
    throw new Error(
      `プロジェクト「${projectName}」にリポジトリが登録されていません`
    );
  }

  // 4. 前回結果のキャッシュ読み込み
  const baseDir = join(projectRoot, 'docs', 'michi', projectName, 'docs');
  const cachePath = join(baseDir, '.ci-cache.json');
  const previousCache = options.diff ? loadCache(cachePath) : null;

  // 5. GitHub Actions APIでCI結果を並列取得
  const client = new GitHubActionsClient();
  const repositories: IRepositoryCIStatus[] = [];

  const promises = project.repositories.map(async (repo) => {
    const parsed = extractGitHubOwnerRepo(repo.url);
    if (!parsed) {
      console.warn(
        `リポジトリURL「${repo.url}」が無効です。スキップします。`
      );
      return {
        name: repo.name,
        url: repo.url,
        branch: repo.branch,
        status: 'unknown' as const,
        testStatus: 'unknown' as const,
        lastExecutionTime: new Date(),
      };
    }

    const result = await client.getLatestWorkflowRun(
      parsed.owner,
      parsed.repo,
      repo.branch
    );

    if (!result.success) {
      // エラーハンドリング
      const error = result.error;
      if (error.type === 'RATE_LIMIT_EXCEEDED') {
        console.warn(
          `GitHub APIのレート制限に達しました。${error.retryAfter}秒後に再試行してください。`
        );
      } else if (error.type === 'NOT_FOUND') {
        console.warn(`リポジトリ「${repo.name}」のWorkflow Runが見つかりません。`);
      } else if (error.type === 'UNAUTHORIZED') {
        console.warn(`GitHub認証エラー: ${error.message}`);
      } else {
        console.warn(
          `GitHub APIエラー (${repo.name}): ${error.message} (HTTP ${error.statusCode})`
        );
      }

      return {
        name: repo.name,
        url: repo.url,
        branch: repo.branch,
        status: 'unknown' as const,
        testStatus: 'unknown' as const,
        lastExecutionTime: new Date(),
      };
    }

    // CI結果を解析
    const parsed結果 = parseGitHubWorkflowRun(result.data);
    return {
      name: repo.name,
      url: repo.url,
      branch: repo.branch,
      ...parsed結果,
    };
  });

  const results = await Promise.allSettled(promises);
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      repositories.push(result.value);
    } else {
      console.error('予期しないエラーが発生しました:', result.reason);
    }
  });

  // 6. 差分計算（--diffオプションが指定されている場合）
  let diff: CIStatusDiff | undefined;
  if (options.diff && previousCache) {
    diff = calculateDiff(previousCache.repositories, repositories);
  }

  // 7. Markdownファイルに出力
  const outputPath = join(baseDir, 'ci-status.md');
  const markdown = formatCIStatusMarkdown(repositories, diff);

  try {
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    writeFileSync(outputPath, markdown, 'utf-8');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Markdownファイルの書き込みに失敗しました: ${errorMessage}`);
  }

  // 8. キャッシュ保存
  const cache: CIStatusCache = {
    timestamp: new Date().toISOString(),
    repositories,
  };
  saveCache(cachePath, cache);

  // 9. サマリー計算
  const summary = {
    total: repositories.length,
    success: repositories.filter((r) => r.status === 'success').length,
    failure: repositories.filter((r) => r.status === 'failure').length,
    running: repositories.filter((r) => r.status === 'running').length,
    unknown: repositories.filter((r) => r.status === 'unknown').length,
  };

  // GitHubActionsClientのリソースをクリーンアップ
  client.destroy();

  return {
    success: true,
    projectName,
    repositories,
    outputPath,
    diff,
    summary,
  };
}
