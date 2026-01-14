---
globs:
  - "src/**/*"
  - "scripts/**/*"
  - "test/**/*"
  - "tests/**/*"
alwaysApply: false
---

# Code Generation Size Monitoring

PROACTIVELY: /michi:dev の各タスク完了後に使用。

## Reference
@templates/claude-agent/rules/code-size-rules.md

## Execution Timing
1. 各sub-task完了後
2. コミット前
3. 長時間のコーディングセッション中（3-5ファイル変更ごと）

## Actions on Threshold Exceeded
500行超過時:
A) 現在の変更でPRを作成する（推奨）
B) 作業を続行する（警告付き）
C) 分割戦略を提案してもらう
