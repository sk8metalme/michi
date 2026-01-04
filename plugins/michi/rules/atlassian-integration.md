---
title: Atlassian Integration
description: Integration rules for Confluence and JIRA via MCP
---

# Atlassian Integration

## Development Guidelines
{{DEV_GUIDELINES}}

## Language
All generated documents should be in: **{{LANG_CODE}}**

## MCP Integration

### Confluence Sync
- Sync specifications from {{SPEC_DIR}}/specs/ to Confluence
- Use MCP server for Confluence operations
- Project labels: Check {{SPEC_DIR}}/project.json

### JIRA Sync
- Create Epic and Stories from {{SPEC_DIR}}/specs/{{FEATURE_NAME}}/tasks.md
- Use JIRA project key: {{PROJECT_ID}}
- Link Confluence pages automatically

## Project Metadata
- Project ID: {{PROJECT_ID}}
- Kiro directory: {{SPEC_DIR}}
- Agent directory: {{AGENT_DIR}}

## Workflow
1. Create spec in {{SPEC_DIR}}/specs/{{FEATURE_NAME}}/
2. Sync to Confluence via MCP
3. Create JIRA Epic/Stories
4. Link Confluence pages to JIRA
