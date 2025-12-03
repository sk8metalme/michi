# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-03

### Added
- **Codex統合**: Codex環境のcc-sdd統合とワークフロー機能拡張（#81）
  - 検証ガイド（`docs/verification-guide.md`）
  - クイック検証スクリプト（`scripts/quick-verify.sh`）
  - 新機能テスト（`scripts/test-new-features.ts`）
  - ワークフローステージテスト（`scripts/test-workflow-stages.ts`）
  - Confluence承認ユーティリティ（`scripts/utils/confluence-approval.ts`）
  - リリースノート生成ユーティリティ（`scripts/utils/release-notes-generator.ts`）
  - テストランナー（`scripts/utils/test-runner.ts`とテストスイート）
  - Codexテンプレート（`templates/codex/AGENTS.override.md`、`templates/codex/prompts/confluence-sync.md`）
  - 共通プロジェクト設定テンプレート（`templates/common/.kiro/project.json.template`）
- **Kiro統合**: Claude Code/Claude AgentにkiroコードレビューとPR確認機能を追加（#79）
- **Kiro spec-impl**: コードレビューとPR作成確認を追加（#78）
- **Kiro spec-impl統合**: 統合ワークフローと関連機能を追加（#77）
- **マルチ環境サポート**: 対話型テスト実行とマルチ環境サポートを追加（#65）
- **新CLIサポート**: Gemini CLI、Codex CLI、Clineのサポートを追加（#64）

### Changed
- **依存関係更新**: inquirerを9.3.8から13.0.1にメジャーバージョンアップ（dependabot）
- **ワークフローオーケストレーター**: `scripts/workflow-orchestrator.ts`を機能拡張
- **setup-existingコマンド**: `src/commands/setup-existing.ts`を改善

### Refactored
- **コードクリーンアップ**: 不要なファイルを整理（#75）

## [0.0.9] - 2025-11-17

### Added
- **統合テストスイート**: `setup-existing`コマンドの統合テスト42個を追加（#39）
  - 環境別テスト（Cursor, Claude, Claude Agent）
  - バリデーションテスト（プロジェクト名、JIRAキー、言語サポート）
  - テストヘルパー作成（`test-project.ts`, `fs-assertions.ts`）
  - テストドキュメント（`docs/testing/integration-tests.md`）
- **CI/CDワークフロー**: 統合テスト用のGitHub Actionsワークフロー（`.github/workflows/test-setup.yml`）を追加
  - Node.js 20.x, 22.xでのマトリックステスト
  - カバレッジレポート（Codecov統合）

### Changed
- **Node.jsサポート範囲を変更**: Node.js 18.xのサポートを削除
  - 理由: Vitest v4が使用する`node:inspector/promises`がNode.js 18.xで利用不可
  - サポート対象: Node.js 20.x, 22.x

### Fixed
- **テンプレートパス解決のバグ修正**: `scripts/setup-existing-project.ts`がテンプレートを正しく見つけられない問題を修正
  - `join(michiPath, templateSource)`から`join(michiPath, 'templates', templateSource)`に変更
  - 影響: スクリプト直接実行時にテンプレートファイルがコピーされなかった
- **環境定数のテスト修正**: `scripts/constants/__tests__/environments.test.ts`の期待値を更新
  - `templateSource`の値を`'templates/cursor'`から`'cursor'`に修正
- **誤解を招くテスト記述を修正**: テスト名とコメントを実装と一致させるよう改善
  - JIRA key conversionテスト: 「拒否」から「変換」に記述を変更
  - Cursor flagテスト: 「デフォルト」から「明示的フラグ」に記述を変更
- **親ディレクトリ取得の実装を修正**: `test-project.ts`の`writeFile`メソッドを改善
  - 不正確な`join(filePath, '..')`から正しい`dirname(filePath)`に変更

### Tests
- **テスト成功率**: 82.4% (42/51テスト成功、9テストスキップ)
- **スキップされたテスト**: Issue #55（バリデーションエラーハンドリング）とIssue #56（Claude-agentテンプレート構造）で対応予定

## [0.0.8] - 2025-11-14

### Fixed
- `create-project.ts`: `.env`ファイルがリポジトリルートではなくプロジェクトディレクトリ（`projects/{id}/`）に作成されるように修正
  - `npm run setup:env`実行時の`cwd`を`projectDir`から`actualProjectDir`に変更
- `setup-existing-project.ts`: `.cursor/rules`と`.cursor/commands/kiro`ディレクトリが存在しない場合のエラーを修正
  - ファイルコピー前に`mkdirSync`でディレクトリを事前作成するように変更
- `setup-existing-project.ts`: パッケージ名の表記を統一
  - すべての`@michi/cli`参照を`@sk8metal/michi-cli`に修正（使用例、package.jsonスクリプト例、グローバルインストール例）
- `setup-existing-project.ts`: 完了メッセージの不整合を修正
  - 実際には作成されない`scripts/`ディレクトリの記述を削除
- `setup-interactive.ts`: プロジェクトIDのバリデーションを強化
  - `getProjectMetadata`内で`validateProjectId`を呼び出し、パストラバーサル攻撃を防止
