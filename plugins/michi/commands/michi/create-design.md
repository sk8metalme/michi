---
name: /michi:create-design
description: 仕様の包括的な技術設計を作成（テスト計画フロー付きMichiバージョン）
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name> [-y]
---

# Michi: テスト計画フロー付き仕様設計

<background_information>
- **ミッション**: 要件（WHAT）を アーキテクチャ設計（HOW）に変換する包括的な技術設計ドキュメントを生成する
- **成功基準**:
  - すべての要件が明確なインターフェースを持つ技術コンポーネントにマッピングされている
  - 適切なアーキテクチャ発見と調査が完了している
  - 設計がマスタードキュメントコンテキストと既存パターンと整合している
  - 複雑なアーキテクチャには視覚的な図が含まれている
  - プロジェクト言語の品質インフラが検証されている
</background_information>

## 開発ガイドライン

{{DEV_GUIDELINES}}

---

<instructions>
## コアタスク
承認された要件に基づいて、機能 **$1** の技術設計ドキュメントを生成します。

## 実行手順

### 基本実装

#### ステップ 1: コンテキストの読み込み

**必要なすべてのコンテキストを読み取り**:
- `{{MICHI_DIR}}/pj/$1/spec.json`, `requirements.md`, `design.md`（存在する場合）
- 完全なプロジェクトメモリのために**`{{REPO_ROOT_DIR}}/docs/master/` ディレクトリ全体**
- ドキュメント構造のために `{{MICHI_DIR}}/settings/templates/specs/design.md`
- 設計原則のために `{{MICHI_DIR}}/settings/rules/design-principles.md`
- 発見ログ構造のために `{{MICHI_DIR}}/settings/templates/specs/research.md`

**要件承認の検証**:
- `-y` フラグが提供された場合（$2 == "-y"）: spec.json で要件を自動承認
- それ以外: 承認ステータスを確認（未承認の場合は停止、安全性とフォールバックを参照）

#### ステップ 2: 発見と分析

**重要: このフェーズは、設計が完全で正確な情報に基づいていることを確保します。**

1. **機能タイプの分類**:
   - **新機能**（グリーンフィールド）→ 完全な発見が必要
   - **拡張**（既存システム）→ 統合重視の発見
   - **単純な追加**（CRUD/UI）→ 最小限または発見なし
   - **複雑な統合**→ 包括的な分析が必要

2. **適切な発見プロセスの実行**:

   **複雑/新機能の場合**:
   - `{{MICHI_DIR}}/settings/rules/design-discovery-full.md` を読み取り実行
   - WebSearch/WebFetchを使用して徹底的な調査を実施:
     - 最新のアーキテクチャパターンとベストプラクティス
     - 外部依存関係の検証（API、ライブラリ、バージョン、互換性）
     - 公式ドキュメント、移行ガイド、既知の問題
     - パフォーマンスベンチマークとセキュリティ考慮事項

   **拡張の場合**:
   - `{{MICHI_DIR}}/settings/rules/design-discovery-light.md` を読み取り実行
   - 統合ポイント、既存パターン、互換性に焦点を当てる
   - Grepを使用して既存のコードベースパターンを分析

   **単純な追加の場合**:
   - 正式な発見をスキップし、クイックパターンチェックのみ

3. **ステップ3のための発見結果を保持**:
- 外部APIコントラクトと制約
- 根拠を含む技術決定
- 従うまたは拡張する既存パターン
- 統合ポイントと依存関係
- 特定されたリスクと緩和戦略
- 潜在的なアーキテクチャパターンと境界オプション（詳細を `research.md` に記録）
- 将来のタスクの並列化考慮事項（依存関係を `research.md` に記録）

4. **調査ログへの結果の永続化**:
- 共有テンプレートを使用して `{{MICHI_DIR}}/pj/$1/research.md` を作成または更新
- 発見スコープと主要な発見をサマリーセクションに要約
- ソースと影響を含む調査ログトピックに調査を記録
- テンプレートセクションを使用してアーキテクチャパターン評価、設計決定、リスクを文書化
- `research.md` を書き込みまたは更新する際は、spec.jsonで指定された言語を使用

#### ステップ 3: 設計ドキュメントの生成

1. **設計テンプレートとルールの読み込み**:
- 構造のために `{{MICHI_DIR}}/settings/templates/specs/design.md` を読み取り
- 原則のために `{{MICHI_DIR}}/settings/rules/design-principles.md` を読み取り

