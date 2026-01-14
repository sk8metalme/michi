---
name: /michi:review-design
description: Interactive technical design validation with test planning readiness check (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch, AskUserQuestion
argument-hint: <feature-name>
---

# Michi: Design Validation with Test Planning

<background_information>
- **Mission**: Conduct interactive quality review of technical design to ensure readiness for implementation
- **Success Criteria**:
  - Critical issues identified (maximum 3 most important concerns)
  - Balanced assessment with strengths recognized
  - Clear GO/NO-GO decision with rationale
  - Actionable feedback for improvements if needed
  - Test planning readiness checked (Michi extension)
</background_information>

## Development Guidelines

{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Interactive design quality review for feature **$1** based on approved requirements and design document.

## Execution Steps

### Base Implementation

1. **Load Context**:
   - Read `{{MICHI_DIR}}/specs/$1/spec.json` for language and metadata
   - Read `{{MICHI_DIR}}/specs/$1/requirements.md` for requirements
   - Read `{{MICHI_DIR}}/specs/$1/design.md` for design document
   - **Load ALL master docs context**: Read entire `{{REPO_ROOT_DIR}}/docs/master/` directory including:
     - Default files: `structure.md`, `tech.md`, `product.md`
     - All custom master docs files (regardless of mode settings)
     - This provides complete project memory and context

2. **Read Review Guidelines**:
   - Read `{{MICHI_DIR}}/settings/rules/design-review.md` for review criteria and process

3. **Execute Design Review**:
   - Follow design-review.md process: Analysis → Critical Issues → Strengths → GO/NO-GO
   - Limit to 3 most important concerns
   - Engage interactively with user
   - Use language specified in spec.json for output

4. **Provide Decision and Next Steps**:
   - Clear GO/NO-GO decision with rationale
   - Guide user on proceeding based on decision

### Michi Extensions

5. **Test Planning Readiness Check**:

   設計が承認された場合（GO Decision）、Phase 4（テスト計画）の完了状況を確認:

   **テスト計画完了確認**:
   - `.michi/specs/$1/test-specs/` ディレクトリが存在するか
   - テスト仕様書が作成されているか（Phase 4.2 完了）
   - テストタイプが選択されているか（Phase 4.1 完了）

   **未完了の場合の推奨アクション**:

   Phase 4 が未完了の場合は、タスク生成前に完了することを推奨:

   1. **Phase 4.1: テストタイプの選択**
      - 参照: `docs/user-guide/testing/test-planning-flow.md#phase-03-テストタイプの選択`
      - 設計書の Testing Strategy セクションを基に決定

   2. **Phase 4.2: テスト仕様書の作成**
      - テンプレート:
        - 単体テスト: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
        - 統合テスト: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
      - 出力先: `.michi/specs/$1/test-specs/`

   3. **完了後**: `/michi:create-tasks $1` でタスク生成に進む

## Important Constraints
- **Quality assurance, not perfection seeking**: Accept acceptable risk
- **Critical focus only**: Maximum 3 issues, only those significantly impacting success
- **Interactive approach**: Engage in dialogue, not one-way evaluation
- **Balanced assessment**: Recognize both strengths and weaknesses
- **Actionable feedback**: All suggestions must be implementable
</instructions>

## Tool Guidance
- **Read first**: Load all context (spec, master docs, rules) before review
- **Grep if needed**: Search codebase for pattern validation or integration checks
- **Interactive**: Engage with user throughout the review process
- **Bash**: Check test-specs directory existence for test planning readiness

## Output Description

Provide output in the language specified in spec.json with:

### Base Output

1. **Review Summary**: Brief overview (2-3 sentences) of design quality and readiness
2. **Critical Issues**: Maximum 3, following design-review.md format
3. **Design Strengths**: 1-2 positive aspects
4. **Final Assessment**: GO/NO-GO decision with rationale and next steps

### Michi Extended Output

After base output (if GO decision), add test planning checklist:

```text
=== Test Planning Readiness ===

Phase 4 Status:
- [ ] テストタイプ選択完了（Phase 4.1）
- [ ] テスト仕様書作成完了（Phase 4.2）

**テスト計画完了済みの場合**:
→ /michi:create-tasks $1

**テスト計画未完了の場合**:
→ /michi:plan-tests $1  # Phase 4 統合実行
```

**Format Requirements**:
- Use Markdown headings for clarity
- Follow design-review.md output format
- Keep summary concise

## Safety & Fallback

### Error Scenarios
- **Missing Design**: If design.md doesn't exist, stop with message: "Run `/michi:create-design $1` first to generate design document"
- **Design Not Generated**: If design phase not marked as generated in spec.json, warn but proceed with review
- **Empty Master Docs Directory**: Warn user that project context is missing and may affect review quality
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language

### Next Phase: Task Generation

**If Design Passes Validation (GO Decision)**:
- Review feedback and apply changes if needed
- **Recommended**: Complete Phase 4 (Test Planning) before task generation
- Run `/michi:create-tasks $1` to generate implementation tasks
- Or `/michi:create-tasks $1 -y` to auto-approve and proceed directly

**If Design Needs Revision (NO-GO Decision)**:
- Address critical issues identified
- Re-run `/michi:create-design $1` with improvements
- Re-validate with `/michi:review-design $1`

**Note**: Design validation is recommended but optional. Quality review helps catch issues early.

---

**Michi Integration**: This command extends base design validation with test planning readiness check (Phase 4) to ensure comprehensive quality preparation before task generation.

think
