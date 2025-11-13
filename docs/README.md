# Michiドキュメント

Michiは、AI駆動開発ワークフロー自動化プラットフォームです。このドキュメントでは、Michiの使い方と開発方法を説明します。

## ドキュメント構造

Michiのドキュメントは、目的別に以下のカテゴリに整理されています。

### 🚀 はじめに ([getting-started/](./getting-started/))

初めてMichiを使う方向けのガイドです。

| ドキュメント | 説明 |
|------------|------|
| [セットアップガイド](./getting-started/setup.md) | Michiのインストールと設定手順 |
| [クイックスタート](./getting-started/quick-start.md) | 5分で始めるMichi |
| [新規プロジェクト作成](./getting-started/new-project-setup.md) | 他のリポジトリでMichiを使い始める方法 |

### 📖 実践ガイド ([guides/](./guides/))

Michiを使った開発の実践的なガイドです。

| ドキュメント | 説明 |
|------------|------|
| [ワークフローガイド](./guides/workflow.md) ⭐ | AI開発フローの詳細 |
| [フェーズ自動化ガイド](./guides/phase-automation.md) ⭐ | Confluence/JIRA自動作成 |
| [マルチプロジェクト管理](./guides/multi-project.md) | 複数プロジェクトの同時管理 |
| [カスタマイズガイド](./guides/customization.md) | Confluence/JIRA階層構造のカスタマイズ |

### 📚 リファレンス ([reference/](./reference/))

コマンドや設定値のリファレンス資料です。

| ドキュメント | 説明 |
|------------|------|
| [クイックリファレンス](./reference/quick-reference.md) ⭐ | コマンド一覧・チートシート |
| [設定値リファレンス](./reference/config.md) | `.michi/config.json`の全設定値 |
| [タスクテンプレート](./reference/tasks-template.md) | タスク記述のテンプレート |

### 🛠️ コントリビューター向け ([contributing/](./contributing/))

Michiプロジェクトに貢献したい開発者向けのガイドです。

| ドキュメント | 説明 |
|------------|------|
| [開発環境セットアップ](./contributing/development.md) | 開発者向けセットアップ手順 |
| [リリース手順](./contributing/release.md) | バージョンアップ・NPM公開 |
| [CI/CD設定](./contributing/ci-cd.md) | CI/CD整備計画 |

### 📝 一時ドキュメント ([tmp/](./tmp/))

プロジェクト管理や計画のための一時的なドキュメントです（gitで管理されません）。

## おすすめの読み方

### Michiを初めて使う場合

1. [セットアップガイド](./getting-started/setup.md) - Michiをインストール
2. [クイックスタート](./getting-started/quick-start.md) - 5分で基本的な使い方を習得
3. [ワークフローガイド](./guides/workflow.md) - AI開発フローを理解

### Michiを別のプロジェクトで使う場合

1. [新規プロジェクト作成](./getting-started/new-project-setup.md) - 他のリポジトリでの始め方
2. [クイックリファレンス](./reference/quick-reference.md) - コマンド一覧を確認

### Confluence/JIRAの設定をカスタマイズする場合

1. [カスタマイズガイド](./guides/customization.md) - カスタマイズ方法
2. [設定値リファレンス](./reference/config.md) - 全設定値の詳細

### Michiの開発に貢献する場合

1. [コントリビューションガイド](../CONTRIBUTING.md) - 貢献方法の概要
2. [開発環境セットアップ](./contributing/development.md) - 開発環境の構築
3. [リリース手順](./contributing/release.md) - リリースプロセス

## アイコンの意味

- ⭐: 重要度が高いドキュメント
- 🚧: 作成中のドキュメント
- 📦: 外部リンク

## 質問・フィードバック

ドキュメントに関する質問やフィードバックがある場合は、[issue](https://github.com/sk8metalme/michi/issues)を作成してください。

## 参考リンク

- [Michiリポジトリ](https://github.com/sk8metalme/michi)
- [cc-sdd公式ドキュメント](https://github.com/gotalab/cc-sdd)
- [Cursor IDE](https://cursor.sh/)
- [Atlassian MCP Server](https://www.atlassian.com/ja/platform/remote-mcp-server)
