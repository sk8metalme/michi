---
name: plan-tests
description: |
  テスト計画作成スキル

  テスト戦略（Phase 0.3）とテスト仕様（Phase 0.4）を作成します。
  単体・統合・E2E・パフォーマンステストの計画を立てます。

trigger_keywords:
  - "テスト計画を立てたい"
  - "テスト戦略"
  - "テスト仕様"
  - "plan-tests"
---

# plan-tests: テスト計画作成

テスト計画作成スキルは、テスト戦略（Phase 0.3）とテスト仕様（Phase 0.4）を作成します。

## 概要

このスキルは以下を実行します：

1. **設計書参照**: design.md, architecture.md を読み込んで設計を把握
2. **テスト戦略作成（Phase 0.3）**: テスト方針、テストレベル、テスト環境を定義
3. **テスト仕様作成（Phase 0.4）**: 単体・統合・E2E・パフォーマンステストの詳細仕様を作成
4. **テスト計画書生成**:
   - `docs/michi/YYYYMMDD-{pj-name}/test-plan/strategy.md`
   - `docs/michi/YYYYMMDD-{pj-name}/test-plan/unit/`
   - `docs/michi/YYYYMMDD-{pj-name}/test-plan/integration/`
   - `docs/michi/YYYYMMDD-{pj-name}/test-plan/e2e/`
   - `docs/michi/YYYYMMDD-{pj-name}/test-plan/performance/`
5. **フェーズ更新**: project.json のフェーズを `test-plan-generated` に更新

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「テスト計画を立てたい」
- 「テスト戦略を作成」
- project.json の `phase: "design-generated"` の場合に自動提案

### 明示的発動

```bash
/michi plan-tests {pj-name}
```

**例**:
```bash
/michi plan-tests user-auth
```

## 実行内容

### 1. 設計書参照

以下のファイルを読み込んで設計を把握します：
- `docs/michi/YYYYMMDD-{pj-name}/spec/design.md`
- `docs/michi/YYYYMMDD-{pj-name}/spec/architecture.md`
- `docs/michi/YYYYMMDD-{pj-name}/spec/requirements.md`

### 2. テスト戦略作成（Phase 0.3）

`docs/michi/YYYYMMDD-{pj-name}/test-plan/strategy.md` を作成します：

```markdown
# テスト戦略: {pj-name}

## テスト方針
- TDD（テスト駆動開発）を基本とする
- カバレッジ95%以上を目標
- Mutation Testing を実施（オプション）

## テストレベル

### 単体テスト（Unit Test）
- 対象: 個別の関数・クラス
- ツール: Jest / Vitest
- カバレッジ目標: 95%以上

### 統合テスト（Integration Test）
- 対象: コンポーネント間の連携
- ツール: Supertest / TestContainers
- カバレッジ目標: 80%以上

### E2Eテスト（End-to-End Test）
- 対象: ユーザーシナリオ
- ツール: Playwright / Cypress
- カバレッジ目標: 主要シナリオ100%

### パフォーマンステスト（Performance Test）
- 対象: レスポンスタイム、スループット
- ツール: k6 / Artillery
- 目標: レスポンスタイム < 200ms

## テスト環境
- ローカル: Docker Compose
- CI/CD: GitHub Actions
- ステージング: AWS ECS

## テストデータ
- テストDBは毎回リセット
- Fixture を使用してデータを準備

## 継続的インテグレーション
- すべてのテストはPR作成時に自動実行
- テスト失敗時はマージブロック
```

### 3. テスト仕様作成（Phase 0.4）

各テストレベルの詳細仕様を作成します：

#### 単体テスト仕様

`docs/michi/YYYYMMDD-{pj-name}/test-plan/unit/{feature}.md`:

```markdown
# 単体テスト仕様: {feature}

## テストケース一覧

### TC-U-001: 正常系 - ユーザー登録
- 入力: email, password
- 期待結果: ユーザーが作成され、IDが返される

### TC-U-002: 異常系 - 重複メールアドレス
- 入力: 既存のメールアドレス
- 期待結果: エラーが返される（409 Conflict）

### TC-U-003: 異常系 - 無効なメールアドレス
- 入力: 無効な形式のメールアドレス
- 期待結果: バリデーションエラーが返される
```

#### 統合テスト仕様

`docs/michi/YYYYMMDD-{pj-name}/test-plan/integration/{feature}.md`:

```markdown
# 統合テスト仕様: {feature}

## テストケース一覧

### TC-I-001: API → DB連携
- 前提: DBが起動している
- 実行: POST /api/users
- 検証: DBにユーザーが保存されている

### TC-I-002: 認証フロー
- 前提: ユーザーが登録済み
- 実行: POST /api/login
- 検証: トークンが返され、セッションが保存されている
```

#### E2Eテスト仕様

`docs/michi/YYYYMMDD-{pj-name}/test-plan/e2e/{scenario}.md`:

```markdown
# E2Eテスト仕様: ユーザー登録〜ログイン

## シナリオ

1. ユーザー登録ページにアクセス
2. メールアドレスとパスワードを入力
3. 登録ボタンをクリック
4. 確認メールを受信
5. メール内のリンクをクリック
6. ログインページにアクセス
7. 登録したメールアドレスとパスワードでログイン
8. ダッシュボードにリダイレクト

## 期待結果

- ダッシュボードに「ようこそ、{username}さん」と表示される
```

#### パフォーマンステスト仕様

`docs/michi/YYYYMMDD-{pj-name}/test-plan/performance/{api}.md`:

```markdown
# パフォーマンステスト仕様: ログインAPI

## 負荷シナリオ

- Virtual Users: 100
- Duration: 5 minutes
- Ramp-up: 30 seconds

## 目標

- レスポンスタイム（P95）: < 200ms
- エラー率: < 0.1%
- スループット: > 500 req/sec
```

### 4. フェーズ更新

project.json のフェーズを更新します：

```json
{
  "phase": "test-plan-generated",
  "updatedAt": "2026-01-17T00:00:00Z"
}
```

## 次のステップ

テスト計画が完了したら、次のステップに進みます：

### 推奨: タスク分割

`create-tasks` スキルを使用してタスクに分割します。

```bash
/michi create-tasks {pj-name}
```

または自動発動：
```
タスクに分割したい
```

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**次のスキル**: `create-tasks` - タスク分割
