# Cursor IDEセットアップガイド

このガイドでは、Cursor IDEでMichiを使用するためのセットアップ手順を説明します。

## 📋 前提条件

以下がインストール済みであることを確認してください：

- **Node.js**: 20.x以上
- **npm**: 10.x以上
- **Git**: 最新版（または Jujutsu (jj)）
- **GitHub CLI (gh)**: 最新版
- **Cursor IDE**: 最新版

### インストール確認

```bash
# バージョン確認
node --version    # v20.0.0以上
npm --version     # 10.0.0以上
git --version     # または jj --version
gh --version

# Cursor IDEがインストールされているか確認
cursor --version
```

## 🚀 セットアップ手順

### Step 1: Michiのインストール

#### 方法A: NPMパッケージからインストール（推奨）

```bash
# グローバルインストール
npm install -g @sk8metal/michi-cli

# インストール確認
michi --version
michi --help
```

#### 方法B: リポジトリからクローン（開発者向け）

```bash
# リポジトリをクローン
git clone https://github.com/sk8metalme/michi
cd michi

# 依存関係のインストール
npm install

# ビルド
npm run build

# グローバルコマンドとしてリンク
npm link
```

### Step 2: 既存プロジェクトへのMichi導入

既存のプロジェクトディレクトリに移動します：

```bash
# プロジェクトディレクトリに移動
cd /path/to/your-project
```

### Step 3: cc-sddのインストール

