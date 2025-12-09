---
name: /michi:project-switch
description: Switch between projects (Michi-specific feature)
---

# Project Switch Command

> **Michi 固有機能**: このコマンドは Michi 独自の機能です。cc-sdd 標準には含まれません。
>
> マルチプロジェクト環境で、異なるプロジェクト間を切り替えるための機能です。

**Important**: Generate output in language specified in {{KIRO_DIR}}/project.json.

## Usage

```
/michi:project-switch <project_id>
```

**Parameters**:
- `project_id`: Project ID (e.g., customer-a-service-1, michi)

**Examples**:
```
/michi:project-switch michi
/michi:project-switch customer-a-service-1
```

## Execution Steps

1. Identify GitHub repository corresponding to project ID
2. Clone locally (if not cloned) or checkout
3. Load and display {{KIRO_DIR}}/project.json
4. Display corresponding Confluence project page URL

## Language Handling

- Read language from {{KIRO_DIR}}/project.json
- Generate all output in the specified language
- Default to English if language field is missing
