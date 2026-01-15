# シーケンス図

<!--
このファイルは、システムの主要なフローをシーケンス図で文書化します。
すべてのフローを網羅するのではなく、重要なユースケースとビジネスロジックを理解するための代表的なフローを記述します。
-->

## シーケンス図の目的

このドキュメントでは、{{PROJECT_NAME}}の主要なフローをシーケンス図で可視化します。

**フォーカス**:
- コアビジネスロジックのフロー
- 複数コンポーネント間の相互作用
- エラーハンドリングとリトライロジック
- 外部システムとの統合

## 主要フロー1: {{FLOW_1_NAME}}

### 概要

{{FLOW_1_DESCRIPTION}}

### シーケンス図

```mermaid
sequenceDiagram
    participant {{ACTOR_1}} as {{ACTOR_1_LABEL}}
    participant {{COMPONENT_1}} as {{COMPONENT_1_LABEL}}
    participant {{COMPONENT_2}} as {{COMPONENT_2_LABEL}}
    participant {{COMPONENT_3}} as {{COMPONENT_3_LABEL}}
    participant {{EXTERNAL_1}} as {{EXTERNAL_1_LABEL}}

    {{ACTOR_1}}->>{{COMPONENT_1}}: {{STEP_1_1}}
    activate {{COMPONENT_1}}

    {{COMPONENT_1}}->>{{COMPONENT_2}}: {{STEP_1_2}}
    activate {{COMPONENT_2}}

    {{COMPONENT_2}}->>{{COMPONENT_3}}: {{STEP_1_3}}
    activate {{COMPONENT_3}}

    {{COMPONENT_3}}->>{{EXTERNAL_1}}: {{STEP_1_4}}
    activate {{EXTERNAL_1}}

    {{EXTERNAL_1}}-->>{{COMPONENT_3}}: {{STEP_1_5}}
    deactivate {{EXTERNAL_1}}

    {{COMPONENT_3}}-->>{{COMPONENT_2}}: {{STEP_1_6}}
    deactivate {{COMPONENT_3}}

    {{COMPONENT_2}}-->>{{COMPONENT_1}}: {{STEP_1_7}}
    deactivate {{COMPONENT_2}}

    {{COMPONENT_1}}-->>{{ACTOR_1}}: {{STEP_1_8}}
    deactivate {{COMPONENT_1}}
```

### ステップ詳細

1. **{{STEP_1_1}}**: {{STEP_1_1_DETAIL}}
2. **{{STEP_1_2}}**: {{STEP_1_2_DETAIL}}
3. **{{STEP_1_3}}**: {{STEP_1_3_DETAIL}}
4. **{{STEP_1_4}}**: {{STEP_1_4_DETAIL}}
5. **{{STEP_1_5}}**: {{STEP_1_5_DETAIL}}
6. **{{STEP_1_6}}**: {{STEP_1_6_DETAIL}}
7. **{{STEP_1_7}}**: {{STEP_1_7_DETAIL}}
8. **{{STEP_1_8}}**: {{STEP_1_8_DETAIL}}

### エラーハンドリング

{{FLOW_1_ERROR_HANDLING}}

---

## 主要フロー2: {{FLOW_2_NAME}}

### 概要

{{FLOW_2_DESCRIPTION}}

### シーケンス図

```mermaid
sequenceDiagram
    participant {{ACTOR_2}} as {{ACTOR_2_LABEL}}
    participant {{COMPONENT_4}} as {{COMPONENT_4_LABEL}}
    participant {{COMPONENT_5}} as {{COMPONENT_5_LABEL}}
    participant {{COMPONENT_6}} as {{COMPONENT_6_LABEL}}

    {{ACTOR_2}}->>{{COMPONENT_4}}: {{STEP_2_1}}
    activate {{COMPONENT_4}}

    {{COMPONENT_4}}->>{{COMPONENT_5}}: {{STEP_2_2}}
    activate {{COMPONENT_5}}

    alt {{CONDITION_2_1}}
        {{COMPONENT_5}}->>{{COMPONENT_6}}: {{STEP_2_3_ALT1}}
        activate {{COMPONENT_6}}
        {{COMPONENT_6}}-->>{{COMPONENT_5}}: {{STEP_2_4_ALT1}}
        deactivate {{COMPONENT_6}}
    else {{CONDITION_2_2}}
        {{COMPONENT_5}}->>{{COMPONENT_6}}: {{STEP_2_3_ALT2}}
        activate {{COMPONENT_6}}
        {{COMPONENT_6}}-->>{{COMPONENT_5}}: {{STEP_2_4_ALT2}}
        deactivate {{COMPONENT_6}}
    end

    {{COMPONENT_5}}-->>{{COMPONENT_4}}: {{STEP_2_5}}
    deactivate {{COMPONENT_5}}

    {{COMPONENT_4}}-->>{{ACTOR_2}}: {{STEP_2_6}}
    deactivate {{COMPONENT_4}}
```

### ステップ詳細

