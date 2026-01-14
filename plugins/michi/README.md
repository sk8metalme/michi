# Michi - Claude Code Plugin

AI駆動開発を支援するSpec-Driven Developmentフレームワーク for Claude Code

## 概要

Michiは、AI駆動Spec-Driven Developmentを実現するClaude Codeプラグインです：

- **テスト計画自動化** (Phase 4): テストタイプ選択、テスト仕様書作成
- **外部ツール連携**: JIRA/Confluence同期、自動チケット作成
- **品質自動化**: Phase 7.1/8 テスト実行、ライセンス/バージョン監査
- **TDD実装支援**: Phase 6サブフェーズ品質自動化（6.2:監査→6.3:TDD→6.4:レビュー→6.5:検証→6.8:アーカイブ）

## インストール

### 前提条件

**ai-agent-setup (推奨)**: 以下のプラグインを先にインストールすることを推奨します。

```
/plugin marketplace add yourorg/ai-agent-setup
/plugin install design-review@ai-agent-setup
/plugin install oss-compliance@ai-agent-setup
/plugin install version-audit@ai-agent-setup
/plugin install e2e-planning@ai-agent-setup
```

### Michiプラグインのインストール

Claude Code内で以下を実行：

```
/plugin marketplace add yourorg/michi
/plugin install michi@yourorg
```

## 利用可能なコマンド

### Michiコマンド (14個)

| コマンド | 説明 |
|---------|------|
| `/michi:launch-pj` | 仕様初期化 + JIRA連携設定確認 |
| `/michi:create-requirements` | 要件定義 + Ultrathink有効化 |
| `/michi:create-design` | 設計書作成（Phase 4ガイダンス付き） |
| `/michi:create-tasks` | タスク分割 + JIRA同期確認 |
| `/michi:dev` | TDD実装 + Phase 6品質自動化 |
| `/michi:show-status` | 仕様ステータス + 品質メトリクス表示 |
| `/michi:archive-pj` | 完了仕様のアーカイブ + Confluence同期 |
| `/michi:review-design` | テスト計画完了確認付き設計レビュー |
| `/michi:review-dev` | 実装検証 + 品質ゲート |
| `/michi:analyze-gap` | Gap分析 + JIRAチケット自動作成 |
| `/michi:plan-tests` | テスト計画（Phase 4統合実行） |
| `/michi:sync-confluence` | Confluence同期（Markdown→Confluence変換） |
| `削除済み` | PR関連の問題解決支援 |
| `/michi:switch-pj` | プロジェクト切り替え |

### マルチリポジトリコマンド (6個)

| コマンド | 説明 |
|---------|------|
| `/michi-multi-repo:launch-pj` | マルチリポプロジェクト初期化 |
| `/michi-multi-repo:create-requirements` | 要件定義書生成 |
| `/michi-multi-repo:create-design` | 設計書生成（AI支援） |
| `/michi-multi-repo:review-cross` | クロスリポジトリ仕様レビュー |
| `/michi-multi-repo:propagate` | 各リポジトリへの仕様展開（並列実行） |
| `/michi-multi-repo:dev-all` | 全リポジトリ実装（並列実行） |

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
Michi ワークフローフェーズ:

[計画フェーズ]
Phase 1: 仕様初期化         (/michi:launch-pj)
Phase 2: 要件定義           (/michi:create-requirements)
Phase 3: 設計               (/michi:create-design)
Phase 4: テスト計画         (/michi:plan-tests)
Phase 5: タスク分割         (/michi:create-tasks)

[実装フェーズ]
Phase 6: TDD実装            (/michi:dev)
  - Phase 6.1: コンテキストロード
  - Phase 6.2: 事前品質監査（License/Version Audit）
  - Phase 6.3: TDD実装サイクル（RED→GREEN→REFACTOR）
  - Phase 6.4: 事後品質レビュー（Code/Design Review）
  - Phase 6.5: 最終検証（Coverage 95%+）
  - Phase 6.6: タスク完了マーク
  - Phase 6.7: Progress Check
  - Phase 6.8: アーカイブ準備

[品質保証フェーズ]
Phase 7: PR/コードレビュー
  - Phase 7.1: PR前自動テスト（unit, lint, build）
  - Phase 7.2: PR作成・レビュー依頼
  - Phase 7.3: レビューコメント対応 (削除済み)

[リリースフェーズ]
Phase 8: リリース準備
  - Phase 8.1〜8.4: 統合/E2E/パフォーマンス/セキュリティテスト

[連携フェーズ]
Phase 9: 外部連携（JIRA/Confluence）

[完了フェーズ]
Phase 10: アーカイブ        (/michi:archive-pj)
```

## 推奨ワークフロー

1. `/michi:launch-pj "description"` - 仕様の初期化
2. `/michi:create-requirements {feature}` - 要件定義
3. `/michi:create-design {feature}` - 設計（Phase 4ガイダンス付き）
4. `/michi:plan-tests {feature}` - テスト計画（Phase 4）
5. `/michi:create-tasks {feature}` - タスク分割（JIRA同期確認付き）
6. `/michi:dev {feature}` - TDD実装 + 品質自動化

## 関連リンク

- [Michiリポジトリ](https://github.com/yourorg/michi)
- [ai-agent-setup](https://github.com/yourorg/ai-agent-setup)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)

## ライセンス

MIT
