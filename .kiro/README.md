# Kiro プロジェクト設定

このディレクトリには、AI駆動開発ライフサイクル（AI-DLC）のための設定とドキュメントが含まれています。

## ディレクトリ構造

- `project.json`: プロジェクトメタデータ（プロジェクトID、JIRA/Confluenceの設定）
- `settings/`: AI開発のためのテンプレートと設定
- `specs/`: 機能仕様書（requirements, design, tasks）
- `steering/`: AIガイダンスルール

## プロジェクト情報

詳細は `project.json` を参照してください。

## 使用方法

Cursorで以下のコマンドを使用：

- `/kiro:spec-init <機能概要>` - 新しい機能の仕様を初期化
- `/kiro:spec-requirements <feature>` - 要件定義を生成
- `/kiro:spec-design <feature>` - 設計ドキュメントを生成
- `/kiro:spec-tasks <feature>` - 実装タスクを生成
- `/kiro:spec-impl <feature> <tasks>` - TDDで実装

詳細は `.cursor/commands/kiro/` のコマンドファイルを参照してください。

