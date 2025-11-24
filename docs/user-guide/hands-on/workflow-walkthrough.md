# Michiワークフロー体験ガイド

このガイドでは、サンプル機能（`health-check-endpoint`）を使って、Michiの全ワークフローを実際に体験します。

## 🎯 このガイドの目的

- spec-init → requirements → design → tasks → 実装の流れを体験
- Confluence/JIRA自動連携の動作を確認
- phase:runコマンドの使い方を習得
- 実際のプロジェクトで使えるスキルを身につける

## 📋 前提条件

このガイドを開始する前に、環境別セットアップを完了してください：

- [Cursor IDEセットアップ](./cursor-setup.md)
- [Claude Codeセットアップ](./claude-setup.md)
- [Claude Subagentsセットアップ](./claude-agent-setup.md)

## 🚀 サンプル機能: health-check-endpoint

### 機能概要

アプリケーションの稼働状況を確認するHTTPエンドポイント

**エンドポイント**: `GET /health`

**レスポンス例**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### なぜこの機能を選んだか

- シンプルで理解しやすい
- 実装が少ない（検証が容易）
- 実際のプロジェクトでもよく使われる
- すべての開発フェーズを体験できる

## 📖 ワークフロー全体像

```
Phase 0.0: 初期化 (spec-init)
  ↓
Phase 0.1: 要件定義 (spec-requirements + phase:run)
  ↓ Confluence自動作成
  ↓
Phase 0.2: 設計 (spec-design + phase:run)
  ↓ Confluence自動作成
  ↓
Phase 0.3-0.4: テスト計画（テストタイプ選択 + テスト仕様書作成）
  ↓
Phase 0.5: タスク分割 (spec-tasks)
  ↓
Phase 0.6: タスクのJIRA同期 (phase:run tasks)
  ↓ JIRA Epic/Story自動作成
  ↓
Phase 1: 環境構築・基盤整備
  ↓ テスト環境セットアップ
  ↓
Phase 2: TDD実装 → Phase A (PR前テスト) → Phase 3 (追加QA) → Phase B (リリース前テスト) → Phase 4-5 (リリース準備・実行)
```

**注意**: このワークフローガイドでは、体験の便宜上、Phase 0.3-0.4（テスト計画）とPhase 1（環境構築）はスキップします。
詳細なテスト計画については [テスト計画フロー](../testing/test-planning-flow.md) を参照してください。

## ステップバイステップガイド

### Step 0: 環境セットアップの確認

このワークフローを開始する前に、Michiの環境セットアップが完了している必要があります。

#### 0-1: セットアップ状態の確認

```bash
# プロジェクトディレクトリに移動
cd /path/to/your-project

# .kiro/ディレクトリが存在するか確認
ls -la .kiro/
```

**✅ セットアップ完了済みの場合**:

以下のディレクトリ/ファイルが存在するはずです：

```
drwxr-xr-x  5 user  staff  160 Jan 15 10:00 .
drwxr-xr-x  10 user  staff  320 Jan 15 10:00 ..
-rw-r--r--  1 user  staff  512 Jan 15 10:00 project.json
drwxr-xr-x  3 user  staff   96 Jan 15 10:00 settings
drwxr-xr-x  4 user  staff  128 Jan 15 10:00 steering
drwxr-xr-x  2 user  staff   64 Jan 15 10:00 specs
```

確認項目：
- ✅ `.kiro/project.json` が存在
- ✅ `.kiro/settings/templates/` が存在
- ✅ `.kiro/steering/` が存在
- ✅ `.kiro/specs/` が存在（空でもOK）

→ **すべて存在する場合、Step 1に進んでください**

**❌ セットアップ未完了の場合**:

以下のエラーが表示されます：
```
ls: .kiro/: No such file or directory
```

または、一部のディレクトリ/ファイルが不足しています。

→ **以下の「0-2: セットアップ実行」を完了してください**

#### 0-2: セットアップ実行（未完了の場合のみ）

**重要**: セットアップを実行する前に、プロジェクトの基本構成を確認してください。

##### Git リポジトリの確認（推奨）

