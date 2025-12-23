# Michi プロジェクト - Claude開発ガイド

このファイルはMichiプロジェクトでClaude Codeやその他のAI開発ツールを使用する際の、プロジェクト固有のルールとガイドラインを定義します。

## プロジェクト概要

Michiは、AI駆動開発を支援するプロジェクト管理・ドキュメント管理フレームワークです。Claude Code、Cursor、Claude Agent SDKと統合し、効率的な開発フローを実現します。

## Michiプロジェクト固有ルール
### ドキュメント構成

```
docs/
├── michi-development/  # Michi開発者向けドキュメント
│   ├── contributing/   # コントリビューションガイド
│   └── testing/        # テスト戦略
└── user-guide/         # Michiユーザー向けドキュメント
    ├── getting-started/    # セットアップガイド
    ├── guides/            # 使い方ガイド
    ├── hands-on/          # ハンズオンチュートリアル
    ├── reference/         # リファレンス
    ├── release/           # リリース関連
    ├── testing/           # テスト実行ガイド
    └── templates/         # 各種テンプレート
```

### コーディング規約

#### ドキュメント作成
- **テンプレートファイル**: 英語で記述
- **ガイドドキュメント**: 日本語で記述
- **コード例**: 対応3言語（Node.js、Java/Gradle、PHP）を含める

#### テスト駆動開発（TDD）
- RED-GREEN-REFACTORサイクルを遵守
- テストは仕様として扱う（実装に合わせてテストを変更しない）
- カバレッジ95%以上を目標

## Michi利用者向け

### 対応言語とビルドツール
- **Node.js/TypeScript**: npm を使用
- **Java**: Gradleを使用（Mavenは使用しない）
- **PHP**: Composer を使用

### テスト管理方針
- **マスタテスト方式**を採用
  - テストは常に最新の仕様を反映（phase-0、phase-1のような履歴管理はしない）
  - 仕様変更時は既存のテストファイルを更新
  - テスト実行時間を一定に保つ
- **Phase A/B構成**
  - Phase A: PR時に自動実行（unit、lint、build）
  - Phase B: リリース前に手動実行（integration、e2e、performance、security）

### CI/CD
- **GitHub Actions** と **Screwdriver** の両方をサポート
- 対応言語: Node.js、Java（Gradle）、PHP

### リリースフロー
- Confluenceでリリース手順書を作成
- JIRAでリリースチケットを起票
- セマンティックバージョニング（v<major>.<minor>.<patch>）を使用

#### 自動リリースフロー（GitHub Actions）
Michiプロジェクトでは、リリースタグをpushすると自動的にnpm publishとGitHub Releaseが作成されます。

**トリガー条件**: `v*` 形式のタグがpushされたとき

**自動実行される処理**（`.github/workflows/release.yml`）:
1. 依存関係インストール（`npm ci`）
2. テスト実行（`npm run test:run`）
3. Lint実行（`npm run lint`）
4. 型チェック実行（`npm run type-check`）
5. ビルド（`npm run build`）
6. **npm publish**（`NPM_TOKEN` を使用）
7. **GitHub Release作成**

**手動でのリリース手順**:
```bash
# 1. リリースブランチを作成
git checkout -b release/vX.Y.Z

# 2. CHANGELOG.mdとpackage.jsonを更新
# （バージョン番号の更新）

# 3. コミット・プッシュ・PR作成
git commit -m "chore: bump version to X.Y.Z"
git push -u origin release/vX.Y.Z
gh pr create --title "Release vX.Y.Z" --body "..."

# 4. PRマージ後、mainブランチでタグを作成・プッシュ
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z  # ← この時点で自動的にnpm publishとGitHub Release作成が実行される
```

**注意事項**:
- タグpush後、GitHub Actionsのワークフロー実行状況を確認すること
- npm publishに失敗した場合は、NPM_TOKENの有効期限を確認
- 手動でGitHub Releaseを作成した場合、自動作成されたReleaseと重複する可能性がある


