# Multi-Repo管理ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

### Multi-Repo機能とは

Multi-Repo機能は、1つのプロジェクトで複数のGitHubリポジトリを統合的に管理するための機能です。マイクロサービスアーキテクチャやモノレポ分割後のプロジェクトなど、複数リポジトリにまたがる開発を効率化します。

### 対象ユーザー

- マイクロサービスアーキテクチャで開発しているチーム
- フロントエンド・バックエンド・インフラを別リポジトリで管理しているチーム
- 複数リポジトリのCI/CD状態を一元管理したいチーム
- 複数リポジトリの統合ドキュメントをConfluenceで管理したいチーム

### 主要機能

1. **プロジェクト管理**: 複数リポジトリをグループ化してプロジェクトとして管理
2. **CI結果集約**: 複数リポジトリのGitHub Actions実行結果を一覧表示
3. **テスト実行**: プロジェクト単位でテストスクリプトを実行
4. **Confluence同期**: プロジェクトドキュメントをConfluenceに自動同期
5. **一覧表示**: プロジェクトとリポジトリの情報を一覧表示

## セットアップ

### 前提条件

- Node.js 18以上
- GitHub Personal Access Token
- Atlassian (Confluence/JIRA) アカウント（Confluence同期を使用する場合）

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

#### GitHub Token（必須）

GitHub Actions APIを使用してCI結果を取得するために必要です。

```bash
# .env ファイルに追加
GITHUB_TOKEN=ghp_your_github_personal_access_token
```

**Token作成手順**:
1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"をクリック
3. 必要なスコープを選択:
   - `repo` (フル権限、private repositoriesへのアクセスに必要)
   - `read:org` (organizationのリポジトリにアクセスする場合)
4. トークンをコピーして環境変数に設定

#### Atlassian認証情報（Confluence同期を使用する場合）

```bash
# .env ファイルに追加
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token
```

**API Token作成手順**:
1. Atlassian Account Settings → Security → API tokens
2. "Create API token"をクリック
3. トークン名を入力して作成
4. トークンをコピーして環境変数に設定

### カスタムコマンド（スキル）の配布

Multi-Repo AI支援コマンドを使用するには、プロジェクトに `.claude/commands/` を配布する必要があります。

#### 初回セットアップ時

プロジェクトで初めて Michi を使用する場合、使用する環境に応じて以下のコマンドを実行してください:

```bash
# Claude Code 環境の場合
michi init --claude

# Claude Code Subagents 環境の場合
michi init --claude-agent

# Cursor 環境の場合
michi init --cursor
```

#### 環境オプションの選択

| オプション | 環境 | ルールディレクトリ | 用途 |
|-----------|------|-------------------|------|
| `--claude` | Claude Code | `.claude/rules/` | 通常の Claude Code 使用 |
| `--claude-agent` | Claude Code Subagents | `.claude/agents/` | Claude Code Subagents 使用 |
| `--cursor` | Cursor IDE | `.cursor/rules/` | Cursor IDE 使用 |

**注意**: どの環境でも、コマンドディレクトリは `.claude/commands/` に統一されています（v0.8.7以降）。

#### ディレクトリ構造

**Claude Code (`--claude`) の場合**:
```
.claude/
├── rules/              # Michi のルールファイル
└── commands/           # カスタムコマンド（スキル）
    ├── kiro/           # kiro: 単一リポジトリ用コマンド
    ├── michi/          # michi: Michi拡張コマンド
    └── michi-multi-repo/  # Multi-Repo AI支援コマンド
        ├── spec-init.md
        ├── spec-requirements.md
        └── spec-design.md
```

**Claude Code Subagents (`--claude-agent`) の場合**:
```
.claude/
├── agents/             # Subagent 用ルールファイル
└── commands/           # カスタムコマンド（スキル）
    ├── kiro/
    ├── michi/
    └── michi-multi-repo/
```

**Cursor IDE (`--cursor`) の場合**:
```
.cursor/
├── rules/              # Cursor 用ルールファイル
└── commands/           # カスタムコマンド（スキル）
    ├── kiro/
    ├── michi/
    └── michi-multi-repo/
```

#### 既存プロジェクトへの追加

既に `.claude/` や `.cursor/` ディレクトリが存在するプロジェクトの場合も、`michi init` を再実行することで、不足しているコマンドが追加されます:

