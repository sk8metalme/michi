/**
 * JIRA連携スクリプト
 * tasks.md から JIRA Epic/Story/Subtask を自動作成
 *
 * このファイルはCLIエントリーポイントとして機能します。
 * 実装は src/infrastructure/external-apis/atlassian/jira/ に移行されました。
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

import { loadEnv } from './utils/env-loader.js';
import { syncTasksToJIRA, JIRAClient } from '../src/infrastructure/external-apis/atlassian/jira/index.js';

loadEnv();

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
