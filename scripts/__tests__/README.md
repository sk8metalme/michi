# スクリプト単体テスト

## 概要

このディレクトリには、`scripts/` 内の各スクリプトの単体テストが含まれています。

## テストファイル

- `validate-phase.test.ts`: フェーズバリデーションのテスト（7テストケース）

**注**: pre-flight-check.tsとjira-sync.tsは内部関数がexportされていないため、
統合テスト（E2E）でカバーする方針としました。

## テスト実行

```bash
# すべてのテストを実行
npm test

# 特定のテストファイルのみ実行
npm test validate-phase.test.ts

# ウォッチモード（開発時）
npm test -- --watch

# カバレッジ付き
npm test -- --coverage
```

## テスト戦略

### モック化

以下のモジュールをモック化：
- `fs`: ファイルシステム操作
- `axios`: HTTP API呼び出し
- `dotenv`: 環境変数読み込み
- `./utils/project-meta.js`: プロジェクトメタデータ

### テスト方針

**単体テスト**: validate-phase.ts のみ
- ✅ 基本動作（成功ケース、Confluence未作成）
- ✅ フェーズ固有の検証（前提条件、JIRA、営業日表記）
- ✅ エッジケース（不正なフェーズ名）

**統合テスト（E2E）**: その他のスクリプト
- pre-flight-check.ts: 実際の環境で実行して確認
- jira-sync.ts: 実際のJIRA APIで動作確認
- phase-runner.ts: エンドツーエンドで動作確認

**理由**: 
- 内部関数をexportするリファクタリングは過剰
- 統合テストの方が実際の動作を保証できる
- テストのメンテナンスコストを削減

## テスト戦略の原則

### ✅ 単体テストを書くべき

- ビジネスロジック（validate-phase.ts）
- 純粋関数（引数→戻り値が明確）
- エッジケースが多い処理

### ❌ 単体テストを避けるべき

- API呼び出しが中心のスクリプト（pre-flight-check.ts、jira-sync.ts）
- 外部依存が多いスクリプト（phase-runner.ts）
- CLIラッパースクリプト

→ これらは**統合テスト（E2E）**で十分

## 統合テスト（E2E）

単体テストでカバーできないスクリプトは、統合テストとして実行：

```bash
# プリフライトチェック
npm run preflight

# フェーズ実行（実際のConfluence/JIRA API使用）
npm run phase:run test-feature requirements
npm run phase:run test-feature design
npm run phase:run test-feature tasks

# バリデーション
npm run validate:phase test-feature requirements
```

**利点**:
- 実際のAPI動作を確認できる
- モックの複雑さを回避
- メンテナンスコストが低い

## カバレッジ目標

- **validate-phase.ts**: 80%以上（単体テストでカバー）
- **その他のスクリプト**: 統合テスト（E2E）でカバー

**方針**: 過剰テストを避け、実用的なテストに絞る

