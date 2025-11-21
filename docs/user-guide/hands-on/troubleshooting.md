# トラブルシューティングガイド

このガイドでは、Michiワークフローでよく発生する問題と解決策をまとめています。

## 📋 目次

- [セットアップ時の問題](#セットアップ時の問題)
- [GitHub関連の問題](#github関連の問題)
- [Confluence関連の問題](#confluence関連の問題)
- [JIRA関連の問題](#jira関連の問題)
- [phase:run実行時の問題](#phaserun実行時の問題)
- [AIコマンド実行時の問題](#aiコマンド実行時の問題)

## セットアップ時の問題

### 問題: npm install がエラーになる

**症状**:
```bash
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**原因**:
- npmキャッシュの問題
- 依存関係の競合
- Node.jsバージョンの不一致

**解決方法**:

```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

### 問題: setup-existingコマンドがエラーになる

**症状**:
```bash
Error: Templates directory not found
```

**原因**:
- Michiがグローバルインストールされていない
- テンプレートディレクトリが見つからない

**解決方法**:

```bash
# 方法1: NPMパッケージからグローバルインストール（推奨）
npm install -g @sk8metal/michi-cli

# 方法2: ローカルでビルド
cd /path/to/michi
npm install
npm run build
npm link
```

### 問題: .envファイルの権限エラー

**症状**:
```bash
Warning: .env file permissions are too open
```

**原因**:
- .envファイルの権限が600ではない

**解決方法**:

```bash
# 権限を600に設定（所有者のみ読み書き可能）
chmod 600 .env

# 確認
stat -f "%Lp %N" .env  # macOS
stat -c "%a %n" .env   # Linux
# 600 .env が表示されればOK
```

### 問題: Cursorでコマンドが認識されない

**症状**:
- `/kiro:spec-init` などのコマンドが認識されない
- コマンド補完が機能しない

**原因**:
- Cursorがコマンドファイルを読み込んでいない
- `.cursor/commands/` ディレクトリが存在しない

**解決方法**:

```bash
# コマンドディレクトリを確認
ls -la .cursor/commands/michi/

# ファイルが存在しない場合、setup-existingを再実行
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# Cursorを再起動
```

## GitHub関連の問題

### 問題: gh auth status がエラーになる

**症状**:
```bash
$ gh auth status
You are not logged into any GitHub hosts. Run gh auth login to authenticate.
```

**原因**:
- GitHub CLIが認証されていない

**解決方法**:

```bash
# GitHub CLIで認証
gh auth login

# 認証方法を選択:
# 1. GitHub.com
# 2. ブラウザで認証
# 3. トークンを貼り付け（推奨）

# 認証完了後、Git credential helperを設定（必須）
gh auth setup-git

# 確認
gh auth status
# ✓ Logged in to github.com
```

### 問題: GitHub Tokenが無効

**症状**:
```bash
Error: Bad credentials (HTTP 401)
```

**原因**:
- トークンが有効期限切れ
- トークンの権限が不足

**解決方法**:

```bash
# 新しいトークンを生成
# https://github.com/settings/tokens/new

# 必要な権限:
# - repo (Full control of private repositories)
# - workflow (Update GitHub Action workflows)
# - read:org (Read org and team membership)

# .envファイルを更新
vim .env
# GITHUB_TOKEN=ghp_new_token_here
```

### 問題: jj bookmark create がエラーになる

**症状**:
```bash
Error: Target revision is empty
```

**原因**:
- コミットしていない状態でブックマークを作成しようとした

**解決方法**:

```bash
# まずコミットする
jj commit -m "feat: 実装完了"

# その後、ブックマークを作成（必ず -r '@-' を使用）
jj bookmark create michi/feature/health-check-endpoint -r '@-'
```

## Confluence関連の問題

### 問題: Confluenceページが作成されない

**症状**:
```bash
Error: Failed to create Confluence page
```

**原因**:
- Atlassian認証情報が間違っている
- Confluenceスペースが存在しない
- API Tokenの権限が不足

**解決方法**:

**Step 1: 認証情報を確認**

```bash
# .envファイルを確認
cat .env | grep ATLASSIAN

# 必要な設定:
# ATLASSIAN_URL=https://your-domain.atlassian.net
# ATLASSIAN_EMAIL=your-email@company.com
# ATLASSIAN_API_TOKEN=your-token-here
```

**Step 2: REST APIで接続確認**

```bash
# Confluenceに接続できるか確認
curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
  $ATLASSIAN_URL/rest/api/content \
  | jq '.results[0].title'

# 成功すると、ページタイトルが表示される
```

**Step 3: Confluenceスペースを確認**

```bash
# スペースが存在するか確認
curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
  "$ATLASSIAN_URL/rest/api/space?spaceKey=$CONFLUENCE_PRD_SPACE" \
  | jq '.results[0].key'

# 存在しない場合は、.envを修正
vim .env
# CONFLUENCE_PRD_SPACE=正しいスペースキー
```

### 問題: Confluenceページが更新されない

**症状**:
- phase:runを実行してもページが更新されない
- 古い内容が表示される

**原因**:
- Confluenceのキャッシュ
- spec.jsonにPageIDが記録されていない

**解決方法**:

```bash
# spec.jsonを確認
cat .kiro/specs/health-check-endpoint/spec.json | jq '.confluence'

# PageIDが存在しない場合、phase:runを再実行
npx @sk8metal/michi-cli phase:run health-check-endpoint requirements

# Confluenceページを開き、ブラウザキャッシュをクリア
# Cmd+Shift+R (macOS) または Ctrl+Shift+R (Windows/Linux)
```

## JIRA関連の問題

### 問題: JIRA Epicが作成されない

**症状**:
```bash
Error: Failed to create JIRA Epic
```

**原因**:
- JIRAプロジェクトキーが間違っている
- JIRA Issue Type IDが間違っている
- API Tokenの権限が不足

**解決方法**:

**Step 1: JIRAプロジェクトキーを確認**

```bash
# .envファイルを確認
grep JIRA_PROJECT_KEYS .env
# JIRA_PROJECT_KEYS=DEMO

# JIRAで確認（ブラウザ）
open "https://your-domain.atlassian.net/jira/projects"
```

**Step 2: JIRA Issue Type IDを確認**

```bash
# REST APIで取得
curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
  $ATLASSIAN_URL/rest/api/3/issuetype \
  | jq '.[] | select(.name == "Story" or .name == "Subtask") | {name, id}'

# 出力例:
# {
#   "name": "Story",
#   "id": "10036"
# }
# {
#   "name": "Subtask",
#   "id": "10037"
# }

# .envを更新
vim .env
# JIRA_ISSUE_TYPE_STORY=10036
# JIRA_ISSUE_TYPE_SUBTASK=10037
```

**Step 3: JIRAに接続できるか確認**

```bash
# REST APIで確認
curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
  $ATLASSIAN_URL/rest/api/3/project/$JIRA_PROJECT_KEYS \
  | jq '.key'

# プロジェクトキーが表示されればOK
```

### 問題: JIRA Storyが一部しか作成されない

**症状**:
- Epicは作成されたがStoryが不足している
- 特定のフェーズのStoryだけ作成されない

**原因**:
- tasks.mdのフォーマットが正しくない
- フェーズヘッダーにラベルが含まれていない

**解決方法**:

**Step 1: tasks.mdのフォーマットを確認**

```bash
# フェーズヘッダーを確認
grep "^## Phase" .kiro/specs/health-check-endpoint/tasks.md
```

**正しい形式**:
```markdown
## Phase 0: 要件定義（Requirements）
## Phase 1: 設計（Design）
## Phase 2: 実装（Implementation）
## Phase 3: 試験（Testing）
## Phase 4: リリース準備（Release Preparation）
## Phase 5: リリース（Release）
```

**間違った形式（ラベルがない）**:
```markdown
## Phase 0: 要件定義
## Phase 1: 設計
```

**Step 2: tasks.mdを修正**

```bash
# ラベルを追加
vim .kiro/specs/health-check-endpoint/tasks.md

# 修正例:
# ## Phase 0: 要件定義（Requirements）
# ## Phase 1: 設計（Design）
```

**Step 3: phase:runを再実行**

```bash
npx @sk8metal/michi-cli phase:run health-check-endpoint tasks
```

### 問題: tasks.mdのフォーマットが間違っている（Format Validation Error）

**症状**:
```bash
❌ フォーマット検証失敗: tasks.md is missing required phases
```

または

```bash
JIRA Storyが0件作成される（Epic は作成されるがStoryは作成されない）
```

**原因**:
- tasks.mdがMichi 6-Phase構造ではない（AI-DLC形式など）
- 必須フェーズ（Phase 0-5）が不足している
- Storyヘッダーのフォーマットが不正
- AIが間違ったテンプレートを使用した

**症状の詳細**:

1. **フォーマット検証エラー**:
   ```bash
   tasks.md is missing required phases:
     - Phase 0: 要件定義（Requirements）
     - Phase 1: 設計（Design）
   ```

2. **AI-DLC形式検出エラー**:
   ```bash
   tasks.md appears to be in AI-DLC format instead of Michi 6-phase format.
   Detected "- [ ] 1." pattern without "Phase 0:" header.
   ```

3. **Storyヘッダーがない**:
   ```bash
   tasks.md does not contain valid Story headers.
   Expected format: "### Story X.Y: Title"
   ```

**解決方法**:

**Step 1: 現在のフォーマットを確認**

```bash
# フェーズヘッダーを確認
grep "^## Phase" .kiro/specs/health-check-endpoint/tasks.md

# 期待される出力（全6フェーズ）:
# ## Phase 0: 要件定義（Requirements）
# ## Phase 1: 設計（Design）
# ## Phase 2: 実装（Implementation）
# ## Phase 3: 試験（Testing）
# ## Phase 4: リリース準備（Release Preparation）
# ## Phase 5: リリース（Release）
```

**Step 2: 間違ったフォーマットの特定**

**間違い例1: AI-DLC形式（cc-sdd）**
```markdown
# Implementation Plan

## Task Breakdown

- [ ] 1. プロジェクトセットアップ
- [ ] 2. HealthControllerを実装
- [ ] 3. HealthServiceを実装
```

→ これは **Michiフォーマットではありません**。再生成が必要です。

**間違い例2: フェーズ不足**
```markdown
# tasks.md

## Phase 0: 要件定義（Requirements）
### Story 0.1: タイトル

## Phase 2: 実装（Implementation）
### Story 2.1: タイトル
```

→ Phase 1, 3, 4, 5 が不足しています。

**間違い例3: Storyヘッダーがない**
```markdown
# tasks.md

## Phase 0: 要件定義（Requirements）
- タスク1
- タスク2
```

→ `### Story X.Y:` 形式のヘッダーが必要です。

**Step 3: 正しいテンプレートを確認**

```bash
# Michiテンプレートを確認
cat .kiro/settings/templates/specs/tasks.md | head -50

# 期待される構造:
# - 全6フェーズ（Phase 0〜5）
# - 各フェーズに "## Phase X: 名前（ラベル）" ヘッダー
# - 各Storyに "### Story X.Y: タイトル" ヘッダー
# - 営業日ベーススケジュール
```

**Step 4: tasks.mdを再生成（推奨）**

**Cursor/VS Codeの場合**:
```
/kiro:spec-tasks health-check-endpoint
```

**Claude Codeの場合**:
```
/kiro:spec-tasks health-check-endpoint

要件定義からリリースまでの全6フェーズを含めてください。
営業日ベース（土日を除く）でスケジュールを作成してください。
```

**Step 5: 手動修正（非推奨）**

手動で修正する場合は、以下を確認：

1. **全6フェーズが存在**
   ```markdown
   ## Phase 0: 要件定義（Requirements）
   ## Phase 1: 設計（Design）
   ## Phase 2: 実装（Implementation）
   ## Phase 3: 試験（Testing）
   ## Phase 4: リリース準備（Release Preparation）
   ## Phase 5: リリース（Release）
   ```

2. **各フェーズにStoryがある**
   ```markdown
   ### Story 0.1: 要件定義書作成
   ### Story 1.1: 基本設計
   ### Story 2.1: プロジェクトセットアップ
   ### Story 3.1: 結合テスト
   ### Story 4.1: 本番環境構築
   ### Story 5.1: ステージング環境デプロイ
   ```

3. **営業日スケジュールを記載**
   ```markdown
   Day 1（月）: 要件定義開始
   Day 2（火）: 設計開始
   ```

**Step 6: フォーマット検証**

```bash
# phase:runを実行してフォーマット検証
npx @sk8metal/michi-cli phase:run health-check-endpoint tasks

# 期待される出力:
# 🔍 tasks.mdフォーマット検証中...
# ✅ tasks.mdフォーマット検証成功
```

**Step 7: JIRA同期確認**

```bash
# JIRAでEpicとStoryが作成されたか確認
gh pr view $JIRA_EPIC_KEY --web

# 期待される結果:
# - Epic: 1件作成
# - Story: 6〜20件作成（フェーズに応じて）
```

**予防策**:

1. **setup-existing実行時**:
   - 最新のMichiをインストール
   - テンプレートファイルが正しくコピーされたか確認
   ```bash
   ls -la .kiro/settings/templates/specs/tasks.md
   ls -la .kiro/settings/rules/tasks-generation.md
   ```

2. **AIコマンド実行時**:
   - 必ず `.kiro/settings/templates/specs/tasks.md` を参照するよう指示
   - 「全6フェーズを含める」ことを明示的に指示

3. **定期的な確認**:
   - `phase:run tasks` 実行前に `tasks.md` を目視確認
   - フェーズ数とStory数をカウント
   ```bash
   grep "^## Phase" .kiro/specs/*/tasks.md | wc -l  # 6が期待値
   grep "^### Story" .kiro/specs/*/tasks.md | wc -l  # 6以上が期待値
   ```

## phase:run実行時の問題

### 問題: "requirements.md not found" エラー

**症状**:
```bash
Error: requirements.md not found
```

**原因**:
- AIでファイルを生成していない
- ファイルパスが間違っている

**解決方法**:

```bash
# ファイルの存在を確認
ls -la .kiro/specs/health-check-endpoint/

# 存在しない場合、AIで生成
# Cursor/VS Code: /kiro:spec-requirements health-check-endpoint

# ファイルが生成されたか確認
cat .kiro/specs/health-check-endpoint/requirements.md
```

### 問題: "tasks.md structure invalid" エラー

**症状**:
```bash
Error: tasks.md structure invalid
Hint: All 6 phases are required
```

**原因**:
- tasks.mdに全6フェーズが含まれていない
- フェーズヘッダーの形式が間違っている

**解決方法**:

```bash
# フェーズ数を確認
grep "^## Phase" .kiro/specs/health-check-endpoint/tasks.md | wc -l
# 6 が表示されるべき

# すべてのフェーズを確認
grep "^## Phase" .kiro/specs/health-check-endpoint/tasks.md

# 不足しているフェーズを追加
vim .kiro/specs/health-check-endpoint/tasks.md
```

### 問題: バリデーションエラー

**症状**:
```bash
Error: Validation failed
```

**原因**:
- spec.jsonが更新されていない
- Confluence/JIRA情報が記録されていない

**解決方法**:

```bash
# spec.jsonを確認
cat .kiro/specs/health-check-endpoint/spec.json | jq

# 各フェーズのstatusを確認
# requirements: "completed"
# design: "completed"
# tasks: "completed"

# Confluence情報を確認
# confluence.requirementsPageId: "..."
# confluence.designPageId: "..."

# JIRA情報を確認
# jira.epicKey: "..."
# jira.stories: [...]

# 不足している場合、phase:runを再実行
npx @sk8metal/michi-cli phase:run health-check-endpoint requirements
npx @sk8metal/michi-cli phase:run health-check-endpoint design
npx @sk8metal/michi-cli phase:run health-check-endpoint tasks
```

## AIコマンド実行時の問題

### 問題: Cursor/VS CodeでAIコマンドが実行されない

**症状**:
- `/kiro:spec-init` などのコマンドが認識されない
- コマンド補完が機能しない

**原因**:
- コマンドファイルが存在しない
- Cursorが設定を読み込んでいない

**解決方法**:

```bash
# コマンドファイルを確認
ls -la .cursor/commands/

# 存在しない場合、setup-existingを再実行
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# Cursorを再起動
```

### 問題: Claude Codeでコマンドが実行されない

**症状**:
- コマンドが認識されない
- エラーメッセージが表示される

**原因**:
- ルールファイルが存在しない
- Claude Code設定が読み込まれていない

**解決方法**:

```bash
# ルールファイルを確認
ls -la .claude/rules/

# 存在しない場合、setup-existingを再実行
npx @sk8metal/michi-cli setup-existing --claude --lang ja

# Claude Code設定を再読み込み
claude config reload

# ルールが読み込まれているか確認
claude rules list
```

## その他の問題

### 問題: ファイルが見つからない

**症状**:
```bash
Error: ENOENT: no such file or directory
```

**原因**:
- ファイルパスが間違っている
- カレントディレクトリが間違っている

**解決方法**:

```bash
# カレントディレクトリを確認
pwd

# プロジェクトルートに移動
cd /path/to/your-project

# ファイル構造を確認
tree -L 3 .kiro
```

### 問題: 権限エラー

**症状**:
```bash
Error: EACCES: permission denied
```

**原因**:
- ファイル/ディレクトリの権限が不足

**解決方法**:

```bash
# 権限を確認
ls -la .kiro/

# 必要に応じて権限を変更
chmod -R u+w .kiro/

# ディレクトリの所有者を確認
stat -f "%Su" .kiro/  # macOS
stat -c "%U" .kiro/   # Linux
```

### 問題: ネットワークエラー

**症状**:
```bash
Error: ETIMEDOUT
Error: ECONNREFUSED
```

**原因**:
- ネットワーク接続の問題
- プロキシ設定の問題
- Atlassian/GitHubがダウンしている

**解決方法**:

```bash
# ネットワーク接続を確認
ping github.com
ping your-domain.atlassian.net

# プロキシ設定を確認
echo $HTTP_PROXY
echo $HTTPS_PROXY

# プロキシを設定（必要な場合）
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# npmプロキシ設定
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

## 🆘 それでも解決しない場合

上記の解決策で問題が解決しない場合は、以下をお試しください：

### 1. デバッグモードで実行

```bash
# 環境変数でデバッグを有効化
export DEBUG=michi:*

# コマンドを再実行
npx @sk8metal/michi-cli phase:run health-check-endpoint requirements
```

### 2. ログを確認

```bash
# npmログを確認
cat ~/.npm/_logs/*.log

# システムログを確認（macOS）
log show --predicate 'process == "node"' --last 1h

# システムログを確認（Linux）
journalctl -u node --since "1 hour ago"
```

### 3. GitHubイシューを作成

問題が解決しない場合は、GitHubイシューを作成してください：

https://github.com/sk8metalme/michi/issues/new

**イシュー作成時に含めるべき情報**:
- 実行したコマンド
- エラーメッセージ（全文）
- 環境情報（OS、Node.jsバージョン、npmバージョン）
- `spec.json`の内容
- `.env`の内容（認証情報は除く）

## 📚 関連ドキュメント

- [ワークフロー体験ガイド](./workflow-walkthrough.md)
- [検証チェックリスト](./verification-checklist.md)
- [セットアップガイド](../getting-started/setup.md)
- [クイックリファレンス](../reference/quick-reference.md)

