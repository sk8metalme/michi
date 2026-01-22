---
name: archive-pj
description: |
  プロジェクトアーカイブスキル

  完了したプロジェクトをアーカイブに移動し、メタデータを保持します。

trigger_keywords:
  - "プロジェクトをアーカイブ"
  - "完了したのでアーカイブ"
  - "アーカイブ"
  - "archive-pj"
---

# archive-pj: プロジェクトアーカイブ

プロジェクトアーカイブスキルは、完了したプロジェクトをアーカイブに移動し、作業ディレクトリをクリーンに保ちます。

## 概要

このスキルは以下を実行します：

1. **完了確認**: プロジェクトが完了しているか確認
2. **メタデータ移動**: `.michi/pj/YYYYMMDD-{pj-name}/` を `.michi/archive-pj/{pj-name}-{timestamp}/` に移動
3. **仕様書保持**: `docs/michi/YYYYMMDD-{pj-name}/` は Git で管理されたまま保持
4. **アーカイブ記録**: アーカイブ日時をメタデータに記録

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「プロジェクトをアーカイブしたい」
- 「完了したのでアーカイブ」
- project.json の `phase: "implementation-complete"` の場合

### 明示的発動

```bash
/michi archive-pj {pj-name}
```

**例**:
```bash
/michi archive-pj user-auth
```

## 実行内容

### 1. 完了確認

以下を確認します：
- プロジェクトのフェーズが `implementation-complete` または手動アーカイブ許可
- すべてのタスクが完了している
- テストが合格している

### 2. メタデータ移動

以下のディレクトリを移動します：

```
移動前:
.michi/pj/YYYYMMDD-{pj-name}/

移動後:
.michi/archive-pj/{pj-name}-{timestamp}/
```

**timestamp**: アーカイブ日時（例: `20260117-150000`）

### 3. メタデータ更新

`project.json` に以下を追加：

```json
{
  "archivedAt": "2026-01-17T15:00:00Z",
  "archivedBy": "claude-code"
}
```

### 4. 仕様書は保持

仕様書（`docs/michi/YYYYMMDD-{pj-name}/`）は Git で管理されたまま保持されます。
これにより、過去のプロジェクトを参照できます。

## 次のステップ

アーカイブ後、新しいプロジェクトを開始できます：

```bash
/michi launch-pj "新しいプロジェクト説明"
```

## アーカイブ解除

アーカイブされたプロジェクトを復元する場合：

```bash
# 手動で .michi/archive-pj/ から .michi/pj/ に移動
mv .michi/archive-pj/{pj-name}-{timestamp} .michi/pj/YYYYMMDD-{pj-name}
```

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `show-status` - ステータス表示（アーカイブ前に確認）
- `launch-pj` - 新規プロジェクト初期化（アーカイブ後に実行）
- `switch-pj` - プロジェクト切り替え
