# 環境設定

Michiを使用するための環境設定について説明します。

## 設定ファイル構成

Michiは以下の設定ファイルを使用します：

| ファイル | 用途 | 必須 | スコープ |
|---------|------|------|----------|
| `.env` | 認証情報・環境変数 | はい | プロジェクト |
| `~/.michi/.env` | グローバル環境変数 | いいえ | 全プロジェクト |
| `~/.michi/config.json` | グローバルワークフロー設定 | いいえ | 全プロジェクト |
| `.kiro/project.json` | プロジェクトメタデータ | 自動生成 | プロジェクト |
| `.michi/config.json` | プロジェクト固有ワークフロー設定 | いいえ | プロジェクト |

**設定の優先順位**（高い順）:
1. `.env`（プロジェクト環境変数）- 最高優先度
2. `.michi/config.json`（プロジェクト固有ワークフロー設定）
3. `.kiro/project.json`（プロジェクトメタデータ）
4. `~/.michi/config.json`（グローバルワークフロー設定）
5. `~/.michi/.env`（グローバル環境変数）
6. デフォルト設定

## グローバル環境変数（~/.michi/.env）

すべてのプロジェクトで共通する認証情報や環境変数を、ホームディレクトリに保存できます。

### 用途

複数のプロジェクトで同じAtlassian組織やGitHub組織を使用する場合、グローバル `.env` に認証情報を一度設定するだけで、すべてのプロジェクトで利用できます。

### セットアップ方法

```bash
mkdir -p ~/.michi
touch ~/.michi/.env
```

その後、以下のような共通の認証情報を記載します：

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

# JIRAプロジェクトキー（組織共通）
JIRA_PROJECT_KEYS=PROJECT

# JIRA Issue Type ID（組織共通）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
```

### メリット

- すべてのプロジェクトで共通の認証情報を一度だけ定義
- 新しいプロジェクトでも認証情報の再入力が不要
- プロジェクト固有の `.env` で必要に応じて上書き可能

### セキュリティ上の注意

**⚠️ 重要**：複数の組織/クライアントで作業する場合は注意が必要です。

- **単一組織の場合**：グローバル `.env` に認証情報を保存すると便利
- **複数組織の場合**：プロジェクトごとに `.env` を設定することを推奨
  - 誤って違う組織の認証情報を使ってしまうリスクを回避

### 配置場所

- **macOS/Linux**: `~/.michi/.env`
- **Windows**: `%USERPROFILE%\.michi\.env`

## .env ファイル設定（プロジェクト固有）

プロジェクトルートに `.env` ファイルを作成します。このファイルはグローバル `.env` より優先されます。

### 必須設定

#### Atlassian認証

```bash
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here
```

**APIトークン取得方法**:
1. [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) にアクセス
2. "Create API token" をクリック
3. トークン名を入力（例: "Michi CLI"）
4. 生成されたトークンをコピーして `ATLASSIAN_API_TOKEN` に設定

#### JIRA Issue Type ID（必須）

```bash
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
```

**Issue Type ID確認方法**:

##### 方法1: JIRA REST API（推奨）

```bash
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype
```

結果から `"id"` フィールドを確認します。

##### 方法2: JIRA管理画面

1. JIRA設定 > Issues > Issue types を開く
2. StoryとSub-taskのIssue Type IDを確認

**注意**: Issue Type IDはJIRAインスタンス固有の値です。上記の例（10036, 10037）をそのまま使用せず、必ず実際の環境のIDを確認してください。

### オプション設定

#### GitHub設定

```bash
GITHUB_ORG=your-github-org
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

#### Confluenceスペース

```bash
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE
```

#### JIRAプロジェクトキー

```bash
JIRA_PROJECT_KEYS=PROJECT
```

#### カスタムフィールド（JIRAプロジェクト固有）

```bash
JIRA_STORY_POINTS_FIELD=customfield_10016
JIRA_EPIC_LINK_FIELD=customfield_10014
```

**カスタムフィールドID確認方法**:

```bash
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/field
```

結果から該当フィールドの `"id"` を確認します。

#### レートリミット対策

```bash
ATLASSIAN_REQUEST_DELAY=500
```

リクエスト間隔をミリ秒で指定します（デフォルト: 500ms）。

#### Slack通知

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

#### ワークフロー承認ゲート

```bash
APPROVAL_GATES_REQUIREMENTS=pm,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=sm,director
```

## グローバル設定（~/.michi/config.json）

すべてのプロジェクトに共通する設定を、ホームディレクトリに保存できます。

### 推奨セットアップ手順

新しいプロジェクトで作業を開始する前に、グローバル設定を作成することを推奨します。

グローバル設定ディレクトリを作成し、設定ファイルを手動で作成します：

```bash
mkdir -p ~/.michi
touch ~/.michi/config.json
```

その後、エディタで `~/.michi/config.json` を開き、以下の設定を記述します：
- Confluence設定（ページ作成単位など）
- JIRA設定（Epic作成、Story Points設定など）
- ワークフロー設定（有効化するフェーズなど）

設定例は下記の「設定例」セクションを参照してください。

### グローバル設定のメリット

- すべてのプロジェクトで共通の設定を一度だけ定義
- 新しいプロジェクトでも即座に利用可能
- プロジェクト固有の設定（`.michi/config.json`）で必要に応じて上書き可能

### 設定例

```json
{
  "confluence": {
    "pageCreationGranularity": "single"
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto"
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"]
  }
}
```

### 配置場所

- **macOS/Linux**: `~/.michi/config.json`
- **Windows**: `%USERPROFILE%\.michi\config.json`

### 手動作成

対話的ツールを使わず、直接ファイルを作成することもできます：

```bash
mkdir -p ~/.michi
touch ~/.michi/config.json
```

その後、上記の設定例を参考に編集してください。

## .michi/config.json 設定（プロジェクト固有）

ワークフロー設定をカスタマイズする場合に使用します。

### 初期設定

`michi init` 実行時に、対話的に設定するか、デフォルト設定が作成されます。

### デフォルト設定例

```json
{
  "confluence": {
    "pageCreationGranularity": "single"
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto"
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"]
  }
}
```

### 設定項目

#### confluence

- `pageCreationGranularity`: ページ作成単位（`"single"` または `"multiple"`）

#### jira

- `createEpic`: Epic作成の有無（`true` または `false`）
- `storyCreationGranularity`: Story作成単位（`"all"` または `"phase"`）
- `storyPoints`: Story Points設定（`"auto"` または数値）

#### workflow

- `enabledPhases`: 有効化するフェーズリスト

## 設定検証

設定が正しいことを確認します。

### 基本検証

```bash
michi preflight
```

すべての設定を確認します。

### 個別検証

#### JIRA接続確認

```bash
michi preflight jira
```

#### Confluence接続確認

```bash
michi preflight confluence
```

### セキュリティチェック

```bash
michi config:check-security
```

## トラブルシューティング

### JIRA Issue Type IDが見つからない

```
❌ Invalid JIRA Issue Type ID
```

原因: `JIRA_ISSUE_TYPE_STORY` または `JIRA_ISSUE_TYPE_SUBTASK` の値が実際のJIRA環境のIssue Type IDと一致していません。

解決策: 上記の「JIRA Issue Type ID確認方法」を参照して、正しいIDを取得してください。

### Atlassian認証エラー

```
❌ Authentication failed
```

原因: ATLASSIAN_API_TOKENが無効、または有効期限切れです。

解決策: 新しいAPIトークンを生成し、`.env` を更新してください。

## 次のステップ

- [CLIコマンドリファレンス](../reference/cli.md) - 使用可能なコマンド