```bash
# 使用している環境に応じて選択
michi init --claude         # Claude Code 環境
michi init --claude-agent   # Claude Code Subagents 環境
michi init --cursor         # Cursor 環境
```

**注意**:
- 既存のファイルは上書きされます。カスタマイズしたファイルがある場合は、事前にバックアップを取ってください
- 環境オプション（`--claude`, `--claude-agent`, `--cursor`）は、初回セットアップ時と同じものを使用してください

#### コマンドが正しく配布されたか確認

以下のコマンドで、`.claude/commands/` の構造を確認できます:

```bash
ls -la .claude/commands/
# 以下が表示されること:
# - kiro/
# - michi/
# - michi-multi-repo/
```

#### Multi-Repo AIコマンドの利用

配布後、Claude Code で以下のコマンドが利用可能になります:

| コマンド | 説明 |
|---------|------|
| `/michi-multi-repo:spec-init` | プロジェクト初期化（プロジェクト説明から自動生成） |
| `/michi-multi-repo:spec-requirements` | 要件定義書の自動生成 |
| `/michi-multi-repo:spec-design` | 設計書の自動生成 |

**使用例**:
```bash
# Chirper プロジェクトを初期化
/michi-multi-repo:spec-init "Twitter風SNSアプリケーション Chirper をオニオンアーキテクチャで構築" --jira PC --confluence-space MICHI
```

#### トラブルシューティング

**Q: コマンドが認識されない**

A: 以下を確認してください:
1. `.claude/commands/michi-multi-repo/` ディレクトリが存在するか
2. `michi init --claude` を実行したか
3. Claude Code を再起動してみる

**Q: 古いコマンド名 (`/michi_multi_repo:*`) を使っていた**

A: v0.8.7 以降では `/michi-multi-repo:*` に変更されました。詳細は [migration-guide.md](migration-guide.md) を参照してください。

## 基本的な使い方

### 1. プロジェクトの初期化

新しいMulti-Repoプロジェクトを作成します。

```bash
michi multi-repo:init <project-name> --jira <JIRA-KEY> --confluence-space <SPACE>
```

**例**:
```bash
michi multi-repo:init my-microservices --jira MSV --confluence-space MSV
```

**生成されるファイル**:
- `docs/michi/<project-name>/`: プロジェクトドキュメント用ディレクトリ
  - `overview/requirements.md`: 要件定義書（テンプレート）
  - `overview/architecture.md`: アーキテクチャ設計書（テンプレート）
  - `design/sequence.md`: シーケンス図（テンプレート）
  - `test/strategy.md`: テスト戦略書（テンプレート）
- `.michi/config.json`: プロジェクト設定（multiRepoProjectsに追加）

### 2. リポジトリの登録

プロジェクトにGitHubリポジトリを追加します。

```bash
michi multi-repo:add-repo <project-name> --name <repo-name> --url <github-url> --branch <branch>
```

**例**:
```bash
# フロントエンドリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name frontend \
  --url https://github.com/myorg/frontend \
  --branch main

# バックエンドリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name backend \
  --url https://github.com/myorg/backend \
  --branch main

# インフラリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name infrastructure \
  --url https://github.com/myorg/infra \
  --branch main
```

### 3. CI結果の集約

プロジェクト内の全リポジトリのGitHub Actions実行結果を一覧表示します。

```bash
michi multi-repo:ci-status <project-name>
```

**出力例**:
```
=== Multi-Repo CI Status ===
Project: my-microservices
Repositories: 3

Repository: frontend (main)
  Latest Workflow Run: Build and Test
  Status: ✅ success
  Conclusion: success
  Created: 2025-12-17T10:30:00Z
  URL: https://github.com/myorg/frontend/actions/runs/12345

Repository: backend (main)
  Latest Workflow Run: CI
  Status: ✅ success
  Conclusion: success
  Created: 2025-12-17T10:25:00Z
  URL: https://github.com/myorg/backend/actions/runs/12346

Repository: infrastructure (main)
  Latest Workflow Run: Deploy
  Status: ❌ failure
  Conclusion: failure
  Created: 2025-12-17T10:20:00Z
  URL: https://github.com/myorg/infra/actions/runs/12347

CI結果の集約が完了しました
```

