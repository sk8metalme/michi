/**
 * jira:sync command implementation
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

import { syncTasksToJIRA } from '../../../infrastructure/external-apis/atlassian/jira/index.js';

export interface JiraSyncOptions {
  featureName: string;
}

/**
 * tasks.mdをJIRAに同期するコマンド
 *
 * @param options コマンドオプション
 * @throws Error 同期に失敗した場合
 */
export async function jiraSyncCommand(options: JiraSyncOptions): Promise<void> {
  console.log(`\n🔄 Syncing tasks to JIRA: ${options.featureName}`);

  try {
    await syncTasksToJIRA(options.featureName);
    console.log('✅ JIRA sync completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`JIRA sync failed: ${errorMessage}`);
  }
}
