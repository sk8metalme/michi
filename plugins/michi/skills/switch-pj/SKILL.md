---
name: switch-pj
description: |
  プロジェクト切り替えスキル

  複数のプロジェクト間を切り替え、現在のコンテキストを変更します。

trigger_keywords:
  - "プロジェクトを切り替え"
  - "別のプロジェクトに切り替え"
  - "プロジェクト変更"
  - "switch-pj"
---

# switch-pj: プロジェクト切り替え

プロジェクト切り替えスキルは、複数のプロジェクトを並行して管理する際に、現在作業中のプロジェクトを切り替えます。

## 概要

このスキルは以下を実行します：

1. **プロジェクト一覧表示**: `.michi/pj/` 内の全プロジェクトを表示
2. **プロジェクト選択**: ユーザーが切り替え先のプロジェクトを選択
3. **コンテキスト変更**: 現在のコンテキストを切り替え先のプロジェクトに変更
4. **ステータス表示**: 切り替え先のプロジェクトのステータスを表示

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「プロジェクトを切り替えたい」
- 「別のプロジェクトに切り替え」
- 「プロジェクトを変更」

### 明示的発動

```bash
/michi switch-pj
```

または、プロジェクト名を指定：

```bash
/michi switch-pj {pj-name}
```

**例**:
```bash
/michi switch-pj user-auth
```

## 実行内容

### 1. プロジェクト一覧表示

`.michi/pj/` 内の全プロジェクトを表示します：

```
利用可能なプロジェクト:

1. 20260115-user-auth (要件定義完了)
2. 20260116-product-search (設計完了)
3. 20260117-payment-integration (初期化済み)

切り替え先のプロジェクトを選択してください。
```

### 2. プロジェクト選択

ユーザーがプロジェクトを選択します（番号またはプロジェクト名）。

### 3. コンテキスト変更

以下を更新します：
- 現在のプロジェクトコンテキスト
- `project.json` のメタデータ
- Claude のセッション変数

### 4. ステータス表示

切り替え後、選択されたプロジェクトのステータスを表示します：

```
プロジェクトを切り替えました: user-auth

プロジェクト: user-auth
フェーズ: design-generated
次のアクション: テスト計画（plan-tests）またはタスク分割（create-tasks）
```

## 使用例

### 並行開発のシナリオ

複数のプロジェクトを並行して進める場合：

1. プロジェクトAで要件定義
2. プロジェクトBに切り替えて設計
3. プロジェクトAに戻って設計
4. プロジェクトCを新規作成
5. プロジェクトBに切り替えて実装

```bash
/michi launch-pj "プロジェクトA"
/michi create-requirements project-a

/michi switch-pj project-b
/michi create-design project-b

/michi switch-pj project-a
/michi create-design project-a

/michi launch-pj "プロジェクトC"

/michi switch-pj project-b
/michi dev project-b
```

## 次のステップ

プロジェクト切り替え後、`show-status` で現在のステータスを確認し、次のステップに進みます。

```bash
/michi show-status {pj-name}
```

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `show-status` - ステータス表示（切り替え後に確認）
- `launch-pj` - 新規プロジェクト初期化
- `archive-pj` - プロジェクトアーカイブ（完了後）
