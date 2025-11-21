# AI開発ワークフローガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

このガイドでは、Michiを使用したAI駆動開発フローの全体像を説明します。

## ワークフロー全体像

```
1. 要件定義 (/kiro:spec-requirements)
   ↓ GitHub → Confluence同期
   ↓ 企画・部長が承認
   
2. 設計 (/kiro:spec-design)
   ↓ GitHub → Confluence同期
   ↓ 見積もり生成 → Excel出力
   ↓ アーキテクト・部長が承認
   
3. タスク分割 (/kiro:spec-tasks)
   ↓ GitHub → JIRA連携
   ↓ Epic/Story/Subtask自動作成
   
4. 実装 (/kiro:spec-impl)
   ↓ TDD（テスト → コード → リファクタリング）
   ↓ GitHub PR作成
   ↓ JIRA ステータス更新
   
5. テスト
   ↓ テストレポート生成
   ↓ Confluence同期
   
6. リリース準備 (/kiro:release-prep)
   ↓ リリースノート生成
   ↓ JIRA Release作成
   ↓ GitHub Release作成
```

## フェーズ別詳細

### Phase 1: 要件定義

#### Step 1: 仕様の初期化

Cursorで実行：
```bash
# 凡例
/kiro:spec-init <機能説明>

# 具体例
/kiro:spec-init ユーザー認証機能を実装したい。OAuth 2.0とJWTを使用。
```

AIが `.kiro/specs/<feature>/` ディレクトリを作成します。

#### Step 2: 要件定義の生成

```bash
# 凡例
/kiro:spec-requirements <feature>

# 具体例
/kiro:spec-requirements user-auth
```

AIが以下を生成：
- `.kiro/specs/<feature>/requirements.md`
- ビジネス要件、機能要件、非機能要件、リスク

#### Step 3: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> 要件定義追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 要件定義追加"
jj git push
```

#### Step 4: Confluenceに同期

Cursorで実行：
```bash
# 凡例
/kiro:confluence-sync <feature> requirements

# 具体例
/kiro:confluence-sync user-auth requirements
```

または：
```bash
# 凡例
npm run confluence:sync <feature> requirements

# 具体例
npm run confluence:sync user-auth requirements
```

AIが自動的に：
- Confluenceページ作成
- プロジェクト情報付与
- 企画・部長にメンション通知

#### Step 5: 承認待ち

企画・部長がConfluenceで：
- 要件をレビュー
- コメントでフィードバック
- Page Propertiesで承認

### Phase 2: 設計

#### Step 1: 設計書の生成

```bash
# 凡例
/kiro:spec-design <feature>

# 具体例
/kiro:spec-design user-auth
```

AIが以下を生成：
- アーキテクチャ図
- API設計
- データベース設計
- 見積もり

#### Step 2: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> 設計追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 設計追加"
jj git push
```

#### Step 3: Confluenceに同期 + 見積もり出力

```bash
# 凡例
npm run confluence:sync <feature> design
npm run excel:sync <feature>

# 具体例
npm run confluence:sync user-auth design
npm run excel:sync user-auth
```

見積もりExcelファイルが `estimates/<feature>-estimate.xlsx` に出力されます。

#### Step 4: 承認待ち

アーキテクト・部長がレビュー・承認

### Phase 3: タスク分割

#### Step 1: タスク生成

```bash
# 凡例
/kiro:spec-tasks <feature>

# 具体例
/kiro:spec-tasks user-auth
```

AIが実装タスクをストーリーに分割します。

#### Step 2: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> タスク分割追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 タスク分割追加"
jj git push
```

#### Step 3: JIRAに同期

```bash
# 凡例
npm run jira:sync <feature>

# 具体例
npm run jira:sync user-auth
```

自動的に：
- Epic作成: `[<project-name>] <feature>`
- Story作成: 各実装タスク
- Subtask作成: テスト、レビュータスク

### Phase 4: 実装

#### Step 1: TDD実装

```bash
# 凡例
/kiro:spec-impl <feature> <tasks>