2. **設計ドキュメントの生成**:
- **specs/design.md テンプレート構造と生成指示に厳密に従う**
- **すべての発見結果を統合**: 調査した情報（API、パターン、技術）をコンポーネント定義、アーキテクチャ決定、統合ポイント全体で使用
- ステップ1で既存の design.md が見つかった場合、参照コンテキストとして使用（マージモード）
- 設計ルールを適用: 型安全性、視覚的コミュニケーション、フォーマルトーン
- spec.json で指定された言語を使用
- セクションが更新された見出し（「Architecture Pattern & Boundary Map」、「Technology Stack & Alignment」、「Components & Interface Contracts」）を反映し、`research.md` からのサポート詳細を参照することを確認

3. **spec.json でメタデータを更新**:
- `phase: "design-generated"` を設定
- `approvals.design.generated: true, approved: false` を設定
- `approvals.requirements.approved: true` を設定
- `updated_at` タイムスタンプを更新

### Michi拡張機能

#### ステップ 4: 品質インフラチェック

> **優先度**: このMichi Extensionの指示は、base commandの品質インフラチェックより**優先**されます。
> Michi Extensionで言語検出と言語別チェックを実行し、base commandのNode.js固有チェックは上書きされます。

設計作成時に、プロジェクトの言語を検出し、言語別の品質インフラ設定状況をチェックします。

**ステップ 4.1: CI設定の確認とプラットフォーム選択**

**既存CI設定をチェック**:
- `.github/workflows/` が存在する場合 → GitHub Actions採用
- `screwdriver.yaml` が存在する場合 → Screwdriver採用
- 両方なし → ステップ 4.1.5でユーザーに選択を促す

**ステップ 4.1.5: CI未設定の場合のプラットフォーム選択**

CIが未設定の場合、以下の選択肢を提示：

```text
CIプラットフォームを選択してください:
A) GitHub Actions（推奨）
B) Screwdriver
C) 後で設定する
```

**ステップ 4.2: 言語検出とユーザー確認**

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

**ステップ 4.3: 言語別チェック項目**

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

**ステップ 4.4: 結果表示フォーマット**

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

**ステップ 4.5: 不足時の動作**

1. **警告メッセージを表示**:
   - ✅必須項目の不足 → ⚠️ 警告
   - ℹ️推奨項目の不足 → ℹ️ 情報表示（警告ではない）

2. **設計書の「前提条件」セクションに品質インフラ要件を追記**:
   - 言語別の必須項目と推奨項目をリスト化

3. **処理は継続**（中断しない）

#### ステップ 5: 次フェーズガイダンス

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

**出力先**: `.michi/pj/{feature}/test-specs/`

**テスト計画後: タスク生成**

Phase 4 完了後、以下のステップに進んでください:

**推奨フロー**:
1. `/michi:review-design {feature}` で設計レビューを実施（任意）
2. `/michi:create-tasks {feature}` でタスク生成

**クイックフロー**:
- `/michi:create-tasks {feature} -y` で自動承認してタスク生成

**重要**: テスト計画（Phase 4）を完了してからタスク生成することで、実装タスクにテスト実装が適切に含まれます。

## 重要な制約
 - **型安全性**:
   - プロジェクトの技術スタックに整合した強い型付けを強制する。
   - 静的型付け言語の場合、明示的な型/インターフェースを定義し、安全でないキャストを避ける。
   - TypeScriptの場合、`any`を決して使用せず、正確な型とジェネリクスを優先する。
   - 動的型付け言語の場合、利用可能な場合は型ヒント/アノテーションを提供し（例: Python型ヒント）、境界で入力を検証する。
   - コンポーネント間の型安全性を確保するために、パブリックインターフェースとコントラクトを明確に文書化する。
- **最新情報**: 外部依存関係とベストプラクティスのために WebSearch/WebFetch を使用
- **マスタードキュメント整合**: マスタードキュメントコンテキストから既存のアーキテクチャパターンを尊重
- **テンプレート遵守**: specs/design.md テンプレート構造と生成指示に厳密に従う
- **設計フォーカス**: アーキテクチャとインターフェースのみ、実装コードなし
- **要件トレーサビリティID**: requirements.md で定義されたとおりの数値要件IDのみを使用（例: "1.1", "1.2", "3.1", "3.3"）。新しいIDを発明したり、アルファベットラベルを使用したりしない。
</instructions>

