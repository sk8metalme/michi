# データモデル定義

<!--
このファイルは、データモデルとスキーマ設計の原則を文書化します。
すべてのテーブルやフィールドをリスト化するのではなく、データモデルのパターンと設計原則を記述します。
-->

## データモデリングの原則

### 設計哲学

{{DATA_MODEL_PHILOSOPHY}}

### 主要原則

1. **{{DATA_PRINCIPLE_1}}**: {{DATA_PRINCIPLE_1_DESCRIPTION}}
2. **{{DATA_PRINCIPLE_2}}**: {{DATA_PRINCIPLE_2_DESCRIPTION}}
3. **{{DATA_PRINCIPLE_3}}**: {{DATA_PRINCIPLE_3_DESCRIPTION}}
4. **{{DATA_PRINCIPLE_4}}**: {{DATA_PRINCIPLE_4_DESCRIPTION}}

## データベース構成

### データベース種別

| 用途 | データベース | 選定理由 |
|------|------------|---------|
| {{DB_PURPOSE_1}} | {{DB_TECH_1}} | {{DB_RATIONALE_1}} |
| {{DB_PURPOSE_2}} | {{DB_TECH_2}} | {{DB_RATIONALE_2}} |
| {{DB_PURPOSE_3}} | {{DB_TECH_3}} | {{DB_RATIONALE_3}} |

## エンティティ関係図（ER図）

### コアドメインモデル

```mermaid
erDiagram
    {{ENTITY_1}} ||--o{ {{ENTITY_2}} : {{RELATIONSHIP_1}}
    {{ENTITY_2}} ||--o{ {{ENTITY_3}} : {{RELATIONSHIP_2}}
    {{ENTITY_1}} ||--o{ {{ENTITY_4}} : {{RELATIONSHIP_3}}
    {{ENTITY_3}} }o--|| {{ENTITY_5}} : {{RELATIONSHIP_4}}

    {{ENTITY_1}} {
        {{FIELD_1_1_TYPE}} {{FIELD_1_1_NAME}} PK
        {{FIELD_1_2_TYPE}} {{FIELD_1_2_NAME}}
        {{FIELD_1_3_TYPE}} {{FIELD_1_3_NAME}}
        {{FIELD_1_4_TYPE}} {{FIELD_1_4_NAME}}
    }

    {{ENTITY_2}} {
        {{FIELD_2_1_TYPE}} {{FIELD_2_1_NAME}} PK
        {{FIELD_2_2_TYPE}} {{FIELD_2_2_NAME}} FK
        {{FIELD_2_3_TYPE}} {{FIELD_2_3_NAME}}
        {{FIELD_2_4_TYPE}} {{FIELD_2_4_NAME}}
    }

    {{ENTITY_3}} {
        {{FIELD_3_1_TYPE}} {{FIELD_3_1_NAME}} PK
        {{FIELD_3_2_TYPE}} {{FIELD_3_2_NAME}} FK
        {{FIELD_3_3_TYPE}} {{FIELD_3_3_NAME}}
        {{FIELD_3_4_TYPE}} {{FIELD_3_4_NAME}}
    }
```

**説明**:
- **{{ENTITY_1}}**: {{ENTITY_1_DESCRIPTION}}
- **{{ENTITY_2}}**: {{ENTITY_2_DESCRIPTION}}
- **{{ENTITY_3}}**: {{ENTITY_3_DESCRIPTION}}
- **{{RELATIONSHIP_1}}**: {{RELATIONSHIP_1_DESCRIPTION}}
- **{{RELATIONSHIP_2}}**: {{RELATIONSHIP_2_DESCRIPTION}}

## エンティティパターン

<!-- すべてのテーブルをリスト化するのではなく、代表的なパターンを記述 -->

### パターン1: {{ENTITY_PATTERN_1}}

**目的**: {{ENTITY_PATTERN_1_PURPOSE}}

**スキーマ例**:
```sql
{{ENTITY_PATTERN_1_SCHEMA}}
```

**フィールド説明**:
- `{{FIELD_1}}`: {{FIELD_1_DESC}}
- `{{FIELD_2}}`: {{FIELD_2_DESC}}
- `{{FIELD_3}}`: {{FIELD_3_DESC}}

**インデックス戦略**:
{{ENTITY_PATTERN_1_INDEX_STRATEGY}}

