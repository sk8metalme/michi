---
# 要件定義書テンプレート
# このテンプレートは /michi:create-requirements コマンドで生成される構造を定義します
# プレースホルダー（{{...}}）は生成時に実際の値に置き換えられます
feature: {{FEATURE_NAME}}
created_at: {{CREATED_AT}}
updated_at: {{UPDATED_AT}}
language: {{LANGUAGE}}
phase: requirements-generated
---

# 要件定義書: {{FEATURE_NAME}}

<!-- プロジェクト全体の概要と、この機能がプロジェクトの目標にどう貢献するかを説明します -->

## プロジェクト説明

{{PROJECT_DESCRIPTION}}

---

<!-- 以下のセクションでは、要件を論理的な領域にグループ化します -->
<!-- 各要件領域は、関連する機能をまとめたグループです -->

## 要件領域 1: {{REQUIREMENT_AREA_1}}

<!-- この要件領域の概要を簡潔に説明します -->

### Requirement 1: {{REQUIREMENT_1_TITLE}}

<!-- 要件の詳細な説明（WHAT）: どのような機能が必要か -->

**受入基準**:

<!-- EARS形式で受入基準を記述します -->
<!-- EARS形式: 明確な主語（システム名/サービス名）+ 条件 + 期待される動作 -->
<!-- 例:
- WHEN [条件], システムは [動作] MUST/SHALL/SHOULD [実行]
- IF [条件], サービスは [動作]
- WHILE [条件], アプリケーションは [状態を維持]
-->

1. WHEN {{CONDITION}}, {{SYSTEM_NAME}} SHALL {{EXPECTED_BEHAVIOR}}
2. IF {{CONDITION}}, {{SYSTEM_NAME}} MUST {{EXPECTED_BEHAVIOR}}
3. {{SYSTEM_NAME}} SHOULD {{EXPECTED_BEHAVIOR}} WHILE {{CONDITION}}

---

### Requirement 2: {{REQUIREMENT_2_TITLE}}

<!-- 要件の詳細な説明 -->

**受入基準**:

1. {{ACCEPTANCE_CRITERIA_1}}
2. {{ACCEPTANCE_CRITERIA_2}}
3. {{ACCEPTANCE_CRITERIA_3}}

---

## 要件領域 2: {{REQUIREMENT_AREA_2}}

<!-- 2つ目の要件領域の概要 -->

### Requirement 3: {{REQUIREMENT_3_TITLE}}

<!-- 要件の詳細な説明 -->

**受入基準**:

1. {{ACCEPTANCE_CRITERIA_1}}
2. {{ACCEPTANCE_CRITERIA_2}}

---

### Requirement 4: {{REQUIREMENT_4_TITLE}}

<!-- 要件の詳細な説明 -->

**受入基準**:

1. {{ACCEPTANCE_CRITERIA_1}}
2. {{ACCEPTANCE_CRITERIA_2}}
3. {{ACCEPTANCE_CRITERIA_3}}

---

## 非機能要件

<!-- システムの品質特性に関する要件を記述します -->

### Performance (パフォーマンス)

<!-- 応答時間、スループット、リソース使用量などの要件 -->

**受入基準**:

1. {{PERFORMANCE_CRITERIA_1}}
2. {{PERFORMANCE_CRITERIA_2}}

---

### Security (セキュリティ)

<!-- 認証、認可、データ保護などの要件 -->

**受入基準**:

1. {{SECURITY_CRITERIA_1}}
2. {{SECURITY_CRITERIA_2}}

---

### Usability (ユーザビリティ)

<!-- ユーザーインターフェース、アクセシビリティなどの要件 -->

**受入基準**:

1. {{USABILITY_CRITERIA_1}}
2. {{USABILITY_CRITERIA_2}}

---

### Reliability (信頼性)

<!-- 可用性、耐障害性、回復性などの要件 -->

**受入基準**:

1. {{RELIABILITY_CRITERIA_1}}
2. {{RELIABILITY_CRITERIA_2}}

---

## 制約条件

<!-- 技術的制約、ビジネス制約、法的制約などを記述します -->

1. {{CONSTRAINT_1}}
2. {{CONSTRAINT_2}}
3. {{CONSTRAINT_3}}

---

## 前提条件

<!-- この要件定義が前提とする条件やリソースを記述します -->

1. {{ASSUMPTION_1}}
2. {{ASSUMPTION_2}}
3. {{ASSUMPTION_3}}

---

## 用語集

<!-- 要件定義で使用される専門用語やプロジェクト固有の用語を定義します -->

- **{{TERM_1}}**: {{DEFINITION_1}}
- **{{TERM_2}}**: {{DEFINITION_2}}
- **{{TERM_3}}**: {{DEFINITION_3}}

---

## 参考資料

<!-- 関連するドキュメント、API仕様書、デザインモックなどへの参照 -->

1. {{REFERENCE_1}}
2. {{REFERENCE_2}}
3. {{REFERENCE_3}}

---

## 重要な注意事項

<!--
テンプレート使用時の注意点:
1. 要件見出しは必ず数値IDで始めること（例: "Requirement 1", "1.", "2 機能名..."）
2. アルファベットID（例: "Requirement A"）は使用しない
3. EARS形式の受入基準では、適切な主語を選択する（システム名/サービス名）
4. WHATに焦点を当て、HOW（実装詳細）は含めない
5. すべての受入基準はテスト可能で検証可能であること
-->
