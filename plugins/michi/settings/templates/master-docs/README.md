# Master Docs: プロジェクトメモリ

<!--
このディレクトリは、{{PROJECT_NAME}}の永続的なプロジェクト知識（Project Memory）を保存します。
新規メンバーやAIエージェントがプロジェクトを理解するための「Source of Truth」です。
-->

## 目的

このドキュメント群は以下の目的で維持されます：

1. **プロジェクトの永続的な記憶**: コードベースの変更があっても残る知識
2. **新規メンバーのオンボーディング**: プロジェクトの全体像を素早く理解
3. **設計判断の記録**: 技術選定理由やアーキテクチャ判断の背景
4. **AIエージェントのコンテキスト**: Claude Codeが効率的に作業するための情報源

## ディレクトリ構造

```
docs/master/
├── README.md                     # このファイル（読み方ガイド）
│
├── core/                         # コア情報（最初に読むべき）
│   ├── product.md                # プロダクト概要・目的・価値
│   ├── architecture.md           # システムアーキテクチャ全体像
│   ├── tech-stack.md             # 技術スタック・主要ライブラリ
│   ├── structure.md              # ディレクトリ構成・命名規則
│   └── sequence.md               # シーケンス図（mermaid）
│
├── development/                  # 開発規約
│   ├── api-design.md             # API設計原則・エンドポイント規約
│   └── data-model.md             # データモデル・スキーマ設計
│
├── operations/                   # 運用・保守向け（任意）
│   ├── deployment.md             # デプロイメント手順・環境情報
│   ├── monitoring.md             # 監視・アラート・メトリクス
│   ├── troubleshooting.md        # トラブルシューティングガイド
│   ├── runbook.md                # 定型運用手順書
│   └── incident-response.md      # インシデント対応フロー
│
├── decisions/                    # 意思決定記録（任意）
│   ├── _template.md              # ADRテンプレート
│   └── 001-example.md            # 例：技術選定理由など
│
└── glossary.md                   # 用語集・略語定義（任意）
```

## 読み方ガイド

### 新規メンバー向け

プロジェクトに新規参画した場合、以下の順序で読むことを推奨します：

1. **[core/product.md](./core/product.md)** - プロダクトの目的と価値を理解
2. **[core/architecture.md](./core/architecture.md)** - システム全体像を把握
3. **[core/tech-stack.md](./core/tech-stack.md)** - 使用技術を確認
4. **[core/structure.md](./core/structure.md)** - プロジェクト構成を理解
5. **[core/sequence.md](./core/sequence.md)** - 主要フローを把握
6. **[development/api-design.md](./development/api-design.md)** - API設計規約を学習
7. **[development/data-model.md](./development/data-model.md)** - データモデルを理解

### AIエージェント向け

Claude Codeが効率的に作業するために、以下を参照します：

1. **core/** - システムの全体像とパターン
2. **development/** - 開発規約とガイドライン
3. **decisions/** - 過去の判断と理由

## ドキュメントの原則

### パターンと原則を記述

Master Docsは「カタログ」ではなく「パターン集」です：

- **良い例**: 例を交えて構成パターンを説明
- **悪い例**: ディレクトリツリー内のすべてのファイルをリスト化

- **良い例**: API設計の原則（RESTful、命名規則）
- **悪い例**: すべてのAPIエンドポイントのリスト

### ゴールデンルール

> 「新しいコードが既存のパターンに従っている場合、Master Docsを更新する必要はない。」

新しいパターンや設計判断が発生した場合にのみ、Master Docsを更新します。

## 更新方法

### コマンドによる更新

```bash
/michi:update-master-docs
```

このコマンドは：
- **Bootstrap**: Master Docsが存在しない場合、コードベースから生成
- **Sync**: 既存のMaster Docsとコードベースの整合性を確認・更新

### 手動更新

直接ファイルを編集することも可能です。Master Docsは「ユーザーのもの」です。

**更新の哲学**:
- 置き換えではなく追加
- ユーザーコンテンツを保護
- 迷った場合は追加

## 含めてはいけないもの

セキュリティとプライバシーのため、以下は含めません：

- **セキュリティ情報**: キー、パスワード、シークレット
- **エージェント固有ディレクトリ**: `.cursor/`, `.gemini/`, `.claude/`
- **Michi設定の詳細**: `.michi/settings/` の内容（メタデータであり、プロジェクト知識ではない）
- **プロジェクト仕様の詳細**: `.michi/pj/` の個別仕様（軽い参照は許容）
- **網羅的なファイルリスト**: すべてのファイルのリスト化

## カスタマイズ

このディレクトリは自由にカスタマイズできます：

- 新しいファイルを追加
- 既存のファイルを編集
- プロジェクト固有のセクションを追加

すべてのファイルが平等に扱われ、AIエージェントが読み込みます。

## メンテナンス

Master Docsは定期的に更新します：

- 新しいパターンが発生した時
- アーキテクチャが変更された時
- 技術スタックがアップグレードされた時
- 重要な判断が行われた時

## 参照

- **Michiコマンド**: [/michi:update-master-docs](../../rules/master-docs-principles.md)
- **更新原則**: [master-docs-principles.md](../../rules/master-docs-principles.md)
- **テンプレート**: [templates/master-docs/](./)
