---
globs:
  - "src/**/*"
  - "scripts/**/*"
  - "test/**/*"
  - "tests/**/*"
alwaysApply: false
---

# コード生成サイズ監視

PROACTIVELY: /michi:dev の各タスク完了後に使用。

## 参照
@templates/claude-agent/rules/code-size-rules.md

## 実行タイミング
1. 各sub-task完了後
2. コミット前
3. 長時間のコーディングセッション中（3-5ファイル変更ごと）

## 閾値超過時のアクション
500行超過時:
A) 現在の変更でPRを作成する（推奨）
B) 作業を続行する（警告付き）
C) 分割戦略を提案してもらう
