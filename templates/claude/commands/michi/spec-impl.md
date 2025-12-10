---
name: /michi:spec-impl
description: Execute spec tasks using TDD methodology with quality automation (Michi version)
allowed-tools: Task, Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers] [--mutation] [--skip-license] [--skip-version] [--skip-design]
---

# Michi: Spec Implementation with Quality Automation

## Base Command Reference
@.claude/commands/kiro/spec-impl.md

---

## Michi Extension: Quality Automation & Parallel Execution

このコマンドは cc-sdd 標準の `/kiro:spec-impl` を拡張し、以下のMichi固有機能を追加します：

### 追加機能
1. **事前品質監査（Phase 1）**: サブエージェント並行実行でライセンス・バージョンリスクを早期検出
2. **自動修正ループ（Phase 2）**: type-check、lint、test を自動修正（最大5回）
3. **事後品質レビュー（Phase 3）**: コードレビュー、デザインレビュー（Frontend時）
4. **最終品質ゲート（Phase 4）**: カバレッジ95%、Mutation Testing（オプション）

### コマンドシグネチャ

```bash
/michi:spec-impl <feature-name> [task-numbers] [options]

Arguments:
  feature-name    機能名（必須）
  task-numbers    タスク番号（オプション、例: "1.1" or "1,2,3"）

Options:
  --mutation        Mutation Testing を実行（Phase 4）
  --skip-license    ライセンスチェックをスキップ
  --skip-version    バージョンチェックをスキップ
  --skip-design     デザインレビューをスキップ（Frontend検出時）
```

---

## 実行フロー

```
Phase 0: コンテキストロード（kiro:spec-impl継承）
    ↓
Phase 1: 事前品質監査（Michi拡張）
    ├─ oss-license-checker（並行）
    ├─ stable-version-auditor（並行）
    └─ Frontend検出判定（並行）
    ↓
Phase 2: TDD実装サイクル（kiro:spec-impl継承 + 自動修正ループ拡張）
    RED → GREEN → REFACTOR → VERIFY（最大5回） → MARK
    ↓
Phase 3: 事後品質レビュー（Michi拡張）
    ├─ コードレビュー（常に）
    └─ デザインレビュー（Frontend時のみ）
    ↓
Phase 4: 最終検証（Michi拡張）
    type-check + lint + test + coverage 95% + Mutation Testing（オプション）
```

---

## Phase 1: 事前品質監査（Michi拡張）

### 目的
実装前にライセンス・バージョンリスクを早期検出し、Critical問題を事前に解決。

### 実行手順

#### Step 1.1: オプション解析

```bash
# コマンドライン引数を解析
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
```

#### Step 1.2: サブエージェント並行起動

**重要**: 以下の3つのタスクは独立しているため、**並行実行**してください。単一メッセージで複数のTaskツール呼び出しを行います。

```markdown
## サブエージェント並行起動（Phase 1）

Phase 1では以下の3つのサブエージェントを**並行起動**します：

### 1. oss-license-checker
```
Task tool:
  subagent_type: oss-license-checker
  prompt: |
    プロジェクトの依存パッケージライセンスを監査してください。

    **監査対象**:
    - package.json / package-lock.json（Node.js）
    - requirements.txt / pyproject.toml（Python）
    - build.gradle / pom.xml（Java）
    - composer.json（PHP）

    **検出すべきライセンス**:
    - 🔴 Critical: GPL, AGPL, SSPL → 即時停止
    - 🟡 Warning: LGPL, MPL → 警告表示

    **出力形式**:
    - Critical件数: X件
    - Warning件数: Y件
    - 代替パッケージ提案（Critical時）
```

### 2. stable-version-auditor
```
Task tool:
  subagent_type: stable-version-auditor
  prompt: |
    プロジェクトの技術スタックバージョンを監査してください。

    **監査対象**:
    - Node.js version（package.json, .nvmrc, Dockerfile）
    - Python version（pyproject.toml, .python-version）
    - Java version（pom.xml, build.gradle）

    **検出すべきリスク**:
    - 🔴 Critical: EOL済み → 即時停止
    - 🟡 Warning: EOL 6ヶ月以内 → 警告表示
    - 🟢 Info: 最新LTSでない → 情報表示

    **出力形式**:
    - Critical件数: X件
    - Warning件数: Y件
    - アップグレードパス提案（Critical時）
```

### 3. Frontend検出
```
並行実行タスク:
  ローカル検出ロジック（Task toolは使用せず、直接実行）:

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

**並行実行の実装例**:
```
単一メッセージで以下を実行:
- Task tool（oss-license-checker）
- Task tool（stable-version-auditor）
- Bash tool（Frontend検出）
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
    echo "1. 禁止ライセンス（GPL/AGPL/SSPL）を使用しているパッケージを代替"
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
    echo "✅ Phase 1: 事前品質監査 完了（Critical: 0, Warning: $TOTAL_WARNING）"
fi
```