Michiは Git リポジトリでの使用を推奨していますが、必須ではありません。

```bash
# プロジェクトディレクトリに移動
cd /path/to/your-project

# Git リポジトリかどうか確認
ls -la .git

# .git ディレクトリがない場合は初期化（推奨）
git init
```

**注意**: Git リポジトリでない場合でも `setup-existing` は実行できますが、警告が表示されます。

##### セットアップの実行

環境別セットアップガイドに従ってセットアップを完了してください：

> **📦 パッケージ公開状況について**:
> 
> - **パッケージ公開後**: `npx @sk8metal/michi-cli` を使用
> - **パッケージ公開前（ローカルテスト）**: 以下の方法を使用
>   - 方法1（推奨）: `npm link` でグローバルリンクを作成後、`michi` コマンドを使用
>   - 方法2: `npx tsx /path/to/michi/src/cli.ts` で直接実行

**Cursor IDEの場合**:

```bash
# Step 1: cc-sdd導入
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイル追加

# パッケージ公開後:
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# パッケージ公開前（ローカルテスト）- 方法1（推奨）:
# 事前準備（一度だけ実行）:
#   cd /Users/arigatatsuya/Work/git/michi
#   npm link
# その後:
michi setup-existing --cursor --lang ja

# パッケージ公開前（ローカルテスト）- 方法2:
npx tsx /Users/arigatatsuya/Work/git/michi/src/cli.ts setup-existing --cursor --lang ja

# 対話的プロンプトで入力:
# - 環境: 1 (Cursor IDE)
# - プロジェクト名: サンプルプロジェクト（または任意の名前）
# - JIRAプロジェクトキー: DEMO（または任意のキー）

# Step 3: 環境変数設定
vim .env
# 最低限、以下を設定:
# GITHUB_TOKEN=your-token
# GITHUB_ORG=your-org
# GITHUB_REPO=your-org/your-repo
```

詳細: [Cursor IDEセットアップガイド](./cursor-setup.md)

**Claude Codeの場合**:

```bash
# Step 1: cc-sdd導入
npx cc-sdd@latest --claude --lang ja

# Step 2: Michi固有ファイル追加

# パッケージ公開後:
npx @sk8metal/michi-cli setup-existing --claude --lang ja

# パッケージ公開前（ローカルテスト）:
npx tsx /Users/arigatatsuya/Work/git/michi/src/cli.ts setup-existing --claude --lang ja

# または npm link 使用時:
michi setup-existing --claude --lang ja

# Step 3: 環境変数設定
vim .env
```

詳細: [Claude Codeセットアップガイド](./claude-setup.md)

**Claude Subagentsの場合**:

詳細: [Claude Subagentsセットアップガイド](./claude-agent-setup.md)

#### 0-3: セットアップ完了の確認

セットアップが完了したら、再度確認してください：

```bash
# .kiro/ディレクトリの確認
ls -la .kiro/

# 必要なファイルが存在することを確認
ls -la .kiro/project.json
ls -la .kiro/settings/templates/
ls -la .kiro/steering/
```

すべて存在することを確認したら、**Step 1**に進んでください。

### Step 1: 機能の初期化 (spec-init)

#### Cursor IDE / VS Codeの場合

Cursor/VS Codeで以下のコマンドを実行：

```
/kiro:spec-init ヘルスチェックエンドポイント。GET /health で稼働状況を返すAPI。
```

#### Claude Codeの場合

Claude Codeで以下のスラッシュコマンドを実行：

```
/kiro:spec-init ヘルスチェックエンドポイント。GET /health で稼働状況を返すAPI。
```

#### 実行結果の確認

```bash
# 生成されたディレクトリを確認
ls -la .kiro/specs/health-check-endpoint/

# 期待される結果:
# drwxr-xr-x  2 user  staff   64 Jan 15 10:00 .
# drwxr-xr-x  3 user  staff   96 Jan 15 10:00 ..
# -rw-r--r--  1 user  staff  512 Jan 15 10:00 spec.json
```

**spec.jsonの内容を確認**:

```bash
cat .kiro/specs/health-check-endpoint/spec.json
```

