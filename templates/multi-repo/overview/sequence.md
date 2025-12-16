# {{PROJECT_NAME}} - シーケンス図

## プロジェクト情報

- **プロジェクト名**: {{PROJECT_NAME}}
- **JIRAキー**: {{JIRA_KEY}}
- **Confluenceスペース**: {{CONFLUENCE_SPACE}}
- **作成日時**: {{CREATED_AT}}

## 主要フローのシーケンス図

### ユーザー登録フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant DB as データベース
    
    U->>F: 登録情報を入力
    F->>B: POST /api/users
    B->>DB: ユーザー情報を保存
    DB-->>B: 保存成功
    B-->>F: ユーザーID返却
    F-->>U: 登録完了メッセージ表示
```

<!-- ユーザー登録フローを更新してください -->

### データ取得フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant DB as データベース
    participant C as キャッシュ
    
    U->>F: データリクエスト
    F->>B: GET /api/data
    B->>C: キャッシュ確認
    alt キャッシュヒット
        C-->>B: キャッシュデータ返却
    else キャッシュミス
        B->>DB: データクエリ
        DB-->>B: データ返却
        B->>C: キャッシュ保存
    end
    B-->>F: データ返却
    F-->>U: データ表示
```

<!-- データ取得フローを更新してください -->

### エラーハンドリングフロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant L as ログサービス
    
    U->>F: リクエスト送信
    F->>B: API呼び出し
    B-->>F: エラーレスポンス(500)
    F->>L: エラーログ記録
    F-->>U: エラーメッセージ表示
```

<!-- エラーハンドリングフローを更新してください -->

## 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| {{CREATED_AT}} | 1.0.0 | 初版作成 | - |
