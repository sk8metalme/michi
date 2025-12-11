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

Michiは cc-sdd の標準ワークフローを以下の機能で拡張します：

#### テスト計画拡張
- **Phase 0.3**: テストタイプの選択（単体/統合/E2E/パフォーマンス/セキュリティ）
- **Phase 0.4**: テスト仕様書の作成（テンプレート使用）
- **Phase 1**: 環境構築・基盤整備（テスト環境セットアップ）
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
- `/michi:project-switch {project}`: マルチプロジェクト切り替え

詳細は [ワークフローガイド](docs/user-guide/guides/workflow.md) を参照してください。

## 参考リンク

- [ユーザーガイド](docs/user-guide/README.md)
- [テスト戦略](docs/user-guide/testing-strategy.md)
- [リリースフロー](docs/user-guide/release/release-flow.md)


# cc-sdd 標準ワークフロー（AI-DLC and Spec-Driven Development）

> **注**: 以下は cc-sdd 標準の基本ワークフローです。Michi を使用する場合は、上記の「Michi 固有拡張」セクションで説明されている Phase 0.3-0.4, Phase A/B などの追加フェーズを考慮してください。

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow (cc-sdd 標準)

> **Michi 使用時の推奨**: 以下のコマンドで `/kiro:spec-design` の代わりに `/michi:spec-design` を使用すると、Phase 0.3-0.4（テスト計画）へのガイダンスが自動的に表示されます。

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/michi:spec-design {feature} [-y]` ← **Michi推奨** (または `/kiro:spec-design`)
  - **Phase 0.3-0.4**: `/michi:test-planning {feature}` ← **重要: タスク生成前に実施**
  - `/michi:validate-design {feature}` (optional: design review with test planning check)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
