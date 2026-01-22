---
name: show-status
description: |
  ステータス表示スキル

  仕様全体の進捗状況を確認し、完了タスク数/全タスク数、次に実行すべきアクションを表示します。

trigger_keywords:
  - "進捗を確認"
  - "ステータスを表示"
  - "現在の状況は？"
  - "状況確認"
  - "show-status"
---

# show-status: ステータス表示

ステータス表示スキルは、プロジェクトの現在の進捗状況を確認するために使用します。

## 概要

このスキルは以下の情報を表示します：

1. **プロジェクト基本情報**: プロジェクト名、説明、作成日時
2. **現在のフェーズ**: `initialized`, `requirements-generated`, `design-generated`, `tasks-generated`, `implementation-complete` など
3. **タスク進捗**: 完了タスク数 / 全タスク数
4. **次のアクション**: 次に実行すべきステップの提案

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「進捗を確認したい」
- 「ステータスを表示」
- 「現在の状況は？」

### 明示的発動

```bash
/michi show-status {pj-name}
```

**例**:
```bash
/michi show-status user-auth
```

## 実行内容

### 1. プロジェクト情報読み込み

`.michi/pj/YYYYMMDD-{pj-name}/project.json` からメタデータを読み込みます。

### 2. 進捗状況分析

以下を分析します：
- 現在のフェーズ
- タスクの完了状況（`docs/michi/YYYYMMDD-{pj-name}/tasks/tasks.md` を参照）
- 承認状況（`project.json` の `approvals` フィールド）

### 3. ステータス表示

以下の形式で表示します：

```
プロジェクト: user-auth
説明: ユーザー認証機能
フェーズ: design-generated
作成日: 2026-01-15
更新日: 2026-01-17

タスク進捗: 3 / 10 完了 (30%)

次のアクション:
  - テスト計画を立てる（plan-tests）
  - タスクに分割する（create-tasks）
```

## 次のステップ

ステータス確認後、フェーズに応じて次のステップを実行します：

| 現在のフェーズ | 次のステップ |
|-------------|------------|
| `initialized` | `create-requirements` - 要件定義 |
| `requirements-generated` | `create-design` - 設計 |
| `design-generated` | `plan-tests` または `create-tasks` |
| `tasks-generated` | `dev` - TDD実装 |
| `implementation-complete` | `archive-pj` - アーカイブ |

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `launch-pj` - プロジェクト初期化
- `archive-pj` - プロジェクトアーカイブ
- `switch-pj` - プロジェクト切り替え
