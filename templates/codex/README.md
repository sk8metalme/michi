# Codex CLI + Michi Integration Guide

## Overview

Codex CLI uses a centralized `~/.codex/config.toml` configuration file, which differs from other AI assistants that support project-specific rule directories.

Due to this architectural difference, **Michi's rule-based workflow has limited compatibility with Codex CLI**.

## Current Limitations

- ❌ **No project-specific rule directories** - Codex uses global config.toml
- ❌ **No Markdown-based rules** - Codex uses TOML for configuration only
- ⚠️ **Limited Michi integration** - This template provides documentation only

## Alternative Workflow

### Option 1: Manual Configuration

Edit `~/.codex/config.toml` to include project-specific settings:

```toml
# Example: Add project context as comments
# Project: {{PROJECT_ID}}
# JIRA Key: (from .kiro/project.json)

[model]
default = "your-preferred-model"

[approval]
# Customize approval policies
```

### Option 2: Documentation Reference

Use this directory (`.codex/docs/`) for Michi-related documentation:

```
.codex/
└── docs/
    ├── README.md                  # This file
    ├── project-info.md            # Project metadata reference
    └── workflow.md                # Michi workflow notes
```

## Project Metadata

Reference `.kiro/project.json` for project information:

- **Project ID**: {{PROJECT_ID}}
- **Language**: {{LANG_CODE}}
- **JIRA Key**: (from project.json)
- **Confluence Labels**: (from project.json)

## Recommendations

For better Michi integration, consider using:

- **Gemini CLI** - Supports `.gemini/GEMINI.md` project context
- **Cline** - Supports `.clinerules/rules/` project-specific rules
- **Claude Code** - Supports `.claude/rules/` project-specific rules
- **Cursor** - Supports `.cursor/rules/` project-specific rules

## Learn More

- Codex CLI: https://developers.openai.com/codex/cli
- Michi Documentation: https://github.com/sk8metalme/michi
