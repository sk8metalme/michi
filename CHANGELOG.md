# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Multi-Repo AI支援コマンド**: AI駆動によるMulti-Repoプロジェクトの初期化・要件定義・設計書生成
  - `/michi_multi_repo:spec-init`: プロジェクト説明から自動初期化、spec.jsonでメタデータ管理
    - プロジェクト名の自動生成（feature-name形式）
    - ディレクトリ構造の自動作成（`docs/michi/{project-name}/`）
    - テンプレートファイルの自動展開
    - `.michi/config.json`への自動登録
  - `/michi_multi_repo:spec-requirements`: EARS形式の要件定義書自動生成
    - 登録リポジトリ情報の自動反映
    - サービス構成図（Mermaid）の作成
    - インターフェース要件の定義
    - サービス間依存関係の明記
  - `/michi_multi_repo:spec-design`: C4モデルに基づいた設計書自動生成
    - システム全体図の自動生成
    - サービス横断アーキテクチャの設計
    - デプロイメントアーキテクチャの可視化
    - セキュリティ・データモデルの設計
  - テンプレート拡張: Multi-Repo固有テンプレート
    - `templates/multi-repo/spec.json`: メタデータ管理（phase、approvals状態）
    - `templates/multi-repo/overview/{requirements,architecture,sequence}.md`
    - `templates/multi-repo/steering/multi-repo.md`
    - `templates/multi-repo/tests/strategy.md`
    - `templates/multi-repo/docs/{ci-status,release-notes}.md`
  - コマンド配布機構: `templates/claude/commands/michi_multi_repo/`でGit管理

## [0.8.4] - 2025-12-20

### Fixed

- **multi-repoコマンドにprojectRootパラメータを追加**
  - マルチリポジトリ環境で正しいプロジェクトルートを参照できるように改善
  - `findProject()`と`getConfig()`に`projectRoot`パラメータを渡すように修正
  - 影響コマンド: `multi-repo-ci-status`, `multi-repo-confluence-sync`, `multi-repo-init`, `multi-repo-test`

## [0.8.3] - 2025-12-20

### Added

- **env-loader.tsのテストカバレッジ向上**
  - 0%から100%に改善（5つの新しいテストケースを追加）
  - グローバル環境変数読み込みのテスト
  - ローカル環境変数読み込みのテスト
  - グローバル/ローカルの上書き動作のテスト
  - ファイル不在時のエラーハンドリングテスト

- **環境変数の上書き機能を改善**
  - ローカル`.env`がグローバル`~/.michi/.env`を確実に上書きするよう`override: true`を追加
  - プロジェクト固有の環境変数が優先されるように修正

### Fixed

- **config-loaderの環境変数読み込みリグレッションを修正**
  - config-loaderをインポートするだけのスクリプト（`config-validator.ts`、`validate-phase.ts`、`config-global.ts`）で環境変数が読み込まれない問題を解決
  - `loadEnv()`をconfig-loaderのモジュール初期化時に復活させることで修正
  - 影響: `npm run config:validate`などのコマンドが正常に動作するように

- **ESLint警告を修正**
  - multi-repo-renderer.tsの未使用パラメータ警告を解消

## [0.8.2] - 2025-12-19

### Removed

- **未使用の依存関係を削除**
  - `googleapis` パッケージを削除（ソースコード内で使用されていないことを確認）
  - パッケージサイズを削減（712行の依存関係を削除）

## [0.8.1] - 2025-12-19

### Fixed

- **`michi init --claude-agent` でagentsディレクトリが配置されない問題を修正**
  - `init.ts` のStep 4が `--michi-path` オプション指定時のみ実行されていた問題を解決
  - テンプレートディレクトリを自動検出し、常にテンプレートをコピーするように変更
  - claude-agent環境で agents と rules の両方をコピーするロジックを追加（setup-existing.ts と同様）
  - エラー処理を追加し、テンプレートコピー失敗時も処理を継続

## [0.8.0] - 2025-12-19

### Added

- **ドキュメントレビューサブエージェント**: Agent Skills仕様準拠の汎用Markdownレビューエージェントを追加
  - `templates/claude-agent/agents/doc-reviewer.md`: すべての.mdファイルをレビュー対象
  - Agent Skills仕様（https://agentskills.io/specification）に準拠
    - `tools` → `allowed-tools`に変更
    - `metadata`（author, version）追加
    - `license`（MIT）追加
  - ドキュメント種別ごとの専用チェック（README、requirements、design、tasks、API仕様、CHANGELOG）
  - Michi固有チェック（@参照整合性、プレースホルダー検出、Phase 0.3-0.4準拠）
  - 詳細なレビュー結果出力（文量、禁止パターン、必須セクション、総合評価）

