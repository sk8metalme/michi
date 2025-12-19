# Michi セットアップガイド

> **このガイドについて**: 既存のプロジェクトにMichiを導入する手順です。  
> 新規プロジェクトを作成する場合は [新規リポジトリセットアップガイド](./new-repository-setup.md) を参照してください。  
> Michiの開発に貢献する場合は [開発環境セットアップガイド](../contributing/development.md) を参照してください。

## 前提条件

- Node.js 20.x以上
- npm 10.x以上
- Git（または Jujutsu (jj) も使用可能）
- Cursor IDE または VS Code
- GitHub CLI (gh) - PR作成時に使用
- **cc-sdd**: AI駆動開発ワークフローのコアフレームワーク

## Step 1: Michi CLIのインストール

```bash
# グローバルインストール
npm install -g @sk8metal/michi-cli

# インストール確認
michi --version
michi --help
```

**注意**: 初回実行時は依存関係のダウンロードに時間がかかる場合があります。

> **開発者向け**: Michiの開発に貢献したい場合や、最新の開発版を使用したい場合は [開発環境セットアップガイド](../contributing/development.md) を参照してください。


## Step 2: cc-sddとMichiのセットアップ

Michiは、cc-sddをコアフレームワークとして使用します。セットアップは2段階で行います:

1. **cc-sdd**: AI駆動開発ワークフローの基盤
2. **Michi**: Confluence/JIRA連携などの拡張機能

詳細な手順については、以下のセクションを参照してください:

### クイックスタート（3ステップ）

```bash
# Step 1: cc-sddで標準ファイル生成
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイルを追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

👉 **詳細な手順**: [推奨ワークフロー（cc-ssd + Michi）](#step-25-推奨ワークフローcc-ssd--michi) を参照してください。

## Step 2.5: 推奨ワークフロー（cc-sdd + Michi）

既存リポジトリにMichiを導入する標準的な手順は以下の通りです：

### 3ステップワークフロー

```bash
# Step 1: cc-sddで標準ファイル生成
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイルを追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
# または npm run michi:setup:cursor

# Step 3: 環境設定
npm run setup:interactive
```

### 各ステップの詳細

#### Step 1: cc-sdd導入

cc-sddは、AI駆動開発ワークフローのコアフレームワークです。以下を自動生成します:

- `.kiro/settings/` - テンプレート設定
- `.cursor/commands/kiro/` - 11のスラッシュコマンド
- `CLAUDE.md` - プロジェクト設定

**実行例（IDE別）**:

```bash
# Cursor IDE
npx cc-sdd@latest --cursor --lang ja

# Claude Code
npx cc-sdd@latest --claude --lang ja

# Gemini CLI
npx cc-sdd@latest --gemini --lang ja

# Codex CLI
npx cc-sdd@next --codex --lang ja

# Windsurf IDE
npx cc-sdd@next --windsurf --lang ja
```

#### Step 2: Michi固有ファイル追加

Michiの専用機能（Confluence/JIRA連携、マルチプロジェクト管理）を追加します:

**実行例**:

```bash
# Cursor IDE
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
# または npm run michi:setup:cursor

# Claude Code
npx @sk8metal/michi-cli setup-existing --claude --lang ja
# または npm run michi:setup:claude

# Claude Code Subagents
npx @sk8metal/michi-cli setup-existing --claude-agent --lang ja
# または npm run michi:setup:claude-agent
```

**追加されるもの**:

- 共通ルール（`.cursor/rules/`または`.claude/rules/`）
- Michi専用コマンド（`.cursor/commands/michi/`または`.claude/commands/michi/`）
- Steeringテンプレート（`.kiro/steering/`）
- Specテンプレート（`.kiro/settings/templates/`）
- プロジェクトメタデータ（`.kiro/project.json`）
- 環境変数テンプレート（`.env`）

#### Step 3: 環境設定

対話的設定ツールで認証情報とプロジェクトメタデータを設定します：

```bash
npm run setup:interactive
```

このツールが以下を設定します：

- プロジェクト情報（`project.json`）
- 認証情報（`.env`）

詳細は [Step 3: 環境変数の設定](#step-3-環境変数の設定) を参照してください。

### なぜこの順序なのか？

1. **cc-sdd → Michi**: cc-sddが基盤を作り、Michiが拡張機能を追加
2. **ファイル追加 → 環境設定**: 設定ファイルが先に存在する必要がある
3. **標準化**: すべてのプロジェクトで一貫した手順


## Step 3: 環境変数の設定

### 3-1. .env ファイルの作成

**重要**: 作業するプロジェクトのルートディレクトリで実行してください。

```bash
# 作業プロジェクトのルートディレクトリに移動
cd /path/to/your-project