## AI開発ツール連携

### Claude Code
- このCLAUDE.mdファイルを参照して開発
- Jujutsu (jj) をバージョン管理に使用

### Cursor
- `.cursorrules` ファイルでプロジェクト固有ルールを定義

### Claude Agent SDK
- カスタムサブエージェント: `templates/claude-agent/`
- カスタムコマンド: `templates/claude/commands/`

### cc-sdd（Spec-Driven Development Core）

> **cc-sdd とは**: Spec-Driven Developmentの基盤フレームワーク。ルール・テンプレートを提供。
>
> **Michi との関係**: Michi は cc-sdd を拡張し、テスト計画（Phase 0.3-0.4）、JIRA/Confluence連携、Phase A/B テスト実行などの機能を追加したフレームワークです。

- **役割**: Spec-Driven Developmentのルール・テンプレートを提供
- **リポジトリ**: https://github.com/gotalab/cc-sdd
- **セットアップ**: `npx cc-sdd@latest --claude --lang ja`
- **生成物**: `.kiro/settings/` 配下にルールとテンプレートを生成
- **重要**: `.kiro/settings/` はGit管理外（`.gitignore`に含む）
  - 各開発者がローカルで実行して生成
  - cc-sddのバージョンアップで最新のベストプラクティスを取得
  - プロジェクト固有の設定は、ユーザーが `.kiro/steering/` と `.kiro/specs/` を作成して管理

### Michi 固有拡張（cc-sddへの追加機能）

Michiは cc-sdd の標準ワークフローを以下の機能で拡張します。

#### Phase 構成の全体像

```
┌─────────────────────────────────────────────────────────────────┐
│ cc-sdd 標準フェーズ                                              │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0.0: 仕様初期化 (/kiro:spec-init)                         │
│ Phase 0.1: 要件定義 (/kiro:spec-requirements)                   │
│ Phase 0.2: 設計 (/kiro:spec-design)                             │
│ Phase 0.5: タスク分割 (/kiro:spec-tasks)                        │
│ Phase 2: TDD実装 (/kiro:spec-impl)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Michi 固有拡張フェーズ                                           │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0.3: テストタイプの選択                                    │
│ Phase 0.4: テスト仕様書の作成 (/michi:test-planning)            │
│ Phase 0.6: JIRA同期                                             │
│ Phase 0.7: Confluence同期 (/michi:confluence-sync)              │
│ Phase 1: 環境構築・基盤整備                                     │
│ Phase A: PR前の自動テスト（CI/CD）                              │
│ Phase 3: 追加の品質保証（PRマージ後）                            │
│ Phase B: リリース準備時の手動テスト                              │
│ Phase 4-5: リリース準備と実行                                   │
└─────────────────────────────────────────────────────────────────┘

推奨フロー: Phase 0.0 → 0.1 → 0.2 → [0.3-0.4] → 0.5 → 0.6-0.7
           → Phase 1 → Phase 2 → Phase A → Phase 3 → Phase B
           → Phase 4-5
```

#### テスト計画拡張
- **Phase 0.3**: テストタイプの選択（単体/統合/E2E/パフォーマンス/セキュリティ）
- **Phase 0.4**: テスト仕様書の作成（テンプレート使用）
- **Phase 1**: 環境構築・基盤整備
  - プロジェクト初期化、依存関係インストール（テストフレームワーク、Lintツール等）
  - データベース接続設定、テスト環境の準備（pytest, vitest, JUnit等）
  - テストデータの準備（fixtures, seed等）、テストディレクトリ構造の作成
- **Phase A**: PR作成前の自動テスト（単体テスト + Lint + ビルド）
- **Phase B**: リリース準備時の手動テスト（統合/E2E/パフォーマンス/セキュリティ）
- **Phase 3**: 追加の品質保証（PRマージ後）

