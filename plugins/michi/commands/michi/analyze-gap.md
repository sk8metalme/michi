---
name: /michi:analyze-gap
description: Analyze implementation gap between requirements and existing codebase (Michi version with detailed report)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit
argument-hint: <feature-name>
---

# Michi: Gap Analysis with Detailed Report

<background_information>
- **Mission**: Analyze the gap between requirements and existing codebase to inform implementation strategy
- **Success Criteria**:
  - Comprehensive understanding of existing codebase patterns and components
  - Clear identification of missing capabilities and integration challenges
  - Multiple viable implementation approaches evaluated
  - Technical research needs identified for design phase
  - Structured report with actionable insights (Michi extension)
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Analyze implementation gap for feature **$1** based on approved requirements and existing codebase.

## Execution Steps

### Base Implementation

1. **Load Context**:
   - Read `{{MICHI_DIR}}/specs/$1/spec.json` for language and metadata
   - Read `{{MICHI_DIR}}/specs/$1/requirements.md` for requirements
   - **Load ALL master docs context**: Read entire `{{REPO_ROOT_DIR}}/docs/master/` directory including:
     - Default files: `structure.md`, `tech.md`, `product.md`
     - All custom master docs files (regardless of mode settings)
     - This provides complete project memory and context

2. **Read Analysis Guidelines**:
   - Read `{{MICHI_DIR}}/settings/rules/gap-analysis.md` for comprehensive analysis framework

3. **Execute Gap Analysis**:
   - Follow gap-analysis.md framework for thorough investigation
   - Analyze existing codebase using Grep and Read tools
   - Use WebSearch/WebFetch for external dependency research if needed
   - Evaluate multiple implementation approaches (extend/new/hybrid)
   - Use language specified in spec.json for output

4. **Generate Analysis Document**:
   - Create comprehensive gap analysis following the output guidelines in gap-analysis.md
   - Present multiple viable options with trade-offs
   - Flag areas requiring further research

### Michi Extensions

5. **Enhanced Gap Analysis Report**:

   Gap分析結果を構造化されたレポートで出力:

   **拡張分析項目**:

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

   **Gap Analysis Report構造**:

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

6. **JIRA Integration Option**:

   Gap分析結果からJIRAチケットを自動作成（将来実装予定）:

   ```bash
   # Gap分析結果をJIRAチケット化
   /michi:analyze-gap <feature> --create-jira-tickets
   ```

## Important Constraints
- **Information over Decisions**: Provide analysis and options, not final implementation choices
- **Multiple Options**: Present viable alternatives when applicable
- **Thorough Investigation**: Use tools to deeply understand existing codebase
- **Explicit Gaps**: Clearly flag areas needing research or investigation
</instructions>

## Tool Guidance
- **Read first**: Load all context (spec, master docs, rules) before analysis
- **Grep extensively**: Search codebase for patterns, conventions, and integration points
- **WebSearch/WebFetch**: Research external dependencies and best practices when needed
- **Write last**: Generate analysis only after complete investigation

## Output Description

Provide output in the language specified in spec.json with:

### Base Output

1. **Analysis Summary**: Brief overview (3-5 bullets) of scope, challenges, and recommendations
2. **Document Status**: Confirm analysis approach used
3. **Next Steps**: Guide user on proceeding to design phase

### Michi Extended Output

After base output, add:
- Structured gap analysis report with gap score
- Feature/Architecture/Test coverage gaps table
- Prioritized recommendations
- Optional JIRA integration command suggestion

**Format Requirements**:
- Use Markdown headings for clarity
- Keep summary concise (under 300 words)
- Detailed analysis follows gap-analysis.md output guidelines

## Safety & Fallback

### Error Scenarios
- **Missing Requirements**: If requirements.md doesn't exist, stop with message: "Run `/michi:create-requirements $1` first to generate requirements"
- **Requirements Not Approved**: If requirements not approved, warn user but proceed (gap analysis can inform requirement revisions)
- **Empty Master Docs Directory**: Warn user that project context is missing and may affect analysis quality
- **Complex Integration Unclear**: Flag for comprehensive research in design phase rather than blocking
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language

### Next Phase: Design Generation

**If Gap Analysis Complete**:
- Review gap analysis insights
- Run `/michi:create-design $1` to create technical design document
- Or `/michi:create-design $1 -y` to auto-approve requirements and proceed directly

**Note**: Gap analysis is optional but recommended for brownfield projects to inform design decisions.

---

**Michi Integration**: This command extends base gap analysis with detailed structured reports, gap scoring, and optional JIRA integration for actionable implementation planning.
