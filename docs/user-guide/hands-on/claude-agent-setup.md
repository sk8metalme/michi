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
✅ .kiro/settings/rules/ - Spec-Driven Development用のルールファイル
✅ .kiro/settings/templates/ - Spec用テンプレート（requirements.md, design.md等）
✅ CLAUDE.md - プロジェクトルートへのメインルールファイル
```

**重要な注意事項**:

> `.kiro/settings/`配下のファイルは**cc-sddツールによって自動生成される汎用テンプレート**です。
> - これらのファイルは`.gitignore`に含まれており、**Git管理されません**
> - 各開発者が`npx cc-sdd@latest --claude --lang ja`を実行して生成します
> - cc-sddのバージョンアップにより、最新のベストプラクティスが自動的に反映されます
> - プロジェクト固有の設定は`.kiro/steering/`と`.kiro/specs/`に記載します

### Step 4: Michi固有ファイルの追加

#### 基本セットアップ

```bash
# Michi専用のファイルを追加（Claude Subagents向け）
npx @sk8metal/michi-cli setup-existing --claude-agent --lang ja
```

このコマンドは、デフォルトで以下を実行します：
1. Michiワークフロー用のファイル・ディレクトリを作成
2. プロジェクト固有のSubagent設定を`.claude/agents/`に配置
3. **汎用スキル/サブエージェントを `~/.claude/` にインストール**（自動）
4. スラッシュコマンドを `.claude/commands/michi/` に配置

#### オプション設定

**スキル/サブエージェントのインストールをスキップする場合**:

```bash
# --no-agent-skills オプションを使用
npx @sk8metal/michi-cli setup-existing \
  --claude-agent \
  --lang ja \
  --no-agent-skills
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
✅ .claude/agents/ - Subagent設定ファイル（プロジェクト固有）
✅ .claude/commands/michi/ - Michi専用コマンド
✅ ~/.claude/skills/ - AI開発支援スキル（汎用、自動インストール）
✅ ~/.claude/agents/ - 汎用サブエージェント（自動インストール）
✅ .env - 環境変数テンプレート（権限: 600）
```

**注記**:
- `.kiro/settings/`はStep 3で実行した`cc-sdd`によって生成済みです
- `.claude/agents/`（プロジェクト内）と`~/.claude/agents/`（ホームディレクトリ）は異なります（詳細は下記参照）

#### 💡 プロジェクト固有 vs 汎用のサブエージェント

**重要**: `--claude-agent`環境では、2種類のサブエージェントが使用されます：

| 種類 | 場所 | 用途 | 管理 |
|------|------|------|------|
| **プロジェクト固有** | `.claude/agents/` | プロジェクト独自の開発フロー・ルール | プロジェクトごとにカスタマイズ |
| **汎用** | `~/.claude/agents/` | design-review、oss-license等の一般的な開発支援 | 全プロジェクトで共通利用 |

両方のサブエージェントが同時に利用可能で、名前の衝突はありません。

`--claude` vs `--claude-agent`の詳細な違いについては、[Claude Codeセットアップガイド](./claude-setup.md#-claude-vs-claude-agent-の違い)を参照してください。

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

**エージェントファイルの形式:**

各エージェントファイルはYAML frontmatter形式で定義されています：

```markdown
---
name: developer
description: When implementing code, running tests, or creating pull requests
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Developer Agent

エージェントのシステムプロンプト...
```

**フィールド説明:**

| フィールド | 必須 | 説明 |
|-----------|-----|------|
| `name` | 必須 | エージェントの識別名 |
| `description` | 必須 | エージェントが選択される条件の説明 |
| `tools` | 必須 | エージェントが使用可能なツール |
| `model` | 任意 | 使用するモデル（inherit, sonnet, opusなど） |

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
# │       ├── design.md
# │       ├── requirements.md
# │       └── tasks.md
# ├── steering/                # /kiro:steeringコマンドで作成（Git管理）
# │   ├── product.md
# │   ├── structure.md
# │   └── tech.md
# └── specs/                   # /kiro:spec-initで作成（Git管理）
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

### Step 10: Subagentsの動作確認

Claude Code内でSubagentsが正しく認識されているか確認します：

```bash
# Claude Codeを起動
claude

# Claude Code内で/agentsコマンドを実行してエージェント一覧を確認
/agents
```

**確認ポイント:**
- `.claude/agents/` 配下のエージェントファイルが認識されていること
- 各エージェント（manager-agent, developer, designer, tester）が表示されること

**エージェントの呼び出し方:**

Claude Code内で自然言語を使ってエージェントを呼び出します：

```
# Manager Agentを使用
Use the manager-agent to start requirements definition for health-check-endpoint

