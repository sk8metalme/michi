# トラブルシューティング

このドキュメントでは、Michiでよくある問題と解決策を説明します。

## 認証エラー

### Atlassian認証エラー

**症状**:
```
❌ Authentication failed
❌ Invalid credentials
```

**原因**:
- `ATLASSIAN_API_TOKEN` が無効または有効期限切れ
- `ATLASSIAN_EMAIL` または `ATLASSIAN_URL` が間違っている

**解決策**:

1. APIトークンを再生成
   - [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) にアクセス
   - 既存のトークンを削除
   - 新しいトークンを作成
   - `.env` ファイルの `ATLASSIAN_API_TOKEN` を更新

2. 認証情報を確認
   ```bash
   # .envファイルを確認
   cat .env | grep ATLASSIAN

   # 接続テスト
   michi preflight
   ```

3. 環境変数の読み込みを確認
   ```bash
   # グローバル設定を確認
   cat ~/.michi/.env | grep ATLASSIAN

   # プロジェクト設定が優先されているか確認
   # プロジェクトの.envがグローバル設定を上書きします
   ```

### GitHub認証エラー

**症状**:
```
❌ GitHub authentication failed
❌ Bad credentials
```

**原因**:
- `GITHUB_TOKEN` が無効または有効期限切れ
- トークンのスコープが不足

**解決策**:

1. Personal Access Tokenを再生成
   - [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) にアクセス
   - 新しいトークンを作成（classic token）
   - 必要なスコープを選択:
     - `repo` - リポジトリへのフルアクセス
     - `read:org` - 組織情報の読み取り
   - `.env` ファイルの `GITHUB_TOKEN` を更新

2. トークンのスコープを確認
   ```bash
   # トークンの情報を確認
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/user
   ```

## JIRA Issue Type IDエラー

### Invalid JIRA Issue Type ID

**症状**:
```
❌ Invalid JIRA Issue Type ID
❌ Issue type not found
```

**原因**:
- `JIRA_ISSUE_TYPE_STORY` または `JIRA_ISSUE_TYPE_SUBTASK` の値が実際のJIRA環境のIssue Type IDと一致していない
- デフォルト値（10036、10037）をそのまま使用している

**解決策**:

1. REST APIでIssue Type IDを確認（推奨）
   ```bash
   curl -u your-email@company.com:your-token \
     https://your-domain.atlassian.net/rest/api/3/issuetype
   ```

   レスポンス例:
   ```json
   [
     {
       "id": "10001",
       "name": "Story",
       "subtask": false
     },
     {
       "id": "10002",
       "name": "Sub-task",
       "subtask": true
     }
   ]
   ```

2. `.env` ファイルを更新
   ```bash
   JIRA_ISSUE_TYPE_STORY=10001
   JIRA_ISSUE_TYPE_SUBTASK=10002
   ```

3. プリフライトチェックで確認
   ```bash
   michi preflight jira
   ```

### カスタムフィールドIDが見つからない

**症状**:
```
❌ Custom field not found: customfield_10016
```

**原因**:
- `JIRA_STORY_POINTS_FIELD` または `JIRA_EPIC_LINK_FIELD` の値が実際のJIRA環境のカスタムフィールド IDと一致していない

**解決策**:

1. REST APIでカスタムフィールド IDを確認
   ```bash
   curl -u your-email@company.com:your-token \
     https://your-domain.atlassian.net/rest/api/3/field
   ```

2. レスポンスから該当フィールドの `"id"` を確認
   ```json
   [
     {
       "id": "customfield_10016",
       "name": "Story Points"
     },
     {
       "id": "customfield_10014",
       "name": "Epic Link"
     }
   ]
   ```

3. `.env` ファイルを更新
   ```bash
   JIRA_STORY_POINTS_FIELD=customfield_10016
   JIRA_EPIC_LINK_FIELD=customfield_10014
   ```

## Confluenceエラー

### Confluenceページ作成失敗

**症状**:
```
❌ Confluenceページ作成失敗: Space not found
```

**原因**:
- `CONFLUENCE_PRD_SPACE` が存在しない
- スペースへのアクセス権限がない

**解決策**:

1. スペースの存在確認
   ```bash
   curl -u your-email@company.com:your-token \
     https://your-domain.atlassian.net/wiki/rest/api/space/PRD
   ```

2. スペースキーを確認
   - Confluenceでスペースを開く
   - URLから正しいスペースキーを確認（例: `/wiki/spaces/PRD/`）

3. `.env` ファイルを更新
   ```bash
   CONFLUENCE_PRD_SPACE=CORRECT_SPACE_KEY
   ```

4. アクセス権限を確認
   - スペース管理者に確認
   - 必要に応じてアクセス権限を付与

### Confluenceページが見つからない

**症状**:
```
❌ Confluence page not found: Page ID not found
```

**原因**:
- `CONFLUENCE_APPROVAL_PAGE_ID` が間違っている
- ページが削除されている

**解決策**:

1. ページIDを確認
   - Confluenceでページを開く
   - URLからページIDを確認（例: `/wiki/spaces/PRD/pages/123456/`）
   - `123456` がページID

2. `.env` ファイルを更新
   ```bash
   CONFLUENCE_APPROVAL_PAGE_ID=123456
   ```

## テンプレートファイル不足エラー

### requirements.md/design.md/tasks.mdが存在しない

**症状**:
```
❌ requirements.mdが存在しません。先に/michi:spec-requirements を実行してください
❌ design.mdが存在しません。先に/michi:spec-design を実行してください
❌ tasks.mdが存在しません。先に/michi:spec-tasks を実行してください
```

**原因**:
- 前のPhaseを実行していない
- AIコマンドが正常に完了していない

**解決策**:

