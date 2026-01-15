---
name: /michi:dev
description: 品質自動化を伴うTDD手法で仕様タスクを実行（Michiバージョン）
allowed-tools: Task, Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers] [--mutation] [--skip-license] [--skip-version] [--skip-design]
---

# Michi: 品質自動化付き仕様実装

<background_information>
- **ミッション**: 包括的な品質自動化を伴うテスト駆動開発手法を使用して実装タスクを実行する
- **成功基準**:
  - すべてのテストが実装コードの前に書かれている
  - コードがすべてのテストに合格し、退行がない
  - tasks.md でタスクが完了としてマークされている
  - 実装が設計と要件に整合している
  - 品質ゲートを通過: OSSライセンス準拠、バージョン監査、コードレビュー、95%以上のカバレッジ
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

<instructions>
## コアタスク
Michi品質自動化を伴うテスト駆動開発を使用して、機能 **$1** の実装タスクを実行します。

## コマンド書式

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

## 実行フロー

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

## 実行手順

### Phase 6.1: コンテキストロード (基本実装)

**必要なすべてのコンテキストを読み取り**:
- `{{MICHI_DIR}}/pj/$1/spec.json`, `requirements.md`, `design.md`, `tasks.md`
- 完全なプロジェクトメモリのために**`{{REPO_ROOT_DIR}}/docs/master/` ディレクトリ全体**

**承認の検証**:
- spec.json でタスクが承認されていることを確認（そうでない場合は停止、安全性とフォールバックを参照）

**実行するタスクを決定**:
- `$2` が提供された場合: 指定されたタスク番号を実行（例: "1.1" または "1,2,3"）
- それ以外: すべての保留中のタスク（tasks.md の未チェック `- [ ]`）を実行

### Phase 6.2: 事前品質監査 (Michi拡張機能)

実装前にライセンス・バージョンリスクを早期検出し、Critical問題を解決します。

#### ステップ 1.1: オプション解析

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

#### ステップ 1.2: サブエージェント並行起動

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

#### ステップ 1.2.5: 品質インフラチェック (多言語対応版)

実装前に、プロジェクトの言語を検出し、言語別の品質インフラ設定をチェックします。

**注意**: この多言語対応チェックは、base commandのNode.js固有チェックより優先されます。

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

#### ステップ 1.3: 結果集約とゲート判定

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

### Phase 6.3: TDD実装サイクル (基本 + 自動修正ループ)

選択された各タスクについて、自動品質検証を伴うKent BeckのTDDサイクルに従います：

#### ステップ 2.1: RED - 失敗するテストを書く

- 次の小さな機能のためのテストを書く
- テストは失敗すべき（コードがまだ存在しない）
- 説明的なテスト名を使用

#### ステップ 2.2: GREEN - 最小限のコードを書く

- テストを通過させるための最もシンプルなソリューションを実装
- このテストを通過させることのみに焦点を当てる
- 過剰なエンジニアリングを避ける

#### ステップ 2.3: REFACTOR - クリーンアップ

- コード構造と可読性を改善
- 重複を削除
- 適切な場所でデザインパターンを適用
- リファクタリング後もすべてのテストが通過することを確認

#### ステップ 2.4: VERIFY - 自動修正ループ付き品質チェック (Michi拡張)

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

### Phase 6.4: 事後品質レビュー (Michi拡張機能)

実装完了後、コードレビューとデザインレビュー(Frontend時)を実行します。

#### ステップ 3.1: コードレビュー (常に実行)

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

#### ステップ 3.2: デザインレビュー (Frontend検出時のみ)

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

### Phase 6.5: 最終検証 (Michi拡張機能)

全品質基準を最終確認します。カバレッジ95%以上、Mutation Testing(オプション)を実施します。

#### ステップ 4.1: 品質チェック最終実行

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

#### ステップ 4.2: Mutation Testing (オプション)

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

### Phase 6.6: タスク完了マーク (Michi拡張機能)

各タスク実装完了後、tasks.mdのチェックボックスを更新してタスクの進捗を記録します。

