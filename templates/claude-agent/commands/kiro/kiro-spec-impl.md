# kiro:spec-impl - Spec Implementation Command

## Overview

This command implements the specifications defined in `tasks.md` following TDD (Test-Driven Development) practices with automatic JIRA integration.

**Key Features:**

- Automatic JIRA info detection from `spec.json`
- Updates both Epic AND first Story status
- Creates PR and adds JIRA comments automatically

## Arguments

- `$ARGUMENTS`: Feature name (e.g., "user-auth")

**Note:** JIRA ticket keys are automatically detected from `.kiro/specs/{feature}/spec.json`. No need to specify them manually.

## Pre-requisites

1. `.kiro/specs/{feature}/tasks.md` must exist
2. `.kiro/specs/{feature}/spec.json` must contain JIRA info (run `michi jira:sync` first)
3. Environment variables must be configured:
   - `ATLASSIAN_URL`: JIRA instance URL
   - `ATLASSIAN_EMAIL`: JIRA user email
   - `ATLASSIAN_API_TOKEN`: JIRA API token
   - `GITHUB_TOKEN`: GitHub API token
   - `GITHUB_REPO`: GitHub repository (owner/repo format)

## Execution Flow

### 1. Parse Arguments

```
Input: $ARGUMENTS
Expected format: "<feature-name>"
Example: "user-auth"
```

Extract:

- `FEATURE_NAME`: Feature name from arguments

### 2. JIRA Info Detection (Automatic)

Read JIRA information from `.kiro/specs/$FEATURE_NAME/spec.json`:

```json
{
  "jira": {
    "epicKey": "PROJ-123",
    "storyKeys": ["PROJ-124", "PROJ-125"],
    "epicUrl": "https://..."
  }
}
```

**If JIRA info is missing:**

- Ask user: "JIRA info not found. Skip JIRA integration? (y/n)"
- If yes: Continue without JIRA integration
- If no: Stop and suggest running `michi jira:sync $FEATURE_NAME` first

### 3. Start Processing (JIRA Status Update)

**Automatically move Epic AND first Story to "In Progress":**

This is handled internally. The workflow will:

1. Transition Epic to "In Progress"
2. Transition first Story to "In Progress"

### 4. Implementation Phase (TDD)

Read the tasks from `.kiro/specs/$FEATURE_NAME/tasks.md` and implement each Story following TDD:

For each Story in tasks.md:

1. **Read Story Requirements**
   - Parse the Story section from tasks.md
   - Identify acceptance criteria and subtasks

2. **Write Tests First (Red)**
   - Create test files based on acceptance criteria
   - Run tests to verify they fail

3. **Implement Code (Green)**
   - Write minimal code to pass tests
   - Follow the existing code patterns in the project

4. **Refactor (Blue)**
   - Clean up code while keeping tests green
   - Apply project coding standards

5. **Commit Changes**
   - Create atomic commits for each Story
   - Use conventional commit format: `feat($FEATURE_NAME): Story title`

### 5. End Processing (PR Creation & JIRA Update)

**Automatically complete the workflow:**

This is handled internally. The workflow will:

1. Push the branch to remote
2. Create a Pull Request on GitHub
3. Move Epic AND first Story to "Ready for Review"
4. Add PR link as a comment on the Epic

## Usage Examples

```
/kiro:spec-impl user-auth
```

```
/kiro:spec-impl payment-gateway
```

## Workflow Comparison

### Before (3 steps with manual JIRA keys)

```bash
michi spec-impl:start user-auth PROJ-123
/kiro:spec-impl user-auth PROJ-123
michi spec-impl:complete user-auth PROJ-123
```

### After (1 command with auto-detection)

```
/kiro:spec-impl user-auth
# JIRA info auto-detected from spec.json
# Epic + first Story -> "In Progress"
# TDD implementation
# PR creation
# Epic + first Story -> "Ready for Review"
# PR link commented on JIRA
```

## JIRA Status Mapping

Default status names (customizable in `.michi/config.json`):

| Phase | Default Status   | Targets            |
| ----- | ---------------- | ------------------ |
| Start | In Progress      | Epic + First Story |
| End   | Ready for Review | Epic + First Story |

To customize, add to `.michi/config.json`:

```json
{
  "jira": {
    "statusMapping": {
      "inProgress": "In Progress",
      "readyForReview": "Ready for Review"
    }
  }
}
```

## Error Handling

- **JIRA info not found**: Interactive prompt to skip JIRA integration
- **JIRA transition fails**: Check available transitions for the current status
- **PR creation fails**: Ensure the branch is pushed to remote
- **JIRA comment fails**: The PR URL is still returned for manual update

## Notes

- JIRA info is automatically detected from `spec.json` (populated by `michi jira:sync`)
- Both Epic AND first Story are updated together
- The branch name defaults to `feature/{feature-name}`
- Individual JIRA operations can still be done via `michi jira:transition` and `michi jira:comment`
