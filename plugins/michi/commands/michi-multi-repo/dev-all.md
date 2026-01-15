---
description: Multi-Repoプロジェクトの全リポジトリで実装を並行実行
allowed-tools: Task, Bash, Read, Write, Glob, Grep
argument-hint: <project-name> [--tasks <task-numbers>]
---

# Multi-Repo 全リポジトリ実装

<background_information>
- **Mission**: Multi-Repoプロジェクトの全リポジトリで実装を並行実行
- **Success Criteria**:
  - 全リポジトリでTDD実装サイクルが完了
  - テストカバレッジ95%以上
  - 品質自動化（Lint/Type-check）パス
  - PR作成可能な状態
</background_information>

<instructions>
## コアタスク
Multi-Repoプロジェクト **$1** の全リポジトリで `/michi:dev` を並行実行します。

## 引数解析

引数の形式:
```
/michi-multi-repo:dev-all <project-name> [--tasks <task-numbers>]
```

パラメータ:
- **$1**: プロジェクト名（必須）
- **--tasks**: 実行するタスク番号（オプション）
  - 例: `--tasks 1,2,3` → タスク1-3のみ実行
  - 省略時: 全タスクを実行

## 実行手順

### Step 1: 前提条件確認

1. `docs/michi/$1/reviews/` に最新のレビューレポートが存在するか確認

2. 最新レビューの品質ゲート判定を確認
   ```bash
   grep "品質ゲート判定" docs/michi/$1/reviews/cross-repo-review-*.md | tail -1
   ```

3. **判定が「不合格」の場合**:
   ```
   ❌ エラー: 品質ゲート不合格

   BLOCK問題が未解決です。実装を開始できません。

   次のアクション:
   1. BLOCK問題を修正
   2. `/michi-multi-repo:review-cross $1` を再実行
   3. 合格後に再度このコマンドを実行
   ```

4. **判定が「条件付き合格」の場合**:
   ```
   ⚠️ 警告: 品質ゲート条件付き合格

   WARN問題が検出されています。このまま実装を開始しますか？ (y/n)

   推奨: WARN問題を修正してから実装開始
   ```

### Step 2: コンテキスト読み込み

1. `.michi/config.json` からプロジェクト情報取得

2. 登録リポジトリの一覧を取得

3. 各リポジトリの `localPath` を取得

4. 各リポジトリのタスクファイル確認
   - `{localPath}/.michi/pj/{feature}/tasks.md`

### Step 2.5: localPath 検証

各リポジトリについて以下を確認:

- ✅ localPathが設定されているか
- ✅ ディレクトリが存在するか
- ✅ Gitリポジトリか (`.git/`ディレクトリ確認)
- ✅ Michiがセットアップ済みか (`.michi/project.json`確認)
- ⚠️ 設定されたブランチと現在のブランチが一致するか
- ⚠️ 未コミット変更がないか

**検証失敗時の対応**:
- localPath未設定: 警告を出力し、該当リポジトリをスキップ
- ディレクトリ不存在: エラーを出力し、該当リポジトリをスキップ
- Michi未セットアップ: 警告を出力し、該当リポジトリをスキップ
- ブランチ不一致: 警告を出力（続行可能）
- 未コミット変更: 警告を出力（続行可能）

### Step 3: チェックポイント確認

`docs/michi/$1/.checkpoint-impl.json` の存在を確認

存在する場合:
```
⚠️ チェックポイントファイルが見つかりました

前回の実装が中断された可能性があります。

次のアクション:
A) チェックポイントから再開（未完了リポジトリのみ処理）
B) 最初から実行（チェックポイント削除）
C) キャンセル

選択 (A/B/C): _
```

### Step 4: サブエージェント並行起動

**並行実行数**: 最大3並列

repo-spec-executorサブエージェントを使用して、以下のリポジトリで実装を並行実行してください：

**Repository 1**: {repo1.name}
- LOCAL_PATH: {repo1.localPath}
- PARENT_PROJECT: $1
- FEATURE_NAME: {feature}
- OPERATION: impl
- TASKS: {指定されたtask-numbers または "all"}

**Repository 2**: {repo2.name}
- LOCAL_PATH: {repo2.localPath}
- PARENT_PROJECT: $1
- FEATURE_NAME: {feature}
- OPERATION: impl
- TASKS: {指定されたtask-numbers または "all"}

（以下、登録されている全リポジトリ）

