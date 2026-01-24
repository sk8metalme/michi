---
name: launch-pj
description: |
  プロジェクト初期化スキル

  プロジェクト説明から一意の機能名を生成し、ディレクトリ構造とメタデータを作成します。
  次のフェーズ（要件定義）への準備を整えます。

trigger_keywords:
  - "新しいプロジェクトを開始"
  - "仕様を初期化"
  - "プロジェクト作成"
  - "プロジェクト初期化"
  - "launch-pj"
---

# launch-pj: プロジェクト初期化

プロジェクト初期化スキルは、新しいプロジェクトを開始するための基盤を作成します。

## 概要

このスキルは以下を実行します：

1. **機能名生成**: プロジェクト説明から一意の機能名（YYYYMMDD-{pj-name}形式）を生成
2. **ディレクトリ構造作成**:
   - `.michi/pj/YYYYMMDD-{pj-name}/` にメタデータディレクトリを作成
   - `docs/michi/YYYYMMDD-{pj-name}/` に仕様書ディレクトリを作成
3. **メタデータ初期化**: `project.json` を作成し、フェーズを `initialized` に設定
4. **次フェーズ準備**: 要件定義フェーズに進む準備を完了

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「新しいプロジェクトを開始したい」
- 「仕様を初期化」
- 「プロジェクトを作成」

### 明示的発動

```bash
/michi launch-pj "プロジェクト説明"
```

**例**:
```bash
/michi launch-pj "ユーザー認証機能"
```

## 実行内容

### 1. 機能名生成

プロジェクト説明から以下の形式で機能名を生成します：

```
YYYYMMDD-{pj-name}
```

**例**:
- "ユーザー認証機能" → `20260117-user-auth`
- "商品検索API" → `20260117-product-search-api`

### 2. ディレクトリ構造作成

以下のディレクトリを作成します：

```
.michi/pj/YYYYMMDD-{pj-name}/        # メタデータ（.gitignore対象）
docs/michi/YYYYMMDD-{pj-name}/       # 仕様書（Git管理される）
├── spec/
├── tasks/
├── research/
├── test-plan/
└── todos/
```

### 3. メタデータ初期化

`.michi/pj/YYYYMMDD-{pj-name}/project.json` を作成：

```json
{
  "name": "{pj-name}",
  "fullName": "YYYYMMDD-{pj-name}",
  "description": "プロジェクト説明",
  "phase": "initialized",
  "createdAt": "2026-01-17T00:00:00Z",
  "updatedAt": "2026-01-17T00:00:00Z"
}
```

## 次のステップ

プロジェクト初期化が完了したら、次のステップに進みます：

### 推奨: 要件定義

`create-requirements` スキルを使用して要件定義書を作成します。

```bash
/michi create-requirements {pj-name}
```

または自動発動：
```
要件定義したい
```

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**次のスキル**: `create-requirements` - 要件定義書作成
