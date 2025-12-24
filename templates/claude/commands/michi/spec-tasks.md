---
name: /michi:spec-tasks
description: Generate implementation tasks with JIRA sync option (Michi version)
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, Bash
argument-hint: <feature-name> [-y] [--sequential]
---

# Michi: Spec Tasks with JIRA Sync Option

## Base Command Reference
@.claude/commands/kiro/spec-tasks.md

## Development Guidelines
{{DEV_GUIDELINES}}

---

## Michi Extension: JIRA Sync Prompt

このコマンドは cc-sdd 標準の `/kiro:spec-tasks` を拡張し、タスク生成完了後にJIRA同期オプションを提示します。

### 機能追加内容

1. **タスク生成完了後の次ステップ案内**:
   - JIRA連携が設定されている場合: JIRA同期の選択肢（A/B/C形式）を表示
   - JIRA連携が未設定の場合: 実装フェーズへの案内 + JIRA設定ヒントを表示

2. **環境変数による条件分岐**:
   - 以下の環境変数がすべて設定されている場合のみ、JIRA同期の選択肢を表示
   - `ATLASSIAN_URL`
   - `ATLASSIAN_EMAIL`
   - `ATLASSIAN_API_TOKEN`

---

## タスク生成完了後のフロー

基底コマンド `/kiro:spec-tasks` によるタスク生成が完了した後、以下のフローを実行してください:

### Step 1: 環境変数チェック

```bash
# JIRA連携の環境変数をチェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    JIRA_CONFIGURED=true
else
    JIRA_CONFIGURED=false
fi
```

### Step 2a: JIRA連携が設定されている場合の表示

`JIRA_CONFIGURED=true` の場合、以下のメッセージと選択肢を表示:

```
============================================
 タスク生成完了 - JIRA同期オプション
============================================

次のアクション:
A) JIRAにタスクを同期する（推奨: タスク管理を一元化）
   → `michi jira:sync {{FEATURE_NAME}}` を実行

B) JIRAへの同期をスキップして実装に進む
   → `/michi:spec-impl {{FEATURE_NAME}}` を実行

C) 何もせずにこのまま終了する

選択 (A/B/C): _
```

**選択肢の説明**:
- **A**: Epic/Story/Subtaskを自動作成し、タスクをJIRAに同期します
- **B**: JIRA同期をスキップして直接TDD実装フェーズに進みます
- **C**: タスク生成のみで終了し、ユーザーが手動で次のステップを選択します

### Step 2b: JIRA連携が未設定の場合の表示

`JIRA_CONFIGURED=false` の場合、以下のメッセージを表示:

```
============================================
 タスク生成完了
============================================

次のステップ:
→ `/michi:spec-impl {{FEATURE_NAME}}` で実装を開始

---
ℹ️ ヒント: JIRA連携を使用すると、タスクを自動的にJIRAに同期できます。

設定方法: 以下の環境変数を .env に追加してください:
   - ATLASSIAN_URL=https://your-domain.atlassian.net
   - ATLASSIAN_EMAIL=your-email@company.com
   - ATLASSIAN_API_TOKEN=your-api-token

詳細はドキュメントを参照: docs/guides/atlassian-integration.md
```

---

## 実装上の注意点

1. **基底コマンドの実行結果を維持**:
   - `/kiro:spec-tasks` の「Output Description」セクションで出力されるタスクサマリーは維持してください
   - Michi Extensionの選択肢はその**後**に追加で表示します

2. **言語設定の考慮**:
   - メッセージは日本語固定（将来的にspec.jsonの言語設定に対応する可能性あり）

3. **ユーザーインタラクション**:
   - 選択肢を表示した後、ユーザーの入力を待ちます
   - 選択に応じて適切なコマンド/処理を案内または実行してください

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-tasks` を拡張し、Phase 0.6（JIRA同期）への誘導を Next Phase として案内します。これにより、タスク分割からJIRA連携へのスムーズな移行を実現します。
