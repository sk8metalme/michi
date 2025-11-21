# Michiハンズオンガイド

Michiを実際に使って、セットアップから実装・PR作成まで全ワークフローを体験するハンズオンガイドです。

## 🎯 このガイドの目的

- Michiの全ワークフローを実際に体験する
- cc-sddとMichiの統合方法を理解する
- Confluence/JIRA連携の動作を確認する
- 実際のプロジェクトで使えるスキルを習得する

## 📚 ガイドの構成

### 1. 環境別セットアップガイド

ご利用の環境に応じて、以下のいずれかを選択してください：

- **[Cursor IDEセットアップガイド](./cursor-setup.md)** （推奨）
  - Cursor IDEを使用している場合
  - GUI操作が中心で、初心者にも優しい
  
- **[Claude Codeセットアップガイド](./claude-setup.md)**
  - Claude Codeを使用している場合
  - コマンドライン操作が中心
  
- **[Claude Subagentsセットアップガイド](./claude-agent-setup.md)**
  - Claude Subagentsを使用している場合
  - マルチエージェント開発環境

### 2. ワークフロー体験ガイド

環境のセットアップが完了したら、こちらで実際の開発フローを体験してください：

- **[ワークフロー体験ガイド](./workflow-walkthrough.md)** ⭐
  - サンプル機能（`health-check-endpoint`）を使った実践
  - spec-init → requirements → design → tasks → 実装の流れ
  - Confluence/JIRA連携の確認

### 3. 検証・トラブルシューティング

作業中の確認や問題解決に使用してください：

- **[検証チェックリスト](./verification-checklist.md)**
  - 各ステップの成功確認項目
  - 生成物の確認方法
  
- **[トラブルシューティング](./troubleshooting.md)**
  - よくある問題と解決策
  - エラーメッセージの対処法

## ⏱️ 所要時間

- **セットアップ**: 15-20分
- **ワークフロー体験**: 30-40分
- **合計**: 約1時間

## 📋 前提条件

以下がインストール済みであることを確認してください：

- Node.js 20.x以上
- npm 10.x以上
- Git（または Jujutsu (jj)）
- GitHub CLI (gh)
- Cursor IDE / VS Code / Claude Code（いずれか）

## 🚀 始め方

### Step 1: 環境を選択

使用するIDE/ツールに応じたセットアップガイドを選択してください：

- [Cursor IDE](./cursor-setup.md) 👈 初めての方におすすめ
- [Claude Code](./claude-setup.md)
- [Claude Subagents](./claude-agent-setup.md)

### Step 2: ワークフロー体験

セットアップが完了したら、[ワークフロー体験ガイド](./workflow-walkthrough.md)に進んでください。

### Step 3: 実践

ハンズオンで学んだ内容を実際のプロジェクトで応用してください。

## 💡 サンプル機能について

このハンズオンでは、`health-check-endpoint`という機能を例に使用します。

**機能概要**: アプリケーションの稼働状況を確認するHTTPエンドポイント

**選定理由**:
- シンプルで理解しやすい
- 実装が少ない（検証が容易）
- 実際のプロジェクトでもよく使われる機能

## 📖 関連ドキュメント

ハンズオン完了後、さらに詳しく学びたい方は以下をご覧ください：

### 基礎ガイド
- [クイックスタート](../getting-started/quick-start.md) - 5分で始める
- [セットアップガイド](../getting-started/setup.md) - 詳細なインストール手順

### 実践ガイド
- [ワークフローガイド](../guides/workflow.md) - 全フェーズの詳細解説
- [フェーズ自動化ガイド](../guides/phase-automation.md) - Confluence/JIRA自動化
- [マルチプロジェクト管理](../guides/multi-project.md) - 複数プロジェクトの同時管理

### リファレンス
- [クイックリファレンス](../reference/quick-reference.md) - コマンド一覧
- [設定値リファレンス](../reference/config.md) - `.michi/config.json`の全設定

## 🆘 サポート

質問や問題がある場合は、以下をご利用ください：

- [トラブルシューティングガイド](./troubleshooting.md)
- [GitHubイシュー](https://github.com/sk8metalme/michi/issues)
- [メインREADME](../../README.md)

## 🎓 学習の進め方

1. **まずはセットアップ**: 環境別ガイドを1つ選んで完了させる
2. **ワークフロー体験**: サンプル機能で全体の流れを理解
3. **検証チェック**: 各ステップで正しく動作しているか確認
4. **実践**: 実際のプロジェクトで適用

## ✨ このガイドで学べること

- ✅ Michiの基本的なセットアップ方法
- ✅ cc-sddとMichiの連携方法
- ✅ AI駆動開発ワークフローの全体像
- ✅ Confluence/JIRA自動連携の仕組み
- ✅ phase:runコマンドの使い方
- ✅ 実際のプロジェクトへの適用方法

それでは、始めましょう！ 🚀





