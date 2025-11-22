# Atlassian Integration Rules

## Confluence Integration

### Page Creation Format
- Title: `[{{PROJECT_ID}}] {document_type}`
- Labels: Use {{KIRO_DIR}}/project.json `confluenceLabels`
- Space: Reference environment variables (CONFLUENCE_PRD_SPACE, etc.)

### Content Sync
- Source: GitHub {{KIRO_DIR}}/specs/
- Destination: Confluence pages
- Sync tool: `npm run confluence:sync`

## JIRA Integration

### Issue Creation Format
- Summary: `[{JIRA_KEY}] {title}`
- Project Key: Use {{KIRO_DIR}}/project.json `jiraProjectKey`
- Labels: Derived from Confluence labels

### Workflow
1. Generate specs in GitHub
2. Create JIRA epics/stories
3. Link Confluence pages to JIRA issues

## Environment Variables

Required variables (from .env):
- `ATLASSIAN_URL`
- `ATLASSIAN_EMAIL`
- `ATLASSIAN_API_TOKEN`
- `JIRA_PROJECT_KEYS`
- `CONFLUENCE_PRD_SPACE`
- `CONFLUENCE_QA_SPACE`
- `CONFLUENCE_RELEASE_SPACE`
