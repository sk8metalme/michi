/**
 * ワークフロー配布スクリプト
 * GitHub Organization配下のリポジトリに trigger-knowledge-collection.yml を配布
 *
 * Usage:
 *   npx tsx scripts/distribute-workflow.ts --org <org-name> [--dry-run] [--repos repo1,repo2] [--exclude repo1,repo2]
 *
 * 環境変数:
 *   ORG_GITHUB_TOKEN - Organization権限付きPersonal Access Token
 */

import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './utils/env-loader.js';

// __dirname の代替（ESM環境用）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定
interface Config {
  org: string;
  dryRun: boolean;
  repos: string[] | null;
  exclude: string[];
  branch: string;
  workflowPath: string;
}

interface DistributionResult {
  repo: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  prUrl?: string;
}

// デフォルト除外リポジトリ（knowledge系）
const DEFAULT_EXCLUDE_PATTERNS = ['knowledge', '-knowledge'];

/**
 * CLIパラメータのパース
 */
function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    org: '',
    dryRun: false,
    repos: null,
    exclude: [],
    branch: 'add-knowledge-trigger-workflow',
    workflowPath: '.github/workflows/trigger-knowledge-collection.yml',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
    case '--org':
      config.org = args[++i] || '';
      break;
    case '--dry-run':
      config.dryRun = true;
      break;
    case '--repos':
      config.repos = (args[++i] || '').split(',').filter(Boolean);
      break;
    case '--exclude':
      config.exclude = (args[++i] || '').split(',').filter(Boolean);
      break;
    case '--branch':
      config.branch = args[++i] || config.branch;
      break;
    case '--help':
    case '-h':
      printUsage();
      process.exit(0);
    }
  }

  if (!config.org) {
    console.error('❌ --org は必須です');
    printUsage();
    process.exit(1);
  }

  return config;
}

function printUsage(): void {
  console.log(`
ワークフロー配布スクリプト

Usage:
  npx tsx scripts/distribute-workflow.ts --org <org-name> [options]

Options:
  --org <name>       GitHub Organization名 (必須)
  --dry-run          実際に変更せずプレビュー
  --repos <list>     対象リポジトリ（カンマ区切り）
  --exclude <list>   除外リポジトリ（カンマ区切り）
  --branch <name>    PR用ブランチ名 (default: add-knowledge-trigger-workflow)
  --help, -h         ヘルプ表示

環境変数:
  ORG_GITHUB_TOKEN   Organization権限付きPAT (必須)

例:
  # ドライラン
  npx tsx scripts/distribute-workflow.ts --org myorg --dry-run

  # 実行
  npx tsx scripts/distribute-workflow.ts --org myorg

  # 特定リポジトリのみ
  npx tsx scripts/distribute-workflow.ts --org myorg --repos repo1,repo2
`);
}

/**
 * リポジトリがknowledge系かどうかを判定
 */
function isKnowledgeRepo(repoName: string, excludePatterns: string[]): boolean {
  const lowerName = repoName.toLowerCase();

  // デフォルトパターンのチェック
  for (const pattern of DEFAULT_EXCLUDE_PATTERNS) {
    if (lowerName.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // カスタム除外パターンのチェック
  for (const pattern of excludePatterns) {
    if (lowerName === pattern.toLowerCase() || lowerName.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * ワークフローテンプレートを読み込む
 */
function loadWorkflowTemplate(): string {
  const templatePath = join(__dirname, '..', 'templates', 'workflows', 'trigger-knowledge-collection.yml');
  try {
    return readFileSync(templatePath, 'utf-8');
  } catch {
    console.error(`❌ テンプレートファイルが見つかりません: ${templatePath}`);
    process.exit(1);
  }
}

/**
 * Org配下のリポジトリ一覧を取得
 */
async function listOrgRepos(octokit: Octokit, org: string): Promise<string[]> {
  const repos: string[] = [];
  let page = 1;

  while (true) {
    const response = await octokit.repos.listForOrg({
      org,
      per_page: 100,
      page,
      type: 'all',
    });

    if (response.data.length === 0) break;

    for (const repo of response.data) {
      if (!repo.archived && !repo.disabled) {
        repos.push(repo.name);
      }
    }

    page++;
  }

  return repos;
}

/**
 * ファイルが既に存在するかチェック
 */
async function fileExists(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<boolean> {
  try {
    await octokit.repos.getContent({ owner, repo, path });
    return true;
  } catch {
    return false;
  }
}

/**
 * デフォルトブランチを取得
 */
async function getDefaultBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

/**
 * ブランチを作成
 */
async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  // ベースブランチのSHAを取得
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });

  // 新しいブランチを作成
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: refData.object.sha,
  });
}

/**
 * ファイルを追加
 */
async function createFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  branch: string,
  message: string
): Promise<void> {
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  });
}

/**
 * PRを作成
 */
async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<string> {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });

  return data.html_url;
}

/**
 * 単一リポジトリへの配布処理
 */
