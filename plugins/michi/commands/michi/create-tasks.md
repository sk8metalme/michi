---
name: /michi:create-tasks
description: 実装タスクを生成
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, Bash
argument-hint: <feature-name> [-y] [--sequential]
---

# Michi: 仕様タスク生成

<background_information>
- **ミッション**: 技術設計を実行可能な作業項目に変換する、詳細で実行可能な実装タスクを生成する
- **成功基準**:
  - すべての要件が特定のタスクにマッピングされている
  - タスクが適切にサイズ化されている（各1-3時間）
  - 適切な階層を持つ明確なタスク進行
  - 能力に焦点を当てた自然言語の説明
  - プロジェクト言語の品質インフラが検証されている
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

<instructions>
## コアタスク
承認された要件と設計に基づいて、機能 **$1** の実装タスクを生成します。

## 実行手順

### 基本実装

#### ステップ 0: Settings Provisioning Check

**グローバル設定の確認と自動配置**:

1. **バージョンチェック**:
   - `{{MICHI_GLOBAL_DIR}}/settings/version.json` を読み取り
   - プラグインバージョン（{{PLUGIN_VERSION}}）と比較
   - 不一致または欠落の場合、Step 0.1 へ

2. **必要ファイルの存在チェック**:
   - このコマンドに必要なファイルを確認:
     - `{{MICHI_GLOBAL_DIR}}/settings/rules/tasks-generation.md`
     - `{{MICHI_GLOBAL_DIR}}/settings/rules/tasks-parallel-analysis.md`
     - `{{MICHI_GLOBAL_DIR}}/settings/templates/specs/tasks.md`
   - 欠落がある場合、Step 0.1 へ

3. **Step 0.1: 自動プロビジョニング** (条件付き):
   - 欠落ファイルのみをコピー
   - バージョン不一致の場合、全ファイルを更新
   - `version.json` を更新
   - ユーザーに通知: "✅ Global settings updated to v{{PLUGIN_VERSION}}"

4. **続行**: 元のStep 1へ

#### ステップ 1: コンテキストの読み込み

**必要なすべてのコンテキストを読み取り**:
- `{{MICHI_DIR}}/pj/$1/project.json`
- `docs/michi/$1/spec/requirements.md`, `docs/michi/$1/spec/design.md`
- `docs/michi/$1/tasks/tasks.md`（存在する場合、マージモード用）
- 完全なプロジェクトメモリのために**`{{REPO_ROOT_DIR}}/docs/master/` ディレクトリ全体**

**承認の検証**:
- `-y` フラグが提供された場合（$2 == "-y"）: project.json で要件と設計を自動承認
- それ以外: 両方が承認されていることを確認（そうでない場合は停止、安全性とフォールバックを参照）
- `--sequential` の有無に基づいてシーケンシャルモードを決定

#### ステップ 2: 実装タスクの生成

**生成ルールとテンプレートの読み込み**:
- 原則のために `{{MICHI_GLOBAL_DIR}}/settings/rules/tasks-generation.md` を読み取り
- `sequential` が **false** の場合: 並列判定基準のために `{{MICHI_GLOBAL_DIR}}/settings/rules/tasks-parallel-analysis.md` を読み取り
- フォーマットのために `{{MICHI_GLOBAL_DIR}}/settings/templates/specs/tasks.md` を読み取り（`(P)` マーカーをサポート）

**すべてのルールに従ってタスクリストを生成**:
- project.json で指定された言語を使用
- すべての要件をタスクにマッピング
- 要件カバレッジを文書化する際、数値要件IDのみをリスト（カンマ区切り）、説明サフィックス、括弧、翻訳、または自由形式ラベルなし
- すべての設計コンポーネントが含まれていることを確認
- タスク進行が論理的で段階的であることを確認
- 単一サブタスク構造を主要タスクに昇格させて折りたたみ、コンテナのみの主要タスクで詳細を複製しない（テンプレートパターンに従って適用）
- 並列基準を満たすタスクに `(P)` マーカーを適用（シーケンシャルモードではマーカーを省略）
- 厳密にコア実装によって既に満たされた受入基準をカバーし、MVP後に延期できるオプションのテストカバレッジサブタスクのみを `- [ ]*` でマーク
- 既存の tasks.md が見つかった場合、新しいコンテンツとマージ

