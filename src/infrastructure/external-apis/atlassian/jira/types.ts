/**
 * JIRA Integration Types
 *
 * JIRA API用の型定義を集約したファイル
 */

/**
 * Atlassian Document Format (ADF) の型定義
 */
export interface ADFNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface ADFDocument {
  version: number;
  type: 'doc';
  content: ADFNode[];
}

/**
 * JIRA Issue基本型
 */
export interface JiraIssue {
  id: string;
  key: string;
  fields?: {
    summary?: string;
    [key: string]: unknown;
  };
}

/**
 * JIRA Issue型定義（必要最小限）
 */
export interface JIRAIssue {
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
export interface JIRAIssuePayload {
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
export interface JIRAIssueCreateResponse {
  id: string;
  key: string;
  self: string;
}

/**
 * JIRA Issue Type型
 */
export interface JIRAIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
}

/**
 * JIRA認証設定
 */
export interface JIRAConfig {
  url: string;
  email: string;
  apiToken: string;
}

/**
 * Storyの詳細情報を抽出
 */
export interface StoryDetails {
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
