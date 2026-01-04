# 環境変数リファレンス

このドキュメントでは、Michiで使用するすべての環境変数を説明します。

## 環境変数の読み込み順序

Michiは以下の順序で環境変数を読み込みます。後から読み込まれた値が優先されます。

1. **システム環境変数**
2. **グローバル設定**（`~/.michi/.env`）
3. **プロジェクト設定**（`.env`）← 最優先

## 環境変数一覧

### Atlassian認証（必須）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `ATLASSIAN_URL` | 必須 | - | AtlassianサイトのベースURL（例: `https://your-domain.atlassian.net`） |
| `ATLASSIAN_EMAIL` | 必須 | - | Atlassianアカウントのメールアドレス |
| `ATLASSIAN_API_TOKEN` | 必須 | - | Atlassian API トークン（[取得方法](https://id.atlassian.com/manage-profile/security/api-tokens)） |
| `ATLASSIAN_REQUEST_DELAY` | オプション | `500` | APIリクエスト間隔（ミリ秒）。レートリミット対策 |

### JIRA設定（必須）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `JIRA_PROJECT_KEYS` | 必須 | - | JIRAプロジェクトキー（カンマ区切りで複数指定可能、例: `PROJECT1,PROJECT2`） |
| `JIRA_ISSUE_TYPE_STORY` | 必須 | - | Story Issue Type ID（JIRAインスタンス固有、例: `10036`）。[確認方法](#jira-issue-type-id確認方法) |
| `JIRA_ISSUE_TYPE_SUBTASK` | 必須 | - | Subtask Issue Type ID（JIRAインスタンス固有、例: `10037`）。[確認方法](#jira-issue-type-id確認方法) |
| `JIRA_STORY_POINTS_FIELD` | オプション | `customfield_100` | Story Pointsのカスタムフィールド ID。[確認方法](#カスタムフィールド確認方法) |
| `JIRA_EPIC_LINK_FIELD` | オプション | `customfield_10014` | Epic Linkのカスタムフィールド ID。[確認方法](#カスタムフィールド確認方法) |

#### JIRA Issue Type ID確認方法

**方法1: REST API（推奨）**

```bash
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype
```

レスポンスから `"id"` フィールドを確認してください。

**方法2: JIRA管理画面**

1. JIRA設定 > Issues > Issue types を開く
2. StoryとSub-taskのIssue Type IDを確認

#### カスタムフィールド確認方法

```bash
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/field
```

レスポンスから該当フィールドの `"id"` を確認してください。

### Confluence設定（オプション）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `CONFLUENCE_PRD_SPACE` | オプション | `PRD` | 要件定義書・設計書を保存するスペースキー |
| `CONFLUENCE_QA_SPACE` | オプション | `QA` | テスト関連ドキュメントを保存するスペースキー |
| `CONFLUENCE_RELEASE_SPACE` | オプション | `RELEASE` | リリースノートを保存するスペースキー |
| `CONFLUENCE_AUTO_POLL` | オプション | `false` | 承認ゲートで自動ポーリングを有効にする（`true` or `false`） |
| `CONFLUENCE_APPROVAL_PAGE_ID` | オプション | - | 承認ゲート用のページID（自動ポーリング有効時に必要） |

### GitHub設定（オプション）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `GITHUB_ORG` | オプション | - | GitHub組織名（例: `your-github-org`） |
| `GITHUB_TOKEN` | オプション | - | GitHub Personal Access Token（[取得方法](https://github.com/settings/tokens)） |

**注意**: `GITHUB_REPO` は非推奨です。リポジトリ情報は `.michi/project.json` の `repository` フィールドで管理してください。

### Slack通知（オプション）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `SLACK_WEBHOOK_URL` | オプション | - | Slack Incoming Webhook URL（[取得方法](https://api.slack.com/messaging/webhooks)） |

### ワークフロー承認ゲート（オプション）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `APPROVAL_GATES_REQUIREMENTS` | オプション | `pm,director` | 要件定義後の承認者（カンマ区切り） |
| `APPROVAL_GATES_DESIGN` | オプション | `architect,director` | 設計後の承認者（カンマ区切り） |
| `APPROVAL_GATES_RELEASE` | オプション | `sm,director` | リリース前の承認者（カンマ区切り） |

### リリース設定（オプション）

| 変数名 | 必須/オプション | デフォルト値 | 説明 |
|--------|----------------|--------------|------|
| `RELEASE_VERSION` | オプション | `v1.0.0` | リリースバージョン（例: `v1.2.3`） |

## 設定ファイル構成

### グローバル設定（~/.michi/.env）

すべてのプロジェクトで共通する認証情報を設定します。

**セットアップ**:
```bash
mkdir -p ~/.michi
touch ~/.michi/.env
```

**設定例**:
```bash
# Atlassian認証（組織共通）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定（組織共通）
GITHUB_ORG=your-github-org
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# Confluenceスペース（組織共通）
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRA設定（組織共通）
JIRA_PROJECT_KEYS=PROJECT
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
```

**メリット**:
- すべてのプロジェクトで共通の認証情報を一度だけ定義
- 新しいプロジェクトでも認証情報の再入力が不要

**セキュリティ上の注意**:
- 単一組織の場合: グローバル設定を推奨
- 複数組織の場合: プロジェクトごとに `.env` を設定することを推奨

### プロジェクト設定（.env）

プロジェクト固有の設定や、グローバル設定を上書きする場合に使用します。

**セットアップ**:
```bash
cp env.example .env
# その後、.envを編集
```

**設定例**:
```bash
# プロジェクト固有のJIRA設定
JIRA_PROJECT_KEYS=MY_PROJECT

# プロジェクト固有のConfluenceスペース
CONFLUENCE_PRD_SPACE=MY_PROJECT_PRD

# その他の設定はグローバル設定を使用
```

## 環境変数の検証

設定した環境変数が正しいことを確認します。

### すべての設定を検証

```bash
michi preflight
```

### JIRA接続確認

```bash
michi preflight jira
```

### Confluence接続確認

```bash
michi preflight confluence
```

### セキュリティチェック

```bash
michi config:check-security
```

## 次のステップ

- [トラブルシューティング](../troubleshooting.md) - よくある問題と解決策
- [環境設定ガイド](../getting-started/configuration.md) - 詳細な設定手順