```json
{
  "feature": "health-check-endpoint",
  "status": "draft",
  "createdAt": "2025-01-15T10:00:00Z",
  "phases": {
    "requirements": "pending",
    "design": "pending",
    "tasks": "pending",
    "implementation": "pending"
  }
}
```

### Step 2: 要件定義の作成 (spec-requirements)

#### AIで requirements.md を生成

**Cursor IDE / VS Codeの場合**:

```
/kiro:spec-requirements health-check-endpoint
```

**Claude Codeの場合**:

```
/kiro:spec-requirements health-check-endpoint
```

#### 生成されたファイルの確認

```bash
# requirements.mdが生成されたか確認
ls -la .kiro/specs/health-check-endpoint/

cat .kiro/specs/health-check-endpoint/requirements.md
```

**期待される内容（例）**:

```markdown
# health-check-endpoint 要件定義

## ビジネス要件

- アプリケーションの稼働状況を監視する
- ヘルスチェックツールから定期的に呼び出される
- 障害発生時の早期検知に使用

## 機能要件

### FR-1: ヘルスチェックエンドポイント

- エンドポイント: GET /health
- レスポンス形式: JSON
- ステータスコード: 200 (正常), 503 (異常)

...
```

#### Confluenceに同期（phase:run）

**重要**: AIでファイルを生成しただけでは、Confluenceには同期されません。`phase:run`コマンドを実行する必要があります。

```bash
# requirements フェーズを実行（Confluence作成 + バリデーション）

# パッケージ公開後:
npx @sk8metal/michi-cli phase:run health-check-endpoint requirements

# パッケージ公開前（ローカルテスト）:
npx tsx /Users/arigatatsuya/Work/git/michi/src/cli.ts phase:run health-check-endpoint requirements

# または npm link 使用時:
michi phase:run health-check-endpoint requirements
```

**実行結果**:

```
🚀 Phase Runner: requirements
📁 Feature: health-check-endpoint

Step 1: Validating requirements.md exists...
   ✅ requirements.md found

Step 2: Creating Confluence page...
   ✅ Confluence page created
   📄 Page ID: 123456789
   🔗 URL: https://your-domain.atlassian.net/wiki/spaces/PRD/pages/123456789

Step 3: Updating spec.json...
   ✅ spec.json updated
   ✅ confluence.requirementsPageId: 123456789

Step 4: Validation complete
   ✅ All checks passed
```

#### 確認: Confluenceページを開く

ブラウザでConfluenceページを開いて確認：

```bash
# Confluenceページを開く
open "https://your-domain.atlassian.net/wiki/spaces/PRD/pages/123456789"
```

**期待される内容**:
- タイトル: `[DEMO] health-check-endpoint - 要件定義`
- ラベル: `project:xxx`, `feature:health-check-endpoint`, `phase:requirements`
- 本文: requirements.mdの内容がConfluence形式で表示される

### Step 3: 設計書の作成 (spec-design)

#### AIで design.md を生成

**Cursor IDE / VS Codeの場合**:

```
/kiro:spec-design health-check-endpoint
```

**Claude Codeの場合**:

```
/kiro:spec-design health-check-endpoint
```

#### 生成されたファイルの確認

```bash
cat .kiro/specs/health-check-endpoint/design.md
```

**期待される内容（例）**:

```markdown
# health-check-endpoint 設計書

## アーキテクチャ

### コンポーネント構成

```
Client → API Gateway → Health Controller → Health Service
```

## API設計

### GET /health

**リクエスト**: なし

**レスポンス**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

...
```

#### Confluenceに同期（phase:run）

```bash
# design フェーズを実行（Confluence作成 + バリデーション）

# パッケージ公開後:
npx @sk8metal/michi-cli phase:run health-check-endpoint design

# パッケージ公開前（ローカルテスト）:
npx tsx /Users/arigatatsuya/Work/git/michi/src/cli.ts phase:run health-check-endpoint design

# または npm link 使用時:
michi phase:run health-check-endpoint design
```

**実行結果**:

```
🚀 Phase Runner: design
📁 Feature: health-check-endpoint

Step 1: Validating design.md exists...
   ✅ design.md found

Step 2: Creating Confluence page...
   ✅ Confluence page created
   📄 Page ID: 123456790
   🔗 URL: https://your-domain.atlassian.net/wiki/spaces/PRD/pages/123456790

Step 3: Updating spec.json...
   ✅ spec.json updated
   ✅ confluence.designPageId: 123456790

Step 4: Validation complete
   ✅ All checks passed
```

### Step 4: タスク分割 (spec-tasks)

#### AIで tasks.md を生成（全6フェーズ）

**重要**: tasks.mdは、要件定義からリリースまでの**全6フェーズ**を含む必要があります。

**Cursor IDE / VS Codeの場合**:

```
/kiro:spec-tasks health-check-endpoint
```

**Claude Codeの場合**:

```
/kiro:spec-tasks health-check-endpoint
```

**重要**: 全6フェーズを含めるよう指示してください。

#### 生成されたファイルの確認

```bash
cat .kiro/specs/health-check-endpoint/tasks.md
```

**期待される構造**:

```markdown
# health-check-endpoint タスク分割

## Phase 0: 要件定義（Requirements）

### Story 0.1: 要件定義書作成
- タスク: requirements.mdを作成
- 見積もり: 2時間
- 担当: PL

## Phase 1: 設計（Design）

### Story 1.1: 基本設計
- タスク: design.mdを作成
- 見積もり: 4時間
- 担当: アーキテクト

## Phase 2: 実装（Implementation）

### Story 2.1: Health Controller実装
- タスク: HealthController.javaを実装
- 見積もり: 3時間
- 担当: 開発者

### Story 2.2: Health Service実装
- タスク: HealthService.javaを実装
- 見積もり: 2時間
- 担当: 開発者

## Phase 3: 試験（Testing）

### Story 3.1: 単体テスト
- タスク: HealthControllerTest.javaを実装
- 見積もり: 2時間
- 担当: テスター

### Story 3.2: 結合テスト
- タスク: Health APIの結合テスト
- 見積もり: 3時間
- 担当: テスター

## Phase 4: リリース準備（Release Preparation）

### Story 4.1: ドキュメント作成
- タスク: API仕様書を作成
- 見積もり: 1時間
- 担当: 開発者

## Phase 5: リリース（Release）

### Story 5.1: ステージングデプロイ
- タスク: ステージング環境にデプロイ
- 見積もり: 1時間
- 担当: SM

### Story 5.2: 本番リリース
- タスク: 本番環境にリリース
- 見積もり: 1時間
- 担当: SM
```

#### JIRAに同期（phase:run）

**重要**: これが最も重要なステップです。全6フェーズのJIRA Epic/Storyが自動作成されます。

```bash
# tasks フェーズを実行（JIRA Epic/Story作成 + バリデーション）

# パッケージ公開後:
npx @sk8metal/michi-cli phase:run health-check-endpoint tasks

# パッケージ公開前（ローカルテスト）:
npx tsx /Users/arigatatsuya/Work/git/michi/src/cli.ts phase:run health-check-endpoint tasks

# または npm link 使用時:
michi phase:run health-check-endpoint tasks
```

**実行結果**:

```
🚀 Phase Runner: tasks
📁 Feature: health-check-endpoint

Step 1: Validating tasks.md exists...
   ✅ tasks.md found

Step 2: Validating tasks.md structure...
   ✅ All 6 phases detected:
      - Phase 0: 要件定義（Requirements）
      - Phase 1: 設計（Design）
      - Phase 2: 実装（Implementation）
      - Phase 3: 試験（Testing）
      - Phase 4: リリース準備（Release Preparation）
      - Phase 5: リリース（Release）

Step 3: Creating JIRA Epic...
   ✅ Epic created: DEMO-100
   📋 Epic: [サンプルプロジェクト] health-check-endpoint

Step 4: Creating JIRA Stories...
   ✅ Story created: DEMO-101 (Phase 0: Story 0.1)
   ✅ Story created: DEMO-102 (Phase 1: Story 1.1)
   ✅ Story created: DEMO-103 (Phase 2: Story 2.1)
   ✅ Story created: DEMO-104 (Phase 2: Story 2.2)
   ✅ Story created: DEMO-105 (Phase 3: Story 3.1)
   ✅ Story created: DEMO-106 (Phase 3: Story 3.2)
   ✅ Story created: DEMO-107 (Phase 4: Story 4.1)
   ✅ Story created: DEMO-108 (Phase 5: Story 5.1)
   ✅ Story created: DEMO-109 (Phase 5: Story 5.2)

Step 5: Updating spec.json...
   ✅ spec.json updated
   ✅ jira.epicKey: DEMO-100
   ✅ jira.stories: [DEMO-101, ..., DEMO-109]

Step 6: Validation complete
   ✅ All checks passed
```

