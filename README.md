# Michi (道)

**M**anaged **I**ntelligent **C**omprehensive **H**ub for **I**ntegration

AI駆動開発ワークフロー自動化プラットフォーム

[![CI](https://github.com/sk8metalme/michi/actions/workflows/ci.yml/badge.svg)](https://github.com/sk8metalme/michi/actions/workflows/ci.yml)
[![Test Setup](https://github.com/sk8metalme/michi/actions/workflows/test-setup.yml/badge.svg)](https://github.com/sk8metalme/michi/actions/workflows/test-setup.yml)
[![Security](https://github.com/sk8metalme/michi/actions/workflows/security.yml/badge.svg)](https://github.com/sk8metalme/michi/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/sk8metalme/michi/branch/main/graph/badge.svg)](https://codecov.io/gh/sk8metalme/michi)

## 概要

Michiは、開発フロー全体（要件定義→設計→タスク分割→実装→テスト→リリース）をAIで自動化するプラットフォームです。

**Powered by [cc-sdd](https://github.com/gotalab/cc-sdd)**

### 主な機能

- ✅ **AI駆動開発**: cc-sdd + Cursor/VS Code統合
- ✅ **多言語サポート**: 12言語対応（AI駆動、翻訳ファイル不要）
- ✅ **GitHub SSoT(Single Source Of True)**: GitHubを情報源として管理
- ✅ **Confluence/JIRA連携**: 承認者向けドキュメント、タスク管理
- ✅ **マルチプロジェクト対応**: 3-5プロジェクト同時進行
- ✅ **自動化スクリプト**: Markdown↔Confluence同期、JIRA連携、PR自動化
- ✅ **フェーズバリデーション**: フェーズ抜け漏れ防止の自動チェック
- ✅ **スキル・サブエージェント**: デザインレビュー、ライセンスチェック、バージョン監査、E2Eプランニング、PRレビュー対応

### アーキテクチャ

```text
GitHub (.kiro/specs/) ← 情報源
    ↓ 自動同期
Confluence ← ドキュメント管理
JIRA ← タスク管理・進捗追跡
```

## ワークフロー構造の概要

### 新ワークフロー構造（推奨）

Michiは以下のフェーズで構成されています:

**Phase 0.0-0.6: 仕様化フェーズ**

- **Phase 0.0**: プロジェクト初期化
- **Phase 0.1**: 要件定義（Requirements） - 必須
- **Phase 0.2**: 設計（Design） - 必須
- **Phase 0.3**: テストタイプ選択（任意）
- **Phase 0.4**: テスト仕様書作成（任意）
- **Phase 0.5**: タスク分割 - 必須
- **Phase 0.6**: JIRA同期 - 必須

**Phase 1: 環境構築（任意）**

- テスト環境のセットアップ
- 開発環境の構築

**Phase 2: TDD実装（必須）**

- テスト駆動開発による実装
- RED-GREEN-REFACTORサイクル

**Phase A: PR前自動テスト（任意）**

- 単体テスト自動実行
- Lint自動実行
- ビルド自動実行

**Phase 3: 追加QA（任意）**

- 統合テスト
- E2Eテスト

**Phase B: リリース準備テスト（任意）**

- 手動テスト実行
- セキュリティテスト
- パフォーマンステスト

**Phase 4: リリース準備（必須）**

- 本番環境構築
- リリースドキュメント作成

**Phase 5: リリース（必須）**

- ステージング環境デプロイ
- 本番環境リリース

### レガシー6-Phaseサポート

後方互換性のため、従来のPhase 0-5構造（要件定義→設計→実装→試験→リリース準備→リリース）もサポートしています。既存プロジェクトはそのまま動作します。

詳細は [ワークフローガイド](./docs/user-guide/guides/workflow.md) を参照してください。

### 対応プロジェクト

Michiは**言語非依存**で、どんなプロジェクトでも使用できます：

- ✅ **Java**（Maven/Gradle）
- ✅ **Python**（pip/poetry/uv）
- ✅ **Go**（go mod）
- ✅ **Node.js**（npm/yarn/pnpm）
- ✅ **Rust**（Cargo）
- ✅ **PHP**（Composer）
- ✅ **Ruby**（Bundler）
- ✅ その他あらゆる言語

**重要**: Michiは`package.json`を要求しません。プロジェクトの設定は`.kiro/project.json`で完結します。

## クイックスタート

### 前提条件

- Node.js 20.x以上（Michi CLIの実行に必要。プロジェクト自体はNode.jsでなくてもOK）
- Git（または Jujutsu (jj) も使用可能）
- **AI開発環境**（以下のいずれか）:
  - [Cursor IDE](https://cursor.sh/) (推奨)
  - [Claude Code](https://claude.com/claude-code)
  - [Gemini CLI](https://geminicli.com/)
  - [Codex CLI](https://developers.openai.com/codex/cli)
  - [Cline](https://cline.bot/) (VSCode拡張)
  - VSCode + 他のAI拡張
- GitHub CLI (gh) - PR作成時に使用
- **GitHub Personal Access Token** - GitHub連携に必要（[作成ガイド](./docs/user-guide/getting-started/github-token-setup.md)）
- **cc-sdd**: AI駆動開発ワークフローのコアフレームワーク

**重要な注意事項**:

- ⚠️ **セットアップ時にテンプレートファイルが不足している場合、エラーが発生します**
  - 最新のMichiをインストールしてください
  - エラーが発生した場合は[トラブルシューティング](./docs/hands-on/troubleshooting.md)を参照
- ⚠️ **tasks.mdのフォーマットが間違っているとJIRA同期が失敗します**
  - 新ワークフロー構造では必須フェーズ（Phase 0.1, 0.2, 2, 4, 5）が必要です
  - レガシー構造では全6フェーズ（Phase 0-5）が必須です
  - AIコマンド実行時は必ずテンプレートを参照するよう指示してください
  - 詳細: [tasks.mdフォーマット問題](./docs/hands-on/troubleshooting.md#問題-tasksmdのフォーマットが間違っているformat-validation-error)

### インストール

#### 方法1: NPMパッケージとしてインストール（推奨）

```bash
# グローバルインストール
npm install -g @sk8metal/michi-cli

# インストール確認
michi --version
```

#### 方法2: リポジトリからクローン（開発者向け）

```bash
# リポジトリのクローン
git clone https://github.com/sk8metalme/michi
cd michi

# Jujutsu (jj) を使う場合
# jj git clone https://github.com/sk8metalme/michi
# cd michi

# 依存関係のインストール
npm install

# ビルド
npm run build

# グローバルコマンドとしてリンク
npm link

# cc-sddのインストール（AI駆動開発ワークフローのコア）
npx cc-sdd@latest --lang ja --cursor
# または Claude Code の場合: npx cc-sdd@latest --lang ja --claude

# 環境変数の設定
cp env.example .env
# .env ファイルを編集して認証情報を設定
#
# 【重要】JIRA Issue Type IDの設定
# JIRA_ISSUE_TYPE_STORY と JIRA_ISSUE_TYPE_SUBTASK は必須です。
# これらの値はJIRAインスタンス固有のため、各デプロイメントで設定が必要です。
#
# 確認方法:
# 1. JIRA管理画面: Settings > Issues > Issue types で確認
# 2. REST API: GET https://your-domain.atlassian.net/rest/api/3/issuetype
#    レスポンスから "Story" と "Subtask" の "id" フィールドを取得

# MCP設定（Cursor用）
# mcp.json.example を参考に ~/.cursor/mcp.json を作成
# （詳細はdocs/getting-started/setup.md参照）
```

詳細なセットアップ手順は [docs/getting-started/setup.md](./docs/getting-started/setup.md) を参照してください。

## 使い方

> **凡例について**: `<feature>` などの記号の意味は [凡例の記号説明](#凡例の記号説明) を参照してください。

### 1. 新機能の開発（推奨フロー）

**AIコマンド + CLIツール実行** で抜け漏れを防止：

```bash
# Phase 0.0: プロジェクト初期化
# 凡例
/kiro:spec-init <機能説明>

# 具体例
/kiro:spec-init ユーザー認証機能

# Phase 0.1: 要件定義
# 凡例
/kiro:spec-requirements <feature>                              # AIで requirements.md 作成
npx @sk8metal/michi-cli phase:run <feature> requirements     # Confluence作成＋バリデーション（必須）

# 具体例
/kiro:spec-requirements user-auth                              # AIで requirements.md 作成
npx @sk8metal/michi-cli phase:run user-auth requirements      # Confluence作成＋バリデーション（必須）

# Phase 0.2: 設計
# 凡例
/kiro:spec-design <feature>                                     # AIで design.md 作成
npx @sk8metal/michi-cli phase:run <feature> design           # Confluence作成＋バリデーション（必須）

# 具体例
/kiro:spec-design user-auth                                     # AIで design.md 作成
npx @sk8metal/michi-cli phase:run user-auth design           # Confluence作成＋バリデーション（必須）

# Phase 0.3-0.4: テスト計画（任意）
# プロジェクトに応じてテストタイプを選択し、テスト仕様書を作成
# 詳細: docs/user-guide/testing/test-planning-flow.md

# Phase 0.5-0.6: タスク分割とJIRA同期
# 凡例
/kiro:spec-tasks <feature>                                      # AIで tasks.md 作成（全フェーズ）
npx @sk8metal/michi-cli phase:run <feature> tasks            # 全フェーズのJIRA作成＋バリデーション（必須）

# 具体例
/kiro:spec-tasks user-auth                                      # AIで tasks.md 作成（全フェーズ）
npx @sk8metal/michi-cli phase:run user-auth tasks            # 全フェーズのJIRA作成＋バリデーション（必須）

# Phase 1: 環境構築（任意）
# テスト環境のセットアップ、開発環境の構築

# Phase 2: TDD実装
# 凡例
/kiro:spec-impl <feature>                            # TDD実装開始

# 具体例
/kiro:spec-impl user-auth                            # TDD実装開始

# Phase A: PR前自動テスト（任意）
# CI/CDで自動実行される単体テスト、Lint、ビルド

# Phase 3: 追加QA（任意）
# tasks.mdに従って統合テスト、E2Eテストを実施

# Phase B: リリース準備テスト（任意）
# 手動テスト、セキュリティテスト、パフォーマンステストを実施

# Phase 4-5: リリース準備・リリース
# tasks.mdのPhase 4-5に従ってリリース準備・本番リリース
```

**重要**: Phase 0.1, 0.2, 0.5-0.6では `npx @sk8metal/michi-cli phase:run` を実行しないと、Confluence/JIRAが作成されず、承認者がレビューできません。

**CLIツールの使用方法**:

- **npx実行（推奨）**: `npx @sk8metal/michi-cli <command>` - 常に最新版を使用
- **グローバルインストール**: `npm install -g @sk8metal/michi-cli` 後、`michi <command>` で実行
- **ローカル開発**: `npm run michi <command>` または `npx tsx src/cli.ts <command>`

### 2. バリデーション確認

```bash
# 凡例
npx @sk8metal/michi-cli validate:phase <feature> <phase>

# 具体例
npx @sk8metal/michi-cli validate:phase user-auth requirements  # 要件定義チェック
npx @sk8metal/michi-cli validate:phase user-auth design         # 設計チェック
npx @sk8metal/michi-cli validate:phase user-auth tasks          # タスク分割チェック
```

### 3. 個別実行

```bash
# 凡例
npx @sk8metal/michi-cli confluence:sync <feature> <doc-type>
npx @sk8metal/michi-cli jira:sync <feature>
npx @sk8metal/michi-cli workflow:run --feature <feature>

# 具体例
npx @sk8metal/michi-cli confluence:sync user-auth requirements  # Confluenceに同期
npx @sk8metal/michi-cli jira:sync user-auth                     # JIRAタスク作成
npx @sk8metal/michi-cli preflight                               # プリフライトチェック
npx @sk8metal/michi-cli spec:list                               # 仕様書一覧
npx @sk8metal/michi-cli spec:archive user-auth                  # 完了した仕様書をアーカイブ
npx @sk8metal/michi-cli workflow:run --feature user-auth       # ワークフロー実行
```

### 実装フェーズ（JIRA連携）

```bash
# AIコマンドで実装（JIRA連携は自動）
# /kiro:spec-impl user-auth
# ↑ spec.json から JIRA 情報を自動取得
# ↑ Epic + 最初の Story を「進行中」に移動
# ↑ TDD 実装
# ↑ PR 作成
# ↑ Epic + 最初の Story を「レビュー待ち」に移動
# ↑ PR リンクを JIRA にコメント

# 個別のJIRA操作（必要な場合のみ）
npx @sk8metal/michi-cli jira:transition <issueKey> <status>
npx @sk8metal/michi-cli jira:comment <issueKey> <comment>

# 具体例
npx @sk8metal/michi-cli jira:transition MICHI-123 "In Progress"
npx @sk8metal/michi-cli jira:comment MICHI-123 "PRを作成しました: https://github.com/..."
```

## プロジェクト構造

```text
michi/
├── .cursor/          # Cursor IDE設定
├── .kiro/            # AI-DLC設定
│   ├── project.json  # プロジェクトメタデータ
│   ├── settings/     # テンプレート
│   ├── specs/        # 機能仕様書（GitHub SSoT）
│   └── steering/     # AIガイダンス
├── templates/        # cc-sdd準拠のマルチ環境テンプレート（Issue #35）
│   ├── cursor/       # Cursor IDE用テンプレート
│   │   ├── rules/    # ルールファイル（.mdc）
│   │   └── commands/
│   │       └── michi/ # Michi専用コマンド
│   ├── claude/       # Claude Code用テンプレート（プレースホルダー含む）
│   │   ├── rules/    # ルールファイル（.md、統合版）
│   │   └── commands/
│   │       └── michi/ # Michi専用コマンド（言語指示含む）
│   └── claude-agent/ # Claude Agentテンプレート
├── scripts/          # 自動化スクリプト
├── docs/             # ドキュメント
├── env.example       # 環境変数テンプレート
├── mcp.json.example  # MCP設定テンプレート
└── package.json      # 依存関係
```

### テンプレートアーキテクチャ

Michiは**cc-sdd準拠の多環境対応**を目指しています：

#### 設計原則

1. **単一の英語テンプレート**: 言語別ファイルを作らない
2. **プレースホルダー使用**: `{{LANG_CODE}}`, `{{DEV_GUIDELINES}}` 等
3. **AI駆動の多言語生成**: 実行時にAIが指定言語で出力
4. **セットアップ時は置換しない**: テンプレートをそのままコピー、AIが実行時に解釈

#### プレースホルダー一覧

| プレースホルダー     | 説明             | 例                                       |
| -------------------- | ---------------- | ---------------------------------------- |
| `{{LANG_CODE}}`      | 言語コード       | ja, en                                   |
| `{{DEV_GUIDELINES}}` | 言語別AI指示     | "Think in English, generate in Japanese" |
| `{{KIRO_DIR}}`       | 仕様書ルート     | .kiro                                    |
| `{{AGENT_DIR}}`      | エージェント設定 | .claude                                  |
| `{{PROJECT_ID}}`     | プロジェクトID   | michi                                    |
| `{{FEATURE_NAME}}`   | 機能名           | user-auth                                |

#### テンプレート例

```markdown
# Michi Core Principles

## Development Guidelines

{{DEV_GUIDELINES}}

## Language

All generated documents should be in: **{{LANG_CODE}}**

## Project Metadata

- Project ID: {{PROJECT_ID}}
- Kiro directory: {{KIRO_DIR}}
- Agent directory: {{AGENT_DIR}}
```

**利点:**

- ✅ 静的翻訳ファイル不要（メンテナンスコスト削減）
- ✅ cc-sddとの完全互換
- ✅ Cursor/Claude両環境で動作
- ✅ プロジェクト固有値の動的生成

### 設定ファイル

OSS公開に対応するため、以下のテンプレートファイルを用意しています：

- **`env.example`**: 環境変数の設定テンプレート
  - Atlassian (Confluence/JIRA) 認証情報
  - GitHub認証情報
  - プロジェクト固有設定
  - **ワークフロー承認ゲート設定**（オプション）
- **`mcp.json.example`**: MCP設定テンプレート
  - Cursor/VS Code用のAtlassian MCP設定

- **`.michi/config.json`**: プロジェクト固有の設定ファイル（オプション）
  - Confluenceページ作成粒度の設定
  - JIRAストーリー作成粒度の設定
  - ワークフロー設定
  - 詳細は [設定値リファレンス](./docs/reference/config.md) を参照
  - **注意**: 以前は `.kiro/config.json` を使用していましたが、Michi専用の設定ファイルとして `.michi/config.json` に変更されました。

**初回セットアップ時:**

```bash
# 環境変数を設定
cp env.example .env
# .env を編集して実際の認証情報を入力
# 承認ゲートのロール名も必要に応じてカスタマイズ

# MCP設定を作成
cp mcp.json.example ~/.cursor/mcp.json
# ~/.cursor/mcp.json を編集して実際の認証情報を入力

# プロジェクト固有設定（オプション）
# .michi/config.json を作成して、Confluence/JIRAの動作をカスタマイズ
# 詳細は docs/reference/config.md を参照
```

**承認者の設定:**
ワークフロー実行時の承認者ロール名は、`.env`ファイルで設定できます：

```bash
# デフォルト値（英語）
APPROVAL_GATES_REQUIREMENTS=projectLeader,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=serviceManager,director

# 日本語ロール名の例
APPROVAL_GATES_REQUIREMENTS=PL,部長
APPROVAL_GATES_DESIGN=アーキテクト,部長
APPROVAL_GATES_RELEASE=SM,部長
```

詳細は [セットアップガイド](./docs/getting-started/setup.md#3-3-ワークフロー承認ゲートの設定オプション) を参照してください。

## 他のリポジトリでプロジェクトを進める

### Multi-Repoプロジェクトの管理（NEW）

**新機能**: 複数のGitHubリポジトリを単一プロジェクトとして統合管理するMulti-Repo機能が追加されました。

**使用ケース**:
- マイクロサービスアーキテクチャで複数のサービスリポジトリを管理
- フロントエンド・バックエンド・インフラを別リポジトリで管理
- 複数リポジトリのCI/CD状態を一元管理
- 複数リポジトリの統合ドキュメントをConfluenceで管理

**AI支援による初期化・設計（推奨）**:

```bash
# 1. AIでプロジェクト初期化（プロジェクト説明から自動生成）
/michi_multi_repo:spec-init "マイクロサービスアーキテクチャでECサイトを構築" --jira MSV --confluence-space MSV

# 2. リポジトリ登録（CLIコマンド）
michi multi-repo:add-repo my-microservices --name frontend --url https://github.com/org/frontend --branch main
michi multi-repo:add-repo my-microservices --name backend --url https://github.com/org/backend --branch main

# 3. AIで要件定義書生成
/michi_multi_repo:spec-requirements my-microservices

# 4. AIで設計書生成（アーキテクチャ図含む）
/michi_multi_repo:spec-design my-microservices

# 5. Confluence同期
michi multi-repo:confluence-sync my-microservices
```

**従来のCLIコマンドでの初期化**:

```bash
# CLIコマンドのみで初期化
michi multi-repo:init my-microservices --jira MSV --confluence-space MSV
michi multi-repo:add-repo my-microservices --name frontend --url https://github.com/org/frontend --branch main
michi multi-repo:list  # プロジェクト確認
```

詳細は [Multi-Repo管理ガイド](./docs/user-guide/guides/multi-repo-guide.md) を参照してください。

### 推奨ワークフロー（cc-sdd準拠）

既存リポジトリにMichiを導入する標準的な手順です：

```bash
# Step 1: cc-sddで標準ファイル生成
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイルを追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

**ステップの説明**:

1. **cc-sdd導入**: AI駆動開発ワークフローのコアフレームワークをインストール
2. **Michi固有ファイル追加**: Confluence/JIRA連携、マルチプロジェクト管理などのMichi専用機能を追加
3. **環境設定**: 認証情報とプロジェクトメタデータを対話的に設定

### IDE別セットアップ例

#### Cursor IDE（推奨）

```bash
# Step 1: cc-sdd導入
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイル追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
# または npm run michi:setup:cursor

# Step 3: 環境設定
npm run setup:interactive
```

#### Claude Code

```bash
# Step 1: cc-sdd導入
npx cc-sdd@latest --claude --lang ja

# Step 2: Michi固有ファイル追加
npx @sk8metal/michi-cli setup-existing --claude --lang ja
# または npm run michi:setup:claude

# Step 3: 環境設定
npm run setup:interactive
```

#### Gemini CLI

```bash
# Step 1: cc-sdd導入（準備中 - 現在はスキップ可能）
# npx cc-sdd@latest --gemini --lang ja

# Step 2: Michi固有ファイル追加
npx @sk8metal/michi-cli setup-existing --gemini --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

**Gemini CLI特有の機能**:

- `.gemini/GEMINI.md` - プロジェクトコンテキスト（階層的ロード対応）
- `.gemini/extensions/` - 拡張機能

#### Codex CLI

```bash
# Step 1: cc-sdd導入（必須）
npx cc-sdd@latest --codex --lang ja

# Step 2: Michi拡張をインストール
npx @sk8metal/michi-cli setup-existing --codex --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

**Codex CLI + cc-sdd統合**:

- ✅ **完全対応**: cc-sddとの統合により、Michiワークフロー全機能をサポート
- ✅ **11個の /kiro:* コマンド**: cc-sddが提供（spec-init, requirements, design, tasks, impl など）
- ✅ **1個の /prompts:confluence-sync コマンド**: Michi独自（Confluence連携）
- ✅ **AGENTS.md**: プロジェクトコンテキスト（cc-sdd提供 + Michi拡張）
- ✅ **`.kiro/` ディレクトリ**: Spec-Driven Development構造

**詳細**: `templates/codex/rules/README.md` を参照

#### Cline (VSCode拡張)

```bash
# Step 1: VSCodeにCline拡張をインストール
# https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev

# Step 2: Michi固有ファイル追加
npx @sk8metal/michi-cli setup-existing --cline --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

**Cline特有の機能**:

- `.clinerules/rules/` - プロジェクト固有のルール（Markdown形式）
- ルールのトグル機能（v3.13以降）- 各ルールファイルを個別に有効/無効化可能

#### Windsurf IDE

```bash
# Step 1: cc-sdd導入
npx cc-sdd@next --windsurf --lang ja

# Step 2: Michi固有ファイル追加（Cursor互換モード）
npx @sk8metal/michi-cli setup-existing --cursor --lang ja

# Step 3: 環境設定
npm run setup:interactive
```

### 既存リポジトリ vs 新規リポジトリ

#### 既存リポジトリにMichiを追加（推奨）

既に稼働しているプロジェクトにMichiを追加する場合：

```bash
# 既存プロジェクトのディレクトリに移動
cd /path/to/existing-repo

# 推奨ワークフローを実行
npx cc-sdd@latest --cursor --lang ja
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
npm run setup:interactive
```

**自動的に追加されるもの**:

- 共通ルール（`.cursor/rules/`または`.claude/rules/`）
- Michi専用コマンド（`.cursor/commands/michi/`または`.claude/commands/michi/`）
- Steeringテンプレート（`.kiro/steering/`）
- Specテンプレート（`.kiro/settings/templates/`）
- プロジェクトメタデータ（`.kiro/project.json`）
- 環境変数テンプレート（`.env`）

#### 新規リポジトリを作成してMichiを導入

新しいプロジェクトをゼロから始める場合：

```bash
# Michiディレクトリから実行
cd /path/to/michi
npm run create-project -- \
  --name "20240115-payment-api" \
  --project-name "プロジェクトA" \
  --jira-key "PRJA"
```

詳細: [新規リポジトリセットアップガイド](./docs/getting-started/new-repository-setup.md)

**どちらを選ぶべきか？**

- ✅ **既存リポジトリに追加**: 既に稼働中のプロジェクトがある場合
- ✅ **新規リポジトリ作成**: 新しいプロジェクトを始める場合

## ドキュメント

### はじめに

- [クイックスタート](./docs/getting-started/quick-start.md) - 5分で始める ⭐
- [セットアップガイド](./docs/getting-started/setup.md) - インストール・設定手順
- [新規リポジトリセットアップ](./docs/getting-started/new-repository-setup.md) - 新規リポジトリでの開始方法
- **[ハンズオンガイド](./docs/hands-on/README.md)** - 実際に手を動かして学ぶ1時間のチュートリアル ⭐

### 実践ガイド

- [ワークフローガイド](./docs/guides/workflow.md) - AI開発フロー ⭐
- [フェーズ自動化ガイド](./docs/guides/phase-automation.md) - Confluence/JIRA自動作成 ⭐
- [マルチプロジェクト管理](./docs/guides/multi-project.md) - 複数プロジェクト管理
- [カスタマイズガイド](./docs/guides/customization.md) - Confluence/JIRA階層構造のカスタマイズ
- [多言語サポートガイド](./docs/guides/internationalization.md) - AI駆動多言語対応（12言語サポート） ⭐

### リファレンス

- [クイックリファレンス](./docs/reference/quick-reference.md) - コマンド一覧、チートシート ⭐
- [設定値リファレンス](./docs/reference/config.md) - `.michi/config.json`の全設定値の説明

### コントリビューター向け

- [コントリビューションガイド](./CONTRIBUTING.md) - 貢献方法
- [開発環境セットアップ](./docs/contributing/development.md) - 開発者向けセットアップ
- [リリース手順](./docs/contributing/release.md) - バージョンアップ・NPM公開手順
- [テスト戦略](./docs/testing-strategy.md) - テストカバレッジ目標と段階的計画 ⭐

すべてのドキュメントは [docs/README.md](./docs/README.md) から参照できます。

## CI/CD

このプロジェクトでは、GitHub Actionsを使用してCI/CDパイプラインを構築しています。

### 自動実行されるチェック

- **テスト**: プッシュ・PR時に自動テスト実行（Node.js 20.x, 22.x）
- **リント**: ESLintによるコード品質チェック
- **型チェック**: TypeScriptの型チェック
- **セキュリティスキャン**: 週1回の依存関係脆弱性スキャン
- **カバレッジレポート**: テストカバレッジの自動生成・アップロード

### リリース

- **自動リリース**: `v*`タグ作成時に自動NPMパッケージ公開
- **Dependabot**: 依存関係の自動更新プルリクエスト

詳細は [CI/CD整備計画](./docs/contributing/ci-cd.md) を参照してください。

### NPM_TOKEN設定

リリース自動化を有効にするには、NPM_TOKENの設定が必要です。

**設定手順**: [NPM_TOKEN設定ガイド](./docs/contributing/npm-token-setup.md)

**設定内容**:

1. NPMアカウントでAutomation Tokenを生成
2. GitHub Secretsに`NPM_TOKEN`を追加

設定完了後、`v*`タグを作成すると自動的にNPMパッケージが公開されます。

## 技術スタック

- **AI開発**: [cc-sdd](https://github.com/gotalab/cc-sdd), [Cursor IDE](https://cursor.sh/)
- **バージョン管理**: Git（[Jujutsu (jj)](https://github.com/martinvonz/jj) も使用可能）
- **統合**: [Atlassian MCP](https://www.atlassian.com/ja/platform/remote-mcp-server) (Confluence/JIRA)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **ランタイム**: [Node.js](https://nodejs.org/) 20.x
- **テスト**: [vitest](https://vitest.dev/)
- **HTTP**: [axios](https://github.com/axios/axios), [@octokit/rest](https://github.com/octokit/rest.js)

## ライセンス

MIT License

Copyright (c) 2025 sk8metalme

詳細は [LICENSE](./LICENSE) ファイルを参照してください。

## 謝辞

このプロジェクトは以下のOSSプロジェクト・ツールに支えられています：

### コアフレームワーク・ツール

- **[cc-sdd](https://github.com/gotalab/cc-sdd)** - AIコーディングエージェントを仕様駆動開発に変換するコアフレームワーク（MIT License）
- **[Atlassian MCP Server](https://www.atlassian.com/ja/platform/remote-mcp-server)** - Confluence/JIRA統合
- **[GitHub CLI](https://github.com/cli/cli)** - GitHubコマンドラインツール（MIT License）
- **[Node.js](https://nodejs.org/)** - JavaScript ランタイム（MIT License）
- **[TypeScript](https://www.typescriptlang.org/)** - 型安全なJavaScript（Apache 2.0 License）
- **[Jujutsu (jj)](https://github.com/martinvonz/jj)** - Gitの代替として使用可能（Apache 2.0 License）

### IDE・エディタ

- **[Cursor IDE](https://cursor.sh/)** - AI統合開発環境
- **[Kiro IDE](https://kiro.dev/)** - AI駆動開発プラットフォーム

### 主要npmパッケージ

- **[@octokit/rest](https://github.com/octokit/rest.js)** - GitHub REST API クライアント（MIT License）
- **[axios](https://github.com/axios/axios)** - HTTPクライアント（MIT License）
- **[commander](https://github.com/tj/commander.js)** - CLIフレームワーク（MIT License）
- **[markdown-it](https://github.com/markdown-it/markdown-it)** - Markdownパーサー（MIT License）
- **[turndown](https://github.com/mixmark-io/turndown)** - HTML→Markdown変換（MIT License）
- **[zod](https://github.com/colinhacks/zod)** - スキーマバリデーション（MIT License）
- **[vitest](https://vitest.dev/)** - テストフレームワーク（MIT License）

その他、多くのOSSパッケージに支えられています。詳細は [package.json](./package.json) を参照してください。

## 凡例の記号説明

ドキュメント内で使用している記号の意味：

| 記号             | 説明                 | 例                               |
| ---------------- | -------------------- | -------------------------------- |
| `<feature>`      | 機能名               | user-auth, health-check-endpoint |
| `<project-id>`   | プロジェクトID       | michi, 20240115-payment-api      |
| `<project-name>` | プロジェクト名       | Michi, プロジェクトA             |
| `<phase>`        | フェーズ名           | requirements, design, tasks      |
| `<tasks>`        | タスクID             | FE-1,BE-1, STORY-1               |
| `<doc-type>`     | ドキュメント種類     | requirements, design, tasks      |
| `<jira-key>`     | JIRAプロジェクトキー | MICHI, PRJA                      |

### 凡例と具体例の読み方

ドキュメント内のコマンド例は「凡例」と「具体例」を併記しています：

**凡例**: 汎用的なパターン（記号を使用）

```bash
/kiro:spec-requirements <feature>
```

**具体例**: 実際の使用例

```bash
/kiro:spec-requirements user-auth
```

**注**: `user-auth` は説明用の架空の機能例です。

### 機能名（feature）の命名規則

#### なぜkebab-caseが必要か

feature名は以下の場所で使用されるため、**英語・小文字・ハイフン区切り**が必須です：

| 使用箇所         | 例                                    | 制約理由               |
| ---------------- | ------------------------------------- | ---------------------- |
| ディレクトリ名   | `.kiro/specs/user-auth/`              | ファイルシステム互換性 |
| GitHub URL       | `.../specs/user-auth/requirements.md` | URLセーフ              |
| Confluenceラベル | `user-auth`                           | ラベル検索・フィルタ   |
| JIRA Epic検索    | `labels = "user-auth"`                | JQLクエリ              |
| ブランチ名       | `michi/feature/user-auth`             | Git命名規則            |

#### 命名ルール

**形式**: 英語、kebab-case（ハイフン区切り）、小文字のみ

**ルール**:

- 2-4単語推奨
- 英数字とハイフン(`-`)のみ使用
- スペース、アンダースコア、日本語は不可
- 先頭・末尾のハイフン不可

#### 変換例

| spec-init（日本語説明）      | spec-requirements以降（feature名） |
| ---------------------------- | ---------------------------------- |
| ユーザー認証機能             | `user-auth`                        |
| OAuth 2.0を使った認証        | `oauth-auth`                       |
| 支払い処理機能               | `payment`                          |
| ヘルスチェックエンドポイント | `health-check-endpoint`            |
| 商品検索API                  | `product-search-api`               |
| 在庫管理システム             | `inventory-management`             |

#### 変換のコツ

1. **日本語→英語変換**: 機能の本質を表す英単語を選ぶ
2. **短縮**: 2-4単語に凝縮（長すぎる場合）
3. **一般的な単語**: チーム全員が理解できる英語
4. **一貫性**: 類似機能は統一された命名パターン

#### 良い例・悪い例

✅ **良い例**:

- `user-auth` - 短く明確
- `payment-processing` - 具体的
- `health-check` - 標準的な用語

❌ **悪い例**:

- `ユーザー認証` - 日本語（URL/ラベルに不適）
- `user_auth` - アンダースコア（kebab-caseではない）
- `UserAuth` - CamelCase（kebab-caseではない）
- `user auth` - スペース（ファイルシステム/Git不可）
- `-user-auth` - 先頭ハイフン（無効）
- `very-long-feature-name-for-user-authentication` - 長すぎる

## テスト

Michiプロジェクトは、統合テストによって品質を保証しています。

### テスト実行

```bash
# すべてのテスト実行
npm test

# 統合テストのみ実行
npm run test:integration:setup

# カバレッジ付き実行
npm run test:coverage:setup

# 監視モード
npm test -- --watch

# UIモード
npm run test:ui
```

### テストカバレッジ

- **目標**: 95%以上
- **現在のカバレッジ**: [![codecov](https://codecov.io/gh/sk8metalme/michi/branch/main/graph/badge.svg)](https://codecov.io/gh/sk8metalme/michi)

### テストドキュメント

詳細なテストガイドは [docs/testing/integration-tests.md](./docs/testing/integration-tests.md) を参照してください。

## 参考リンク

### AI開発フレームワーク

- [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_ja.md)
- [cc-sdd コマンドリファレンス](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/command-reference.md)
- [cc-sdd カスタマイズガイド](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/customization-guide.md)
- [Kiro IDE](https://kiro.dev/docs/)

### バージョン管理・Git

- [Jujutsu (jj) 公式サイト](https://martinvonz.github.io/jj/)
- [Jujutsu GitHub](https://github.com/martinvonz/jj)
- [Jujutsu チュートリアル](https://steveklabnik.github.io/jujutsu-tutorial/)

### Atlassian統合

- [Atlassian MCP Server](https://www.atlassian.com/ja/platform/remote-mcp-server)
- [Confluence REST API](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)

### IDE・エディタ

- [Cursor IDE](https://cursor.sh/)
- [VS Code](https://code.visualstudio.com/)

### GitHub

- [GitHub CLI](https://cli.github.com/)
- [Octokit (GitHub REST API)](https://github.com/octokit/rest.js)
