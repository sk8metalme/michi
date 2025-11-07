# Michi (道)
**M**anaged **I**ntelligent **C**omprehensive **H**ub for **I**ntegration

AI駆動開発ワークフロー自動化プラットフォーム

## 概要

Michiは、企業の開発フロー全体（要件定義→設計→タスク分割→実装→テスト→リリース）をAIで自動化するプラットフォームです。

**Powered by [cc-sdd](https://github.com/gotalab/cc-sdd)** - AIコーディングエージェントを仕様駆動開発（Spec-Driven Development）に変換するワークフローフレームワーク

### 主な機能

- ✅ **AI駆動開発**: cc-sdd + Cursor/VS Code統合
- ✅ **GitHub SSoT**: GitHubを真実の源として管理
- ✅ **Confluence/JIRA連携**: 企画・部長の承認フロー
- ✅ **マルチプロジェクト対応**: 3-5プロジェクト同時進行
- ✅ **自動化スクリプト**: Markdown↔Confluence同期、JIRA連携、PR自動化
- ✅ **フェーズバリデーション**: 抜け漏れ防止の自動チェック

### アーキテクチャ

```text
GitHub (.kiro/specs/) ← 真実の源
    ↓ 自動同期
Confluence ← 企画・部長の承認フロー
JIRA ← タスク管理・進捗追跡
```

## クイックスタート

### 前提条件

- Node.js 20.x以上
- Git（または Jujutsu (jj) も使用可能）
- Cursor IDE または VS Code
- GitHub CLI (gh) - PR作成時に使用
- **cc-sdd**: AI駆動開発ワークフローのコアフレームワーク

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/sk8metalme/michi
cd michi

# Jujutsu (jj) を使う場合
# jj git clone https://github.com/sk8metalme/michi
# cd michi

# cc-sddのインストール（AI駆動開発ワークフローのコア）
npx cc-sdd@latest --lang ja --cursor
# または Claude Code の場合: npx cc-sdd@latest --lang ja --claude

# 依存関係のインストール
npm install

# 環境変数の設定
cp env.example .env
# .env ファイルを編集して認証情報を設定

# MCP設定（Cursor用）
# mcp.json.example を参考に ~/.cursor/mcp.json を作成
# （詳細はdocs/setup.md参照）
```

詳細なセットアップ手順は [docs/setup.md](./docs/setup.md) を参照してください。

## 使い方

### 1. 新機能の開発（推奨フロー）

**AIコマンド + CLIツール実行** で抜け漏れを防止：

```bash
# Phase 0: 初期化
/kiro:spec-init ユーザー認証機能

# Phase 1: 要件定義
/kiro:spec-requirements user-auth                    # AIで requirements.md 作成
npx @michi/cli phase:run user-auth requirements      # Confluence作成＋バリデーション（必須）

# Phase 2: 設計
/kiro:spec-design user-auth                          # AIで design.md 作成
npx @michi/cli phase:run user-auth design            # Confluence作成＋バリデーション（必須）

# Phase 3: タスク分割（6フェーズすべて）
/kiro:spec-tasks user-auth                           # AIで tasks.md 作成（要件定義～リリースまで）
npx @michi/cli phase:run user-auth tasks             # 全フェーズのJIRA作成＋バリデーション（必須）

# Phase 4: 実装
/kiro:spec-impl user-auth                            # TDD実装開始

# Phase 5: 試験
# tasks.mdのPhase 3: 試験（Testing）に従ってテスト実施

# Phase 6: リリース準備・リリース
# tasks.mdのPhase 4-5に従ってリリース準備・本番リリース
```

**重要**: 各フェーズで `npx @michi/cli phase:run` を実行しないと、Confluence/JIRAが作成されず、PMや部長がレビューできません。

**CLIツールの使用方法**:
- **npx実行（推奨）**: `npx @michi/cli <command>` - 常に最新版を使用
- **グローバルインストール**: `npm install -g @michi/cli` 後、`michi <command>` で実行
- **ローカル開発**: `npm run michi <command>` または `tsx src/cli.ts <command>`

### 2. バリデーション確認

```bash
# フェーズが完了しているかチェック
npx @michi/cli validate:phase user-auth requirements  # 要件定義チェック
npx @michi/cli validate:phase user-auth design         # 設計チェック
npx @michi/cli validate:phase user-auth tasks          # タスク分割チェック
```

### 3. 個別実行

```bash
# Confluenceに同期
npx @michi/cli confluence:sync user-auth requirements

# JIRAタスク作成
npx @michi/cli jira:sync user-auth

# プリフライトチェック
npx @michi/cli preflight

# プロジェクト一覧
npx @michi/cli project:list

# ワークフロー実行
npx @michi/cli workflow:run --feature user-auth
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
├── scripts/          # 自動化スクリプト
├── docs/             # ドキュメント
├── env.example       # 環境変数テンプレート
├── mcp.json.example  # MCP設定テンプレート
└── package.json      # 依存関係
```

### 設定ファイル

OSS公開に対応するため、以下のテンプレートファイルを用意しています：

- **`env.example`**: 環境変数の設定テンプレート
  - Atlassian (Confluence/JIRA) 認証情報
  - GitHub認証情報
  - プロジェクト固有設定
  - **ワークフロー承認ゲート設定**（オプション）
  
- **`mcp.json.example`**: MCP設定テンプレート
  - Cursor/VS Code用のAtlassian MCP設定

**初回セットアップ時:**
```bash
# 環境変数を設定
cp env.example .env
# .env を編集して実際の認証情報を入力
# 承認ゲートのロール名も必要に応じてカスタマイズ

# MCP設定を作成
cp mcp.json.example ~/.cursor/mcp.json
# ~/.cursor/mcp.json を編集して実際の認証情報を入力
```

**承認ゲートの設定:**
ワークフロー実行時の承認者ロール名は、`.env`ファイルで設定できます：

```bash
# デフォルト値（英語）
APPROVAL_GATES_REQUIREMENTS=pm,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=sm,director

# 日本語ロール名の例
APPROVAL_GATES_REQUIREMENTS=企画,部長
APPROVAL_GATES_DESIGN=アーキテクト,部長
APPROVAL_GATES_RELEASE=SM,部長
```

詳細は [セットアップガイド](./docs/setup.md#4-3-ワークフロー承認ゲートの設定オプション) を参照してください。

## 他のリポジトリでプロジェクトを進める

### 既存リポジトリにMichiワークフローを追加（最も簡単）

```bash
# 既存プロジェクトのディレクトリに移動
cd /path/to/existing-repo

# Michiのセットアップスクリプトを実行（対話式）
bash /path/to/michi/scripts/setup-existing.sh
```

対話式で以下を入力：
- プロジェクト名
- JIRAプロジェクトキー
- 顧客名

自動的にcc-sdd、ルール、スクリプトなどがセットアップされます。

### 新規リポジトリを作成してセットアップ

```bash
# Michiディレクトリから実行
cd /path/to/michi
npm run create-project -- \
  --name "customer-a-service-1" \
  --project-name "A社 サービス1" \
  --customer "A社" \
  --jira-key "PRJA"
```

詳細: [新規プロジェクトセットアップガイド](./docs/new-project-setup.md)

## ドキュメント

- [クイックリファレンス](./docs/quick-reference.md) - コマンド一覧、チートシート ⭐
- [フェーズ自動化ガイド](./docs/phase-automation.md) - Confluence/JIRA自動作成、抜け漏れ防止 ⭐
- [新規プロジェクトセットアップ](./docs/new-project-setup.md) - 他リポジトリでの開始方法 ⭐
- [セットアップガイド](./docs/setup.md) - インストール・設定手順
- [ワークフローガイド](./docs/workflow.md) - AI開発フロー
- [マルチプロジェクト管理](./docs/multi-project.md) - 複数プロジェクト管理
- [テスト・検証](./docs/testing.md) - E2Eテスト、フィードバック

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
