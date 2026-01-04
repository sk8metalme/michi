---
name: /michi:spec-tasks
description: Generate implementation tasks with JIRA sync option (Michi version)
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, Bash
argument-hint: <feature-name> [-y] [--sequential]
---

# Michi: Spec Tasks with JIRA Sync Option

## Base Command Reference
@.claude/commands/kiro/spec-tasks.md

## Development Guidelines
{{DEV_GUIDELINES}}

---

## Michi Extension: Quality Infrastructure Check

> **優先度**: このMichi Extensionの指示は、base command（kiro版）の品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

タスク生成前に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

### Step 1: CI設定の確認とプラットフォーム選択

（spec-design.md と同様の手順）

### Step 2: 言語検出とユーザー確認

（spec-design.md と同様の手順）

### Step 3: 言語別チェック項目

```text
（spec-design.md と同様のチェック項目表を参照）
```

### Step 4: 結果表示フォーマット

```text
（spec-design.md と同様の出力フォーマットを参照）
```

### Step 5: 不足時の動作

1. **警告メッセージを表示**
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **tasks.md の先頭に言語別の品質インフラセットアップタスクを自動追加**

3. **処理は継続**（タスク生成を実行）

### 言語別の自動追加タスク

#### Node.js の場合

```markdown
## Quality Infrastructure Setup (Auto-added)

> ⚠️ このタスクは品質インフラチェックにより自動追加されました

以下の品質インフラが未設定です。実装前にセットアップを推奨：

**必須**:
- [ ] husky + lint-staged のセットアップ
- [ ] TypeScript strict mode の有効化 (tsconfig.json)
- [ ] CI の設定 (GitHub Actions or Screwdriver)

**推奨**:
- [ ] ts-arch-kit でアーキテクチャテスト追加

### セットアップ手順

#### husky + lint-staged
```bash
npm install --save-dev husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

package.jsonに以下を追加:
```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

#### TypeScript strict mode
`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

#### ts-arch-kit
```bash
npm install --save-dev ts-arch-kit
```

`vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    include: ['**/*.arch.test.ts']
  }
});
```

#### Java の場合

```markdown
## Quality Infrastructure Setup (Auto-added)

> ⚠️ このタスクは品質インフラチェックにより自動追加されました

以下の品質インフラが未設定です。実装前にセットアップを推奨：

**必須**:
- [ ] Checkstyle/PMD の設定
- [ ] NullAway + Error Prone の設定 (Gradle/Maven)
- [ ] CI の設定 (GitHub Actions or Screwdriver)

**推奨**:
- [ ] Spotless プラグインの設定 (フォーマット)
- [ ] ArchUnit でアーキテクチャテスト追加

### セットアップ手順

#### Checkstyle (Gradle)
`build.gradle`:
```groovy
plugins {
    id 'checkstyle'
}

checkstyle {
    toolVersion = '10.12.0'
    configFile = file("config/checkstyle/checkstyle.xml")
}
```

#### NullAway + Error Prone (Gradle)
`build.gradle`:
```groovy
plugins {
    id 'net.ltgt.errorprone' version '3.1.0'
}

dependencies {
    errorprone 'com.google.errorprone:error_prone_core:2.23.0'
    errorprone 'com.uber.nullaway:nullaway:0.10.15'
}

tasks.withType(JavaCompile).configureEach {
    options.errorprone {
        check("NullAway", CheckSeverity.ERROR)
        option("NullAway:AnnotatedPackages", "com.yourcompany")
    }
}
```

#### ArchUnit
`build.gradle`:
```groovy
dependencies {
    testImplementation 'com.tngtech.archunit:archunit-junit5:1.2.0'
}
```

#### Spotless (オプション)
`build.gradle`:
```groovy
plugins {
    id 'com.diffplug.spotless' version '6.23.0'
}

spotless {
    java {
        googleJavaFormat()
    }
}
```

#### Python の場合

```markdown
## Quality Infrastructure Setup (Auto-added)