# GitHubリポジトリから直接取得（推奨）
curl -o .env https://raw.githubusercontent.com/sk8metalme/michi/main/env.example

# または wget を使用
wget -O .env https://raw.githubusercontent.com/sk8metalme/michi/main/env.example
```

**注意**:
- `.env` ファイルは作業するプロジェクトのルートディレクトリに作成されます
- 別のディレクトリにいる場合は、まずプロジェクトルートに移動してください

## Step 3.5: 設定の作成と管理

Michiには2段階の設定があります。

| 設定レベル | コマンド | 出力先 | タイミング |
|---------|---------|--------|-----------|
| **グローバル設定** | `npm run config:global` | `~/.michi/config.json` | 初回セットアップ時（推奨） |
| **プロジェクト設定** | `michi init` または手動作成 | `.michi/config.json` | プロジェクトごとのカスタマイズ時 |

### グローバル設定のメリット

`npm run config:global` を使用すると、以下の設定を全プロジェクトで共有できます：
- Confluence階層構造設定
- JIRA Story作成粒度
- ワークフロー承認ゲート

### プロジェクト固有の設定

プロジェクト固有の設定は以下の方法で作成できます：
1. **自動コピー**: `michi init` 実行時にグローバル設定から自動コピー
2. **手動作成**: グローバル設定をコピーして `.michi/config.json` として編集

**推奨フロー:**
1. 初回: `npm run config:global` でグローバル設定を作成
2. プロジェクトごと: `michi init` で初期化（グローバル設定を自動コピー）
3. カスタマイズ: 必要に応じて `.michi/config.json` を手動編集

### 3-2. 認証情報の設定

`.env` ファイルを編集して、実際の認証情報を設定します：

```bash
# Atlassian設定
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=<ATLASSIANトークン>

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=<GitHubトークン>
# Note: リポジトリ情報は .kiro/project.json の repository フィールドで管理されます

# Confluence設定
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRA設定
JIRA_PROJECT_KEYS=MICHI

# JIRA Issue Type IDs（JIRAインスタンス固有の値 - 必須）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037

# Slack通知（オプション）
SLACK_WEBHOOK_URL=<SlackWebhook URL>
```

#### 各設定値の確認方法

##### Atlassian設定

**`ATLASSIAN_URL`**
- **確認方法**: ブラウザでAtlassianにアクセスした際のURL
- **形式**: `https://your-domain.atlassian.net`
- **例**: `https://mycompany.atlassian.net`

**`ATLASSIAN_EMAIL`**
- **確認方法**: Atlassianにログインする際に使用するメールアドレス
- **形式**: メールアドレス形式
- **例**: `user@company.com`

**`ATLASSIAN_API_TOKEN`**
- **確認方法**: 3-3セクション「Atlassian API Token」を参照

##### GitHub設定

**`GITHUB_ORG`**
- **確認方法**: GitHubの組織名またはユーザー名
- **確認手順**:
  1. GitHubにログイン
  2. 組織のページにアクセス（例: `https://github.com/your-org`）
  3. URLの `/your-org` 部分が組織名
- **例**: `sk8metal`、`mycompany`
- **使用機能**:
  - プロジェクト一覧表示（`michi project:list`）: 組織内の全リポジトリをスキャンしてプロジェクト情報を表示
  - 複数プロジェクト見積もり集計（`michi multi-estimate`）: 組織内の全リポジトリから `design.md` を取得して見積もり情報を集計
  - プロジェクトリソースダッシュボード（`michi project:dashboard`）: 組織内の全プロジェクト情報を集計してConfluenceダッシュボードを生成
  - 新規プロジェクト作成（`michi create-project`）: 新規リポジトリ作成時の組織名として使用

