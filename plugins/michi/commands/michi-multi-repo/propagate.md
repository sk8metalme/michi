---
description: Multi-Repoプロジェクトから各リポジトリへ仕様を展開（並行実行）
allowed-tools: Task, Bash, Read, Write, Glob, Grep, AskUserQuestion
argument-hint: <project-name> [--operation init|requirements|design|all]
---

# Multi-Repo 仕様展開

<background_information>
- **Mission**: Multi-Repoプロジェクトの仕様を各リポジトリに展開
- **Success Criteria**:
  - 全リポジトリで指定されたOPERATIONが完了
  - 各リポジトリの仕様が親プロジェクトと整合性を保つ
  - エラーハンドリングとチェックポイント保存
</background_information>

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の全リポジトリに対して、仕様コマンドを並行実行します。

## 引数解析

引数の形式:
```
/michi-multi-repo:propagate <project-name> [--operation <operation>]
```

パラメータ:
- **$1**: プロジェクト名（必須）
- **--operation**: 実行する操作（オプション、デフォルト: all）
  - `init`: /michi:launch-pj
  - `requirements`: /michi:create-requirements
  - `design`: /michi:create-design
  - `all`: /michi:launch-pj → /michi:create-requirements → /michi:create-design を順次実行

## 実行手順

### Step 1: コンテキスト読み込み

1. `.michi/multi-repo/pj/$1/project.json` からプロジェクト情報取得
   - `$1` は `YYYYMMDD-{name}` 形式のプロジェクト名
   ```bash
   cat .michi/multi-repo/pj/$1/project.json
   ```

2. 登録リポジトリの一覧を取得（`repositories` 配列）

3. 各リポジトリの `localPath` を取得

4. 親プロジェクトの仕様ファイルを確認
   - `docs/michi/$1/spec/requirements.md` (OPERATION=design以降で必要)
   - `docs/michi/$1/spec/architecture.md` (OPERATION=design以降で必要)

### Step 2: localPath 検証

各リポジトリについて以下を確認:

- ✅ localPathが設定されているか
- ✅ ディレクトリが存在するか
- ✅ Gitリポジトリか (`.git/`ディレクトリ確認)
- ✅ Michiがセットアップ済みか (`.michi/pj/`ディレクトリ確認)
- ⚠️ 設定されたブランチと現在のブランチが一致するか
- ⚠️ 未コミット変更がないか

**検証失敗時の対応**:
- localPath未設定: 警告を出力し、該当リポジトリをスキップ
- ディレクトリ不存在: エラーを出力し、該当リポジトリをスキップ
- Michi未セットアップ: 警告を出力し、該当リポジトリをスキップ
- ブランチ不一致: 警告を出力（続行可能）
- 未コミット変更: 警告を出力（続行可能）

### Step 3: チェックポイント確認

`docs/michi/$1/.checkpoint.json` の存在を確認

存在する場合:
```text
⚠️ チェックポイントファイルが見つかりました: docs/michi/$1/.checkpoint.json

前回の実行が中断された可能性があります。

次のアクション:
A) チェックポイントから再開（未完了リポジトリのみ処理）
B) 最初から実行（チェックポイント削除）
C) キャンセル

選択 (A/B/C): _
```

### Step 3.5: 実行確認

以下のリポジトリで仕様生成を自動実行します:

| リポジトリ | localPath | 実行コマンド |
|-----------|----------|-------------|
{各リポジトリの情報を表示}

**AskUserQuestionツールで確認:**
```
この内容で仕様生成を自動実行しますか？

実行されるコマンド:
- /michi:launch-pj "{project description}"
- /michi:create-requirements {feature}
- /michi:create-design {feature}
```

選択肢:
- はい、実行する（推奨）
- いいえ、キャンセル

### Step 4: 並行実行

**並行実行数**: 最大3並列

**重要**: general-purposeエージェントを使用して、以下のリポジトリで仕様コマンドを並行実行してください：

各リポジトリに対してTaskツール（subagent_type: general-purpose）を起動:

**Repository**: {repo.name}
- 作業ディレクトリ: {repo.localPath}
- 親プロジェクト参照:
  - requirements.md: {親プロジェクトパス}/docs/michi/$1/overview/requirements.md
  - architecture.md: {親プロジェクトパス}/docs/michi/$1/overview/architecture.md

実行コマンド（順次）:
1. `/michi:launch-pj "{project description}"`
2. `/michi:create-requirements {feature}`
3. `/michi:create-design {feature}`

