# Claude Agent Templates

This directory contains templates for Claude Agent configuration.

## Structure

```
claude-agent/
├── README.md
├── subagents/       # Subagent definitions
│   └── .gitkeep
└── commands/        # Kiro commands
    └── kiro/
```

## Usage

These templates are used when setting up Claude Agent for a project.
Placeholders are replaced with project-specific values during setup.

## Placeholders

- {{LANG_CODE}}: Language code (ja, en, etc.)
- {{DEV_GUIDELINES}}: Development guidelines
- {{KIRO_DIR}}: Kiro directory (default: .kiro)
- {{AGENT_DIR}}: Agent directory (default: .claude)
- {{PROJECT_ID}}: Project ID
- {{FEATURE_NAME}}: Feature name
