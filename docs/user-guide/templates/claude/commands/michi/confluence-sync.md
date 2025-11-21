---
name: /michi:confluence-sync
description: Sync specifications to Confluence
---

# Confluence Sync Command

**Important**: Generate output in language specified in {{KIRO_DIR}}/project.json.

## Usage

```
/michi:confluence-sync <feature_name>
```

**Parameters**:
- `feature_name`: Feature name (e.g., user-auth, payment-api)

## Execution Steps

1. Read specifications from {{KIRO_DIR}}/specs/{{FEATURE_NAME}}/
2. Load project metadata from {{KIRO_DIR}}/project.json
3. Sync requirements.md to Confluence
4. Sync design.md to Confluence
5. Create/update Confluence pages with proper labels
6. Link pages to JIRA Epic (if exists)

## Language Handling

- Read language from {{KIRO_DIR}}/project.json
- Generate all output in the specified language
- Use Confluence labels from project.json for page organization

## Project Metadata

- Project ID: {{PROJECT_ID}}
- Kiro directory: {{KIRO_DIR}}
- Agent directory: {{AGENT_DIR}}