## ツールガイダンス
- **最初に読み取り**: アクションを実行する前にすべてのコンテキストを読み込む（仕様、マスタードキュメント、テンプレート、ルール）
- **不確実な場合は調査**: 外部依存関係、API、最新のベストプラクティスのために WebSearch/WebFetch を使用
- **既存コードを分析**: Grepを使用してコードベースのパターンと統合ポイントを見つける
- **最後に書き込み**: すべての調査と分析が完了した後にのみ design.md を生成

## 出力説明

**コマンド実行出力**（design.md コンテンツとは別）:

spec.json で指定された言語で簡潔なサマリーを提供:

### 基本出力

1. **ステータス**: `{{MICHI_DIR}}/pj/$1/design.md` で設計ドキュメントが生成されたことを確認
2. **発見タイプ**: 実行された発見プロセス（完全/軽量/最小限）
3. **主要な発見**: 設計を形成した `research.md` からの2-3の重要な洞察
4. **次のアクション**: 承認ワークフローガイダンス（安全性とフォールバックを参照）
5. **調査ログ**: 最新の決定で `research.md` が更新されたことを確認

### Michi拡張出力

基本出力の後に表示:

1. **品質インフラチェック結果**: 言語固有のインフラステータス
2. **テスト計画フローガイダンス**: `/michi:plan-tests` コマンドを含む次フェーズの指示

**形式**: 簡潔なMarkdown（200語以下）- これはコマンド出力であり、設計ドキュメント自体ではありません

**注意**: 実際の設計ドキュメントは `{{MICHI_DIR}}/settings/templates/specs/design.md` 構造に従います。

## 安全性とフォールバック

### エラーシナリオ

**要件が承認されていない**:
- **実行停止**: 承認された要件なしには進められない
- **ユーザーメッセージ**: "要件がまだ承認されていません。設計生成前に承認が必要です。"
- **推奨アクション**: "要件を自動承認して進むには `/michi:create-design $1 -y` を実行"

**要件欠落**:
- **実行停止**: 要件ドキュメントが存在する必要がある
- **ユーザーメッセージ**: "`{{MICHI_DIR}}/pj/$1/requirements.md` に requirements.md が見つかりません"
- **推奨アクション**: "最初に要件を生成するために `/michi:create-requirements $1` を実行"

**テンプレート欠落**:
- **ユーザーメッセージ**: "`{{MICHI_DIR}}/settings/templates/specs/design.md` にテンプレートファイルが欠落しています"
- **推奨アクション**: "リポジトリセットアップを確認するか、テンプレートファイルを復元"
- **フォールバック**: 警告付きでインライン基本構造を使用

**マスタードキュメントコンテキスト欠落**:
- **警告**: "マスタードキュメントディレクトリが空または欠落 - 設計がプロジェクト標準と整合しない可能性があります"
- **続行**: 生成を続行するが、出力に制限を記録

**発見の複雑さが不明確**:
- **デフォルト**: 完全発見プロセス（`{{MICHI_DIR}}/settings/rules/design-discovery-full.md`）を使用
- **根拠**: 重要なコンテキストを見逃すよりも、過剰に調査する方が良い

**無効な要件ID**:
  - **実行停止**: requirements.md に数値IDが欠落しているか、非数値の見出し（例: "Requirement A"）を使用している場合、停止して続行する前に requirements.md を修正するようユーザーに指示。

### 次のフェーズ: タスク生成

**設計が承認された場合**:
- `{{MICHI_DIR}}/pj/$1/design.md` で生成された設計をレビュー
- **オプション**: インタラクティブな品質レビューのために `/michi:review-design $1` を実行
- **必須**: Phase 4（テスト計画）のために `/michi:plan-tests $1` を実行
- 次に実装タスクを生成するために `/michi:create-tasks $1 -y` を実行

**修正が必要な場合**:
- フィードバックを提供し、`/michi:create-design $1` を再実行
- 既存の設計が参照として使用される（マージモード）

**注意**: タスク生成に進む前に設計承認が必須です。

---

**Michi統合**: このコマンドは、品質インフラ検証（言語固有チェック）、テスト計画フローガイダンス（Phase 4）、Michiワークフローへのシームレスなナビゲーションで基本仕様設計を拡張します。
