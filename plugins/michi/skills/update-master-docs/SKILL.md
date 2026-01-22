---
name: update-master-docs
description: |
  マスタードキュメント更新スキル

  プロジェクト横断の共通知識を更新します。
  structure.md, tech.md, product.md を管理します。

trigger_keywords:
  - "マスタードキュメントを更新"
  - "共通知識を更新"
  - "マスタードキュメント"
  - "update-master-docs"
---

# update-master-docs: マスタードキュメント更新

マスタードキュメント更新スキルは、プロジェクト横断の共通知識を更新します。

## 概要

このスキルは以下を実行します：

1. **マスタードキュメント読み込み**: 既存のマスタードキュメントを確認
2. **変更内容分析**: プロジェクト固有の知見から共通化できる要素を抽出
3. **マスタードキュメント更新**:
   - `docs/master-docs/structure.md` - システム構造
   - `docs/master-docs/tech.md` - 技術スタック
   - `docs/master-docs/product.md` - プロダクト要件
4. **バージョン管理**: 変更履歴を記録

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「マスタードキュメントを更新したい」
- 「共通知識を更新」
- プロジェクト完了時に自動提案

### 明示的発動

```bash
/michi update-master-docs
```

または、特定のドキュメントのみ更新：

```bash
/michi update-master-docs --doc structure
/michi update-master-docs --doc tech
/michi update-master-docs --doc product
```

## 実行内容

### 1. マスタードキュメント読み込み

以下のファイルを読み込みます：

```
docs/master-docs/
├── structure.md   # システム構造
├── tech.md        # 技術スタック
└── product.md     # プロダクト要件
```

### 2. 変更内容分析

プロジェクト固有の知見から共通化できる要素を抽出します：

- 新しいアーキテクチャパターン
- 新しい技術スタック
- プロダクト要件の変更
- ベストプラクティス

### 3. マスタードキュメント更新

#### structure.md - システム構造

システム全体の構造を定義します：

```markdown
# システム構造

## アーキテクチャ概要

### レイヤー構造
- Presentation Layer: API Gateway, UI
- Application Layer: Business Logic
- Domain Layer: Domain Models
- Infrastructure Layer: Database, External Services

## コンポーネント一覧

### API Gateway
- 役割: リクエストルーティング、認証・認可
- 技術: Kong / AWS API Gateway

### Authentication Service
- 役割: ユーザー認証
- 技術: OAuth2, JWT
```

#### tech.md - 技術スタック

プロジェクトで使用する技術スタックを定義します：

```markdown
# 技術スタック

## 言語・フレームワーク
- **Backend**: Node.js 20.x, TypeScript 5.x
- **Frontend**: React 18.x, Next.js 14.x
- **Mobile**: React Native 0.73.x

## データベース
- **RDB**: PostgreSQL 16.x
- **NoSQL**: MongoDB 7.x
- **Cache**: Redis 7.x

## インフラ
- **Cloud**: AWS
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions
```

#### product.md - プロダクト要件

プロダクト全体の要件を定義します：

```markdown
# プロダクト要件

## ビジョン
...

## ターゲットユーザー
...

## 主要機能
1. ユーザー認証
2. 商品検索
3. 決済処理
...

## 非機能要件
- パフォーマンス: レスポンスタイム < 200ms
- 可用性: 99.9% SLA
- セキュリティ: OWASP Top 10 準拠
```

### 4. バージョン管理

変更履歴を各ドキュメントの末尾に記録します：

```markdown
## 変更履歴

- 2026-01-17: ユーザー認証機能の追加 (user-auth プロジェクト)
- 2026-01-15: 商品検索APIの追加 (product-search プロジェクト)
```

## 次のステップ

マスタードキュメント更新後、次のプロジェクトで参照できるようになります。

新しいプロジェクトでは、更新されたマスタードキュメントを参照して要件定義・設計を行います。

```bash
/michi launch-pj "新しいプロジェクト"
/michi create-requirements new-project
```

## 注意事項

- **共通化のバランス**: すべてをマスタードキュメントに書くのではなく、本当に共通化すべき要素のみを抽出
- **プロジェクト固有の詳細**: 各プロジェクトの詳細は、そのプロジェクトの仕様書に記載
- **定期的な見直し**: 技術スタックやアーキテクチャの変更に応じて定期的に見直す

## 参照

- **マスタードキュメント原則**: `~/.michi/settings/rules/master-docs-principles.md`
- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `create-requirements` - 要件定義（マスタードキュメントを参照）
- `create-design` - 設計（マスタードキュメントを参照）
