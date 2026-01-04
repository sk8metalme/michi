---
name: /michi:michi-spec-impl
description: Execute spec tasks using TDD methodology with Michi quality automation (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update
argument-hint: <feature-name> <task-number>
---

# Michi: Spec Implementation with Quality Automation

## Base Command Reference
@.claude/commands/kiro/kiro/kiro-spec-impl.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: 5-Phase Quality Automation

このコマンドは、Michi固有の5フェーズ品質自動化を適用します。

### 5フェーズ自動化フロー

```
Phase A: License & Version Audit (自動)
├─ npm audit
├─ License compatibility check
└─ LTS/EOL version check

Phase 1: TDD Implementation
├─ Write failing test (Red)
├─ Implement minimum code (Green)
└─ Refactor (Refactor)

Phase 2: (Reserved for future)

Phase 3: Code Review
├─ Create PR
├─ AI code review
└─ Address feedback

Phase 4: Coverage Validation
├─ Run coverage report
├─ Validate >= 95%
└─ Check critical paths

Phase B: Archive Preparation
├─ Update CHANGELOG
├─ Create release notes
└─ Update documentation
```

### 自動実行コマンド

```bash
# フェーズごとの自動実行
/michi:michi-spec-impl <feature> <task> --phase A  # License audit
/michi:michi-spec-impl <feature> <task> --phase 1  # TDD implementation
/michi:michi-spec-impl <feature> <task> --phase 3  # Code review
/michi:michi-spec-impl <feature> <task> --phase 4  # Coverage validation
/michi:michi-spec-impl <feature> <task> --phase B  # Archive prep

# 全フェーズ一括実行
/michi:michi-spec-impl <feature> <task> --all-phases
```

### PR サイズ監視

PRサイズが500行を超える場合、警告を表示:

```
⚠️  PR Size Warning

Current changes: 650 lines
Recommended: < 500 lines

💡 Suggestion:
Consider splitting this task into smaller units:
- Task 5.1a: Core logic (300 lines)
- Task 5.1b: Error handling (200 lines)
- Task 5.1c: Tests (150 lines)
```

### 品質ゲートチェック

各フェーズ完了時、品質ゲートをチェック:

```
✅ Phase 1 Complete: TDD Implementation

Quality Gates:
├─ ✅ All tests passing (1025 tests)
├─ ✅ Coverage >= 95% (96%)
├─ ✅ No linting errors
├─ ✅ Type check passed
└─ ✅ Architecture check passed

Next: Phase 3 - Code Review
  /michi:michi-spec-impl <feature> <task> --phase 3
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準のネストコマンドを Michi 名前空間に移行し、5フェーズ品質自動化、PRサイズ監視、品質ゲートチェックを追加します。
