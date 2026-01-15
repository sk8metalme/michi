---
description: Multi-Repoプロジェクトのクロスリポジトリ仕様レビューを実行
allowed-tools: Task, Bash, Read, Write, Edit, Glob, Grep
argument-hint: <project-name> [--focus api|data|event|deps|test|all]
---

# Multi-Repo クロスリポジトリレビュー

<background_information>
- **Mission**: 複数リポジトリにまたがる仕様の整合性を検証
- **Success Criteria**:
  - 全リポジトリの仕様を収集・分析
  - API契約、データモデル、イベントスキーマの整合性を検証
  - 品質ゲート判定を実行
  - 修正が必要な箇所を明確に報告
</background_information>

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の全リポジトリを対象に、クロスリポジトリレビューを実行します。

## 引数解析

引数の形式:
```
/michi-multi-repo:review-cross <project-name> [--focus <focus>]
```

パラメータ:
- **$1**: プロジェクト名（必須）
- **--focus**: レビュー観点（オプション、デフォルト: all）
  - `api`: API契約整合性のみ
  - `data`: データモデル整合性のみ
  - `event`: イベントスキーマ整合性のみ
  - `deps`: 依存関係整合性のみ
  - `test`: テスト仕様整合性のみ
  - `all`: 全観点（デフォルト）

## 実行手順

### Step 1: コンテキスト読み込み

1. `.michi/multi-repo/pj/$1/project.json` からプロジェクト情報取得
   - `$1` は `YYYYMMDD-{name}` 形式のプロジェクト名
   - 登録リポジトリ一覧（`repositories` 配列）

2. 各リポジトリの `localPath` を取得

3. 親プロジェクトの仕様を読み込み
   - `docs/michi/$1/spec/requirements.md`
   - `docs/michi/$1/spec/architecture.md`

### Step 2: localPath 検証

各リポジトリについて以下を確認:
- localPathが設定されているか
- ディレクトリが存在するか
- Gitリポジトリか (`.git/`ディレクトリ確認)
- Michiがセットアップ済みか (`.michi/pj/`ディレクトリ確認)
- 仕様ファイルが存在するか

**検証失敗時の対応**:
- localPath未設定: 警告を出力し、スキップ
- ディレクトリ不存在: エラーを出力し、スキップ
- Michi未セットアップ: 警告を出力し、スキップ
- 仕様ファイル不存在: 警告を出力し、利用可能情報でレビュー続行

### Step 3: サブエージェント起動

cross-repo-reviewerサブエージェントを使用して、以下のプロジェクトをレビューしてください：

- PROJECT_NAME: $1
- REPOSITORIES:
  - {repo1.name}: {repo1.localPath}
  - {repo2.name}: {repo2.localPath}
  - ...
- REVIEW_FOCUS: {指定されたfocus}

品質ゲート判定結果をレポートしてください。

### Step 4: レビューレポート出力

出力先: `docs/michi/$1/reviews/cross-repo-review-{timestamp}.md`

レポート形式:

```markdown
## Multi-Repo Cross-Repository Review Report

**プロジェクト**: $1
**レビュー日時**: {timestamp}
**対象リポジトリ**: {count}件
**レビュー観点**: {focus}

---

### サマリー

| カテゴリ | ステータス | 問題件数 |
|---------|----------|---------|
| API契約整合性 | ✅/⚠️/❌ | N件 |
| データモデル整合性 | ✅/⚠️/❌ | N件 |
| イベントスキーマ整合性 | ✅/⚠️/❌ | N件 |
| 依存関係整合性 | ✅/⚠️/❌ | N件 |
| テスト仕様整合性 | ✅/⚠️/❌ | N件 |

---

### 検出された問題

#### 🔴 BLOCK (修正必須)

（cross-repo-reviewerが検出した重大な不整合）

#### 🟡 WARN (修正推奨)

（cross-repo-reviewerが検出した軽微な不整合）

---

### 品質ゲート判定

**判定**: ❌ 不合格 / ⚠️ 条件付き合格 / ✅ 合格

**理由**: {判定理由}

---

### 次のアクション

1. BLOCK問題の修正
2. `/michi-multi-repo:review-cross $1` を再実行
3. 合格後、各リポジトリで実装を開始
```

