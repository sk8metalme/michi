# Michiワークフローガイド

このドキュメントでは、Michiの開発ワークフロー全体像と各フェーズの実行方法を説明します。

## ワークフロー全体像

Michiは、cc-sdd（Spec-Driven Development Core）を拡張し、テスト計画、JIRA/Confluence連携、CI/CD統合などの機能を追加したフレームワークです。

### Phase構成

```
┌─────────────────────────────────────────────────────────────────┐
│ cc-sdd 標準フェーズ                                              │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0.0: 仕様初期化 (/kiro:spec-init)                         │
│ Phase 0.1: 要件定義 (/kiro:spec-requirements)                   │
│ Phase 0.2: 設計 (/kiro:spec-design)                             │
│ Phase 0.5: タスク分割 (/kiro:spec-tasks)                        │
│ Phase 2: TDD実装 (/kiro:spec-impl)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Michi 固有拡張フェーズ                                           │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0.3: テストタイプの選択                                    │
│ Phase 0.4: テスト仕様書の作成 (/michi:test-planning)            │
│ Phase 0.6: JIRA同期                                             │
│ Phase 0.7: Confluence同期 (/michi:confluence-sync)              │
│ Phase 1: 環境構築・基盤整備                                     │
│ Phase A: PR前の自動テスト（CI/CD）                              │
│ Phase 3: 追加の品質保証（PRマージ後）                            │
│ Phase B: リリース準備時の手動テスト                              │
│ Phase 4-5: リリース準備と実行                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 推奨ワークフロー

### 基本フロー（必須フェーズ）

```
Phase 0.0 → 0.1 → 0.2 → 0.5 → Phase 2
```

### 完全フロー（すべてのフェーズ）

```
Phase 0.0 → 0.1 → 0.2 → [0.3-0.4] → 0.5 → 0.6-0.7
  → Phase 1 → Phase 2 → Phase A → Phase 3 → Phase B → Phase 4-5
```

## Phase詳細

### Phase 0.0: 仕様初期化（必須）

**目的**: プロジェクトの仕様を初期化し、基本情報を設定

**実行コマンド**:
```bash
/kiro:spec-init "機能の説明文"
```

**実行例**:
```bash
/kiro:spec-init "計算機アプリケーション: 四則演算を行う"
```

**生成物**:
- `.kiro/specs/{feature}/spec.json` - 仕様メタデータ

### Phase 0.1: 要件定義（必須）

**目的**: 機能の要件を詳細に定義

**実行コマンド**:
```bash
/kiro:spec-requirements {feature}

# または、CLIから実行（Confluence同期付き）
michi phase:run {feature} requirements
```

**実行例**:
```bash
/kiro:spec-requirements calculator-app

# または、CLIから実行
michi phase:run calculator-app requirements
```

**処理内容**:
1. `requirements.md` の存在確認
2. Confluenceページ作成（自動）
3. バリデーション実行

**生成物**:
- `.kiro/specs/{feature}/requirements.md` - 要件定義書
- Confluence: 要件定義ページ

**承認ゲート**: PM、部長による承認

### Phase 0.2: 設計（必須）

**目的**: 技術的な設計を作成

**実行コマンド**:
```bash
# Michi推奨（Phase 0.3-0.4ガイダンス付き）
/michi:spec-design {feature}

# cc-sdd標準
/kiro:spec-design {feature}

# または、CLIから実行（Confluence同期付き）
michi phase:run {feature} design
```

**実行例**:
```bash
/michi:spec-design calculator-app

