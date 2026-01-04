---
name: /michi:steering
description: Manage .michi/steering/ as persistent project knowledge (Michi version with JIRA integration check)
allowed-tools: Bash, Read, Write, Glob, Grep, Edit, MultiEdit, Update
---

# Michi: Steering with Integration Check

## Base Command Reference
@.claude/commands/kiro/steering.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Integration Setup Validation

Steering document作成時、プロジェクトの連携設定を確認:

### 事前確認

Steering document作成前に、以下をチェック:

1. **JIRA/Confluence連携設定**:
   ```bash
   # 環境変数チェック
   - ATLASSIAN_URL
   - ATLASSIAN_EMAIL
   - ATLASSIAN_API_TOKEN
   ```

2. **.michi/project.json設定**:
   ```json
   {
     "jiraProjectKeys": ["PROJ"],
     "confluenceSpaces": {
       "prd": "PRD",
       "qa": "QA"
     }
   }
   ```

### Steering作成後の推奨アクション

```bash
✅ Steering document created

📚 Next Steps:
1. **Project設定確認**:
   /michi:config:check-security

2. **JIRA連携テスト** (設定済みの場合):
   michi jira:test-connection

3. **最初のSpec作成**:
   /michi:spec-init "feature description"
```

### Integration Setup Guide

連携が未設定の場合、セットアップガイドを提示:

```text
⚠️  JIRA/Confluence integration not configured

To enable integration:
1. Configure environment variables:
   /michi:config:init --global-env

2. Update project.json:
   /michi:config:init --project

See: docs/guides/atlassian-integration.md
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:steering` を拡張し、JIRA/Confluence連携設定の確認と、セットアップガイダンスを追加します。
