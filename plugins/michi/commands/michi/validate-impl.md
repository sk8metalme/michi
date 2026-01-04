---
name: /michi:validate-impl
description: Validate implementation against requirements, design, and tasks (Michi version with enhanced validation)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit
argument-hint: <feature-name>
---

# Michi: Implementation Validation with Quality Gates

## Base Command Reference
@.claude/commands/kiro/validate-impl.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Quality Gates Validation

実装検証時、Michi固有の品質ゲートを適用:

### 拡張検証項目

1. **TDD準拠チェック**:
   - 全タスクに対応するテストの存在確認
   - テストカバレッジ95%達成確認
   - テストファーストの原則遵守確認

2. **5フェーズ品質自動化チェック**:
   ```
   Phase A: License & Version Audit
   ├─ OSS License check
   └─ Dependency version check (LTS/EOL)

   Phase 1: TDD Implementation
   ├─ Test coverage >= 95%
   └─ All tests passing

   Phase 3: Code Review
   ├─ PR created
   └─ Review comments resolved

   Phase 4: Coverage Validation
   ├─ Coverage threshold met
   └─ Critical paths covered

   Phase B: Archive Preparation
   ├─ Release notes created
   └─ Documentation updated
   ```

3. **セキュリティチェック**:
   - 入力値検証の実装確認
   - 認証・認可の実装確認
   - セキュアコーディング原則の遵守

### Validation Report

```markdown
# Implementation Validation Report: <feature>

## Quality Gates Status

### ✅ Passed (7/10)
- TDD: All tests passing (1022 tests)
- Coverage: 96% (Target: 95%)
- License Audit: All dependencies compliant
- Code Review: PR #166 merged
- Documentation: README updated

### ⚠️  Warnings (2/10)
- Performance: 3 slow queries detected
- Security: Missing rate limiting on API endpoint

### ❌ Failed (1/10)
- E2E Tests: 2 scenarios not implemented

## Detailed Findings

### Requirements Compliance
| Requirement | Implemented | Tests | Notes |
|-------------|-------------|-------|-------|
| REQ-001     | ✅          | ✅    | Complete |
| REQ-002     | ✅          | ⚠️    | Missing edge case tests |
| REQ-003     | ❌          | ❌    | Not implemented |

### Design Compliance
- Architecture: ✅ Onion Architecture maintained
- API Contracts: ✅ All endpoints match design
- Database Schema: ⚠️ Missing index on users.email

### Task Completion
- Completed: 23/24 tasks
- Remaining: Task 6.4 (E2E tests)

## Recommendations

### Critical (Fix before merge)
1. Implement REQ-003
2. Add missing E2E test scenarios

### Important (Fix in follow-up PR)
1. Add index on users.email
2. Implement rate limiting
3. Optimize slow queries

### Optional
1. Add edge case tests for REQ-002
```

### 自動修正提案

検出された問題に対する修正コマンドを提案:

```bash
# 欠けているテストを生成
/michi:generate-tests <feature> --missing-only

# セキュリティ問題の修正
/michi:fix-security <feature> --auto

# パフォーマンス最適化
/michi:optimize <feature> --slow-queries
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:validate-impl` を拡張し、5フェーズ品質自動化チェック、セキュリティ検証、自動修正提案を追加します。