## [0.7.0] - 2025-12-19

### Added

- **PRサイズ監視機能**: `/michi:spec-impl` コマンドにPRサイズチェック機能を追加（Phase 4.4）
  - 500行を超えるPRに対して警告と分割提案
  - ロックファイル（package-lock.json, yarn.lock等）などの自動生成ファイルを除外
  - PRサイズ監視サブエージェント（`templates/claude/agents/pr-size-monitor/AGENT.md`）を追加
- **仕様書アーカイブ機能**: 完了した仕様書を `.kiro/specs/archive/` に移動する機能を追加
  - `spec:archive <feature> [--reason]`: 完了した仕様書をアーカイブ
  - `spec:list [--all]`: 仕様書一覧表示（--all でアーカイブ済みも表示）
  - アーカイブ条件: Phase が `implementation-complete` かつ `release-notes-*.md` ファイルが存在
  - パストラバーサル攻撃対策: feature名の厳格なバリデーション（英数字、ハイフン、アンダースコアのみ許可）

### Removed

- マルチプロジェクト切り替え機能を削除（`.kiro/project.json` による単一プロジェクト管理は維持）
  - `/michi:project-switch` コマンドを削除
  - `project:list` コマンドを削除
  - `project:dashboard` コマンドを削除
  - `create-project` スクリプトを削除
  - `list-projects` スクリプトを削除
  - **Note**: プロジェクトメタデータ処理（`project-meta.ts`, `project-finder.ts`）は Confluence/JIRA 連携で使用されるため保持

### Security

- **パストラバーサル脆弱性の修正**: `spec-archiver.ts` の feature名バリデーション強化
  - `../../../etc/passwd` などの不正なパスを検出・拒否
  - 空文字チェック、パス区切り文字チェック、英数字制限を実装
  - 29個の包括的なテストケースを追加（セキュリティテスト、機能テスト）

## [0.6.0] 

### Added - Multi-Repo機能（Phase 1-3）

**🎉 メジャー機能追加**: 複数のGitHubリポジトリを単一プロジェクトとして統合管理する「Multi-Repo機能」を追加

#### Phase 1 (MVP): プロジェクト管理基盤
- **`michi multi-repo:init`**: 新規Multi-Repoプロジェクトの初期化
  - プロジェクト名、JIRAキー、Confluenceスペースの指定
  - 標準化されたディレクトリ構造の自動生成（`docs/michi/{project-name}/`）
  - テンプレートファイルの展開（requirements.md、architecture.md、multi-repo.md等）
  - `.michi/config.json` への自動登録
- **`michi multi-repo:add-repo`**: リポジトリの登録管理
  - GitHub HTTPS URLのみサポート（セキュリティ対策）
  - ブランチ指定機能
  - 重複チェックとバリデーション
- **`michi multi-repo:list`**: プロジェクト一覧表示
  - 登録済みプロジェクトとリポジトリ情報の表示
  - JIRAキー、Confluenceスペースの確認

#### Phase 2: CI/CD統合とテスト実行
- **`michi multi-repo:ci-status`**: CI結果の集約と可視化
  - GitHub Actions APIとの統合（Personal Access Token認証）
  - 複数リポジトリのCI結果を並列取得（最大10並列、Exponential Backoff実装）
  - CI結果のMarkdownファイル出力（`docs/michi/{project-name}/docs/ci-status.md`）
  - レート制限対策（再試行ロジック、キャッシング戦略）
- **`michi multi-repo:test`**: 統合テストの実行
  - テストタイプ指定（e2e, integration, performance）
  - ヘルスチェック機能（依存サービスの起動確認）
  - リアルタイム出力表示
  - 終了コードによる成否判定

#### Phase 3: Confluenceドキュメント同期
- **`michi multi-repo:confluence-sync`**: Confluenceへの自動同期
  - プロジェクトドキュメントのConfluenceページ作成・更新
  - ドキュメントタイプ指定（requirements, architecture, sequence, strategy）
  - Mermaidダイアグラムの自動変換（Confluenceマクロ形式）
  - 階層構造の自動生成（プロジェクト → ドキュメントタイプ → 個別ページ）
  - レート制限対策（リクエスト間隔500ms、環境変数で調整可能）