### パターン2: {{ENTITY_PATTERN_2}}

**目的**: {{ENTITY_PATTERN_2_PURPOSE}}

**スキーマ例**:
```sql
{{ENTITY_PATTERN_2_SCHEMA}}
```

**フィールド説明**:
- `{{FIELD_4}}`: {{FIELD_4_DESC}}
- `{{FIELD_5}}`: {{FIELD_5_DESC}}
- `{{FIELD_6}}`: {{FIELD_6_DESC}}

**インデックス戦略**:
{{ENTITY_PATTERN_2_INDEX_STRATEGY}}

### パターン3: {{ENTITY_PATTERN_3}}

**目的**: {{ENTITY_PATTERN_3_PURPOSE}}

**スキーマ例**:
```sql
{{ENTITY_PATTERN_3_SCHEMA}}
```

**フィールド説明**:
- `{{FIELD_7}}`: {{FIELD_7_DESC}}
- `{{FIELD_8}}`: {{FIELD_8_DESC}}
- `{{FIELD_9}}`: {{FIELD_9_DESC}}

**インデックス戦略**:
{{ENTITY_PATTERN_3_INDEX_STRATEGY}}

## 命名規則

### テーブル命名

| 規則 | 説明 | 例 |
|------|------|-----|
| {{TABLE_NAMING_RULE_1}} | {{TABLE_NAMING_RULE_1_DESC}} | {{TABLE_NAMING_EXAMPLE_1}} |
| {{TABLE_NAMING_RULE_2}} | {{TABLE_NAMING_RULE_2_DESC}} | {{TABLE_NAMING_EXAMPLE_2}} |
| {{TABLE_NAMING_RULE_3}} | {{TABLE_NAMING_RULE_3_DESC}} | {{TABLE_NAMING_EXAMPLE_3}} |

### カラム命名

| 規則 | 説明 | 例 |
|------|------|-----|
| {{COLUMN_NAMING_RULE_1}} | {{COLUMN_NAMING_RULE_1_DESC}} | {{COLUMN_NAMING_EXAMPLE_1}} |
| {{COLUMN_NAMING_RULE_2}} | {{COLUMN_NAMING_RULE_2_DESC}} | {{COLUMN_NAMING_EXAMPLE_2}} |
| {{COLUMN_NAMING_RULE_3}} | {{COLUMN_NAMING_RULE_3_DESC}} | {{COLUMN_NAMING_EXAMPLE_3}} |

### インデックス命名

| 規則 | 説明 | 例 |
|------|------|-----|
| {{INDEX_NAMING_RULE_1}} | {{INDEX_NAMING_RULE_1_DESC}} | {{INDEX_NAMING_EXAMPLE_1}} |
| {{INDEX_NAMING_RULE_2}} | {{INDEX_NAMING_RULE_2_DESC}} | {{INDEX_NAMING_EXAMPLE_2}} |

## データ型規約

### 標準データ型

| 用途 | データ型 | 理由 |
|------|---------|------|
| {{DATA_TYPE_PURPOSE_1}} | {{DATA_TYPE_1}} | {{DATA_TYPE_RATIONALE_1}} |
| {{DATA_TYPE_PURPOSE_2}} | {{DATA_TYPE_2}} | {{DATA_TYPE_RATIONALE_2}} |
| {{DATA_TYPE_PURPOSE_3}} | {{DATA_TYPE_3}} | {{DATA_TYPE_RATIONALE_3}} |
| {{DATA_TYPE_PURPOSE_4}} | {{DATA_TYPE_4}} | {{DATA_TYPE_RATIONALE_4}} |
| {{DATA_TYPE_PURPOSE_5}} | {{DATA_TYPE_5}} | {{DATA_TYPE_RATIONALE_5}} |

### 共通フィールド

<!-- すべてのテーブルに共通するフィールドパターン -->

```sql
{{COMMON_FIELDS_EXAMPLE}}
```

**説明**:
- `{{COMMON_FIELD_1}}`: {{COMMON_FIELD_1_DESC}}
- `{{COMMON_FIELD_2}}`: {{COMMON_FIELD_2_DESC}}
- `{{COMMON_FIELD_3}}`: {{COMMON_FIELD_3_DESC}}
- `{{COMMON_FIELD_4}}`: {{COMMON_FIELD_4_DESC}}

