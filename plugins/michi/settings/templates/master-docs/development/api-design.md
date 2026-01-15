# API設計ガイドライン

<!--
このファイルは、API設計の原則とパターンを文書化します。
すべてのエンドポイントをリスト化するのではなく、設計原則、命名規則、パターンを記述します。
-->

## API設計の原則

### 設計哲学

{{API_DESIGN_PHILOSOPHY}}

### 主要原則

1. **{{API_PRINCIPLE_1}}**: {{API_PRINCIPLE_1_DESCRIPTION}}
2. **{{API_PRINCIPLE_2}}**: {{API_PRINCIPLE_2_DESCRIPTION}}
3. **{{API_PRINCIPLE_3}}**: {{API_PRINCIPLE_3_DESCRIPTION}}
4. **{{API_PRINCIPLE_4}}**: {{API_PRINCIPLE_4_DESCRIPTION}}

## APIスタイル

**スタイル**: {{API_STYLE}}
（例: RESTful、GraphQL、gRPC、WebSocket等）

**選定理由**: {{API_STYLE_RATIONALE}}

## URL設計パターン

### リソースパス

**パターン**: {{RESOURCE_PATH_PATTERN}}

**例**:
```
{{RESOURCE_PATH_EXAMPLES}}
```

### 命名規則

| 要素 | 規則 | 例 |
|------|------|-----|
| リソース名 | {{RESOURCE_NAMING_RULE}} | {{RESOURCE_NAMING_EXAMPLE}} |
| コレクション | {{COLLECTION_NAMING_RULE}} | {{COLLECTION_NAMING_EXAMPLE}} |
| アクション | {{ACTION_NAMING_RULE}} | {{ACTION_NAMING_EXAMPLE}} |
| パラメータ | {{PARAM_NAMING_RULE}} | {{PARAM_NAMING_EXAMPLE}} |

### バージョニング

**方式**: {{VERSIONING_METHOD}}
（例: URLパス、ヘッダー、クエリパラメータ）

**例**:
```
{{VERSIONING_EXAMPLE}}
```

## HTTPメソッドの使用

| メソッド | 用途 | 冪等性 | 例 |
|---------|------|--------|-----|
| GET | {{HTTP_GET_USAGE}} | Yes | {{HTTP_GET_EXAMPLE}} |
| POST | {{HTTP_POST_USAGE}} | No | {{HTTP_POST_EXAMPLE}} |
| PUT | {{HTTP_PUT_USAGE}} | Yes | {{HTTP_PUT_EXAMPLE}} |
| PATCH | {{HTTP_PATCH_USAGE}} | No | {{HTTP_PATCH_EXAMPLE}} |
| DELETE | {{HTTP_DELETE_USAGE}} | Yes | {{HTTP_DELETE_EXAMPLE}} |

## ステータスコード

### 成功レスポンス

| コード | 意味 | 使用場面 |
|-------|------|---------|
| 200 | {{HTTP_200_MEANING}} | {{HTTP_200_USAGE}} |
| 201 | {{HTTP_201_MEANING}} | {{HTTP_201_USAGE}} |
| 204 | {{HTTP_204_MEANING}} | {{HTTP_204_USAGE}} |

### クライアントエラー

| コード | 意味 | 使用場面 |
|-------|------|---------|
| 400 | {{HTTP_400_MEANING}} | {{HTTP_400_USAGE}} |
| 401 | {{HTTP_401_MEANING}} | {{HTTP_401_USAGE}} |
| 403 | {{HTTP_403_MEANING}} | {{HTTP_403_USAGE}} |
| 404 | {{HTTP_404_MEANING}} | {{HTTP_404_USAGE}} |
| 409 | {{HTTP_409_MEANING}} | {{HTTP_409_USAGE}} |
| 422 | {{HTTP_422_MEANING}} | {{HTTP_422_USAGE}} |

### サーバーエラー

| コード | 意味 | 使用場面 |
|-------|------|---------|
| 500 | {{HTTP_500_MEANING}} | {{HTTP_500_USAGE}} |
| 502 | {{HTTP_502_MEANING}} | {{HTTP_502_USAGE}} |
| 503 | {{HTTP_503_MEANING}} | {{HTTP_503_USAGE}} |

## リクエスト・レスポンス形式

### リクエストボディ

**形式**: {{REQUEST_BODY_FORMAT}}
（例: JSON、XML、FormData）

**例**:
```json
{{REQUEST_BODY_EXAMPLE}}
```

### レスポンスボディ

**形式**: {{RESPONSE_BODY_FORMAT}}

**標準構造**:
```json
{{RESPONSE_BODY_STRUCTURE}}
```

**成功レスポンス例**:
```json
{{SUCCESS_RESPONSE_EXAMPLE}}
```

**エラーレスポンス例**:
```json
{{ERROR_RESPONSE_EXAMPLE}}
```

## ページネーション

### ページネーション方式

**方式**: {{PAGINATION_METHOD}}
（例: オフセットベース、カーソルベース、ページ番号ベース）

**パラメータ**:
- `{{PAGINATION_PARAM_1}}`: {{PAGINATION_PARAM_1_DESC}}
- `{{PAGINATION_PARAM_2}}`: {{PAGINATION_PARAM_2_DESC}}
- `{{PAGINATION_PARAM_3}}`: {{PAGINATION_PARAM_3_DESC}}

