# AIツール統合ガイド

Michiは、Claude Code以外のAI開発ツールもサポートしています。
このガイドでは、Cursor、Gemini CLI、Codex CLI、Clineの各ツールでMichiを使用するためのセットアップと基本的な使い方を説明します。

## 対応AIツール一覧

| ツール | 種別 | 推奨用途 | セットアップコマンド |
|--------|------|---------|---------------------|
| Claude Code | CLI | メイン開発ツール | `michi setup --claude` |
| Cursor | エディタ統合 | コード編集・生成 | `michi setup --cursor` |
| Gemini CLI | CLI | Google AI活用 | `michi setup --gemini` |
| Codex CLI | CLI | プロンプトベース開発 | `michi setup --codex` |
| Cline | VS Code拡張 | エディタ統合AI | `michi setup --cline` |

**注意**: すべてのツールで同じワークフロー（`/kiro:*`、`/michi:*`コマンド）が利用可能です。

## 共通セットアップ手順

### 1. cc-sddのインストール

すべてのツールで、まずcc-sddをインストールします。

```bash
npx cc-sdd@latest --lang ja
```

**生成されるファイル**:
- `.kiro/settings/` - cc-sdd標準のルール、テンプレート（`.gitignore`対象）
- `.kiro/steering/` - プロジェクト固有のコンテキスト
- `.kiro/specs/` - 機能仕様（Git管理）

### 2. 環境変数の設定（オプション）

JIRA/Confluence連携を使用する場合、環境変数を設定してください。

```bash
# .envファイルに以下を追加
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

詳細は [環境変数リファレンス](../reference/environment-variables.md) を参照してください。

## Cursor

### 概要

Cursorは、AI統合エディタです。コードエディタ内でAIによるコード生成、リファクタリング、ドキュメント作成を行えます。

### セットアップ

```bash
# Cursor固有の拡張をインストール
michi setup --cursor
```

**生成されるファイル**:
- `.cursor/rules/` - Cursor固有ルール
  - `michi-core.md` - Michi基本原則
  - `atlassian-mcp.md` - Atlassian MCP統合
  - `github-ssot.md` - GitHub SSoT原則
  - `multi-project.mdc` - マルチプロジェクト管理
- `.cursor/commands/michi/` - Michiコマンド
  - `confluence-sync.md` - Confluence同期
  - `project-switch.md` - プロジェクト切り替え
- `.cursor/commands/kiro/` - Kiroコマンド
  - `kiro-spec-tasks.md` - タスク分割
  - `kiro-spec-impl.md` - TDD実装

### 利用可能なコマンド

Cursorでは、以下のコマンドが利用できます：

```bash
# cc-sdd標準コマンド
/kiro:spec-init "機能の説明"
/kiro:spec-requirements {feature}
/kiro:spec-design {feature}
/michi:spec-tasks {feature}
/kiro:spec-impl {feature}

# Michi拡張コマンド
/michi:confluence-sync {feature} {type}
/michi:project-switch
```

### 特徴

- エディタ内でのリアルタイムコード提案
- MCP（Model Context Protocol）によるAtlassian統合
- プロジェクト切り替え機能

## Gemini CLI

### 概要

Gemini CLIは、Google AIを活用したCLIツールです。プロンプトベースで仕様書やコードを生成できます。

### セットアップ

```bash
# Gemini CLI固有の拡張をインストール
michi setup --gemini
```

**生成されるファイル**:
- `.gemini/GEMINI.md` - Gemini CLI設定
- `.gemini/commands/` - Gemini CLI専用コマンド

### 利用可能なコマンド

Gemini CLIでは、以下のコマンドが利用できます：

```bash
# cc-sdd標準コマンド
/kiro:spec-init "機能の説明"
/kiro:spec-requirements {feature}
/kiro:spec-design {feature}
/michi:spec-tasks {feature}
/kiro:spec-impl {feature}

# Gemini固有の操作
# GitHubにコミット後、Confluence同期を実行
michi confluence:sync {feature} requirements
```

### 特徴

- Google AIの最新モデルを使用
- プロジェクトコンテキスト（`.kiro/project.json`）の自動参照
- GitHub SSoT原則（GitHub→Confluence同期）

## Codex CLI

### 概要

Codex CLIは、プロンプトベースのAI開発ツールです。エージェントベースのワークフローをサポートします。

### セットアップ

```bash
# Codex CLI固有の拡張をインストール
michi setup --codex
```

**生成されるファイル**:
- `AGENTS.override.md` - Codex CLI用エージェント設定
- `.codex/prompts/` - Codex CLI専用プロンプト
  - `confluence-sync.md` - Confluence同期プロンプト

### 利用可能なプロンプト

Codex CLIでは、以下のプロンプトが利用できます：

```bash
# cc-sdd標準フロー
/kiro:spec-init FEATURE=calculator-app
/kiro:spec-requirements FEATURE=calculator-app
/kiro:spec-design FEATURE=calculator-app
/michi:spec-tasks FEATURE=calculator-app
/kiro:spec-impl FEATURE=calculator-app