**キャッシング機能**:
- CI結果は `.ci-cache.json` にキャッシュされます（有効期限: 15分）
- キャッシュがある場合は高速に結果を表示します

### 4. テストスクリプトの実行

プロジェクトに登録されたテストスクリプトを実行します。

```bash
# Phase A テスト（PR時）
michi multi-repo:test <project-name> --phase A

# Phase B テスト（リリース前）
michi multi-repo:test <project-name> --phase B
```

**テストスクリプトの登録方法**:

`.michi/config.json` を編集:
```json
{
  "multiRepoProjects": [
    {
      "name": "my-microservices",
      "jiraKey": "MSV",
      "confluenceSpace": "MSV",
      "createdAt": "2025-12-17T00:00:00Z",
      "repositories": [...],
      "testScripts": {
        "phaseA": [
          "npm test:unit",
          "npm run lint",
          "npm run type-check"
        ],
        "phaseB": [
          "npm test:integration",
          "npm test:e2e",
          "npm test:performance"
        ]
      }
    }
  ]
}
```

### 5. Confluenceへの同期

プロジェクトドキュメントをConfluenceに同期します。

```bash
# 全ドキュメントを同期
michi multi-repo:confluence-sync <project-name>

# 特定のドキュメントタイプのみ同期
michi multi-repo:confluence-sync <project-name> --doc-type requirements
michi multi-repo:confluence-sync <project-name> --doc-type architecture
michi multi-repo:confluence-sync <project-name> --doc-type sequence
michi multi-repo:confluence-sync <project-name> --doc-type strategy
```

**同期されるドキュメント**:
- `requirements.md` → Confluence Requirements ページ
- `architecture.md` → Confluence Architecture ページ
- `sequence.md` → Confluence Sequence Diagrams ページ
- `strategy.md` → Confluence Test Strategy ページ

**Mermaidダイアグラムの変換**:
- Markdown内のMermaidダイアグラムは自動的にConfluence形式に変換されます

### 6. プロジェクト一覧の表示

登録されているプロジェクトとリポジトリの一覧を表示します。

```bash
michi multi-repo:list
```

**出力例**:
```
=== Multi-Repo Projects ===

Project: my-microservices
  JIRA Key: MSV
  Confluence Space: MSV
  Created: 2025-12-17T00:00:00Z

  Repositories (3):
    1. frontend
       URL: https://github.com/myorg/frontend
       Branch: main

    2. backend
       URL: https://github.com/myorg/backend
       Branch: main

    3. infrastructure
       URL: https://github.com/myorg/infra
       Branch: main

  Test Scripts:
    Phase A: npm test:unit, npm run lint, npm run type-check
    Phase B: npm test:integration, npm test:e2e, npm test:performance

Total Projects: 1
```

## コマンドリファレンス

### multi-repo:init

新しいMulti-Repoプロジェクトを初期化します。

**構文**:
```bash
michi multi-repo:init <project-name> --jira <JIRA-KEY> --confluence-space <SPACE>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）
  - 1-100文字
  - パス区切り文字 (`/`, `\`)、相対パス (`.`, `..`)、制御文字は使用不可

**オプション**:
- `--jira <JIRA-KEY>`: JIRAプロジェクトキー（必須）
  - 2-10文字の大文字英字のみ
  - 例: `MSV`, `PROJ`, `MICROSVCS`
- `--confluence-space <SPACE>`: Confluenceスペースキー（必須）
  - 空でない文字列
  - 例: `MSV`, `PROJ`

**例**:
```bash
michi multi-repo:init my-microservices --jira MSV --confluence-space MSV
```

### multi-repo:add-repo

プロジェクトにリポジトリを追加します。

**構文**:
```bash
michi multi-repo:add-repo <project-name> --name <repo-name> --url <github-url> --branch <branch>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--name <repo-name>`: リポジトリ名（必須）
  - 空でない文字列
- `--url <github-url>`: GitHub URL（必須）
  - `https://github.com/{owner}/{repo}` 形式
  - HTTPSプロトコル必須（HTTP、SSH不可）
  - `.git` 拡張子は不要
- `--branch <branch>`: ブランチ名（必須）
  - デフォルトブランチ（通常は `main` または `master`）

**例**:
```bash
michi multi-repo:add-repo my-microservices \
  --name api-gateway \
  --url https://github.com/myorg/api-gateway \
  --branch main
```