> ⚠️ このタスクは品質インフラチェックにより自動追加されました

以下の品質インフラが未設定です。実装前にセットアップを推奨：

**必須**:
- [ ] ruff または black の設定 (pyproject.toml)
- [ ] CI の設定 (GitHub Actions or Screwdriver)

**推奨**:
- [ ] pre-commit framework のセットアップ
- [ ] mypy strict mode の設定
- [ ] import-linter でインポート制約検証

### セットアップ手順

#### ruff
`pyproject.toml`:
```toml
[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "W", "I", "N"]

[tool.ruff.lint]
ignore = []
```

#### mypy strict
`pyproject.toml`:
```toml
[tool.mypy]
strict = true
warn_return_any = true
warn_unused_configs = true
```

#### import-linter
`pyproject.toml`:
```toml
[tool.importlinter]
root_package = "your_package"

[[tool.importlinter.contracts]]
name = "Layer dependencies"
type = "layers"
layers = [
    "presentation",
    "application",
    "domain",
]
```

#### pre-commit
`.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

#### PHP の場合

```markdown
## Quality Infrastructure Setup (Auto-added)

> ⚠️ このタスクは品質インフラチェックにより自動追加されました

以下の品質インフラが未設定です。実装前にセットアップを推奨：

**必須**:
- [ ] PHPStan の設定 (phpstan.neon, level=max推奨)
- [ ] CI の設定 (GitHub Actions or Screwdriver)

**推奨**:
- [ ] GrumPHP または Captain Hook のセットアップ
- [ ] deptrac でレイヤー依存検証

### セットアップ手順

#### PHPStan
`phpstan.neon`:
```neon
parameters:
    level: max
    paths:
        - src
        - tests
```

`composer.json`:
```json
{
  "require-dev": {
    "phpstan/phpstan": "^1.10"
  },
  "scripts": {
    "phpstan": "phpstan analyse"
  }
}
```

#### deptrac
`deptrac.yaml`:
```yaml
deptrac:
  paths:
    - ./src
  layers:
    - name: Presentation
      collectors:
        - type: className
          regex: .*\\Presentation\\.*
    - name: Application
      collectors:
        - type: className
          regex: .*\\Application\\.*
    - name: Domain
      collectors:
        - type: className
          regex: .*\\Domain\\.*
  ruleset:
    Presentation:
      - Application
    Application:
      - Domain
    Domain: []
```

#### GrumPHP (オプション)
`grumphp.yml`:
```yaml
grumphp:
  tasks:
    phpstan:
      level: max
    composer_normalize: ~
```

---

## Michi Extension: JIRA Sync Prompt

このコマンドは cc-sdd 標準の `/kiro:spec-tasks` を拡張し、タスク生成完了後にJIRA同期オプションを提示します。

### 機能追加内容

1. **タスク生成完了後の次ステップ案内**:
   - JIRA連携が設定されている場合: JIRA同期の選択肢（A/B/C形式）を表示
   - JIRA連携が未設定の場合: 実装フェーズへの案内 + JIRA設定ヒントを表示

2. **環境変数による条件分岐**:
   - 以下の環境変数がすべて設定されている場合のみ、JIRA同期の選択肢を表示
   - `ATLASSIAN_URL`
   - `ATLASSIAN_EMAIL`
   - `ATLASSIAN_API_TOKEN`

---

## タスク生成完了後のフロー

基底コマンド `/kiro:spec-tasks` によるタスク生成が完了した後、以下のフローを実行してください:

### Step 1: 環境変数チェック

```bash
# JIRA連携の環境変数をチェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    JIRA_CONFIGURED=true
else
    JIRA_CONFIGURED=false
fi
```

### Step 2a: JIRA連携が設定されている場合の表示

`JIRA_CONFIGURED=true` の場合、以下のメッセージと選択肢を表示:

