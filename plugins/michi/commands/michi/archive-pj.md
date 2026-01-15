---
name: /michi:archive-pj
description: Confluence同期オプション付きで完了した仕様をアーカイブ（Michiバージョン）
allowed-tools: Bash, Read, Glob, Write, Edit
argument-hint: <feature-name> [--reason <reason>]
---

# Michi: Confluence同期付き仕様アーカイブ

<background_information>
- **ミッション**: 完了した仕様を {{MICHI_DIR}}/archive-pj/ にアーカイブする
- **成功基準**:
  - 仕様ディレクトリをアーカイブに移動
  - アーカイブタイムスタンプを記録
  - アーカイブ内の元の仕様にアクセス可能
  - Confluence同期オプションを提供（設定されている場合）
</background_information>

## 開発ガイドライン
{{DEV_GUIDELINES}}

---

<instructions>
## コアタスク
仕様 **$1** をアーカイブディレクトリにアーカイブします。

## 実行手順

### 基本実装

1. **仕様の存在確認**: `{{MICHI_DIR}}/pj/$1/` ディレクトリが存在することを確認
2. **タスク完了チェック**: tasks.md ですべてのタスクが `[x]` としてマークされていることを確認（未完了タスクが存在する場合は警告）
3. **アーカイブディレクトリの作成**: `{{MICHI_DIR}}/archive-pj/` が存在しない場合は作成
4. **タイムスタンプの生成**: ISO 8601形式（YYYY-MM-DDTHH:MM:SSZ）で現在のタイムスタンプを取得
5. **仕様の移動**: `{{MICHI_DIR}}/pj/$1/` → `{{MICHI_DIR}}/archive-pj/$1-{timestamp}/`
6. **メタデータの更新**: 移動した spec.json にアーカイブタイムスタンプを記録

### Michi拡張機能

7. **Confluence同期オプション**:
   - 環境変数をチェック: `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`
   - 設定されている場合: アーカイブステータスをConfluenceに同期するオプションを提供
   - Confluence同期コマンド提案を表示

8. **次のステップガイダンス**:
   - リリースノート確認を提案
   - 次の機能開発へのガイド
   - 全体進捗確認コマンド

## 重要な制約
- **タスク完了チェック**: 仕様に未完了タスク（tasks.md の `- [ ]`）がある場合、ユーザーに警告
- **すべてのファイルを保持**: すべての成果物を含む全ディレクトリを移動（spec.json, requirements.md, design.md, tasks.md, research.md など）
- **競合処理**: 同じ名前のアーカイブ済み仕様が存在する場合、競合を避けるために数字のサフィックスを追加
- **削除なし**: アーカイブは移動操作であり、削除ではない - すべてのデータが保持される
</instructions>

## ツールガイダンス
- **Glob** を使用して仕様ディレクトリが存在するかをチェック
- **Read** を使用して tasks.md の未完了タスクをチェック
- **Bash** を使用してアーカイブディレクトリを作成し、仕様ディレクトリを移動
- **Write** または **Edit** を使用してアーカイブメタデータで spec.json を更新
- **Bash** を使用してConfluence統合のための環境変数をチェック

## 出力説明

spec.json で指定された言語で以下の出力を提供:

### 基本出力

1. **アーカイブステータス**: 仕様が正常にアーカイブされたことを確認
2. **アーカイブの場所**: アーカイブされた仕様への完全なパスを表示
3. **タスク完了ステータス**: すべてのタスクが完了したかを報告
4. **アクセス手順**: アーカイブされた仕様を表示または復元する方法

### Michi拡張出力

基本出力の後に追加:

```text
✅ Archived specification: <feature>
📁 Archive path: .michi/archive-pj/<feature>-{timestamp}/
📝 Reason: <reason>

📚 Optional: Sync archive status to Confluence
   /michi:sync-confluence <feature> --status archived

📝 Next Steps:
1. **リリースノート確認**: docs/release-notes/ にリリースノートが保存されているか確認
2. **次の機能開発**: /michi:launch-pj "<description>" で新しいspec作成
3. **全体進捗確認**: /michi:show-status --all でアーカイブ含む全spec進捗確認
```

**形式要件**:
- 明確にするためにMarkdownの見出しを使用
- コードブロックに完全なパスを含める
- 要約を簡潔に保つ（200語以下）

## 安全性とフォールバック

### エラーシナリオ

**仕様が見つからない**:
- **実行停止**: 存在しない仕様はアーカイブできない
- **ユーザーメッセージ**: "`{{MICHI_DIR}}/pj/$1/` に仕様が見つかりません"
- **推奨アクション**: "`ls {{MICHI_DIR}}/pj/` で利用可能なプロジェクトを確認してください"

**未完了タスク**:
- **警告**: "仕様に未完了タスクがあります。それでもアーカイブしますか？"
- **ユーザーアクション**: ユーザーに確認を求めるか、残りのタスクを完了するよう求める
- **続行**: ユーザー確認後のみ

**アーカイブディレクトリの競合**:
- **自動解決**: 一意のアーカイブ名を確保するためにタイムスタンプサフィックスを追加
- **ユーザーメッセージ**: "アーカイブ名が存在します。使用するもの: $1-{timestamp}-2"

**アーカイブディレクトリ作成失敗**:
- **実行停止**: 具体的なパスとともにエラーを報告
- **推奨アクション**: "ディレクトリの権限とディスク容量を確認してください"

### アーカイブされた仕様の表示

アーカイブされた仕様を表示するには:
```bash
ls {{MICHI_DIR}}/archive-pj/
cat {{MICHI_DIR}}/archive-pj/{feature-name}-{timestamp}/spec.json
```

### アーカイブされた仕様の復元

アーカイブから復元するには:
```bash
mv {{MICHI_DIR}}/archive-pj/{feature-name}-{timestamp} {{MICHI_DIR}}/pj/{feature-name}
```

**注意**: アーカイブされた仕様は慣例として読み取り専用です。アーカイブされた仕様で作業を続行する必要がある場合は、最初に復元してください。

---

**Michi統合**: このコマンドは、Confluence同期オプションとアーカイブ後の次のステップガイダンスで基本仕様アーカイブを拡張し、シームレスなワークフロー継続を実現します。

think
