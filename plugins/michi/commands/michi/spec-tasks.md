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

## Michi Extension: Task Diff Size Guidelines

タスク分割時に、各サブタスクの git diff サイズを考慮してください。

### 推奨サイズ
- **目標**: 各サブタスクで 200-400 行の diff
- **最大**: 500 行まで（超過時は分割を検討）
- **警告**: 400行超過時は分割を推奨

### 除外対象ファイル（行数カウント対象外）
- **ロックファイル**: package-lock.json, yarn.lock, pnpm-lock.yaml, composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock, Cargo.lock, go.sum
- **自動生成ファイル**: *.min.js, *.min.css, *.map, dist/*, build/*, coverage/*, .next/*, *.d.ts, *.generated.ts, __snapshots__/*

### 分割戦略

タスクが大きすぎる場合の分割方法:

1. **水平分割（レイヤー別）**
   - model/repository → service/logic → controller/handler
   - 例: 「User CRUD」→「User model作成」「User service作成」「User controller作成」

2. **垂直分割（機能スライス別）**
   - core機能 → validation → error handling → edge cases
   - 例: 「認証機能」→「ログインcore」「バリデーション追加」「エラーハンドリング」

3. **フェーズ分割（段階別）**
   - 基本実装 → テスト追加 → 最適化
   - 例: 「検索機能」→「基本検索」「フィルター追加」「パフォーマンス最適化」

### タスク生成時の確認事項

タスク分割完了後、以下を確認してください:

- [ ] 各サブタスクの予想diff行数が500行以内か
- [ ] 大きなサブタスクは適切に分割されているか
- [ ] ロックファイルや自動生成ファイルを含むタスクはその旨が明記されているか

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

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-tasks` を拡張し、Phase 0.6（JIRA同期）への誘導を Next Phase として案内します。また、タスク粒度ガイドライン（git diff 500行制限）を提供し、適切なタスク分割を支援します。