# Michi拡張プロンプト
/prompts:confluence-sync FEATURE=calculator-app
```

### 特徴

- エージェントベースのワークフロー
- Michi固有のテスト戦略（マスタテスト方式）
- 対応言語: Node.js、Java（Gradle）、PHP

### テスト戦略

Codex CLIでは、Michi固有のマスタテスト方式を採用しています。

**Phase A（PR時に自動実行）**:
- 単体テスト
- Lint
- ビルド

**Phase B（リリース前に手動実行）**:
- 統合テスト
- E2Eテスト
- パフォーマンステスト
- セキュリティテスト

詳細は [ワークフローガイド](workflow.md) を参照してください。

## Cline

### 概要

Clineは、VS Code拡張機能として動作するAIツールです。エディタ内でAIによるコード生成、リファクタリング、ドキュメント作成を行えます。

### セットアップ

```bash
# Cline固有の拡張をインストール
michi setup --cline
```

**生成されるファイル**:
- `.clinerules/rules/` - Cline固有ルール
  - `michi-core.md` - Michi基本原則
  - `atlassian-integration.md` - Atlassian統合ルール

### 利用可能な機能

Clineでは、以下の機能が利用できます：

```bash
# cc-sdd標準コマンド
/kiro:spec-init "機能の説明"
/kiro:spec-requirements {feature}
/kiro:spec-design {feature}
/michi:spec-tasks {feature}
/kiro:spec-impl {feature}

# Michi拡張
# エディタ内でAtlassian統合を使用
```

### 特徴

- VS Code拡張として動作
- エディタ内でのリアルタイムコード提案
- GitHub SSoT原則のサポート
- Multi-Project管理機能

## 共通注意事項

### ワークフローの一貫性

すべてのAIツールで、同じワークフロー（cc-sdd + Michi拡張）が利用できます。

**基本フロー**:
```
Phase 0.0 → 0.1 → 0.2 → 0.5 → Phase 2
```

**完全フロー（Michi拡張含む）**:
```
Phase 0.0 → 0.1 → 0.2 → [0.3-0.4] → 0.5 → 0.6-0.7
  → Phase 1 → Phase 2 → Phase A → Phase 3 → Phase B → Phase 4-5
```

詳細は [ワークフローガイド](workflow.md) を参照してください。

### GitHub SSoT原則

すべてのツールで、GitHub SSoT（Single Source of Truth）原則を遵守します。

**基本原則**:
- すべての仕様はGitHub（`.kiro/specs/`）で管理
- Confluenceは参照と承認のみ（編集はGitHubのみ）
- 重複管理を避ける

**データフロー**:
```
GitHub (.kiro/specs/)  ← 真実の源（編集可能）
    ↓ 同期
Confluence ← 表示と承認（読み取り専用）
```

### Multi-Project管理

すべてのツールで、Multi-Project管理機能が利用できます。

**プロジェクトメタデータ**（`.kiro/project.json`）:
```json
{
  "projectId": "my-project",
  "jiraProjectKey": "MYPROJ",
  "confluenceSpaceKey": "MYSPACE",
  "confluenceLabels": ["ai-development", "michi"]
}
```

詳細は [Multi-Repoガイド](multi-repo.md) を参照してください。

### コマンド実行方法の違い

| ツール | コマンド形式 | 実行場所 |
|--------|------------|---------|
| Claude Code | `/kiro:*`, `/michi:*` | CLI |
| Cursor | `/kiro:*`, `/michi:*` | エディタ内 |
| Gemini CLI | `/kiro:*`, `michi *` | CLI |
| Codex CLI | `/kiro:*`, `/prompts:*` | CLI |
| Cline | `/kiro:*`, `/michi:*` | VS Code拡張 |

## 推奨ツールの選び方

| 用途 | 推奨ツール | 理由 |
|------|-----------|------|
| メイン開発 | Claude Code | 最も完全な統合、サブエージェント機能 |
| コード編集 | Cursor | エディタ統合、リアルタイム提案 |
| Google AI活用 | Gemini CLI | Google AIの最新モデル |
| プロンプトベース | Codex CLI | エージェントベースワークフロー |
| VS Code統合 | Cline | VS Code拡張、エディタ内完結 |

## 関連ドキュメント

- [Claude Codeセットアップガイド](claude-code.md) - Claude Code固有のセットアップ
- [AIコマンドリファレンス](../reference/ai-commands.md) - すべてのコマンドの詳細
- [ワークフローガイド](workflow.md) - 開発ワークフロー全体像
- [Atlassian連携ガイド](atlassian-integration.md) - JIRA/Confluence連携の詳細
- [環境変数リファレンス](../reference/environment-variables.md) - 環境変数の詳細設定
- [トラブルシューティング](../troubleshooting.md) - よくある問題と解決策
