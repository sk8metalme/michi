---
name: /michi:switch-pj
description: Switch between projects (Michi-specific feature)
---

# Project Switch Command

> **Michi 固有機能**: このコマンドは Michi 独自の機能です。base コマンドには含まれません。
>
> マルチプロジェクト環境で、異なるプロジェクト間を切り替えるための機能です。

## Development Guidelines

{{DEV_GUIDELINES}}

## Usage

```
/michi:switch-pj <project_id>
```

**Parameters**:
- `project_id`: Project ID (e.g., customer-a-service-1, michi)

**Examples**:
```
/michi:switch-pj michi
/michi:switch-pj customer-a-service-1
```

## Execution Steps

1. Identify GitHub repository corresponding to project ID
2. Clone locally (if not cloned) or checkout
3. Load and display {{SPEC_DIR}}/project.json
4. Display corresponding Confluence project page URL

## Language Handling

- Read language from {{SPEC_DIR}}/project.json
- Generate all output in the specified language
- Default to English if language field is missing
