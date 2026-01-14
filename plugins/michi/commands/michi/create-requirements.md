---
name: /michi:create-requirements
description: Generate comprehensive requirements with ultrathink enabled (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name>
---

# Michi: Requirements Generation with Ultrathink

<background_information>
- **Mission**: Generate comprehensive, testable requirements in EARS format based on the project description from spec initialization
- **Success Criteria**:
  - Create complete requirements document aligned with master docs context
  - Follow the project's EARS patterns and constraints for all acceptance criteria
  - Focus on core functionality without implementation details
  - Update metadata to track generation status
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Generate complete requirements for feature **$1** based on the project description in requirements.md.

## Execution Steps

### Base Implementation

1. **Load Context**:
   - Read `{{MICHI_DIR}}/specs/$1/spec.json` for language and metadata
   - Read `{{MICHI_DIR}}/specs/$1/requirements.md` for project description
   - **Load ALL master docs context**: Read entire `{{REPO_ROOT_DIR}}/docs/master/` directory including:
     - Default files: `structure.md`, `tech.md`, `product.md`
     - All custom master docs files (regardless of mode settings)
     - This provides complete project memory and context

2. **Read Guidelines**:
   - Read `{{MICHI_DIR}}/settings/rules/ears-format.md` for EARS syntax rules
   - Read `{{MICHI_DIR}}/settings/templates/specs/requirements.md` for document structure

3. **Generate Requirements**:
   - Create initial requirements based on project description
   - Group related functionality into logical requirement areas
   - Apply EARS format to all acceptance criteria
   - Use language specified in spec.json

4. **Update Metadata**:
   - Set `phase: "requirements-generated"`
   - Set `approvals.requirements.generated: true`
   - Update `updated_at` timestamp

### Michi Extensions

5. **Ultrathink Automatic Enablement**:
   - Requirements generation requires complex analysis
   - Extended thinking (ultrathink) is enabled by default
   - Provides deeper analysis and more comprehensive requirements

6. **JIRA/Confluence Integration Pre-check**:
   - Check environment variables at execution start:
     ```bash
     echo "=== Michi Requirements Generation ==="
     echo ""

     # JIRA連携チェック
     if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
         JIRA_CONFIGURED=true
         echo "✅ JIRA連携: 設定済み"
     else
         JIRA_CONFIGURED=false
         echo "⚠️  JIRA連携: 未設定"
         echo "   ヒント: Phase 9（タスクのJIRA同期）を利用する場合は設定が必要です"
         echo "   設定方法: docs/guides/atlassian-integration.md"
     fi
     echo ""
     ```
   - Display readiness for Phase 9 (JIRA sync)

## Important Constraints
- Focus on WHAT, not HOW (no implementation details)
- Requirements must be testable and verifiable
- Choose appropriate subject for EARS statements (system/service name for software)
- Generate initial version first, then iterate with user feedback (no sequential questions upfront)
- Requirement headings in requirements.md MUST include a leading numeric ID only (for example: "Requirement 1", "1.", "2 Feature ..."); do not use alphabetic IDs like "Requirement A".
</instructions>

## Tool Guidance
- **Read first**: Load all context (spec, master docs, rules, templates) before generation
- **Write last**: Update requirements.md only after complete generation
- Use **WebSearch/WebFetch** only if external domain knowledge needed

## Output Description

Provide output in the language specified in spec.json with:

### Base Output

1. **Generated Requirements Summary**: Brief overview of major requirement areas (3-5 bullets)
2. **Document Status**: Confirm requirements.md updated and spec.json metadata updated
3. **Next Steps**: Guide user on how to proceed (approve and continue, or modify)

### Michi Extended Output

After base output, add:

```bash
echo ""
echo "============================================"
echo " Michi Requirements Generation Complete"
echo "============================================"
echo ""
echo "### 生成された要件定義書"
echo "\`.michi/specs/$1/requirements.md\`"
echo ""
echo "### 次のステップ"
echo ""
echo "**Requirements Approved の場合**:"
echo "1. **設計書を生成**:"
echo "   /michi:create-design $1"
echo ""
echo "**Modifications Needed の場合**:"
echo "- フィードバックを提供し、再度実行:"
echo "  /michi:create-requirements $1"
echo ""
echo "---"

if [ "$JIRA_CONFIGURED" = "true" ]; then
    echo "ℹ️  JIRA連携: 設定済み"
else
    echo "ℹ️  JIRA連携: 未設定"
fi
echo "ℹ️  Ultrathink: 有効（深い分析モード）"
echo ""
```

**Format Requirements**:
- Use Markdown headings for clarity
- Include file paths in code blocks
- Keep summary concise (under 300 words)

## Safety & Fallback

### Error Scenarios
- **Missing Project Description**: If requirements.md lacks project description, ask user for feature details
- **Ambiguous Requirements**: Propose initial version and iterate with user rather than asking many upfront questions
- **Template Missing**: If template files don't exist, use inline fallback structure with warning
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language
- **Incomplete Requirements**: After generation, explicitly ask user if requirements cover all expected functionality
- **Master Docs Directory Empty**: Warn user that project context is missing and may affect requirement quality (Michi: display warning and recommend master docs creation)
- **Non-numeric Requirement Headings**: If existing headings do not include a leading numeric ID (for example, they use "Requirement A"), normalize them to numeric IDs and keep that mapping consistent (never mix numeric and alphabetic labels).

### Additional Michi Scenarios
- **Ultrathink Timeout**: For long-running processes, save intermediate results and allow resumption
- **Large Projects**: Consider section-by-section generation

### Next Phase: Design Generation

**If Requirements Approved**:
- Review generated requirements at `{{MICHI_DIR}}/specs/$1/requirements.md`
- **Optional Gap Analysis** (for existing codebases):
  - Run `/base:validate-gap $1` to analyze implementation gap with current code
  - Identifies existing components, integration points, and implementation strategy
  - Recommended for brownfield projects; skip for greenfield
- Then `/michi:create-design $1 -y` to proceed to design phase

**If Modifications Needed**:
- Provide feedback and re-run `/michi:create-requirements $1`

**Note**: Approval is mandatory before proceeding to design phase.

---

**Michi Integration**: This command extends base requirements generation with ultrathink automatic enablement and JIRA/Confluence integration pre-check, providing deeper analysis and seamless navigation to Michi workflow.

think hard
