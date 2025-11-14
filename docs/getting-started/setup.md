# Michi セットアップガイド

> **このガイドについて**: 既存のプロジェクトにMichiを導入する手順です。  
> 新規プロジェクトを作成する場合は [新規リポジトリセットアップガイド](./new-project-setup.md) を参照してください。  
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

## Step 2: cc-sddのインストール

**重要**: 作業するプロジェクトのルートディレクトリで実行してください。

cc-sddは、Michiの仕様駆動開発ワークフローのコアフレームワークです。

```bash
# 作業プロジェクトのルートディレクトリに移動
cd /path/to/your-project

# Cursor IDE を使用する場合
npx cc-sdd@latest --lang ja --cursor

# Claude Code を使用する場合
npx cc-sdd@latest --lang ja --claude

# Gemini CLI を使用する場合
npx cc-sdd@latest --lang ja --gemini

# Codex CLI を使用する場合
npx cc-sdd@next --lang ja --codex

# GitHub Copilot を使用する場合
npx cc-sdd@next --lang ja --copilot

# Windsurf IDE を使用する場合
npx cc-sdd@next --lang ja --windsurf
```

**実行内容:**
- `.kiro/settings/` にテンプレート作成
- `.cursor/commands/kiro/` または `.claude/commands/kiro/` にコマンド作成
- `AGENTS.md` または `CLAUDE.md` にプロジェクト設定追加

詳細: [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_ja.md)

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
# 開発したいリポジトリ
GITHUB_REPO=your-org/user-auth

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

**`GITHUB_REPO`**
- **確認方法**: GitHubリポジトリのURLから取得
- **確認手順**:
  1. リポジトリのページにアクセス（例: `https://github.com/org/repo`）
  2. URLの `/org/repo` 部分がリポジトリ名
- **形式**: `組織名/リポジトリ名`
- **例**: `sk8metalme/michi`
- **使用機能**:
  - PR自動作成（`michi github:create-pr`）: 指定されたリポジトリにPull Requestを作成（ワークフロー自動化で使用）

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
```bash
gh auth login
gh auth token
```

生成されたトークンを `.env` の `GITHUB_TOKEN` に設定

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

> **補足**: 新規プロジェクトを作成する場合や、既存プロジェクトにMichiを自動導入する場合は [新規プロジェクトセットアップガイド](./new-project-setup.md) を参照してください。

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

### MCP サーバーが動作しない

1. Cursor を再起動
2. `~/.cursor/mcp.json` の認証情報を確認
3. Atlassian API Token が有効か確認

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
3. **環境変数**: システム環境変数または`.env`ファイル
4. **デフォルト値**: スキーマで定義されたデフォルト値

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

