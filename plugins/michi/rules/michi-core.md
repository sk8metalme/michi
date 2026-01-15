---
title: Michiコア原則
description: GitHub SSoTとマルチプロジェクト管理のコア原則
---

# Michiコア原則

## 開発ガイドライン
{{DEV_GUIDELINES}}

## 言語
生成されるすべてのドキュメントは以下の言語で記述する必要があります: **{{LANG_CODE}}**

{{SPEC_DIR}}/project.json の language フィールドを参照してください。

## 単一の真実の源（SSoT）

### GitHubを真実の源とする
- **すべての仕様はGitHubで管理** ({{SPEC_DIR}}/pj/)
- Confluenceは**参照と承認のみ**（編集はGitHubのみ）
- 重複管理を避ける

### データフロー
```text
GitHub ({{SPEC_DIR}}/pj/)  ← 真実の源（編集可能）
    ↓ 同期
Confluence ← 表示と承認（読み取り専用）
```

## マルチプロジェクト管理

### プロジェクトの識別
- すべての操作は {{SPEC_DIR}}/project.json を参照
- プロジェクトID、JIRAキー、Confluenceラベルを動的に使用
- プロジェクトID: {{PROJECT_ID}}

### 命名規則

#### Confluenceページ
- 形式: `[{projectName}] {document_type}`
- 例: `[{{PROJECT_ID}}] Requirements`

#### JIRA Epic/Story
- 形式: `[{JIRA_KEY}] {title}`
- {{SPEC_DIR}}/project.json からプロジェクトメタデータを使用

## エージェントディレクトリ
- エージェント設定: {{AGENT_DIR}}
- ルール配置場所: {{AGENT_DIR}}/rules/
- コマンド配置場所: {{AGENT_DIR}}/commands/

## 機能開発
- 機能名: {{FEATURE_NAME}}
- 仕様配置場所: {{SPEC_DIR}}/pj/{{FEATURE_NAME}}/