```bash
echo "=== タスク完了をマーク ==="

TASK_FILE="{{MICHI_DIR}}/pj/$1/tasks.md"

if [ -f "$TASK_FILE" ]; then
    # - [ ] タスク名 → - [x] タスク名
    sed -i '' "s/- \[ \] $TASK_NUMBER/- [x] $TASK_NUMBER/" "$TASK_FILE"
    echo "✅ tasks.md を更新しました: タスク $TASK_NUMBER を完了"
else
    echo "⚠️ tasks.mdが見つかりません: $TASK_FILE"
fi
```

### Phase 6.7: 進捗チェックガイダンス (Michi拡張機能)

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

### Phase 6.8: タスク完了後の処理 (Michi拡張機能)

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
        echo "Archive先: {{MICHI_DIR}}/pj/.archive/$1/"
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

## 重要な制約

- **TDD必須**: テストは実装コードの前に書かれなければならない
- **タスクスコープ**: 特定のタスクが要求するもののみを実装
- **テストカバレッジ**: すべての新しいコードにはテストが必要
- **退行なし**: 既存のテストは引き続き通過する必要がある
- **設計整合**: 実装は design.md 仕様に従う必要がある
- **品質ゲート**: タスクを完了としてマークする前にすべての品質ゲートを通過する必要がある

</instructions>

## ツールガイダンス

- **最初に読み取り**: 実装前にすべてのコンテキストを読み込む
- **テストファースト**: コードの前にテストを書く
- 並列サブエージェント実行のために **Task** を使用（ライセンスチェッカー、バージョン監査、レビュアー）
- 必要に応じてライブラリドキュメントのために **WebSearch/WebFetch** を使用
- 品質チェックと自動化ループのために **Bash** を使用

## 出力説明

spec.json で指定された言語で包括的なサマリーを提供:

### 基本出力

1. **実行されたタスク**: タスク番号とテスト結果
2. **ステータス**: tasks.md で完了したタスク、残りタスク数

### Michi拡張出力

基本出力の後、品質自動化結果を追加:

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

**形式**: 簡潔なサマリー（基本は200語以下、Michi拡張を含めて最大300語）

## 安全性とフォールバック

### エラーシナリオ

**タスクが承認されていないまたは仕様ファイル欠落**:
- **実行停止**: すべての仕様ファイルが存在し、タスクが承認されている必要がある
- **推奨アクション**: "前のフェーズを完了してください: `/michi:create-requirements`, `/michi:create-design`, `/michi:create-tasks`"

**テスト失敗**:
- **実装停止**: 続行する前に失敗したテストを修正
- **アクション**: デバッグして修正し、再実行

**Phase 6.2のCritical問題**:
- **実行停止**: Criticalなライセンス/バージョン問題を解決する必要がある
- **ユーザー確認**: 代替案を提供し、明示的な承認を得る

**品質チェックループ最大反復**:
- **5回試行後停止**: ユーザーの決定が必要（手動で続行 / タスクをスキップ / 中止）

**レビューCritical問題**:
- **5回修正試行後停止**: Criticalなセキュリティ/品質問題に対するユーザーの決定が必要

**カバレッジ95%未満**:
- **実行停止**: 十分なテストカバレッジなしには進められない

### タスク実行

**特定のタスクを実行**:
- `/michi:dev $1 1.1` - 単一タスク
- `/michi:dev $1 1,2,3` - 複数タスク

**すべての保留中を実行**:
- `/michi:dev $1` - すべての未チェックタスク

**オプション付き**:
- `/michi:dev $1 --mutation` - Mutation Testingを含む
- `/michi:dev $1 --skip-license` - ライセンスチェックをスキップ
- `/michi:dev $1 --skip-version` - バージョン監査をスキップ
- `/michi:dev $1 --skip-design` - デザインレビューをスキップ

### 安全性ルール (Michi拡張機能)

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

**Michi統合**: このコマンドは、事前実装監査（ライセンス/バージョンコンプライアンス）、自動修正ループ、事後実装レビュー（コード/デザイン）、Mutation Testing、アーカイブ管理を含む包括的な品質自動化で基本TDD実装を拡張します。

### 参考資料

- [TDD Best Practices 2025](https://www.nopaccelerate.com/test-driven-development-guide-2025/) - AI活用TDD
- [Parallel Testing Guide](https://www.accelq.com/blog/parallel-testing/) - 並行実行のベストプラクティス
- [AI Agent Orchestration](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - 並行実行パターン