# Developer Agentを使用
Use the developer agent to implement the health-check-endpoint feature
```

## ✅ セットアップ完了の確認

以下のチェックリストを確認してください：

- [ ] `michi --version` が正常に動作する
- [ ] `.kiro/project.json` が存在し、正しい内容が含まれている
- [ ] `.env` ファイルが存在し、認証情報が設定されている
- [ ] `.claude/agents/` ディレクトリにSubagent設定ファイル（プロジェクト固有）が存在する
- [ ] `.claude/commands/michi/` ディレクトリにコマンドファイルが存在する
- [ ] `~/.claude/skills/` ディレクトリに汎用スキルが存在する（`--no-agent-skills`を使用しなかった場合）
- [ ] `~/.claude/agents/` ディレクトリに汎用サブエージェントが存在する（`--no-agent-skills`を使用しなかった場合）
- [ ] `gh auth status` が成功する
- [ ] Claude Code内で `/agents` でSubagentが表示される

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

Claude Codeでは、自然言語でエージェントに依頼します。`@agent`記法ではなく、エージェント名を含む文で依頼します：

```
# Manager Agentに依頼
Use the manager-agent to start requirements definition for health-check-endpoint

# Designer Agentに依頼
Use the designer agent to create the design for health-check-endpoint

# Developer Agentに依頼
Use the developer agent to implement health-check-endpoint

# Tester Agentに依頼
Use the tester agent to create tests for health-check-endpoint
```

**利用可能なエージェントの確認:**

```
# Claude Code内でエージェント一覧を確認
/agents
```

### ワークフロー例

```
# Step 1: Manager Agentで要件定義を開始
Use the manager-agent to initialize spec for health-check-endpoint with /kiro:spec-init

# Step 2: Designer Agentで設計書を作成
Use the designer agent to create design with /kiro:spec-design health-check-endpoint

# Step 3: Developer Agentで実装
Use the developer agent to implement with /kiro:spec-impl health-check-endpoint

# Step 4: Tester Agentでテスト確認
Use the tester agent to review test code and check coverage
```

**補足：** 各ステップでClaude Codeが適切なエージェントに処理を委譲し、そのエージェントの権限（toolsで定義）の範囲で作業を実行します。

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
# Subagentディレクトリが存在するか確認
ls -la .claude/agents/

# 期待されるファイル:
# - manager-agent.md
# - developer.md
# - designer.md
# - tester.md

# Subagent設定ファイルの内容を確認
cat .claude/agents/manager-agent.md
```

**確認ポイント:**

1. ファイルがYAML frontmatter形式で始まっているか:
   ```yaml
   ---
   name: manager-agent
   description: When managing project workflow...
   tools: Read, Grep, Glob, Bash
   model: sonnet
   ---
   ```

2. Claude Codeを再起動して、`/agents`コマンドでエージェントが表示されるか確認

#### スキル/サブエージェント（汎用）が見つからない

**症状**: コマンド実行時に「スキルが見つかりません」エラー

**原因**:
- セットアップ時に`--no-agent-skills`オプションを使用した
- `~/.claude/skills/`または`~/.claude/agents/`が削除された

**解決策**:
```bash
# スキル/サブエージェントを再インストール
npx @sk8metal/michi-cli setup-existing --claude-agent --lang ja
```

**Note**: デフォルトでスキル/サブエージェントがインストールされます。`--no-agent-skills`オプションを使用しないでください。

**重要**: `.claude/agents/`（プロジェクト固有）と`~/.claude/agents/`（汎用）は異なります。汎用スキル/サブエージェントは`~/.claude/`配下にインストールされます。

#### エージェント呼び出しが機能しない

```bash
# Claude Code内でエージェント一覧を確認
/agents

# エージェントファイルの構文を確認
# frontmatterが正しいYAML形式であることを確認してください
```

**よくある原因:**

1. **frontmatter形式の誤り**: `---`で囲まれたYAMLブロックが必要
2. **必須フィールドの欠落**: `name`, `description`, `tools`は必須
3. **ファイル拡張子**: `.md`でなければならない
4. **ディレクトリ位置**: `.claude/agents/`配下に配置されていること

#### エージェントが期待通りに動作しない

エージェントの動作はfrontmatterの`description`フィールドに基づいて決定されます。
Claude Codeは依頼内容と`description`をマッチングして適切なエージェントを選択します。

- `description`が曖昧な場合、意図しないエージェントが選択される可能性があります
- より具体的な`description`を設定することで改善できます

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

- [Claude Code公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
- [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd)
- [Michi GitHubリポジトリ](https://github.com/sk8metalme/michi)

## ⚠️ 注意事項

**Subagentsサポートについて**:

Claude Code Subagentsは現在開発中の機能です。一部の機能が正常に動作しない場合があります。

**代替案**:

Subagentsが正常に動作しない場合は、[Claude Codeセットアップガイド](./claude-setup.md)を参照して、通常のClaude Code環境でMichiを使用してください。

**最新情報**:

Subagentsの最新情報は、[Michi GitHubリポジトリ](https://github.com/sk8metalme/michi)で確認してください。
