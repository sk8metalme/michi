---
name: /michi:create-tasks
description: Generate implementation tasks with JIRA sync option (Michi version)
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, Bash
argument-hint: <feature-name> [-y] [--sequential]
---

# Michi: Spec Tasks with JIRA Sync Option

<background_information>
- **Mission**: Generate detailed, actionable implementation tasks that translate technical design into executable work items
- **Success Criteria**:
  - All requirements mapped to specific tasks
  - Tasks properly sized (1-3 hours each)
  - Clear task progression with proper hierarchy
  - Natural language descriptions focused on capabilities
  - Quality infrastructure validated for project language
  - JIRA sync option available when configured
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Generate implementation tasks for feature **$1** based on approved requirements and design.

## Execution Steps

### Base Implementation

#### Step 1: Load Context

**Read all necessary context**:
- `{{MICHI_DIR}}/specs/$1/spec.json`, `requirements.md`, `design.md`
- `{{MICHI_DIR}}/specs/$1/tasks.md` (if exists, for merge mode)
- **Entire `{{REPO_ROOT_DIR}}/docs/master/` directory** for complete project memory

**Validate approvals**:
- If `-y` flag provided ($2 == "-y"): Auto-approve requirements and design in spec.json
- Otherwise: Verify both approved (stop if not, see Safety & Fallback)
- Determine sequential mode based on presence of `--sequential`

#### Step 2: Generate Implementation Tasks

**Load generation rules and template**:
- Read `{{MICHI_DIR}}/settings/rules/tasks-generation.md` for principles
- If `sequential` is **false**: Read `{{MICHI_DIR}}/settings/rules/tasks-parallel-analysis.md` for parallel judgement criteria
- Read `{{MICHI_DIR}}/settings/templates/specs/tasks.md` for format (supports `(P)` markers)

**Generate task list following all rules**:
- Use language specified in spec.json
- Map all requirements to tasks
- When documenting requirement coverage, list numeric requirement IDs only (comma-separated) without descriptive suffixes, parentheses, translations, or free-form labels
- Ensure all design components included
- Verify task progression is logical and incremental
- Collapse single-subtask structures by promoting them to major tasks and avoid duplicating details on container-only major tasks (use template patterns accordingly)
- Apply `(P)` markers to tasks that satisfy parallel criteria (omit markers in sequential mode)
- Mark optional test coverage subtasks with `- [ ]*` only when they strictly cover acceptance criteria already satisfied by core implementation and can be deferred post-MVP
- If existing tasks.md found, merge with new content

#### Step 3: Finalize

**Write and update**:
- Create/update `{{MICHI_DIR}}/specs/$1/tasks.md`
- Update spec.json metadata:
  - Set `phase: "tasks-generated"`
  - Set `approvals.tasks.generated: true, approved: false`
  - Set `approvals.requirements.approved: true`
  - Set `approvals.design.approved: true`
  - Update `updated_at` timestamp

### Michi Extensions

#### Step 4: Quality Infrastructure Check

> **優先度**: このMichi Extensionの指示は、base commandの品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

タスク生成前に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

**Step 4.1: CI設定の確認とプラットフォーム選択**

**既存CI設定をチェック**:
- `.github/workflows/` が存在する場合 → GitHub Actions採用
- `screwdriver.yaml` が存在する場合 → Screwdriver採用
- 両方なし → ユーザーに選択を促す

**CI未設定の場合のプラットフォーム選択**:

```text
CIプラットフォームを選択してください:
A) GitHub Actions（推奨）
B) Screwdriver
C) 後で設定する
```

**Step 4.2: 言語検出とユーザー確認**

**プロジェクトルートのファイルをチェック**:
- `package.json` あり → Node.js
- `pom.xml` または `build.gradle*` あり → Java
- `pyproject.toml` または `requirements.txt` あり → Python
- `composer.json` あり → PHP

複数言語が検出された場合や確認が必要な場合：
```text
検出された言語: {{LANG}}。正しいですか？ (Y/n)
```

**Step 4.3: 言語別チェック項目**

**Node.js / TypeScript**:
- husky + pre-commit hook (必須)
- lint-staged (必須)
- TypeScript strict mode (必須)
- tsarch (推奨)
- CI (必須)
- DevContainer (任意)

**Java**:
- Checkstyle/PMD (必須)
- NullAway + Error Prone (必須)
- ArchUnit (推奨)
- Spotless (任意)
- CI (必須)
- DevContainer (任意)

**Python**:
- ruff/black/flake8 (必須)
- mypy strict (推奨)
- import-linter (推奨)
- pre-commit framework (任意)
- CI (必須)
- DevContainer (任意)

**PHP**:
- PHPStan/php-cs-fixer (必須)
- deptrac (推奨)
- GrumPHP/Captain Hook (任意)
- CI (必須)
- DevContainer (任意)

**Step 4.4: 結果表示とタスク自動追加**

1. **警告メッセージを表示**:
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **tasks.md の先頭に言語別の品質インフラセットアップタスクを自動追加**:
   - 未設定の必須項目・推奨項目のセットアップ手順を含む
   - 言語別のコマンド・設定例を提供

3. **処理は継続**（タスク生成を実行）

#### Step 5: JIRA Sync Prompt

タスク生成完了後、JIRA同期オプションを提示します。

**環境変数チェック**:
```bash
# JIRA連携の環境変数をチェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    JIRA_CONFIGURED=true
else
    JIRA_CONFIGURED=false
fi
```

**JIRA連携が設定されている場合の表示**:

