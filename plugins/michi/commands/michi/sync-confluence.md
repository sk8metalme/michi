---
name: /michi:sync-confluence
description: Sync specifications to Confluence (Michi-specific feature)
---

# Confluence Sync Command

> **Michi 固有機能**: このコマンドは Michi 独自の機能です。base コマンドには含まれません。
>
> 仕様書（requirements.md, design.md）を Confluence に同期し、承認ワークフローを実現します。

## Development Guidelines

{{DEV_GUIDELINES}}

## Usage

```
/michi:sync-confluence <feature_name>
```

**Parameters**:
- `feature_name`: Feature name (e.g., user-auth, payment-api)

## Execution Steps

1. Read specifications from {{SPEC_DIR}}/specs/{{FEATURE_NAME}}/
2. Load project metadata from {{SPEC_DIR}}/project.json
3. Sync requirements.md to Confluence
4. Sync design.md to Confluence
5. Create/update Confluence pages with proper labels
6. Link pages to JIRA Epic (if exists)

## Language Handling

- Read language from {{SPEC_DIR}}/project.json
- Generate all output in the specified language
- Use Confluence labels from project.json for page organization

## Project Metadata

- Project ID: {{PROJECT_ID}}
- Spec directory: {{SPEC_DIR}}
- Agent directory: {{AGENT_DIR}}
