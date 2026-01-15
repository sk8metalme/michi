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
- 重複管理を避ける

## マルチプロジェクト管理

### プロジェクトの識別
- すべての操作は {{SPEC_DIR}}/project.json を参照
- プロジェクトID: {{PROJECT_ID}}

## エージェントディレクトリ
- エージェント設定: {{AGENT_DIR}}
- ルール配置場所: {{AGENT_DIR}}/rules/
- コマンド配置場所: {{AGENT_DIR}}/commands/

## 機能開発
- 機能名: {{FEATURE_NAME}}
- 仕様配置場所: {{SPEC_DIR}}/pj/{{FEATURE_NAME}}/
