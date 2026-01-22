---
name: multi-repo-review-cross
description: |
  クロスリポジトリ整合性検証スキル

  各リポジトリの仕様間の整合性を検証し、インターフェース不整合を検出します。

trigger_keywords:
  - "クロスリポジトリ検証"
  - "整合性検証"
  - "multi-repo-review-cross"
---

# multi-repo-review-cross: クロスリポジトリ整合性検証

各リポジトリの仕様間の整合性を検証し、インターフェース不整合を検出します。

## 概要

1. **インターフェース整合性**: API仕様の一致を確認
2. **データモデル整合性**: データ構造の一致を確認
3. **依存関係検証**: リポジトリ間の依存が正しいか確認

## 使用方法

```bash
/michi-multi-repo review-cross {pj-name}
```

## 実行内容

クロスリポジトリ検証を実行します：

```markdown
# クロスリポジトリ整合性検証結果

## インターフェース整合性

### API仕様
- ✅ backend-api の OpenAPI仕様とfrontend-web の型定義が一致
- ⚠️ mobile-app の型定義が古い（backend-api v1.2.0 vs mobile-app v1.1.0）

## データモデル整合性

- ✅ User型の定義が全リポジトリで一致

## 依存関係

- ✅ 循環依存なし
- ✅ 依存方向が正しい（frontend/mobile → backend）
```

## 次のステップ

```bash
/michi-multi-repo propagate {pj-name}
```

---

**次のスキル**: `multi-repo-propagate`
