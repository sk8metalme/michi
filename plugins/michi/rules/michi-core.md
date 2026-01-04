---
title: Michi Core Principles
description: Core principles for GitHub SSoT and multi-project management
---

# Michi Core Principles

## Development Guidelines
{{DEV_GUIDELINES}}

## Language
All generated documents should be in: **{{LANG_CODE}}**

Reference the language field in {{SPEC_DIR}}/project.json.

## Single Source of Truth (SSoT)

### GitHub as SSoT
- **All specifications are managed in GitHub** ({{SPEC_DIR}}/specs/)
- Confluence is **reference and approval only** (editing is GitHub only)
- Avoid duplicate management

### Data Flow
```text
GitHub ({{SPEC_DIR}}/specs/)  ← Source of truth (editable)
    ↓ sync
Confluence ← Display and approval (read-only)
```

## Multi-Project Management

### Project Identification
- All operations reference {{SPEC_DIR}}/project.json
- Dynamically use project ID, JIRA key, Confluence labels
- Project ID: {{PROJECT_ID}}

### Naming Conventions

#### Confluence Pages
- Format: `[{projectName}] {document_type}`
- Example: `[{{PROJECT_ID}}] Requirements`

#### JIRA Epic/Story
- Format: `[{JIRA_KEY}] {title}`
- Use project metadata from {{SPEC_DIR}}/project.json

## Agent Directory
- Agent configuration: {{AGENT_DIR}}
- Rules location: {{AGENT_DIR}}/rules/
- Commands location: {{AGENT_DIR}}/commands/

## Feature Development
- Feature name: {{FEATURE_NAME}}
- Spec location: {{SPEC_DIR}}/specs/{{FEATURE_NAME}}/