親プロジェクトの設計との整合性を維持し、このリポジトリの責務範囲のみを設計してください。

**重要**: 全リポジトリのエージェント完了を待ち、結果を集約してください。

### Step 5: 結果集約とレポート

各リポジトリの実行結果を集約:

| リポジトリ | OPERATION | ステータス | 詳細 |
|-----------|----------|----------|------|
| frontend  | design   | ✅ 成功  | design.md生成完了 |
| backend   | design   | ✅ 成功  | design.md生成完了 |
| shared    | design   | ❌ 失敗  | localPath未設定 |

**成功件数**: 2/3
**失敗件数**: 1/3

### Step 6: チェックポイント保存（失敗時）

失敗したリポジトリがある場合、チェックポイントを保存:

```json
{
  "projectName": "$1",
  "operation": "{operation}",
  "repositories": {
    "frontend": {
      "status": "completed",
      "completedAt": "2025-12-23T10:30:00Z"
    },
    "backend": {
      "status": "completed",
      "completedAt": "2025-12-23T10:31:00Z"
    },
    "shared": {
      "status": "failed",
      "error": "localPath未設定"
    }
  },
  "savedAt": "2025-12-23T10:32:00Z"
}
```

保存先: `docs/michi/$1/.checkpoint.json`

### Step 7: 次のアクション案内

**全成功時**:
```markdown
🎉 全リポジトリで仕様展開が完了しました

### 次のステップ

1. クロスリポジトリレビューを実行:
   `/michi-multi-repo:review-cross $1`

2. 合格後、各リポジトリでタスク生成:
   各リポジトリで `/michi:create-tasks {feature}` を実行

3. 実装を開始:
   `/michi-multi-repo:dev-all $1`
```

**一部失敗時**:
```markdown
⚠️ 一部のリポジトリで失敗しました

### 失敗したリポジトリ
- shared: localPath未設定

### 対処方法
1. localPathを設定:
   `michi multi-repo:add-repo $1 --name shared --localPath /path/to/repo`

2. チェックポイントから再開:
   `/michi-multi-repo:propagate $1 --operation {operation}`
   （失敗したリポジトリのみ処理されます）
```

## 重要な制約
- 並行実行は最大3リポジトリ
- 各リポジトリは独立して処理（依存関係なし）
- localPath未設定のリポジトリはスキップ
- エラー発生時もチェックポイントを保存し、再開可能にする

</instructions>

## ツールガイダンス
- **Task**: repo-spec-executorサブエージェント起動に使用
- **Read**: project.json、親プロジェクト仕様の読み込み
- **Write**: チェックポイント保存
- **Bash**: localPath検証、Git操作

## 出力説明

日本語で以下の情報を出力してください:

1. **処理対象リポジトリ一覧**: 各リポジトリのlocalPathと検証結果
2. **実行結果サマリー**: 成功/失敗件数
3. **各リポジトリの詳細結果**: 生成されたファイル、エラー内容
4. **次のアクション**: 成功時/失敗時の推奨ステップ

## 安全性とフォールバック

### エラーシナリオ

- **プロジェクト未登録**:
  ```
  エラー: プロジェクト '$1' が見つかりません。

  次のコマンドでプロジェクトを初期化してください：
  michi multi-repo:init $1
  ```

- **リポジトリ未登録**:
  ```
  警告: プロジェクト '$1' にリポジトリが登録されていません。

  次のコマンドでリポジトリを登録してください：
  michi multi-repo:add-repo $1 --name {name} --url {url} --localPath {path}
  ```

- **localPath未設定**:
  ```
  警告: リポジトリ '{name}' の localPath が未設定です。スキップします。

  localPathを設定するには:
  michi multi-repo:add-repo $1 --name {name} --localPath /path/to/repo
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

- **親プロジェクト仕様未作成（OPERATION=design以降）**:
  ```
  エラー: 親プロジェクトの設計書が見つかりません: docs/michi/$1/overview/architecture.md

  先に親プロジェクトの設計を作成してください:
  /michi-multi-repo:create-design $1
  ```

### フォールバック戦略
- localPath未設定: 該当リポジトリをスキップし、他のリポジトリで処理続行
- Michi未セットアップ: 該当リポジトリをスキップし、他のリポジトリで処理続行
- サブエージェント失敗: チェックポイント保存し、リトライ可能にする
- 全リポジトリ失敗: エラーレポート出力し、ユーザーに対処方法を案内

think hard
