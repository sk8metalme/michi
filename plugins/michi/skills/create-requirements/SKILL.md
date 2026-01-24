---
name: create-requirements
description: |
  要件定義書作成スキル

  EARS形式の要件定義を生成し、ultrathink自動有効化で深い分析を行います。
  マスタードキュメントコンテキストと整合を取ります。

trigger_keywords:
  - "要件定義したい"
  - "要件を作成"
  - "要求仕様"
  - "要件定義書"
  - "create-requirements"
---

# create-requirements: 要件定義書作成

要件定義書作成スキルは、EARS形式の要件定義を生成し、プロジェクトの要件を明確化します。

## 概要

このスキルは以下を実行します：

1. **ultrathink自動有効化**: 深い分析のためにultrathinkモードを有効化
2. **マスタードキュメント参照**: プロジェクト横断の共通知識と整合を取る
3. **EARS形式要件定義**: Easy Approach to Requirements Syntax 形式で要件を記述
4. **要件定義書生成**: `docs/michi/YYYYMMDD-{pj-name}/spec/requirements.md` を作成
5. **フェーズ更新**: project.json のフェーズを `requirements-generated` に更新

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「要件定義したい」
- 「要件を作成」
- project.json の `phase: "initialized"` の場合

### 明示的発動

```bash
/michi create-requirements {pj-name}
```

**例**:
```bash
/michi create-requirements user-auth
```

## 実行内容

### 1. ultrathink自動有効化

深い分析のため、ultrathinkモードを自動的に有効化します。

### 2. マスタードキュメント参照

以下のマスタードキュメントを参照して、プロジェクト横断の整合性を確保します：
- `docs/master-docs/structure.md` - システム構造
- `docs/master-docs/tech.md` - 技術スタック
- `docs/master-docs/product.md` - プロダクト要件

### 3. EARS形式要件定義

EARS（Easy Approach to Requirements Syntax）形式で要件を記述します：

**EARS形式のテンプレート**:
- **Ubiquitous**: システムは常に〜すること
- **Event-driven**: 〜の場合、システムは〜すること
- **State-driven**: 〜の状態において、システムは〜すること
- **Optional**: 必要に応じて、システムは〜してもよい
- **Unwanted**: 〜の場合、システムは〜してはならない

### 4. 要件定義書生成

`docs/michi/YYYYMMDD-{pj-name}/spec/requirements.md` を作成します：

```markdown
# 要件定義書: {pj-name}

## プロジェクト概要
...

## 機能要件
### FR-001: ...
- **種類**: Ubiquitous
- **要件**: システムは常に〜すること
- **優先度**: 高
- **受入条件**: ...

### FR-002: ...
...

## 非機能要件
### NFR-001: パフォーマンス
...

### NFR-002: セキュリティ
...

## 制約条件
...

## 参照
- マスタードキュメント: docs/master-docs/
```

### 5. フェーズ更新

project.json のフェーズを更新します：

```json
{
  "phase": "requirements-generated",
  "updatedAt": "2026-01-17T00:00:00Z"
}
```

## 次のステップ

要件定義が完了したら、次のステップに進みます：

### 推奨: TODO抽出

要件定義書から不明点や仮定を抽出してTODO管理を開始します。

`manage-todos` スキルを使用してTODOを抽出します：

```bash
/michi manage-todos scan {pj-name}
```

または自動発動：
```
TODOを確認したい
```

**抽出対象**:
- 「前提条件」セクションの仮定（Assumption）
- 「制約事項」セクションの不明点（Question）

### 推奨: 設計書作成

`create-design` スキルを使用して設計書を作成します。

```bash
/michi create-design {pj-name}
```

または自動発動：
```
設計書を作成したい
```

## 参照

- **EARS形式ガイドライン**: `~/.michi/settings/rules/ears-format.md`
- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**次のスキル**: `create-design` - 設計書作成
