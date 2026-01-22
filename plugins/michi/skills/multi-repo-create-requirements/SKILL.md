---
name: multi-repo-create-requirements
description: |
  マルチリポジトリ要件定義スキル

  EARS形式の統合要件定義を生成し、リポジトリ間の依存関係を明記します。

trigger_keywords:
  - "マルチリポジトリ要件定義"
  - "統合要件定義"
  - "multi-repo-create-requirements"
---

# multi-repo-create-requirements: マルチリポジトリ要件定義

EARS形式の統合要件定義を生成し、リポジトリ間の依存関係を明記します。

## 概要

1. **EARS形式要件定義**: 全リポジトリ統合の要件を定義
2. **リポジトリ間依存関係**: 各リポジトリの役割と依存を明記
3. **インターフェース定義**: リポジトリ間のインターフェースを定義

## 使用方法

```bash
/michi-multi-repo create-requirements {pj-name}
```

## 実行内容

統合要件定義書を作成します：

```markdown
# 統合要件定義: EC Platform

## リポジトリ構成

### frontend-web
- 役割: Webフロントエンド
- 依存: backend-api

### backend-api
- 役割: APIサーバー
- 依存: なし

### mobile-app
- 役割: モバイルアプリ
- 依存: backend-api

## インターフェース定義

### backend-api → frontend-web
- API仕様: OpenAPI 3.0
- 認証: OAuth2

## 要件

### FR-001: ユーザー登録
- **リポジトリ**: backend-api, frontend-web, mobile-app
- **要件**: ユーザーは新規登録できる
```

## 次のステップ

```bash
/michi-multi-repo create-design {pj-name}
```

---

**次のスキル**: `multi-repo-create-design`
