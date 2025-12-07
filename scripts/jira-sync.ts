/**
 * JIRA連携スクリプト
 * tasks.md から JIRA Epic/Story/Subtask を自動作成
 *
 * 【重要】Epic Link について:
 * JIRA Cloud では Story を Epic に紐付けるには、Epic Link カスタムフィールド
 * （通常 customfield_10014）を使用する必要があります。
 *
 * 現在の実装では parent フィールドを使用していますが、これは Subtask 専用です。
 * Story 作成時に 400 エラーが発生する可能性があります。
 *
 * 対処方法:
 * 1. JIRA 管理画面で Epic Link のカスタムフィールドIDを確認
 * 2. 環境変数 JIRA_EPIC_LINK_FIELD に設定（例: customfield_10014）
 * 3. または、Story 作成後に手動で Epic Link を設定
 *
 * 参考: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';
import { validateFeatureNameOrThrow } from './utils/feature-name-validator.js';
import { getConfig, getConfigPath } from './utils/config-loader.js';
import { validateForJiraSyncAsync } from './utils/config-validator.js';
import {
  updateSpecJsonAfterJiraSync,
  type SpecJson,
} from './utils/spec-updater.js';

config();

/**
 * リクエスト間のスリープ処理（レートリミット対策）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リクエスト間の待機時間（ミリ秒）
 * 環境変数 ATLASSIAN_REQUEST_DELAY で調整可能（デフォルト: 500ms）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * Atlassian Document Format (ADF) の型定義
 */
interface ADFNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

interface ADFDocument {
  version: number;
  type: 'doc';
  content: ADFNode[];
}

/**
 * JIRA Issue型定義（必要最小限）
 */
interface JIRAIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    issuetype?: { id: string; name: string };
    status?: { name: string };
    [key: string]: unknown;
  };
}

/**
 * JIRA Issue作成/更新ペイロード型
 */
interface JIRAIssuePayload {
  fields: {
    project: { key: string };
    summary: string;
    description?: ADFDocument;
    issuetype: { id: string };
    labels?: string[];
    parent?: { key: string };
    [key: string]: unknown;
  };
  update?: Record<string, unknown>;
}

/**
 * JIRA Issue作成レスポンス型
 */
interface JIRAIssueCreateResponse {
  id: string;
  key: string;
  self: string;
}

/**
 * JIRA Issue Type型
 */
interface JIRAIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
}

/**
 * Storyの詳細情報を抽出
 */
interface StoryDetails {
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  subtasks?: string[];
  dependencies?: string;
  priority?: string;
  estimate?: string;
  assignee?: string;
  dueDate?: string;
}

function extractStoryDetails(
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
 * リッチなADF形式を生成
 */
function createRichADF(
  details: StoryDetails,
  phaseLabel: string,
  githubUrl: string,
): ADFDocument {
  const content: ADFNode[] = [];

  // 説明セクション
  if (details.description) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '説明' }],
    });
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: details.description }],
    });
  }

  // メタデータセクション
  const metadata: string[] = [];
  if (details.priority) metadata.push(`優先度: ${details.priority}`);
  if (details.estimate) metadata.push(`見積もり: ${details.estimate}`);
  if (details.assignee) metadata.push(`担当: ${details.assignee}`);
  if (details.dependencies) metadata.push(`依存関係: ${details.dependencies}`);

  if (metadata.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'メタデータ' }],
    });
    metadata.forEach((item) => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: item }],
      });
    });
  }

  // 完了条件セクション
  if (details.acceptanceCriteria && details.acceptanceCriteria.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '完了条件' }],
    });

    const listItems = details.acceptanceCriteria.map((criterion) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: criterion }],
        },
      ],
    }));

    content.push({
      type: 'bulletList',
      content: listItems,
    });
  }

  // サブタスクセクション
  if (details.subtasks && details.subtasks.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'サブタスク' }],
    });

    const listItems = details.subtasks.map((subtask) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: subtask }],
        },
      ],
    }));

    content.push({
      type: 'bulletList',
      content: listItems,
    });
  }

  // フッター（Phase、GitHubリンク）
  content.push({
    type: 'rule',
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Phase: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: phaseLabel },
    ],
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'GitHub: ', marks: [{ type: 'strong' }] },
      {
        type: 'text',
        text: githubUrl,
        marks: [
          {
            type: 'link',
            attrs: { href: githubUrl },
          },
        ],
      },
    ],
  });

  return {
    type: 'doc',
    version: 1,
    content: content,
  };
}

