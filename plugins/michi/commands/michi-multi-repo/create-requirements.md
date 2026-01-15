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
  - サービス構成図（Mermaid）を含む
</background_information>

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の要件定義書を生成します。

## 実行手順

### Step 1: プロジェクト情報の取得
1. `.michi/config.json` を読み込み、プロジェクト `$1` の情報を取得
2. プロジェクトが登録されていない場合は、`michi multi-repo:init` の実行を促す
3. 登録されたリポジトリ一覧を確認
4. リポジトリ数が0の場合は警告を出し、基本構造のみ生成

### Step 2: コンテキスト収集
1. **EARS形式ルール**: `.michi/settings/rules/ears-format.md` を読み込み
   - EARS形式（Event-Action-Response-System）の構文を理解
2. **既存要件テンプレート**: `templates/multi-repo/overview/requirements.md` を確認
3. **各リポジトリの情報収集**:
   - リポジトリ名、URL、ブランチ
   - 技術スタック（package.json、build.gradle、composer.json等から推測）
   - 主要機能（README.mdから抽出）
   - 注: ローカルクローンがない場合は、設定情報から推測

### Step 3: 要件定義書生成
以下のセクションを含む要件定義書を生成します：

1. **プロジェクト概要**
   - 複数リポジトリを統合したシステムの概要
   - ビジネス価値

2. **サービス構成**
   - 登録リポジトリ一覧（表形式）
   - サービス間依存関係（Mermaidダイアグラム）
   - 各サービスの役割説明

3. **インターフェース要件**
   - サービス間API契約（エンドポイント一覧）
   - イベント契約（Pub/Sub、メッセージキュー等）
   - データフォーマット

4. **機能要件**
   - 各サービスの機能要件をEARS形式で記述
   - サービス横断的な機能要件（認証、ログ集約等）

5. **非機能要件**
   - パフォーマンス要件（レスポンスタイム、スループット）
   - セキュリティ要件（認証・認可、通信暗号化）
   - 可用性要件（SLA、冗長化）
   - 保守性要件（モニタリング、ログ）

### Step 4: ファイル保存
- 出力先: `docs/michi/$1/overview/requirements.md`
- 既存ファイルがある場合は、上書き確認を実施
- ファイル保存後、完了メッセージを表示

### Step 5: メタデータ更新（spec.json）
- `docs/michi/$1/spec.json` を読み込み
- phase を `"requirements-generated"` に更新
- `approvals.requirements.generated` を `true` に更新
- `updated_at` を現在のISO 8601タイムスタンプに更新
- spec.json を保存

## Multi-Repo固有セクション
要件定義書に以下のセクションを必ず含めること：

```markdown
## サービス構成

### 登録リポジトリ一覧

| サービス名 | リポジトリURL | ブランチ | 役割 | 技術スタック |
|-----------|---------------|---------|------|-------------|
| frontend | https://github.com/org/frontend | main | ユーザーインターフェース | React, TypeScript |
| backend | https://github.com/org/backend | main | APIサーバー | Node.js, Express |

### サービス間依存関係

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
- サービス名を明確にする（例: The Frontend Service shall...）
- 要件はテスト可能であること
- 実装詳細は含めない（WHAT、not HOW）

</instructions>

## ツールガイダンス
- **Read first**: プロジェクト設定、EARS形式ルール、テンプレートを読み込み
- **Write last**: 要件定義書を最後に保存
- **WebSearch/WebFetch**: 外部ドメイン知識が必要な場合のみ使用

## 出力説明
以下の情報を出力してください：

1. **生成された要件定義書のパス**: `docs/michi/{project}/overview/requirements.md`
2. **含まれるリポジトリ/サービスの一覧**: サービス名と役割の要約
3. **次のステップ**:
   - `/michi-multi-repo:create-design $1` で設計書を生成

**出力形式**:
```markdown
## 要件定義書生成完了

### 出力ファイル
`docs/michi/{project}/overview/requirements.md`

### 含まれるサービス
- **Frontend**: ユーザーインターフェース（React）
- **Backend**: APIサーバー（Node.js）
- **Database**: データ永続化（PostgreSQL）

### 次のステップ
1. 要件定義書を確認: `docs/michi/{project}/overview/requirements.md`
2. 設計書を生成: `/michi-multi-repo:create-design {project}`
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

  基本的な要件定義書の骨格を生成しますが、サービス固有の情報は含まれません。

  次のコマンドでリポジトリを登録してください：
  michi multi-repo:add-repo {project} --name {name} --url {url} --branch {branch}
  ```

- **既存ファイル存在**:
  ```
  警告: 既存の要件定義書が存在します: `docs/michi/{project}/overview/requirements.md`

  上書きしてもよろしいですか？ (y/n)
  ```

- **EARS形式ルール未取得**:
  - `.michi/settings/rules/ears-format.md` が存在しない場合、基本的なEARS形式を使用
  - 警告メッセージを表示

### フォールバック戦略
- ローカルクローンがないリポジトリ: 設定情報（名前、URL）のみから推測
- 技術スタック不明: "未指定" として記載
- 依存関係不明: 基本的なクライアント-サーバー構成を仮定

think hard
