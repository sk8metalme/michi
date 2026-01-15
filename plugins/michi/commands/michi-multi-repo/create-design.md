---
description: Multi-Repoプロジェクトの設計書をAI支援で生成
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <project-name> [-y]
---

# Multi-Repo 設計書生成

<background_information>
- **Mission**: Multi-Repoプロジェクトの包括的な技術設計書を生成
- **Success Criteria**:
  - 全コンポーネントのアーキテクチャを統合
  - サービス間通信の設計を明確化
  - 各コンポーネントの技術スタックを反映
  - C4モデルに基づいた視覚的な設計図を含む
</background_information>

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の技術設計書を生成します。

## 実行手順

### Step 1: コンテキスト読み込み
1. `.michi/config.json` からプロジェクト情報取得
   - 登録リポジトリ一覧
2. `docs/michi/$1/overview/requirements.md` から要件読み込み
   - 要件定義書が存在しない場合は、先に `/michi-multi-repo:create-requirements $1` の実行を促す
3. `.michi/settings/rules/design-principles.md` から設計原則取得（存在する場合）
4. `.michi/settings/templates/specs/design.md` から構造参照（存在する場合）

### Step 2: 発見と分析

**Multi-Repo固有の分析**:

1. **各リポジトリの技術スタック調査**
   - package.json / build.gradle / composer.json / requirements.txt
   - 使用フレームワーク、ライブラリバージョン
   - 依存関係の分析

2. **サービス間通信パターンの特定**
   - REST API / GraphQL / gRPC
   - メッセージキュー / イベントバス（Kafka、RabbitMQ等）
   - 同期通信 vs 非同期通信

3. **共有コンポーネントの識別**
   - 共通ライブラリ
   - 共有データモデル
   - 共通インフラストラクチャ（ログ、監視、認証等）

4. **データフローの分析**
   - サービス間のデータ連携
   - データの永続化方式
   - キャッシュ戦略

### Step 3: 設計書生成

以下のセクションを含む設計書を生成します：

1. **システム全体図**
   - C4モデル - システムコンテキスト図（Mermaid）
   - 全コンポーネントの配置とフロー
   - 外部システムとの連携

2. **リポジトリ横断アーキテクチャ**
   - マイクロコンポーネント構成図（C4モデル推奨）
   - サービス間API契約定義
   - イベントスキーマ定義
   - データフロー図

3. **各コンポーネントの設計**
   - コンポーネント図
   - インターフェース定義
   - データモデル
   - 主要クラス/モジュール構造

4. **セキュリティ設計**
   - 認証・認可の連携（OAuth2、JWT等）
   - 通信暗号化（TLS、mTLS）
   - シークレット管理

5. **デプロイメントアーキテクチャ**
   - インフラストラクチャ構成（Kubernetes、Docker等）
   - ネットワーク設計
   - スケーリング戦略

6. **データモデル**
   - リポジトリ横断のデータフロー
   - データベーススキーマ（サービスごと）
   - データ整合性の保証方法

### Step 4: ファイル保存
- 出力先: `docs/michi/$1/overview/architecture.md`
- 既存ファイルがある場合は、上書き確認（`-y` フラグで自動承認）

### Step 4.5: 品質検証（PROACTIVE）

**architecture.md生成後、以下の検証を自動実行**:

#### 4.5.1 Mermaid図の構文検証

architecture.mdにMermaid図が含まれる場合、構文検証を実行:

```
IMPORTANT: architecture.mdにMermaid図が含まれる場合、以下の検証を実行してください。
- 検出: Mermaid図を含むかどうかを確認
- 検証: 構文エラーを検出（```mermaid ブロックの整合性確認）
- 修正: 自動修正可能なエラーを修正（不正な矢印記法、インデント等）
- 報告: 修正内容をユーザーに通知
```

**実行タイミング**: architecture.md保存直後

**検証手順**:
1. architecture.mdから```mermaidブロックを抽出
2. 基本的な構文チェック（開始/終了タグの整合性、基本記法の確認）
3. エラーがあれば修正提案をユーザーに提示

#### 4.5.2 技術スタックバージョン監査

`stable-version-auditor` エージェントを使用して技術スタックを監査:

```
IMPORTANT: architecture.mdに技術スタック（Node.js、Java、Python、PHP等）が記載されている場合、
stable-version-auditorエージェントを自動実行してください。
- 検出: バージョン指定を抽出
- 監査: EOLリスクを評価
- 推奨: 最新LTS/安定版を提案
- 報告: アップグレード推奨をユーザーに通知
```

