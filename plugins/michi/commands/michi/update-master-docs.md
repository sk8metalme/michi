---
name: /michi:update-master-docs
description: {{REPO_ROOT_DIR}}/docs/master/ を永続的なプロジェクト知識として管理
allowed-tools: Bash, Read, Write, Glob, Grep, Edit, MultiEdit, Update, LS
---

# Michi: Master Docs更新

<background_information>
**役割**: `{{REPO_ROOT_DIR}}/docs/master/*.md` を永続的なプロジェクトメモリとして維持する。

**ミッション**:
- Bootstrap: コードベースからコアMaster Docsを生成（初回）
- Sync: Master Docsとコードベースの整合性を維持（メンテナンス）
- 保護: ユーザーのカスタマイズは神聖なもの、更新は追加的に行う

**成功基準**:
- Master Docsはパターンと原則を捉える（網羅的なリストではない）
- コードのドリフトを検出し報告する
- すべての `{{REPO_ROOT_DIR}}/docs/master/*.md` を平等に扱う（コア＋カスタム）
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

## Master Docs構造
```
docs/master/
├── README.md                     # このディレクトリの説明・読み方ガイド
│
├── core/                         # コア情報（AIが最初に読むべき）
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
├── operations/                   # 運用・保守向け
│   ├── deployment.md             # デプロイメント手順・環境情報
│   ├── monitoring.md             # 監視・アラート・メトリクス
│   ├── troubleshooting.md        # トラブルシューティングガイド
│   ├── runbook.md                # 定型運用手順書
│   └── incident-response.md      # インシデント対応フロー
│
├── decisions/                    # 意思決定記録
│   ├── _template.md              # ADRテンプレート
│   └── 001-example.md            # 例：技術選定理由など
│
└── glossary.md                   # 用語集・略語定義
```

---

<instructions>
## シナリオ検出

`{{REPO_ROOT_DIR}}/docs/master/` の状態をチェック:

**Bootstrapモード**: 空 または コアファイル（product.md, architecture.md, tech-stack.md, structure.md, sequence.md）が存在しない
**Syncモード**: すべてのコアファイルが存在する

---

## ステップ 0: Settings Provisioning Check

**グローバル設定の確認と自動配置**:

1. **バージョンチェック**:
   - `{{MICHI_GLOBAL_DIR}}/settings/version.json` を読み取り
   - プラグインバージョン（{{PLUGIN_VERSION}}）と比較
   - 不一致または欠落の場合、Step 0.1 へ

2. **必要ファイルの存在チェック**:
   - このコマンドに必要なファイルを確認:
     - `{{MICHI_GLOBAL_DIR}}/settings/templates/master-docs/` ディレクトリ
     - `{{MICHI_GLOBAL_DIR}}/settings/rules/master-docs-principles.md`
   - 欠落がある場合、Step 0.1 へ

3. **Step 0.1: 自動プロビジョニング** (条件付き):
   - 欠落ファイルのみをコピー
   - バージョン不一致の場合、全ファイルを更新
   - `version.json` を更新
   - ユーザーに通知: "✅ Global settings updated to v{{PLUGIN_VERSION}}"

4. **続行**: Bootstrapフロー または Syncフロー へ

---

## Bootstrapフロー

1. `{{MICHI_GLOBAL_DIR}}/settings/templates/master-docs/` からテンプレートを読み込む
2. コードベースを分析（JIT）:
   - `glob_file_search` でソースファイルを検索
   - `read_file` でREADME、package.json等を読み込む
   - `grep` でパターンを検索
3. パターンを抽出（リストではない）:
   - Product: 目的、価値、コア機能
   - Architecture: システム構成、コンポーネント関係
   - Tech: フレームワーク、決定事項、規約
   - Structure: 構成、命名、インポート
   - Sequence: 主要フローのシーケンス図
4. Master Docsファイルを生成（テンプレートに従う）
5. `{{MICHI_GLOBAL_DIR}}/settings/rules/master-docs-principles.md` から原則を読み込む
6. レビュー用にサマリーを提示

**フォーカス**: 決定を導くパターン。ファイルや依存関係のカタログではない。

---

## Syncフロー

1. 既存のすべてのMaster Docs（`{{REPO_ROOT_DIR}}/docs/master/**/*.md`）を読み込む
2. コードベースの変更を分析（JIT）
3. ドリフトを検出:
   - **Master Docs → Code**: 欠落している要素 → 警告
   - **Code → Master Docs**: 新しいパターン → 更新候補
   - **カスタムファイル**: 関連性をチェック
4. 更新を提案（追加的に、ユーザーコンテンツを保護）
5. レポート: 更新、警告、推奨事項

**更新の哲学**: 置き換えではなく追加。ユーザーセクションを保護。

---

## 粒度の原則

`{{MICHI_GLOBAL_DIR}}/settings/rules/master-docs-principles.md` より:

> 「新しいコードが既存のパターンに従っている場合、Master Docsを更新する必要はない。」

網羅的なリストではなく、パターンと原則を文書化する。

**悪い例**: ディレクトリツリー内のすべてのファイルをリスト化
**良い例**: 例を交えて構成パターンを説明

</instructions>

## ツールガイダンス

- `glob_file_search`: ソース/設定ファイルを検索
- `read_file`: Master Docs、ドキュメント、設定を読み込む
- `grep`: パターンを検索
- `list_dir`: 構造を分析

**JIT戦略**: 事前にではなく、必要なときに取得。

## 出力説明

チャットサマリーのみ（ファイルは直接更新）。

### Bootstrap:
```
✅ Master Docs作成完了

## 生成ファイル:
- core/product.md: [簡単な説明]
- core/architecture.md: [システム構成]
- core/tech-stack.md: [主要スタック]
- core/structure.md: [構成]
- core/sequence.md: [主要フロー]

Source of Truthとしてレビュー・承認してください。
```

### Sync:
```
✅ Master Docs更新完了

## 変更点:
- core/tech-stack.md: React 18 → 19
- core/structure.md: APIパターンを追加

## コードドリフト:
- コンポーネントがインポート規約に従っていない

## 推奨事項:
- development/api-design.md の更新を検討
```

## 安全性とフォールバック

- **セキュリティ**: キー、パスワード、シークレットを含めない（原則を参照）
- **不確実性**: 両方の状態を報告し、ユーザーに確認
- **保護**: 迷った場合は置き換えではなく追加

## 備考

- すべての `{{REPO_ROOT_DIR}}/docs/master/**/*.md` がプロジェクトメモリとして読み込まれる
- テンプレートと原則はカスタマイズ用に外部化されている
- カタログではなくパターンにフォーカス
- 「ゴールデンルール」: パターンに従う新しいコードはMaster Docs更新を必要としない
- エージェント固有のツールディレクトリ（例: `.cursor/`, `.gemini/`, `.claude/`）のドキュメント化を避ける
- `{{MICHI_GLOBAL_DIR}}/settings/` の内容はMaster Docsファイルに記載しない（settingsはメタデータであり、プロジェクト知識ではない）
- `{{MICHI_DIR}}/pj/` と `{{REPO_ROOT_DIR}}/docs/master/` への軽い参照は許容。他の `.michi/` ディレクトリは避ける
