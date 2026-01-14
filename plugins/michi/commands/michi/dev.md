---
name: /michi:dev
description: Execute spec tasks using TDD methodology with quality automation (Michi version)
allowed-tools: Task, Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers] [--mutation] [--skip-license] [--skip-version] [--skip-design]
---

# Michi: Spec Implementation with Quality Automation

<background_information>
- **Mission**: Execute implementation tasks using Test-Driven Development methodology with comprehensive quality automation
- **Success Criteria**:
  - All tests written before implementation code
  - Code passes all tests with no regressions
  - Tasks marked as completed in tasks.md
  - Implementation aligns with design and requirements
  - Quality gates passed: OSS license compliance, version audit, code review, 95%+ coverage
</background_information>

## Development Guidelines
{{DEV_GUIDELINES}}

---

<instructions>
## Core Task
Execute implementation tasks for feature **$1** using Test-Driven Development with Michi quality automation.

## Command Signature

```bash
/michi:dev <feature-name> [task-numbers] [options]

Arguments:
  feature-name    機能名(必須)
  task-numbers    タスク番号(オプション、例: "1.1" or "1,2,3")

Options:
  --mutation        Mutation Testing を実行(Phase 6.5)
  --skip-license    ライセンスチェックをスキップ
  --skip-version    バージョンチェックをスキップ
  --skip-design     デザインレビューをスキップ(Frontend検出時)
```

## Execution Flow

```plaintext
Phase 6.1: コンテキストロード
    ↓
Phase 6.2: 事前品質監査(Michi拡張)
    ├─ oss-license-checker(並行)
    ├─ stable-version-auditor(並行)
    └─ Frontend検出判定(並行)
    ↓
Phase 6.3: TDD実装サイクル(base + 自動修正ループ拡張)
    RED → GREEN → REFACTOR → VERIFY(最大5回)
    ↓
Phase 6.4: 事後品質レビュー(Michi拡張)
    ├─ コードレビュー(常に)
    └─ デザインレビュー(Frontend時のみ)
    ↓
Phase 6.5: 最終検証(Michi拡張)
    type-check + lint + test + coverage 95% + Mutation Testing(オプション)
    ↓
Phase 6.6: タスク完了マーク(Michi拡張)
    tasks.md のチェックボックス更新
    ↓
Phase 6.7: Progress Check Guidance(Michi拡張)
    /michi:show-status の自動案内表示
    ↓
Phase 6.8: タスク完了後の処理(Michi拡張)
    Archive確認 → ユーザー選択 → Archive実行 or スキップ
```

## Execution Steps

### Phase 6.1: Load Context (Base Implementation)

**Read all necessary context**:
- `{{MICHI_DIR}}/specs/$1/spec.json`, `requirements.md`, `design.md`, `tasks.md`
- **Entire `{{REPO_ROOT_DIR}}/docs/master/` directory** for complete project memory

**Validate approvals**:
- Verify tasks are approved in spec.json (stop if not, see Safety & Fallback)

**Determine which tasks to execute**:
- If `$2` provided: Execute specified task numbers (e.g., "1.1" or "1,2,3")
- Otherwise: Execute all pending tasks (unchecked `- [ ]` in tasks.md)

### Phase 6.2: 事前品質監査 (Michi Extensions)

実装前にライセンス・バージョンリスクを早期検出し、Critical問題を解決します。

#### Step 1.1: オプション解析

```bash
SKIP_LICENSE=false
SKIP_VERSION=false
SKIP_DESIGN=false
MUTATION=false

if echo "$@" | grep -q -- '--skip-license'; then
    SKIP_LICENSE=true
fi

if echo "$@" | grep -q -- '--skip-version'; then
    SKIP_VERSION=true
fi

if echo "$@" | grep -q -- '--skip-design'; then
    SKIP_DESIGN=true
fi

if echo "$@" | grep -q -- '--mutation'; then
    MUTATION=true
fi

# レポート出力用の変数初期化
COMPLETED_TASKS=0
TOTAL_TASKS=0
OSS_LICENSE_STATUS="UNKNOWN"
VERSION_AUDIT_STATUS="UNKNOWN"
DESIGN_REVIEW_STATUS="SKIPPED"
CODE_REVIEW_CRITICAL=0
DESIGN_REVIEW_CRITICAL=0
```

