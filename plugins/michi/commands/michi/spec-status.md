---
name: /michi:spec-status
description: Show specification status and progress (Michi version with enhanced summary)
allowed-tools: Bash, Read, Glob, Write, Edit, MultiEdit, Update
argument-hint: <feature-name>
---

# Michi: Spec Status with Progress Summary

## Base Command Reference
@.claude/commands/kiro/spec-status.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Enhanced Progress Reporting

Michiでは、進捗レポートを強化し、以下の追加情報を提供:

### 拡張レポート項目

1. **品質メトリクス**:
   - テストカバレッジ目標達成率（設計書に記載の場合）
   - レビュー完了ステータス
   - 技術的負債の有無

2. **外部連携ステータス**:
   - **JIRA連携**: 同期されたチケット数とステータス
   - **Confluence連携**: ドキュメント同期ステータス
   - 最終同期日時

3. **タイムライン情報**:
   - 各Phase完了日時（spec.jsonから取得）
   - 平均作業時間（類似spec統計があれば）
   - 推定残り時間

### 出力例（拡張版）

```
========================================
 Spec Status: <feature>
========================================

📊 Progress Overview
  Phase:              implementation (50%)
  Requirements:       ✅ Approved
  Design:             ✅ Approved
  Tasks:              12/24 completed

🔍 Quality Metrics
  Test Coverage:      Target 95% (design.md)
  Code Review:        Pending

🔗 External Integration
  JIRA:              3 tickets synced (2 done, 1 in-progress)
  Confluence:         Synced 2 days ago

⏱️  Timeline
  Started:           2024-01-15
  Last Updated:      2024-01-20

📝 Next Actions
  1. /michi:spec-impl <feature>  - Continue implementation
  2. Review PR #123 for Task 5.3
```

### コマンドオプション提案

```bash
# すべてのspecのステータス一覧
/michi:spec-status --all

# アーカイブ含む全体進捗
/michi:spec-status --all --include-archived

# JSON出力（CI/CD統合用）
/michi:spec-status <feature> --json
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-status` を拡張し、品質メトリクス、外部連携ステータス、タイムライン情報を追加表示します。