/**
 * プレーンテキストをAtlassian Document Format（ADF）に変換
 */
function textToADF(text: string): ADFDocument {
  // 改行で分割して段落を作成
  const paragraphs = text.split('\n').filter((line) => line.trim().length > 0);

  return {
    type: 'doc',
    version: 1,
    content: paragraphs.map((para) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: para.trim(),
        },
      ],
    })),
  };
}

interface JIRAConfig {
  url: string;
  email: string;
  apiToken: string;
}

function getJIRAConfig(): JIRAConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !email || !apiToken) {
    throw new Error('Missing JIRA credentials in .env');
  }

  return { url, email, apiToken };
}

class JIRAClient {
  private baseUrl: string;
  private auth: string;
  private requestDelay: number;

  constructor(config: JIRAConfig) {
    this.baseUrl = `${config.url}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      'base64',
    );
    this.requestDelay = getRequestDelay();
  }

  /**
   * JQL検索でIssueを検索
   * @throws 検索エラー時は例外を再スロー（呼び出し元で処理）
   */
  async searchIssues(jql: string): Promise<JIRAIssue[]> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // JIRA API v3の検索エンドポイントを使用
      // GET /rest/api/3/search でJQL検索を実行（GETメソッドが推奨）
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,issuetype,status,key',
        },
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.issues || [];
    } catch (error) {
      // エラーハンドリング改善
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(`Error searching issues (HTTP ${status}): ${message}`);

        if (status === 410) {
          console.error(
            '💡 Hint: The search API endpoint returned 410 (Gone).',
          );
          console.error(
            '   This may indicate the endpoint has been deprecated or disabled.',
          );
          console.error(
            '   Check JIRA instance configuration or try alternative search methods.',
          );
        } else if (status === 401) {
          console.error(
            '💡 Hint: Authentication failed. Check ATLASSIAN_API_TOKEN in .env',
          );
        } else if (status === 403) {
          console.error(
            '💡 Hint: Permission denied. Check API token permissions in JIRA.',
          );
        }
      } else {
        console.error(
          'Error searching issues:',
          error instanceof Error ? error.message : error,
        );
      }
      throw error; // エラーを再スローして呼び出し元で処理
    }
  }

  async createIssue(
    payload: JIRAIssuePayload,
  ): Promise<JIRAIssueCreateResponse> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    const response = await axios.post<JIRAIssueCreateResponse>(
      `${this.baseUrl}/issue`,
      payload,
      {
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }

  async updateIssue(
    issueKey: string,
    payload: Partial<JIRAIssuePayload>,
  ): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    await axios.put(`${this.baseUrl}/issue/${issueKey}`, payload, {
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * JIRAチケットのステータスを変更（トランジション実行）
   * @param issueKey JIRAチケットキー (例: "PROJ-123")
   * @param transitionName 遷移先ステータス名 (例: "In Progress", "Ready for Review")
   * @throws トランジションが見つからない場合はエラー
   */
  async transitionIssue(
    issueKey: string,
    transitionName: string,
  ): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // 1. 利用可能なトランジションを取得
      const transitionsResponse = await axios.get(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const transitions = transitionsResponse.data.transitions || [];

      // 2. transitionNameに一致するトランジションIDを特定
      // 名前の完全一致または部分一致で検索
      const transition = transitions.find(
        (t: { id: string; name: string }) =>
          t.name.toLowerCase() === transitionName.toLowerCase() ||
          t.name.toLowerCase().includes(transitionName.toLowerCase()),
      );

      if (!transition) {
        const availableTransitions = transitions
          .map((t: { name: string }) => t.name)
          .join(', ');
        throw new Error(
          `Transition "${transitionName}" not found for issue ${issueKey}. ` +
            `Available transitions: ${availableTransitions || 'none'}`,
        );
      }

      // レートリミット対策: リクエスト前に待機
      await sleep(this.requestDelay);

      // 3. トランジションを実行
      await axios.post(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
        {
          transition: { id: transition.id },
        },
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(
        `✅ ${issueKey} のステータスを「${transition.name}」に変更しました`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(
          `Error transitioning issue ${issueKey} (HTTP ${status}): ${message}`,
        );

        if (status === 404) {
          console.error(
            `💡 Hint: Issue ${issueKey} was not found. Check the issue key.`,
          );
        } else if (status === 400) {
          console.error(
            '💡 Hint: The transition may not be valid from the current status.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * JIRAチケットにコメントを追加
   * @param issueKey JIRAチケットキー
   * @param commentText コメント内容
   */
  async addComment(issueKey: string, commentText: string): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // Atlassian Document Format (ADF) でコメントを作成
      const commentBody: ADFDocument = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: commentText,
              },
            ],
          },
        ],
      };

      await axios.post(
        `${this.baseUrl}/issue/${issueKey}/comment`,
        {
          body: commentBody,
        },
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(`✅ ${issueKey} にコメントを追加しました`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(
          `Error adding comment to ${issueKey} (HTTP ${status}): ${message}`,
        );

        if (status === 404) {
          console.error(
            `💡 Hint: Issue ${issueKey} was not found. Check the issue key.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * プロジェクトのIssue Type IDを取得
   * @param projectKey プロジェクトキー
   * @param issueTypeName Issue Type名（例: "Epic", "Story"）
   * @returns Issue Type ID
   */
  async getIssueTypeId(
    projectKey: string,
    issueTypeName: string,
  ): Promise<string | null> {
    await sleep(this.requestDelay);

    try {
      const response = await axios.get(
        `${this.baseUrl}/project/${projectKey}`,
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const issueTypes = (response.data.issueTypes || []) as JIRAIssueType[];
      const issueType = issueTypes.find(
        (it: JIRAIssueType) =>
          it.name.toLowerCase() === issueTypeName.toLowerCase() ||
          it.name === issueTypeName,
      );

      return issueType ? issueType.id : null;
    } catch (error) {
      console.error(
        `Error getting issue type ID for ${issueTypeName}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}

async function syncTasksToJIRA(featureName: string): Promise<void> {
  console.log(`Syncing tasks for feature: ${featureName}`);

  // feature名のバリデーション（必須）
  validateFeatureNameOrThrow(featureName);

  // 実行前の必須設定値チェック（非同期版：Issue Type IDの存在チェック付き）
  const validation = await validateForJiraSyncAsync();

  if (validation.info.length > 0) {
    validation.info.forEach((msg) => console.log(`ℹ️  ${msg}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach((warning) => console.warn(`   ${warning}`));
  }

  if (validation.errors.length > 0) {
    console.error('❌ Configuration errors:');
    validation.errors.forEach((error) => console.error(`   ${error}`));
    const configPath = getConfigPath();
    console.error(`\n設定ファイル: ${configPath}`);
    throw new Error(
      'JIRA同期に必要な設定値が不足しています。上記のエラーを確認して設定を修正してください。',
    );
  }

  console.log(
    `⏳ Request delay: ${getRequestDelay()}ms (set ATLASSIAN_REQUEST_DELAY to adjust)`,
  );

  // 設定からissue type IDを取得（検索と作成の両方で使用）
  const appConfig = getConfig();
  const projectMeta = loadProjectMeta();
  const config = getJIRAConfig();
  const client = new JIRAClient(config);

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

  const tasksPath = resolve(`.kiro/specs/${featureName}/tasks.md`);
  const tasksContent = readFileSync(tasksPath, 'utf-8');

  // spec.jsonを読み込んで既存のEpicキーを確認
  const specPath = resolve(`.kiro/specs/${featureName}/spec.json`);
  let spec: SpecJson = {};
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf-8')) as SpecJson;
  } catch {
    console.error('spec.json not found or invalid');
  }

  let epic: { key: string } | undefined;

  // 既存のEpicをチェック
  if (spec.jira?.epicKey) {
    console.log(`Existing Epic found: ${spec.jira.epicKey}`);
    console.log('Skipping Epic creation (already exists)');
    epic = { key: spec.jira.epicKey };
  } else {
    // Epic作成
    console.log('Creating Epic...');
    const epicSummary = `[${featureName}] ${projectMeta.projectName}`;

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
      epic = existingEpics[0];
    } else {
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

      const epicDescription = `機能: ${featureName}\nGitHub: ${projectMeta.repository}/tree/main/.kiro/specs/${featureName}`;

      const epicPayload = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: epicSummary,
          description: textToADF(epicDescription), // ADF形式に変換
          issuetype: { id: epicTypeId }, // IDを使用（nameではなく）
          labels: projectMeta.confluenceLabels,
        },
      };

      epic = await client.createIssue(epicPayload);
      console.log(`✅ Epic created: ${epic.key}`);
    }
  }

