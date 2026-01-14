---
name: /michi:review-dev
description: Validate implementation against requirements, design, and tasks (Michi version with enhanced validation)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit
argument-hint: <feature-name>
---

# Michi: Implementation Validation with Quality Gates

<background_information>
- **Mission**: Verify that implementation aligns with approved requirements, design, and tasks
- **Success Criteria**:
  - All specified tasks marked as completed
  - Tests exist and pass for implemented functionality
  - Requirements traceability confirmed (EARS requirements covered)
  - Design structure reflected in implementation
  - No regressions in existing functionality
  - Michi 5-phase quality gates passed
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Validate implementation for feature(s) and task(s) based on approved specifications.

## Execution Steps

### Base Implementation

#### 1. Detect Validation Target

**If no arguments provided** (`$1` empty):
- Parse conversation history for `/base:spec-impl <feature> [tasks]` commands
- Extract feature names and task numbers from each execution
- Aggregate all implemented tasks by feature
- Report detected implementations (e.g., "user-auth: 1.1, 1.2, 1.3")
- If no history found, scan `{{MICHI_DIR}}/specs/` for features with completed tasks `[x]`

**If feature provided** (`$1` present, `$2` empty):
- Use specified feature
- Detect all completed tasks `[x]` in `{{MICHI_DIR}}/specs/$1/tasks.md`

**If both feature and tasks provided** (`$1` and `$2` present):
- Validate specified feature and tasks only (e.g., `user-auth 1.1,1.2`)

#### 2. Load Context

For each detected feature:
- Read `{{MICHI_DIR}}/specs/<feature>/spec.json` for metadata
- Read `{{MICHI_DIR}}/specs/<feature>/requirements.md` for requirements
- Read `{{MICHI_DIR}}/specs/<feature>/design.md` for design structure
- Read `{{MICHI_DIR}}/specs/<feature>/tasks.md` for task list
- **Load ALL master docs context**: Read entire `{{REPO_ROOT_DIR}}/docs/master/` directory including:
  - Default files: `structure.md`, `tech.md`, `product.md`
  - All custom master docs files (regardless of mode settings)

#### 3. Execute Validation

For each task, verify:

**Task Completion Check**:
- Checkbox is `[x]` in tasks.md
- If not completed, flag as "Task not marked complete"

**Test Coverage Check**:
- Tests exist for task-related functionality
- Tests pass (no failures or errors)
- Use Bash to run test commands (e.g., `npm test`, `pytest`)
- If tests fail or don't exist, flag as "Test coverage issue"

**Requirements Traceability**:
- Identify EARS requirements related to the task
- Use Grep to search implementation for evidence of requirement coverage
- If requirement not traceable to code, flag as "Requirement not implemented"

**Design Alignment**:
- Check if design.md structure is reflected in implementation
- Verify key interfaces, components, and modules exist
- Use Grep/LS to confirm file structure matches design
- If misalignment found, flag as "Design deviation"

**Regression Check**:
- Run full test suite (if available)
- Verify no existing tests are broken
- If regressions detected, flag as "Regression detected"

### Michi Extensions

#### 4. Quality Gates Validation

Michi固有のPhase 6品質ゲートを検証:

```text
Phase 6.2: License & Version Audit
├─ OSS License check
└─ Dependency version check (LTS/EOL)

Phase 6.3: TDD Implementation
├─ Test coverage >= 95%
└─ All tests passing

Phase 6.4: Code Review
├─ PR created
└─ Review comments resolved

Phase 6.5: Coverage Validation
├─ Coverage threshold met
└─ Critical paths covered

Phase 6.8: Archive Preparation
├─ Release notes created
└─ Documentation updated
```

**TDD準拠チェック**:
- 全タスクに対応するテストの存在確認
- テストカバレッジ95%達成確認
- テストファーストの原則遵守確認

**セキュリティチェック**:
- 入力値検証の実装確認
- 認証・認可の実装確認
- セキュアコーディング原則の遵守

#### 5. Generate Enhanced Report

Provide comprehensive validation report:

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

## Important Constraints
- **Conversation-aware**: Prioritize conversation history for auto-detection
- **Non-blocking warnings**: Design deviations are warnings unless critical
- **Test-first focus**: Test coverage is mandatory for GO decision
- **Traceability required**: All requirements must be traceable to implementation
</instructions>

## Tool Guidance
- **Conversation parsing**: Extract `/base:spec-impl` patterns from history
- **Read context**: Load all specs and master docs before validation
- **Bash for tests**: Execute test commands to verify pass status
- **Grep for traceability**: Search codebase for requirement evidence
- **LS/Glob for structure**: Verify file structure matches design

## Output Description

Provide output in the language specified in spec.json with:

### Base Output

1. **Detected Target**: Features and tasks being validated (if auto-detected)
2. **Validation Summary**: Brief overview per feature (pass/fail counts)
3. **Issues**: List of validation failures with severity and location
4. **Coverage Report**: Requirements/design/task coverage percentages
5. **Decision**: GO (ready for next phase) / NO-GO (needs fixes)

### Michi Extended Output

After base output, add enhanced quality gates report with 5-phase status and recommendations.

**Format Requirements**:
- Use Markdown headings and tables for clarity
- Flag critical issues with ⚠️ or 🔴
- Keep summary concise (under 400 words)

## Safety & Fallback

### Error Scenarios
- **No Implementation Found**: If no `/base:spec-impl` in history and no `[x]` tasks, report "No implementations detected"
- **Test Command Unknown**: If test framework unclear, warn and skip test validation (manual verification required)
- **Missing Spec Files**: If spec.json/requirements.md/design.md missing, stop with error
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language

### Next Steps Guidance

**If GO Decision**:
- Implementation validated and ready
- Proceed to deployment or next feature

**If NO-GO Decision**:
- Address critical issues listed
- Re-run `/michi:dev <feature> [tasks]` for fixes
- Re-validate with `/michi:review-dev [feature] [tasks]`

**Note**: Validation is recommended after implementation to ensure spec alignment and quality.

---

**Michi Integration**: This command extends base implementation validation with 5-phase quality gates, security checks, and automated remediation suggestions for comprehensive implementation quality assurance.