### Step 5: 判定結果の表示

**合格時（✅ PASS）**:
```markdown
🎉 品質ゲート合格

全リポジトリの仕様が整合性基準を満たしています。

### 次のステップ

1. 各リポジトリでタスク生成:
   各リポジトリで `/michi:create-tasks {feature}` を実行

2. 全リポジトリで実装を開始:
   `/michi-multi-repo:dev-all $1`

3. CI/CD設定:
   `michi multi-repo:ci-status $1` でCI結果を監視
```

**条件付き合格時（⚠️ WARN）**:
```markdown
⚠️ 品質ゲート条件付き合格

WARN問題が検出されましたが、修正は任意です。

### 検出された問題
- {WARN問題のリスト}

### 次のステップ（選択可能）

A) WARN問題を修正してから実装開始（推奨）
   - 各リポジトリのdesign.mdを修正
   - `/michi-multi-repo:review-cross $1` を再実行

B) そのまま実装開始
   - `/michi-multi-repo:dev-all $1`
```

**不合格時（❌ BLOCK）**:
```markdown
❌ 品質ゲート不合格

BLOCK問題が検出されました。修正が必須です。

### BLOCK問題
- {BLOCK問題のリスト}

### 対処方法

1. 該当リポジトリのdesign.mdを修正
2. `/michi-multi-repo:review-cross $1` を再実行
3. 合格後に実装を開始

**注意**: BLOCK問題を未解決のまま実装を開始すると、サービス間通信が失敗する可能性があります。
```

## 重要な制約
- 読み取り操作のみ（各リポジトリへの書き込みは行わない）
- localPath未設定のリポジトリはスキップ（警告を出力）
- 大規模リポジトリの場合は主要ファイルのみ分析

</instructions>

## ツールガイダンス
- **Task**: cross-repo-reviewerサブエージェント起動に使用
- **Read**: プロジェクト仕様、各リポジトリ仕様の読み込み
- **Write**: レビューレポートの出力
- **Glob/Grep**: 仕様ファイルの検索

## 出力説明

日本語で以下の情報を出力してください:

1. **レビュー対象リポジトリ一覧**: 各リポジトリのlocalPathと仕様状態
2. **検出された問題**: BLOCK/WARN分類と詳細
3. **品質ゲート判定結果**: 合格/不合格と理由
4. **次のアクション**: 修正が必要な場合の具体的な手順

## 安全性とフォールバック

### エラーシナリオ

- **プロジェクト未登録**:
  ```
  エラー: プロジェクト '$1' が見つかりません。
  ```

- **親プロジェクト仕様未作成**:
  ```
  エラー: 親プロジェクトの設計書が見つかりません: docs/michi/$1/overview/architecture.md

  先に親プロジェクトの設計を作成してください:
  /michi-multi-repo:create-design $1
  ```

- **localPath未設定**:
  ```
  警告: リポジトリ '{name}' の localPath が未設定です。スキップします。
  ```

- **Michi未セットアップ**:
  ```
  ⚠️ リポジトリ '{name}' にMichiがセットアップされていません。スキップします。

  セットアップ手順:
  1. cd {localPath}
  2. mkdir -p .michi
  3. /michi:launch-pj を実行してセットアップ

  セットアップ完了後、このコマンドを再実行してください。
  ```

- **仕様ファイル不存在**:
  ```
  警告: リポジトリ '{name}' に仕様ファイルがありません。

  仕様を展開してください:
  /michi-multi-repo:propagate $1
  ```

### フォールバック戦略
- localPath未設定: 該当リポジトリをスキップし、他のリポジトリでレビュー続行
- Michi未セットアップ: 該当リポジトリをスキップし、他のリポジトリでレビュー続行
- 仕様ファイル不存在: 警告を出力し、利用可能な情報でレビュー
- 通信エラー: リトライ後、該当リポジトリをスキップ

think hard
