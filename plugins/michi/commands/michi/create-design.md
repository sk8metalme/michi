---
name: /michi:create-design
description: Create comprehensive technical design for a specification (Michi version with test planning flow)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name> [-y]
---

# Michi: Spec Design with Test Planning Flow

<background_information>
- **Mission**: Generate comprehensive technical design document that translates requirements (WHAT) into architectural design (HOW)
- **Success Criteria**:
  - All requirements mapped to technical components with clear interfaces
  - Appropriate architecture discovery and research completed
  - Design aligns with master docs context and existing patterns
  - Visual diagrams included for complex architectures
  - Quality infrastructure validated for the project language
</background_information>

## Development Guidelines

{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Generate technical design document for feature **$1** based on approved requirements.

## Execution Steps

### Base Implementation

#### Step 1: Load Context

**Read all necessary context**:
- `{{MICHI_DIR}}/specs/$1/spec.json`, `requirements.md`, `design.md` (if exists)
- **Entire `{{REPO_ROOT_DIR}}/docs/master/` directory** for complete project memory
- `{{MICHI_DIR}}/settings/templates/specs/design.md` for document structure
- `{{MICHI_DIR}}/settings/rules/design-principles.md` for design principles
- `{{MICHI_DIR}}/settings/templates/specs/research.md` for discovery log structure

**Validate requirements approval**:
- If `-y` flag provided ($2 == "-y"): Auto-approve requirements in spec.json
- Otherwise: Verify approval status (stop if unapproved, see Safety & Fallback)

#### Step 2: Discovery & Analysis

**Critical: This phase ensures design is based on complete, accurate information.**

1. **Classify Feature Type**:
   - **New Feature** (greenfield) → Full discovery required
   - **Extension** (existing system) → Integration-focused discovery
   - **Simple Addition** (CRUD/UI) → Minimal or no discovery
   - **Complex Integration** → Comprehensive analysis required

2. **Execute Appropriate Discovery Process**:

   **For Complex/New Features**:
   - Read and execute `{{MICHI_DIR}}/settings/rules/design-discovery-full.md`
   - Conduct thorough research using WebSearch/WebFetch:
     - Latest architectural patterns and best practices
     - External dependency verification (APIs, libraries, versions, compatibility)
     - Official documentation, migration guides, known issues
     - Performance benchmarks and security considerations

   **For Extensions**:
   - Read and execute `{{MICHI_DIR}}/settings/rules/design-discovery-light.md`
   - Focus on integration points, existing patterns, compatibility
   - Use Grep to analyze existing codebase patterns

   **For Simple Additions**:
   - Skip formal discovery, quick pattern check only

3. **Retain Discovery Findings for Step 3**:
- External API contracts and constraints
- Technology decisions with rationale
- Existing patterns to follow or extend
- Integration points and dependencies
- Identified risks and mitigation strategies
- Potential architecture patterns and boundary options (note details in `research.md`)
- Parallelization considerations for future tasks (capture dependencies in `research.md`)

4. **Persist Findings to Research Log**:
- Create or update `{{MICHI_DIR}}/specs/$1/research.md` using the shared template
- Summarize discovery scope and key findings (Summary section)
- Record investigations in Research Log topics with sources and implications
- Document architecture pattern evaluation, design decisions, and risks using the template sections
- Use the language specified in spec.json when writing or updating `research.md`

#### Step 3: Generate Design Document

1. **Load Design Template and Rules**:
- Read `{{MICHI_DIR}}/settings/templates/specs/design.md` for structure
- Read `{{MICHI_DIR}}/settings/rules/design-principles.md` for principles

2. **Generate Design Document**:
- **Follow specs/design.md template structure and generation instructions strictly**
- **Integrate all discovery findings**: Use researched information (APIs, patterns, technologies) throughout component definitions, architecture decisions, and integration points
- If existing design.md found in Step 1, use it as reference context (merge mode)
- Apply design rules: Type Safety, Visual Communication, Formal Tone
- Use language specified in spec.json
- Ensure sections reflect updated headings ("Architecture Pattern & Boundary Map", "Technology Stack & Alignment", "Components & Interface Contracts") and reference supporting details from `research.md`

3. **Update Metadata** in spec.json:
- Set `phase: "design-generated"`
- Set `approvals.design.generated: true, approved: false`
- Set `approvals.requirements.approved: true`
- Update `updated_at` timestamp

### Michi Extensions

#### Step 4: Quality Infrastructure Check

> **優先度**: このMichi Extensionの指示は、base commandの品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

設計作成時に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

**Step 4.1: CI設定の確認とプラットフォーム選択**

**既存CI設定をチェック**:
- `.github/workflows/` が存在する場合 → GitHub Actions採用
- `screwdriver.yaml` が存在する場合 → Screwdriver採用
- 両方なし → Step 4.1.5でユーザーに選択を促す

**Step 4.1.5: CI未設定の場合のプラットフォーム選択**

CIが未設定の場合、以下の選択肢を提示：

```text
CIプラットフォームを選択してください:
A) GitHub Actions（推奨）
B) Screwdriver
C) 後で設定する
```

**Step 4.2: 言語検出とユーザー確認**

**4.2.1. プロジェクトルートのファイルをチェック**:
- `package.json` あり → Node.js
- `pom.xml` または `build.gradle*` あり → Java
- `pyproject.toml` または `requirements.txt` あり → Python
- `composer.json` あり → PHP

**4.2.2. 検出結果をユーザーに確認（オプション）**:

複数言語が検出された場合や確認が必要な場合：
```text
検出された言語: {{LANG}}。正しいですか？ (Y/n)
```

- 複数言語検出時は主要言語を選択させる
- 誤検出の場合は手動で指定可能

**Step 4.3: 言語別チェック項目**

**Node.js / TypeScript**:

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| husky | `.husky/` ディレクトリ | ✅ |
| pre-commit hook | `.husky/pre-commit` ファイル | ✅ |
| lint-staged | `package.json` の lint-staged キーまたは `.lintstagedrc*` | ✅ |
| TypeScript strict | `tsconfig.json` の strict: true | ✅ |
| tsarch | `package.json` の tsarch | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

**Java**:

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `.pre-commit-config.yaml` または Spotless in `pom.xml`/`build.gradle*` | ℹ️（任意） |
| Checkstyle/PMD | `checkstyle.xml`, `pmd.xml`, または `config/checkstyle/` | ✅ |
| NullAway | `pom.xml` または `build.gradle*` に nullaway/error_prone | ⚠️（必須） |
| ArchUnit | `pom.xml` または `build.gradle*` に archunit | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

**Python**:

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `.pre-commit-config.yaml` | ℹ️（任意） |
| lint/format | `pyproject.toml` に ruff/black/flake8、または `setup.cfg`, `.flake8` | ✅ |
| mypy strict | `pyproject.toml` に mypy、または `mypy.ini`, `.mypy.ini` | ℹ️（推奨） |
| import-linter | `pyproject.toml` に importlinter、または `.importlinter` | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

**PHP**:

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `grumphp.yml`, `captainhook.json`, または `.pre-commit-config.yaml` | ℹ️（任意） |
| PHPStan/php-cs-fixer | `phpstan.neon`, `phpcs.xml`, または `composer.json` | ✅ |
| deptrac | `deptrac.yaml` または `composer.json` に deptrac | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

**Step 4.4: 結果表示フォーマット**

**Node.js の例**:
```text
📋 Quality Infrastructure Check (Node.js detected)
├─ ✅ husky: Configured
├─ ✅ lint-staged: Configured
├─ ✅ TypeScript strict: Configured
├─ ℹ️ tsarch: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

**Java の例**:
```text
📋 Quality Infrastructure Check (Java detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ Checkstyle: Configured
├─ ⚠️ NullAway: Not configured (REQUIRED for null safety)
├─ ℹ️ ArchUnit: Not configured (optional - recommended)
├─ ✅ CI: Screwdriver configured
└─ ℹ️ DevContainer: Not configured (optional)
```

**Python の例**:
```text
📋 Quality Infrastructure Check (Python detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ lint/format: Configured (ruff in pyproject.toml)
├─ ℹ️ mypy strict: Not configured (recommended)
├─ ℹ️ import-linter: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

**PHP の例**:
```text
📋 Quality Infrastructure Check (PHP detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ PHPStan: Configured (level=max)
├─ ℹ️ deptrac: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

**Step 4.5: 不足時の動作**

1. **警告メッセージを表示**:
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **設計書の「前提条件」セクションに品質インフラ要件を追記**:
   - 言語別の必須項目と推奨項目をリスト化

3. **処理は継続**（中断しない）

#### Step 5: Next Phase Guidance

設計ドキュメント生成完了後、以下のフローを案内:

**Phase 4.1 - テストタイプの選択**:

設計が完了したら、タスク生成前に **Phase 4: テスト計画** を実施してください。

**1. Phase 4.1: テストタイプの選択**

設計書の Testing Strategy セクションを基に、必要なテストタイプを決定します。

**実行方法**:

**推奨: 統合AIコマンド**
```bash
/michi:plan-tests {feature-name}
```
Phase 4.1とPhase 4.2を統合的に実行します。AIが対話的にテストタイプを選択し、テスト仕様書を作成します。

**選択可能なテストタイプ**:
- 単体テスト (Unit Test)
- 統合テスト (Integration Test)
- E2Eテスト (End-to-End Test)
- パフォーマンステスト (Performance Test)
- セキュリティテスト (Security Test)

**参照ドキュメント**: `docs/user-guide/testing/test-planning-flow.md`

**2. Phase 4.2: テスト仕様書の作成**

Phase 4.1で選択したテストタイプに基づいて、テスト仕様書を作成します。

**実行方法**:

`/michi:plan-tests` を使用した場合、Phase 4.2も自動的に実行されます。

**テンプレート**:
- 単体テスト: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
- 統合テスト: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
- E2Eテスト: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
- パフォーマンステスト: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
- セキュリティテスト: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

**出力先**: `.michi/specs/{feature}/test-specs/`

**After Test Planning: Task Generation**

Phase 4 完了後、以下のステップに進んでください:

**推奨フロー**:
1. `/michi:review-design {feature}` で設計レビューを実施（任意）
2. `/michi:create-tasks {feature}` でタスク生成

**クイックフロー**:
- `/michi:create-tasks {feature} -y` で自動承認してタスク生成

**重要**: テスト計画（Phase 4）を完了してからタスク生成することで、実装タスクにテスト実装が適切に含まれます。

## Critical Constraints
 - **Type Safety**:
   - Enforce strong typing aligned with the project's technology stack.
   - For statically typed languages, define explicit types/interfaces and avoid unsafe casts.
   - For TypeScript, never use `any`; prefer precise types and generics.
   - For dynamically typed languages, provide type hints/annotations where available (e.g., Python type hints) and validate inputs at boundaries.
   - Document public interfaces and contracts clearly to ensure cross-component type safety.
- **Latest Information**: Use WebSearch/WebFetch for external dependencies and best practices
- **Master Docs Alignment**: Respect existing architecture patterns from master docs context
- **Template Adherence**: Follow specs/design.md template structure and generation instructions strictly
- **Design Focus**: Architecture and interfaces ONLY, no implementation code
- **Requirements Traceability IDs**: Use numeric requirement IDs only (e.g. "1.1", "1.2", "3.1", "3.3") exactly as defined in requirements.md. Do not invent new IDs or use alphabetic labels.
</instructions>

## Tool Guidance
- **Read first**: Load all context before taking action (specs, master docs, templates, rules)
- **Research when uncertain**: Use WebSearch/WebFetch for external dependencies, APIs, and latest best practices
- **Analyze existing code**: Use Grep to find patterns and integration points in codebase
- **Write last**: Generate design.md only after all research and analysis complete

## Output Description

**Command execution output** (separate from design.md content):

Provide brief summary in the language specified in spec.json:

### Base Output

1. **Status**: Confirm design document generated at `{{MICHI_DIR}}/specs/$1/design.md`
2. **Discovery Type**: Which discovery process was executed (full/light/minimal)
3. **Key Findings**: 2-3 critical insights from `research.md` that shaped the design
4. **Next Action**: Approval workflow guidance (see Safety & Fallback)
5. **Research Log**: Confirm `research.md` updated with latest decisions

### Michi Extended Output

After base output, display:

1. **Quality Infrastructure Check Results**: Language-specific infrastructure status
2. **Test Planning Flow Guidance**: Next phase instructions with `/michi:plan-tests` command

**Format**: Concise Markdown (under 200 words) - this is the command output, NOT the design document itself

**Note**: The actual design document follows `{{MICHI_DIR}}/settings/templates/specs/design.md` structure.

## Safety & Fallback

### Error Scenarios

**Requirements Not Approved**:
- **Stop Execution**: Cannot proceed without approved requirements
- **User Message**: "Requirements not yet approved. Approval required before design generation."
- **Suggested Action**: "Run `/michi:create-design $1 -y` to auto-approve requirements and proceed"

**Missing Requirements**:
- **Stop Execution**: Requirements document must exist
- **User Message**: "No requirements.md found at `{{MICHI_DIR}}/specs/$1/requirements.md`"
- **Suggested Action**: "Run `/michi:create-requirements $1` to generate requirements first"

**Template Missing**:
- **User Message**: "Template file missing at `{{MICHI_DIR}}/settings/templates/specs/design.md`"
- **Suggested Action**: "Check repository setup or restore template file"
- **Fallback**: Use inline basic structure with warning

**Master Docs Context Missing**:
- **Warning**: "Master docs directory empty or missing - design may not align with project standards"
- **Proceed**: Continue with generation but note limitation in output

**Discovery Complexity Unclear**:
- **Default**: Use full discovery process (`{{MICHI_DIR}}/settings/rules/design-discovery-full.md`)
- **Rationale**: Better to over-research than miss critical context

**Invalid Requirement IDs**:
  - **Stop Execution**: If requirements.md is missing numeric IDs or uses non-numeric headings (for example, "Requirement A"), stop and instruct the user to fix requirements.md before continuing.

### Next Phase: Task Generation

**If Design Approved**:
- Review generated design at `{{MICHI_DIR}}/specs/$1/design.md`
- **Optional**: Run `/michi:review-design $1` for interactive quality review
- **Required**: Run `/michi:plan-tests $1` for Phase 4 (Test Planning)
- Then `/michi:create-tasks $1 -y` to generate implementation tasks

**If Modifications Needed**:
- Provide feedback and re-run `/michi:create-design $1`
- Existing design used as reference (merge mode)

**Note**: Design approval is mandatory before proceeding to task generation.

---

**Michi Integration**: This command extends base spec design with quality infrastructure validation (language-specific checks), test planning flow guidance (Phase 4), and seamless navigation to Michi workflow.

think hard
