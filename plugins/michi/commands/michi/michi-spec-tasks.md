---
name: /michi:michi-spec-tasks
description: Generate implementation tasks in Michi workflow format (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update
argument-hint: <feature-name>
---

# Michi: Spec Tasks Generation

## Base Command Reference
@.claude/commands/kiro/kiro/kiro-spec-tasks.md

## Development Guidelines
{{DEV_GUIDELINES}}

## Michi Extension: Workflow Integration

このコマンドは、Michiワークフロー形式でタスクを生成します。

### Kiro標準との差分

1. **JIRA同期オプションの追加**:
   - タスク生成後、自動的にJIRAチケット作成を提案
   - プロジェクトキーとの紐付け

2. **タスク粒度ガイドライン**:
   - 1タスク = 1-3日の作業量
   - PR サイズ: 500行以内推奨
   - 依存関係の明示

3. **テストタスクの分離**:
   - 実装タスクとテストタスクを明確に分離
   - TDD フローに沿ったタスク順序

### 使用例

```bash
# Michiワークフロー形式でタスク生成
/michi:michi-spec-tasks <feature>

# JIRA同期付き
/michi:michi-spec-tasks <feature> --sync-jira
```

### 生成されるタスク形式

```markdown
## Task 1: Authentication API - User Login

**Type**: Implementation
**Estimated**: 2 days
**Dependencies**: None
**PR Size**: ~300 lines

### Acceptance Criteria
- [ ] POST /api/auth/login endpoint
- [ ] Email/password validation
- [ ] JWT token generation
- [ ] Error handling

### Test Requirements
- [ ] Unit tests (coverage >= 95%)
- [ ] Integration tests for login flow
- [ ] Error case tests

**JIRA**: PROJ-123
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準のネストコマンドを Michi 名前空間に移行し、JIRA同期とタスク粒度ガイドラインを追加します。