#### 確認: JIRAを開く

ブラウザでJIRAを開いて確認：

```bash
# JIRAのEpicを開く
open "https://your-domain.atlassian.net/browse/DEMO-100"
```

**期待される内容**:
- Epic: `[サンプルプロジェクト] health-check-endpoint`
- リンクされたStory: 9件（DEMO-101〜DEMO-109）
- 各Storyにラベル自動付与：
  - `Requirements`
  - `Design`
  - `Implementation`
  - `Testing`
  - `Release-Preparation`
  - `Release`

### Step 5: 生成物の確認

すべてのフェーズが完了したら、生成物を確認します。

#### ローカルファイルの確認

```bash
# 生成されたファイルを確認
ls -la .kiro/specs/health-check-endpoint/

# 期待される結果:
# -rw-r--r--  1 user  staff  2048 Jan 15 10:00 spec.json
# -rw-r--r--  1 user  staff  4096 Jan 15 10:10 requirements.md
# -rw-r--r--  1 user  staff  6144 Jan 15 10:20 design.md
# -rw-r--r--  1 user  staff  8192 Jan 15 10:30 tasks.md
```

#### spec.jsonの確認

```bash
cat .kiro/specs/health-check-endpoint/spec.json
```

**期待される内容**:

```json
{
  "feature": "health-check-endpoint",
  "status": "in_progress",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "phases": {
    "requirements": "completed",
    "design": "completed",
    "tasks": "completed",
    "implementation": "pending"
  },
  "confluence": {
    "requirementsPageId": "123456789",
    "designPageId": "123456790"
  },
  "jira": {
    "epicKey": "DEMO-100",
    "stories": [
      "DEMO-101",
      "DEMO-102",
      "DEMO-103",
      "DEMO-104",
      "DEMO-105",
      "DEMO-106",
      "DEMO-107",
      "DEMO-108",
      "DEMO-109"
    ]
  }
}
```

#### Confluenceページの確認

```bash
# 要件定義ページを開く
open "https://your-domain.atlassian.net/wiki/spaces/PRD/pages/123456789"

# 設計書ページを開く
open "https://your-domain.atlassian.net/wiki/spaces/PRD/pages/123456790"
```

#### JIRAの確認

```bash
# Epicを開く
open "https://your-domain.atlassian.net/browse/DEMO-100"

# 特定のStoryを開く
open "https://your-domain.atlassian.net/browse/DEMO-103"
```

### Step 6: 実装の準備

実装フェーズの準備をします。

#### GitHubブランチの作成

```bash
# 新しい作業を開始
jj new main

# 実装開始（AIコマンド）
# Cursor/VS Code:
# /kiro:spec-impl health-check-endpoint

# または手動でブランチ作成
jj commit -m "feat: health-check-endpoint の実装開始 [DEMO-103]"
jj bookmark create michi/feature/health-check-endpoint -r '@-'
```

#### 実装タスクの確認

```bash
# tasks.mdの実装フェーズを確認
grep -A 10 "Phase 2: 実装" .kiro/specs/health-check-endpoint/tasks.md
```

**期待される内容**:
```
## Phase 2: 実装（Implementation）

### Story 2.1: Health Controller実装
- タスク: HealthController.javaを実装
- 見積もり: 3時間
- 担当: 開発者
- JIRA: DEMO-103
```

#### TDDで実装

