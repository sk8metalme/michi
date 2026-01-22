# Michi - Claude Code Skill

AI駆動開発を支援するSpec-Driven Developmentフレームワーク for Claude Code

## 概要

Michiは、AI駆動Spec-Driven Developmentを実現するClaude Codeスキルです：

- **自動発動**: Claude が文脈から自動的に適切なタイミングでスキルを発動
- **テスト計画自動化** (Phase 4): テストタイプ選択、テスト仕様書作成
- **品質自動化**: Phase 7.1/8 テスト実行、ライセンス/バージョン監査
- **TDD実装支援**: Phase 6サブフェーズ品質自動化（6.2:監査→6.3:TDD→6.4:レビュー→6.5:検証→6.8:アーカイブ）
- **マルチリポジトリ対応**: 複数リポジトリにまたがるプロジェクトの統合仕様管理

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

### インストール後のセットアップ

プラグインインストール後、グローバル設定をセットアップするために以下を実行してください：

```bash
# プラグインディレクトリに移動
cd ~/.claude/plugins/michi  # または実際のインストール先

# セットアップスクリプトを実行
bash scripts/setup.sh
```

これにより、共通のルールとテンプレートが `~/.michi/settings/` に配置されます。

**配置される内容**:
- 9つのルールファイル（EARS形式、設計原則、発見プロセス、レビュー基準など）
- 4つのspec用テンプレート（要件定義、設計、調査ログ、タスク）
- マスタードキュメント用テンプレート

**注意**: この設定は全プロジェクトで共通利用されます。プロジェクト固有の設定は各プロジェクトの `.michi/` ディレクトリで管理されます。

## 使用方法

Michiスキルは2つの方法で使用できます：

### 1. 自動発動（推奨）

Claude が会話の文脈から自動的に適切なタイミングでスキルを発動します。

**例**:
```text
ユーザー: 新しいプロジェクトを開始したい。ユーザー認証機能を実装する。
Claude: プロジェクトを初期化します。[launch-pj を自動実行]

ユーザー: 要件定義したい
Claude: 要件定義書を作成します。[create-requirements を自動実行]

ユーザー: 設計書を作成
Claude: 設計書を作成します。[create-design を自動実行]

ユーザー: 実装したい
Claude: TDD実装を開始します。[dev を自動実行]
```

### 2. 明示的な発動

スキルを直接呼び出すこともできます：

```bash
# プロジェクト初期化
/michi launch-pj "ユーザー認証機能"

# 要件定義
/michi create-requirements user-auth

# 設計書作成
/michi create-design user-auth

# テスト計画
/michi plan-tests user-auth

# タスク分割
/michi create-tasks user-auth

# TDD実装
/michi dev user-auth

# ステータス確認
/michi show-status user-auth

# マルチリポジトリプロジェクト初期化
/michi-multi-repo launch-pj "EC Platform"
```

## 主要機能（19機能）

### プロジェクト管理（4機能）

| 機能 | 説明 |
|------|------|
| `launch-pj` | 仕様初期化 |
| `show-status` | 仕様ステータス + 品質メトリクス表示 |
| `archive-pj` | 完了仕様のアーカイブ |
| `switch-pj` | プロジェクト切り替え |

### 仕様作成（3機能）

| 機能 | 説明 |
|------|------|
| `create-requirements` | 要件定義 + Ultrathink有効化 |
| `create-design` | 設計書作成（Phase 4ガイダンス付き） |
| `update-master-docs` | マスタードキュメント更新 |

### テスト計画（1機能）

| 機能 | 説明 |
|------|------|
| `plan-tests` | テスト計画（Phase 4統合実行） |

### 開発実行（2機能）

| 機能 | 説明 |
|------|------|
| `create-tasks` | タスク分割 |
| `dev` | TDD実装 + Phase 6品質自動化 |

### レビュー・検証（3機能）

| 機能 | 説明 |
|------|------|
| `review-design` | テスト計画完了確認付き設計レビュー |
| `review-dev` | 実装検証 + 品質ゲート |
| `analyze-gap` | Gap分析 |

### マルチリポジトリ（6機能）

| 機能 | 説明 |
|------|------|
| `multi-repo:launch-pj` | マルチリポプロジェクト初期化 |
| `multi-repo:create-requirements` | 要件定義書生成 |
| `multi-repo:create-design` | 設計書生成（AI支援） |
| `multi-repo:review-cross` | クロスリポジトリ仕様レビュー |
| `multi-repo:propagate` | 各リポジトリへの仕様展開（並列実行） |
| `multi-repo:dev-all` | 全リポジトリ実装（並列実行） |

## ルール (5個)

| ルール | 説明 |
|-------|------|
| `michi-core` | Michiコアワークフロールール |
| `code-size-monitor` | コードサイズ監視ルール |
| `code-size-rules` | タスク粒度ガイドライン（500行制限） |
| `doc-review` | ドキュメント自動レビュー |
| `doc-review-rules` | ドキュメント品質チェック基準 |

## Phase 構成

```
Michi ワークフローフェーズ:

[計画フェーズ]
Phase 1: 仕様初期化         (launch-pj)
Phase 2: 要件定義           (create-requirements)
Phase 3: 設計               (create-design)
Phase 4: テスト計画         (plan-tests)
Phase 5: タスク分割         (create-tasks)

[実装フェーズ]
Phase 6: TDD実装            (dev)
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

[完了フェーズ]
Phase 10: アーカイブ        (archive-pj)
```

## 推奨ワークフロー

### 自動発動の場合

```text
ユーザー: 新しいプロジェクトを開始したい。ユーザー認証機能を実装する。
  → Claude が launch-pj を自動実行

ユーザー: 要件定義したい
  → Claude が create-requirements を自動実行

ユーザー: 設計書を作成
  → Claude が create-design を自動実行

ユーザー: テスト計画を立てたい
  → Claude が plan-tests を自動実行

ユーザー: タスクに分割したい
  → Claude が create-tasks を自動実行

ユーザー: 実装したい
  → Claude が dev を自動実行
```

### 明示的発動の場合

1. `/michi launch-pj "description"` - 仕様の初期化
2. `/michi create-requirements {feature}` - 要件定義
3. `/michi create-design {feature}` - 設計（Phase 4ガイダンス付き）
4. `/michi plan-tests {feature}` - テスト計画（Phase 4）
5. `/michi create-tasks {feature}` - タスク分割
6. `/michi dev {feature}` - TDD実装 + 品質自動化

## 関連リンク

- [Michiリポジトリ](https://github.com/yourorg/michi)
- [ai-agent-setup](https://github.com/yourorg/ai-agent-setup)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)

## ライセンス

MIT