#### Step 1.2: サブエージェント並行起動

**重要**: 以下の3つのタスクは独立しているため、並行実行します。単一メッセージで複数のTaskツール呼び出しを行います。

##### 1. oss-license-checker

```yaml
Task tool:
  subagent_type: oss-license-checker
  prompt: |
    プロジェクトの依存パッケージライセンスを監査してください。

    **監査対象**:
    - package.json / package-lock.json(Node.js)
    - requirements.txt / pyproject.toml(Python)
    - build.gradle / pom.xml(Java)
    - composer.json(PHP)

    **検出すべきライセンス**:
    - 🔴 Critical: GPL, AGPL, SSPL → 即時停止
    - 🟡 Warning: LGPL, MPL → 警告表示

    **出力形式**:
    - Critical件数: X件
    - Warning件数: Y件
    - 代替パッケージ提案(Critical時)
```

##### 2. stable-version-auditor

```yaml
Task tool:
  subagent_type: stable-version-auditor
  prompt: |
    プロジェクトの技術スタックバージョンを監査してください。

    **監査対象**:
    - Node.js version(package.json, .nvmrc, Dockerfile)
    - Python version(pyproject.toml, .python-version)
    - Java version(pom.xml, build.gradle)

    **検出すべきリスク**:
    - 🔴 Critical: EOL済み → 即時停止
    - 🟡 Warning: EOL 6ヶ月以内 → 警告表示
    - 🟢 Info: 最新LTSでない → 情報表示

    **出力形式**:
    - Critical件数: X件
    - Warning件数: Y件
    - アップグレードパス提案(Critical時)
```

##### 3. Frontend検出

```bash
# Frontend変更を検出
FRONTEND_DETECTED=false

# 対象ファイル拡張子
if find . -type f \( \
    -name "*.tsx" -o \
    -name "*.jsx" -o \
    -name "*.vue" -o \
    -name "*.svelte" \
  \) | head -1 | grep -q .; then
    FRONTEND_DETECTED=true
fi

# CSSファイル
if find . -type f \( \
    -name "*.css" -o \
    -name "*.scss" -o \
    -name "*.sass" -o \
    -name "*.less" \
  \) | head -1 | grep -q .; then
    FRONTEND_DETECTED=true
fi

# Tailwind設定
if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
    FRONTEND_DETECTED=true
fi

# Frontendディレクトリ
if [ -d "components" ] || [ -d "pages" ] || [ -d "views" ]; then
    FRONTEND_DETECTED=true
fi

echo "Frontend detected: $FRONTEND_DETECTED"
```

#### Step 1.2.5: 品質インフラチェック (多言語対応版)

実装前に、プロジェクトの言語を検出し、言語別の品質インフラ設定をチェックします。

**Note**: この多言語対応チェックは、base commandのNode.js固有チェックより優先されます。

##### CI設定の確認

```bash
CI_PLATFORM="none"

if [ -d ".github/workflows" ]; then
    CI_PLATFORM="GitHub Actions"
elif [ -f "screwdriver.yaml" ]; then
    CI_PLATFORM="Screwdriver"
fi

echo "📋 CI Platform: $CI_PLATFORM"
```

##### 言語検出（複数言語プロジェクト対応）

```bash
DETECTED_LANGS=()

if [ -f "package.json" ]; then
    DETECTED_LANGS+=("Node.js")
fi

if [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    DETECTED_LANGS+=("Java")
fi

if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
    DETECTED_LANGS+=("Python")
fi

if [ -f "composer.json" ]; then
    DETECTED_LANGS+=("PHP")
fi

# 主要言語の判定（複数言語が検出された場合）
if [ ${#DETECTED_LANGS[@]} -eq 0 ]; then
    DETECTED_LANG="unknown"
    echo "⚠️ No supported language detected"
elif [ ${#DETECTED_LANGS[@]} -eq 1 ]; then
    DETECTED_LANG="${DETECTED_LANGS[0]}"
    echo "🔍 Detected Language: $DETECTED_LANG"
else
    # 複数言語検出時は優先度順に主要言語を決定
    # 優先度: Node.js > Java > Python > PHP
    echo "🔍 Multiple languages detected: ${DETECTED_LANGS[*]}"

    if [[ " ${DETECTED_LANGS[*]} " =~ " Node.js " ]]; then
        DETECTED_LANG="Node.js"
    elif [[ " ${DETECTED_LANGS[*]} " =~ " Java " ]]; then
        DETECTED_LANG="Java"
    elif [[ " ${DETECTED_LANGS[*]} " =~ " Python " ]]; then
        DETECTED_LANG="Python"
    elif [[ " ${DETECTED_LANGS[*]} " =~ " PHP " ]]; then
        DETECTED_LANG="PHP"
    fi

    echo "  → Primary language (for infra check): $DETECTED_LANG"
fi

# 変数初期化
INFRA_MISSING=()
INFRA_OPTIONAL_MISSING=()
INFRA_RECOMMENDED_MISSING=()
DEVCONTAINER_MISSING=false
```

