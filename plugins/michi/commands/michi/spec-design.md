---
name: /michi:spec-design
description: Create comprehensive technical design for a specification (Michi version with test planning flow)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name> [-y]
---

# Michi: Spec Design with Test Planning Flow

## Base Command Reference
@.claude/commands/kiro/spec-design.md

## Development Guidelines

{{DEV_GUIDELINES}}

## Michi Extension: Quality Infrastructure Check

> **優先度**: このMichi Extensionの指示は、base command（kiro版）の品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

設計作成時に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

### Step 1: CI設定の確認とプラットフォーム選択

#### 既存CI設定をチェック
- `.github/workflows/` が存在する場合 → GitHub Actions採用
- `screwdriver.yaml` が存在する場合 → Screwdriver採用
- 両方なし → Step 1.5でユーザーに選択を促す

#### Step 1.5: CI未設定の場合のプラットフォーム選択

CIが未設定の場合、以下の選択肢を提示：

```
CIプラットフォームを選択してください:
A) GitHub Actions（推奨）
B) Screwdriver
C) 後で設定する
```

### Step 2: 言語検出とユーザー確認

#### 2-1. プロジェクトルートのファイルをチェック

- `package.json` あり → Node.js
- `pom.xml` または `build.gradle*` あり → Java
- `pyproject.toml` または `requirements.txt` あり → Python
- `composer.json` あり → PHP

#### 2-2. 検出結果をユーザーに確認（オプション）

複数言語が検出された場合や確認が必要な場合：
```
検出された言語: {{LANG}}。正しいですか？ (Y/n)
```

- 複数言語検出時は主要言語を選択させる
- 誤検出の場合は手動で指定可能

### Step 3: 言語別チェック項目

#### Node.js / TypeScript

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| husky | `.husky/` ディレクトリ | ✅ |
| pre-commit hook | `.husky/pre-commit` ファイル | ✅ |
| lint-staged | `package.json` の lint-staged キーまたは `.lintstagedrc*` | ✅ |
| TypeScript strict | `tsconfig.json` の strict: true | ✅ |
| ts-arch-kit | `package.json` の ts-arch-kit | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

#### Java

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `.pre-commit-config.yaml` または Spotless in `pom.xml`/`build.gradle*` | ℹ️（任意） |
| Checkstyle/PMD | `checkstyle.xml`, `pmd.xml`, または `config/checkstyle/` | ✅ |
| NullAway | `pom.xml` または `build.gradle*` に nullaway/error_prone | ⚠️（必須） |
| ArchUnit | `pom.xml` または `build.gradle*` に archunit | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

#### Python

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `.pre-commit-config.yaml` | ℹ️（任意） |
| lint/format | `pyproject.toml` に ruff/black/flake8、または `setup.cfg`, `.flake8` | ✅ |
| mypy strict | `pyproject.toml` に mypy、または `mypy.ini`, `.mypy.ini` | ℹ️（推奨） |
| import-linter | `pyproject.toml` に importlinter、または `.importlinter` | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

#### PHP

| 項目 | チェック方法 | 必須 |
|------|------------|------|
| pre-commit | `grumphp.yml`, `captainhook.json`, または `.pre-commit-config.yaml` | ℹ️（任意） |
| PHPStan/php-cs-fixer | `phpstan.neon`, `phpcs.xml`, または `composer.json` | ✅ |
| deptrac | `deptrac.yaml` または `composer.json` に deptrac | ℹ️（推奨） |
| CI | `.github/workflows/` または `screwdriver.yaml` | ✅ |
| DevContainer | `.devcontainer/` | ℹ️（任意） |

### Step 4: 結果表示フォーマット

#### Node.js の例
```text
📋 Quality Infrastructure Check (Node.js detected)
├─ ✅ husky: Configured
├─ ✅ lint-staged: Configured
├─ ✅ TypeScript strict: Configured
├─ ℹ️ ts-arch-kit: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

#### Java の例
```text
📋 Quality Infrastructure Check (Java detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ Checkstyle: Configured
├─ ⚠️ NullAway: Not configured (REQUIRED for null safety)
├─ ℹ️ ArchUnit: Not configured (optional - recommended)
├─ ✅ CI: Screwdriver configured
└─ ℹ️ DevContainer: Not configured (optional)
```

#### Python の例
```text
📋 Quality Infrastructure Check (Python detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ lint/format: Configured (ruff in pyproject.toml)
├─ ℹ️ mypy strict: Not configured (recommended)
├─ ℹ️ import-linter: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

#### PHP の例
```text
📋 Quality Infrastructure Check (PHP detected)
├─ ℹ️ pre-commit: Not configured (optional)
├─ ✅ PHPStan: Configured (level=max)
├─ ℹ️ deptrac: Not configured (optional - recommended)
├─ ✅ CI: GitHub Actions configured
└─ ℹ️ DevContainer: Not configured (optional)
```

### Step 5: 不足時の動作

1. **警告メッセージを表示**
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **設計書の「前提条件」セクションに品質インフラ要件を追記**
   - 言語別の必須項目と推奨項目をリスト化

3. **処理は継続**（中断しない）

## Michi Extension: Next Phase Guidance

設計ドキュメント生成完了後、以下のフローを案内:

### Next Phase: Phase 0.3 - テストタイプの選択

設計が完了したら、タスク生成前に **Phase 0.3-0.4: テスト計画** を実施してください。

#### 1. Phase 0.3: テストタイプの選択

設計書の Testing Strategy セクションを基に、必要なテストタイプを決定します。

**実行方法:**

**推奨: 統合AIコマンド**
```bash
/michi:test-planning {feature-name}
```
Phase 0.3とPhase 0.4を統合的に実行します。AIが対話的にテストタイプを選択し、テスト仕様書を作成します。

**選択可能なテストタイプ:**
- 単体テスト (Unit Test)
- 統合テスト (Integration Test)
- E2Eテスト (End-to-End Test)
- パフォーマンステスト (Performance Test)
- セキュリティテスト (Security Test)

**参照ドキュメント**: `docs/user-guide/testing/test-planning-flow.md`

#### 2. Phase 0.4: テスト仕様書の作成

Phase 0.3で選択したテストタイプに基づいて、テスト仕様書を作成します。

**実行方法:**

`/michi:test-planning` を使用した場合、Phase 0.4も自動的に実行されます。

**テンプレート:**
- 単体テスト: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
- 統合テスト: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
- E2Eテスト: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
- パフォーマンステスト: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
- セキュリティテスト: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

**出力先**: `.michi/specs/{feature}/test-specs/`

### After Test Planning: Task Generation

Phase 0.3-0.4 完了後、以下のステップに進んでください:

**推奨フロー**:
1. `/michi:validate-design {feature}` で設計レビューを実施（任意）
2. `/michi:spec-tasks {feature}` でタスク生成

**クイックフロー**:
- `/michi:spec-tasks {feature} -y` で自動承認してタスク生成

**重要**: テスト計画（Phase 0.3-0.4）を完了してからタスク生成することで、実装タスクにテスト実装が適切に含まれます。

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-design` を拡張し、Michi 固有のテスト計画フロー（Phase 0.3-0.4）を Next Phase として案内します。