### multi-repo:ci-status

プロジェクトのCI結果を集約して表示します。

**構文**:
```bash
michi multi-repo:ci-status <project-name>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**動作**:
1. 各リポジトリの最新ワークフロー実行結果をGitHub APIから取得
2. キャッシュファイル (`.ci-cache.json`) に保存（有効期限: 15分）
3. 結果を一覧表示

**パフォーマンス**:
- 並列処理により高速化（10リポジトリで30秒以内）
- キャッシュヒット時は即座に表示

**例**:
```bash
michi multi-repo:ci-status my-microservices
```

### multi-repo:test

プロジェクトのテストスクリプトを実行します。

**構文**:
```bash
michi multi-repo:test <project-name> --phase <phase>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--phase <phase>`: テストフェーズ（必須）
  - `A`: Phase A テスト（PR時: unit, lint, build）
  - `B`: Phase B テスト（リリース前: integration, e2e, performance, security）

**例**:
```bash
# Phase A テスト
michi multi-repo:test my-microservices --phase A

# Phase B テスト
michi multi-repo:test my-microservices --phase B
```

### multi-repo:confluence-sync

プロジェクトドキュメントをConfluenceに同期します。

**構文**:
```bash
michi multi-repo:confluence-sync <project-name> [--doc-type <type>]
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--doc-type <type>`: ドキュメントタイプ（オプション）
  - `requirements`: 要件定義書のみ
  - `architecture`: アーキテクチャ設計書のみ
  - `sequence`: シーケンス図のみ
  - `strategy`: テスト戦略書のみ
  - 未指定: 全ドキュメントを同期

**動作**:
1. 親ページ（プロジェクト名）を作成または取得
2. 各ドキュメントを子ページとして作成または更新
3. Mermaidダイアグラムを自動変換

**例**:
```bash
# 全ドキュメントを同期
michi multi-repo:confluence-sync my-microservices