##### 言語別チェック実行

各言語に応じた必須・推奨の品質インフラをチェックします。

**Node.js の場合:**
```bash
if [ "$DETECTED_LANG" = "Node.js" ]; then
    INFRA_MISSING=()
    INFRA_RECOMMENDED_MISSING=()

    # 必須チェック
    [ ! -d ".husky" ] && INFRA_MISSING+=("husky")
    [ ! -f ".husky/pre-commit" ] && INFRA_MISSING+=("pre-commit hook")

    # lint-staged チェック
    if command -v jq >/dev/null 2>&1 && [ -f "package.json" ]; then
        if ! jq -e '.dependencies["lint-staged"] // .devDependencies["lint-staged"] // ."lint-staged"' package.json >/dev/null 2>&1 && \
           ! ls .lintstagedrc* >/dev/null 2>&1; then
            INFRA_MISSING+=("lint-staged")
        fi
    else
        if ! grep -q "lint-staged" package.json 2>/dev/null && ! ls .lintstagedrc* 2>/dev/null | grep -q .; then
            INFRA_MISSING+=("lint-staged")
        fi
    fi

    # TypeScript strict チェック
    if command -v jq >/dev/null 2>&1 && [ -f "tsconfig.json" ]; then
        if ! jq -e '.compilerOptions.strict == true' tsconfig.json >/dev/null 2>&1; then
            INFRA_MISSING+=("TypeScript strict")
        fi
    else
        if ! grep -q '"strict".*true' tsconfig.json 2>/dev/null; then
            INFRA_MISSING+=("TypeScript strict")
        fi
    fi

    [ "$CI_PLATFORM" = "none" ] && INFRA_MISSING+=("CI")

    # 推奨チェック（tsarch）
    if command -v jq >/dev/null 2>&1 && [ -f "package.json" ]; then
        if ! jq -e '.dependencies.tsarch // .devDependencies.tsarch' package.json >/dev/null 2>&1; then
            INFRA_RECOMMENDED_MISSING+=("tsarch")
        fi
    else
        if ! grep -q "tsarch" package.json 2>/dev/null; then
            INFRA_RECOMMENDED_MISSING+=("tsarch")
        fi
    fi

    # DevContainer (任意)
    DEVCONTAINER_MISSING=false
    [ ! -d ".devcontainer" ] && DEVCONTAINER_MISSING=true
fi
```

**Java, Python, PHP** の場合も同様にチェック（詳細は省略、実装時にbaseバージョンから参照）

##### 結果表示

```bash
echo "📋 Quality Infrastructure Check ($DETECTED_LANG detected)"

# 必須項目
if [ ${#INFRA_MISSING[@]} -eq 0 ]; then
    echo "✅ All required infrastructure configured"
else
    echo "⚠️ Missing required infrastructure:"
    for item in "${INFRA_MISSING[@]}"; do
        echo "   - $item (REQUIRED)"
    done
fi

# オプション項目
if [ ${#INFRA_OPTIONAL_MISSING[@]} -gt 0 ]; then
    echo "ℹ️ Optional infrastructure (not required):"
    for item in "${INFRA_OPTIONAL_MISSING[@]}"; do
        echo "   - $item (optional)"
    done
fi

# 推奨項目
if [ ${#INFRA_RECOMMENDED_MISSING[@]} -gt 0 ]; then
    echo "ℹ️ Recommended infrastructure:"
    for item in "${INFRA_RECOMMENDED_MISSING[@]}"; do
        echo "   - $item (recommended)"
    done
fi

# DevContainer
if [ "$DEVCONTAINER_MISSING" = true ]; then
    echo "ℹ️ DevContainer: Not configured (optional)"
else
    echo "✅ DevContainer: Configured"
fi

# チェック済みフラグを設定
MICHI_INFRA_CHECK_DONE=true
export MICHI_INFRA_CHECK_DONE
```

