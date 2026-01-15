---
description: Multi-Repoプロジェクトの要件定義書をAI支援で生成
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <project-name>
---

# Multi-Repo 要件定義書生成

<background_information>
- **Mission**: Multi-Repoプロジェクトの包括的な要件定義書をEARS形式で生成
- **Success Criteria**:
  - 登録された全リポジトリの情報を反映
  - リポジトリ間の依存関係とインターフェースを明記
  - EARS形式の受入基準を含む
  - コンポーネント構成図（Mermaid）を含む
</background_information>

## 変数定義

- `{{MICHI_DIR}}` = `.michi/` （プロジェクト内）
  - プロジェクトメタデータ: `{{MICHI_DIR}}/multi-repo/pj/`
- `{{MICHI_GLOBAL_DIR}}` = `~/.michi/` （グローバル）
  - 共通設定: `{{MICHI_GLOBAL_DIR}}/settings/`
  - ルール: `{{MICHI_GLOBAL_DIR}}/settings/rules/`
  - テンプレート: `{{MICHI_GLOBAL_DIR}}/settings/templates/`

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の要件定義書を生成します。

## 実行手順

### Step 1: プロジェクト情報の取得
1. `.michi/multi-repo/pj/YYYYMMDD-$1/project.json` を読み込み、プロジェクト `$1` の情報を取得
2. プロジェクトが登録されていない場合は、`michi multi-repo:init` の実行を促す
3. 登録されたリポジトリ一覧を確認
4. リポジトリ数が0の場合は警告を出し、基本構造のみ生成

### Step 2: コンテキスト収集
1. **EARS形式ルール**: `{{MICHI_GLOBAL_DIR}}/settings/rules/ears-format.md` を読み込み
   - EARS形式（Event-Action-Response-System）の構文を理解
2. **既存要件テンプレート**: `templates/multi-repo/spec/requirements.md` を確認
3. **各リポジトリの情報収集**:
   - リポジトリ名、URL、ブランチ
   - 技術スタック（package.json、build.gradle、composer.json等から推測）
   - 主要機能（README.mdから抽出）
   - 注: ローカルクローンがない場合は、設定情報から推測

### Step 2.5: 要件の深堀り（/deep-dive スキル活用）

**IMPORTANT**: 要件定義書を生成する前に、`/deep-dive` スキルを利用して再帰的に深堀りを実施し、ユーザーと対話しながら以下を明確化してください：

1. **プロジェクトの目的と背景**:
   - なぜこのマルチリポ構成が必要なのか？
   - 解決しようとしている課題は何か？
   - ステークホルダーは誰か？

2. **システム要件の詳細化**:
   - 各コンポーネントの責務は明確か？
   - コンポーネント間のインターフェースは定義されているか？
   - 非機能要件（パフォーマンス、セキュリティ、スケーラビリティ）は？

3. **制約条件の確認**:
   - 技術的制約（既存システムとの統合、ライブラリ制限等）
   - ビジネス的制約（予算、スケジュール、リソース）
   - 組織的制約（承認プロセス、セキュリティポリシー）

推測を排除し、不明点は必ず質問してください。要件が十分に明確になってから次のステップに進みます。

### Step 3: 要件定義書生成
以下のセクションを含む要件定義書を生成します：

1. **プロジェクト概要**
   - 複数リポジトリを統合したシステムの概要
   - ビジネス価値

2. **コンポーネント構成**
   - 登録リポジトリ一覧（表形式）
   - コンポーネント間依存関係（Mermaidダイアグラム）
   - 各コンポーネントの役割説明

3. **インターフェース要件**
   - コンポーネント間API契約（エンドポイント一覧）
   - イベント契約（Pub/Sub、メッセージキュー等）
   - データフォーマット

4. **機能要件**
   - 各コンポーネントの機能要件をEARS形式で記述
   - コンポーネント横断的な機能要件（認証、ログ集約等）

5. **非機能要件**
   - パフォーマンス要件（レスポンスタイム、スループット）
   - セキュリティ要件（認証・認可、通信暗号化）
   - 可用性要件（SLA、冗長化）
   - 保守性要件（モニタリング、ログ）

### Step 4: ファイル保存
- 出力先: `docs/michi/YYYYMMDD-$1/spec/requirements.md`
- 既存ファイルがある場合は、上書き確認を実施
- ファイル保存後、完了メッセージを表示

### Step 5: メタデータ更新（project.json）

**project.json の役割**:
- マルチリポジトリプロジェクト全体の進行状況を追跡するメタデータファイル
- 各フェーズ（要件定義→設計→テスト計画→タスク分割→実装）の完了状態を管理
- 承認ワークフローの状態を記録（generated/approved）
- クロスリポジトリ整合性確認のための基準情報として利用

**更新手順**:
1. `.michi/multi-repo/pj/YYYYMMDD-$1/project.json` を読み込み
2. `phase` を `"requirements-generated"` に更新（現在のフェーズを記録）
3. `approvals.requirements.generated` を `true` に更新（要件定義書生成完了を記録）
4. `updated_at` を現在のISO 8601タイムスタンプに更新（最終更新日時を記録）
5. project.json を保存

