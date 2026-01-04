/**
 * Issue Builder
 *
 * JIRAのIssue（Epic、Story）を作成するためのヘルパー関数を提供
 */

import type { StoryDetails, JIRAIssue } from './types.js';
import type { JIRAClient } from './client.js';
import { textToADF } from './adf-converter.js';
import type { SpecJson } from '../../../../../scripts/utils/spec-updater.js';

/**
 * リポジトリ名を抽出
 * @param repository GitHub repository URL
 * @returns リポジトリ名（例: "michi"）
 */
export function extractRepoName(repository: string): string {
  // owner/repo 形式を抽出
  const match = repository.match(/github\.com[:/]([\w.-]+\/[\w.-]+)(\.git)?/);
  if (!match) {
    // フォールバック: repository 全体を使用
    return 'repo';
  }

  const ownerRepo = match[1]; // 例: sk8metalme/michi
  const parts = ownerRepo.split('/');
  return parts[1] || parts[0]; // repo部分のみ返す
}

/**
 * タイトルプレフィックスを作成
 * @param repoName リポジトリ名
 * @param featureName 機能名
 * @returns プレフィックス（例: "[michi][feature-name]"）
 */
export function createTitlePrefix(repoName: string, featureName: string): string {
  return `[${repoName}][${featureName}]`;
}

/**
 * Storyの詳細情報を抽出
 */
export function extractStoryDetails(
  tasksContent: string,
  storyTitle: string,
): StoryDetails {
  const details: StoryDetails = { title: storyTitle };

  // Story セクションを抽出（ReDoS対策: [\s\S]*? → [^]*? に変更）
  const escapedTitle = storyTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const storyPattern = new RegExp(
    `### Story [\\d.]+: ${escapedTitle}\\n([^]*?)(?=\\n### Story|\\n## Phase|$)`,
    'i',
  );
  const storyMatch = tasksContent.match(storyPattern);

  if (!storyMatch) return details;

  const storySection = storyMatch[1];

  // 優先度抽出
  const priorityMatch = storySection.match(/\*\*優先度\*\*:\s*(.+)/);
  if (priorityMatch) details.priority = priorityMatch[1].trim();

  // 見積もり抽出
  const estimateMatch = storySection.match(/\*\*見積もり\*\*:\s*(.+)/);
  if (estimateMatch) details.estimate = estimateMatch[1].trim();

  // 担当抽出
  const assigneeMatch = storySection.match(/\*\*担当\*\*:\s*(.+)/);
  if (assigneeMatch) details.assignee = assigneeMatch[1].trim();

  // 期限抽出
  const dueDateMatch = storySection.match(
    /\*\*期限\*\*:\s*(\d{4}-\d{2}-\d{2})/,
  );
  if (dueDateMatch) details.dueDate = dueDateMatch[1];

  // 説明抽出（改行あり・なし両方に対応）
  const descriptionMatch = storySection.match(
    /\*\*説明\*\*:\s*\n?(.+?)(?=\n\*\*|$)/s,
  );
  if (descriptionMatch) details.description = descriptionMatch[1].trim();

  // 完了条件抽出
  const criteriaMatch = storySection.match(
    /\*\*完了条件\*\*:\s*\n((?:- \[.\].*\n?)+)/,
  );
  if (criteriaMatch) {
    details.acceptanceCriteria = criteriaMatch[1]
      .split('\n')
      .filter((line) => line.trim().startsWith('- ['))
      .map((line) => line.replace(/^- \[.\]\s*/, '').trim())
      .filter((line) => line.length > 0);
  }

  // サブタスク抽出
  const subtasksMatch = storySection.match(
    /\*\*サブタスク\*\*:\s*\n((?:- \[.\].*\n?)+)/,
  );
  if (subtasksMatch) {
    details.subtasks = subtasksMatch[1]
      .split('\n')
      .filter((line) => line.trim().startsWith('- ['))
      .map((line) => line.replace(/^- \[.\]\s*/, '').trim())
      .filter((line) => line.length > 0);
  }

  // 依存関係抽出
  const dependenciesMatch = storySection.match(/\*\*依存関係\*\*:\s*(.+)/);
  if (dependenciesMatch) details.dependencies = dependenciesMatch[1].trim();

  return details;
}

/**
 * StoryタイプのIDを取得
 */
