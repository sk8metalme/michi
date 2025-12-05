# Claude Subagentsセットアップガイド

このガイドでは、Claude Code Subagents（マルチエージェント環境）でMichiを使用するためのセットアップ手順を説明します。

## 📋 前提条件

以下がインストール済みであることを確認してください：

- **Node.js**: 20.x以上
- **npm**: 10.x以上
- **Git**: 最新版（または Jujutsu (jj)）
- **GitHub CLI (gh)**: 最新版
- **Claude Code CLI**: 最新版（Subagentsサポート版）

### インストール確認

```bash
# バージョン確認
node --version    # v20.0.0以上
npm --version     # 10.0.0以上
git --version     # または jj --version
gh --version
claude --version  # Claude Code CLI（Subagents対応版）
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
# cc-sddをインストール（Claude Subagents向け、日本語）
# 注: 現在はcc-sddのSubagents対応バージョンを待っています
# 暫定的にclaude版を使用
npx cc-sdd@latest --claude --lang ja
```

**実行結果の確認**:

```
✅ .kiro/settings/ - Spec-Driven Development用のルールとテンプレート
✅ .claude/rules/ - Claude固有のルールファイル（廃止予定）
✅ AGENTS.md - エージェント設定（廃止予定）
```

**重要な注意事項**:

> `.kiro/settings/`配下のファイルは**cc-sddツールによって自動生成される汎用テンプレート**です。
> - これらのファイルは`.gitignore`に含まれており、**Git管理されません**
> - 各開発者が`npx cc-sdd@latest --claude --lang ja`を実行して生成します
> - cc-sddのバージョンアップにより、最新のベストプラクティスが自動的に反映されます
> - プロジェクト固有の設定は`.kiro/steering/`と`.kiro/specs/`に記載します

### Step 4: Michi固有ファイルの追加

```bash
# Michi専用のファイルを追加（Claude Subagents向け）
npx @sk8metal/michi-cli setup-existing --claude-agent --lang ja
```

**対話的プロンプト**:

セットアップコマンドを実行すると、以下の情報を対話的に入力するよう求められます：

```
環境を選択してください:
  1) Cursor IDE (推奨)
  2) Claude Code
  3) Claude Code Subagents

選択 [1-3] (デフォルト: 1): 3

プロジェクト名（例: プロジェクトA）: サンプルプロジェクト

JIRAプロジェクトキー（例: PRJA）: DEMO

✅ 設定:
   プロジェクト名: サンプルプロジェクト
   JIRA: DEMO
   環境: claude-agent
   言語: ja

この設定で続行しますか？ [Y/n]: Y
```

**実行結果の確認**:

```
✅ .kiro/steering/ - Steeringテンプレート
✅ .kiro/project.json - プロジェクトメタデータ
✅ .claude/agents/ - Subagent設定ファイル
✅ .claude/commands/michi/ - Michi専用コマンド
✅ .env - 環境変数テンプレート（権限: 600）
```

**注記**: `.kiro/settings/`はStep 3で実行した`cc-sdd`によって生成済みです。

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

### Step 6: Subagent設定の確認

Subagent設定ファイルが正しく生成されているか確認します：

```bash
# Subagentディレクトリを確認
ls -la .claude/agents/

# 期待されるファイル:
# - manager-agent.md    # マネージャーエージェント
# - developer.md        # 開発エージェント
# - designer.md         # 設計エージェント
# - tester.md          # テストエージェント
```

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
tree -L 3 .kiro .claude

# 期待される構造:
# .kiro/
# ├── project.json              # Michiで管理（Gitにコミット）
# ├── settings/                 # cc-sddで生成（Git管理外）
# │   ├── rules/               # Spec-Driven Development用ルール
# │   └── templates/           # Spec用テンプレート
# ├── steering/                # Michiで管理（Gitにコミット）
# │   ├── product.md
# │   ├── structure.md
# │   └── tech.md
# └── specs/                   # 各機能の仕様（Gitにコミット）
#
# .claude/
# ├── commands/
# │   └── michi/
# │       ├── confluence-sync.md
# │       └── project-switch.md
# ├── agents/
# │   ├── manager-agent.md
# │   ├── developer.md
# │   ├── designer.md
# │   └── tester.md
# └── README.md
```

### Step 10: Subagentsの初期化

Claude Code Subagentsを初期化します：

```bash
# Subagentsを初期化
claude agent init

