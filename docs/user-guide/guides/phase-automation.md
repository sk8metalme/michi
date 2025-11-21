# フェーズ自動化ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

AI-DLC（AI Development Life Cycle）の各フェーズで、Confluence/JIRA作成を**確実に実行**するためのスクリプトガイドです。

## 問題: AIだけでは抜け漏れが発生する

**従来の問題**:
- AIが要件定義書（requirements.md）を作成
- しかし、Confluenceページ作成を忘れる ❌
- PMや部長がレビューできない状態で設計フェーズへ進んでしまう

**解決策**:
- **スクリプトによる自動化**で、Confluence/JIRA作成を確実に実行
- **バリデーション**で、必須項目の抜け漏れをチェック

## 使い方

### Phase 1: 要件定義

```bash
# Step 1: AIで requirements.md を作成
# 凡例
/kiro:spec-requirements <feature>

# 具体例
/kiro:spec-requirements user-auth

# Step 2: スクリプトでConfluence作成＋バリデーション（必須）
# 凡例
npm run phase:run <feature> requirements

# 具体例
npm run phase:run user-auth requirements

# 実行内容:
#  ✅ requirements.md 存在確認
#  ✅ Confluenceページ自動作成（要件定義）
#  ✅ spec.json自動更新
#  ✅ バリデーション実行
#
# 成功時:
#  🎉 要件定義フェーズが完了しました！
#  📢 PMや部長にConfluenceでレビューを依頼してください
```

### Phase 2: 設計

```bash
# Step 1: AIで design.md を作成
# 凡例
/kiro:spec-design <feature>

# 具体例
/kiro:spec-design user-auth

# Step 2: スクリプトでConfluence作成＋バリデーション（必須）
# 凡例
npm run phase:run <feature> design

# 具体例
npm run phase:run user-auth design

# 実行内容:
#  ✅ design.md 存在確認
#  ✅ 要件定義完了チェック（前提条件）
#  ✅ Confluenceページ自動作成（設計書）
#  ✅ spec.json自動更新
#  ✅ バリデーション実行
#
# 成功時:
#  🎉 設計フェーズが完了しました！
#  📢 PMや部長にConfluenceでレビューを依頼してください
```

### Phase 3: タスク分割

```bash
# Step 1: AIで tasks.md を作成（営業日ベース）
# 凡例
/kiro:spec-tasks <feature>

# 具体例
/kiro:spec-tasks user-auth

# Step 2: スクリプトでJIRA作成＋バリデーション（必須）
# 凡例
npm run phase:run <feature> tasks

# 具体例
npm run phase:run user-auth tasks

# 実行内容:
#  ✅ tasks.md 存在確認（営業日表記チェック）
#  ✅ 設計完了チェック（前提条件）
#  ✅ JIRA Epic自動作成
#  ✅ JIRA Story自動作成（全ストーリー）
#  ✅ spec.json自動更新
#  ✅ バリデーション実行
#
# 成功時:
#  🎉 タスク分割フェーズが完了しました！
#  📢 開発チームに実装開始を通知してください
#  🚀 次のステップ: /kiro:spec-impl <feature>
```

## バリデーションスクリプト

フェーズが完了しているか確認するだけの場合：

```bash
# 凡例
npm run validate:phase <feature> <phase>

# 具体例
npm run validate:phase user-auth requirements  # 要件定義のバリデーション
npm run validate:phase user-auth design         # 設計のバリデーション
npm run validate:phase user-auth tasks          # タスク分割のバリデーション
```

### バリデーション項目

#### 要件定義

- [ ] requirements.md作成済み
- [ ] **Confluenceページ作成済み** ← 重要
- [ ] spec.jsonにconfluence.requirementsPageId記録
- [ ] spec.jsonにconfluence.spaceKey記録

#### 設計

- [ ] design.md作成済み
- [ ] 要件定義完了（前提条件）
- [ ] **Confluenceページ作成済み** ← 重要
- [ ] spec.jsonにconfluence.designPageId記録

#### タスク分割

- [ ] tasks.md作成済み
- [ ] tasks.mdに営業日表記（月、火、水...）
- [ ] tasks.mdに営業日カウント（Day 1, Day 2...）
- [ ] tasks.mdに土日休みの明記
- [ ] 設計完了（前提条件）
- [ ] **JIRA Epic作成済み** ← 重要
- [ ] **JIRA Story作成済み** ← 重要
- [ ] spec.jsonにjira.epicKey記録
- [ ] spec.jsonにjira.stories記録

## エラー時の対処

### Confluenceスペース不在エラー

```text
❌ Confluenceスペースが存在しません: PRD
   → Confluenceで新しいスペースを作成: https://0kuri0n.atlassian.net/wiki/spaces
   → または、.envのCONFLUENCE_PRD_SPACEを修正してください
```

