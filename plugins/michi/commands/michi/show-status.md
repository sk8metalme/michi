---
name: /michi:show-status
description: Show specification status and progress (Michi version with enhanced summary)
allowed-tools: Bash, Read, Glob, Write, Edit, MultiEdit, Update
argument-hint: <feature-name>
---

# Michi: Spec Status with Progress Summary

<background_information>
- **Mission**: Display comprehensive status and progress for a specification
- **Success Criteria**:
  - Show current phase and completion status
  - Identify next actions and blockers
  - Provide clear visibility into progress
  - Display quality metrics and external integration status
  - Show timeline information
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Generate status report for feature **$1** showing progress across all phases.

## Execution Steps

### Base Implementation

#### Step 1: Load Spec Context
- Read `{{MICHI_DIR}}/specs/$1/spec.json` for metadata and phase status
- Read existing files: `requirements.md`, `design.md`, `tasks.md` (if they exist)
- Check `{{MICHI_DIR}}/specs/$1/` directory for available files

#### Step 2: Analyze Status

**Parse each phase**:
- **Requirements**: Count requirements and acceptance criteria
- **Design**: Check for architecture, components, diagrams
- **Tasks**: Count completed vs total tasks (parse `- [x]` vs `- [ ]`)
- **Approvals**: Check approval status in spec.json

#### Step 3: Generate Report

Create report in the language specified in spec.json covering:
1. **Current Phase & Progress**: Where the spec is in the workflow
2. **Completion Status**: Percentage complete for each phase
3. **Task Breakdown**: If tasks exist, show completed/remaining counts
4. **Next Actions**: What needs to be done next
5. **Blockers**: Any issues preventing progress

### Michi Extensions

#### Step 4: Enhanced Progress Reporting

Add the following extended information to the report:

**Quality Metrics**:
- Test Coverage: Target percentage from design.md (if specified)
- Code Review: Status (pending/completed)
- Technical Debt: Presence indicator

**External Integration Status**:
- **JIRA**: Check environment variables and display sync status
  - Number of synced tickets and their statuses
  - Last sync timestamp (from spec.json if available)
- **Confluence**: Document sync status
  - Last sync timestamp

**Timeline Information**:
- Each Phase completion dates (from spec.json timestamps)
- Average work time (if similar spec statistics available)
- Estimated remaining time

## Critical Constraints
- Use language from spec.json
- Calculate accurate completion percentages
- Identify specific next action commands
- Check JIRA/Confluence environment variables for integration status
</instructions>

## Tool Guidance
- **Read**: Load spec.json first, then other spec files as needed
- **Parse carefully**: Extract completion data from tasks.md checkboxes
- Use **Glob** to check which spec files exist
- Use **Bash** to check environment variables for external integrations

## Output Description

Provide status report in the language specified in spec.json:

### Base Output

**Report Structure**:
1. **Feature Overview**: Name, phase, last updated
2. **Phase Status**: Requirements, Design, Tasks with completion %
3. **Task Progress**: If tasks exist, show X/Y completed
4. **Next Action**: Specific command to run next
5. **Issues**: Any blockers or missing elements

### Michi Extended Output

After base output, add:

```text
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
  1. /michi:dev <feature>  - Continue implementation
  2. Review PR #123 for Task 5.3
```

**Format**: Clear, scannable format with emojis (✅/⏳/❌) for status

### Command Options

The following command options can be suggested in the output:

```bash
# すべてのspecのステータス一覧
/michi:show-status --all

# アーカイブ含む全体進捗
/michi:show-status --all --include-archived

# JSON出力（CI/CD統合用）
/michi:show-status <feature> --json
```

## Safety & Fallback

### Error Scenarios

**Spec Not Found**:
- **Message**: "No spec found for `$1`. Check available specs in `{{MICHI_DIR}}/specs/`"
- **Action**: List available spec directories

**Incomplete Spec**:
- **Warning**: Identify which files are missing
- **Suggested Action**: Point to next phase command

### List All Specs

To see all available specs:
- Run with no argument or use wildcard
- Shows all specs in `{{MICHI_DIR}}/specs/` with their status

---

**Michi Integration**: This command extends base spec status with quality metrics, external integration status (JIRA/Confluence), and timeline information for comprehensive progress tracking.

think
