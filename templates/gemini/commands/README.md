# Gemini CLI Extensions for Michi

This directory contains additional context and extensions for Gemini CLI when working with Michi projects.

## Directory Structure

```
.gemini/
├── GEMINI.md           # Main project context (auto-loaded)
└── extensions/         # Additional extensions (optional)
    └── README.md       # This file
```

## Usage

Gemini CLI automatically loads `GEMINI.md` from the project root. Extensions in this directory can be loaded using `/directory add` command:

```
/directory add .gemini/extensions
```

## Available Extensions

Currently, Michi provides core principles in the main `GEMINI.md` file. Additional extensions can be added here for:

- **atlassian-integration** - Confluence/JIRA integration patterns
- **multi-project** - Multi-project management strategies
- **custom-workflows** - Project-specific workflows

## Creating Custom Extensions

To create a custom extension:

1. Create a new `.md` file in this directory
2. Add your context/rules in Markdown format
3. Load it in Gemini CLI: `/directory add .gemini/extensions/<your-file>.md`

## Learn More

- Gemini CLI Documentation: https://geminicli.com/docs
- Michi Documentation: https://github.com/sk8metalme/michi