**例**:
```
{{PAGINATION_EXAMPLE}}
```

**レスポンス**:
```json
{{PAGINATION_RESPONSE_EXAMPLE}}
```

## フィルタリング・ソート

### フィルタリング

**パラメータパターン**: {{FILTERING_PATTERN}}

**例**:
```
{{FILTERING_EXAMPLE}}
```

### ソート

**パラメータパターン**: {{SORTING_PATTERN}}

**例**:
```
{{SORTING_EXAMPLE}}
```

## 認証・認可

### 認証方式

**方式**: {{AUTH_METHOD}}
（例: Bearer Token、OAuth 2.0、API Key、JWT）

**ヘッダー例**:
```
{{AUTH_HEADER_EXAMPLE}}
```

### 認可パターン

{{AUTHORIZATION_PATTERN}}

## エラーハンドリング

### エラーレスポンス構造

```json
{{ERROR_STRUCTURE}}
```

### エラーコード体系

| コード | 説明 | 対応方法 |
|-------|------|---------|
| {{ERROR_CODE_1}} | {{ERROR_CODE_1_DESC}} | {{ERROR_CODE_1_ACTION}} |
| {{ERROR_CODE_2}} | {{ERROR_CODE_2_DESC}} | {{ERROR_CODE_2_ACTION}} |
| {{ERROR_CODE_3}} | {{ERROR_CODE_3_DESC}} | {{ERROR_CODE_3_ACTION}} |

### バリデーションエラー

```json
{{VALIDATION_ERROR_EXAMPLE}}
```

## レート制限

### レート制限方式

**方式**: {{RATE_LIMIT_METHOD}}

**制限値**:
- {{RATE_LIMIT_1}}: {{RATE_LIMIT_1_VALUE}}
- {{RATE_LIMIT_2}}: {{RATE_LIMIT_2_VALUE}}

**レスポンスヘッダー**:
```
{{RATE_LIMIT_HEADERS}}
```

**制限超過時のレスポンス**:
```json
{{RATE_LIMIT_EXCEEDED_RESPONSE}}
```

## キャッシング

### キャッシュ戦略

{{CACHING_STRATEGY}}

**ヘッダー例**:
```
{{CACHE_HEADERS_EXAMPLE}}
```

## APIエンドポイントパターン

<!-- すべてのエンドポイントをリスト化するのではなく、代表的なパターンを記述 -->

### パターン1: {{ENDPOINT_PATTERN_1}}

**目的**: {{ENDPOINT_PATTERN_1_PURPOSE}}

**エンドポイント例**:
```
{{ENDPOINT_PATTERN_1_EXAMPLE}}
```

**リクエスト例**:
```json
{{ENDPOINT_PATTERN_1_REQUEST}}
```

**レスポンス例**:
```json
{{ENDPOINT_PATTERN_1_RESPONSE}}
```

### パターン2: {{ENDPOINT_PATTERN_2}}

**目的**: {{ENDPOINT_PATTERN_2_PURPOSE}}

**エンドポイント例**:
```
{{ENDPOINT_PATTERN_2_EXAMPLE}}
```

**リクエスト例**:
```json
{{ENDPOINT_PATTERN_2_REQUEST}}
```

**レスポンス例**:
```json
{{ENDPOINT_PATTERN_2_RESPONSE}}
```

### パターン3: {{ENDPOINT_PATTERN_3}}

**目的**: {{ENDPOINT_PATTERN_3_PURPOSE}}

**エンドポイント例**:
```
{{ENDPOINT_PATTERN_3_EXAMPLE}}
```

**リクエスト例**:
```json
{{ENDPOINT_PATTERN_3_REQUEST}}
```

**レスポンス例**:
```json
{{ENDPOINT_PATTERN_3_RESPONSE}}
```

## セキュリティ考慮事項

<!-- 具体的な認証情報は含めない、パターンと原則のみ -->

### 入力検証

{{INPUT_VALIDATION_POLICY}}

### 出力エスケープ

{{OUTPUT_ESCAPING_POLICY}}

### CORS設定

{{CORS_POLICY}}

### HTTPS/TLS

{{HTTPS_POLICY}}

## API設計の判断

<!-- API設計に関する重要な判断とその理由を記述 -->

### {{API_DECISION_1}}

**判断内容**: {{API_DECISION_1_CONTENT}}

**理由**: {{API_DECISION_1_RATIONALE}}

**トレードオフ**: {{API_DECISION_1_TRADEOFFS}}

### {{API_DECISION_2}}

**判断内容**: {{API_DECISION_2_CONTENT}}

**理由**: {{API_DECISION_2_RATIONALE}}

**トレードオフ**: {{API_DECISION_2_TRADEOFFS}}

## API仕様書

### ドキュメント形式

**形式**: {{API_DOC_FORMAT}}
（例: OpenAPI/Swagger、API Blueprint、RAML）

**場所**: {{API_DOC_LOCATION}}

### APIテスト

{{API_TESTING_APPROACH}}

## 参照

- アーキテクチャ概要: [../core/architecture.md](../core/architecture.md)
- データモデル: [data-model.md](./data-model.md)
- シーケンス図: [../core/sequence.md](../core/sequence.md)