# 要件定義書のみ同期
michi multi-repo:confluence-sync my-microservices --doc-type requirements
```

### multi-repo:list

登録されているプロジェクトの一覧を表示します。

**構文**:
```bash
michi multi-repo:list
```

**引数**: なし

**動作**:
- `.michi/config.json` からプロジェクト情報を読み込み
- プロジェクト名、JIRA キー、Confluence スペース、リポジトリ一覧を表示

**例**:
```bash
michi multi-repo:list
```

## 既存ユーザーのためのマイグレーションガイド

このセクションは、既存のMichiユーザーがMulti-Repo機能を導入する際の手順を説明します。

### 概要

Multi-Repo機能はMichiに新しく追加された機能です。既存のMichi機能に影響を与えず、追加のコマンド群として提供されます。

**主な特徴**:
- **後方互換性**: 既存のMichiコマンドとワークフローに影響なし
- **オプトイン**: Multi-Repo機能を使用する場合のみ、設定を追加
- **自動マイグレーション**: 初回使用時に自動的に設定ファイルが拡張される

### 変更点（v0.5.0 → v1.0.0）

#### 1. config.jsonスキーマの拡張

`.michi/config.json` に新しいフィールド `multiRepoProjects` が追加されます。

**変更前（v0.5.0）**:
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

**変更後（v1.0.0）**:
```json
{
  "confluence": { ... },
  "jira": { ... },
  "workflow": { ... },
  "validation": { ... },
  "atlassian": { ... },
  "project": { ... },
  "multiRepoProjects": []
}
```

重要: `multiRepoProjects` フィールドが存在しない場合、Michiは自動的に空配列 `[]` として扱います。手動で追加する必要はありません。

#### 2. 新規コマンドの追加

以下の6つのコマンドが追加されます：

| コマンド | Phase | 説明 |
|---------|-------|------|
| `michi multi-repo:init` | 1 (MVP) | プロジェクト初期化 |
| `michi multi-repo:add-repo` | 1 (MVP) | リポジトリ登録 |
| `michi multi-repo:list` | 1 (MVP) | プロジェクト一覧表示 |
| `michi multi-repo:ci-status` | 2 | CI結果集約 |
| `michi multi-repo:test` | 2 | テスト実行 |
| `michi multi-repo:confluence-sync` | 3 | Confluence同期 |

#### 3. 環境変数の追加（オプション）

**Phase 2機能を使用する場合**:
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Phase 3機能を使用する場合**:
```bash
export ATLASSIAN_URL="https://your-company.atlassian.net"
export ATLASSIAN_EMAIL="your-email@example.com"
export ATLASSIAN_API_TOKEN="your-api-token"
```

注意: 既存のMichiでConfluence機能を使用している場合、これらの環境変数は既に設定されているため、追加の設定は不要です。

### マイグレーション手順

#### ステップ1: Michiをv1.0.0にアップグレード

```bash
npm install -g @sk8metal/michi-cli@latest
```

アップグレード後、バージョンを確認します。

```bash
michi --version
# @sk8metal/michi-cli v1.0.0
```

#### ステップ2: 環境変数の設定（オプション）

**Phase 2機能を使用する場合**:

GitHub Personal Access Tokenを取得し、環境変数に設定します。

GitHub Personal Access Tokenの取得方法:
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

**Phase 3機能を使用する場合**:

既存のMichiでConfluence機能を使用している場合は、既に設定済みのため、この手順はスキップしてください。

新規にConfluence機能を使用する場合は、[Confluenceセットアップガイド](../getting-started/setup-guide.md#confluence設定)を参照してください。

#### ステップ3: Multi-Repoプロジェクトの初期化

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

#### ステップ4: リポジトリの登録

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

#### ステップ5: 動作確認

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

### 既存機能への影響

#### 影響なし

以下の既存Michi機能は、Multi-Repo機能の追加によって**影響を受けません**。

**Spec-Driven Developmentワークフロー**:
```bash
# 既存のワークフローは変更なし
/kiro:spec-init "feature-name"
/kiro:spec-requirements feature-name
/kiro:spec-design feature-name
/kiro:spec-tasks feature-name
/kiro:spec-impl feature-name
```

**Confluence/JIRA統合**:
```bash
# 既存のConfluence/JIRAコマンドは変更なし
michi confluence:sync
michi jira:sync
```

**設定管理**:
```bash
# 既存の設定コマンドは変更なし
michi config:validate
michi migrate
```

既存の設定フィールド（`confluence`, `jira`, `workflow`, `validation`, `atlassian`, `project`）は変更されません。`multiRepoProjects` フィールドが追加されるのみです。

#### 注意事項

**ディレクトリ構造**:

Multi-Repo機能は `docs/michi/{project-name}/` ディレクトリを使用します。既存のMichi機能と同じディレクトリ構造ですが、プロジェクト名が異なる場合は別のディレクトリが作成されます。

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

**Confluence階層構造**:

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

## トラブルシューティング

### 問題1: GITHUB_TOKEN が設定されていないエラー

**エラーメッセージ**:
```
Error: GITHUB_TOKEN environment variable is not set
```

**原因**:
`GITHUB_TOKEN` 環境変数が設定されていません。

**対処法**:
1. GitHub Personal Access Token を作成（上記「セットアップ」参照）
2. `.env` ファイルに追加:
   ```
   GITHUB_TOKEN=ghp_your_token
   ```
3. コマンドを再実行

### 問題2: Confluence認証エラー

**エラーメッセージ**:
```
Error: Missing Confluence credentials in .env file
```

**原因**:
- Atlassian認証情報が正しく設定されていない
- API Tokenの有効期限が切れている
- URLが間違っている

**対処法**:
1. `.env` ファイルの設定を確認:
   ```
   ATLASSIAN_URL=https://your-domain.atlassian.net
   ATLASSIAN_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your_token
   ```
2. URLが正しい形式か確認（`https://` で始まり、`.atlassian.net` で終わる）
3. API Tokenを再作成して設定

### 問題3: プロジェクト名にパス区切り文字が含まれているエラー

**エラーメッセージ**:
```
Error: Project name must not contain path traversal characters (/, \), relative path components (., ..), or control characters
```

**原因**:
セキュリティ対策として、プロジェクト名にパス区切り文字（`/`, `\`）、相対パス（`.`, `..`）、制御文字が禁止されています。

**解決方法**:

プロジェクト名を変更して、以下の文字を含まないようにしてください。

- パス区切り文字: `/`, `\`
- 相対パス: `.`, `..`
- 制御文字: `\x00`-`\x1F`, `\x7F`

**例**:
```bash
# 不正な例
michi multi-repo:init my/project  # スラッシュを含む
michi multi-repo:init ../project  # 相対パスを含む