#### Step 1.3: 結果集約とゲート判定

```bash
# 結果集約
TOTAL_CRITICAL=0
TOTAL_WARNING=0

# oss-license-checker結果
if [ "$OSS_LICENSE_CRITICAL" -gt 0 ]; then
    TOTAL_CRITICAL=$((TOTAL_CRITICAL + OSS_LICENSE_CRITICAL))
fi

# stable-version-auditor結果
if [ "$VERSION_AUDIT_CRITICAL" -gt 0 ]; then
    TOTAL_CRITICAL=$((TOTAL_CRITICAL + VERSION_AUDIT_CRITICAL))
fi

# ゲート判定
if [ "$TOTAL_CRITICAL" -gt 0 ]; then
    echo "🔴 Critical issues detected: $TOTAL_CRITICAL"
    echo ""
    echo "以下の対応が必要です:"
    echo "1. 禁止ライセンス(GPL/AGPL/SSPL)を使用しているパッケージを代替"
    echo "2. EOL済みバージョンをアップグレード"
    echo ""
    echo "次のアクション:"
    echo "A) 代替パッケージ/アップグレードを実施する"
    echo "B) 詳細レポートを確認する"
    echo "C) 実装を中止する"

    # ユーザー確認
    read -p "どの対応を希望しますか? (A/B/C): " ACTION

    if [ "$ACTION" != "A" ]; then
        echo "実装を中止します"
        exit 1
    fi
else
    echo "✅ Phase 6.2: 事前品質監査 完了(Critical: 0, Warning: $TOTAL_WARNING)"
fi
```

### Phase 6.3: TDD Implementation Cycle (Base + Auto-Fix Loop)

For each selected task, follow Kent Beck's TDD cycle with automatic quality verification:

#### Step 2.1: RED - Write Failing Test