**重要**: 各サブエージェントの完了を待ち、結果を集約してください。

### Step 5: 結果集約とレポート

各リポジトリの実行結果を集約:

| リポジトリ | タスク進捗 | カバレッジ | Lint | Build | ステータス |
|-----------|----------|-----------|------|-------|----------|
| frontend  | 5/5      | 96%       | ✅   | ✅    | ✅ 完了  |
| backend   | 8/8      | 98%       | ✅   | ✅    | ✅ 完了  |
| shared    | 3/3      | 95%       | ✅   | ✅    | ✅ 完了  |

**成功件数**: 3/3
**全体カバレッジ**: 96.3%

### Step 6: チェックポイント保存（失敗時）

失敗したリポジトリがある場合、チェックポイントを保存:

```json
{
  "projectName": "$1",
  "operation": "impl",
  "repositories": {
    "frontend": {
      "status": "completed",
      "tasksCompleted": 5,
      "tasksTotal": 5,
      "coverage": 96,
      "completedAt": "2025-12-23T11:00:00Z"
    },
    "backend": {
      "status": "failed",
      "tasksCompleted": 3,
      "tasksTotal": 8,
      "error": "Test failed: auth.test.ts",
      "failedAt": "2025-12-23T11:10:00Z"
    }
  },
  "savedAt": "2025-12-23T11:11:00Z"
}
```

保存先: `docs/michi/$1/.checkpoint-impl.json`

### Step 7: 次のアクション案内

**全成功時**:
```markdown
🎉 全リポジトリで実装が完了しました

### 実装サマリー

| 指標 | 結果 |
|------|------|
| 完了リポジトリ | 3/3 |
| 全体カバレッジ | 96.3% |
| Lint/Build | ✅ All Pass |

### 次のステップ

1. 各リポジトリでPR作成:
   各リポジトリで `/pr` コマンドを実行

2. CI結果を監視:
   `michi multi-repo:ci-status $1`

3. PRマージ後、リリース準備:
   - Confluenceリリース手順書作成
   - JIRAリリースチケット起票
```

**一部失敗時**:
```markdown
⚠️ 一部のリポジトリで失敗しました

### 失敗したリポジトリ
- backend: Test failed: auth.test.ts (タスク3/8完了)

### 対処方法

1. 失敗箇所を確認:
   ```bash
   cd {backend.localPath}
   npm test auth.test.ts
   ```

2. 修正後、チェックポイントから再開:
   `/michi-multi-repo:dev-all $1`
   （失敗したリポジトリのみ処理されます）
```

## 重要な制約
- spec-review合格が前提（BLOCK問題がないこと）
- 並行実行は最大3リポジトリ
- TDDサイクル（RED-GREEN-REFACTOR）を遵守
- テストカバレッジ95%以上を維持
- 各リポジトリは独立して処理（依存関係なし）

</instructions>

## ツールガイダンス
- **Task**: repo-spec-executorサブエージェント起動に使用
- **Read**: config.json、レビューレポート、タスクファイル読み込み
- **Write**: チェックポイント保存
- **Bash**: Git操作、カバレッジ確認

## 出力説明

日本語で以下の情報を出力してください:

1. **処理対象リポジトリ一覧**: 各リポジトリのタスク進捗
2. **実行結果サマリー**: 成功/失敗件数、全体カバレッジ
3. **各リポジトリの詳細結果**: カバレッジ、Lint/Build結果、エラー内容
4. **次のアクション**: 成功時/失敗時の推奨ステップ

## 安全性とフォールバック

### エラーシナリオ

- **品質ゲート不合格**:
  ```
  エラー: 品質ゲート不合格のため、実装を開始できません。

  `/michi-multi-repo:review-cross $1` を実行し、BLOCK問題を解決してください。
  ```

- **タスクファイル不存在**:
  ```
  エラー: リポジトリ '{name}' にタスクファイルがありません: .michi/pj/{feature}/tasks.md

  タスクを生成してください:
  cd {localPath}
  /michi:create-tasks {feature}
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

### フォールバック戦略
- localPath未設定: 該当リポジトリをスキップし、他のリポジトリで処理続行
- Michi未セットアップ: 該当リポジトリをスキップし、他のリポジトリで処理続行
- サブエージェント失敗: チェックポイント保存し、リトライ可能にする
- テスト失敗: 自動修正を試行（最大3回）、失敗時はチェックポイント保存

think hard