MichiはAI駆動開発ワークフローのコアフレームワークとして[cc-sdd](https://github.com/gotalab/cc-sdd)を使用します。

```bash
# cc-sddをインストール（Cursor IDE向け、日本語）
npx cc-sdd@latest --cursor --lang ja
```

**実行結果の確認**:

```
✅ .kiro/settings/rules/ - Spec-Driven Development用のルールファイル
✅ .kiro/settings/templates/ - Spec用テンプレート（requirements.md, design.md等）
✅ CLAUDE.md - プロジェクトルートへのメインルールファイル
```

### Step 4: Michi固有ファイルの追加

```bash
# Michi専用のファイルを追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
```

**対話的プロンプト**:

セットアップコマンドを実行すると、以下の情報を対話的に入力するよう求められます：

```
環境を選択してください:
  1) Cursor IDE (推奨)
  2) Claude Code
  3) Claude Code Subagents

選択 [1-3] (デフォルト: 1): 1

プロジェクト名（例: プロジェクトA）: サンプルプロジェクト

JIRAプロジェクトキー（例: PRJA）: DEMO

✅ 設定:
   プロジェクト名: サンプルプロジェクト
   JIRA: DEMO
   環境: cursor
   言語: ja

この設定で続行しますか？ [Y/n]: Y
```

**実行結果の確認**:

```
✅ .kiro/settings/templates/ - Specテンプレート
✅ .kiro/steering/ - Steeringテンプレート
✅ .kiro/project.json - プロジェクトメタデータ
✅ .cursor/commands/michi/ - Michi専用コマンド
✅ .env - 環境変数テンプレート（権限: 600）
```

### Step 5: 環境変数の設定

`.env`ファイルが自動生成されているので、認証情報を設定します：

```bash
# .envファイルを編集
vim .env
```

**最小限の設定（GitHub連携のみ）**:

```bash
# GitHub設定（必須）
GITHUB_TOKEN=ghp_your_token_here
GITHUB_ORG=your-org
GITHUB_REPO=your-org/your-repo
```

**完全な設定（Confluence/JIRA連携も使用）**:

```bash
# Atlassian設定
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=your-org/your-repo

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRAプロジェクトキー
JIRA_PROJECT_KEYS=DEMO

# JIRA Issue Type IDs（JIRAインスタンス固有 - 必須）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
```

#### JIRA Issue Type IDの取得方法

JIRA Issue Type IDは、JIRAインスタンスごとに異なるため、以下の方法で確認してください：

**方法1: JIRA管理画面で確認**

1. JIRA管理画面にログイン
2. Settings > Issues > Issue types
3. 「Story」と「Subtask」のIDを確認

**方法2: REST APIで確認**

```bash
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype
```

レスポンスから「Story」と「Subtask」の`id`フィールドを取得します。

### Step 6: MCP設定（オプション）

Cursor IDEでAtlassian MCPを使用する場合、MCP設定を行います。

```bash
# MCPテンプレートをコピー（Michiリポジトリから）
cp /path/to/michi/mcp.json.example ~/.cursor/mcp.json

# 設定ファイルを編集
vim ~/.cursor/mcp.json
```

**mcp.json設定例**:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": [
        "-y",
        "@atlassian/mcp-server-atlassian@latest"
      ],
      "env": {
        "ATLASSIAN_URL": "https://your-domain.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

**注意**: MCP設定後、Cursor IDEを再起動してください。

### Step 7: 依存関係のインストール

プロジェクトルートで依存関係をインストールします：

```bash
npm install
```

### Step 8: GitHub認証の確認

GitHub CLIが正しく認証されているか確認します：

```bash
# 認証状態を確認
gh auth status

# 認証が必要な場合
gh auth login
gh auth setup-git
```

### Step 9: セットアップの確認

すべてのファイルが正しく生成されているか確認します：

```bash
# ディレクトリ構造を確認
tree -L 3 .kiro .cursor

# 期待される構造:
# .kiro/
# ├── project.json              # Michiで管理（Gitにコミット）
# ├── settings/                 # cc-sddで生成（Git管理外）
# │   ├── rules/               # Spec-Driven Development用ルール
# │   └── templates/           # Spec用テンプレート
# │       ├── design.md
# │       ├── requirements.md
# │       └── tasks.md
# ├── steering/                # /kiro:steeringコマンドで作成（Git管理）
# │   ├── product.md
# │   ├── structure.md
# │   └── tech.md
# └── specs/                   # /kiro:spec-initで作成（Git管理）
#
# .cursor/
# ├── commands/
# │   └── michi/
# │       ├── confluence-sync.md
# │       └── project-switch.md
# └── rules/
#     ├── atlassian-mcp.mdc
#     ├── github-ssot.mdc
#     └── multi-project.mdc
```

### Step 10: Cursor IDEで開く

```bash
# Cursor IDEでプロジェクトを開く
cursor .
```

## ✅ セットアップ完了の確認

以下のチェックリストを確認してください：

- [ ] `michi --version` が正常に動作する
- [ ] `.kiro/project.json` が存在し、正しい内容が含まれている
- [ ] `.env` ファイルが存在し、認証情報が設定されている
- [ ] `.cursor/rules/` ディレクトリにルールファイルが存在する
- [ ] `.cursor/commands/michi/` ディレクトリにコマンドファイルが存在する
- [ ] `gh auth status` が成功する
- [ ] Cursor IDEでプロジェクトが開ける

## 🎯 次のステップ

セットアップが完了したら、[ワークフロー体験ガイド](./workflow-walkthrough.md)に進んでください。

実際にサンプル機能（`health-check-endpoint`）を使って、Michiの全ワークフローを体験できます。

## 🆘 トラブルシューティング

セットアップ中に問題が発生した場合は、[トラブルシューティングガイド](./troubleshooting.md)を参照してください。

よくある問題：

### npm installがエラーになる

```bash
# キャッシュをクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### GitHub認証エラー

```bash
# 認証を再実行
gh auth logout
gh auth login
gh auth setup-git
```

### Cursor IDEでコマンドが認識されない

1. Cursor IDEを再起動
2. `.cursor/commands/` ディレクトリが存在するか確認
3. コマンドファイル（`.md`）が存在するか確認

### .envファイルの権限エラー

```bash
# 権限を600に設定（所有者のみ読み書き可能）
chmod 600 .env
```

## 📚 関連ドキュメント

- [ワークフロー体験ガイド](./workflow-walkthrough.md) - 次のステップ
- [検証チェックリスト](./verification-checklist.md) - 動作確認
- [セットアップガイド](../getting-started/setup.md) - 詳細な設定
- [クイックリファレンス](../reference/quick-reference.md) - コマンド一覧