**実行タイミング**: architecture.md保存直後

**エージェント呼び出し**:
```
Task(subagent_type='stable-version-auditor', prompt='docs/michi/$1/overview/architecture.md に記載された技術スタックのバージョンを監査し、EOLリスクを評価してください')
```

### Step 5: メタデータ更新（spec.json）
- `docs/michi/$1/spec.json` を読み込み
- phase を `"design-generated"` に更新
- `approvals.design.generated` を `true` に更新
- `updated_at` を現在のISO 8601タイムスタンプに更新
- spec.json を保存

## Multi-Repo固有セクション

設計書に以下のセクションを必ず含めること：

```markdown
## リポジトリ横断アーキテクチャ

### C4モデル - システムコンテキスト図

\`\`\`mermaid
C4Context
    title System Context Diagram

    Person(user, "User", "エンドユーザー")
    System(frontend, "Frontend Service", "Webアプリケーション")
    System(backend, "Backend Service", "APIサーバー")
    System_Ext(external_api, "External API", "外部サービス")

    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, backend, "API calls", "REST/HTTPS")
    Rel(backend, external_api, "Integrates", "REST/HTTPS")
\`\`\`

### サービス間通信

| 呼び出し元 | 呼び出し先 | 方式 | プロトコル | 用途 |
|-----------|-----------|------|-----------|------|
| Frontend | API Gateway | 同期 | REST/HTTPS | ユーザーリクエスト処理 |
| API Gateway | Auth Service | 同期 | gRPC | 認証・認可 |
| User Service | Notification Service | 非同期 | Kafka | ユーザー作成イベント通知 |

### 共有コンポーネント

**共通ライブラリ**:
- `@org/shared-types`: TypeScript型定義（全コンポーネントで共有）
- `@org/logger`: 統一ログライブラリ

**共通インフラ**:
- Elasticsearch: ログ集約
- Prometheus + Grafana: メトリクス監視
- Keycloak: 統合認証基盤

### デプロイメントアーキテクチャ

\`\`\`mermaid
graph TB
    subgraph "Production Kubernetes Cluster"
        LB[Load Balancer]
        FE1[Frontend Pod 1]
        FE2[Frontend Pod 2]
        BE1[Backend Pod 1]
        BE2[Backend Pod 2]
        DB[(PostgreSQL)]

        LB --> FE1
        LB --> FE2
        FE1 --> BE1
        FE2 --> BE2
        BE1 --> DB
        BE2 --> DB
    end
\`\`\`

### データフロー

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Gateway
    participant Auth Service
    participant User Service
    participant Database

    User->>Frontend: リクエスト
    Frontend->>API Gateway: API呼び出し
    API Gateway->>Auth Service: トークン検証
    Auth Service-->>API Gateway: 検証成功
    API Gateway->>User Service: ユーザー情報取得
    User Service->>Database: クエリ実行
    Database-->>User Service: データ返却
    User Service-->>API Gateway: レスポンス
    API Gateway-->>Frontend: レスポンス
    Frontend-->>User: 表示
\`\`\`
```

## 重要な制約
- 実装詳細ではなく、アーキテクチャ設計に焦点を当てる
- サービス間の境界とインターフェースを明確にする
- 技術選定の理由を記述する
- スケーラビリティとパフォーマンスを考慮
- セキュリティ要件を設計に反映

</instructions>

## ツールガイダンス
- **Read first**: プロジェクト設定、要件定義書、設計原則、テンプレートを読み込み
- **Glob/Grep**: 各リポジトリの技術スタック調査（ローカルクローンがある場合）
- **Write last**: 設計書を最後に保存
- **WebSearch/WebFetch**: 最新の設計パターンやベストプラクティスが必要な場合のみ使用

## 出力説明
以下の情報を出力してください：

1. **生成された設計書のパス**: `docs/michi/{YYYYMMDD-project名}/overview/architecture.md`
2. **分析したリポジトリの一覧**: コンポーネント名と技術スタックの要約
3. **品質検証結果**:
   - Mermaid図の検証結果
   - 技術スタックバージョン監査結果
4. **次のステップ**:
   - 設計書の確認
   - 各リポジトリでの個別実装

**生成される設計書のテンプレート**:

`templates/multi-repo/overview/architecture.md` に基づき、以下のセクションを含む設計書を生成：

- プロジェクト情報（名前、作成日時）
- システム構成図（Mermaid C4モデル）
- アーキテクチャパターン（マイクロコンポーネント構成）
- リポジトリ横断設計（通信方式、共有コンポーネント）
- 各コンポーネントの設計（コンポーネント図、インターフェース定義）
- セキュリティ設計（認証・認可、暗号化）
- デプロイメントアーキテクチャ（Kubernetes、ネットワーク）
- データモデル（リポジトリ横断データフロー、スキーマ）

**ユーザーへの出力メッセージ形式**:

```markdown
## 設計書生成完了

### 出力ファイル
`docs/michi/{YYYYMMDD-project名}/overview/architecture.md`

### 分析したコンポーネント
- **Frontend**: React + TypeScript（3リポジトリ依存）
- **Backend**: Node.js + Express（2リポジトリ依存）
- **Auth Service**: Go + gRPC（独立）

### アーキテクチャ概要
- **通信方式**: REST API（同期）、Kafka（非同期イベント）
- **データベース**: PostgreSQL（サービスごとにDB分離）
- **デプロイ**: Kubernetes（Pod自動スケーリング）

### 品質検証結果

#### Mermaid図検証
✅ 検証完了 - 構文エラーなし
または
⚠️ 2件の構文エラーを自動修正しました:
- L15: C4モデルのタイトル記法エラー → 修正済み
- L45: シーケンス図の矢印記法エラー → 修正済み

#### 技術スタックバージョン監査
✅ すべて最新LTS/安定版を使用
または
⚠️ バージョン更新を推奨:
- Node.js 16.x → 20.x (LTS) - EOL: 2023-09-11（EOL済み）
- Python 3.9 → 3.11 - EOL 6ヶ月以内

### 次のステップ
1. 設計書を確認: `docs/michi/{YYYYMMDD-project名}/overview/architecture.md`
2. 技術スタック更新（必要に応じて）
3. **テスト計画を作成**: `/michi-multi-repo:plan-tests {project}` でテスト戦略を策定
4. 各リポジトリで実装を開始:
   - `/michi:dev` で実装を開始
   - または直接実装を開始
```

## 安全性とフォールバック

### エラーシナリオ
- **要件定義書未作成**:
  ```
  エラー: 要件定義書が見つかりません: `docs/michi/{YYYYMMDD-project名}/overview/requirements.md`

  先に要件定義書を生成してください：
  /michi-multi-repo:create-requirements {project}
  ```

- **プロジェクト未登録**:
  ```
  エラー: プロジェクト '{project}' が見つかりません。

  次のコマンドでプロジェクトを初期化してください：
  michi multi-repo:init {project}
  ```

- **リポジトリアクセス不可**:
  ```
  警告: 一部のリポジトリのローカルクローンがありません。

  設定情報（URL、ブランチ）から推測して設計書を生成します。
  より詳細な設計が必要な場合は、リポジトリをクローンしてから再実行してください。
  ```

- **既存ファイル存在（`-y` フラグなし）**:
  ```
  警告: 既存の設計書が存在します: `docs/michi/{YYYYMMDD-project名}/overview/architecture.md`

  上書きしてもよろしいですか？ (y/n)
  または `-y` フラグを使用して自動承認できます。
  ```

### フォールバック戦略
- **設計原則ファイル不在**: 基本的な設計原則（SOLID、DRY等）を適用
- **技術スタック不明**: README や設定ファイルから推測、または "未指定" として記載
- **依存関係不明**: 基本的なクライアント-サーバー構成を仮定
- **テンプレート不在**: インラインで基本構造を使用

### 次のフェーズ: テスト計画

**設計書承認後**:
1. 設計書を確認: `docs/michi/{YYYYMMDD-project名}/overview/architecture.md`
2. **テスト計画を作成**: `/michi-multi-repo:plan-tests {project}` でテスト戦略を策定
3. **各リポジトリで個別実装**:
   - リポジトリごとに `/michi:dev` で実装を開始
   - またはタスクを分割してから実装
4. **CI/CD設定**: `michi multi-repo:ci-status {project}` でCI結果を監視

**修正が必要な場合**:
- フィードバックを提供し、`/michi-multi-repo:create-design $1` を再実行
- `-y` フラグで自動上書き可能
