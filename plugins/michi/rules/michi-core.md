---
title: Michiコア原則
description: GitHub SSoTとマルチプロジェクト管理のコア原則
---

# Michiコア原則

## 開発ガイドライン
{{DEV_GUIDELINES}}

## 言語
生成されるすべてのドキュメントは**日本語**で記述する必要があります。

## 単一の真実の源（SSoT）

### GitHubを真実の源とする
- **すべての仕様はGitHubで管理** ({{MICHI_DIR}}/pj/)
- 重複管理を避ける

## マルチプロジェクト管理

### プロジェクトの識別
- すべての操作は {{MICHI_DIR}}/pj/{{FEATURE_NAME}}/project.json を参照
- プロジェクトID: {{PROJECT_ID}}

## ディレクトリ構造

### プロジェクトディレクトリ
- **{{MICHI_DIR}}**: プロジェクト内のMichiディレクトリ（`.michi/`）
  - プロジェクトメタデータ配置: `{{MICHI_DIR}}/pj/`
  - プロジェクト固有の設定

### グローバル設定ディレクトリ
- **{{MICHI_GLOBAL_DIR}}**: ユーザーのホームディレクトリ（`~/.michi/`）
  - 全プロジェクト共通の設定: `{{MICHI_GLOBAL_DIR}}/settings/`
  - ルール: `{{MICHI_GLOBAL_DIR}}/settings/rules/`
  - テンプレート: `{{MICHI_GLOBAL_DIR}}/settings/templates/`

## エージェントディレクトリ
- エージェント設定: {{AGENT_DIR}}
- ルール配置場所: {{AGENT_DIR}}/rules/
- コマンド配置場所: {{AGENT_DIR}}/commands/

## 機能開発
- 機能名: {{FEATURE_NAME}}
- メタデータ配置: {{MICHI_DIR}}/pj/{{FEATURE_NAME}}/project.json
- 仕様書配置: docs/michi/{{FEATURE_NAME}}/spec/
- タスク配置: docs/michi/{{FEATURE_NAME}}/tasks/
- リサーチ配置: docs/michi/{{FEATURE_NAME}}/research/
- テスト計画配置: docs/michi/{{FEATURE_NAME}}/test-plan/