  // Epicが確実に設定されていることを確認
  if (!epic) {
    throw new Error('Epic creation or retrieval failed');
  }

  // 既存のStoryを検索（重複防止）
  // ラベルで検索（summary検索では "Story: タイトル" 形式に一致しないため）
  // issuetype検索にはIDを使用（名前は言語依存のため）
  const storyJql = `project = ${projectMeta.jiraProjectKey} AND issuetype = ${storyIssueTypeId} AND labels = "${featureName}"`;
  let existingStories: any[] = [];
  try {
    existingStories = await client.searchIssues(storyJql);
  } catch (error) {
    console.error(
      '❌ Failed to search existing Stories:',
      error instanceof Error ? error.message : error,
    );
    console.error(
      '⚠️  Cannot verify idempotency - Story creation may result in duplicates',
    );
    console.error(
      '⚠️  Continuing with story creation (duplicates may be created)...',
    );
    // 検索失敗時も処理を継続（既存ストーリーなしとして扱う）
    existingStories = [];
  }

  const existingStorySummaries = new Set(
    existingStories
      .filter((s: JIRAIssue) => s?.fields?.summary)
      .map((s: JIRAIssue) => s.fields.summary),
  );
  const existingStoryKeys = new Set(
    existingStories
      .filter((s: JIRAIssue) => s?.key)
      .map((s: JIRAIssue) => s.key),
  );

