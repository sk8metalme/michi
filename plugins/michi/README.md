# Michi - Claude Code Plugin

AI駆動開発を支援するSpec-Driven Developmentフレームワーク for Claude Code

## 概要

Michiは、cc-sdd（Spec-Driven Development Core）を拡張し、以下の機能を追加したClaude Codeプラグインです：

- **テスト計画自動化** (Phase 0.3-0.4): テストタイプ選択、テスト仕様書作成
- **外部ツール連携**: JIRA/Confluence同期、自動チケット作成
- **品質自動化**: Phase A/B テスト実行、ライセンス/バージョン監査
- **TDD実装支援**: 5フェーズ品質自動化（監査→TDD→レビュー→検証→アーカイブ）

## インストール

### 前提条件

1. **cc-sdd (必須)**: Michiはcc-sddの拡張機能です。先にcc-sddをセットアップしてください。

```bash
npx cc-sdd@latest --claude --lang ja
```

2. **ai-agent-setup (推奨)**: 以下のプラグインを先にインストールすることを推奨します。

```
/plugin marketplace add sk8metalme/ai-agent-setup
/plugin install design-review@ai-agent-setup
/plugin install oss-compliance@ai-agent-setup
/plugin install version-audit@ai-agent-setup
/plugin install e2e-planning@ai-agent-setup
```

### Michiプラグインのインストール

Claude Code内で以下を実行：

```
/plugin marketplace add sk8metalme/michi
/plugin install michi@michi
```

## 利用可能なコマンド

### Michi拡張コマンド (8個)

| コマンド | 説明 | 基底コマンド |
|---------|------|------------|
| `/michi:spec-impl` | TDD実装 + 5フェーズ品質自動化 | `kiro:spec-impl` |
| `/michi:spec-design` | 設計書作成（Phase 0.3-0.4ガイダンス付き） | `kiro:spec-design` |
| `/michi:spec-tasks` | タスク分割 + JIRA同期確認 | `kiro:spec-tasks` |
| `/michi:validate-design` | テスト計画完了確認付き設計レビュー | - |
| `/michi:confluence-sync` | Confluence同期（Markdown→Confluence変換） | - |
| `/michi:test-planning` | テスト計画（Phase 0.3-0.4統合実行） | - |
| `/michi:pr-resolve` | PR関連の問題解決支援 | - |
| `/michi:project-switch` | プロジェクト切り替え | - |

### マルチリポジトリコマンド (6個)

| コマンド | 説明 |
|---------|------|
| `/michi-multi-repo:spec-init` | マルチリポプロジェクト初期化 |
| `/michi-multi-repo:spec-requirements` | 要件定義書生成 |
| `/michi-multi-repo:spec-design` | 設計書生成（AI支援） |
| `/michi-multi-repo:spec-review` | クロスリポジトリ仕様レビュー |
| `/michi-multi-repo:propagate-specs` | 各リポジトリへの仕様展開（並列実行） |
| `/michi-multi-repo:impl-all` | 全リポジトリ実装（並列実行） |

## 利用可能なエージェント (3個)

| エージェント | 説明 |
|------------|------|
| `mermaid-validator` | Mermaid図の構文検証と修正提案 |
| `pr-resolver` | PRマージ関連の問題解決（コンフリクト解消、レビュー対応） |
| `pr-size-monitor` | PRサイズ監視と適切な粒度への分割提案 |

## 利用可能なスキル (1個)

| スキル | 説明 |
|-------|------|
| `mermaid-validator` | Mermaid図の検証をスキルとして実行 |

## ルール (6個)

| ルール | 説明 |
|-------|------|
| `atlassian-integration` | JIRA/Confluence連携ルール |
| `michi-core` | Michiコアワークフロールール |
| `code-size-monitor` | コードサイズ監視ルール |
| `code-size-rules` | タスク粒度ガイドライン（500行制限） |
| `doc-review` | ドキュメント自動レビュー |
| `doc-review-rules` | ドキュメント品質チェック基準 |

## Phase 構成

```
cc-sdd 標準フェーズ:
  Phase 0.0: 仕様初期化 (/kiro:spec-init)
  Phase 0.1: 要件定義 (/kiro:spec-requirements)
  Phase 0.2: 設計 (/kiro:spec-design)
  Phase 0.5: タスク分割 (/kiro:spec-tasks)
  Phase 2: TDD実装 (/kiro:spec-impl)

Michi 固有拡張:
  Phase 0.3-0.4: テスト計画 (/michi:test-planning)
  Phase 0.6-0.7: JIRA/Confluence連携
  Phase 1: 環境構築・基盤整備
  Phase A: PR前の自動テスト（unit, lint, build）
  Phase 3: 追加の品質保証（PRマージ後）
  Phase B: リリース準備時の手動テスト（integration, e2e, performance, security）
  Phase 4-5: リリース準備と実行
```

## 推奨ワークフロー

1. `/kiro:spec-init "description"` - 仕様の初期化
2. `/kiro:spec-requirements {feature}` - 要件定義
3. `/michi:spec-design {feature}` - 設計（Phase 0.3-0.4ガイダンス付き）
4. `/michi:test-planning {feature}` - テスト計画（Phase 0.3-0.4）
5. `/michi:spec-tasks {feature}` - タスク分割（JIRA同期確認付き）
6. `/michi:spec-impl {feature}` - TDD実装 + 品質自動化

## CLI併用時の説明

Michiは、CLIツール（`@sk8metal/michi-cli`）とClaude Codeプラグインの2つの形態で提供されています。

### CLIツール (`michi` コマンド)

プロジェクト管理、JIRA/Confluence連携、リリース自動化などの機能を提供：

```bash
# インストール
npm install -g @sk8metal/michi-cli

# プロジェクト初期化（非推奨、プラグイン推奨）
michi setup --claude

# JIRA/Confluence同期
npm run jira:sync
npm run confluence:sync

# リリース作成
npm run github:create-pr
```

### Claude Codeプラグイン

AI駆動開発ワークフロー（コマンド、エージェント、スキル、ルール）を提供：

- `/michi:*` コマンド: 開発フロー自動化
- エージェント: PR解決、Mermaid検証、コードサイズ監視
- ルール: ドキュメント品質、タスク粒度、Atlassian連携

### 併用のベストプラクティス

1. **プラグインを優先**: `/michi:*` コマンドでAI駆動開発
2. **CLIは補助**: 外部ツール連携（JIRA/Confluence）はCLIスクリプトで実行
3. **setup コマンド非推奨**: `michi setup --claude` は廃止予定、プラグインインストールを使用

## 関連リンク

- [Michiリポジトリ](https://github.com/sk8metalme/michi)
- [cc-sdd](https://github.com/gotalab/cc-sdd)
- [ai-agent-setup](https://github.com/sk8metalme/ai-agent-setup)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)

## ライセンス

MIT
