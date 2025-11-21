# テスト計画フロー

このドキュメントでは、michiを使用したプロジェクトでのテスト計画の流れを説明します。

## Phase -1: テストタイプの選択

開発開始前に、どのテストタイプが必要かを決定します。

### テストタイプの選択基準

| テストタイプ | 実施タイミング | 必須/任意 | 選択基準 |
|------------|--------------|---------|---------|
| 単体テスト | Phase A（PR前） | **必須** | すべてのプロジェクトで実施 |
| 統合テスト | Phase B（リリース前） | **推奨** | 複数コンポーネントが連携するシステム |
| E2Eテスト | Phase B（リリース前） | **推奨** | ユーザーインターフェースを持つアプリケーション |
| パフォーマンステスト | Phase B（リリース前） | 任意 | 高負荷が予想される、レスポンスタイムが重要 |
| セキュリティテスト | Phase B（リリース前） | 任意 | 機密データを扱う、外部公開API |

### 判断フローチャート

```
[プロジェクト開始]
    ↓
単体テストは必須
    ↓
複数コンポーネントが連携する？
    YES → 統合テスト: 推奨
    NO → スキップ可能
    ↓
ユーザーインターフェースがある？
    YES → E2Eテスト: 推奨
    NO → スキップ可能
    ↓
高負荷やレスポンスタイムが重要？
    YES → パフォーマンステスト: 実施
    NO → スキップ可能
    ↓
機密データや外部公開API？
    YES → セキュリティテスト: 実施
    NO → スキップ可能
```

## Phase 0-1: テスト仕様書の作成

選択したテストタイプごとに、テスト仕様書を作成します。

### 使用するテンプレート

- **単体テスト**: `templates/test-specs/unit-test-spec-template.md`
- **統合テスト**: `templates/test-specs/integration-test-spec-template.md`
- **E2Eテスト**: `templates/test-specs/e2e-test-spec-template.md`
- **パフォーマンステスト**: `templates/test-specs/performance-test-spec-template.md`
- **セキュリティテスト**: `templates/test-specs/security-test-spec-template.md`

### 作成手順

1. テンプレートをプロジェクトの `tests/specs/` ディレクトリにコピー
2. `{{プレースホルダー}}` を実際の値に置き換え
3. テストケースを具体的に記述
4. レビューを実施

## Phase 0-2: テスト環境の準備

テスト実行に必要な環境をセットアップします。

### 単体テスト環境

```bash
# Node.js
npm install -D vitest @vitest/ui

# Java (Gradle)
# build.gradleにJUnit 5依存関係を追加
# testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'

# PHP
composer require --dev phpunit/phpunit
```

### 統合テスト/E2Eテスト環境

- テスト用データベースの準備
- 外部サービスのモック環境
- ブラウザ自動化ツール（E2Eの場合）

## Phase 0-3: テストデータの準備

テストで使用するデータを準備します。

### データ準備の原則

- **独立性**: 各テストは独立して実行可能
- **再現性**: 同じ入力で同じ結果が得られる
- **クリーンアップ**: テスト後にデータをクリーンアップ

### データ準備方法

```javascript
// Node.js例
beforeEach(async () => {
  await db.truncate('users');
  await db.seed('test-users.json');
});

afterEach(async () => {
  await db.truncate('users');
});
```

## Phase 0-4: テストコードの作成

TDDサイクルに従ってテストコードを作成します。

詳細は [tdd-cycle.md](./tdd-cycle.md) を参照してください。

### ディレクトリ構造

```
tests/
├── unit/              # 単体テスト
│   ├── services/
│   └── utils/
├── integration/       # 統合テスト
│   ├── api/
│   └── database/
├── e2e/              # E2Eテスト
│   ├── user-flows/
│   └── critical-paths/
├── performance/      # パフォーマンステスト（任意）
└── security/         # セキュリティテスト（任意）
```

## Phase 0-5: タスクへの落とし込み

テスト計画をJIRAなどの課題管理システムでタスク化します。

### タスク分割の例

| タスクID | タスク名 | 説明 | 見積もり |
|---------|---------|------|---------|
| TEST-001 | 単体テスト仕様書作成 | UserServiceの単体テスト仕様書作成 | 1日 |
| TEST-002 | 単体テスト実装 | UserServiceの全メソッドのテスト実装 | 2日 |
| TEST-003 | 統合テスト仕様書作成 | API層とDB層の統合テスト仕様書作成 | 1日 |
| TEST-004 | 統合テスト実装 | ユーザー登録APIの統合テスト実装 | 2日 |

### タスクの優先順位

1. **高優先度**: 単体テスト（Phase A必須）
2. **中優先度**: 統合テスト、E2Eテスト（Phase B推奨）
3. **低優先度**: パフォーマンス、セキュリティテスト（必要に応じて）

## チェックリスト

テスト計画が完了したら、以下をチェックしてください：

- [ ] Phase -1: 必要なテストタイプを選択した
- [ ] Phase 0-1: すべてのテストタイプの仕様書を作成した
- [ ] Phase 0-2: テスト環境をセットアップした
- [ ] Phase 0-3: テストデータを準備した
- [ ] Phase 0-4: テストコードの作成計画を立てた
- [ ] Phase 0-5: JIRAでタスクを作成した

## 次のステップ

テスト計画が完了したら、以下のドキュメントを参照して開発を進めてください：

- [TDDサイクル](./tdd-cycle.md): テスト駆動開発の実践方法
- [テスト実行フロー](./test-execution-flow.md): Phase A/Bでのテスト実行
- [テスト失敗時の対応](./test-failure-handling.md): テスト失敗時の対処方法