**`GITHUB_TOKEN`**
- **確認方法**: 3-3セクション「GitHub Token」を参照
- **使用機能**: すべてのGitHub連携機能で認証に使用（API呼び出し時の認証トークン）

> **Note**: リポジトリ情報（以前の `GITHUB_REPO` 環境変数）は `.kiro/project.json` の `repository` フィールドで管理されるようになりました。
> 形式: `https://github.com/org/repo.git` または `git@github.com:org/repo.git`
> 例: `.kiro/project.json` に `"repository": "https://github.com/sk8metalme/michi.git"` と設定

##### Confluence設定

**`CONFLUENCE_PRD_SPACE`、`CONFLUENCE_QA_SPACE`、`CONFLUENCE_RELEASE_SPACE`**
- **確認方法**: Confluenceスペースのキー（スペースキー）
- **確認手順**:
  1. Confluenceにログイン
  2. スペース一覧ページにアクセス: `https://your-domain.atlassian.net/wiki/spaces`
  3. 各スペースのページにアクセス（例: `https://your-domain.atlassian.net/wiki/spaces/PRD`）
  4. URLの `/spaces/PRD` 部分の `PRD` がスペースキー
- **形式**: 大文字の英数字（通常は3-10文字）
- **例**: `PRD`、`QA`、`RELEASE`、`ENG`

##### JIRA設定

**`JIRA_PROJECT_KEYS`**
- **確認方法**: JIRAプロジェクトのキー（プロジェクトキー）
- **確認手順**:
  1. JIRAにログイン
  2. プロジェクト一覧ページにアクセス: `https://your-domain.atlassian.net/jira/projects`
  3. 各プロジェクトのページにアクセス（例: `https://your-domain.atlassian.net/jira/projects/MICHI`）
  4. URLの `/projects/MICHI` 部分の `MICHI` がプロジェクトキー
  5. 複数のプロジェクトを使用する場合は、カンマ区切りで指定（例: `MICHI,PRJA,PRJB`）
- **形式**: 大文字の英数字（通常は2-10文字）
- **例**: `MICHI`、`PROJ`、`DEV`

**`JIRA_ISSUE_TYPE_STORY`、`JIRA_ISSUE_TYPE_SUBTASK`**
- **確認方法**: JIRAインスタンス固有のIssue Type ID
- **確認手順**:
  1. **JIRA管理画面から確認**:
     - JIRAに管理者権限でログイン
     - Settings（設定）> Issues（課題）> Issue types（課題タイプ）
     - 「Story」と「Subtask」のIDを確認
  2. **REST APIから確認**:
     ```bash
     curl -u your-email@company.com:your-api-token \
       https://your-domain.atlassian.net/rest/api/3/issuetype
     ```
     レスポンスから "Story" と "Subtask" の "id" フィールドを取得
     - 例: `{"id": "10036", "name": "Story", ...}`
- **形式**: 数値（通常は5桁）
- **例**: `10036`、`10037`
- **重要**: これらの値は各JIRAインスタンスで異なるため、必ず実際の値を設定してください

##### Slack設定（オプション）

**`SLACK_WEBHOOK_URL`**
- **確認方法**: 3-3セクション「Slack Webhook URL」を参照

### 3-3. 認証トークンの取得方法

#### Atlassian API Token
1. https://id.atlassian.com/manage-profile/security/api-tokens にアクセス
2. 「APIトークンを作成」をクリック
3. トークン名を入力（例: michi-automation）
4. 生成されたトークンをコピーして `.env` に貼り付け

#### GitHub Token

**重要**: GitHubトークンをまだ作成していない場合は、以下の詳細ガイドを参照してください：

📖 **[GitHubトークン作成ガイド](./github-token-setup.md)**

トークン作成ガイドでは以下を解説しています：
- Fine-grained tokens と Tokens (classic) の違い
- 必要な権限の詳細説明
- トークンの作成手順（ステップバイステップ）
- セキュリティベストプラクティス
- トラブルシューティング

**クイックガイド**（既にトークンを持っている場合）:

```bash
# GitHub CLIを使用する場合
gh auth login
gh auth token

# 生成されたトークンを .env に設定
```

トークン作成後、`.env` の `GITHUB_TOKEN` に設定:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**必要な権限**:
- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)