---

## Phase 2: TDD実装サイクル（自動修正ループ拡張）

### 目的
kiro:spec-implの基本TDDサイクルに、**自動修正ループ**を追加。

### Step 2.4: VERIFY - 品質チェック（自動修正ループ）

```bash
# 各タスク実装後、品質チェックを実行
ITERATION=0
MAX_ITERATIONS=5

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    echo "=== 品質チェック（試行 $((ITERATION + 1))/$MAX_ITERATIONS）==="

    # Type Check
    if ! npm run type-check 2>&1 | tee /tmp/type-check.log; then
        echo "❌ Type check failed"
        TYPE_CHECK_FAILED=true
    else
        echo "✅ Type check passed"
        TYPE_CHECK_FAILED=false
    fi

    # Lint
    if ! npm run lint 2>&1 | tee /tmp/lint.log; then
        echo "❌ Lint failed"
        LINT_FAILED=true
    else
        echo "✅ Lint passed"
        LINT_FAILED=false
    fi

    # Test
    if ! npm run test:run 2>&1 | tee /tmp/test.log; then
        echo "❌ Test failed"
        TEST_FAILED=true
    else
        echo "✅ Test passed"
        TEST_FAILED=false
    fi

    # 全て成功したらループ終了
    if [ "$TYPE_CHECK_FAILED" = false ] && [ "$LINT_FAILED" = false ] && [ "$TEST_FAILED" = false ]; then
        echo "✅ 全ての品質チェックが成功しました"
        break
    fi

    # 自動修正を試行
    echo "⚙️  自動修正を試行します..."

    # Lint修正
    if [ "$LINT_FAILED" = true ]; then
        echo "🔧 Lint自動修正を実行"
        npm run lint:fix
    fi

    # 型エラー修正（簡易的な自動修正）
    if [ "$TYPE_CHECK_FAILED" = true ]; then
        echo "🔧 型エラーを分析中..."
        # 型エラーログを分析して修正案を提示
        # （実際の修正はAIによる判断が必要）
    fi

    # テスト失敗修正（実装バグの可能性）
    if [ "$TEST_FAILED" = true ]; then
        echo "🔧 テスト失敗を分析中..."
        # テストログを分析して修正案を提示
        # ⚠️ 注意: テストは仕様。仕様変更の場合のみテストを修正
    fi

    ITERATION=$((ITERATION + 1))
done

# 最大試行回数に達した場合
if [ $ITERATION -eq $MAX_ITERATIONS ]; then
    echo "❌ 自動修正ループが最大試行回数（$MAX_ITERATIONS）に達しました"
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

---

## Phase 3: 事後品質レビュー（Michi拡張）

### 目的
実装完了後、コードレビューとデザインレビュー（Frontend時）を実行。

### Step 3.1: コードレビュー（常に実行）

```markdown
## コードレビュー実行

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

### Step 3.2: デザインレビュー（Frontend検出時のみ）

```bash
# Frontend検出結果に基づいて実行
if [ "$FRONTEND_DETECTED" = true ] && [ "$SKIP_DESIGN" = false ]; then
    echo "=== Frontend変更を検出 → デザインレビューを実行 ==="
```

```markdown
Task tool:
  subagent_type: design-reviewer
  prompt: |
    Frontend実装をレビューしてください。

    **レビュー対象URL**: http://localhost:3000（開発サーバーが起動している前提）

    **レビュー観点**:
    - アクセシビリティ（WCAG 2.1）
    - レスポンシブデザイン（375px, 768px, 1280px）
    - UXパターン
    - パフォーマンス（Core Web Vitals）

    **実行手順**:
    1. Playwright MCPでページアクセス
    2. 各ブレークポイントでスクリーンショット取得
    3. アクセシビリティツリー分析
    4. コントラスト比チェック
    5. LCP/CLS測定

    **出力先**: docs/tmp/design-review-report.md
```

```bash
else
    echo "✅ Frontend変更なし → デザインレビューをスキップ"
fi
```

### Step 3.3: レビューループ（最大5回）

