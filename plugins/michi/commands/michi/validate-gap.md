---
name: /michi:validate-gap
description: Analyze implementation gap between requirements and existing codebase (Michi version with detailed report)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit
argument-hint: <feature-name>
---

# Michi: Gap Analysis with Detailed Report

## Base Command Reference
@.claude/commands/kiro/validate-gap.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Enhanced Gap Analysis Report

Gap分析結果を構造化されたレポートで出力:

### 拡張分析項目

1. **コードカバレッジギャップ**:
   - 要件に対する実装箇所の特定
   - 未実装機能の一覧化
   - 既存コードの再利用可能性評価

2. **アーキテクチャギャップ**:
   - 設計書との整合性チェック
   - 技術的負債の検出
   - パフォーマンスボトルネックの可能性

3. **テストギャップ**:
   - テストカバレッジ目標との差異
   - 欠けているテストケース
   - テスト戦略との整合性

### Gap Analysis Report構造

```markdown
# Gap Analysis Report: <feature>

## Executive Summary
- Total Requirements: 15
- Implemented: 3
- Partial: 5
- Not Implemented: 7
- Gap Score: 47%

## Detailed Gaps

### 1. Feature Gaps
| Requirement ID | Status | Implementation Location | Notes |
|----------------|--------|-------------------------|-------|
| REQ-001        | ✅ Done | src/auth/login.ts:45    | Complete |
| REQ-002        | ⚠️ Partial | src/auth/logout.ts:23 | Missing error handling |
| REQ-003        | ❌ Missing | -                      | Not implemented |

### 2. Architecture Gaps
- Missing: Database migration strategy
- Inconsistent: Error handling approach
- Technical Debt: Legacy code in auth module

### 3. Test Coverage Gaps
- Unit Tests: 45% (Target: 95%)
- Integration Tests: Missing for auth flow
- E2E Tests: Not implemented

## Recommendations

### Priority 1 (Critical)
1. Implement REQ-003, REQ-005
2. Add error handling to REQ-002

### Priority 2 (Important)
1. Increase unit test coverage to 95%
2. Refactor legacy auth code

### Priority 3 (Nice to Have)
1. Add integration tests
2. Document architecture decisions
```

### JIRA連携オプション

Gap分析結果からJIRAチケットを自動作成:

```bash
# Gap分析結果をJIRAチケット化
/michi:validate-gap <feature> --create-jira-tickets
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:validate-gap` を拡張し、詳細な構造化レポートとJIRA連携オプションを追加します。
