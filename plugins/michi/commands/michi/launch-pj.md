---
name: /michi:launch-pj
description: Initialize a new specification with detailed project description (Michi version with JIRA integration check)
allowed-tools: Bash, Read, Write, Glob
argument-hint: <project-description>
---

# Michi: Spec Initialization with Integration Setup

<background_information>
- **Mission**: Initialize the first phase of spec-driven development by creating directory structure and metadata for a new specification
- **Success Criteria**:
  - Generate appropriate feature name from project description
  - Create unique spec structure without conflicts
  - Provide clear path to next phase (requirements generation)
  - Check JIRA/Confluence integration setup
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Generate a unique feature name from the project description ($ARGUMENTS) and initialize the specification structure.

## Execution Steps

### Base Implementation

1. **Check Uniqueness**: Verify `{{MICHI_DIR}}/specs/` for naming conflicts (append number suffix if needed)
2. **Create Directory**: `{{MICHI_DIR}}/specs/[feature-name]/`
3. **Initialize Files Using Templates**:
   - Read `{{MICHI_DIR}}/settings/templates/specs/init.json`
   - Read `{{MICHI_DIR}}/settings/templates/specs/requirements-init.md`
   - Replace placeholders:
     - `{{FEATURE_NAME}}` → generated feature name
     - `{{TIMESTAMP}}` → current ISO 8601 timestamp
     - `{{PROJECT_DESCRIPTION}}` → $ARGUMENTS
   - Write `spec.json` and `requirements.md` to spec directory

### Michi Extensions

4. **JIRA/Confluence Integration Check**:
   - Check environment variables: `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`
   - If configured: Display message about JIRA sync availability in later phases
   - If not configured: Show setup hint with reference to `docs/guides/atlassian-integration.md`

5. **Next Step Navigation**:
   - Guide user to `/michi:create-requirements` (not `/base:spec-requirements`)
   - Display Michi workflow overview

## Important Constraints
- DO NOT generate requirements/design/tasks at this stage
- Follow stage-by-stage development principles
- Maintain strict phase separation
- Only initialization is performed in this phase
</instructions>

## Tool Guidance
- Use **Glob** to check existing spec directories for name uniqueness
- Use **Read** to fetch templates: `init.json` and `requirements-init.md`
- Use **Write** to create spec.json and requirements.md after placeholder replacement
- Use **Bash** to check environment variables for JIRA/Confluence integration
- Perform validation before any file write operation

## Output Description

Provide output in the language specified in `spec.json` with the following structure:

### Base Output

1. **Generated Feature Name**: `feature-name` format with 1-2 sentence rationale
2. **Project Summary**: Brief summary (1 sentence)
3. **Created Files**: Bullet list with full paths
4. **Notes**: Explain why only initialization was performed (2-3 sentences on phase separation)

### Michi Extended Output

After base output, add:

```bash
echo ""
echo "============================================"
echo " Michi Spec Initialization Complete"
echo "============================================"
echo ""
echo "### 次のステップ"
echo ""
echo "1. **要件定義書を生成**:"
echo "   /michi:create-requirements <feature-name>"
echo "   ※ ultrathinkが自動有効化され、深い分析が行われます"
echo ""
echo "2. **設計書を生成**:"
echo "   /michi:create-design <feature-name>"
echo ""
echo "---"

# JIRA連携チェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    echo "ℹ️  JIRA連携: 設定済み（タスク生成後にJIRA同期が利用可能）"
else
    echo "ℹ️  JIRA連携: 未設定"
    echo "   設定方法: docs/guides/atlassian-integration.md を参照"
fi
echo ""
```

**Format Requirements**:
- Use Markdown headings (##, ###)
- Wrap commands in code blocks
- Keep total output concise (under 300 words)
- Use clear, professional language per `spec.json.language`

## Safety & Fallback

- **Ambiguous Feature Name**: If feature name generation is unclear, propose 2-3 options and ask user to select
- **Template Missing**: If template files don't exist in `{{MICHI_DIR}}/settings/templates/specs/`, report error with specific missing file path and suggest checking repository setup
- **Directory Conflict**: If feature name already exists, append numeric suffix (e.g., `feature-name-2`) and notify user of automatic conflict resolution
- **Write Failure**: Report error with specific path and suggest checking permissions or disk space

---

**Michi Integration**: This command extends base spec initialization with JIRA/Confluence integration checks and seamless navigation to Michi workflow.