# Subagent一覧を確認
claude agent list
```

## ✅ セットアップ完了の確認

以下のチェックリストを確認してください：

- [ ] `michi --version` が正常に動作する
- [ ] `.kiro/project.json` が存在し、正しい内容が含まれている
- [ ] `.env` ファイルが存在し、認証情報が設定されている
- [ ] `.claude/agents/` ディレクトリにSubagent設定ファイルが存在する
- [ ] `.claude/commands/michi/` ディレクトリにコマンドファイルが存在する
- [ ] `gh auth status` が成功する
- [ ] `claude agent list` でSubagentが表示される

## 🎯 次のステップ

セットアップが完了したら、[ワークフロー体験ガイド](./workflow-walkthrough.md)に進んでください。

実際にサンプル機能（`health-check-endpoint`）を使って、Michiの全ワークフローを体験できます。

## 💡 Claude Subagents特有の使い方

### マルチエージェント開発フロー

Claude Subagentsでは、複数のエージェントが協調してタスクを処理します：

#### エージェントの役割

1. **Manager Agent** (`manager-agent`)
   - プロジェクト全体の管理
   - タスクの割り当て
   - 進捗管理

2. **Developer Agent** (`developer`)
   - コード実装
   - TDD実行
   - PR作成

3. **Designer Agent** (`designer`)
   - 設計書作成
   - アーキテクチャ決定
   - API設計

4. **Tester Agent** (`tester`)
   - テスト設計
   - テスト実行
   - 品質保証

### エージェントの呼び出し方

```
# Managerエージェントを呼び出し
ユーザー: @manager-agent health-check-endpointの要件定義を開始してください

# Designerエージェントを呼び出し
ユーザー: @designer health-check-endpointの設計を作成してください

# Developerエージェントを呼び出し
ユーザー: @developer health-check-endpointを実装してください

# Testerエージェントを呼び出し
ユーザー: @tester health-check-endpointのテストを作成してください
```

### ワークフロー例

```
# Step 1: Managerが要件定義を開始
@manager-agent /kiro:spec-init health-check-endpoint

# Step 2: Designerが設計書を作成
@designer /kiro:spec-design health-check-endpoint

# Step 3: Developerが実装
@developer /kiro:spec-impl health-check-endpoint

# Step 4: Testerがテスト
@tester テストコードをレビューして、カバレッジを確認してください
```

### エージェント間の連携

エージェントは自動的に必要な情報を共有します：

```
Manager → Designer: 要件定義を渡す
Designer → Developer: 設計書を渡す
Developer → Tester: 実装コードを渡す
Tester → Manager: テスト結果を報告
```

## 🆘 トラブルシューティング

セットアップ中に問題が発生した場合は、[トラブルシューティングガイド](./troubleshooting.md)を参照してください。

### Subagents特有の問題

#### Subagentが認識されない

```bash
# Subagent設定を再読み込み
claude agent reload

# Subagentディレクトリを確認
ls -la .claude/agents/

# Subagent設定ファイルの内容を確認
cat .claude/agents/manager-agent.md
```

#### エージェント呼び出しエラー

```bash
# エージェント一覧を確認
claude agent list

# 特定のエージェントの状態を確認
claude agent status manager-agent
```

#### エージェント間の通信エラー

```bash
# ログを確認
claude agent logs

# デバッグモードで実行
claude agent debug
```

### よくある問題

#### npm installがエラーになる

```bash
# キャッシュをクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### GitHub認証エラー

```bash
# 認証を再実行
gh auth logout
gh auth login
gh auth setup-git
```

#### .envファイルの権限エラー

```bash
# 権限を600に設定（所有者のみ読み書き可能）
chmod 600 .env
```

## 📚 関連ドキュメント

- [ワークフロー体験ガイド](./workflow-walkthrough.md) - 次のステップ
- [検証チェックリスト](./verification-checklist.md) - 動作確認
- [セットアップガイド](../getting-started/setup.md) - 詳細な設定
- [クイックリファレンス](../reference/quick-reference.md) - コマンド一覧

## 🔗 外部リンク

- [Claude Code公式ドキュメント](https://claude.ai/code)
- [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd)
- [Michi GitHubリポジトリ](https://github.com/sk8metalme/michi)

## ⚠️ 注意事項

**Subagentsサポートについて**:

Claude Code Subagentsは現在開発中の機能です。一部の機能が正常に動作しない場合があります。

**代替案**:

Subagentsが正常に動作しない場合は、[Claude Codeセットアップガイド](./claude-setup.md)を参照して、通常のClaude Code環境でMichiを使用してください。

**最新情報**:

Subagentsの最新情報は、[Michi GitHubリポジトリ](https://github.com/sk8metalme/michi)で確認してください。
