# Claude Code セットアップガイド

Michiは、Claude Codeを第一級のAI開発ツールとしてサポートしています。このガイドでは、Claude CodeでMichiを使用するためのセットアップと基本的な使い方を説明します。

## Claude Codeとは

Claude Codeは、Anthropic社が提供する公式CLI（コマンドラインインターフェース）です。プロジェクトのコンテキストを理解し、コード生成、ドキュメント作成、テスト駆動開発をサポートします。

**主な特徴**:
- プロジェクト固有のルール（CLAUDE.md）による動作制御
- カスタムコマンド、スキル、サブエージェントの拡張機能
- cc-sdd（Spec-Driven Development Core）との統合

## セットアップ手順

### 1. cc-sddのインストール

Michiは、cc-sddを基盤フレームワークとして使用します。以下のコマンドでcc-sddをインストールしてください。

```bash
npx cc-sdd@latest --claude-agent --lang ja
```

**生成されるファイル**:
- `.kiro/settings/` - cc-sdd標準のルール、テンプレート（`.gitignore`対象）
- `.kiro/steering/` - プロジェクト固有のコンテキスト
- `.kiro/specs/` - 機能仕様（Git管理）

### 2. Michi拡張のインストール

cc-sddをインストールした後、Michi固有の拡張機能を追加します。

```bash
michi setup --claude
```

**生成されるファイル**:
- `.claude/commands/michi/` - Michi固有コマンド
- `.claude/rules/` - Michi固有ルール
- `.claude/agents/` - サブエージェント定義
- `.claude/skills/` - スキル定義

### 3. 環境変数の設定（オプション）

JIRA/Confluence連携を使用する場合、環境変数を設定してください。

```bash
# .envファイルに以下を追加
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

詳細は [環境変数リファレンス](../reference/environment-variables.md) を参照してください。

## Michiとの統合

### 利用可能なコマンド

Claude Codeでは、以下のコマンドが利用できます。

#### cc-sdd標準コマンド

| コマンド | 機能説明 |
|---------|---------|
| `/kiro:spec-init` | 新規仕様を初期化 |
| `/kiro:spec-requirements` | 要件定義を作成 |
| `/kiro:spec-design` | 設計書を作成 |
| `/kiro:spec-tasks` | タスク分割とJIRA同期 |
| `/kiro:spec-impl` | TDD実装を実行 |

#### Michi拡張コマンド

| コマンド | 機能説明 | 備考 |
|---------|---------|------|
| `/michi:spec-design` | テスト計画統合設計書を作成 | Phase 0.3-0.4ガイダンス付き |
| `/michi:test-planning` | テスト計画を実行 | テストタイプ選択+仕様書作成 |
| `/michi:validate-design` | テスト計画レビュー | テスト計画完了確認付き |
| `/michi:spec-impl` | TDD実装+品質自動化 | ライセンス/バージョン監査+レビュー |
| `/michi:confluence-sync` | Confluence同期 | 要件定義書/設計書を同期 |

### スキルとサブエージェント

Michiは、Claude Codeのスキルとサブエージェント機能を拡張します。

**利用可能なスキル**:
- `design-review`: UIデザインレビュー（アクセシビリティ、レスポンシブ、UXパターン、パフォーマンス）
- `e2e-first-planning`: E2Eテストファースト計画
- `oss-license`: OSSライセンスチェック
- `stable-version`: バージョン監査

**利用可能なサブエージェント**:
- `design-reviewer`: 設計レビュー担当
- `e2e-first-planner`: E2Eテスト計画担当
- `oss-license-checker`: OSSライセンスチェック担当
- `stable-version-auditor`: バージョン監査担当

## 基本的な使い方

### 新機能の開発フロー

```bash
# 1. 仕様の初期化
/kiro:spec-init "計算機アプリケーション: 四則演算を行う"

# 2. 要件定義
/kiro:spec-requirements calculator-app

# 3. 設計（Michi推奨: テスト計画ガイダンス付き）
/michi:spec-design calculator-app

# 4. テスト計画（任意）
/michi:test-planning calculator-app

# 5. タスク分割
/kiro:spec-tasks calculator-app

# 6. TDD実装（Michi推奨: 品質自動化付き）
/michi:spec-impl calculator-app
```

### Multi-Repoプロジェクトの場合

Multi-Repoプロジェクトでは、以下のコマンドが利用できます。

```bash
# 1. プロジェクト初期化
/michi-multi-repo:spec-init

# 2. 要件定義
/michi-multi-repo:spec-requirements my-project

# 3. 設計
/michi-multi-repo:spec-design my-project

# 4. クロスリポジトリレビュー
/michi-multi-repo:spec-review my-project

# 5. 各リポジトリへ仕様展開
/michi-multi-repo:propagate-specs my-project

# 6. 全リポジトリで実装実行
/michi-multi-repo:impl-all my-project
```

詳細は [Multi-Repoガイド](multi-repo.md) を参照してください。

## 関連ドキュメント

- [AIコマンドリファレンス](../reference/ai-commands.md) - すべてのコマンドの詳細
- [ワークフローガイド](workflow.md) - 開発ワークフロー全体像
- [Atlassian連携ガイド](atlassian-integration.md) - JIRA/Confluence連携の詳細
- [環境変数リファレンス](../reference/environment-variables.md) - 環境変数の詳細設定
- [トラブルシューティング](../troubleshooting.md) - よくある問題と解決策