  console.log(
    `Found ${existingStories.length} existing stories for this feature`,
  );

  // フェーズラベル検出用の正規表現
  // Phase X: フェーズ名（ラベル）の形式を検出
  // Phase番号: 数字（0, 1, 2...）、ドット付き数字（0.1, 0.2...）、英字（A, B）に対応
  const phasePattern = /## Phase [\d.A-Z]+:\s*(.+?)(?:（(.+?)）)?/;

  // Story作成（フェーズ検出付きパーサー）
  const lines = tasksContent.split('\n');
  let currentPhaseLabel = 'implementation'; // デフォルトは実装フェーズ
  const createdStories: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // フェーズ検出
    const phaseMatch = line.match(phasePattern);
    if (phaseMatch) {
      const phaseTitle = phaseMatch[1]; // フェーズタイトル全体
      const phaseName = phaseMatch[2] || phaseTitle; // 括弧内のラベル（例: Requirements）または全体

      // Phase番号を抽出（例: "0.1", "2", "A"）
      const phaseNumberMatch = line.match(/## Phase ([\d.A-Z]+):/);
      const phaseNumber = phaseNumberMatch ? phaseNumberMatch[1] : '';

      // フェーズ番号またはフェーズ名からラベルを決定
      // 新ワークフロー構造に対応
      if (
        phaseNumber === '0.0' ||
        phaseName.includes('初期化') ||
        phaseName.toLowerCase().includes('init')
      ) {
        currentPhaseLabel = 'spec-init';
      } else if (
        phaseNumber === '0.1' ||
        phaseName.includes('要件定義') ||
        phaseName.toLowerCase().includes('requirements')
      ) {
        currentPhaseLabel = 'requirements';
      } else if (
        phaseNumber === '0.2' ||
        phaseName.includes('設計') ||
        phaseName.toLowerCase().includes('design')
      ) {
        currentPhaseLabel = 'design';
      } else if (
        phaseNumber === '0.3' ||
        phaseName.includes('テストタイプ') ||
        phaseName.toLowerCase().includes('test-type') ||
        phaseName.toLowerCase().includes('test type')
      ) {
        currentPhaseLabel = 'test-type-selection';
      } else if (
        phaseNumber === '0.4' ||
        phaseName.includes('テスト仕様') ||
        phaseName.toLowerCase().includes('test-spec') ||
        phaseName.toLowerCase().includes('test spec')
      ) {
        currentPhaseLabel = 'test-spec';
      } else if (
        phaseNumber === '0.5' ||
        phaseName.includes('タスク分割') ||
        phaseName.toLowerCase().includes('tasks') ||
        phaseName.toLowerCase().includes('task breakdown')
      ) {
        currentPhaseLabel = 'spec-tasks';
      } else if (
        phaseNumber === '0.6' ||
        phaseName.includes('JIRA') ||
        phaseName.toLowerCase().includes('jira')
      ) {
        currentPhaseLabel = 'jira-sync';
      } else if (
        phaseNumber === '1' ||
        phaseName.includes('環境構築') ||
        phaseName.toLowerCase().includes('environment') ||
        phaseName.toLowerCase().includes('setup')
      ) {
        currentPhaseLabel = 'environment-setup';
      } else if (
        phaseNumber === '2' ||
        phaseName.includes('実装') ||
        phaseName.includes('TDD') ||
        phaseName.toLowerCase().includes('implementation')
      ) {
        currentPhaseLabel = 'implementation';
      } else if (
        phaseNumber === 'A' ||
        phaseNumber.toLowerCase() === 'a' ||
        phaseName.includes('PR前') ||
        phaseName.toLowerCase().includes('pr-test') ||
        phaseName.toLowerCase().includes('pr test')
      ) {
        currentPhaseLabel = 'phase-a';
      } else if (
        phaseNumber === '3' ||
        phaseName.includes('追加QA') ||
        phaseName.includes('QA') ||
        phaseName.includes('試験') ||
        phaseName.toLowerCase().includes('testing') ||
        phaseName.toLowerCase().includes('additional qa')
      ) {
        currentPhaseLabel = 'additional-qa';
      } else if (
        phaseNumber === 'B' ||
        phaseNumber.toLowerCase() === 'b' ||
        phaseName.includes('リリース準備テスト') ||
        phaseName.toLowerCase().includes('release-test') ||
        phaseName.toLowerCase().includes('release test')
      ) {
        currentPhaseLabel = 'phase-b';
      } else if (
        phaseNumber === '4' ||
        phaseName.includes('リリース準備') ||
        phaseName.toLowerCase().includes('release-prep') ||
        phaseName.toLowerCase().includes('release preparation')
      ) {
        currentPhaseLabel = 'release-prep';
      } else if (
        phaseNumber === '5' ||
        (phaseName.includes('リリース') && !phaseName.includes('準備')) ||
        (phaseName.toLowerCase().includes('release') &&
          !phaseName.toLowerCase().includes('prep'))
      ) {
        currentPhaseLabel = 'release';
      }

      console.log(
        `📌 Phase detected: ${phaseTitle} (number: ${phaseNumber}, label: ${currentPhaseLabel})`,
      );
      continue;
    }

    // Story検出
    const storyMatch = line.match(/### Story [\d.]+: (.+)/);
    if (!storyMatch) continue;

    const storyTitle = storyMatch[1];
    const storySummary = `Story: ${storyTitle}`;

    // 既に同じタイトルのStoryが存在するかチェック
    if (existingStorySummaries.has(storySummary)) {
      console.log(`Skipping Story (already exists): ${storyTitle}`);
      const existing = existingStories.find(
        (s: any) => s?.fields?.summary === storySummary,
      );
      if (existing) {
        createdStories.push(existing.key);
        existingStoryKeys.add(existing.key);
      } else {
        console.warn(
          `⚠️  Warning: Story "${storyTitle}" is in summary set but not found in existingStories array`,
        );
      }
      continue;
    }

    console.log(`Creating Story: ${storyTitle} [${currentPhaseLabel}]`);

    try {
      // Storyの詳細情報を抽出（新しい実装を使用）
      const storyDetails = extractStoryDetails(tasksContent, storyTitle);

      // GitHubリンク
      const githubUrl = `${projectMeta.repository}/tree/main/.kiro/specs/${featureName}/tasks.md`;

      // リッチなADF形式で説明文を生成
      const richDescription = createRichADF(
        storyDetails,
        currentPhaseLabel,
        githubUrl,
      );

      // 優先度のマッピング（デフォルト: Medium）
      const priorityMap: { [key: string]: string } = {
        High: 'High',
        Medium: 'Medium',
        Low: 'Low',
      };
      const priority =
        storyDetails.priority && priorityMap[storyDetails.priority]
          ? priorityMap[storyDetails.priority]
          : 'Medium';

      // 見積もり（Story Points）を取得
      let storyPoints: number | undefined;
      if (storyDetails.estimate) {
        const spMatch = storyDetails.estimate.match(/(\d+)\s*SP/);
        if (spMatch) {
          storyPoints = parseInt(spMatch[1], 10);
        }
      }

      // JIRAペイロードを作成（issue type IDは既に取得済み）
      const storyPayload: any = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: storySummary,
          description: richDescription, // リッチなADF形式
          issuetype: { id: storyIssueTypeId },
          labels: [
            ...projectMeta.confluenceLabels,
            featureName,
            currentPhaseLabel,
          ],
          priority: { name: priority },
        },
      };

      // 期限（Due Date）を設定
      if (storyDetails.dueDate) {
        storyPayload.fields.duedate = storyDetails.dueDate; // YYYY-MM-DD形式
      }

      // Story Pointsを設定（カスタムフィールド）
      // 注意: JIRAプロジェクトによってカスタムフィールドIDが異なる場合があります
      // 環境変数 JIRA_STORY_POINTS_FIELD で設定可能（例: customfield_10016）
      if (storyPoints !== undefined) {
        const storyPointsField =
          process.env.JIRA_STORY_POINTS_FIELD || 'customfield_10016';
        storyPayload.fields[storyPointsField] = storyPoints;
      }

      // 担当者を設定（アカウントIDが必要な場合があるため、オプション）
      // 注意: JIRAのアカウントIDが必要な場合があります
      // if (storyInfo?.assignee) {
      //   storyPayload.fields.assignee = { name: storyInfo.assignee };
      // }

      const story = await client.createIssue(storyPayload);
      console.log(`  ✅ Story created: ${story.key} [${currentPhaseLabel}]`);

      // 期限とStory Pointsの情報を表示
      if (storyDetails.dueDate) {
        console.log(`     期限: ${storyDetails.dueDate}`);
      }
      if (storyDetails.estimate) {
        console.log(`     見積もり: ${storyDetails.estimate}`);
      }
      if (storyPoints !== undefined) {
        console.log(`     Story Points: ${storyPoints} SP`);
      }

      createdStories.push(story.key);

      // 進捗表示（大量作成時の見通し向上）
      if (createdStories.length % 5 === 0) {
        console.log(
          `  📊 Progress: ${createdStories.length} stories created so far...`,
        );
      }

      // Epic Linkは手動設定が必要（JIRA Cloudの制約）
      console.log(`  ℹ️  Epic: ${epic.key} に手動でリンクしてください`);
    } catch (error: unknown) {
      console.error(
        `  ❌ Failed to create Story "${storyTitle}":`,
        error instanceof Error ? error.message : error,
      );

      // JIRA APIエラーの詳細を表示
      if (error.response?.data) {
        console.error(
          '  📋 JIRA API Error Details:',
          JSON.stringify(error.response.data, null, 2),
        );

        // Story Pointsフィールドのエラーの場合、警告を表示
        if (
          error.response.data.errors &&
          Object.keys(error.response.data.errors).some((key) =>
            key.includes('customfield'),
          )
        ) {
          console.error('  ⚠️  Story Pointsフィールドの設定に失敗しました。');
          console.error(
            '  💡 環境変数 JIRA_STORY_POINTS_FIELD を正しいカスタムフィールドIDに設定してください。',
          );
          console.error(
            '  💡 JIRA管理画面でStory PointsのカスタムフィールドIDを確認してください。',
          );
        }
      }

      // エラーがあっても他のStoryの作成は継続
    }
  }

  // 新規作成数と再利用数を正確に計算
  const newStoryCount = createdStories.filter(
    (key) => !existingStoryKeys.has(key),
  ).length;
  const reusedStoryCount = createdStories.filter((key) =>
    existingStoryKeys.has(key),
  ).length;

  console.log('\n✅ JIRA sync completed');
  console.log(`   Epic: ${epic.key}`);
  console.log(
    `   Stories: ${createdStories.length} processed (${newStoryCount} new, ${reusedStoryCount} reused)`,
  );

  // spec.json を更新
  const jiraBaseUrl = process.env.ATLASSIAN_URL || '';
  try {
    updateSpecJsonAfterJiraSync(featureName, {
      projectKey: projectMeta.jiraProjectKey,
      epicKey: epic.key,
      epicUrl: `${jiraBaseUrl}/browse/${epic.key}`,
      storyKeys: createdStories,
    });
  } catch (error) {
    console.warn(
      `⚠️  Failed to update spec.json after JIRA sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    // spec.json更新の失敗はスクリプト全体の失敗とはしない（JIRA同期は成功しているため）
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run jira:sync <feature-name>');
    process.exit(1);
  }

  syncTasksToJIRA(args[0])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ JIRA sync failed:', error.message);
      process.exit(1);
    });
}

export { syncTasksToJIRA, JIRAClient };