## リレーションシップパターン

### 1対多（One-to-Many）

**パターン**: {{ONE_TO_MANY_PATTERN}}

**例**:
```sql
{{ONE_TO_MANY_EXAMPLE}}
```

### 多対多（Many-to-Many）

**パターン**: {{MANY_TO_MANY_PATTERN}}

**例**:
```sql
{{MANY_TO_MANY_EXAMPLE}}
```

### 自己参照（Self-Referencing）

**パターン**: {{SELF_REFERENCING_PATTERN}}

**例**:
```sql
{{SELF_REFERENCING_EXAMPLE}}
```

## インデックス戦略

### インデックスの原則

1. **{{INDEX_PRINCIPLE_1}}**: {{INDEX_PRINCIPLE_1_DESC}}
2. **{{INDEX_PRINCIPLE_2}}**: {{INDEX_PRINCIPLE_2_DESC}}
3. **{{INDEX_PRINCIPLE_3}}**: {{INDEX_PRINCIPLE_3_DESC}}

### 複合インデックス

**パターン**: {{COMPOSITE_INDEX_PATTERN}}

**例**:
```sql
{{COMPOSITE_INDEX_EXAMPLE}}
```

### 部分インデックス

**パターン**: {{PARTIAL_INDEX_PATTERN}}

**例**:
```sql
{{PARTIAL_INDEX_EXAMPLE}}
```

## パフォーマンス考慮事項

### クエリ最適化

{{QUERY_OPTIMIZATION_STRATEGY}}

### パーティショニング

{{PARTITIONING_STRATEGY}}

### レプリケーション

{{REPLICATION_STRATEGY}}

## データ整合性

### 制約

| 制約種別 | 使用方針 | 例 |
|---------|---------|-----|
| PRIMARY KEY | {{PK_POLICY}} | {{PK_EXAMPLE}} |
| FOREIGN KEY | {{FK_POLICY}} | {{FK_EXAMPLE}} |
| UNIQUE | {{UNIQUE_POLICY}} | {{UNIQUE_EXAMPLE}} |
| CHECK | {{CHECK_POLICY}} | {{CHECK_EXAMPLE}} |
| NOT NULL | {{NOT_NULL_POLICY}} | {{NOT_NULL_EXAMPLE}} |

### トランザクション分離レベル

**デフォルトレベル**: {{ISOLATION_LEVEL}}

**理由**: {{ISOLATION_LEVEL_RATIONALE}}

## データマイグレーション

### マイグレーション戦略

{{MIGRATION_STRATEGY}}

### バージョン管理

{{SCHEMA_VERSION_CONTROL}}

### ロールバック戦略

{{ROLLBACK_STRATEGY}}

## データライフサイクル

### データ保持ポリシー

{{DATA_RETENTION_POLICY}}

### アーカイブ戦略

{{ARCHIVING_STRATEGY}}

### 削除ポリシー

{{DELETION_POLICY}}

## セキュリティとプライバシー

<!-- 具体的な認証情報は含めない、ポリシーとパターンのみ -->

### データ暗号化

{{DATA_ENCRYPTION_POLICY}}

### アクセス制御

{{DATA_ACCESS_CONTROL}}

### 個人情報保護

{{PII_PROTECTION_POLICY}}

## データモデルの判断

<!-- データモデルに関する重要な判断とその理由を記述 -->

### {{DATA_DECISION_1}}

**判断内容**: {{DATA_DECISION_1_CONTENT}}

**理由**: {{DATA_DECISION_1_RATIONALE}}

**トレードオフ**: {{DATA_DECISION_1_TRADEOFFS}}

### {{DATA_DECISION_2}}

**判断内容**: {{DATA_DECISION_2_CONTENT}}

**理由**: {{DATA_DECISION_2_RATIONALE}}

**トレードオフ**: {{DATA_DECISION_2_TRADEOFFS}}

## スキーマドキュメント

### ドキュメント場所

{{SCHEMA_DOC_LOCATION}}

### ER図生成

{{ER_DIAGRAM_GENERATION}}

## 参照

- アーキテクチャ概要: [../core/architecture.md](../core/architecture.md)
- API設計: [api-design.md](./api-design.md)
- シーケンス図: [../core/sequence.md](../core/sequence.md)
