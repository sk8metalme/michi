# Michi (道)

**M**anaged **I**ntelligent **C**omprehensive **H**ub for **I**ntegration

AI駆動開発ワークフロー自動化プラットフォーム

[![npm version](https://badge.fury.io/js/@sk8metal%2Fmichi-cli.svg?icon=si%3Anpm)](https://badge.fury.io/js/@sk8metal%2Fmichi-cli)
[![CI](https://github.com/sk8metalme/michi/actions/workflows/ci.yml/badge.svg)](https://github.com/sk8metalme/michi/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sk8metalme/michi/branch/main/graph/badge.svg)](https://codecov.io/gh/sk8metalme/michi)

## 概要

Michiは、開発フロー全体（要件定義→設計→タスク分割→実装→テスト→リリース）をAIで自動化するプラットフォームです。

**Powered by [cc-sdd](https://github.com/gotalab/cc-sdd)**

### 主な機能

- ✅ **AI駆動開発**: Claude Code統合
- ✅ **テスト計画統合**: Phase 0.3-0.4でテストタイプ選択とテスト仕様書作成
- ✅ **品質自動化**: OSSライセンスチェック、バージョン監査、自動レビュー
- ✅ **Confluence/JIRA連携**: 自動同期、タスク管理、進捗追跡
- ✅ **Multi-Repo管理**: マイクロサービス・モノレポ対応
- ✅ **多言語サポート**: Node.js、Java（Gradle）、PHP対応

### コードアーキテクチャ

Michiは**オニオンアーキテクチャ（4層構造）**を採用しています：

```
┌─────────────────────────────────────────┐
│       Presentation Layer (CLI)          │  ← ユーザーインターフェース
├─────────────────────────────────────────┤
│       Application Layer (Use Cases)     │  ← ビジネスロジック調整
├─────────────────────────────────────────┤
│    Infrastructure Layer (External APIs) │  ← 外部サービス統合
├─────────────────────────────────────────┤
│       Domain Layer (Business Logic)     │  ← コアビジネスルール
└─────────────────────────────────────────┘
```

**ハイブリッドアプローチ**:
- `src/` - プロダクションコード（4層構造）
- `scripts/` - ビルド・開発ツール（層なし）

詳細は [アーキテクチャガイド](docs/architecture.md) と [移行ガイド](docs/MIGRATION.md) を参照してください。

### ワークフローアーキテクチャ

```text
GitHub (.kiro/specs/) ← 情報源（Single Source of Truth）
    ↓ 自動同期
Confluence ← ドキュメント管理
JIRA ← タスク管理・進捗追跡
```

## クイックスタート

### Claude Codeプラグイン（推奨）

**前提条件**: cc-sdd（Spec-Driven Development Core）をセットアップ

```bash
npx cc-sdd@latest --claude --lang ja
```

**Michiプラグインのインストール** - Claude Code内で実行:

```
/plugin marketplace add sk8metalme/michi
/plugin install michi@sk8metalme
```

**推奨プラグイン** - 併せてインストール:

```
/plugin marketplace add sk8metalme/ai-agent-setup
/plugin install design-review@ai-agent-setup
/plugin install oss-compliance@ai-agent-setup
/plugin install version-audit@ai-agent-setup
/plugin install e2e-planning@ai-agent-setup
```

### CLIツール（外部ツール連携用）

JIRA/Confluence連携やリリース自動化には、CLIツールを併用します。

```bash
npm install -g @sk8metal/michi-cli
```

**注意**: `michi setup --claude` コマンドは廃止予定です。上記のプラグインインストールを使用してください。

### 基本的な使い方

```bash
# 1. 仕様を初期化
/kiro:spec-init "calculator-app: 四則演算を行う電卓アプリ"

# 2. 要件定義
/kiro:spec-requirements calculator-app

# 3. 設計（テスト計画統合版）
/michi:spec-design calculator-app

# 4. タスク分割（JIRA同期確認付き）
/michi:spec-tasks calculator-app

# 5. TDD実装
/michi:spec-impl calculator-app
```

詳細は [クイックスタートガイド](docs/getting-started/quick-start.md) を参照してください。

## ドキュメント

完全なドキュメントは [docs/](docs/) を参照してください。

### はじめに

- [クイックスタート](docs/getting-started/quick-start.md) - 5分で始めるMichi
- [インストール](docs/getting-started/installation.md) - インストール方法
- [環境設定](docs/getting-started/configuration.md) - 環境変数とワークフロー設定

### ガイド

- [ワークフロー](docs/guides/workflow.md) - 開発フロー全体の説明
- [Atlassian連携](docs/guides/atlassian-integration.md) - JIRA/Confluence連携
- [Multi-Repo管理](docs/guides/multi-repo.md) - マイクロサービス開発
- [Claude Code](docs/guides/claude-code.md) - Claude Code統合
- [統括動作確認手順書](docs/guides/comprehensive-verification-guide.md) - 全機能網羅の動作確認手順（85項目）

### リファレンス

- [CLIコマンド](docs/reference/cli.md) - すべてのmichiコマンド
- [AIコマンド](docs/reference/ai-commands.md) - /kiro:*, /michi:*コマンド
- [環境変数](docs/reference/environment-variables.md) - 環境変数一覧
- [アーキテクチャ](docs/architecture.md) - オニオンアーキテクチャ（4層構造）
- [移行ガイド](docs/MIGRATION.md) - アーキテクチャ移行の詳細

### トラブルシューティング

- [トラブルシューティング](docs/troubleshooting.md) - よくある問題と解決策

## ワークフロー構造

Michiは以下のフェーズで構成されています:

### cc-sdd標準フェーズ

- **Phase 0.0-0.2**: 仕様化（初期化、要件定義、設計）
- **Phase 0.5**: タスク分割
- **Phase 2**: TDD実装

### Michi拡張フェーズ

- **Phase 0.3-0.4**: テスト計画（テストタイプ選択、テスト仕様書作成）
- **Phase 0.6-0.7**: 外部ツール連携（JIRA、Confluence）
- **Phase 1**: 環境構築・基盤整備
- **Phase A**: PR前自動テスト（単体テスト、Lint、ビルド）
- **Phase 3**: 追加品質保証（PRマージ後）
- **Phase B**: リリース準備テスト（統合、E2E、パフォーマンス、セキュリティ）
- **Phase 4-5**: リリース準備と実行

詳細は [ワークフローガイド](docs/guides/workflow.md) を参照してください。

## 技術スタック

### 対応言語・ツール

- **Node.js/TypeScript**: npm
- **Java**: Gradle（Mavenは非対応）
- **PHP**: Composer

### 対応AIツール

- **Claude Code** - AI駆動開発ツール（推奨）
- **Claude Code Subagents** - カスタムサブエージェント統合

### 外部連携

- **Atlassian**: Confluence（ドキュメント管理）、JIRA（タスク管理）
- **GitHub**: Issue、PR、Actions

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## コントリビューション

貢献を歓迎します！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## サポート

- **GitHub Issues**: [https://github.com/sk8metalme/michi/issues](https://github.com/sk8metalme/michi/issues)
- **ドキュメント**: [docs/](docs/)
