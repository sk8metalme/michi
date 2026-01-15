---
name: /michi:plan-tests
description: Phase 4統合テスト計画ワークフロー（テストタイプ選択とテスト仕様書作成）
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, AskUserQuestion
argument-hint: <feature-name> [-y]
---

# Michi: テスト計画（Phase 4）

## 開発ガイドライン

{{DEV_GUIDELINES}}

## 概要

このコマンドは、Phase 4.1（テストタイプ選択）とPhase 4.2（テスト仕様書作成）を単一のガイド付きワークフローに統合します。AIが設計ドキュメントに基づいて適切なテストタイプの選択と包括的なテスト仕様書の作成を支援します。

## 前提条件

このコマンドを実行する前に、以下を確認してください：
- Phase 3（設計）が完了している
- `.michi/pj/{feature}/design.md` が存在する
- `spec.json` で `design.approved: true` になっている

## 実行手順

### Phase 4.1: テストタイプの選択

1. **設計ドキュメントの読み込み**
   - `.michi/pj/{feature}/design.md` を読み込む
   - Testing Strategy セクションを抽出
   - プロジェクト要件を分析して適切なテストタイプを決定

2. **テストタイプの推奨**
   設計分析に基づいて、適切なテストタイプを推奨：
   - **Unit Test** (単体テスト): ビジネスロジックを持つすべての機能に必須
   - **Integration Test** (統合テスト): 複数のコンポーネントが相互作用する場合に必須
   - **E2E Test**: ユーザー向け機能に必須
   - **Performance Test** (パフォーマンステスト): APIまたは高負荷機能に必須
   - **Security Test** (セキュリティテスト): 認証、認可、データ処理機能に必須

3. **ユーザー選択**
   `AskUserQuestion` を使用して、実装するテストタイプをユーザーに選択させる：

   ```markdown
   Question: "どのテストタイプを実装しますか？（複数選択可）"

   Options:
   - Unit Test (単体テスト) - 推奨
   - Integration Test (統合テスト) - 推奨
   - E2E Test - 推奨（ユーザー向け機能の場合）
   - Performance Test (パフォーマンステスト)
   - Security Test (セキュリティテスト) - 推奨（認証・認可機能の場合）
   ```

   複数選択を許可するために `multiSelect: true` を設定。

4. **選択の保存**
   `.michi/pj/{feature}/test-type-selection.json` を作成：

   ```json
   {
     "featureName": "{feature}",
     "selectedTypes": ["unit", "integration", "e2e", "performance", "security"],
     "timestamp": "2025-12-09T12:00:00Z",
     "phase": "0.3"
   }
   ```

### Phase 4.2: テスト仕様書の作成

選択された各テストタイプについて、テスト仕様書ドキュメントを作成：

1. **テンプレートの読み込み**
   以下から適切なテンプレートを読み込む：
   - Unit: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
   - Integration: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
   - E2E: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
   - Performance: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
   - Security: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

2. **設計情報の抽出**
   `design.md` から以下を抽出：
   - アーキテクチャ図
   - コンポーネントインターフェース
   - APIエンドポイント
   - データモデル
   - Testing Strategy セクション

3. **テスト仕様書の生成**
   テンプレート構造と設計情報を使用して包括的なテスト仕様書を作成：
   - テンプレートのプレースホルダーを実際の機能詳細で置き換える
   - 要件と設計に基づいて具体的なテストケースを生成
   - 要件トレーサビリティIDを含める
   - カバレッジ目標を追加（クリティカルなコードは95%、最低80%）

4. **テスト仕様書の保存**
   `.michi/pj/{feature}/test-specs/{test-type}-test-spec.md` を作成：
   - `unit-test-spec.md`
   - `integration-test-spec.md`
   - `e2e-test-spec.md`
   - `performance-test-spec.md`
   - `security-test-spec.md`

5. **spec.json の更新**
   `spec.json` のフェーズ情報を更新：

   ```json
   {
     "phase": "test-planning-completed",
     "testPlanning": {
       "phase03Completed": true,
       "phase04Completed": true,
       "testTypesSelected": ["unit", "integration", "e2e"],
       "testSpecsGenerated": ["unit", "integration", "e2e"]
     }
   }
   ```

## 出力構造

完了後、以下の構造が作成されます：

```
.michi/pj/{feature}/
├── spec.json (更新)
├── requirements.md
├── design.md
├── test-type-selection.json (NEW)
└── test-specs/ (NEW)
    ├── unit-test-spec.md
    ├── integration-test-spec.md
    ├── e2e-test-spec.md
    ├── performance-test-spec.md (オプション)
    └── security-test-spec.md (オプション)
```

## 次のステップ

テスト計画完了後、次のフェーズへユーザーをガイド：

### 推奨: 設計検証（オプション）

```bash
/michi:review-design {feature-name}
```

このコマンドは：
- 設計品質をレビュー
- **テスト計画完了を確認** ✅
- 要件トレーサビリティをチェック

### または: タスク生成に進む

```bash
/michi:create-tasks {feature-name} [-y]
```

要件、設計、テスト仕様書に基づいて実装タスクを生成します。

---

**重要:** テスト計画（Phase 4）により、タスク分割にテスト実装が適切に含まれ、包括的なTDD実装につながります。

## エラーハンドリング

- **機能が見つからない**: エラーを表示し、最初に `/michi:launch-pj` を実行するようユーザーをガイド
- **設計が承認されていない**: エラーを表示し、最初に Phase 3 を完了するようユーザーをガイド
- **テンプレート読み込み失敗**: フォールバック構造を使用し、ユーザーに警告
- **ユーザーが選択をキャンセル**: 部分的な進捗を保存し、再開を許可

---

**Michi 固有機能**: このコマンドは Phase 4（テスト計画）を統合した AI ガイド付きワークフローを提供します。