# 具体例
/kiro:spec-impl user-auth FE-1,BE-1
```

AIがTDD（テスト駆動開発）で実装：
1. テストを書く
2. コードを書く
3. リファクタリング

#### Step 2: コミット

```bash
# 凡例
jj commit -m "feat: <feature> 実装 [JIRA-XXX]"
jj bookmark create <project-id>/feature/<feature> -r '@-'
jj git push --bookmark <project-id>/feature/<feature> --allow-new

# 具体例
jj commit -m "feat: ユーザー認証実装 [MICHI-123]"
jj bookmark create michi/feature/user-auth -r '@-'
jj git push --bookmark michi/feature/user-auth --allow-new
```

#### Step 3: PR作成

```bash
# 凡例
npm run github:create-pr <project-id>/feature/<feature> "[JIRA-XXX] <タイトル>"

# 具体例
npm run github:create-pr michi/feature/user-auth "[MICHI-123] ユーザー認証実装"
```

または手動で：
```bash
# 凡例
gh pr create --head <project-id>/feature/<feature> --base main \
  --title "[JIRA-XXX] <タイトル>" \
  --body "<説明>"

# 具体例
gh pr create --head michi/feature/user-auth --base main \
  --title "[MICHI-123] ユーザー認証実装" \
  --body "実装内容..."
```

### Phase 5-6: テスト・リリース

テストレポート生成とリリース準備は、同様のフローで実行します。

## 統合ワークフロー実行

すべてのフェーズを自動実行：

```bash
# 凡例
npm run workflow:run -- --feature <feature>

# 具体例
npm run workflow:run -- --feature user-auth
```

承認ゲートで一時停止し、承認後に次のフェーズに進みます。

### 承認ゲートの設定

ワークフロー実行時の承認ゲートで使用するロール名は、環境変数で設定できます。

#### 環境変数設定

`.env` ファイルに以下を追加：

```bash
# 要件定義フェーズの承認者
APPROVAL_GATES_REQUIREMENTS=pm,director

# 設計フェーズの承認者
APPROVAL_GATES_DESIGN=architect,director

# リリースフェーズの承認者
APPROVAL_GATES_RELEASE=sm,director
```

#### 設定例

**デフォルト（英語ロール名）:**
```bash
APPROVAL_GATES_REQUIREMENTS=pm,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=sm,director
```

**日本語ロール名:**
```bash
APPROVAL_GATES_REQUIREMENTS=企画,部長
APPROVAL_GATES_DESIGN=アーキテクト,部長
APPROVAL_GATES_RELEASE=SM,部長
```

**カスタムロール名:**
```bash
APPROVAL_GATES_REQUIREMENTS=product-manager,cto,legal
APPROVAL_GATES_DESIGN=tech-lead,architect,security
APPROVAL_GATES_RELEASE=release-manager,qa-lead,director
```

詳細は [セットアップガイド](./setup.md#4-3-ワークフロー承認ゲートの設定オプション) を参照してください。

## ベストプラクティス

1. **小さく始める**: 最初は1フェーズずつ手動実行
2. **承認を待つ**: 各フェーズで承認を取ってから次へ
3. **GitHubを真実の源に**: 編集は常にGitHubで
4. **定期的な同期**: GitHub更新後は必ずConfluence/JIRA同期
5. **プロジェクトメタデータの維持**: `.kiro/project.json` を最新に保つ

## トラブルシューティング

### Confluence同期エラー
- `.env` の認証情報を確認
- Confluenceスペースが存在するか確認
- Markdownファイルが存在するか確認

### JIRA同期エラー
- JIRAプロジェクトキーが正しいか確認
- Epic/Storyの作成権限があるか確認

### PR作成エラー
- GitHub認証を確認: `gh auth status`
- ブランチが存在するか確認: `jj bookmark list`