- Write test for the next small piece of functionality
- Test should fail (code doesn't exist yet)
- Use descriptive test names

#### Step 2.2: GREEN - Write Minimal Code

- Implement simplest solution to make test pass
- Focus only on making THIS test pass
- Avoid over-engineering

#### Step 2.3: REFACTOR - Clean Up

- Improve code structure and readability
- Remove duplication
- Apply design patterns where appropriate
- Ensure all tests still pass after refactoring

#### Step 2.4: VERIFY - Quality Check with Auto-Fix Loop (Michi Extension)

```bash
# 各タスク実装後、品質チェックを実行
ITERATION=0
MAX_ITERATIONS=5

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    echo "=== 品質チェック(試行 $((ITERATION + 1))/$MAX_ITERATIONS) ==="

    # Type Check (package.jsonがある場合のみ)
    if [ -f "package.json" ] && grep -q "\"type-check\"" package.json; then
        if ! npm run type-check 2>&1 | tee /tmp/type-check.log; then
            echo "❌ Type check failed"
            TYPE_CHECK_FAILED=true
        else
            echo "✅ Type check passed"
            TYPE_CHECK_FAILED=false
        fi
    else
        echo "ℹ️  Type check skipped (no package.json or script not found)"
        TYPE_CHECK_FAILED=false
    fi

    # Lint (package.jsonがある場合のみ)
    if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
        if ! npm run lint 2>&1 | tee /tmp/lint.log; then
            echo "❌ Lint failed"
            LINT_FAILED=true
        else
            echo "✅ Lint passed"
            LINT_FAILED=false
        fi
    else
        echo "ℹ️  Lint skipped (no package.json or script not found)"
        LINT_FAILED=false
    fi

    # Test (package.jsonがある場合のみ)
    if [ -f "package.json" ] && grep -q "\"test:run\"\\|\"test\"" package.json; then
        if ! npm run test:run 2>&1 | tee /tmp/test.log; then
            echo "❌ Test failed"
            TEST_FAILED=true
        else
            echo "✅ Test passed"
            TEST_FAILED=false
        fi
    else
        echo "ℹ️  Test skipped (no package.json or script not found)"
        TEST_FAILED=false
    fi

    # 全て成功したらループ終了
    if [ "$TYPE_CHECK_FAILED" = false ] && [ "$LINT_FAILED" = false ] && [ "$TEST_FAILED" = false ]; then
        echo "✅ 全ての品質チェックが成功しました"
        break
    fi

    # 自動修正を試行
    echo "⚙️  自動修正を試行します..."

    if [ "$LINT_FAILED" = true ] && [ -f "package.json" ] && grep -q "\"lint:fix\"" package.json; then
        echo "🔧 Lint自動修正を実行"
        npm run lint:fix
    fi

    if [ "$TYPE_CHECK_FAILED" = true ]; then
        echo "🔧 型エラーを分析中..."
    fi

    if [ "$TEST_FAILED" = true ]; then
        echo "🔧 テスト失敗を分析中..."
        echo "⚠️  注意: テストは仕様。仕様変更の場合のみテストを修正"
    fi

    ITERATION=$((ITERATION + 1))
done

# 最大試行回数に達した場合
if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    echo "❌ 自動修正ループが最大試行回数($MAX_ITERATIONS)に達しました"
    echo ""
    echo "以下の問題が残っています:"
    [ "$TYPE_CHECK_FAILED" = true ] && echo "- Type check失敗"
    [ "$LINT_FAILED" = true ] && echo "- Lint失敗"
    [ "$TEST_FAILED" = true ] && echo "- Test失敗"
    echo ""
    echo "次のアクション:"
    echo "A) 手動で修正を続ける"
    echo "B) 現在のタスクをスキップ"
    echo "C) 実装を中止"

    # ユーザー確認
    read -p "どの対応を希望しますか? (A/B/C): " ACTION

    if [ "$ACTION" = "C" ]; then
        echo "実装を中止します"
        exit 1
    fi
fi
```

### Phase 6.4: 事後品質レビュー (Michi Extensions)

実装完了後、コードレビューとデザインレビュー(Frontend時)を実行します。

#### Step 3.1: コードレビュー (常に実行)

```markdown
Task tool:
  subagent_type: review-cq
  prompt: |
    実装完了したコードをレビューしてください。

    **レビュー対象機能**: $1

    **レビュー観点**:
    - コード品質: 可読性、保守性、DRY原則
    - セキュリティ: 入力検証、XSS、SQLインジェクション
    - パフォーマンス: アルゴリズム効率、メモリ使用量
    - テスト: テストカバレッジ、テストの質

    **重要度分類**:
    - 🔴 Critical: 即時修正必須
    - 🟡 Warning: 対応推奨
    - 🟢 Info: 改善提案

    **出力形式**:
    - Critical件数: X件
    - Warning件数: Y件
    - 修正推奨箇所の詳細リスト
```

#### Step 3.2: デザインレビュー (Frontend検出時のみ)

```bash
if [ "$FRONTEND_DETECTED" = true ] && [ "$SKIP_DESIGN" = false ]; then
    echo "=== Frontend変更を検出 → デザインレビューを実行 ==="
```

```markdown
Task tool:
  subagent_type: design-reviewer
  prompt: |
    Frontend実装をレビューしてください。

    **レビュー観点**:
    - アクセシビリティ(WCAG 2.1)
    - レスポンシブデザイン(375px, 768px, 1280px)
    - UXパターン
    - パフォーマンス(Core Web Vitals)

    **出力先**: docs/tmp/design-review-report.md
```

```bash
else
    echo "✅ Frontend変更なし → デザインレビューをスキップ"
fi
```

### Phase 6.5: 最終検証 (Michi Extensions)

全品質基準を最終確認します。カバレッジ95%以上、Mutation Testing(オプション)を実施します。

#### Step 4.1: 品質チェック最終実行

```bash
echo "=== Phase 6.5: 最終検証 ==="

# 言語検出
LANGUAGE="unknown"
if [ -f "package.json" ]; then
    LANGUAGE="nodejs"
elif [ -f "build.gradle" ]; then
    LANGUAGE="java"
elif [ -f "pyproject.toml" ]; then
    LANGUAGE="python"
elif [ -f "composer.json" ]; then
    LANGUAGE="php"
fi

echo "🔍 Detected language: $LANGUAGE"

# 言語別品質チェック (Node.js, Java, Python, PHPをサポート)
# 詳細は省略 - 各言語でtype-check, lint, test, coverageをチェック

# カバレッジ判定(95%以上)
if (( $(echo "$COVERAGE < 95" | bc -l) )); then
    echo "❌ Coverage failed: ${COVERAGE}% (required: 95%)"
    exit 1
else
    echo "✅ Coverage passed: ${COVERAGE}%"
fi
```

#### Step 4.2: Mutation Testing (オプション)

```bash
if [ "$MUTATION" = true ]; then
    echo "=== Mutation Testing ==="

    # 言語別Mutation Testing実行
    # Node.js: Stryker, Java: PITest, Python: mutmut, PHP: Infection

    # Mutation Score判定(80%以上)
    if (( $(echo "$MUTATION_SCORE < 80" | bc -l) )); then
        echo "❌ Mutation Testing failed: ${MUTATION_SCORE}% (required: 80%)"
        exit 1
    else
        echo "✅ Mutation Testing passed: ${MUTATION_SCORE}%"
    fi
fi
```

### Phase 6.6: タスク完了マーク (Michi Extensions)

各タスク実装完了後、tasks.mdのチェックボックスを更新してタスクの進捗を記録します。

```bash
echo "=== タスク完了をマーク ==="

TASK_FILE="{{MICHI_DIR}}/specs/$1/tasks.md"

if [ -f "$TASK_FILE" ]; then
    # - [ ] タスク名 → - [x] タスク名
    sed -i '' "s/- \[ \] $TASK_NUMBER/- [x] $TASK_NUMBER/" "$TASK_FILE"
    echo "✅ tasks.md を更新しました: タスク $TASK_NUMBER を完了"
else
    echo "⚠️ tasks.mdが見つかりません: $TASK_FILE"
fi
```

### Phase 6.7: Progress Check Guidance (Michi Extensions)

タスク完了後、仕様全体の進捗状況を確認するコマンドを自動案内します。

```bash
echo ""
echo "========================================"
echo " 📊 Progress Check - 進捗確認"
echo "========================================"
echo ""
echo "タスク完了後、仕様全体の進捗状況を確認できます："
echo ""
echo "▶ /michi:show-status $1"
echo ""
echo "【確認できる内容】"
echo "  - Requirements / Design / Tasks の完了率"
echo "  - 完了タスク数 / 全タスク数"
echo "  - 次に実行すべきアクション"
echo "  - ブロッカーや不足要素"
echo ""
echo "========================================"
```

### Phase 6.8: タスク完了後の処理 (Michi Extensions)

すべてのタスクが完了した場合、スペックをarchiveに移動します。

```bash
echo ""
echo "======================================"
echo " タスク完了確認"
echo "======================================"
echo ""
echo "すべてのタスクが完了しました。"
echo ""
echo "次のアクション:"
echo "A) スペックをarchiveに移動する(推奨)"
echo "B) 追加のタスクを実行する"
echo "C) 何もしない"
echo ""

# ユーザー確認
read -p "どの対応を希望しますか? (A/B/C): " ARCHIVE_ACTION

if [ "$ARCHIVE_ACTION" = "A" ]; then
    echo "🗃️  スペックをarchiveに移動します..."
    echo "ℹ️  /michi:archive-pj $1 コマンドを実行してください"

    if [ true ]; then
        echo "✅ アーカイブコマンドの案内を表示しました"
        echo ""
        echo "Archive先: {{MICHI_DIR}}/specs/.archive/$1/"
    else
        echo "❌ スペックのarchive移動に失敗しました"
    fi
elif [ "$ARCHIVE_ACTION" = "B" ]; then
    echo "✅ 追加のタスクを実行できます"
    echo ""
    echo "次のコマンドを実行してください:"
    echo "/michi:dev $1 [task-numbers]"
else
    echo "✅ スペックはそのままにしておきます"
fi
```

## Important Constraints

- **TDD Mandatory**: Tests MUST be written before implementation code
- **Task Scope**: Implement only what the specific task requires
- **Test Coverage**: All new code must have tests
- **No Regressions**: Existing tests must continue to pass
- **Design Alignment**: Implementation must follow design.md specifications
- **Quality Gates**: All quality gates must pass before marking task complete

</instructions>

## Tool Guidance

- **Read first**: Load all context before implementation
- **Test first**: Write tests before code
- Use **Task** for parallel subagent execution (license checker, version auditor, reviewers)
- Use **WebSearch/WebFetch** for library documentation when needed
- Use **Bash** for quality checks and automation loops

## Output Description

Provide comprehensive summary in the language specified in spec.json:

### Base Output

1. **Tasks Executed**: Task numbers and test results
2. **Status**: Completed tasks marked in tasks.md, remaining tasks count

### Michi Extended Output

After base output, add quality automation results:

```bash
echo ""
echo "======================================"
echo " /michi:dev 実行結果"
echo "======================================"
echo ""
echo "## サマリー"
echo "- 機能名: $1"
echo "- 実行タスク: ${COMPLETED_TASKS}/${TOTAL_TASKS} 完了"
echo "- 最終ステータス: SUCCESS"
echo ""
echo "## 事前監査結果"
echo "- OSS License: ${OSS_LICENSE_STATUS}"
echo "- Version Audit: ${VERSION_AUDIT_STATUS}"
echo "- Frontend検出: ${FRONTEND_DETECTED}"
echo ""
echo "## 品質チェック結果"
echo "- Type Check: PASS"
echo "- Lint: PASS"
echo "- Test: PASS (Coverage: ${COVERAGE}%)"
echo "- Code Review: PASS"
echo "- Design Review: ${DESIGN_REVIEW_STATUS}"
if [ "$MUTATION" = true ]; then
    echo "- Mutation Testing: PASS (Score: ${MUTATION_SCORE}%)"
fi
echo ""
echo "======================================"
```

**Format**: Concise summary (under 200 words for base, up to 300 words with Michi extensions)

## Safety & Fallback

### Error Scenarios

**Tasks Not Approved or Missing Spec Files**:
- **Stop Execution**: All spec files must exist and tasks must be approved
- **Suggested Action**: "Complete previous phases: `/michi:create-requirements`, `/michi:create-design`, `/michi:create-tasks`"

**Test Failures**:
- **Stop Implementation**: Fix failing tests before continuing
- **Action**: Debug and fix, then re-run

**Critical Issues in Phase 6.2**:
- **Stop Execution**: Must resolve critical license/version issues
- **User Confirmation**: Provide alternatives and get explicit approval

**Quality Check Loop Max Iterations**:
- **Stop After 5 Attempts**: Require user decision (continue manually / skip task / abort)

**Review Critical Issues**:
- **Stop After 5 Fix Attempts**: Require user decision for critical security/quality issues

**Coverage Below 95%**:
- **Stop Execution**: Cannot proceed without sufficient test coverage

### Task Execution

**Execute specific task(s)**:
- `/michi:dev $1 1.1` - Single task
- `/michi:dev $1 1,2,3` - Multiple tasks

**Execute all pending**:
- `/michi:dev $1` - All unchecked tasks

**With options**:
- `/michi:dev $1 --mutation` - Include mutation testing
- `/michi:dev $1 --skip-license` - Skip license check
- `/michi:dev $1 --skip-version` - Skip version audit
- `/michi:dev $1 --skip-design` - Skip design review

### 安全性ルール (Michi Extensions)

**必須確認ケース**:
1. Phase 6.2でCritical検出時: 必ずユーザー確認、代替案提示
2. Phase 6.3で自動修正失敗時: 最大5回試行後、ユーザー確認
3. Phase 6.4でレビュー失敗時: 最大5回修正後、ユーザー確認
4. Phase 6.5でカバレッジ不足時: 即時停止、ユーザー確認
5. Phase 6.8でArchive実行時: 必ずユーザー確認、明示的な承認

**禁止事項**:
- ❌ ユーザー確認なしでのパッケージ変更
- ❌ ユーザー確認なしでのバージョン変更
- ❌ テストの仕様変更(実装に合わせてテストを変更しない)
- ❌ Critical問題を無視して処理を続行

---

**Michi Integration**: This command extends base TDD implementation with comprehensive quality automation including pre-implementation audits (license/version compliance), automatic fix loops, post-implementation reviews (code/design), mutation testing, and archive management.

### 参考資料

- [TDD Best Practices 2025](https://www.nopaccelerate.com/test-driven-development-guide-2025/) - AI活用TDD
- [Parallel Testing Guide](https://www.accelq.com/blog/parallel-testing/) - 並行実行のベストプラクティス
- [AI Agent Orchestration](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - 並行実行パターン
