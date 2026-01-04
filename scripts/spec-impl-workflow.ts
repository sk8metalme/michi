/**
 * spec-impl 統合ワークフロー管理
 *
 * /kiro:spec-impl コマンドの自動化処理を提供
 * - spec.json から JIRA 情報を自動取得
 * - 開始時: Epic + 最初の Story を「進行中」に移動
 * - 終了時: PR作成、Epic + 最初の Story を「レビュー待ち」に移動、PRリンクをコメント
 */

import { loadEnv } from './utils/env-loader.js';
import { JIRAClient } from './jira-sync.js';
import { getConfig } from './utils/config-loader.js';
import {
  getJiraInfoFromSpec,
  checkJiraInfoStatus,
  JiraInfo,
} from './utils/spec-loader.js';

loadEnv();

/**
 * spec-impl 統合ワークフローのオプション
 */
export interface SpecImplWorkflowOptions {
  /** フィーチャー名 */
  featureName: string;
  /** ブランチ名（オプション、デフォルトは feature/{featureName}） */
  branchName?: string;
  /** JIRA 連携をスキップするか */
  skipJira?: boolean;
  /** プロジェクトルート */
  projectRoot?: string;
}

/**
 * JIRAステータスマッピング
 * michi.config.json でカスタマイズ可能
 */
interface StatusMapping {
  inProgress: string;
  readyForReview: string;
}

/**
 * 設定からステータスマッピングを取得
 */
function getStatusMapping(): StatusMapping {
  const appConfig = getConfig();
  return {
    inProgress: appConfig.jira?.statusMapping?.inProgress || 'In Progress',
    readyForReview:
      appConfig.jira?.statusMapping?.readyForReview || 'Ready for Review',
  };
}

/**
 * JIRA設定を取得
 */
function getJIRAConfig() {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !email || !apiToken) {
    throw new Error(
      'Missing JIRA credentials in .env. Required: ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN',
    );
  }

  return { url, email, apiToken };
}

/**
 * 単一チケットを指定ステータスに遷移
 * @internal
 */
