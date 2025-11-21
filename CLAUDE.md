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
- カスタムサブエージェント: `docs/user-guide/templates/claude-agent/`
- カスタムコマンド: `docs/user-guide/templates/claude/commands/`

## 参考リンク

- [ユーザーガイド](docs/user-guide/README.md)
- [テスト戦略](docs/user-guide/testing-strategy.md)
- [リリースフロー](docs/user-guide/release/release-flow.md)
