# Michi セットアップガイド

## 前提条件

- Node.js 20.x以上
- npm 10.x以上
- Git（または Jujutsu (jj) も使用可能）
- Cursor IDE または VS Code
- GitHub CLI (gh) - PR作成時に使用
- **cc-sdd**: AI駆動開発ワークフローのコアフレームワーク

## 1. リポジトリのクローン

```bash
# Gitを使う場合（一般的）
git clone https://github.com/sk8metalme/michi
cd michi

# Jujutsu (jj) を使う場合
# jj git clone https://github.com/sk8metalme/michi
# cd michi
```

## 2. cc-sddのインストール

cc-sddは、Michiの仕様駆動開発ワークフローのコアフレームワークです。

```bash
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

## 3. 依存関係のインストール

```bash
npm install
```

## 4. 環境変数の設定

### 4-1. .env ファイルの作成

```bash
# テンプレートファイルをコピー
cp env.example .env
```

### 4-2. 認証情報の設定

`.env` ファイルを編集して、実際の認証情報を設定します：

```bash
# Atlassian設定
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=<ATLASSIANトークン>

# GitHub設定
GITHUB_ORG=sk8metal
GITHUB_TOKEN=<GitHubトークン>
GITHUB_REPO=sk8metalme/michi

# Confluence設定
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRA設定
JIRA_PROJECT_KEYS=MICHI

# JIRA Issue Type IDs（JIRAインスタンス固有の値 - 必須）
# これらの値は各JIRAインスタンスで異なるため、必ず設定してください。
# 
# 確認方法:
# 1. JIRA管理画面: Settings > Issues > Issue types で確認
# 2. REST API: GET https://your-domain.atlassian.net/rest/api/3/issuetype
#    レスポンスから "Story" と "Subtask" の "id" フィールドを取得
#    例: {"id": "10036", "name": "Story", ...}
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037

# Slack通知（オプション）
SLACK_WEBHOOK_URL=<SlackWebhook URL>

# ワークフロー承認ゲート（オプション）
# カンマ区切りでロール名を指定。未設定の場合はデフォルト値を使用
APPROVAL_GATES_REQUIREMENTS=pm,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=sm,director
```

### 4-3. ワークフロー承認ゲートの設定（オプション）

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

### 4-4. 認証トークンの取得方法

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

## 5. Atlassian MCP サーバーの設定

### 5-1. MCP設定ファイルの作成

プロジェクトルートの `mcp.json.example` を参考に、ホームディレクトリに `~/.cursor/mcp.json` を作成：

```bash
# テンプレートをコピー
mkdir -p ~/.cursor
cp mcp.json.example ~/.cursor/mcp.json
```

### 5-2. 実際の認証情報に置き換え

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

## 6. プロジェクトメタデータの確認

`.kiro/project.json` を確認・編集：

```json
{
  "projectId": "michi",
  "projectName": "Michi - Managed Intelligent Comprehensive Hub for Integration",
  "jiraProjectKey": "MICHI",
  "confluenceLabels": ["project:michi", "service:hub"],
  "status": "active",
  "team": ["@developer1"],
  "stakeholders": ["@pm", "@director"]
}
```

## 6-2. プロジェクト固有設定ファイル（オプション）

`.michi/config.json` を作成することで、Confluence/JIRAの動作をカスタマイズできます。

### 設定ファイルの作成

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

### 設定値の詳細

すべての設定値の詳細は [設定値リファレンス](./config-reference.md) を参照してください。

### 設定の優先順位

設定値は以下の優先順位で決定されます：

1. **`spec.json`**: 機能固有の設定（最優先）
2. **`.michi/config.json`**: プロジェクト固有の設定
3. **環境変数**: システム環境変数または`.env`ファイル
4. **デフォルト値**: スキーマで定義されたデフォルト値

### 設定のバリデーション

設定ファイルは実行前に自動的にバリデーションされます。手動でバリデーションを実行する場合：

```bash
# Michiプロジェクトディレクトリで実行
npx tsx scripts/utils/config-validator.ts

# または、別のプロジェクトディレクトリで実行
npx tsx /path/to/michi/scripts/utils/config-validator.ts /path/to/project
```

### よくある設定パターン

詳細は [カスタマイズガイド](./customization-guide.md) を参照してください。

## 7. Cursor IDE の設定

### 7-1. Cursor でプロジェクトを開く

```bash
cursor .
```

### 7-2. 利用可能なコマンドの確認

Cursor のコマンドパネル（Cmd+Shift+P）で `/kiro:` と入力すると、以下のコマンドが表示されます：

- `/kiro:spec-init <機能説明>` - 新機能の仕様を初期化
- `/kiro:spec-requirements <feature>` - 要件定義を生成
- `/kiro:spec-design <feature>` - 設計ドキュメントを生成
- `/kiro:spec-tasks <feature>` - 実装タスクを生成
- `/kiro:spec-impl <feature> <tasks>` - TDDで実装
- `/kiro:steering` - プロジェクトステアリングを作成/更新

凡例の詳細は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 8. 動作確認

### 8-1. TypeScript コンパイル確認

```bash
npm run type-check
```

### 8-2. スクリプトの動作確認

```bash
# プロジェクト一覧の表示（準備中）
npm run project:list
```

## トラブルシューティング

### npm install でエラーが出る

キャッシュをクリア：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

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

## 次のステップ

セットアップが完了したら、以下のドキュメントを参照：

- [ワークフローガイド](./workflow.md) - AI開発フロー
- [マルチプロジェクト管理](./multi-project.md) - 複数プロジェクト管理
- [API仕様](./api.md) - スクリプトAPI仕様

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