詳細は [GitHubトークン作成ガイド](./github-token-setup.md) を参照してください。

#### Slack Webhook URL（オプション）
1. https://api.slack.com/apps にアクセス
2. 新しいアプリを作成
3. Incoming Webhooks を有効化
4. Webhook URL を生成して `.env` に設定

## Step 4: Atlassian MCP サーバーの設定

### 4-1. MCP設定ファイルの作成

ホームディレクトリに `~/.cursor/mcp.json` を作成：

```bash
# ホームディレクトリに .cursor ディレクトリを作成
mkdir -p ~/.cursor

# GitHubリポジトリから直接取得
curl -o ~/.cursor/mcp.json https://raw.githubusercontent.com/sk8metalme/michi/main/mcp.json.example

# または wget を使用
wget -O ~/.cursor/mcp.json https://raw.githubusercontent.com/sk8metalme/michi/main/mcp.json.example
```

### 4-2. 実際の認証情報に置き換え

`~/.cursor/mcp.json` を編集して、`.env` と同じ認証情報を設定：

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@atlassian/mcp-server-atlassian"],
      "env": {
        "ATLASSIAN_URL": "https://your-domain.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Step 5: プロジェクトメタデータの設定

`.kiro/project.json` は、プロジェクトのメタデータ（プロジェクトID、JIRAキー、Confluenceラベルなど）を管理するファイルです。

**重要**: すべてのプロジェクト（単一プロジェクトも含む）は`projects/{project-id}/`配下に配置されます。

> **補足**: 新規プロジェクトを作成する場合や、既存プロジェクトにMichiを自動導入する場合は [新規リポジトリセットアップガイド](./new-repository-setup.md) を参照してください。

### 5-1. `.kiro/project.json` の作成

**重要**: 作業するプロジェクトのルートディレクトリで実行してください。

手動で `.kiro/project.json` を作成します：

```bash
# プロジェクトルートに .kiro ディレクトリを作成
mkdir -p .kiro

# project.json を作成
cat > .kiro/project.json << 'EOF'
{
  "projectId": "your-project-id",
  "projectName": "プロジェクト名",
  "jiraProjectKey": "PROJ",
  "confluenceLabels": ["project:your-project", "service:your-service"],
  "status": "active",
  "team": ["@developer1"],
  "stakeholders": ["@pm", "@director"],
  "repository": "https://github.com/your-org/your-repo",
  "description": "プロジェクトの説明"
}
EOF
```

### 5-2. `.kiro/project.json` の確認・編集

既に `.kiro/project.json` が存在する場合、または作成後に必要に応じて編集してください：

```json
{
  "projectId": "michi",
  "projectName": "Michi - Managed Intelligent Comprehensive Hub for Integration",
  "jiraProjectKey": "MICHI",
  "confluenceLabels": ["project:michi", "service:hub"],
  "status": "active",
  "team": ["@developer1"],
  "stakeholders": ["@pm", "@director"],
  "repository": "https://github.com/your-org/your-repo",
  "description": "プロジェクトの説明"
}
```

**各フィールドの説明**:
- `projectId`: プロジェクトの一意識別子（通常はリポジトリ名）
- `projectName`: プロジェクトの表示名
- `jiraProjectKey`: JIRAプロジェクトキー（`.env` の `JIRA_PROJECT_KEYS` と一致させる）
- `confluenceLabels`: Confluenceページに付与するラベル（配列形式）
- `status`: プロジェクトのステータス（`active`、`archived` など）
- `team`: チームメンバーのリスト（`@` プレフィックス付き）
- `stakeholders`: ステークホルダーのリスト（`@` プレフィックス付き）
- `repository`: GitHubリポジトリのURL（オプション）
- `description`: プロジェクトの説明（オプション）

## Step 6: Cursor IDE の設定

### 6-1. Cursor でプロジェクトを開く

```bash
cursor .
```

### 6-2. 利用可能なコマンドの確認

Cursor のコマンドパネル（Cmd+Shift+P）で `/kiro:` と入力すると、以下のコマンドが表示されます：

- `/kiro:spec-init <機能説明>` - 新機能の仕様を初期化
- `/kiro:spec-requirements <feature>` - 要件定義を生成
- `/kiro:spec-design <feature>` - 設計ドキュメントを生成
- `/kiro:spec-tasks <feature>` - 実装タスクを生成
- `/kiro:spec-impl <feature> <tasks>` - TDDで実装
- `/kiro:steering` - プロジェクトステアリングを作成/更新

凡例の詳細は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## Step 7: 動作確認

### 7-1. 基本的な動作確認

```bash
# Michiコマンドが利用可能か確認
michi --version

# ヘルプを表示
michi --help

# 利用可能なコマンド一覧
michi help
```

## トラブルシューティング

### cc-sddのインストールに失敗する

**症状**: `npx cc-sdd@latest` が失敗する

**原因**:
- npmキャッシュの問題
- ネットワーク接続の問題
- Node.jsのバージョンが古い

**解決方法**:

```bash
# キャッシュをクリア
npm cache clean --force

# 再度実行
npx cc-sdd@latest --cursor --lang ja

# それでも失敗する場合は、Node.jsバージョンを確認
node --version
# 20.0.0以上が必要
```

### setup-existing の実行エラー

**症状**: `npx @sk8metal/michi-cli setup-existing` が失敗する

**原因**:
- ネットワーク接続の問題
- 必要な依存関係がインストールされていない
- 権限の問題

**解決方法**:

```bash
# NPMキャッシュをクリア
npm cache clean --force

# 再度実行
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# または、開発リポジトリから実行する場合
cd /path/to/michi
npm run michi:setup:cursor
```

### 環境変数設定のミス

**症状**: Confluence/JIRA連携が動作しない

**原因**:
- `.env`ファイルの認証情報が間違っている
- 環境変数が正しく読み込まれていない

**解決方法**:

```bash
# .envファイルの内容を確認
cat .env

# 認証情報が正しいか確認
# - ATLASSIAN_URL: https://your-domain.atlassian.net 形式
# - ATLASSIAN_EMAIL: メールアドレス形式
# - ATLASSIAN_API_TOKEN: 有効なトークン
# - GITHUB_TOKEN: ghp_ で始まるトークン

# トークンの有効性を確認
curl -u your-email@company.com:your-api-token \
  https://your-domain.atlassian.net/rest/api/3/myself
```

### MCP サーバーが動作しない

**症状**: Cursor IDEでAtlassian MCPが接続できない

**原因**:
- `~/.cursor/mcp.json`の設定が間違っている
- Atlassian API Tokenが無効
- Cursorが設定を読み込んでいない

**解決方法**:

1. Cursor を再起動
2. `~/.cursor/mcp.json` の認証情報を確認

```bash
# mcp.jsonの内容を確認
cat ~/.cursor/mcp.json

# 認証情報が.envと一致しているか確認
```

3. Atlassian API Token が有効か確認

```bash
# トークンの有効性をテスト
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/myself
```

4. Cursor のログを確認

- Cursor > View > Toggle Developer Tools
- Console タブでエラーを確認

### JIRA Issue Type ID の取得方法

**症状**: `JIRA_ISSUE_TYPE_STORY`や`JIRA_ISSUE_TYPE_SUBTASK`の値がわからない

**解決方法**:

**方法1: JIRA管理画面から確認（管理者権限が必要）**

1. JIRAに管理者権限でログイン
2. Settings（設定）> Issues（課題）> Issue types（課題タイプ）
3. 「Story」と「Subtask」のIDを確認

**方法2: REST APIで確認（推奨）**

```bash
# すべてのIssue Typeを取得
curl -u your-email@company.com:your-api-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype | jq

# 出力例:
# [
#   {
#     "id": "10036",
#     "name": "Story",
#     ...
#   },
#   {
#     "id": "10037",
#     "name": "Subtask",
#     ...
#   }
# ]
```

**方法3: jqがない場合**

```bash
# jqなしで確認
curl -u your-email@company.com:your-api-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype

# 出力から "Story" と "Subtask" の "id" フィールドを探す
```

### GitHub認証エラー

```bash
gh auth status
gh auth login
gh auth setup-git
```

## セットアップ完了

これでセットアップは完了です。次のステップ：

- [クイックスタート](./quick-start.md) - 5分で始める
- [ワークフローガイド](../guides/workflow.md) - AI開発フロー
- [マルチプロジェクト管理](../guides/multi-project.md) - 複数プロジェクト管理

## オプション設定

以下の設定は任意です。必要に応じて設定してください。

### ワークフロー承認ゲートの設定

ワークフロー実行時（`michi workflow:run`）の承認ゲートで使用するロール名を設定できます。

#### 設定方法

`.env` ファイルに以下の環境変数を追加：

```bash
# 要件定義フェーズの承認者
APPROVAL_GATES_REQUIREMENTS=pm,director

# 設計フェーズの承認者
APPROVAL_GATES_DESIGN=architect,director

# リリースフェーズの承認者
APPROVAL_GATES_RELEASE=sm,director
```

#### 設定例

**英語ロール名を使用する場合:**
```bash
APPROVAL_GATES_REQUIREMENTS=product-manager,cto,legal
APPROVAL_GATES_DESIGN=tech-lead,architect,security
APPROVAL_GATES_RELEASE=release-manager,qa-lead,director
```

**日本語ロール名を使用する場合:**
```bash
APPROVAL_GATES_REQUIREMENTS=企画,部長
APPROVAL_GATES_DESIGN=アーキテクト,部長
APPROVAL_GATES_RELEASE=SM,部長
```

**組織固有のロール名を使用する場合:**
```bash
APPROVAL_GATES_REQUIREMENTS=プロダクトマネージャー,CTO,法務
APPROVAL_GATES_DESIGN=テックリード,アーキテクト,セキュリティ
APPROVAL_GATES_RELEASE=リリースマネージャー,QAリード,部長
```

#### デフォルト値

環境変数が設定されていない場合、以下のデフォルト値が使用されます：

- `APPROVAL_GATES_REQUIREMENTS`: `pm,director`
- `APPROVAL_GATES_DESIGN`: `architect,director`
- `APPROVAL_GATES_RELEASE`: `sm,director`

#### 注意事項

- ロール名はカンマ区切りで指定します
- 各ロール名の前後の空白は自動的にトリムされます
- 空のロール名は無視されます
- 環境変数が未設定の場合は、デフォルト値が使用されます

### プロジェクト固有設定ファイル（.michi/config.json）

`.michi/config.json` を作成することで、Confluence/JIRAの動作をカスタマイズできます。

#### 設定ファイルの作成

プロジェクトルートに `.michi/config.json` を作成：

**注意**: 以前は `.kiro/config.json` を使用していましたが、Michi専用の設定ファイルとして `.michi/config.json` に変更されました。

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    },
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto",
    "issueTypes": {
      "story": "10036",
      "subtask": "10037"
    }
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"],
    "approvalGates": {
      "requirements": ["leader", "director"],
      "design": ["leader", "director"],
      "release": ["service-manager", "director"]
    }
  }
}
```

#### 設定値の詳細

すべての設定値の詳細は [設定値リファレンス](../reference/config.md) を参照してください。

#### 設定の優先順位

設定値は以下の優先順位で決定されます：

1. **`spec.json`**: 機能固有の設定（最優先）
2. **`.michi/config.json`**: プロジェクト固有の設定
3. **`~/.michi/config.json`**: グローバル設定
4. **環境変数**: システム環境変数または`.env`ファイル
5. **デフォルト値**: スキーマで定義されたデフォルト値

#### よくある設定パターン

詳細は [カスタマイズガイド](../guides/customization.md) を参照してください。

## 参考リンク

### AI開発フレームワーク

- [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_ja.md)
- [cc-sdd コマンドリファレンス](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/command-reference.md)
- [cc-sdd カスタマイズガイド](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/customization-guide.md)
- [Kiro IDE](https://kiro.dev/docs/)

### バージョン管理

- [Jujutsu (jj) 公式サイト](https://martinvonz.github.io/jj/)
- [Jujutsu インストールガイド](https://martinvonz.github.io/jj/latest/install-and-setup/)

### Atlassian統合

- [Atlassian MCP Server](https://www.atlassian.com/ja/platform/remote-mcp-server)
- [Atlassian API トークン作成](https://id.atlassian.com/manage-profile/security/api-tokens)

### IDE・開発ツール

- [Cursor IDE](https://cursor.sh/)
- [GitHub CLI](https://cli.github.com/)

