---
name: multi-repo-propagate
description: |
  各リポジトリへ仕様展開スキル

  統合仕様を各リポジトリに展開し、並行実行で効率化します。

trigger_keywords:
  - "仕様展開"
  - "各リポジトリへ展開"
  - "multi-repo-propagate"
---

# multi-repo-propagate: 各リポジトリへ仕様展開

統合仕様を各リポジトリに展開し、並行実行で効率化します。

## 概要

1. **統合仕様読み込み**: 統合要件定義・設計を読み込み
2. **リポジトリごとに仕様抽出**: 各リポジトリに関連する部分を抽出
3. **並行展開**: 各リポジトリに仕様を展開（並行実行）

## 使用方法

```bash
/michi-multi-repo propagate {pj-name}
```

## 実行内容

各リポジトリに仕様を展開します：

```
並行実行:
  - frontend-web: requirements.md, design.md を作成
  - backend-api: requirements.md, design.md を作成
  - mobile-app: requirements.md, design.md を作成

完了後、各リポジトリに仕様ファイルが配置されます。
```

展開先：
```
frontend-web/docs/specs/YYYYMMDD-{pj-name}/
backend-api/docs/specs/YYYYMMDD-{pj-name}/
mobile-app/docs/specs/YYYYMMDD-{pj-name}/
```

## 次のステップ

```bash
/michi-multi-repo dev-all {pj-name}
```

---

**次のスキル**: `multi-repo-dev-all`