#### セキュリティ強化
- **多層防御**: Zodスキーマバリデーション + 明示的バリデーション関数の二重チェック
- **パストラバーサル対策**: プロジェクト名にパス区切り文字（`/`, `\`）、相対パス（`.`, `..`）を禁止
- **制御文字対策**: ターミナルエスケープシーケンス、改行文字、ヌル文字を完全にブロック（`/[\x00-\x1F\x7F]/`）
- **コマンドインジェクション対策**: 固定パスのみ使用、シェルメタ文字を含むコマンド連結を防止
- **URLバリデーション**: HTTPS GitHub URLのみ許可、SSH URL・`.git`拡張子・プレースホルダー値を禁止

#### パフォーマンス最適化
- **並列処理**: 10リポジトリのCI結果を30秒以内に取得（Promise.all使用）
- **大規模プロジェクト対応**: 100リポジトリのCI結果を5分以内に集約（実測: 30リポジトリで推定達成）
- **メモリ効率**: 1000プロジェクトのconfig.json読み込みを100MB以内で実行（実測: 8.58MB、目標の92%改善）
- **キャッシング戦略**: config.jsonのファイルベースキャッシング（mtimeベース）、CI結果の15分間キャッシュ

#### テストカバレッジ
- **単体テスト**: 28テストケース（config-loader、github-actions-client、mermaid-converter、multi-repo-validator）
- **統合テスト**: Phase 1-3の統合フロー（モックAPI使用）
- **E2Eテスト**: 実際のGitHub/Confluence環境でのエンドツーエンド検証
- **パフォーマンステスト**: 3テストケース（CI並列取得、大規模集約、config読み込み）
- **セキュリティテスト**: 28テストケース（パストラバーサル10ケース、制御文字9ケース、コマンドインジェクション8ケース）

#### ドキュメント整備
- **ユーザーガイド**: `docs/user-guide/guides/multi-repo-guide.md`（566行、6コマンドの詳細説明、トラブルシューティング、FAQ）
- **API仕様書**: `docs/user-guide/reference/multi-repo-api.md`（830行、データモデル、設定スキーマ、外部/内部API仕様）
- **設計ドキュメント**: `.kiro/specs/multi-repo/design.md`（実装との整合性確認、設計変更履歴）
- **マイグレーションガイド**: 既存Michiユーザー向けの設定追加手順

### Changed
- **config.jsonスキーマ拡張**: `multiRepoProjects` 配列フィールドを追加
  - 後方互換性維持: フィールドが存在しない場合は空配列として扱う
  - 既存設定への影響なし

### Technical Details
- **新規コンポーネント**:
  - `scripts/github-actions-client.ts`: GitHub Actions API抽象化レイヤー
  - `scripts/mermaid-converter.ts`: MermaidダイアグラムのConfluenceマクロ変換
  - `scripts/utils/multi-repo-validator.ts`: セキュリティバリデーション
- **外部統合**:
  - GitHub Actions API（@octokit/rest ^22.0.1）
  - Confluence REST API（axios ^1.13.1）
- **認証**: 環境変数による認証（`GITHUB_TOKEN`, `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`）

### Breaking Changes
- **なし**: すべての変更は新機能の追加または既存機能の拡張

### Migration Guide
既存Michiユーザーは特別なマイグレーション不要。詳細は [マイグレーションガイド](#マイグレーション) を参照。

---

## [0.5.0] - 2025-12-14

### Added
- **設定移行コマンド**: `michi migrate` コマンドを追加（.env から 3層設定アーキテクチャへの移行）
  - `--dry-run`: 変更内容のプレビュー
  - `--force`: 確認プロンプトのスキップ
  - `--rollback`: バックアップからの復元
  - 自動バックアップ作成
  - 移行後の設定検証
- **設定検証コマンド**: `michi config:validate` コマンドを追加
  - セキュリティ検証（APIトークン、URL、パーミッション）
  - 設定ファイルの整合性チェック
  - エラーと警告の詳細レポート
- **セキュリティバリデーター**: 環境変数とAPIトークンの検証機能を追加
  - Atlassian URL/Email/API Token の検証
  - GitHub Organization/Token の検証
  - リポジトリURLの検証
  - ファイルパーミッションのチェック（.env は 600 または 644 を推奨）

### Changed
- **BREAKING: GITHUB_REPO環境変数の廃止**: `.kiro/project.json` の `repository` フィールドに統合
  - 環境変数からメタデータへの移行により、3層設定アーキテクチャを実現
  - 影響箇所: `scripts/utils/env-config.ts`, `scripts/utils/project-meta.ts`
  - 移行ガイド: `michi migrate` コマンドで自動移行可能

### Improved
- **テストカバレッジの大幅向上**: 28% → 50% （75%向上）
  - project-meta.ts のテストを追加（95% カバレッジ達成）
  - vitest.config.ts に現実的な50%閾値を設定
  - 統合テスト中心のファイルを除外リストで管理
- **ドキュメント整備**: v0.5.0 移行に関する全ドキュメントを更新（8ファイル）
  - セットアップガイドの GITHUB_REPO 参照を削除
  - ハンズオンチュートリアルを v0.5.0 仕様に更新
  - テンプレートファイルに廃止予定警告を追加

### Fixed
- **Lint エラー修正**: ESLint 準拠のコード品質向上
  - require() スタイルのインポートを ES6 import に変更
  - 未使用変数とインポートの削除（7箇所）

## [0.4.0] - 2025-12-11

### Added
- **統合initコマンド**: `michi init` コマンドを追加（セットアップフローを統合）
  - 対話式プロジェクトセットアップ
  - 環境別設定（Cursor, Claude Code, Claude Agent）の自動生成
  - 影響箇所: 新規コマンド実装
- **多言語サポート強化**: DEV_GUIDELINESプレースホルダーによる多言語対応
  - Phase 4品質チェックでの多言語サポート
  - `/michi:spec-impl` コマンドの多言語機能
- **TDD実装の品質自動化**: `/michi:spec-impl` コマンドに自動品質チェック機能を追加
  - ライセンス監査
  - バージョン監査
  - 自動修正ループ
  - コードレビュー統合

### Changed
- **config:interactiveコマンドの削除**: `michi init` に統合
  - ドキュメント全体を新しいコマンドに合わせて更新
  - 影響箇所: CLI、ドキュメント

### Fixed
- **initコマンドの改善**: コードレビューフィードバックへの対応
  - エラーハンドリングの改善
  - バリデーションの強化
- **テンプレート修正**: test-planning.mdをphase-runner.tsの期待値に合わせて修正
  - テスト計画フローの整合性向上

### Refactored
- **TypeScript型安全性の完全達成**: 96個の型エラーを完全修正（96→0）
  - any型警告の完全解消
  - 型アノテーションの追加
  - 影響箇所: プロジェクト全体
- **コード品質向上**: ヘルパー関数の抽出とモジュール化
  - syncTasksToJIRA関数を509→300行に削減（40%削減）
  - phase runner関数のリファクタリング
  - 未使用変数とインポートの削除

### Docs
- **再発防止策ドキュメント**: Phase 0.3-0.4欠落の再発防止策を文書化
  - テスト計画フェーズの重要性を明確化
  - ワークフロー改善ガイドライン

## [0.3.0] - 2025-12-07

### Changed
- **デフォルトでagent skillsをインストール**: Claude Code環境（`--claude`/`--claude-agent`）で、スキル/サブエージェントがデフォルトでインストールされるように変更
  - 従来の`--with-agent-skills`オプションを`--no-agent-skills`オプションに変更
  - `~/.claude/skills/`と`~/.claude/agents/`に汎用スキル/サブエージェントを自動インストール
  - スキップしたい場合は`--no-agent-skills`オプションを使用
  - 影響箇所: `src/cli.ts`, `src/commands/setup-existing.ts`

### Improved
- **セットアップガイドの大幅な改善**: ドキュメント全体の品質と一貫性を向上
  - `--claude` vs `--claude-agent`の違いを明確化
  - プロジェクト固有vs汎用のサブエージェントの説明を追加
  - セットアップ完了チェックリストにスキル/サブエージェントの確認項目を追加
  - トラブルシューティングセクションを充実
  - デフォルト動作の説明を各所に追加
  - 影響箇所:
    - `docs/user-guide/guides/agent-skills-integration.md`
    - `docs/user-guide/hands-on/claude-setup.md`
    - `docs/user-guide/hands-on/claude-agent-setup.md`
    - その他8つのドキュメントファイル

## [0.2.1] - 2025-12-05

### Fixed
- **型エラー修正**: `phase-runner.ts`の型安全性を改善（#84）
  - `EnvironmentAnswers`インターフェースを追加
  - `answers.suggestedServices`プロパティの型エラー（TS2339）を解消
  - inquirer.prompt()にジェネリック型パラメータを追加
- **inquirer v13対応**: 破壊的変更への対応（#84）
  - `type: 'list'`プロンプトを`type: 'select'`に変更
  - 影響箇所: `scripts/phase-runner.ts` (2箇所)
  - すべてのテスト（421件）が正常に動作することを確認

## [0.2.0] - 2025-12-05

### Fixed
- **セキュリティ脆弱性修正**: jws パッケージの脆弱性（GHSA-869p-cjfg-cm3x）を修正

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
