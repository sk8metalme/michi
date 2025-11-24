# Michi Core Principles for Gemini CLI

## Development Guidelines
{{DEV_GUIDELINES}}

## Language
All generated documents should be in: **{{LANG_CODE}}**

Reference the language field in {{KIRO_DIR}}/project.json.

## Single Source of Truth (SSoT)

### GitHub as SSoT
- **All specifications are managed in GitHub** ({{KIRO_DIR}}/specs/)
- Confluence is **reference and approval only** (editing is GitHub only)
- Avoid duplicate management

### Data Flow
```
GitHub ({{KIRO_DIR}}/specs/)  ← Source of truth (editable)
    ↓ sync
Confluence ← Display and approval (read-only)
```

## Multi-Project Management

### Project Identification
- All operations reference {{KIRO_DIR}}/project.json
- Dynamically use project ID, JIRA key, Confluence labels
- Project ID: {{PROJECT_ID}}

### Naming Conventions

#### Confluence Pages
- Format: `[{projectName}] {document_type}`
- Example: `[{{PROJECT_ID}}] Requirements`

#### JIRA Epic/Story
- Format: `[{JIRA_KEY}] {title}`
- Use project metadata from {{KIRO_DIR}}/project.json

## Project Structure

- Project metadata: {{KIRO_DIR}}/project.json
- Specifications: {{KIRO_DIR}}/specs/
- Templates: {{KIRO_DIR}}/settings/templates/
- Steering: {{KIRO_DIR}}/steering/

## Workflow Integration

### Spec Generation
Use Gemini CLI to generate specifications in {{KIRO_DIR}}/specs/

### Git Integration
```bash
# After spec generation
git add {{KIRO_DIR}}/specs/
git commit -m "docs: Add <feature> specification"
git push
```

### Confluence Sync
Sync GitHub specs to Confluence using Michi commands:
```bash
# Example: Sync requirements
npm run confluence:sync
```

## Best Practices

1. **Always reference project.json** for project-specific metadata
2. **Use SSoT principle** - Edit in GitHub, reference in Confluence
3. **Follow naming conventions** for consistency
4. **Generate specs incrementally** - Requirements → Design → Tasks
5. **Commit frequently** to GitHub

## Additional Context

For Atlassian integration rules and multi-project management details,
see extensions in {{KIRO_DIR}}/.gemini/extensions/