```text
============================================
 タスク生成完了 - JIRA同期オプション
============================================

次のアクション:
A) JIRAにタスクを同期する（推奨: タスク管理を一元化）
   → `michi jira:sync {{FEATURE_NAME}}` を実行

B) JIRAへの同期をスキップして実装に進む
   → `/michi:spec-impl {{FEATURE_NAME}}` を実行

C) 何もせずにこのまま終了する

選択 (A/B/C): _
```

**選択肢の説明**:
- **A**: Epic/Story/Subtaskを自動作成し、タスクをJIRAに同期します
- **B**: JIRA同期をスキップして直接TDD実装フェーズに進みます
- **C**: タスク生成のみで終了し、ユーザーが手動で次のステップを選択します

### Step 2b: JIRA連携が未設定の場合の表示

`JIRA_CONFIGURED=false` の場合、以下のメッセージを表示:

```text
============================================
 タスク生成完了
============================================

次のステップ:
→ `/michi:spec-impl {{FEATURE_NAME}}` で実装を開始

---
ℹ️ ヒント: JIRA連携を使用すると、タスクを自動的にJIRAに同期できます。

設定方法: 以下の環境変数を .env に追加してください:
   - ATLASSIAN_URL=https://your-domain.atlassian.net
   - ATLASSIAN_EMAIL=your-email@company.com
   - ATLASSIAN_API_TOKEN=your-api-token

詳細はドキュメントを参照: docs/guides/atlassian-integration.md
```

---

## Michi Extension: Task Diff Size Guidelines

タスク分割時に、各サブタスクの git diff サイズを考慮してください。

### 推奨サイズ
- **目標**: 各サブタスクで 200-400 行の diff
- **最大**: 500 行まで（超過時は分割を検討）
- **警告**: 400行超過時は分割を推奨

### 除外対象ファイル（行数カウント対象外）
- **ロックファイル**: package-lock.json, yarn.lock, pnpm-lock.yaml, composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock, Cargo.lock, go.sum
- **自動生成ファイル**: *.min.js, *.min.css, *.map, dist/*, build/*, coverage/*, .next/*, *.d.ts, *.generated.ts, __snapshots__/*

### 分割戦略

タスクが大きすぎる場合の分割方法:

1. **水平分割（レイヤー別）**
   - model/repository → service/logic → controller/handler
   - 例: 「User CRUD」→「User model作成」「User service作成」「User controller作成」

2. **垂直分割（機能スライス別）**
   - core機能 → validation → error handling → edge cases
   - 例: 「認証機能」→「ログインcore」「バリデーション追加」「エラーハンドリング」

3. **フェーズ分割（段階別）**
   - 基本実装 → テスト追加 → 最適化
   - 例: 「検索機能」→「基本検索」「フィルター追加」「パフォーマンス最適化」

### タスク生成時の確認事項

タスク分割完了後、以下を確認してください:

- [ ] 各サブタスクの予想diff行数が500行以内か
- [ ] 大きなサブタスクは適切に分割されているか
- [ ] ロックファイルや自動生成ファイルを含むタスクはその旨が明記されているか

---

## 実装上の注意点

1. **基底コマンドの実行結果を維持**:
   - `/kiro:spec-tasks` の「Output Description」セクションで出力されるタスクサマリーは維持してください
   - Michi Extensionの選択肢はその**後**に追加で表示します

2. **言語設定の考慮**:
   - メッセージは日本語固定（将来的にspec.jsonの言語設定に対応する可能性あり）

3. **ユーザーインタラクション**:
   - 選択肢を表示した後、ユーザーの入力を待ちます
   - 選択に応じて適切なコマンド/処理を案内または実行してください

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-tasks` を拡張し、Phase 0.6（JIRA同期）への誘導を Next Phase として案内します。また、タスク粒度ガイドライン（git diff 500行制限）を提供し、適切なタスク分割を支援します。