# または、CLIから実行
michi phase:run calculator-app design
```

**処理内容**:
1. `design.md` の存在確認
2. Confluenceページ作成（自動）
3. バリデーション実行
4. （Michi版のみ）テスト計画ガイダンス

**生成物**:
- `.kiro/specs/{feature}/design.md` - 設計書
- Confluence: 設計書ページ

**承認ゲート**: アーキテクト、部長による承認

### Phase 0.3-0.4: テスト計画（Michi拡張、任意）

**目的**: テストタイプを選択し、テスト仕様書を作成

**実行コマンド**:
```bash
/michi:test-planning {feature}
```

**実行例**:
```bash
/michi:test-planning calculator-app
```

**処理内容**:
1. 対話的にテストタイプを選択
2. 選択されたテストタイプの仕様書を生成

**生成物**:
- `.kiro/specs/{feature}/test-type-selection.json` - テストタイプ選択結果
- `.kiro/specs/{feature}/test-specs/unit-test-spec.md` - 単体テスト仕様書
- `.kiro/specs/{feature}/test-specs/integration-test-spec.md` - 統合テスト仕様書
- `.kiro/specs/{feature}/test-specs/e2e-test-spec.md` - E2Eテスト仕様書
- （その他、選択されたテストタイプの仕様書）

### Phase 0.5: タスク分割（必須）

**目的**: 実装タスクを分割し、JIRAと同期

**実行コマンド**:
```bash
/kiro:spec-tasks {feature}

# または、CLIから実行（JIRA同期付き）
michi phase:run {feature} tasks
```

**実行例**:
```bash
/kiro:spec-tasks calculator-app

# または、CLIから実行
michi phase:run calculator-app tasks
```

**処理内容**:
1. `tasks.md` の存在確認
2. AI-DLC形式検出・変換（必要に応じて）
3. フォーマット検証
4. JIRA Epic/Story作成（自動）
5. バリデーション実行

**生成物**:
- `.kiro/specs/{feature}/tasks.md` - タスク分割書
- JIRA: Epic、Story、Subtask

### Phase 0.6-0.7: JIRA/Confluence同期（Michi拡張、自動）

**目的**: ドキュメントをJIRAとConfluenceに同期

**実行**: Phase 0.1、0.2、0.5で自動的に実行されます

**処理内容**:
- Phase 0.1: 要件定義書をConfluenceに同期
- Phase 0.2: 設計書をConfluenceに同期
- Phase 0.5: タスクをJIRAに同期

### Phase 1: 環境構築（Michi拡張、任意）

**目的**: プロジェクトの開発環境を構築

**実行コマンド**:
```bash
michi phase:run {feature} environment-setup
```

**実行例**:
```bash
michi phase:run calculator-app environment-setup
```

**処理内容**:
1. プロジェクト検出（言語、ビルドツール、テストフレームワーク）
2. 対話的質問（言語、CI/CD、Docker Compose）
3. CI/CD設定ファイル生成
4. テスト設定ファイル生成
5. Docker Compose生成（必要な場合）
6. 依存関係インストール（オプション）

**生成物**:
- `.github/workflows/ci.yml` - CI/CD設定
- `docker-compose.yml` - Docker Compose設定（オプション）
- テスト設定ファイル（言語依存）

### Phase 2: TDD実装（必須）

**目的**: テスト駆動開発で機能を実装

**実行コマンド**:
```bash
# Michi推奨（品質自動化付き）
/michi:spec-impl {feature} [tasks]

# cc-sdd標準
/kiro:spec-impl {feature} [tasks]
```

**実行例**:
```bash
/michi:spec-impl calculator-app 1-3

