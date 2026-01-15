---
name: /michi:create-requirements
description: ultrathink有効で包括的な要件定義書を生成
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name>
---

# Michi: Ultrathin付き要件定義生成

<background_information>
- **ミッション**: spec初期化時のプロジェクト説明に基づいて、EARS形式で包括的でテスト可能な要件定義を生成する
- **成功基準**:
  - マスタードキュメントコンテキストと整合した完全な要件定義書を作成
  - すべての受入基準でプロジェクトのEARSパターンと制約に従う
  - 実装詳細なしにコア機能に焦点を当てる
  - 生成ステータスを追跡するためにメタデータを更新
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

<instructions>
## コアタスク
requirements.md のプロジェクト説明に基づいて、機能 **$1** の完全な要件定義を生成します。

## 実行手順

### 基本実装

1. **コンテキストの読み込み**:
   - 言語とメタデータのために `{{MICHI_DIR}}/pj/$1/project.json` を読み取り
   - プロジェクト説明のために `{{MICHI_DIR}}/pj/$1/requirements.md` を読み取り
   - **すべてのマスタードキュメントコンテキストを読み込み**: `{{REPO_ROOT_DIR}}/docs/master/` ディレクトリ全体を読み取り（以下を含む）:
     - デフォルトファイル: `structure.md`, `tech.md`, `product.md`
     - すべてのカスタムマスタードキュメントファイル（モード設定に関係なく）
     - これにより完全なプロジェクトメモリとコンテキストを提供

2. **ガイドラインの読み取り**:
   - EARS構文ルールのために `{{MICHI_DIR}}/settings/rules/ears-format.md` を読み取り
   - ドキュメント構造のために `{{MICHI_DIR}}/settings/templates/specs/requirements.md` を読み取り

3. **要件定義の生成**:
   - プロジェクト説明に基づいて初期要件を作成
   - 関連機能を論理的な要件領域にグループ化
   - すべての受入基準にEARS形式を適用
   - project.json で指定された言語を使用

4. **メタデータの更新**:
   - `phase: "requirements-generated"` を設定
   - `approvals.requirements.generated: true` を設定
   - `updated_at` タイムスタンプを更新

### Michi拡張機能

5. **Ultrathink自動有効化**:
   - 要件定義生成には複雑な分析が必要
   - 拡張思考（ultrathink）がデフォルトで有効
   - より深い分析とより包括的な要件定義を提供

## 重要な制約
- HOWではなくWHATに焦点を当てる（実装詳細なし）
- 要件はテスト可能で検証可能でなければならない
- EARS文に適切な主語を選択（ソフトウェアの場合はシステム/サービス名）
- 最初に初期バージョンを生成し、その後ユーザーフィードバックで反復（事前に連続的な質問をしない）
- requirements.md の要件見出しは先頭に数値IDのみを含む必要がある（例: "Requirement 1", "1.", "2 Feature ..."）。"Requirement A"のようなアルファベットIDは使用しない。
</instructions>

## ツールガイダンス
- **最初に読み取り**: 生成前にすべてのコンテキスト（仕様、マスタードキュメント、ルール、テンプレート）を読み込む
- **最後に書き込み**: 完全な生成後にのみ requirements.md を更新
- 外部ドメイン知識が必要な場合のみ **WebSearch/WebFetch** を使用

## 出力説明

project.json で指定された言語で以下の出力を提供:

### 基本出力

1. **生成された要件定義サマリー**: 主要な要件領域の簡潔な概要（3-5箇条書き）
2. **ドキュメントステータス**: requirements.md が更新され、project.json メタデータが更新されたことを確認
3. **次のステップ**: 進め方をユーザーにガイド（承認して続行、または修正）

### Michi拡張出力

基本出力の後に追加:

```bash
echo ""
echo "============================================"
echo " Michi Requirements Generation Complete"
echo "============================================"
echo ""
echo "### 生成された要件定義書"
echo "\`.michi/pj/$1/requirements.md\`"
echo ""
echo "### 次のステップ"
echo ""
echo "**Requirements Approved の場合**:"
echo "1. **設計書を生成**:"
echo "   /michi:create-design $1"
echo ""
echo "**Modifications Needed の場合**:"
echo "- フィードバックを提供し、再度実行:"
echo "  /michi:create-requirements $1"
echo ""
echo "---"
echo "ℹ️  Ultrathink: 有効（深い分析モード）"
echo ""
```

**形式要件**:
- 明確にするためにMarkdownの見出しを使用
- コードブロックにファイルパスを含める
- 要約を簡潔に保つ（300語以下）

## 安全性とフォールバック

### エラーシナリオ
- **プロジェクト説明欠落**: requirements.md にプロジェクト説明がない場合、機能詳細をユーザーに尋ねる
- **曖昧な要件**: 事前に多くの質問をするのではなく、初期バージョンを提案してユーザーと反復
- **テンプレート欠落**: テンプレートファイルが存在しない場合、警告付きでインラインフォールバック構造を使用
- **言語未定義**: project.json で言語が指定されていない場合、英語（`en`）をデフォルトとする
- **不完全な要件**: 生成後、要件がすべての期待される機能をカバーしているかをユーザーに明示的に尋ねる
- **マスタードキュメントディレクトリが空**: プロジェクトコンテキストが欠落しており、要件品質に影響する可能性があることをユーザーに警告（Michi: 警告を表示し、マスタードキュメント作成を推奨）
- **非数値の要件見出し**: 既存の見出しに先頭の数値IDが含まれていない場合（例: "Requirement A"を使用）、数値IDに正規化し、そのマッピングを一貫して保つ（数値とアルファベットのラベルを混在させない）

### 追加のMichiシナリオ
- **Ultrathin Timeout**: 長時間実行されるプロセスの場合、中間結果を保存して再開を許可
- **大規模プロジェクト**: セクションごとの生成を検討

### 次のフェーズ: 設計生成

**要件定義が承認された場合**:
- `{{MICHI_DIR}}/pj/$1/requirements.md` で生成された要件をレビュー
- **オプションのGap分析**（既存コードベースの場合）:
  - `/base:validate-gap $1` を実行して現在のコードとの実装ギャップを分析
  - 既存のコンポーネント、統合ポイント、実装戦略を特定
  - ブラウンフィールドプロジェクトに推奨。グリーンフィールドの場合はスキップ
- 次に `/michi:create-design $1 -y` で設計フェーズに進む

**修正が必要な場合**:
- フィードバックを提供し、`/michi:create-requirements $1` を再実行

**注意**: 設計フェーズに進む前に承認が必須です。

---


think hard