async function transitionIssue(
  client: JIRAClient,
  issueKey: string,
  status: string,
): Promise<void> {
  try {
    await client.transitionIssue(issueKey, status);
    console.log(`  ✅ ${issueKey} → 「${status}」`);
  } catch (error) {
    console.error(
      `  ❌ ${issueKey} のステータス変更に失敗: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }
}

/**
 * Epic と最初の Story を指定ステータスに遷移
 * @internal
 */
async function transitionEpicAndStory(
  jiraInfo: JiraInfo,
  status: string,
): Promise<void> {
  const jiraConfig = getJIRAConfig();
  const client = new JIRAClient(jiraConfig);

  console.log(`\n🔄 JIRA ステータス更新: 「${status}」`);

  // Epic を遷移
  if (jiraInfo.epicKey) {
    await transitionIssue(client, jiraInfo.epicKey, status);
  }

  // 最初の Story を遷移
  if (jiraInfo.firstStoryKey) {
    await transitionIssue(client, jiraInfo.firstStoryKey, status);
  }
}

/**
 * JIRA 情報が不足している場合のエラー
 */
export class JiraInfoNotFoundError extends Error {
  constructor(
    public readonly featureName: string,
    public readonly missing: string[],
  ) {
    super(
      `JIRA 情報が見つかりません (${featureName}): ${missing.join(', ')} が不足しています。\n` +
        `先に "michi jira:sync ${featureName}" を実行してください。`,
    );
    this.name = 'JiraInfoNotFoundError';
  }
}

/**
 * spec-impl 開始ワークフロー
 *
 * 1. spec.json から JIRA 情報を自動取得
 * 2. Epic と最初の Story を「進行中」に遷移
 *
 * @param options ワークフローオプション
 * @throws {JiraInfoNotFoundError} JIRA 情報が見つからない場合（skipJira=false の時）
 *
 * @example
 * ```typescript
 * // 自動検出モード
 * await runSpecImplStart({ featureName: 'user-auth' });
 *
 * // JIRA 連携スキップ
 * await runSpecImplStart({ featureName: 'user-auth', skipJira: true });
 * ```
 */
export async function runSpecImplStart(
  options: SpecImplWorkflowOptions,
): Promise<{ jiraInfo: JiraInfo | null }> {
  const {
    featureName,
    skipJira = false,
    projectRoot = process.cwd(),
  } = options;
  const statusMapping = getStatusMapping();

  console.log(`🚀 spec-impl 開始: ${featureName}`);

  // JIRA 情報を自動取得
  const jiraInfo = getJiraInfoFromSpec(featureName, projectRoot);
  const status = checkJiraInfoStatus(featureName, projectRoot);

  console.log('📋 JIRA 情報:');
  console.log(`   Epic: ${jiraInfo.epicKey || '(なし)'}`);
  console.log(`   Story: ${jiraInfo.firstStoryKey || '(なし)'}`);

  // JIRA 連携スキップの場合
  if (skipJira) {
    console.log('⏭️  JIRA 連携をスキップします');
    return { jiraInfo: null };
  }

  // JIRA 情報が不足している場合
  if (!status.hasEpic) {
    throw new JiraInfoNotFoundError(featureName, status.missing);
  }

  // Epic と Story を「進行中」に遷移
  await transitionEpicAndStory(jiraInfo, statusMapping.inProgress);

  console.log('\n✅ spec-impl 開始処理完了');
  return { jiraInfo };
}

/**
 * spec-impl 完了ワークフロー
 *
 * 1. spec.json から JIRA 情報を自動取得
 * 2. PR を作成
 * 3. Epic と最初の Story を「レビュー待ち」に遷移
 * 4. PR リンクを JIRA にコメント
 *
 * @param options ワークフローオプション
 * @returns PR URL
 * @throws {JiraInfoNotFoundError} JIRA 情報が見つからない場合（skipJira=false の時）
 *
 * @example
 * ```typescript
 * // 自動検出モード
 * const { prUrl } = await runSpecImplComplete({ featureName: 'user-auth' });
 *
 * // JIRA 連携スキップ
 * const { prUrl } = await runSpecImplComplete({ featureName: 'user-auth', skipJira: true });
 * ```
 */
export async function runSpecImplComplete(
  options: SpecImplWorkflowOptions,
): Promise<{ prUrl: string }> {
  const {
    featureName,
    branchName,
    skipJira = false,
    projectRoot = process.cwd(),
  } = options;
  const statusMapping = getStatusMapping();
  const branch = branchName || `feature/${featureName}`;

  console.log(`🏁 spec-impl 完了: ${featureName}`);
  console.log(`🌿 ブランチ: ${branch}`);

  // JIRA 情報を自動取得
  const jiraInfo = getJiraInfoFromSpec(featureName, projectRoot);
  const status = checkJiraInfoStatus(featureName, projectRoot);

  console.log('📋 JIRA 情報:');
  console.log(`   Epic: ${jiraInfo.epicKey || '(なし)'}`);
  console.log(`   Story: ${jiraInfo.firstStoryKey || '(なし)'}`);

  // JIRA 連携スキップでない場合、情報をチェック
  if (!skipJira && !status.hasEpic) {
    throw new JiraInfoNotFoundError(featureName, status.missing);
  }

  let prUrl = '';

  // 1. PR を作成
  try {
    console.log('\n📝 PR を作成中...');
    const prTitle = `feat: ${featureName}`;
    const jiraBaseUrl = process.env.ATLASSIAN_URL || '';
    const jiraLink = jiraInfo.epicKey
      ? `[${jiraInfo.epicKey}](${jiraBaseUrl}/browse/${jiraInfo.epicKey})`
      : '(JIRA 連携なし)';

    const prBody = `## 概要

${featureName} の実装

## 関連 JIRA

${jiraLink}

---
*この PR は spec-impl ワークフローで自動作成されました*`;

    const { Octokit } = await import('@octokit/rest');
    const { getRepositoryInfo } = await import('./utils/project-meta.js');
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('Missing GitHub credentials. Required: GITHUB_TOKEN');
    }

    // .michi/project.json から repository 情報を取得
    let repo: string;
    try {
      repo = getRepositoryInfo();
    } catch (error) {
      throw new Error(
        `Failed to get repository info from .michi/project.json: ${error instanceof Error ? error.message : error}`,
      );
    }

    const [owner, repoName] = repo.split('/');
    const octokit = new Octokit({ auth: token });

    const pr = await octokit.pulls.create({
      owner,
      repo: repoName,
      title: prTitle,
      body: prBody,
      head: branch,
      base: 'main',
    });

    prUrl = pr.data.html_url;
    console.log(`✅ PR 作成完了: ${prUrl}`);
  } catch (error) {
    console.error(
      `❌ PR 作成に失敗: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }

  // JIRA 連携スキップの場合はここで終了
  if (skipJira) {
    console.log('\n⏭️  JIRA 連携をスキップします');
    console.log('\n🎉 spec-impl ワークフロー完了');
    console.log(`   PR: ${prUrl}`);
    return { prUrl };
  }

  // 2. Epic と Story を「レビュー待ち」に遷移
  try {
    await transitionEpicAndStory(jiraInfo, statusMapping.readyForReview);
  } catch (_error) {
    console.error(
      `⚠️  JIRA ステータス更新に失敗しましたが、PR は作成されています: ${prUrl}`,
    );
    // PR は作成済みなので、JIRA 更新の失敗は警告のみ
  }

  // 3. PR リンクを JIRA にコメント
  if (jiraInfo.epicKey) {
    try {
      console.log('\n💬 JIRA に PR リンクをコメント中...');
      const jiraConfig = getJIRAConfig();
      const client = new JIRAClient(jiraConfig);
      const commentText = `PR を作成しました: ${prUrl}

この PR は spec-impl ワークフローで自動作成されました。`;

      await client.addComment(jiraInfo.epicKey, commentText);
      console.log(`  ✅ ${jiraInfo.epicKey} に PR リンクをコメントしました`);
    } catch (error) {
      console.error(
        `  ⚠️  JIRA コメント追加に失敗: ${error instanceof Error ? error.message : error}`,
      );
      // コメント失敗は警告のみ
    }
  }

  console.log('\n🎉 spec-impl ワークフロー完了');
  console.log(`   PR: ${prUrl}`);
  if (jiraInfo.epicKey) {
    console.log(
      `   JIRA: ${process.env.ATLASSIAN_URL}/browse/${jiraInfo.epicKey}`,
    );
  }

  return { prUrl };
}

// ============================================================================
// 後方互換性のための旧 API（非推奨）
// ============================================================================

/**
 * @deprecated runSpecImplStart() を使用してください
 */
export interface SpecImplContext {
  featureName: string;
  jiraKey: string;
  branchName?: string;
}

/**
 * @deprecated runSpecImplStart() を使用してください
 */
export async function onSpecImplStart(context: SpecImplContext): Promise<void> {
  console.warn(
    '⚠️  onSpecImplStart は非推奨です。runSpecImplStart() を使用してください。',
  );

  const { featureName, jiraKey } = context;
  const statusMapping = getStatusMapping();

  console.log(`🚀 spec-impl 開始: ${featureName}`);
  console.log(`📋 対象 JIRA: ${jiraKey}`);

  const jiraConfig = getJIRAConfig();
  const client = new JIRAClient(jiraConfig);

  await client.transitionIssue(jiraKey, statusMapping.inProgress);
  console.log(`✅ ${jiraKey} を「${statusMapping.inProgress}」に移動しました`);
}

/**
 * @deprecated runSpecImplComplete() を使用してください
 */
export async function onSpecImplEnd(
  context: SpecImplContext,
): Promise<{ prUrl: string }> {
  console.warn(
    '⚠️  onSpecImplEnd は非推奨です。runSpecImplComplete() を使用してください。',
  );

  const { featureName, jiraKey, branchName } = context;
  const statusMapping = getStatusMapping();
  const branch = branchName || `feature/${featureName}`;

  console.log(`🏁 spec-impl 終了: ${featureName}`);
  console.log(`📋 対象 JIRA: ${jiraKey}`);
  console.log(`🌿 ブランチ: ${branch}`);

  let prUrl = '';

  // PR 作成
  const { Octokit } = await import('@octokit/rest');
  const { getRepositoryInfo } = await import('./utils/project-meta.js');
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('Missing GitHub credentials. Required: GITHUB_TOKEN');
  }

  // .michi/project.json から repository 情報を取得
  let repo: string;
  try {
    repo = getRepositoryInfo();
  } catch (error) {
    throw new Error(
      `Failed to get repository info from .michi/project.json: ${error instanceof Error ? error.message : error}`,
    );
  }

  const [owner, repoName] = repo.split('/');
  const octokit = new Octokit({ auth: token });

  const prTitle = `feat: ${featureName}`;
  const prBody = `## 概要

${featureName} の実装

## 関連 JIRA

[${jiraKey}](${process.env.ATLASSIAN_URL}/browse/${jiraKey})

---
*この PR は spec-impl ワークフローで自動作成されました*`;

  const pr = await octokit.pulls.create({
    owner,
    repo: repoName,
    title: prTitle,
    body: prBody,
    head: branch,
    base: 'main',
  });

  prUrl = pr.data.html_url;
  console.log(`✅ PR 作成完了: ${prUrl}`);

  // JIRA 更新
  const jiraConfig = getJIRAConfig();
  const client = new JIRAClient(jiraConfig);

  await client.transitionIssue(jiraKey, statusMapping.readyForReview);
  console.log(
    `✅ ${jiraKey} を「${statusMapping.readyForReview}」に移動しました`,
  );

  const commentText = `PR を作成しました: ${prUrl}

この PR は spec-impl ワークフローで自動作成されました。`;

  await client.addComment(jiraKey, commentText);
  console.log(`✅ ${jiraKey} に PR リンクをコメントしました`);

  console.log('\n🎉 spec-impl ワークフロー完了');
  console.log(`   PR: ${prUrl}`);
  console.log(`   JIRA: ${process.env.ATLASSIAN_URL}/browse/${jiraKey}`);

  return { prUrl };
}

// ============================================================================
// CLI 実行（開発用）
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !['start', 'complete'].includes(command)) {
    console.error('Usage:');
    console.error(
      '  npx tsx scripts/spec-impl-workflow.ts start <feature> [--skip-jira]',
    );
    console.error(
      '  npx tsx scripts/spec-impl-workflow.ts complete <feature> [--skip-jira] [--branch <name>]',
    );
    process.exit(1);
  }

  const featureName = args[1];
  const skipJira = args.includes('--skip-jira');
  const branchIndex = args.indexOf('--branch');
  const branchName = branchIndex !== -1 ? args[branchIndex + 1] : undefined;

  if (!featureName) {
    console.error('Error: feature name is required');
    process.exit(1);
  }

  const options: SpecImplWorkflowOptions = {
    featureName,
    skipJira,
    branchName,
  };

  if (command === 'start') {
    runSpecImplStart(options)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  } else {
    runSpecImplComplete(options)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  }
}
