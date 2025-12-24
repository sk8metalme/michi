# 5分で始めるMichi

Michiをインストールして、最初のプロジェクトを初期化するまでの最短ガイドです。

## 前提条件

- Node.js 20以上
- npm 10以上
- AIツール（Claude Code、Cursor、Gemini CLI、Codex CLI、またはCline）

## インストール

```bash
npm install -g @sk8metal/michi-cli
```

## グローバル設定（推奨）

新しいプロジェクトで作業を開始する前に、グローバル設定を行うことを推奨します。

グローバル設定ディレクトリを作成します：

```bash
mkdir -p ~/.michi
```

その後、`~/.michi/config.json` と `~/.michi/.env` を手動で作成し、共通設定を記述します。

**メリット**: すべてのプロジェクトで共通の設定を一度だけ定義でき、新しいプロジェクトでも即座に利用可能になります。

詳細は [環境設定ガイド - グローバル設定](configuration.md#グローバル設定michichconfigjson) を参照してください。

## プロジェクト初期化

### 新規プロジェクトの場合

```bash
michi init --claude-agent
```

### 既存プロジェクトの場合

プロジェクトディレクトリで実行：

```bash
michi init --existing --claude-agent
```

**注**: `--claude-agent` は環境オプションです（推奨）。他に `--claude`, `--cursor`, `--gemini`, `--codex`, `--cline` も選択可能です。

## 環境設定

プロジェクトの `.env` ファイルを編集して、認証情報を設定します：

```bash
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here
```

**ヒント**: 複数プロジェクトで共通の認証情報を使う場合は、グローバル環境変数（`~/.michi/.env`）の利用も検討してください。

詳細は [環境設定ガイド](configuration.md) を参照してください。

## 初回確認

事前チェックを実行して、設定が正しいことを確認します：

```bash
michi preflight
```

## 次のステップ

- [環境設定の詳細](configuration.md) - JIRA Issue Type IDなどの詳細設定
- [CLIコマンドリファレンス](../reference/cli.md) - 使用可能なコマンド一覧
