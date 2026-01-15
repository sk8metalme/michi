# {{FEATURE_NAME}} - 統合テスト仕様書

## テスト情報

- **機能名**: {{FEATURE_NAME}}
- **作成日時**: {{CREATED_AT}}
- **テストタイプ**: 統合テスト（Integration Test）

## テスト目的

<!-- このテストで検証したい内容を記述してください -->
- 複数のコンポーネント・モジュール間の連携が正常に動作することを確認
- API エンドポイントとデータベースの統合動作を検証
- 外部サービスとの連携を確認

## テスト対象

### 統合テスト範囲

<!-- テスト対象の連携フローを記述してください -->

```mermaid
graph LR
    A[APIエンドポイント] --> B[ビジネスロジック]
    B --> C[データアクセス層]
    C --> D[データベース]
```

| コンポーネントA | コンポーネントB | 連携方式 |
|--------------|--------------|---------|
| API Controller | User Service | 関数呼び出し |
| User Service | Database Repository | ORM |
| Auth Service | External OAuth Provider | HTTP/REST |

## テストケース

### API 統合テスト

| テストケースID | テストシナリオ | 前提条件 | 実行ステップ | 期待結果 | 優先度 |
|--------------|-------------|---------|-----------|---------|-------|
| IT-001 | ユーザー登録API（正常系） | DBが空の状態 | 1. POST /api/users<br>2. リクエストボディに有効なデータ | 201 Created<br>ユーザーがDBに保存される | 高 |
| IT-002 | ユーザーログインAPI | ユーザーが登録済み | 1. POST /api/auth/login<br>2. 正しい認証情報を送信 | 200 OK<br>JWT トークンを返却 | 高 |

### データベース統合テスト

| テストケースID | テストシナリオ | 前提条件 | 実行ステップ | 期待結果 | 優先度 |
|--------------|-------------|---------|-----------|---------|-------|
| IT-101 | トランザクション処理（正常） | DBが正常動作 | 1. BEGIN<br>2. INSERT<br>3. UPDATE<br>4. COMMIT | 全ての変更がコミットされる | 高 |
| IT-102 | ト ランザクションロールバック | DBが正常動作 | 1. BEGIN<br>2. INSERT<br>3. エラー発生<br>4. ROLLBACK | 全ての変更が取り消される | 高 |

### 外部サービス統合テスト

| テストケースID | テストシナリオ | 前提条件 | 実行ステップ | 期待結果 | 優先度 |
|--------------|-------------|---------|-----------|---------|-------|
| IT-201 | OAuth認証フロー | OAuth Provider が動作中 | 1. 認証リクエスト<br>2. リダイレクト<br>3. トークン取得 | 正常に認証が完了 | 高 |
| IT-202 | 外部API呼び出し | 外部APIが動作中 | 1. APIリクエスト送信<br>2. レスポンス受信 | 正常にデータ取得 | 中 |

## テストデータ

### データベース初期状態

```sql
-- テストユーザー
INSERT INTO users (id, name, email, created_at) VALUES
(1, 'テストユーザー1', 'test1@example.com', '2024-01-01 00:00:00'),
(2, 'テストユーザー2', 'test2@example.com', '2024-01-02 00:00:00');

-- テストデータ削除
TRUNCATE TABLE users CASCADE;
```

### APIリクエストサンプル

```json
{
  "user": {
    "name": "山田太郎",
    "email": "taro@example.com",
    "password": "SecureP@ssw0rd"
  }
}
```

## テスト環境構成

### インフラストラクチャ

- **データベース**: PostgreSQL 15.x（テスト専用インスタンス）
- **APIサーバー**: Node.js 20.x + Express / Fastify
- **外部サービスモック**: WireMock / MSW

### 環境変数

```bash
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
API_BASE_URL=http://localhost:3000
EXTERNAL_API_URL=http://mock-server:8080
```

## セットアップ・クリーンアップ

### テスト前処理（Setup）

```bash
# データベースマイグレーション実行
npm run db:migrate:test

# テストデータ投入
npm run db:seed:test

# モックサーバー起動
npm run mock:start
```

### テスト後処理（Teardown）

```bash
# テストデータ削除
npm run db:clean:test

# モックサーバー停止
npm run mock:stop
```

## 前提条件

- [ ] テスト用データベースのセットアップ
- [ ] 外部サービスモックの準備
- [ ] API サーバーの起動
- [ ] 必要な環境変数の設定

## 実行環境

- **テストフレームワーク**: Jest / Supertest / TestContainers
- **データベース**: PostgreSQL / MySQL（テスト専用）
- **モックツール**: WireMock / Nock / MSW
- **CI環境**: GitHub Actions

## 期待される成功基準

- [ ] 全テストケースがパス
- [ ] APIレスポンスタイムが許容範囲内（< 500ms）
- [ ] データベーストランザクションが正常に動作
- [ ] 外部サービス連携が正常に動作
- [ ] カバレッジ目標達成（85%以上）

## 変更履歴

| 日付 | 変更者 | 変更内容 |
|------|-------|---------|
| {{CREATED_AT}} | - | 初版作成 |