1. **{{STEP_2_1}}**: {{STEP_2_1_DETAIL}}
2. **{{STEP_2_2}}**: {{STEP_2_2_DETAIL}}
3. **条件分岐**:
   - **{{CONDITION_2_1}}**: {{CONDITION_2_1_DETAIL}}
   - **{{CONDITION_2_2}}**: {{CONDITION_2_2_DETAIL}}
4. **{{STEP_2_5}}**: {{STEP_2_5_DETAIL}}
5. **{{STEP_2_6}}**: {{STEP_2_6_DETAIL}}

### エラーハンドリング

{{FLOW_2_ERROR_HANDLING}}

---

## 主要フロー3: {{FLOW_3_NAME}}

### 概要

{{FLOW_3_DESCRIPTION}}

### シーケンス図

```mermaid
sequenceDiagram
    participant {{ACTOR_3}} as {{ACTOR_3_LABEL}}
    participant {{COMPONENT_7}} as {{COMPONENT_7_LABEL}}
    participant {{COMPONENT_8}} as {{COMPONENT_8_LABEL}}
    participant {{EXTERNAL_2}} as {{EXTERNAL_2_LABEL}}

    {{ACTOR_3}}->>{{COMPONENT_7}}: {{STEP_3_1}}
    activate {{COMPONENT_7}}

    loop {{LOOP_CONDITION_3}}
        {{COMPONENT_7}}->>{{COMPONENT_8}}: {{STEP_3_2}}
        activate {{COMPONENT_8}}

        {{COMPONENT_8}}->>{{EXTERNAL_2}}: {{STEP_3_3}}
        activate {{EXTERNAL_2}}

        {{EXTERNAL_2}}-->>{{COMPONENT_8}}: {{STEP_3_4}}
        deactivate {{EXTERNAL_2}}

        {{COMPONENT_8}}-->>{{COMPONENT_7}}: {{STEP_3_5}}
        deactivate {{COMPONENT_8}}
    end

    {{COMPONENT_7}}-->>{{ACTOR_3}}: {{STEP_3_6}}
    deactivate {{COMPONENT_7}}
```

### ステップ詳細

1. **{{STEP_3_1}}**: {{STEP_3_1_DETAIL}}
2. **ループ処理 ({{LOOP_CONDITION_3}})**:
   - **{{STEP_3_2}}**: {{STEP_3_2_DETAIL}}
   - **{{STEP_3_3}}**: {{STEP_3_3_DETAIL}}
   - **{{STEP_3_4}}**: {{STEP_3_4_DETAIL}}
   - **{{STEP_3_5}}**: {{STEP_3_5_DETAIL}}
3. **{{STEP_3_6}}**: {{STEP_3_6_DETAIL}}

### エラーハンドリング

{{FLOW_3_ERROR_HANDLING}}

---

## エラーフロー: {{ERROR_FLOW_NAME}}

### 概要

{{ERROR_FLOW_DESCRIPTION}}

### シーケンス図

```mermaid
sequenceDiagram
    participant {{ACTOR_ERROR}} as {{ACTOR_ERROR_LABEL}}
    participant {{COMPONENT_ERROR_1}} as {{COMPONENT_ERROR_1_LABEL}}
    participant {{COMPONENT_ERROR_2}} as {{COMPONENT_ERROR_2_LABEL}}
    participant {{EXTERNAL_ERROR}} as {{EXTERNAL_ERROR_LABEL}}

    {{ACTOR_ERROR}}->>{{COMPONENT_ERROR_1}}: {{STEP_ERROR_1}}
    activate {{COMPONENT_ERROR_1}}

    {{COMPONENT_ERROR_1}}->>{{COMPONENT_ERROR_2}}: {{STEP_ERROR_2}}
    activate {{COMPONENT_ERROR_2}}

    {{COMPONENT_ERROR_2}}->>{{EXTERNAL_ERROR}}: {{STEP_ERROR_3}}
    activate {{EXTERNAL_ERROR}}

    {{EXTERNAL_ERROR}}-->>{{COMPONENT_ERROR_2}}: {{STEP_ERROR_4}} (Error)
    deactivate {{EXTERNAL_ERROR}}

    {{COMPONENT_ERROR_2}}->>{{COMPONENT_ERROR_2}}: {{STEP_ERROR_5}}

    alt {{ERROR_CONDITION_1}}
        {{COMPONENT_ERROR_2}}->>{{EXTERNAL_ERROR}}: {{STEP_ERROR_6_RETRY}}
        activate {{EXTERNAL_ERROR}}
        {{EXTERNAL_ERROR}}-->>{{COMPONENT_ERROR_2}}: {{STEP_ERROR_7_SUCCESS}}
        deactivate {{EXTERNAL_ERROR}}
    else {{ERROR_CONDITION_2}}
        {{COMPONENT_ERROR_2}}-->>{{COMPONENT_ERROR_1}}: {{STEP_ERROR_8_FAIL}}
    end

    {{COMPONENT_ERROR_2}}-->>{{COMPONENT_ERROR_1}}: {{STEP_ERROR_9}}
    deactivate {{COMPONENT_ERROR_2}}

    {{COMPONENT_ERROR_1}}-->>{{ACTOR_ERROR}}: {{STEP_ERROR_10}}
    deactivate {{COMPONENT_ERROR_1}}
```

