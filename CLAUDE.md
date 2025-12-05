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
- **役割**: Spec-Driven Developmentのルール・テンプレートを提供
- **リポジトリ**: https://github.com/gotalab/cc-sdd
- **セットアップ**: `npx cc-sdd@latest --claude --lang ja`
- **生成物**: `.kiro/settings/` 配下にルールとテンプレートを生成
- **重要**: `.kiro/settings/` はGit管理外（`.gitignore`に含む）
  - 各開発者がローカルで実行して生成
  - cc-sddのバージョンアップで最新のベストプラクティスを取得
  - プロジェクト固有の設定は、ユーザーが `.kiro/steering/` と `.kiro/specs/` を作成して管理

## 参考リンク

- [ユーザーガイド](docs/user-guide/README.md)
- [テスト戦略](docs/user-guide/testing-strategy.md)
- [リリースフロー](docs/user-guide/release/release-flow.md)


# AI-DLC and Spec-Driven Development

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

## Minimal Workflow
- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
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