#### ステップ 3: 最終化

**書き込みと更新**:
- `docs/michi/$1/tasks/tasks.md` を作成/更新
- project.json メタデータを更新:
  - `phase: "tasks-generated"` を設定
  - `approvals.tasks.generated: true, approved: false` を設定
  - `approvals.requirements.approved: true` を設定
  - `approvals.design.approved: true` を設定
  - `updated_at` タイムスタンプを更新

### Michi拡張機能

#### ステップ 4: 品質インフラチェック

> **優先度**: このMichi Extensionの指示は、base commandの品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

タスク生成前に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

**ステップ 4.1: CI設定の確認とプラットフォーム選択**

**既存CI設定をチェック**:
- `.github/workflows/` が存在する場合 → GitHub Actions採用
- `screwdriver.yaml` が存在する場合 → Screwdriver採用
- 両方なし → ユーザーに選択を促す

**CI未設定の場合のプラットフォーム選択**:

```text
CIプラットフォームを選択してください:
A) GitHub Actions（推奨）
B) Screwdriver
C) 後で設定する
```

**ステップ 4.2: 言語検出とユーザー確認**

**プロジェクトルートのファイルをチェック**:
- `package.json` あり → Node.js
- `pom.xml` または `build.gradle*` あり → Java
- `pyproject.toml` または `requirements.txt` あり → Python
- `composer.json` あり → PHP

複数言語が検出された場合や確認が必要な場合：
```text
検出された言語: {{LANG}}。正しいですか？ (Y/n)
```

**ステップ 4.3: 言語別チェック項目**

**Node.js / TypeScript**:
- husky + pre-commit hook (必須)
- lint-staged (必須)
- TypeScript strict mode (必須)
- tsarch (推奨)
- CI (必須)
- DevContainer (任意)

**Java**:
- Checkstyle/PMD (必須)
- NullAway + Error Prone (必須)
- ArchUnit (推奨)
- Spotless (任意)
- CI (必須)
- DevContainer (任意)

**Python**:
- ruff/black/flake8 (必須)
- mypy strict (推奨)
- import-linter (推奨)
- pre-commit framework (任意)
- CI (必須)
- DevContainer (任意)

**PHP**:
- PHPStan/php-cs-fixer (必須)
- deptrac (推奨)
- GrumPHP/Captain Hook (任意)
- CI (必須)
- DevContainer (任意)

**ステップ 4.4: 結果表示とタスク自動追加**

1. **警告メッセージを表示**:
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **tasks.md の先頭に言語別の品質インフラセットアップタスクを自動追加**:
   - 未設定の必須項目・推奨項目のセットアップ手順を含む
   - 言語別のコマンド・設定例を提供

3. **処理は継続**（タスク生成を実行）

#### ステップ 5: タスク差分サイズガイドライン

タスク分割時に、各サブタスクの git diff サイズを考慮してください。

**推奨サイズ**:
- 目標: 各サブタスクで 200-400 行の diff
- 最大: 500 行まで（超過時は分割を検討）
- 警告: 400行超過時は分割を推奨