1. Phase順序を確認
   ```
   Phase 0.0 → 0.1 → 0.2 → 0.5 → Phase 2
   ```

2. 各Phaseを順番に実行
   ```bash
   # Phase 0.1: 要件定義
   /michi:spec-requirements calculator-app

   # Phase 0.2: 設計
   /michi:spec-design calculator-app

   # Phase 0.5: タスク分割
   /michi:spec-tasks calculator-app
   ```

3. ファイルの存在確認
   ```bash
   ls -la .michi/specs/calculator-app/
   ```

## tasks.mdフォーマットエラー

### AI-DLC形式が検出された

**症状**:
```
⚠️  AI-DLC形式が検出されました
tasks.mdはMichiワークフロー形式ではなくAI-DLC形式です。
```

**原因**:
- `tasks.md` がAI-DLC形式で作成されている
- Michiワークフロー形式に変換する必要がある

**解決策**:

1. 対話的変換（推奨）
   ```bash
   michi phase:run calculator-app tasks
   # 変換を提案されるので、"Yes"を選択
   ```

2. 手動変換
   ```bash
   # プレビュー
   michi tasks:convert calculator-app --dry-run

   # バックアップ付きで変換
   michi tasks:convert calculator-app --backup
   ```

3. 変換結果を確認
   ```bash
   cat .michi/specs/calculator-app/tasks.md
   ```

### フォーマット検証失敗

**症状**:
```
❌ フォーマット検証失敗: Invalid tasks.md format
```

**原因**:
- `tasks.md` がMichiワークフロー形式の要件を満たしていない

**解決策**:

1. テンプレートと比較
   ```bash
   # テンプレートを確認
   cat docs/user-guide/reference/tasks-template.md
   ```

2. 必須セクションを確認
   - `# タスク分割`
   - `## Story 1:` （少なくとも1つのStory）
   - `### Subtask 1.1:` （Storyごとに少なくとも1つのSubtask）

3. 手動で修正
   - テンプレートに従って `tasks.md` を修正
   - 再度フォーマット検証を実行

## レートリミット超過エラー

**症状**:
```
❌ Too Many Requests (429)
```

**原因**:
- Atlassian APIのレートリミットを超過している

**解決策**:

1. リクエスト間隔を増やす
   ```bash
   # .envファイルに追加
   ATLASSIAN_REQUEST_DELAY=1000
   ```

2. 再度実行
   ```bash
   michi phase:run calculator-app tasks
   ```

## 環境変数未設定エラー

**症状**:
```
❌ Environment variable not set: ATLASSIAN_URL
```

**原因**:
- 必須の環境変数が `.env` ファイルに設定されていない

**解決策**:

1. `.env` ファイルを作成
   ```bash
   cp env.example .env
   ```

2. 必須の環境変数を設定
   ```bash
   # 必須
   ATLASSIAN_URL=https://your-domain.atlassian.net
   ATLASSIAN_EMAIL=your-email@company.com
   ATLASSIAN_API_TOKEN=your-token-here
   JIRA_PROJECT_KEYS=PROJECT
   JIRA_ISSUE_TYPE_STORY=10036
   JIRA_ISSUE_TYPE_SUBTASK=10037
   ```

3. プリフライトチェックで確認
   ```bash
   michi preflight
   ```

## Phase実行エラー

### プリフライトチェック失敗

**症状**:
```
❌ プリフライトチェック失敗
```

**原因**:
- 必須の環境変数が未設定
- JIRA/Confluenceへの接続失敗

**解決策**:

1. 個別に接続確認
   ```bash
   # JIRA接続確認
   michi preflight jira

   # Confluence接続確認
   michi preflight confluence
   ```

2. エラーメッセージに従って設定を修正

3. 再度プリフライトチェック
   ```bash
   michi preflight
   ```

### JIRA Epic/Story作成失敗

**症状**:
```
❌ JIRA作成失敗: Project not found
```

**原因**:
- `JIRA_PROJECT_KEYS` が存在しない
- プロジェクトへのアクセス権限がない

**解決策**:

1. プロジェクトキーを確認
   ```bash
   curl -u your-email@company.com:your-token \
     https://your-domain.atlassian.net/rest/api/3/project
   ```

2. `.env` ファイルを更新
   ```bash
   JIRA_PROJECT_KEYS=CORRECT_PROJECT_KEY
   ```

3. アクセス権限を確認
   - JIRA管理者に確認
   - 必要に応じてプロジェクトへのアクセス権限を付与

## その他の問題

### ワークフロー統合実行が途中で停止する

**症状**:
```
❌ Workflow failed: Stage failed
```

**原因**:
- 承認ゲートで承認待ち
- 中間Phaseでエラー発生

**解決策**:

1. ログを確認
   ```bash
   michi workflow:run --feature calculator-app
   ```

2. 承認ゲートの場合
   - Confluenceで承認を完了させる
   - 手動承認の場合は、プロンプトで確認

3. エラーの場合
   - エラーメッセージに従って設定を修正
   - 該当Phaseを個別に再実行

### セキュリティチェックで警告が出る

**症状**:
```
⚠️  Potential security issue detected
```

**原因**:
- `.env` ファイルがGit管理下にある
- 認証情報がハードコードされている

**解決策**:

1. `.gitignore` を確認
   ```bash
   cat .gitignore | grep .env
   ```

2. `.env` をGit管理から除外
   ```bash
   git rm --cached .env
   echo ".env" >> .gitignore
   ```

3. セキュリティチェックを再実行
   ```bash
   michi config:check-security
   ```

## サポート

上記で解決しない場合は、以下をご確認ください：

- [環境変数リファレンス](reference/environment-variables.md)
- [ワークフローガイド](guides/workflow.md)
- [GitHub Issues](https://github.com/gotalab/michi/issues) - バグ報告・機能要望