- `setup-interactive.ts`: `process.exit`の直接呼び出しを削除
  - `main`関数が`Promise<number>`を返すように変更し、CLIエントリーポイントでのみ`process.exit`を呼び出すように改善
  - これにより、関数のテスト容易性と再利用性が向上

### Added
- `setup-existing-project.test.ts`: 既存プロジェクトセットアップスクリプトのテストを追加（3テスト）
- `setup-interactive.test.ts`: 対話式設定ツールのテストを追加（11テスト）
- `create-project.test.ts`: `.env`作成時の`cwd`修正をテストするケースを追加（2テスト）

## [0.0.7] - 2025-11-14

### Fixed
- CLIバージョン表示が正しく動作しない問題を修正
  - `michi --version`が`1.0.0`と表示されていた問題を修正
  - `package.json`から動的にバージョンを読み込むように変更
  - シンボリックリンク経由での実行時も正しく動作するように条件チェックを改善（`fileURLToPath`と`realpathSync`を使用）

## [0.0.6] - 2025-11-14

### Fixed
- NPM公開パッケージのCLIコマンドが実行権限不足で動作しない問題を修正
  - Windows互換のNode.jsスクリプト（`scripts/set-permissions.js`）を追加
  - `postbuild`を`chmod`コマンドから`node scripts/set-permissions.js`に変更
  - Windows環境では権限設定をスキップし、Unix系OSでのみ実行権限を付与
  - これにより`npm install -g @sk8metal/michi-cli`後、すべてのプラットフォームで`michi --version`や`michi --help`が正常に動作するようになります

### Changed
- ドキュメント構造を大幅に再編成（目的別カテゴリに分類）
  - `docs/getting-started/`: 初めてMichiを使う方向けのガイド
  - `docs/guides/`: 実践的な開発ガイド
  - `docs/reference/`: コマンド・設定値リファレンス
  - `docs/contributing/`: コントリビューター向けガイド
- `setup.md`を利用者向け（`docs/getting-started/setup.md`）と開発者向け（`docs/contributing/development.md`）に分離
- ルートに`CONTRIBUTING.md`を追加（コントリビューションガイドラインの明確化）
- `docs/README.md`を追加（ドキュメントハブとして機能）

### Added
- `docs/getting-started/quick-start.md`: 5分で始めるクイックスタートガイド
- 39箇所以上のドキュメント内リンクを新しい構造に合わせて更新
- `npm run format`コマンドを追加（Prettierによるコードフォーマット）

## [0.0.5] - 2025-11-13

### Changed
- 設定ファイルパスを`.kiro/config.json`から`.michi/config.json`に変更（Michi専用設定として明確化）
- プロジェクト命名規則を`customer-{id}-{service}`から`{YYYYMMDD}-{PJ名}`形式に変更
- マルチプロジェクト構成を1リポジトリ内で複数プロジェクト管理に変更
- ドキュメント内の「A社」「B社」表記を「プロジェクトA」「プロジェクトB」に統一
- `config-reference.md`の設定値説明を表形式に変更（可読性向上）
- `env.example`のJIRA Issue Type ID例を現実的な値（10036, 10037）に更新

### Added
- `/kiro:project-switch`コマンドに対話式選択機能を追加（パラメータなし実行時）
- プロジェクト検出条件の明確化（`.kiro/project.json`の存在を必須条件として明記）

### Fixed
- Zod v4対応の型エラーを修正（`config-loader.test.ts`の型アサーションを更新）


## [0.0.4] - 2025-11-13

### Changed
- Vitest 4への移行（1.x → 4.x）
- ESLint 9への移行（8.x → 9.x、Flat Config対応）
- Zod 4への移行（3.x → 4.x）

### Dependencies
- Updated `vitest` from `^1.6.1` to `^4.0.8`
- Updated `@vitest/coverage-v8` from `^1.6.1` to `^4.0.8`
- Updated `eslint` from `^8.57.1` to `^9.39.1`
- Updated `@typescript-eslint/eslint-plugin` from `^6.21.0` to `^8.46.4`
- Updated `@typescript-eslint/parser` from `^6.21.0` to `^8.46.4`
- Updated `typescript-eslint` from `^6.21.0` to `^8.46.4`
- Updated `zod` from `^3.25.76` to `^4.1.12`
- Updated `@octokit/rest` from `^20.1.2` to `^22.0.1`
- Updated `googleapis` from `^126.0.1` to `^166.0.0`
- Updated `@types/node` from `^20.19.24` to `^24.10.1`
- Updated `@types/markdown-it` from `^13.0.9` to `^14.1.2`

## [0.0.3] - 2025-11-12

### Added
- CI/CDパイプラインの整備
- テストカバレッジレポートの自動生成

## [0.0.2] - 2025-11-12

### Changed
- パッケージ名を `@sk8metalme/michi-cli` から `@sk8metal/michi-cli` に変更
- ドキュメント内のパッケージ名参照を更新（README.md、docs/setup.md）

## [0.0.1] - 2025-11-12

### Added
- 初回リリース
- AI駆動開発ワークフロー自動化プラットフォーム
- Confluence/JIRA連携機能
- GitHub SSoT（Single Source of Truth）管理
- マルチプロジェクト対応
- フェーズバリデーション機能
- 自動化スクリプト（Markdown↔Confluence同期、JIRA連携、PR自動化）

