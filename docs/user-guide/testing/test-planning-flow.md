# テスト計画フロー

このドキュメントでは、michiを使用したプロジェクトでのテスト計画の流れを説明します。

## Phase 0.3: テストタイプの選択

要件定義・設計完了後、テスト仕様書作成前に、どのテストタイプが必要かを決定します。

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

## Phase 0.4: テスト仕様書の作成

Phase 0.3で選択したテストタイプごとに、テスト仕様書を作成します。

### 使用するテンプレート

- **単体テスト**: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
- **統合テスト**: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
- **E2Eテスト**: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
- **パフォーマンステスト**: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
- **セキュリティテスト**: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

### 作成手順

1. テンプレートをプロジェクトの `tests/specs/` ディレクトリにコピー
2. `{{プレースホルダー}}` を実際の値に置き換え
3. テストケースを具体的に記述
4. レビューを実施

## Phase 0.5: タスク分割 (spec-tasks)

Phase 0.4までのテスト仕様書をもとに、実装タスク一覧（tasks.md）を作成します。

tasks.mdには、Phase 1（環境構築）からPhase 5（リリース実行）までの全タスクを含めます。

## Phase 0.6: タスクのJIRA同期

Phase 0.5で作成したtasks.mdをもとに、JIRAでEpic/Story/Subtaskを作成します。

```bash
# JIRAに同期
michi jira:sync <feature>
```

自動的に：
- Epic作成: `[<project-name>] <feature>`
- Story作成: 各実装タスク（Phase 1〜5）
- Subtask作成: テスト、レビュータスク

### タスクの優先順位

1. **高優先度**: Phase 1（環境構築）、Phase 2（TDD実装）
2. **中優先度**: Phase A（PR前テスト）、Phase 3（追加QA）
3. **低優先度**: Phase B（リリース前テスト）、Phase 4-5（リリース準備）

## Phase 1: 環境構築・基盤整備

Phase 0.6までのテスト計画が完了したら、Phase 1で実装環境とテスト環境を整備します。

### 実施内容

- プロジェクト初期化
- 依存関係インストール（FastAPI, SQLAlchemy, pytest等）
- DB接続設定
- テスト環境の準備（pytest, vitest, JUnit等）
- テストデータの準備（fixtures, seed等）

### 単体テスト環境のセットアップ例

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

### テストデータの準備

**データ準備の原則:**
- **独立性**: 各テストは独立して実行可能
- **再現性**: 同じ入力で同じ結果が得られる
- **クリーンアップ**: テスト後にデータをクリーンアップ

**データ準備方法:**

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

### テストディレクトリ構造

```
tests/
├── specs/            # テスト仕様書（Phase 0.4で作成）
│   ├── unit-test-spec.md
│   ├── integration-test-spec.md
│   └── e2e-test-spec.md
├── unit/             # 単体テスト（Phase 2で作成）
│   ├── services/
│   └── utils/
├── integration/      # 統合テスト（Phase 2で作成、必要に応じて）
│   ├── api/
│   └── database/
├── e2e/              # E2Eテスト（Phase 2で作成、必要に応じて）
│   ├── user-flows/
│   └── critical-paths/
├── performance/      # パフォーマンステスト（Phase 2で作成、任意）
└── security/         # セキュリティテスト（Phase 2で作成、任意）
```

## チェックリスト

テスト計画と環境構築が完了したら、以下をチェックしてください：

- [ ] Phase 0.3: 必要なテストタイプを選択した
- [ ] Phase 0.4: すべてのテストタイプの仕様書を作成した
- [ ] Phase 0.5: tasks.mdを作成した
- [ ] Phase 0.6: JIRAでEpic/Story/Subtaskを作成した
- [ ] Phase 1: テスト環境をセットアップした
- [ ] Phase 1: テストデータ準備の仕組みを実装した
- [ ] Phase 1: テストディレクトリ構造を作成した

## 次のステップ

Phase 1（環境構築）が完了したら、Phase 2（TDD実装）に進んでください：

- [TDDサイクル](./tdd-cycle.md): Phase 2でのテスト駆動開発の実践方法
- [テスト実行フロー](./test-execution-flow.md): Phase A/B/3でのテスト実行
- [テスト失敗時の対応](./test-failure-handling.md): テスト失敗時の対処方法
- [ワークフローガイド](../guides/workflow.md): Phase 0.0〜Phase 5の全体像