**対処法1**: Confluenceでスペースを作成
1. [Confluenceスペース一覧](https://0kuri0n.atlassian.net/wiki/spaces) にアクセス
2. 「スペースを作成」をクリック
3. スペースキーを「PRD」または「Michi」で作成

**対処法2**: .envを修正
```bash
vim .env
# 既存のスペースキーに変更
CONFLUENCE_PRD_SPACE=Michi  # ← 実際に存在するスペース
```

### Confluenceページ作成エラー

```text
❌ Confluenceページ（要件定義）が作成されていません
   → 実行: npm run confluence:sync <feature> requirements
```

**対処**:
```bash
# 個別に実行
npm run confluence:sync calculator-app requirements
```

### JIRAプロジェクト不在エラー

```text
❌ JIRAプロジェクトが存在しません: PRAC1
   → JIRAプロジェクト作成: https://0kuri0n.atlassian.net/jira/projects/create
   → プロジェクト一覧: https://0kuri0n.atlassian.net/jira/settings/projects
   → または、.kiro/project.jsonのjiraProjectKeyを修正してください
      現在の設定: "PRAC1" → 実際に存在するキーに変更
```

**対処法1**: JIRAでプロジェクトを作成
1. [JIRAプロジェクト作成](https://0kuri0n.atlassian.net/jira/projects/create) にアクセス
2. プロジェクト名とキーを入力
   - 名前: michi-practice1
   - キー: PRAC1（または任意）
3. プロジェクトタイプ: ソフトウェア開発

**対処法2**: project.jsonを修正
```bash
vim .kiro/project.json
# 既存のプロジェクトキーに変更
{
  "jiraProjectKey": "MP"  # ← 実際に存在するプロジェクトキー
}
```

### JIRA作成エラー

```text
❌ JIRA Epicが作成されていません
   → 実行: npm run jira:sync <feature>
```

**対処**:
```bash
# 個別に実行
npm run jira:sync calculator-app
```

### 認証エラー

```text
Authentication failed: {"code":401,"message":"Unauthorized"}
```

**対処**:
1. Cursorを再起動（Cmd+Q → 再起動）
2. Atlassian MCP認証トークンがリフレッシュされる
3. 再度スクリプトを実行

## 推奨ワークフロー（確実な方法）

```bash
# 1. 要件定義
/kiro:spec-requirements calculator-app  # AI実行
npm run phase:run calculator-app requirements  # スクリプト実行（必須）

# 2. 設計
/kiro:spec-design calculator-app  # AI実行
npm run phase:run calculator-app design  # スクリプト実行（必須）

# 3. タスク分割
/kiro:spec-tasks calculator-app  # AI実行
npm run phase:run calculator-app tasks  # スクリプト実行（必須）

# 4. バリデーション（全フェーズ）
npm run validate:phase calculator-app requirements
npm run validate:phase calculator-app design
npm run validate:phase calculator-app tasks

# 5. 実装開始
/kiro:spec-impl calculator-app
```

## メリット

### 1. 抜け漏れ防止

- スクリプトが確実にConfluence/JIRAを作成
- AIの判断ミスをカバー

### 2. 自動バリデーション

- 必須項目の完了チェック
- エラーメッセージで対処法を表示

### 3. Exit Code対応

- スクリプトの成功/失敗がExit Codeで判定可能
- CI/CDパイプラインに組み込み可能

### 4. 再実行安全（冪等性）

**Confluence**:
- 既存ページがあれば更新（バージョン番号が上がる）
- 何度実行しても重複ページは作成されない

**JIRA**:
- spec.jsonに記録されたEpic/Storyキーをチェック
- 既存のEpic/Storyがあればスキップ
- 新しいStoryのみ作成

## 2回実行した場合の動作（冪等性）

### Confluence（requirements/design）

```bash
# 1回目
npm run phase:run calculator-app requirements
  → Confluenceページ新規作成（version 1）

# 2回目（誤って再実行）
npm run phase:run calculator-app requirements
  → 既存ページを検索
  → 既存ページ更新（version 1 → 2）
  → ✅ 重複なし
```

**結果**: 最新の内容で上書き更新されるだけ ✅

### JIRA（tasks）

```bash
# 1回目
npm run phase:run calculator-app tasks
  → spec.jsonをチェック（Epic未記録）
  → JQL検索（既存Epicなし）
  → Epic作成: MP-1
  → Story作成: MP-2〜MP-14（13個）
  → spec.jsonに記録

# 2回目（誤って再実行）
npm run phase:run calculator-app tasks
  → spec.jsonをチェック（Epic: MP-1記録済み）
  → 既存Epic検出: MP-1
  → Epic作成スキップ ✅
  → JQL検索（既存Story: MP-2〜MP-14）
  → 既存Storyをスキップ ✅
  → 新しいStoryのみ作成（0個）
  → ✅ 重複なし
```

**結果**: 既存のEpic/Storyはスキップされ、重複作成されない ✅

### tasks.mdを修正した場合

```bash
# tasks.mdに新しいStoryを追加
# Story 8.1: 新機能を追加

# 再実行
npm run phase:run calculator-app tasks
  → 既存Epic: MP-1（スキップ）
  → 既存Story: MP-2〜MP-14（スキップ）
  → 新しいStory: MP-15（作成） ← 新規のみ作成
```

**結果**: 追加分のみが作成される ✅

## まとめ

**AIだけ**: 抜け漏れの可能性あり ❌  
**AI + スクリプト**: 確実に実行 ✅

**冪等性**: 何度実行しても安全 ✅
- Confluence: 既存ページを更新
- JIRA: 既存Epic/Storyをスキップ

**今後の開発フロー**:
1. AIでMarkdownファイル作成
2. **スクリプトでConfluence/JIRA作成（必須）**
3. バリデーションで確認
4. レビュー依頼
5. 次のフェーズへ