Michiは**TDD（テスト駆動開発）**を推奨しています：

```
# Cursor/VS Code:
/kiro:spec-impl health-check-endpoint

# AIがTDDで実装を進める:
# 1. テストを書く
# 2. コードを書く
# 3. リファクタリング
```

## ✅ 完了チェックリスト

すべてのステップが正常に完了したか確認してください：

### Phase 0.0: 初期化
- [ ] `.kiro/specs/health-check-endpoint/` ディレクトリが作成された
- [ ] `spec.json` が生成された

### Phase 0.1: 要件定義
- [ ] `requirements.md` が生成された
- [ ] Confluenceページが作成された（要件定義）
- [ ] `spec.json` に `confluence.requirementsPageId` が記録された

### Phase 0.2: 設計
- [ ] `design.md` が生成された
- [ ] Confluenceページが作成された（設計書）
- [ ] `spec.json` に `confluence.designPageId` が記録された

### Phase 0.3-0.4: テスト計画（このガイドではスキップ）
- このハンズオンでは省略していますが、実際のプロジェクトでは：
- [ ] テストタイプを選択（Phase 0.3）
- [ ] テスト仕様書を作成（Phase 0.4）

### Phase 0.5-0.6: タスク分割とJIRA同期
- [ ] `tasks.md` が生成された
- [ ] JIRA Epicが作成された
- [ ] JIRA Storyが作成された
- [ ] `spec.json` に `jira.epicKey` と `jira.stories` が記録された

### Phase 1: 環境構築（このガイドではスキップ）
- このハンズオンでは省略していますが、実際のプロジェクトでは：
- [ ] テスト環境をセットアップ
- [ ] テストデータを準備

### Phase 2: 実装準備
- [ ] GitHubブランチが作成された
- [ ] 実装タスクが明確になった

## 🎯 次のステップ

ハンズオン体験が完了したら、以下を試してください：

### 1. 実際のプロジェクトで適用

学んだワークフローを実際のプロジェクトで適用してください：

```bash
# 実際の機能で試す
/kiro:spec-init あなたの機能の説明
```

### 2. 検証チェックリスト

各ステップが正しく動作しているか確認：

- [検証チェックリスト](./verification-checklist.md)

### 3. トラブルシューティング

問題が発生した場合：

- [トラブルシューティングガイド](./troubleshooting.md)

### 4. 詳細なワークフローガイド

さらに詳しく学びたい場合：

- [ワークフローガイド](../guides/workflow.md)
- [フェーズ自動化ガイド](../guides/phase-automation.md)

## 🆘 よくある質問

### Q: phase:runはいつ実行すべきですか？

A: AIでMarkdownファイル（requirements.md、design.md、tasks.md）を生成した**直後**に実行してください。phase:runを実行しないと、Confluence/JIRAに同期されません。

### Q: Confluence/JIRAがない環境でも体験できますか？

A: はい。GitHubのみでもMichiの基本的なワークフローは体験できます。ただし、phase:runコマンドは実行できません。

### Q: tasks.mdに6フェーズすべて含める必要がありますか？

A: はい。phase:run tasksコマンドは、全6フェーズ（要件定義〜リリース）を期待しています。フェーズが不足している場合、バリデーションエラーになります。

### Q: JIRAのStoryが作成されません

A: 以下を確認してください：
- `.env`ファイルのJIRA認証情報
- `JIRA_ISSUE_TYPE_STORY` と `JIRA_ISSUE_TYPE_SUBTASK` の設定
- tasks.mdのフォーマット（Phase X: フェーズ名（ラベル）形式）

### Q: 間違えてphase:runを実行してしまいました

A: Confluence/JIRAページは更新されますが、削除はされません。手動で修正するか、再度phase:runを実行して上書きしてください。

## 📚 関連ドキュメント

- [検証チェックリスト](./verification-checklist.md)
- [トラブルシューティング](./troubleshooting.md)
- [ワークフローガイド](../guides/workflow.md)
- [クイックリファレンス](../reference/quick-reference.md)

おつかれさまでした！ Michiの全ワークフローを体験していただきました。🎉

