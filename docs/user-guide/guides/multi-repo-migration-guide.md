# Multi-Repo機能 マイグレーションガイド

このガイドは、既存のMichiユーザーがMulti-Repo機能を導入する際の手順を説明します。

## 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [変更点](#変更点)
4. [マイグレーション手順](#マイグレーション手順)
5. [既存機能への影響](#既存機能への影響)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Multi-Repo機能は、Michiに**新しく追加された機能**です。既存のMichi機能に影響を与えず、追加のコマンド群として提供されます。

### 主な特徴

- **後方互換性**: 既存のMichiコマンドとワークフローに影響なし
- **オプトイン**: Multi-Repo機能を使用する場合のみ、設定を追加
- **自動マイグレーション**: 初回使用時に自動的に設定ファイルが拡張される

---

## 前提条件

Multi-Repo機能を使用するには、以下の環境が必要です。

### 必須要件

1. **Michiバージョン**: v1.0.0以上
   ```bash
   michi --version
   # @sk8metal/michi-cli v1.0.0
   ```

2. **Node.js**: v18.0.0以上
   ```bash
   node --version
   # v18.0.0 以上
   ```

### オプション要件（使用する機能に応じて）

#### Phase 2機能（CI結果集約）を使用する場合

- **GitHub Personal Access Token**: GitHub Actions APIへのアクセスに必要
  - 必要なスコープ: `repo`（privateリポジトリ）または `public_repo`（publicリポジトリのみ）、`workflow`

#### Phase 3機能（Confluence同期）を使用する場合

- **Atlassian認証情報**: Confluence REST APIへのアクセスに必要
  - Atlassian URL、Email、API Token

---

## 変更点

### 1. config.jsonスキーマの拡張

`.michi/config.json` に新しいフィールド `multiRepoProjects` が追加されます。

#### 変更前（v0.5.0）

```json
{
  "confluence": { ... },
  "jira": { ... },
  "workflow": { ... },
  "validation": { ... },
  "atlassian": { ... },
  "project": { ... }
}
```

#### 変更後（v1.0.0）

```json
{
  "confluence": { ... },
  "jira": { ... },
  "workflow": { ... },
  "validation": { ... },
  "atlassian": { ... },
  "project": { ... },
  "multiRepoProjects": []  // 新規追加
}
```

**重要**: `multiRepoProjects` フィールドが存在しない場合、Michiは自動的に空配列 `[]` として扱います。手動で追加する必要はありません。

### 2. 新規コマンドの追加

以下の6つのコマンドが追加されます：

| コマンド | Phase | 説明 |
|---------|-------|------|
| `michi multi-repo:init` | 1 (MVP) | プロジェクト初期化 |
| `michi multi-repo:add-repo` | 1 (MVP) | リポジトリ登録 |
| `michi multi-repo:list` | 1 (MVP) | プロジェクト一覧表示 |
| `michi multi-repo:ci-status` | 2 | CI結果集約 |
| `michi multi-repo:test` | 2 | テスト実行 |
| `michi multi-repo:confluence-sync` | 3 | Confluence同期 |

### 3. 環境変数の追加（オプション）

#### Phase 2機能を使用する場合

```bash
# GitHub Personal Access Token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Phase 3機能を使用する場合

```bash
# Atlassian認証情報（既存のMichiで使用している場合は設定済み）
export ATLASSIAN_URL="https://your-company.atlassian.net"
export ATLASSIAN_EMAIL="your-email@example.com"
export ATLASSIAN_API_TOKEN="your-api-token"
```

**注意**: 既存のMichiでConfluence機能を使用している場合、これらの環境変数は既に設定されているため、追加の設定は不要です。

---

## マイグレーション手順

### ステップ1: Michiをv1.0.0にアップグレード

```bash
npm install -g @sk8metal/michi-cli@latest
```

アップグレード後、バージョンを確認します。

```bash
michi --version
# @sk8metal/michi-cli v1.0.0
```

### ステップ2: 環境変数の設定（オプション）

#### Phase 2機能を使用する場合

GitHub Personal Access Tokenを取得し、環境変数に設定します。

**GitHub Personal Access Tokenの取得方法**:

1. GitHubにログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token (classic)" をクリック
4. 必要なスコープを選択:
   - `repo`: プライベートリポジトリへのアクセス（推奨）
   - `public_repo`: パブリックリポジトリのみへのアクセス
   - `workflow`: GitHub Actionsへのアクセス（必須）
5. トークンを生成してコピー

**環境変数の設定**:

```bash
# ~/.bashrc または ~/.zshrc に追加
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 変更を反映
source ~/.bashrc  # または source ~/.zshrc
```

#### Phase 3機能を使用する場合

既存のMichiでConfluence機能を使用している場合は、既に設定済みのため、この手順はスキップしてください。

新規にConfluence機能を使用する場合は、[Confluenceセットアップガイド](../getting-started/setup-guide.md#confluence設定)を参照してください。

### ステップ3: Multi-Repoプロジェクトの初期化

初めてMulti-Repo機能を使用する際に、自動的に `.michi/config.json` が拡張されます。

```bash
# プロジェクト初期化
michi multi-repo:init my-multi-repo-project \
  --jira MYPROJ \
  --confluence-space MYSPACE
```

**実行結果**:

```
✅ Multi-Repoプロジェクトの初期化が完了しました

プロジェクト情報:
  名前: my-multi-repo-project
  JIRAキー: MYPROJ
  Confluenceスペース: MYSPACE

作成されたディレクトリ:
  docs/michi/my-multi-repo-project/
  ├── overview/
  │   ├── requirements.md
  │   ├── architecture.md
  │   └── multi-repo.md
  ├── steering/
  ├── tests/
  └── docs/

設定ファイルを更新しました: .michi/config.json
```

### ステップ4: リポジトリの登録

Multi-Repoプロジェクトにリポジトリを登録します。

```bash
# リポジトリ登録
michi multi-repo:add-repo my-multi-repo-project \
  --name backend \
  --url https://github.com/your-org/backend \
  --branch main

michi multi-repo:add-repo my-multi-repo-project \
  --name frontend \
  --url https://github.com/your-org/frontend \
  --branch main
```

### ステップ5: 動作確認

プロジェクト一覧を表示して、正常に登録されたことを確認します。

```bash
michi multi-repo:list
```

**実行結果**:

```
========================================
Multi-Repo プロジェクト一覧
========================================

プロジェクト: my-multi-repo-project
  JIRAキー: MYPROJ
  Confluenceスペース: MYSPACE
  作成日時: 2025-12-17T10:00:00+09:00
  リポジトリ数: 2

  リポジトリ:
    1. backend
       URL: https://github.com/your-org/backend
       ブランチ: main

    2. frontend
       URL: https://github.com/your-org/frontend
       ブランチ: main

========================================
合計プロジェクト数: 1
========================================
```

---

## 既存機能への影響

### ✅ 影響なし

以下の既存Michi機能は、Multi-Repo機能の追加によって**影響を受けません**。

#### 1. Spec-Driven Developmentワークフロー

```bash
# 既存のワークフローは変更なし
/kiro:spec-init "feature-name"
/kiro:spec-requirements feature-name
/kiro:spec-design feature-name
/kiro:spec-tasks feature-name
/kiro:spec-impl feature-name
```

#### 2. Confluence/JIRA統合

```bash
# 既存のConfluence/JIRAコマンドは変更なし
michi confluence:sync
michi jira:sync
```

#### 3. 設定管理

```bash
# 既存の設定コマンドは変更なし
michi config:validate
michi migrate
```

#### 4. .michi/config.json

既存の設定フィールド（`confluence`, `jira`, `workflow`, `validation`, `atlassian`, `project`）は変更されません。`multiRepoProjects` フィールドが追加されるのみです。

### ⚠️ 注意事項

#### 1. ディレクトリ構造

Multi-Repo機能は `docs/michi/{project-name}/` ディレクトリを使用します。既存のMichi機能と同じディレクトリ構造ですが、プロジェクト名が異なる場合は別のディレクトリが作成されます。

**例**:

```
docs/
├── michi/
│   ├── my-feature/              # 既存のSpec-Driven Development用
│   │   ├── overview/
│   │   ├── steering/
│   │   └── ...
│   └── my-multi-repo-project/   # Multi-Repo用（新規）
│       ├── overview/
│       ├── steering/
│       └── ...
```

#### 2. Confluence階層構造

Multi-Repo機能でConfluence同期を使用する場合、以下の階層構造が作成されます。

```
Confluenceスペース (例: MYSPACE)
└── my-multi-repo-project (親ページ)
    ├── my-multi-repo-project - Requirements
    ├── my-multi-repo-project - Architecture
    ├── my-multi-repo-project - Sequence Diagrams
    └── my-multi-repo-project - Test Strategy
```

既存のConfluenceページとは別の階層構造となるため、影響はありません。

---

## トラブルシューティング

### 問題1: `GITHUB_TOKEN` が設定されていないエラー

**エラーメッセージ**:

```
❌ エラー: GITHUB_TOKENが設定されていません
```

**原因**: Phase 2機能（`multi-repo:ci-status`）を使用する際に、GitHub Personal Access Tokenが環境変数に設定されていない。

**解決方法**:

1. GitHub Personal Access Tokenを取得（[ステップ2](#ステップ2-環境変数の設定オプション)参照）
2. 環境変数を設定

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

3. 設定を永続化（`~/.bashrc` または `~/.zshrc` に追加）

### 問題2: Confluence認証エラー

**エラーメッセージ**:

```
❌ エラー: Missing Confluence credentials in .env file
```

**原因**: Phase 3機能（`multi-repo:confluence-sync`）を使用する際に、Atlassian認証情報が環境変数に設定されていない。

**解決方法**:

1. Atlassian API Tokenを取得（[Confluenceセットアップガイド](../getting-started/setup-guide.md#confluence設定)参照）
2. 環境変数を設定

```bash
export ATLASSIAN_URL="https://your-company.atlassian.net"
export ATLASSIAN_EMAIL="your-email@example.com"
export ATLASSIAN_API_TOKEN="your-api-token"
```

3. 設定を永続化（`~/.bashrc` または `~/.zshrc` に追加）

### 問題3: プロジェクト名にパス区切り文字が含まれているエラー

**エラーメッセージ**:

```
❌ エラー: Project name must not contain path traversal characters (/, \), relative path components (., ..), or control characters
```

**原因**: セキュリティ対策として、プロジェクト名にパス区切り文字（`/`, `\`）、相対パス（`.`, `..`）、制御文字が禁止されています。

**解決方法**:

プロジェクト名を変更して、以下の文字を含まないようにしてください。

- パス区切り文字: `/`, `\`
- 相対パス: `.`, `..`
- 制御文字: `\x00`-`\x1F`, `\x7F`

**例**:

```bash
# ❌ 不正な例
michi multi-repo:init my/project  # スラッシュを含む
michi multi-repo:init ../project  # 相対パスを含む

# ✅ 正しい例
michi multi-repo:init my-project
michi multi-repo:init my_project
michi multi-repo:init myproject
```

### 問題4: リポジトリURLが無効

**エラーメッセージ**:

```
❌ エラー: Repository URL must be in GitHub format: https://github.com/{owner}/{repo}
```

**原因**: セキュリティ対策として、GitHub HTTPS URLのみが許可されています。

**解決方法**:

リポジトリURLを以下の形式に変更してください。

```
https://github.com/{owner}/{repo}
```

**例**:

```bash
# ❌ 不正な例
--url git@github.com:your-org/repo.git  # SSH URL
--url https://github.com/your-org/repo.git  # .git拡張子を含む
--url http://github.com/your-org/repo  # HTTP (非セキュア)

# ✅ 正しい例
--url https://github.com/your-org/repo
```

### 問題5: GitHub API レート制限エラー

**エラーメッセージ**:

```
⚠️ 警告: GitHub API rate limit exceeded. Retrying after X seconds...
```

**原因**: GitHub API呼び出しがレート制限（5,000リクエスト/時間）に達した。

**解決方法**:

Michiは自動的にExponential Backoffで再試行します。以下の対策を検討してください。

1. **待機**: 自動再試行が完了するまで待つ（最大3回再試行）
2. **キャッシング活用**: CI結果は15分間キャッシュされるため、頻繁な実行を避ける
3. **GitHub Enterprise**: より高いレート制限が必要な場合は、GitHub Enterpriseの使用を検討

### 問題6: config.jsonが破損している

**エラーメッセージ**:

```
❌ エラー: Failed to parse config: Unexpected token } in JSON at position X
```

**原因**: `.michi/config.json` が不正なJSON形式になっている。

**解決方法**:

1. バックアップが存在する場合、復元する

```bash
cp .michi/config.json.backup .michi/config.json
```

2. バックアップが存在しない場合、config.jsonを手動で修正する

```bash
# JSONリンターで構文エラーを確認
cat .michi/config.json | jq .
```

3. それでも解決しない場合、config.jsonを再生成する

```bash
# 既存のconfig.jsonをバックアップ
mv .michi/config.json .michi/config.json.broken

# 新しいconfig.jsonを生成（Multi-Repoプロジェクトは失われる）
michi config:validate
```

---

## 関連ドキュメント

- [Multi-Repoユーザーガイド](./multi-repo-guide.md): 詳細な使い方とコマンドリファレンス
- [Multi-Repo API仕様書](../reference/multi-repo-api.md): データモデルと設定スキーマ
- [セットアップガイド](../getting-started/setup-guide.md): Michi全体のセットアップ手順

---

## サポート

問題が解決しない場合は、以下のサポートチャンネルをご利用ください。

- **GitHub Issues**: [https://github.com/sk8metalme/michi/issues](https://github.com/sk8metalme/michi/issues)
- **ドキュメント**: [https://github.com/sk8metalme/michi#readme](https://github.com/sk8metalme/michi#readme)
