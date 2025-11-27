/**
 * spec.json から JIRA 情報を読み込むユーティリティ
 *
 * kiro:spec-impl ワークフローで使用され、spec.json から
 * Epic/Story のキーを自動取得する
 */

import { loadSpecJson } from './spec-updater.js';

/**
 * spec.json から抽出された JIRA 情報
 */
export interface JiraInfo {
  /** Epic キー (例: "PROJ-123") */
  epicKey: string | null;
  /** Story キーの配列 */
  storyKeys: string[];
  /** 最初の Story キー（実装時のメインターゲット） */
  firstStoryKey: string | null;
  /** JIRA プロジェクトキー (例: "PROJ") */
  projectKey: string | null;
  /** Epic の URL */
  epicUrl: string | null;
}

/**
 * JIRA 情報の存在状態
 */
export interface JiraInfoStatus {
  /** JIRA 情報が存在するか */
  hasJiraInfo: boolean;
  /** Epic キーが存在するか */
  hasEpic: boolean;
  /** Story が存在するか */
  hasStories: boolean;
  /** 不足している情報のリスト */
  missing: string[];
}

/**
 * spec.json から JIRA 情報を取得
 *
 * @param featureName 機能名
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 * @returns JIRA 情報
 *
 * @example
 * ```typescript
 * const jiraInfo = getJiraInfoFromSpec('user-auth');
 * if (jiraInfo.epicKey) {
 *   await transitionToInProgress(jiraInfo.epicKey);
 * }
 * if (jiraInfo.firstStoryKey) {
 *   await transitionToInProgress(jiraInfo.firstStoryKey);
 * }
 * ```
 */
export function getJiraInfoFromSpec(
  featureName: string,
  projectRoot: string = process.cwd(),
): JiraInfo {
  const spec = loadSpecJson(featureName, projectRoot);

  return {
    epicKey: spec.jira?.epicKey || null,
    storyKeys: spec.jira?.storyKeys || [],
    firstStoryKey: spec.jira?.storyKeys?.[0] || null,
    projectKey: spec.jira?.projectKey || null,
    epicUrl: spec.jira?.epicUrl || null,
  };
}

/**
 * JIRA 情報の存在状態をチェック
 *
 * @param featureName 機能名
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 * @returns JIRA 情報の存在状態
 *
 * @example
 * ```typescript
 * const status = checkJiraInfoStatus('user-auth');
 * if (!status.hasJiraInfo) {
 *   console.log('JIRA 情報がありません:', status.missing.join(', '));
 *   // ユーザーに確認: "JIRA連携をスキップしますか？"
 * }
 * ```
 */
export function checkJiraInfoStatus(
  featureName: string,
  projectRoot: string = process.cwd(),
): JiraInfoStatus {
  const jiraInfo = getJiraInfoFromSpec(featureName, projectRoot);
  const missing: string[] = [];

  if (!jiraInfo.epicKey) {
    missing.push('Epic');
  }
  if (jiraInfo.storyKeys.length === 0) {
    missing.push('Story');
  }

  return {
    hasJiraInfo: jiraInfo.epicKey !== null || jiraInfo.storyKeys.length > 0,
    hasEpic: jiraInfo.epicKey !== null,
    hasStories: jiraInfo.storyKeys.length > 0,
    missing,
  };
}

/**
 * JIRA 連携に必要な情報が揃っているかチェック
 *
 * @param featureName 機能名
 * @param projectRoot プロジェクトルート
 * @returns true: JIRA 連携可能, false: 不可
 */
export function canIntegrateWithJira(
  featureName: string,
  projectRoot: string = process.cwd(),
): boolean {
  const status = checkJiraInfoStatus(featureName, projectRoot);
  // Epic があれば JIRA 連携可能（Story がなくても Epic のみ更新）
  return status.hasEpic;
}
