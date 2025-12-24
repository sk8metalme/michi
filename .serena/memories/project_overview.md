# Michiプロジェクト概要

## プロジェクトの目的

Michiは、開発フロー全体（要件定義→設計→タスク分割→実装→テスト→リリース）をAIで自動化するプラットフォームです。

**主な特徴:**
- AI駆動開発ワークフロー自動化
- cc-sdd（Spec-Driven Development Core）を拡張したフレームワーク
- Confluence/JIRA連携による承認者向けドキュメント・タスク管理
- マルチプロジェクト対応（3-5プロジェクト同時進行）
- 多言語サポート（12言語、AI駆動、翻訳ファイル不要）
- GitHub SSoT（Single Source of Truth）

## 技術スタック

### ランタイム・言語
- **Node.js**: 20.x以上
- **TypeScript**: 型安全なJavaScript開発
- **npm**: パッケージ管理

### 開発ツール
- **cc-sdd**: AI駆動開発ワークフローのコアフレームワーク
- **Cursor IDE**: AI統合開発環境（推奨）
- **Claude Code**: AI開発アシスタント
- **vitest**: テストフレームワーク
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマッター

### バージョン管理
- **Git**: 標準的なバージョン管理
- **Jujutsu (jj)**: Gitの代替として使用可能（オプション）
- **GitHub**: リモートリポジトリ、CI/CD

### 統合・連携
- **Atlassian MCP**: Confluence/JIRA統合
- **GitHub CLI (gh)**: PR作成、Issue管理
- **Octokit (@octokit/rest)**: GitHub REST API クライアント

### HTTPクライアント・ライブラリ
- **axios**: HTTPリクエスト
- **commander**: CLIフレームワーク
- **inquirer**: 対話型CLI
- **markdown-it**: Markdownパーサー
- **turndown**: HTML→Markdown変換
- **zod**: スキーマバリデーション

## プロジェクト構造

```
michi/
├── src/                 # TypeScriptソースコード
│   ├── cli.ts          # CLIエントリポイント
│   ├── commands/       # CLIコマンド実装
│   └── __tests__/      # テストファイル
├── scripts/            # 自動化スクリプト
│   ├── confluence-sync.ts
│   ├── jira-sync.ts
│   ├── pr-automation.ts
│   ├── workflow-orchestrator.ts
│   ├── phase-runner.ts
│   └── utils/          # ユーティリティ
├── templates/          # cc-sdd準拠のマルチ環境テンプレート
│   ├── cursor/         # Cursor IDE用
│   ├── claude/         # Claude Code用
│   └── claude-agent/   # Claude Agent用
├── .kiro/              # AI-DLC設定（cc-sdd標準）
│   ├── project.json    # プロジェクトメタデータ
│   ├── settings/       # テンプレート
│   ├── specs/          # 機能仕様書（GitHub SSoT）
│   └── steering/       # AIガイダンス
├── .cursor/            # Cursor IDE設定
├── .claude/            # Claude Code設定
├── docs/               # ドキュメント
│   ├── getting-started/
│   ├── guides/
│   ├── reference/
│   └── contributing/
├── dist/               # ビルド出力（.gitignore対象）
├── node_modules/       # 依存パッケージ（.gitignore対象）
├── package.json        # 依存関係・スクリプト定義
├── tsconfig.json       # TypeScript設定
├── eslint.config.js    # ESLint設定
├── vitest.config.ts    # vitest設定
├── env.example         # 環境変数テンプレート
├── mcp.json.example    # MCP設定テンプレート
├── CLAUDE.md           # Claude Code向けプロジェクトルール
└── README.md           # プロジェクト概要
```

## 開発フロー

Michiは以下のフェーズで構成されています：

**Phase 0.0-0.6: 仕様化フェーズ**
- Phase 0.0: プロジェクト初期化
- Phase 0.1: 要件定義（Requirements）- 必須
- Phase 0.2: 設計（Design）- 必須
- Phase 0.3: テストタイプ選択（任意）
- Phase 0.4: テスト仕様書作成（任意）
- Phase 0.5: タスク分割 - 必須
- Phase 0.6: JIRA同期 - 必須

**Phase 1: 環境構築（任意）**

**Phase 2: TDD実装（必須）**

**Phase A: PR前自動テスト（任意）**

**Phase 3: 追加QA（任意）**

**Phase B: リリース準備テスト（任意）**

**Phase 4-5: リリース準備・リリース（必須）**

## エントリポイント

- **CLIコマンド**: `michi` (npm linkされた場合) または `npx @sk8metal/michi-cli`
- **ローカル開発**: `npm run michi` または `npx tsx src/cli.ts`