# 正しい例
michi multi-repo:init my-project
michi multi-repo:init my_project
michi multi-repo:init myproject
```

### 問題4: リポジトリURLが無効

**エラーメッセージ**:
```
Error: Repository URL must be in GitHub format: https://github.com/{owner}/{repo}
```

**原因**:
セキュリティ対策として、GitHub HTTPS URLのみが許可されています。

**解決方法**:

リポジトリURLを以下の形式に変更してください。

```
https://github.com/{owner}/{repo}
```

**例**:
```bash
# 不正な例
--url git@github.com:your-org/repo.git  # SSH URL
--url https://github.com/your-org/repo.git  # .git拡張子を含む
--url http://github.com/your-org/repo  # HTTP (非セキュア)

# 正しい例
--url https://github.com/your-org/repo
```

### 問題5: GitHub API レート制限エラー

**エラーメッセージ**:
```
Warning: GitHub API rate limit exceeded. Retrying after X seconds...
```

**原因**:
GitHub API呼び出しがレート制限（5,000リクエスト/時間）に達した。

**解決方法**:

Michiは自動的にExponential Backoffで再試行します。以下の対策を検討してください。

1. **待機**: 自動再試行が完了するまで待つ（最大3回再試行）
2. **キャッシング活用**: CI結果は15分間キャッシュされるため、頻繁な実行を避ける
3. **GitHub Enterprise**: より高いレート制限が必要な場合は、GitHub Enterpriseの使用を検討

### 問題6: config.jsonが破損している

**エラーメッセージ**:
```
Error: Failed to parse config: Unexpected token } in JSON at position X
```

**原因**:
`.michi/config.json` が不正なJSON形式になっている。

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

## FAQ

### Q1: Multi-Repo機能はどのようなプロジェクトに適していますか？

**A**: 以下のようなプロジェクトに適しています:
- マイクロサービスアーキテクチャ（複数の独立したサービスリポジトリ）
- フロントエンド・バックエンド分離アーキテクチャ
- モバイルアプリ + API + Webダッシュボード
- インフラ as Code を別リポジトリで管理

### Q2: リポジトリの最大数に制限はありますか？

**A**: 技術的な制限はありませんが、以下の推奨事項があります:
- 実用的には10-20リポジトリ程度を推奨
- CI結果集約は並列処理により高速化（10リポジトリで30秒以内）
- 100リポジトリまでテスト済み（5分以内）

### Q3: Private リポジトリは使用できますか？

**A**: はい、使用できます。GitHub Personal Access Token に `repo` スコープ（フル権限）を付与してください。

### Q4: GitHub Actions以外のCIツール（Jenkins、CircleCIなど）には対応していますか？

**A**: 現在はGitHub Actionsのみ対応しています。他のCIツールのサポートは将来のバージョンで検討中です。

### Q5: Mermaidダイアグラムの変換に対応していない記法はありますか？

**A**: 基本的な記法（graph, flowchart, sequenceDiagram, classDiagram）はサポートしています。複雑なカスタマイズや最新の実験的機能は未サポートの可能性があります。

### Q6: Confluenceの複数スペースに同期できますか？

**A**: 1プロジェクトにつき1つのConfluenceスペースに同期します。複数スペースに同期する場合は、プロジェクトを分けて管理してください。

### Q7: キャッシュファイル (`.ci-cache.json`) は削除しても大丈夫ですか？

**A**: はい、削除しても問題ありません。次回のCI結果集約時に自動的に再生成されます。ただし、キャッシュがない状態では初回取得に時間がかかります。

### Q8: テストスクリプトはどこで実行されますか？

**A**: プロジェクトルートディレクトリ（`.michi/config.json` が存在するディレクトリ）で実行されます。リポジトリごとに異なるディレクトリでスクリプトを実行することはできません。

### Q9: 既存のプロジェクトにMulti-Repo機能を追加できますか？

**A**: はい、可能です。`michi multi-repo:init` を実行すれば、既存の `.michi/config.json` に `multiRepoProjects` セクションが追加されます。

### Q10: プロジェクトを削除するにはどうすればいいですか？

**A**: 現在、削除用のコマンドはありません。`.michi/config.json` を直接編集して該当プロジェクトを削除してください。将来のバージョンで削除コマンドを追加予定です。

## AI支援要件定義・設計

Multi-Repoプロジェクトでは、AI支援による要件定義・設計書の自動生成が可能です。

### 前提条件

- プロジェクトが初期化されていること（`/michi-multi-repo:spec-init` または `michi multi-repo:init`）
- 1つ以上のリポジトリが登録されていること（`michi multi-repo:add-repo`）

### 6. AIプロジェクト初期化（NEW）

Multi-Repoプロジェクトを AI支援で初期化します。`michi multi-repo:init` の代替コマンドです。

```bash
/michi-multi-repo:spec-init "<プロジェクト説明>" --jira <JIRA_KEY> --confluence-space <SPACE>
```

**例**:
```bash
/michi-multi-repo:spec-init "マイクロサービスアーキテクチャでECサイトを構築" --jira MSV --confluence-space MSV
```

**機能**:
- プロジェクト説明からプロジェクト名を自動生成
- ディレクトリ構造を作成（`docs/michi/{project}/`）
- メタデータファイル（`spec.json`）を作成
- `.michi/config.json` の `multiRepoProjects` に登録
- 初期テンプレートファイルを生成

**出力**:
- `docs/michi/{project}/spec.json` - メタデータ（phase: initialized）
- `docs/michi/{project}/overview/requirements.md` - 要件定義書（初期化済み）
- `docs/michi/{project}/overview/architecture.md` - 設計書（テンプレート）
- `.michi/config.json` - multiRepoProjects に追加

**`michi multi-repo:init` との違い**:
- プロジェクト説明を入力して自動的にプロジェクト名を生成
- spec.json でメタデータ管理（phase、承認状態等）
- AIコマンドで一貫したワークフローを実現

### 7. AI要件定義書の生成

プロジェクトの要件定義書をAI支援で自動生成します。

```bash
/michi-multi-repo:spec-requirements <project-name>
```

**例**:
```bash
/michi-multi-repo:spec-requirements my-microservices
```

**生成される内容**:
- プロジェクト概要
- サービス構成（登録リポジトリ一覧、依存関係図）
- インターフェース要件（API契約、イベント契約）
- 機能要件（EARS形式）
- 非機能要件（パフォーマンス、セキュリティ等）

**出力先**: `docs/michi/{project}/overview/requirements.md`

### 8. AI設計書の生成

プロジェクトの技術設計書をAI支援で自動生成します。

```bash
/michi-multi-repo:spec-design <project-name> [-y]
```

**例**:
```bash
/michi-multi-repo:spec-design my-microservices
```

**生成される内容**:
- システム全体図（C4モデル）
- サービス横断アーキテクチャ
- サービス間通信設計
- 共有コンポーネント
- デプロイメントアーキテクチャ
- データフロー図

**出力先**: `docs/michi/{project}/overview/architecture.md`

**オプション**:
- `-y`: 既存ファイルの上書きを自動承認

### ワークフロー例（AIコマンド使用）

```bash
# 1. AI初期化（NEW - michi multi-repo:init の代替）
/michi-multi-repo:spec-init "マイクロサービスアーキテクチャでECサイトを構築" --jira MSV --confluence-space MSV

# 2. リポジトリ登録
michi multi-repo:add-repo my-microservices --name frontend --url https://github.com/myorg/frontend --branch main
michi multi-repo:add-repo my-microservices --name backend --url https://github.com/myorg/backend --branch main
michi multi-repo:add-repo my-microservices --name database --url https://github.com/myorg/db-schema --branch main

# 3. AI要件定義書生成（NEW）
/michi-multi-repo:spec-requirements my-microservices

# 4. AI設計書生成（NEW）
/michi-multi-repo:spec-design my-microservices

# 5. Confluence同期
michi multi-repo:confluence-sync my-microservices --doc-type requirements
michi multi-repo:confluence-sync my-microservices --doc-type architecture

# 6. CI結果確認
michi multi-repo:ci-status my-microservices
```

## 関連ドキュメント

- [ワークフローガイド](./workflow.md): Michiの全体的な開発ワークフロー
- [Phase自動化ガイド](./phase-automation.md): テストフェーズの自動化について
- [カスタマイズガイド](./customization.md): Michiのカスタマイズ方法
- [Multi-Repo API仕様書](../reference/multi-repo-api.md): Multi-Repo機能のAPI仕様（作成予定）