export async function getStoryIssueTypeId(
  appConfig: { jira?: { issueTypes?: { story?: string | null } } & Record<string, unknown> } & Record<string, unknown>,
  projectMeta: { jiraProjectKey: string },
  client: JIRAClient,
): Promise<string> {
  // StoryタイプのIDを動的に取得（日本語JIRAでは "ストーリー" という名前の場合がある）
  let storyIssueTypeId: string | undefined =
    appConfig.jira?.issueTypes?.story || process.env.JIRA_ISSUE_TYPE_STORY;
  console.log(
    `📋 Story Issue Type ID from config/env: ${storyIssueTypeId || 'not found'}`,
  );

  if (!storyIssueTypeId) {
    console.log('🔍 Attempting to find Story issue type dynamically...');
    const foundId =
      (await client.getIssueTypeId(projectMeta.jiraProjectKey, 'Story')) ||
      (await client.getIssueTypeId(projectMeta.jiraProjectKey, 'ストーリー'));
    storyIssueTypeId = foundId ?? undefined;
    console.log(
      `📋 Story Issue Type ID from API: ${storyIssueTypeId || 'not found'}`,
    );
  }

  if (!storyIssueTypeId) {
    throw new Error(
      'JIRA Story issue type ID is not configured and could not be found in project. ' +
        'Please set JIRA_ISSUE_TYPE_STORY environment variable or configure it in .michi/config.json. ' +
        'You can find the issue type ID in JIRA UI (Settings > Issues > Issue types) or via REST API: ' +
        'GET https://your-domain.atlassian.net/rest/api/3/project/{projectKey}',
    );
  }

  console.log(`✅ Using Story Issue Type ID: ${storyIssueTypeId}`);
  return storyIssueTypeId;
}

/**
 * Epicを取得または作成
 */
export async function getOrCreateEpic(
  featureName: string,
  spec: SpecJson,
  projectMeta: { projectName: string; jiraProjectKey: string; repository: string; confluenceLabels: string[] },
  client: JIRAClient,
): Promise<{ key: string }> {
  // 既存のEpicをチェック
  if (spec.jira?.epicKey) {
    console.log(`Existing Epic found: ${spec.jira.epicKey}`);
    console.log('Skipping Epic creation (already exists)');
    return { key: spec.jira.epicKey };
  }

  // Epic作成
  console.log('Creating Epic...');
  const repoName = extractRepoName(projectMeta.repository);
  const titlePrefix = createTitlePrefix(repoName, featureName);
  const epicSummary = `${titlePrefix} ${projectMeta.projectName}`;

  // 同じタイトルのEpicがすでに存在するかJQLで検索
  const jql = `project = ${projectMeta.jiraProjectKey} AND issuetype = Epic AND summary ~ "${featureName}"`;
  let existingEpics: JIRAIssue[] = [];
  try {
    existingEpics = await client.searchIssues(jql);
  } catch (error) {
    console.error(
      '❌ Failed to search existing Epics:',
      error instanceof Error ? error.message : error,
    );
    console.error(
      '⚠️  Cannot verify idempotency - proceeding with Epic creation',
    );
    console.error(
      '   If Epic already exists, manual cleanup may be required',
    );
    // 検索失敗時はフォールバック: 新規作成を試みる（重複リスクあり）
    existingEpics = [];
  }

  if (existingEpics.length > 0) {
    console.log(
      `Found existing Epic with similar title: ${existingEpics[0].key}`,
    );
    console.log('Using existing Epic instead of creating new one');
    return existingEpics[0];
  }

  // EpicタイプのIDを取得（日本語JIRAでは "エピック" という名前の場合がある）
  const epicTypeId =
    (await client.getIssueTypeId(projectMeta.jiraProjectKey, 'Epic')) ||
    (await client.getIssueTypeId(projectMeta.jiraProjectKey, 'エピック'));

  if (!epicTypeId) {
    throw new Error(
      'Epic issue type not found in project. ' +
        'Please ensure the project has Epic issue type enabled.',
    );
  }

  const epicDescription = `機能: ${featureName}\nGitHub: ${projectMeta.repository}/tree/main/.michi/specs/${featureName}`;

  const epicPayload = {
    fields: {
      project: { key: projectMeta.jiraProjectKey },
      summary: epicSummary,
      description: textToADF(epicDescription), // ADF形式に変換
      issuetype: { id: epicTypeId }, // IDを使用（nameではなく）
      labels: projectMeta.confluenceLabels,
    },
  };

  const epic = await client.createIssue(epicPayload);
  console.log(`✅ Epic created: ${epic.key}`);
  return epic;
}