**注意**: `project.json` は `.michi/multi-repo/pj/YYYYMMDD-$1/` に配置され、仕様書ドキュメント（`docs/michi/YYYYMMDD-$1/spec/`）とは別に管理されます。

## Multi-Repo固有セクション

**テンプレート参照**: 以下のセクションは `templates/multi-repo/spec/requirements.md` のMulti-Repo拡張部分に対応しています。

要件定義書に以下のセクションを必ず含めること：

```markdown
## コンポーネント構成

### 登録リポジトリ一覧

| コンポーネント名 | リポジトリURL | ブランチ | 役割 | 技術スタック |
|-----------|---------------|---------|------|-------------|
| frontend | https://github.com/org/frontend | main | ユーザーインターフェース | React, TypeScript |
| backend | https://github.com/org/backend | main | APIサーバー | Node.js, Express |

### コンポーネント間依存関係

\`\`\`mermaid
graph TB
    A[Frontend] -->|REST API| B[API Gateway]
    B -->|HTTP| C[Auth Service]
    B -->|HTTP| D[User Service]
    C -->|gRPC| E[Database]
    D -->|gRPC| E
\`\`\`

## インターフェース要件

### API契約

**Auth Service → User Service**
- エンドポイント: `POST /api/v1/auth/verify`
- プロトコル: HTTP/REST
- データ形式: JSON

### イベント契約

**User Service → Notification Service**
- イベント: `user.created`
- プロトコル: Kafka
- スキーマ: { userId, email, createdAt }
```

## 重要な制約
- EARS形式を厳守（When/If/While/Where/The system shall）
- コンポーネント名を明確にする（例: The Frontend Service shall...）
- 要件はテスト可能であること
- 実装詳細は含めない（WHAT、not HOW）

</instructions>

## ツールガイダンス
- **Read first**: プロジェクト設定、EARS形式ルール、テンプレートを読み込み
- **Write last**: 要件定義書を最後に保存
- **WebSearch/WebFetch**: 外部ドメイン知識が必要な場合のみ使用

## 出力説明
以下の情報を出力してください：

1. **生成された要件定義書のパス**: `docs/michi/{YYYYMMDD-project名}/spec/requirements.md`
2. **含まれるリポジトリ/コンポーネントの一覧**: コンポーネント名と役割の要約
3. **次のステップ**:
   - `/michi-multi-repo:create-design $1` で設計書を生成

**生成される要件定義書のテンプレート**:

`templates/multi-repo/spec/requirements.md` に基づき、以下のセクションを含む要件定義書を生成：

- プロジェクト情報（名前、作成日時）
- 概要とビジネス価値
- 対象ユーザー
- 主要機能
- 受入基準（EARS形式：Event-Action-Response-System）
- 技術的制約
- コンポーネント構成（リポジトリ一覧、依存関係図）
- インターフェース要件（API契約、イベント契約）
- 非機能要件（パフォーマンス、セキュリティ、可用性）

**ユーザーへの出力メッセージ形式**:

```markdown
## 要件定義書生成完了

### 出力ファイル
`docs/michi/{YYYYMMDD-project名}/spec/requirements.md`

### 含まれるコンポーネント
- **Frontend**: ユーザーインターフェース（React）
- **Backend**: APIサーバー（Node.js）
- **Database**: データ永続化（PostgreSQL）

### 次のステップ
1. 要件定義書を確認: `docs/michi/{YYYYMMDD-project名}/spec/requirements.md`
2. **要件定義書のレビュー**:
   - PRを作成し、ステークホルダーによるレビューを実施
   - フィードバックを反映して要件定義書を更新
   - 承認を得る
3. 要件定義レビューが完了したら、`/michi-multi-repo:create-design {project}` で設計書を生成
```

## 安全性とフォールバック

### エラーシナリオ
- **プロジェクト未登録**:
  ```
  エラー: プロジェクト '{project}' が見つかりません。

  次のコマンドでプロジェクトを初期化してください：
  michi multi-repo:init {project}
  ```

- **リポジトリ未登録**:
  ```
  警告: プロジェクト '{project}' にリポジトリが登録されていません。

  基本的な要件定義書の骨格を生成しますが、コンポーネント固有の情報は含まれません。

  次のコマンドでリポジトリを登録してください：
  michi multi-repo:add-repo {project} --name {name} --url {url} --branch {branch}
  ```

- **既存ファイル存在**:
  ```
  警告: 既存の要件定義書が存在します: `docs/michi/{YYYYMMDD-project名}/spec/requirements.md`

  上書きしてもよろしいですか？ (y/n)
  ```

- **EARS形式ルール未取得**:
  - `{{MICHI_GLOBAL_DIR}}/settings/rules/ears-format.md` が存在しない場合、基本的なEARS形式を使用
  - 警告メッセージを表示

### フォールバック戦略
- ローカルクローンがないリポジトリ: 設定情報（名前、URL）のみから推測
- 技術スタック不明: "未指定" として記載
- 依存関係不明: 基本的なクライアント-サーバー構成を仮定

think hard