```bash
# レビュー結果に基づいて自動修正
REVIEW_ITERATION=0
MAX_REVIEW_ITERATIONS=5

while [ $REVIEW_ITERATION -lt $MAX_REVIEW_ITERATIONS ]; do
    echo "=== レビュー修正（試行 $((REVIEW_ITERATION + 1))/$MAX_REVIEW_ITERATIONS）==="

    # コードレビュー結果
    CODE_REVIEW_CRITICAL=$(cat /tmp/code-review.json | jq '.critical_count')

    # デザインレビュー結果（Frontend時のみ）
    if [ "$FRONTEND_DETECTED" = true ]; then
        DESIGN_REVIEW_CRITICAL=$(cat /tmp/design-review.json | jq '.critical_count')
    else
        DESIGN_REVIEW_CRITICAL=0
    fi

    # Critical問題がなければループ終了
    if [ "$CODE_REVIEW_CRITICAL" -eq 0 ] && [ "$DESIGN_REVIEW_CRITICAL" -eq 0 ]; then
        echo "✅ レビュー完了（Critical: 0）"
        break
    fi

    # 自動修正を試行
    echo "⚙️  レビュー指摘事項を自動修正中..."

    # コードレビュー指摘の修正
    # （実際の修正はAIによる判断が必要）

    # デザインレビュー指摘の修正
    # （CSS、HTML、ARIA属性の修正）

    REVIEW_ITERATION=$((REVIEW_ITERATION + 1))
done

# 最大試行回数に達した場合
if [ $REVIEW_ITERATION -eq $MAX_REVIEW_ITERATIONS ]; then
    echo "❌ レビュー修正ループが最大試行回数（$MAX_REVIEW_ITERATIONS）に達しました"
    echo ""
    echo "次のアクション:"
    echo "A) 手動で修正を続ける"
    echo "B) 残りの問題を後回しにして続行"
    echo "C) 実装を中止"

    # ユーザー確認
    read -p "どの対応を希望しますか? (A/B/C): " ACTION

    if [ "$ACTION" = "C" ]; then
        echo "実装を中止します"
        exit 1
    fi
fi
```

---

## Phase 4: 最終検証（Michi拡張）

### 目的
全品質基準の最終確認。カバレッジ95%以上、Mutation Testing（オプション）。

### Step 4.1: 品質チェック最終実行

```bash
echo "=== Phase 4: 最終検証 ==="

# Type Check
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type check failed"
    exit 1
fi

# Lint
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed"
    exit 1
fi

# Test
npm run test:run
if [ $? -ne 0 ]; then
    echo "❌ Test failed"
    exit 1
fi

# Coverage
npm run test:coverage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')

if (( $(echo "$COVERAGE < 95" | bc -l) )); then
    echo "❌ Coverage failed: ${COVERAGE}% (required: 95%)"
    exit 1
else
    echo "✅ Coverage passed: ${COVERAGE}%"
fi
```

### Step 4.2: Mutation Testing（オプション）

```bash
if [ "$MUTATION" = true ]; then
    echo "=== Mutation Testing ==="

    # 言語検出
    if [ -f "package.json" ]; then
        echo "🔍 Node.js/TypeScript detected → Stryker"
        npx stryker run
        MUTATION_SCORE=$(cat reports/mutation/mutation.json | jq '.mutationScore')

    elif [ -f "build.gradle" ]; then
        echo "🔍 Java detected → PITest"
        ./gradlew pitest
        MUTATION_SCORE=$(cat build/reports/pitest/index.html | grep -oP 'mutation score: \K[0-9]+')

    elif [ -f "pyproject.toml" ]; then
        echo "🔍 Python detected → mutmut"
        mutmut run
        MUTATION_SCORE=$(mutmut show | grep -oP 'score: \K[0-9]+')

    elif [ -f "composer.json" ]; then
        echo "🔍 PHP detected → Infection"
        ./vendor/bin/infection
        MUTATION_SCORE=$(cat infection.json | jq '.mutation_score')
    fi

    # Mutation Score判定（80%以上）
    if (( $(echo "$MUTATION_SCORE < 80" | bc -l) )); then
        echo "❌ Mutation Testing failed: ${MUTATION_SCORE}% (required: 80%)"
        exit 1
    else
        echo "✅ Mutation Testing passed: ${MUTATION_SCORE}%"
    fi
fi
```

### Step 4.3: 最終レポート出力

```bash
echo ""
echo "======================================"
echo " /michi:spec-impl 実行結果"
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

---

## 安全性ルール

### 必須確認ケース

1. **Phase 1でCritical検出時**: 必ずユーザー確認、代替案提示
2. **Phase 2で自動修正失敗時**: 最大5回試行後、ユーザー確認
3. **Phase 3でレビュー失敗時**: 最大5回修正後、ユーザー確認
4. **Phase 4でカバレッジ不足時**: 即時停止、ユーザー確認

### 禁止事項

- ❌ ユーザー確認なしでのパッケージ変更
- ❌ ユーザー確認なしでのバージョン変更
- ❌ テストの仕様変更（実装に合わせてテストを変更しない）
- ❌ Critical問題を無視して処理を続行

---

## 参考資料

### Web調査結果（ベストプラクティス）
- [TDD Best Practices 2025](https://www.nopaccelerate.com/test-driven-development-guide-2025/) - AI活用TDD
- [Parallel Testing Guide](https://www.accelq.com/blog/parallel-testing/) - 並行実行のベストプラクティス
- [AI Agent Orchestration](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - 並行実行パターン

### 関連コマンド
- `/kiro:spec-impl` - ベースコマンド（TDD実装）
- `/michi:spec-design` - 設計書生成（Phase 0.3-0.4ガイダンス付き）
- `/michi:validate-design` - 設計レビュー（テスト計画確認付き）