async function distributeToRepo(
  octokit: Octokit,
  org: string,
  repo: string,
  config: Config,
  workflowContent: string
): Promise<DistributionResult> {
  try {
    // 1. 既存ファイルチェック
    const exists = await fileExists(octokit, org, repo, config.workflowPath);
    if (exists) {
      return {
        repo,
        status: 'skipped',
        message: 'ワークフローファイルが既に存在します',
      };
    }

    // ドライランの場合はここで終了
    if (config.dryRun) {
      return {
        repo,
        status: 'success',
        message: '[DRY-RUN] PRを作成予定',
      };
    }

    // 2. デフォルトブランチを取得
    const defaultBranch = await getDefaultBranch(octokit, org, repo);

    // 3. ブランチ作成
    try {
      await createBranch(octokit, org, repo, config.branch, defaultBranch);
    } catch (error: unknown) {
      const err = error as { status?: number };
      // ブランチが既に存在する場合は続行
      if (err.status !== 422) {
        throw error;
      }
    }

    // 4. ファイル追加
    await createFile(
      octokit,
      org,
      repo,
      config.workflowPath,
      workflowContent,
      config.branch,
      'feat: PRマージ時にknowledge収集をトリガーするワークフローを追加'
    );

    // 5. PR作成
    const prUrl = await createPullRequest(
      octokit,
      org,
      repo,
      config.branch,
      defaultBranch,
      'feat: Knowledge Collection トリガーワークフローの追加',
      `## 概要

PRがマージされた際に、knowledge リポジトリへ通知を送信するワークフローを追加します。

## 変更内容

- \`.github/workflows/trigger-knowledge-collection.yml\` を追加

## 必要な設定

このワークフローを動作させるには、以下のシークレットを設定してください：

- \`ORG_GITHUB_TOKEN\`: Organization内のリポジトリへのアクセス権限を持つPersonal Access Token

## 関連

このPRは自動生成されました。
`
    );

    return {
      repo,
      status: 'success',
      message: 'PRを作成しました',
      prUrl,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      repo,
      status: 'error',
      message: err.message || '不明なエラー',
    };
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  // 環境変数読み込み
  loadEnv();

  // CLIパラメータのパース
  const config = parseArgs();

  // トークンチェック
  const token = process.env.ORG_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ ORG_GITHUB_TOKEN または GITHUB_TOKEN が設定されていません');
    process.exit(1);
  }

  // Octokitクライアント初期化
  const octokit = new Octokit({ auth: token });

  console.log('\n🚀 ワークフロー配布スクリプト');
  console.log(`   Organization: ${config.org}`);
  console.log(`   ドライラン: ${config.dryRun ? 'はい' : 'いいえ'}`);
  console.log('');

  // ワークフローテンプレート読み込み
  const workflowContent = loadWorkflowTemplate();

  // リポジトリ一覧取得
  console.log('📋 リポジトリ一覧を取得中...');
  let repos: string[];

  if (config.repos) {
    repos = config.repos;
  } else {
    repos = await listOrgRepos(octokit, config.org);
  }

  // フィルタリング
  const targetRepos = repos.filter((repo) => !isKnowledgeRepo(repo, config.exclude));
  const excludedRepos = repos.filter((repo) => isKnowledgeRepo(repo, config.exclude));

  console.log(`   対象リポジトリ: ${targetRepos.length}件`);
  console.log(`   除外リポジトリ: ${excludedRepos.length}件`);
  if (excludedRepos.length > 0) {
    console.log(`   除外: ${excludedRepos.join(', ')}`);
  }
  console.log('');

  // 配布処理
  const results: DistributionResult[] = [];

  for (const repo of targetRepos) {
    console.log(`📦 ${repo} を処理中...`);
    const result = await distributeToRepo(octokit, config.org, repo, config, workflowContent);
    results.push(result);

    const icon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    console.log(`   ${icon} ${result.message}${result.prUrl ? ` (${result.prUrl})` : ''}`);
  }

  // サマリー
  console.log('\n📊 サマリー');
  console.log('─'.repeat(50));

  const successCount = results.filter((r) => r.status === 'success').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log(`   ✅ 成功: ${successCount}件`);
  console.log(`   ⏭️ スキップ: ${skippedCount}件`);
  console.log(`   ❌ エラー: ${errorCount}件`);

  // エラー詳細
  if (errorCount > 0) {
    console.log('\n❌ エラー詳細:');
    for (const result of results.filter((r) => r.status === 'error')) {
      console.log(`   - ${result.repo}: ${result.message}`);
    }
  }

  // PR URL一覧
  const prsCreated = results.filter((r) => r.prUrl);
  if (prsCreated.length > 0) {
    console.log('\n🔗 作成されたPR:');
    for (const result of prsCreated) {
      console.log(`   - ${result.repo}: ${result.prUrl}`);
    }
  }

  console.log('');
}

// 実行
main().catch((error) => {
  console.error('❌ 予期せぬエラー:', error.message);
  process.exit(1);
});