# または、すべてのタスクを実装
/michi:spec-impl calculator-app
```

**処理内容**:
1. RED: テスト作成
2. GREEN: 実装
3. REFACTOR: リファクタリング
4. （Michi版のみ）品質自動化（ライセンス/バージョン監査、自動修正ループ）

### Phase A: PR前自動テスト（Michi拡張、自動）

**目的**: PR作成前に自動テストを実行

**実行**: CI/CDで自動実行されます

**実行コマンド**（手動確認用）:
```bash
michi phase:run {feature} phase-a
```

**実行例**:
```bash
michi phase:run calculator-app phase-a
```

**処理内容**（CI/CD自動実行）:
- 単体テスト実行
- Lint実行
- ビルド実行

**確認事項**:
- CI/CDパイプラインが正常に動作している
- すべての自動テストが成功している
- テストカバレッジが95%以上

### Phase 3: 追加の品質保証（Michi拡張、任意）

**目的**: PRマージ後の追加品質保証

**実行**: プロジェクト固有のニーズに応じて手動で実行

### Phase B: リリース準備テスト（Michi拡張、任意）

**目的**: リリース前の手動テストを実行

**実行コマンド**:
```bash
michi phase:run {feature} phase-b
```

**実行例**:
```bash
michi phase:run calculator-app phase-b
```

**処理内容**:
1. テストタイプ選択結果を読み込み
2. Phase B対象テスト（integration、e2e、performance、security）の実行ファイルを生成
3. チェックリストを表示

**生成物**:
- `.kiro/specs/{feature}/test-execution/integration/` - 統合テスト実行ファイル
- `.kiro/specs/{feature}/test-execution/e2e/` - E2Eテスト実行ファイル
- `.kiro/specs/{feature}/test-execution/performance/` - 性能テスト実行ファイル
- `.kiro/specs/{feature}/test-execution/security/` - セキュリティテスト実行ファイル

**手動テストチェックリスト**:
- 性能テスト実行
- セキュリティテスト実行
- 統合テスト実行
- E2Eテスト実行

### Phase 4-5: リリース準備と実行（Michi拡張、任意）

**目的**: リリースノートを作成し、リリースを実行

**実行**: プロジェクト固有のリリースフローに従って実行

## フェーズ実行方法まとめ

### AIコマンド経由（Claude Code、Cursor）

| Phase | 必須/任意 | コマンド | 備考 |
|-------|----------|---------|------|
| 0.0 | 必須 | `/kiro:spec-init "description"` | - |
| 0.1 | 必須 | `/kiro:spec-requirements {feature}` | - |
| 0.2 | 必須 | `/michi:spec-design {feature}` | Michi推奨 |
| 0.3-0.4 | 任意 | `/michi:test-planning {feature}` | Michi拡張 |
| 0.5 | 必須 | `/kiro:spec-tasks {feature}` | - |
| 2 | 必須 | `/michi:spec-impl {feature}` | Michi推奨 |

### CLI経由（Confluence/JIRA同期付き）

| Phase | 必須/任意 | コマンド | 備考 |
|-------|----------|---------|------|
| 0.1 | 必須 | `michi phase:run {feature} requirements` | Confluence同期 |
| 0.2 | 必須 | `michi phase:run {feature} design` | Confluence同期 |
| 0.5 | 必須 | `michi phase:run {feature} tasks` | JIRA同期 |
| 1 | 任意 | `michi phase:run {feature} environment-setup` | 環境構築 |
| A | 任意 | `michi phase:run {feature} phase-a` | 案内表示 |
| B | 任意 | `michi phase:run {feature} phase-b` | テスト実行ファイル生成 |

## ワークフロー統合実行

すべてのフェーズを統合実行する場合は、ワークフローオーケストレーターを使用できます。

```bash
michi workflow:run --feature {feature}
```

**実行例**:
```bash
michi workflow:run --feature calculator-app
```

**実行内容**:
1. Phase 0.1: 要件定義
2. Phase 0.2: 設計
3. Phase 0.5: タスク分割
4. Phase 2: 実装（手動ステップ）
5. テストフェーズ
6. リリースフェーズ

**承認ゲート**:
- 要件定義後: PM、部長
- 設計後: アーキテクト、部長
- リリース前: SM、部長

## 次のステップ

- [環境変数リファレンス](../reference/environment-variables.md) - 環境変数の詳細設定
- [トラブルシューティング](../troubleshooting.md) - よくある問題と解決策
- [テスト実行フロー](../user-guide/testing/test-execution-flow.md) - テストの詳細
