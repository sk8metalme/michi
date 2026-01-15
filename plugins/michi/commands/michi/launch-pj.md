---
name: /michi:launch-pj
description: 新しい仕様を詳細なプロジェクト説明で初期化
allowed-tools: Bash, Read, Write, Glob
argument-hint: <project-description>
---

# Michi: 統合セットアップ付き仕様初期化

<background_information>
- **ミッション**: 新しい仕様のディレクトリ構造とメタデータを作成し、仕様駆動開発の最初のフェーズを初期化する
- **成功基準**:
  - プロジェクト説明から適切な機能名を生成
  - 競合のない一意の仕様構造を作成
  - 次のフェーズ（要件生成）への明確なパスを提供
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

<instructions>

## コアタスク
プロジェクト説明（$ARGUMENTS）から一意の機能名を生成し、仕様構造を初期化します。

## 実行手順

### 基本実装

1. **プロジェクト名の生成**:
   - **YYYYMMDD プレフィックスの生成**: 現在の日付から `YYYYMMDD` 形式で取得（例: 20260115）
   - **pj名の生成**（slug形式）:
     - プロジェクト説明（$ARGUMENTS）から簡潔なプロジェクト名を生成
     - 形式: 小文字英数字とハイフン（例: `user-auth`, `ec-platform`）
     - 日本語説明の場合は英語に変換
     - 最終形式: `YYYYMMDD-{pj-name}` (例: `20260115-user-auth`)

2. **一意性チェック**: `{{MICHI_DIR}}/pj/` で既存ディレクトリと照合（重複する場合は数値サフィックスを追加、例: `20260115-user-auth-2`）

3. **ディレクトリ作成**: `{{MICHI_DIR}}/pj/YYYYMMDD-{pj-name}/`

4. **初期ファイルを生成**:
   - 以下の構造で `spec.json` を作成:
     ```json
     {
       "name": "YYYYMMDD-{pj-name}",
       "description": "$ARGUMENTS",
       "language": "ja",
       "created_at": "{ISO 8601 timestamp}",
       "updated_at": "{ISO 8601 timestamp}",
       "phase": "initialized",
       "approvals": {
         "requirements": { "approved": false, "generated": false },
         "design": { "approved": false, "generated": false },
         "tasks": { "approved": false, "generated": false }
       }
     }
     ```
   - 基本構造で `requirements.md` を作成:
     ```markdown
     # YYYYMMDD-{pj-name} - 要件定義

     ## プロジェクト概要
     $ARGUMENTS

     ## 要件
     <!-- /michi:create-requirements で生成されます -->
     ```
   - ファイルをプロジェクトディレクトリ（`{{MICHI_DIR}}/pj/YYYYMMDD-{pj-name}/`）に書き込み

### Michi拡張機能

4. **次のステップナビゲーション**:
   - ユーザーを `/michi:create-requirements` にガイド（`/base:spec-requirements` ではない）
   - Michiワークフロー概要を表示

## 重要な制約
- この段階では要件/設計/タスクを生成しない
- 段階的開発原則に従う
- 厳格なフェーズ分離を維持
- このフェーズでは初期化のみを実行
</instructions>

## ツールガイダンス
- **Bash** を使用してYYYYMMDD形式の現在日付を取得し、プロジェクト名を生成
- **Glob** を使用して既存のプロジェクトディレクトリ（`{{MICHI_DIR}}/pj/`）をチェックし、名前の一意性を確認
- **Write** を使用して spec.json と requirements.md をインラインで生成・作成
- ファイル書き込み操作の前に検証を実行

## 出力説明

`spec.json` で指定された言語で以下の構造で出力を提供します:

### 基本出力

1. **生成された機能名**: `feature-name` 形式と1-2文の根拠
2. **プロジェクト概要**: 簡潔な要約（1文）
3. **作成されたファイル**: 完全なパスを含む箇条書きリスト
4. **注意事項**: なぜ初期化のみが実行されたかを説明（フェーズ分離について2-3文）

### Michi拡張出力

基本出力の後に追加:

```bash
echo ""
echo "============================================"
echo " Michi Spec Initialization Complete"
echo "============================================"
echo ""
echo "### 次のステップ"
echo ""
echo "1. **要件定義書を生成**:"
echo "   /michi:create-requirements <feature-name>"
echo "   ※ ultrathinkが自動有効化され、深い分析が行われます"
echo ""
echo "2. **設計書を生成**:"
echo "   /michi:create-design <feature-name>"
echo ""
echo "---"
echo ""
```

**形式要件**:
- Markdownの見出しを使用（##, ###）
- コマンドをコードブロックで囲む
- 全体の出力を簡潔に保つ（300語以下）
- `spec.json.language` に従って明確で専門的な言語を使用

## 安全性とフォールバック

- **曖昧な機能名**: 機能名の生成が不明確な場合、2-3のオプションを提案しユーザーに選択を求める
- **テンプレート欠落**: `{{MICHI_DIR}}/settings/templates/specs/` にテンプレートファイルが存在しない場合、具体的な欠落ファイルパスとともにエラーを報告し、リポジトリのセットアップを確認することを提案
- **ディレクトリ競合**: 機能名が既に存在する場合、数字のサフィックスを追加（例: `feature-name-2`）し、自動的な競合解決をユーザーに通知
- **書き込み失敗**: 具体的なパスとともにエラーを報告し、権限またはディスク容量を確認することを提案

---