#### 外部ツール連携
- **Phase 0.6**: タスクのJIRA同期（Epic/Story/Subtask自動作成）
- **Phase 0.7**: Confluence同期（要件定義・設計書のMarkdown→Confluence変換）
- **Phase 4-5**: リリース準備と実行（Confluenceリリース手順書、JIRAリリースチケット）

#### Michi 固有コマンド
- `/michi:spec-design {feature}`: Phase 0.3-0.4 ガイダンス付き設計書生成（推奨）
- `/michi:test-planning {feature}`: Phase 0.3-0.4 統合実行（テストタイプ選択 + テスト仕様書作成）
- `/michi:validate-design {feature}`: テスト計画完了確認付き設計レビュー
- `/michi:spec-impl {feature} [tasks]`: TDD実装 + 品質自動化（ライセンス/バージョン監査、自動修正ループ、レビュー）
- `/michi:confluence-sync {feature} {type}`: Confluence同期

詳細は [ワークフローガイド](docs/user-guide/guides/workflow.md) を参照してください。

## 参考リンク

- [テスト戦略](docs/user-guide/testing-strategy.md)
- [リリースフロー](docs/user-guide/release/release-flow.md)
- [ワークフローガイド](docs/user-guide/guides/workflow.md)


# cc-sdd 標準ワークフロー（AI-DLC and Spec-Driven Development）

> **注**: 以下は cc-sdd 標準の基本ワークフローです。Michi を使用する場合は、上記の「Michi 固有拡張」セクションで説明されている Phase 0.3-0.4, Phase A/B などの追加フェーズを考慮してください。

## cc-sdd と Michi の関係

**cc-sdd (Spec-Driven Development Core)** は、AI駆動開発の基盤フレームワークです。
**Michi** は、cc-sdd を拡張し、テスト計画（Phase 0.3-0.4）、JIRA/Confluence連携、Phase A/B テスト実行などの機能を追加したフレームワークです。

### Phase 構成の対比

```
cc-sdd 標準フェーズ:
  Phase 0.0-0.2: 仕様初期化、要件定義、設計
  Phase 0.5: タスク分割
  Phase 2: 実装（TDD）

Michi 固有拡張:
  Phase 0.3-0.4: テスト計画（テストタイプ選択、テスト仕様書作成）
  Phase 0.6-0.7: JIRA/Confluence連携
  Phase 1: 環境構築・基盤整備
  Phase A: PR前の自動テスト
  Phase 3: 追加の品質保証
  Phase B: リリース準備時の手動テスト
  Phase 4-5: リリース準備と実行
```

## 基本ワークフロー

**cc-sdd 標準**:
1. `/kiro:spec-init "description"` - 仕様の初期化
2. `/kiro:spec-requirements {feature}` - 要件定義
3. `/kiro:spec-design {feature}` - 設計
4. `/kiro:spec-tasks {feature}` - タスク分割
5. `/kiro:spec-impl {feature}` - TDD実装

**Michi 推奨フロー**:
1. `/kiro:spec-init "description"` - 仕様の初期化
2. `/kiro:spec-requirements {feature}` - 要件定義
3. `/michi:spec-design {feature}` - 設計（Phase 0.3-0.4ガイダンス付き）
4. `/michi:test-planning {feature}` - テスト計画（Phase 0.3-0.4）
5. `/kiro:spec-tasks {feature}` - タスク分割
6. `/michi:spec-impl {feature}` - TDD実装 + 品質自動化

詳細なワークフローは [ワークフローガイド](docs/user-guide/guides/workflow.md) を参照してください。

## プロジェクトコンテキスト

- **Steering**: `.kiro/steering/` - プロジェクト全体のルールとコンテキスト
- **Specs**: `.kiro/specs/` - 個別機能の開発プロセス

詳細は cc-sdd 公式ドキュメント (https://github.com/gotalab/cc-sdd) を参照してください。