```text
============================================
 タスク生成完了 - JIRA同期オプション
============================================

次のアクション:
A) 実装に進む（推奨）
   → `/michi:dev {{FEATURE_NAME}}` を実行

B) 何もせずにこのまま終了する

選択 (A/B): _

ℹ️  ヒント: JIRA連携が必要な場合は、環境変数（ATLASSIAN_*）を設定し、
   JIRA APIを直接使用してタスクを同期してください。
```

**JIRA連携が未設定の場合の表示**:

```text
============================================
 タスク生成完了
============================================

次のステップ:
→ `/michi:dev {{FEATURE_NAME}}` で実装を開始

---
ℹ️ ヒント: JIRA連携を使用すると、タスクを自動的にJIRAに同期できます。

設定方法: 以下の環境変数を .env に追加してください:
   - ATLASSIAN_URL=https://your-domain.atlassian.net
   - ATLASSIAN_EMAIL=your-email@company.com
   - ATLASSIAN_API_TOKEN=your-api-token

詳細はドキュメントを参照: docs/guides/atlassian-integration.md
```

#### Step 6: Task Diff Size Guidelines

タスク分割時に、各サブタスクの git diff サイズを考慮してください。

**推奨サイズ**:
- 目標: 各サブタスクで 200-400 行の diff
- 最大: 500 行まで（超過時は分割を検討）
- 警告: 400行超過時は分割を推奨

**除外対象ファイル（行数カウント対象外）**:
- ロックファイル: package-lock.json, yarn.lock, pnpm-lock.yaml, composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock, Cargo.lock, go.sum
- 自動生成ファイル: *.min.js, *.min.css, *.map, dist/*, build/*, coverage/*, .next/*, *.d.ts, *.generated.ts, __snapshots__/*

**分割戦略**:
1. 水平分割（レイヤー別）: model/repository → service/logic → controller/handler
2. 垂直分割（機能スライス別）: core機能 → validation → error handling → edge cases
3. フェーズ分割（段階別）: 基本実装 → テスト追加 → 最適化

## Critical Constraints
- **Follow rules strictly**: All principles in tasks-generation.md are mandatory
- **Natural Language**: Describe what to do, not code structure details
- **Complete Coverage**: ALL requirements must map to tasks
- **Maximum 2 Levels**: Major tasks and sub-tasks only (no deeper nesting)
- **Sequential Numbering**: Major tasks increment (1, 2, 3...), never repeat
- **Task Integration**: Every task must connect to the system (no orphaned work)
</instructions>

## Tool Guidance
- **Read first**: Load all context, rules, and templates before generation
- **Write last**: Generate tasks.md only after complete analysis and verification
- Use **Bash** to check environment variables and CI configuration

## Output Description

Provide brief summary in the language specified in spec.json:

### Base Output

1. **Status**: Confirm tasks generated at `{{MICHI_DIR}}/specs/$1/tasks.md`
2. **Task Summary**:
   - Total: X major tasks, Y sub-tasks
   - All Z requirements covered
   - Average task size: 1-3 hours per sub-task
3. **Quality Validation**:
   - ✅ All requirements mapped to tasks
   - ✅ Task dependencies verified
   - ✅ Testing tasks included
4. **Next Action**: Review tasks and proceed when ready

### Michi Extended Output

After base output, add:

1. **Quality Infrastructure Check Results**: Language-specific infrastructure status
2. **JIRA Sync Prompt**: Display appropriate next action based on JIRA configuration
3. **Task Diff Size Guidance**: Reminder of 500-line diff size recommendation

**Format**: Concise (under 200 words)

## Safety & Fallback

### Error Scenarios

**Requirements or Design Not Approved**:
- **Stop Execution**: Cannot proceed without approved requirements and design
- **User Message**: "Requirements and design must be approved before task generation"
- **Suggested Action**: "Run `/michi:create-tasks $1 -y` to auto-approve both and proceed"

**Missing Requirements or Design**:
- **Stop Execution**: Both documents must exist
- **User Message**: "Missing requirements.md or design.md at `{{MICHI_DIR}}/specs/$1/`"
- **Suggested Action**: "Complete requirements and design phases first"

**Incomplete Requirements Coverage**:
- **Warning**: "Not all requirements mapped to tasks. Review coverage."
- **User Action Required**: Confirm intentional gaps or regenerate tasks

**Template/Rules Missing**:
- **User Message**: "Template or rules files missing in `{{MICHI_DIR}}/settings/`"
- **Fallback**: Use inline basic structure with warning
- **Suggested Action**: "Check repository setup or restore template files"

**Missing Numeric Requirement IDs**:
  - **Stop Execution**: All requirements in requirements.md MUST have numeric IDs. If any requirement lacks a numeric ID, stop and request that requirements.md be fixed before generating tasks.

### Next Phase: Implementation

**Before Starting Implementation**:
- **IMPORTANT**: Clear conversation history and free up context before running `/michi:dev`
- This applies when starting first task OR switching between tasks
- Fresh context ensures clean state and proper task focus

**If Tasks Approved**:
- Execute specific task: `/michi:dev $1 1.1` (recommended: clear context between each task)
- Execute multiple tasks: `/michi:dev $1 1.1,1.2` (use cautiously, clear context between tasks)
- Without arguments: `/michi:dev $1` (executes all pending tasks - NOT recommended due to context bloat)

**If Modifications Needed**:
- Provide feedback and re-run `/michi:create-tasks $1`
- Existing tasks used as reference (merge mode)

**Note**: The implementation phase will guide you through executing tasks with appropriate context and validation.

---

**Michi Integration**: This command extends base task generation with quality infrastructure validation (language-specific checks), JIRA sync option, and task diff size guidelines for optimal task splitting.