**除外対象ファイル（行数カウント対象外）**:
- ロックファイル: package-lock.json, yarn.lock, pnpm-lock.yaml, composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock, Cargo.lock, go.sum
- 自動生成ファイル: *.min.js, *.min.css, *.map, dist/*, build/*, coverage/*, .next/*, *.d.ts, *.generated.ts, __snapshots__/*

**分割戦略**:
1. 水平分割（レイヤー別）: model/repository → service/logic → controller/handler
2. 垂直分割（機能スライス別）: core機能 → validation → error handling → edge cases
3. フェーズ分割（段階別）: 基本実装 → テスト追加 → 最適化

## 重要な制約
- **ルールを厳密に遵守**: tasks-generation.md のすべての原則は必須
- **自然言語**: 何をするかを説明し、コード構造の詳細ではない
- **完全なカバレッジ**: すべての要件をタスクにマッピングする必要がある
- **最大2レベル**: 主要タスクとサブタスクのみ（より深いネストなし）
- **シーケンシャル番号付け**: 主要タスクは増分（1, 2, 3...）、繰り返しなし
- **タスク統合**: すべてのタスクはシステムに接続する必要がある（孤立した作業なし）
</instructions>

## ツールガイダンス
- **最初に読み取り**: 生成前にすべてのコンテキスト、ルール、テンプレートを読み込む
- **最後に書き込み**: 完全な分析と検証後にのみ tasks.md を生成
- 環境変数とCI設定をチェックするために **Bash** を使用

## 出力説明

project.json で指定された言語で簡潔なサマリーを提供:

### 基本出力

1. **ステータス**: `docs/michi/$1/tasks/tasks.md` でタスクが生成されたことを確認
2. **タスクサマリー**:
   - 合計: X 主要タスク、Y サブタスク
   - すべて Z 要件がカバーされている
   - 平均タスクサイズ: サブタスクあたり1-3時間
3. **品質検証**:
   - ✅ すべての要件がタスクにマッピングされている
   - ✅ タスク依存関係が検証されている
   - ✅ テストタスクが含まれている
4. **次のアクション**: タスクをレビューし、準備ができたら進む

### Michi拡張出力

基本出力の後に追加:

1. **品質インフラチェック結果**: 言語固有のインフラステータス
2. **タスク差分サイズガイダンス**: 500行差分サイズ推奨のリマインダー

**形式**: 簡潔（200語以下）

## 安全性とフォールバック

### エラーシナリオ

**要件または設計が承認されていない**:
- **実行停止**: 承認された要件と設計なしには進められない
- **ユーザーメッセージ**: "タスク生成前に要件と設計を承認する必要があります"
- **推奨アクション**: "両方を自動承認して進むには `/michi:create-tasks $1 -y` を実行"

**要件または設計が欠落**:
- **実行停止**: 両方のドキュメントが存在する必要がある
- **ユーザーメッセージ**: "`docs/michi/$1/spec/` に requirements.md または design.md が欠落しています"
- **推奨アクション**: "最初に要件と設計フェーズを完了"

**不完全な要件カバレッジ**:
- **警告**: "すべての要件がタスクにマッピングされていません。カバレッジをレビューしてください。"
- **ユーザーアクション必要**: 意図的なギャップを確認するか、タスクを再生成

**テンプレート/ルール欠落**:
- **ユーザーメッセージ**: "`{{MICHI_GLOBAL_DIR}}/settings/` にテンプレートまたはルールファイルが欠落しています"
- **フォールバック**: 警告付きでインライン基本構造を使用
- **推奨アクション**: "リポジトリセットアップを確認するか、テンプレートファイルを復元"

**数値要件ID欠落**:
  - **実行停止**: requirements.md のすべての要件は数値IDを持つ必要があります。要件に数値IDがない場合、停止してタスク生成前に requirements.md を修正するよう要求。

### 次のフェーズ: 実装

**実装開始前**:
- **重要**: `/michi:dev` を実行する前に会話履歴をクリアしてコンテキストを解放
- これは最初のタスク開始時またはタスク間の切り替え時に適用
- 新鮮なコンテキストはクリーンな状態と適切なタスクフォーカスを確保

**タスクが承認された場合**:
- 特定のタスクを実行: `/michi:dev $1 1.1`（推奨: 各タスク間でコンテキストをクリア）
- 複数のタスクを実行: `/michi:dev $1 1.1,1.2`（慎重に使用、タスク間でコンテキストをクリア）
- 引数なし: `/michi:dev $1`（すべての保留中のタスクを実行 - コンテキスト肥大化のため推奨されません）

**修正が必要な場合**:
- フィードバックを提供し、`/michi:create-tasks $1` を再実行
- 既存のタスクが参照として使用される（マージモード）

**注意**: 実装フェーズは、適切なコンテキストと検証でタスクを実行するようガイドします。

---

**Michi統合**: このコマンドは、品質インフラ検証（言語固有チェック）、最適なタスク分割のためのタスク差分サイズガイドラインで基本タスク生成を拡張します。