### ステップ詳細

1. **{{STEP_ERROR_1}}**: {{STEP_ERROR_1_DETAIL}}
2. **{{STEP_ERROR_2}}**: {{STEP_ERROR_2_DETAIL}}
3. **{{STEP_ERROR_3}}**: {{STEP_ERROR_3_DETAIL}}
4. **{{STEP_ERROR_4}}**: {{STEP_ERROR_4_DETAIL}}
5. **{{STEP_ERROR_5}}**: {{STEP_ERROR_5_DETAIL}}
6. **リトライロジック**:
   - **{{ERROR_CONDITION_1}}**: {{ERROR_CONDITION_1_DETAIL}}
   - **{{ERROR_CONDITION_2}}**: {{ERROR_CONDITION_2_DETAIL}}

### リトライ戦略

{{ERROR_FLOW_RETRY_STRATEGY}}

---

## 非同期処理フロー: {{ASYNC_FLOW_NAME}}

### 概要

{{ASYNC_FLOW_DESCRIPTION}}

### シーケンス図

```mermaid
sequenceDiagram
    participant {{ACTOR_ASYNC}} as {{ACTOR_ASYNC_LABEL}}
    participant {{COMPONENT_ASYNC_1}} as {{COMPONENT_ASYNC_1_LABEL}}
    participant {{QUEUE}} as {{QUEUE_LABEL}}
    participant {{COMPONENT_ASYNC_2}} as {{COMPONENT_ASYNC_2_LABEL}}
    participant {{COMPONENT_ASYNC_3}} as {{COMPONENT_ASYNC_3_LABEL}}

    {{ACTOR_ASYNC}}->>{{COMPONENT_ASYNC_1}}: {{STEP_ASYNC_1}}
    activate {{COMPONENT_ASYNC_1}}

    {{COMPONENT_ASYNC_1}}->>{{QUEUE}}: {{STEP_ASYNC_2}}
    activate {{QUEUE}}

    {{COMPONENT_ASYNC_1}}-->>{{ACTOR_ASYNC}}: {{STEP_ASYNC_3}} (Accepted)
    deactivate {{COMPONENT_ASYNC_1}}

    {{QUEUE}}->>{{COMPONENT_ASYNC_2}}: {{STEP_ASYNC_4}}
    deactivate {{QUEUE}}
    activate {{COMPONENT_ASYNC_2}}

    {{COMPONENT_ASYNC_2}}->>{{COMPONENT_ASYNC_3}}: {{STEP_ASYNC_5}}
    activate {{COMPONENT_ASYNC_3}}

    {{COMPONENT_ASYNC_3}}-->>{{COMPONENT_ASYNC_2}}: {{STEP_ASYNC_6}}
    deactivate {{COMPONENT_ASYNC_3}}

    {{COMPONENT_ASYNC_2}}->>{{ACTOR_ASYNC}}: {{STEP_ASYNC_7}} (Notification)
    deactivate {{COMPONENT_ASYNC_2}}
```

### ステップ詳細

1. **{{STEP_ASYNC_1}}**: {{STEP_ASYNC_1_DETAIL}}
2. **{{STEP_ASYNC_2}}**: {{STEP_ASYNC_2_DETAIL}}
3. **{{STEP_ASYNC_3}}**: {{STEP_ASYNC_3_DETAIL}}
4. **{{STEP_ASYNC_4}}**: {{STEP_ASYNC_4_DETAIL}}
5. **{{STEP_ASYNC_5}}**: {{STEP_ASYNC_5_DETAIL}}
6. **{{STEP_ASYNC_6}}**: {{STEP_ASYNC_6_DETAIL}}
7. **{{STEP_ASYNC_7}}**: {{STEP_ASYNC_7_DETAIL}}

### 非同期処理の考慮事項

{{ASYNC_FLOW_CONSIDERATIONS}}

---

## フロー図の凡例

### 参加者（Participant）

- **{{ACTOR_TYPE}}**: ユーザーや外部アクター
- **{{COMPONENT_TYPE}}**: システム内のコンポーネント
- **{{EXTERNAL_TYPE}}**: 外部システムやサービス

### 相互作用

- **実線矢印 (→)**: 同期呼び出し
- **破線矢印 (-->)**: レスポンス
- **activate/deactivate**: ライフラインの活性化

### 制御構造

- **alt/else**: 条件分岐
- **loop**: ループ処理
- **opt**: オプション処理

## 参照

- アーキテクチャ概要: [architecture.md](./architecture.md)
- API設計: [../development/api-design.md](../development/api-design.md)
- データモデル: [../development/data-model.md](../development/data-model.md)
