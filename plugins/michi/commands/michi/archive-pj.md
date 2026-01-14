---
name: /michi:archive-pj
description: Archive a completed specification (Michi version with Confluence sync option)
allowed-tools: Bash, Read, Glob, Write, Edit
argument-hint: <feature-name> [--reason <reason>]
---

# Michi: Spec Archive with Confluence Sync

<background_information>
- **Mission**: Archive completed specifications to {{MICHI_DIR}}/specs/.archive/
- **Success Criteria**:
  - Spec directory moved to archive
  - Archive timestamp recorded
  - Original spec accessible in archive
  - Confluence sync option provided (if configured)
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Archive specification **$1** to the archive directory.

## Execution Steps

### Base Implementation

1. **Verify Spec Exists**: Check `{{MICHI_DIR}}/specs/$1/` directory exists
2. **Check Task Completion**: Verify all tasks marked as `[x]` in tasks.md (warn if uncompleted tasks exist)
3. **Create Archive Directory**: Create `{{MICHI_DIR}}/specs/.archive/` if it doesn't exist
4. **Generate Timestamp**: Get current timestamp in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
5. **Move Spec**: Move `{{MICHI_DIR}}/specs/$1/` → `{{MICHI_DIR}}/specs/.archive/$1-{timestamp}/`
6. **Update Metadata**: Record archive timestamp in moved spec.json

### Michi Extensions

7. **Confluence Sync Option**:
   - Check environment variables: `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`
   - If configured: Offer to sync archive status to Confluence
   - Display Confluence sync command suggestion

8. **Next Steps Guidance**:
   - Suggest release note confirmation
   - Guide to next feature development
   - Overall progress check command

## Important Constraints
- **Task Completion Check**: Warn user if spec has uncompleted tasks (`- [ ]` in tasks.md)
- **Preserve All Files**: Move entire directory including all artifacts (spec.json, requirements.md, design.md, tasks.md, research.md, etc.)
- **Conflict Handling**: If archived spec with same name exists, append numeric suffix to avoid conflicts
- **No Deletion**: Archive is move operation, not delete - all data preserved
</instructions>

## Tool Guidance
- Use **Glob** to check if spec directory exists
- Use **Read** to check tasks.md for uncompleted tasks
- Use **Bash** to create archive directory and move spec directory
- Use **Write** or **Edit** to update spec.json with archive metadata
- Use **Bash** to check environment variables for Confluence integration

## Output Description

Provide output in the language specified in spec.json with:

### Base Output

1. **Archive Status**: Confirm spec successfully archived
2. **Archive Location**: Show full path to archived spec
3. **Task Completion Status**: Report if all tasks were completed
4. **Access Instructions**: How to view or restore archived spec

### Michi Extended Output

After base output, add:

```text
✅ Archived specification: <feature>
📁 Archive path: .michi/specs/.archive/<feature>-{timestamp}/
📝 Reason: <reason>

📚 Optional: Sync archive status to Confluence
   /michi:sync-confluence <feature> --status archived

📝 Next Steps:
1. **リリースノート確認**: docs/release-notes/ にリリースノートが保存されているか確認
2. **次の機能開発**: /michi:launch-pj "<description>" で新しいspec作成
3. **全体進捗確認**: /michi:show-status --all でアーカイブ含む全spec進捗確認
```

**Format Requirements**:
- Use Markdown headings for clarity
- Include full paths in code blocks
- Keep summary concise (under 200 words)

## Safety & Fallback

### Error Scenarios

**Spec Not Found**:
- **Stop Execution**: Cannot archive non-existent spec
- **User Message**: "No spec found at `{{MICHI_DIR}}/specs/$1/`"
- **Suggested Action**: "Check available specs with `ls {{MICHI_DIR}}/specs/`"

**Uncompleted Tasks**:
- **Warning**: "Spec has uncompleted tasks. Archive anyway?"
- **User Action**: Ask user to confirm or complete remaining tasks
- **Proceed**: Only after user confirmation

**Archive Directory Conflict**:
- **Auto-resolve**: Append timestamp suffix to ensure unique archive name
- **User Message**: "Archive name exists, using: $1-{timestamp}-2"

**Archive Directory Creation Failure**:
- **Stop Execution**: Report error with specific path
- **Suggested Action**: "Check directory permissions and disk space"

### Viewing Archived Specs

To view archived specifications:
```bash
ls {{MICHI_DIR}}/specs/.archive/
cat {{MICHI_DIR}}/specs/.archive/{feature-name}-{timestamp}/spec.json
```

### Restoring Archived Specs

To restore from archive:
```bash
mv {{MICHI_DIR}}/specs/.archive/{feature-name}-{timestamp} {{MICHI_DIR}}/specs/{feature-name}
```

**Note**: Archived specs are read-only by convention. If you need to continue work on an archived spec, restore it first.

---

**Michi Integration**: This command extends base spec archive with Confluence sync option and post-archive next steps guidance for seamless workflow continuation.

think
