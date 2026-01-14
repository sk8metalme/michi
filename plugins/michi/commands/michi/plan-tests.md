---
name: /michi:plan-tests
description: Integrated test planning workflow for Phase 4 (Test type selection and test specification creation)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, AskUserQuestion
argument-hint: <feature-name> [-y]
---

# Michi: Test Planning (Phase 4)

## Development Guidelines

{{DEV_GUIDELINES}}

## Overview

This command integrates Phase 4.1 (Test Type Selection) and Phase 4.2 (Test Specification Creation) into a single, guided workflow. The AI will help you select appropriate test types based on your design document and create comprehensive test specifications.

## Prerequisites

Before running this command, ensure:
- Phase 3 (Design) has been completed
- `.michi/specs/{feature}/design.md` exists
- `spec.json` shows `design.approved: true`

## Workflow

### Phase 4.1: Test Type Selection

1. **Read Design Document**
   - Load `.michi/specs/{feature}/design.md`
   - Extract Testing Strategy section
   - Analyze project requirements to determine appropriate test types

2. **Recommend Test Types**
   Based on the design analysis, recommend appropriate test types:
   - **Unit Test** (単体テスト): Required for all features with business logic
   - **Integration Test** (統合テスト): Required when multiple components interact
   - **E2E Test**: Required for user-facing features
   - **Performance Test** (パフォーマンステスト): Required for APIs or high-load features
   - **Security Test** (セキュリティテスト): Required for authentication, authorization, or data handling features

3. **User Selection**
   Use `AskUserQuestion` to let the user select which test types to implement:

   ```markdown
   Question: "どのテストタイプを実装しますか？（複数選択可）"

   Options:
   - Unit Test (単体テスト) - 推奨
   - Integration Test (統合テスト) - 推奨
   - E2E Test - 推奨（ユーザー向け機能の場合）
   - Performance Test (パフォーマンステスト)
   - Security Test (セキュリティテスト) - 推奨（認証・認可機能の場合）
   ```

   Set `multiSelect: true` to allow multiple selections.

4. **Save Selection**
   Create `.michi/specs/{feature}/test-type-selection.json`:

   ```json
   {
     "featureName": "{feature}",
     "selectedTypes": ["unit", "integration", "e2e", "performance", "security"],
     "timestamp": "2025-12-09T12:00:00Z",
     "phase": "0.3"
   }
   ```

### Phase 4.2: Test Specification Creation

For each selected test type, create a test specification document:

1. **Read Template**
   Load the appropriate template from:
   - Unit: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
   - Integration: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
   - E2E: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
   - Performance: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
   - Security: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

2. **Extract Design Information**
   From `design.md`, extract:
   - Architecture diagrams
   - Component interfaces
   - API endpoints
   - Data models
   - Testing Strategy section

3. **Generate Test Specification**
   Use the template structure and design information to create a comprehensive test specification:
   - Replace template placeholders with actual feature details
   - Generate specific test cases based on requirements and design
   - Include requirement traceability IDs
   - Add coverage targets (95% for critical code, 80% minimum)

4. **Save Test Specification**
   Create `.michi/specs/{feature}/test-specs/{test-type}-test-spec.md`:
   - `unit-test-spec.md`
   - `integration-test-spec.md`
   - `e2e-test-spec.md`
   - `performance-test-spec.md`
   - `security-test-spec.md`

5. **Update spec.json**
   Update phase information in `spec.json`:

   ```json
   {
     "phase": "test-planning-completed",
     "testPlanning": {
       "phase03Completed": true,
       "phase04Completed": true,
       "testTypesSelected": ["unit", "integration", "e2e"],
       "testSpecsGenerated": ["unit", "integration", "e2e"]
     }
   }
   ```

## Output Structure

After completion, the following structure will be created:

```
.michi/specs/{feature}/
├── spec.json (updated)
├── requirements.md
├── design.md
├── test-type-selection.json (NEW)
└── test-specs/ (NEW)
    ├── unit-test-spec.md
    ├── integration-test-spec.md
    ├── e2e-test-spec.md
    ├── performance-test-spec.md (optional)
    └── security-test-spec.md (optional)
```

## Next Steps

After completing test planning, guide the user to the next phase:

### Recommended: Design Validation (Optional)

```bash
/michi:review-design {feature-name}
```

This command will:
- Review the design quality
- **Verify test planning completion** ✅
- Check requirement traceability

### Or: Proceed to Task Generation

```bash
/michi:create-tasks {feature-name} [-y]
```

This will generate implementation tasks based on requirements, design, and test specifications.

---

**Important:** Test planning (Phase 4) ensures that test implementation is properly included in the task breakdown, leading to comprehensive TDD implementation.

## Error Handling

- **Feature not found**: Display error and guide user to run `/michi:launch-pj` first
- **Design not approved**: Display error and guide user to complete Phase 3 first
- **Template read failure**: Use fallback structure and warn user
- **User cancels selection**: Save partial progress and allow resumption

---

**Michi 固有機能**: このコマンドは Phase 4（テスト計画）を統合した AI ガイド付きワークフローを提供します。
