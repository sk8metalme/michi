# 検証チェックリスト

このドキュメントでは、Michiワークフローの各ステップが正しく動作しているかを確認するためのチェックリストを提供します。

## 📋 チェックリストの使い方

各フェーズの作業後に、対応するセクションのチェック項目を確認してください。すべての項目が✅であれば、次のフェーズに進めます。

## セットアップの確認

### 環境セットアップ

- [ ] Node.js 20.x以上がインストールされている
  ```bash
  node --version  # v20.0.0以上
  ```

- [ ] npm 10.x以上がインストールされている
  ```bash
  npm --version  # 10.0.0以上
  ```

- [ ] Git（またはJujutsu）がインストールされている
  ```bash
  git --version  # または jj --version
  ```

- [ ] GitHub CLIがインストールされている
  ```bash
  gh --version
  ```

- [ ] GitHub CLIが認証されている
  ```bash
  gh auth status
  # ✅ Logged in to github.com
  ```

### Michiのインストール確認

- [ ] Michiがインストールされている
  ```bash
  michi --version  # 0.2.0以上
  ```

- [ ] Michiコマンドが実行できる
  ```bash
  michi --help
  # Usage: michi [options] [command] が表示される
  ```

### プロジェクトファイルの確認

- [ ] `.kiro/project.json` が存在する
  ```bash
  ls -la .kiro/project.json
  ```

- [ ] `.kiro/settings/templates/` が存在する
  ```bash
  ls -la .kiro/settings/templates/
  # requirements.md, design.md, tasks.md が存在
  ```

- [ ] `.kiro/steering/` が存在する（オプション: `/kiro:steering`コマンドで作成）
  ```bash
  ls -la .kiro/steering/
  # セットアップ直後は存在しない。必要に応じて /kiro:steering コマンドで作成
  # 作成後は product.md, tech.md, structure.md が存在
  ```

- [ ] 環境別ルールファイルが存在する（Cursor IDEの場合）
  ```bash
  ls -la .cursor/rules/
  # atlassian-mcp.mdc, github-ssot.mdc, multi-project.mdc が存在
  ```

- [ ] 環境別コマンドファイルが存在する（Cursor IDEの場合）
  ```bash
  ls -la .cursor/commands/michi/
  # confluence-sync.md, project-switch.md が存在
  ```

### 環境変数の確認

- [ ] `.env` ファイルが存在する
  ```bash
  ls -la .env
  ```

- [ ] `.env` の権限が600である
  ```bash
  stat -f "%Lp %N" .env  # macOS
  # 600 .env が表示される
  ```

- [ ] GitHub認証情報が設定されている
  ```bash
  grep GITHUB_TOKEN .env
  # GITHUB_TOKEN=ghp_xxx
  ```

- [ ] （オプション）Atlassian認証情報が設定されている
  ```bash
  grep ATLASSIAN .env
  # ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN
  ```

## Phase 0: 初期化 (spec-init)

### spec-init実行後

- [ ] `.kiro/specs/<feature>/` ディレクトリが作成された
  ```bash
  ls -la .kiro/specs/health-check-endpoint/
  ```

- [ ] `spec.json` ファイルが生成された
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json
  ```

- [ ] `spec.json` に必要なフィールドが含まれている
  ```bash
  # 以下のフィールドが存在するか確認:
  # - feature: "health-check-endpoint"
  # - status: "draft"
  # - createdAt: "..."
  # - phases: {...}
  ```

### 期待される出力

```json
{
  "feature": "health-check-endpoint",
  "status": "draft",
  "createdAt": "2025-01-15T10:00:00Z",
  "phases": {
    "requirements": "pending",
    "design": "pending",
    "tasks": "pending",
    "implementation": "pending"
  }
}
```

## Phase 1: 要件定義 (spec-requirements + phase:run)

### spec-requirements実行後

- [ ] `requirements.md` ファイルが生成された
  ```bash
  ls -la .kiro/specs/health-check-endpoint/requirements.md
  ```

- [ ] `requirements.md` に必要なセクションが含まれている
  ```bash
  grep "ビジネス要件" .kiro/specs/health-check-endpoint/requirements.md
  grep "機能要件" .kiro/specs/health-check-endpoint/requirements.md
  grep "非機能要件" .kiro/specs/health-check-endpoint/requirements.md
  ```

### phase:run requirements実行後

- [ ] Confluenceページが作成された
  ```bash
  # spec.jsonを確認
  grep requirementsPageId .kiro/specs/health-check-endpoint/spec.json
  # "requirementsPageId": "123456789"
  ```

- [ ] `spec.json` が更新された（requirementsフェーズ）
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.phases.requirements'
  # "completed"
  ```

- [ ] `spec.json` にConfluence情報が記録された
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.confluence.requirementsPageId'
  # "123456789"
  ```

### Confluenceページの確認

- [ ] Confluenceページが正しく作成されている
  - タイトル: `[プロジェクト名] health-check-endpoint - 要件定義`
  - ラベル: `project:xxx`, `feature:health-check-endpoint`, `phase:requirements`
  - 本文: requirements.mdの内容が反映されている

## Phase 2: 設計 (spec-design + phase:run)

### spec-design実行後

- [ ] `design.md` ファイルが生成された
  ```bash
  ls -la .kiro/specs/health-check-endpoint/design.md
  ```

- [ ] `design.md` に必要なセクションが含まれている
  ```bash
  grep "アーキテクチャ" .kiro/specs/health-check-endpoint/design.md
  grep "API設計" .kiro/specs/health-check-endpoint/design.md
  ```

### phase:run design実行後

- [ ] Confluenceページが作成された
  ```bash
  grep designPageId .kiro/specs/health-check-endpoint/spec.json
  # "designPageId": "123456790"
  ```

- [ ] `spec.json` が更新された（designフェーズ）
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.phases.design'
  # "completed"
  ```

- [ ] `spec.json` にConfluence情報が記録された
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.confluence.designPageId'
  # "123456790"
  ```

### Confluenceページの確認

- [ ] Confluenceページが正しく作成されている
  - タイトル: `[プロジェクト名] health-check-endpoint - 設計書`
  - ラベル: `project:xxx`, `feature:health-check-endpoint`, `phase:design`
  - 本文: design.mdの内容が反映されている

## Phase 3: タスク分割 (spec-tasks + phase:run)

### spec-tasks実行後

- [ ] `tasks.md` ファイルが生成された
  ```bash
  ls -la .kiro/specs/health-check-endpoint/tasks.md
  ```

- [ ] `tasks.md` に全6フェーズが含まれている
  ```bash
  grep "Phase 0: 要件定義" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 1: 設計" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 2: 実装" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 3: 試験" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 4: リリース準備" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 5: リリース" .kiro/specs/health-check-endpoint/tasks.md
  ```

- [ ] 各フェーズにラベルが含まれている
  ```bash
  grep "Phase 0:.*（Requirements）" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 1:.*（Design）" .kiro/specs/health-check-endpoint/tasks.md
  grep "Phase 2:.*（Implementation）" .kiro/specs/health-check-endpoint/tasks.md
  # ...
  ```

### phase:run tasks実行後

- [ ] JIRA Epicが作成された
  ```bash
  grep epicKey .kiro/specs/health-check-endpoint/spec.json
  # "epicKey": "DEMO-100"
  ```

- [ ] JIRA Storiesが作成された
  ```bash
  grep stories .kiro/specs/health-check-endpoint/spec.json
  # "stories": ["DEMO-101", "DEMO-102", ...]
  ```

- [ ] `spec.json` が更新された（tasksフェーズ）
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.phases.tasks'
  # "completed"
  ```

- [ ] `spec.json` にJIRA情報が記録された
  ```bash
  cat .kiro/specs/health-check-endpoint/spec.json | jq '.jira'
  # { "epicKey": "DEMO-100", "stories": [...] }
  ```

### JIRAの確認

- [ ] JIRA Epicが正しく作成されている
  - Epic Key: `DEMO-100`（例）
  - Summary: `[プロジェクト名] health-check-endpoint`
  - Labels: `feature:health-check-endpoint`

- [ ] JIRA Storiesが正しく作成されている
  - 全6フェーズのStoryが存在する
  - 各Storyに適切なラベルが付与されている：
    - `Requirements`
    - `Design`
    - `Implementation`
    - `Testing`
    - `Release-Preparation`
    - `Release`

- [ ] 各StoryがEpicにリンクされている
  ```bash
  # JIRAでEpicを開き、リンクされたStoryを確認
  open "https://your-domain.atlassian.net/browse/DEMO-100"
  ```

## Phase 4-6: 実装・テスト・リリース

### 実装準備

- [ ] GitHubブランチが作成された
  ```bash
  jj bookmark list
  # michi/feature/health-check-endpoint が存在
  ```

- [ ] コミットが作成された
  ```bash
  jj log -r '@-'
  # feat: health-check-endpoint の実装開始 [DEMO-103]
  ```

### 実装（TDD）

- [ ] テストコードが先に作成された
  ```bash
  ls -la src/test/java/.../HealthControllerTest.java
  ```

- [ ] 実装コードが作成された
  ```bash
  ls -la src/main/java/.../HealthController.java
  ```

- [ ] テストが成功する
  ```bash
  npm test
  # または mvn test / gradle test
  ```

## トラブルシューティング用チェック

### phase:runコマンドがエラーになる

- [ ] Markdownファイル（requirements.md, design.md, tasks.md）が存在する
  ```bash
  ls -la .kiro/specs/health-check-endpoint/*.md
  ```

- [ ] `.env` ファイルに認証情報が設定されている
  ```bash
  cat .env | grep -E "(ATLASSIAN|GITHUB|JIRA)"
  ```

- [ ] JIRA Issue Type IDsが正しく設定されている
  ```bash
  grep JIRA_ISSUE_TYPE .env
  # JIRA_ISSUE_TYPE_STORY=10036
  # JIRA_ISSUE_TYPE_SUBTASK=10037
  ```

### Confluenceページが作成されない

- [ ] Atlassian認証情報が正しい
  ```bash
  # REST APIで確認
  curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
    $ATLASSIAN_URL/rest/api/content
  ```

- [ ] Confluenceスペースが存在する
  ```bash
  # .envで指定したスペースが存在するか確認
  grep CONFLUENCE_PRD_SPACE .env
  ```

### JIRAが作成されない

- [ ] JIRAプロジェクトキーが正しい
  ```bash
  grep JIRA_PROJECT_KEYS .env
  ```

- [ ] JIRA Issue Type IDsが正しい
  ```bash
  # REST APIで確認
  curl -u $ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN \
    $ATLASSIAN_URL/rest/api/3/issuetype
  ```

- [ ] tasks.mdのフォーマットが正しい
  ```bash
  # フェーズヘッダーの形式を確認
  grep "^## Phase" .kiro/specs/health-check-endpoint/tasks.md
  # ## Phase 0: 要件定義（Requirements）
  # ## Phase 1: 設計（Design）
  # ...
  ```

## 完了確認

すべてのチェックが✅になったら、ワークフローは正常に完了しています。

### 最終確認

- [ ] `.kiro/specs/<feature>/` に4つのファイルが存在する
  - `spec.json`
  - `requirements.md`
  - `design.md`
  - `tasks.md`

- [ ] Confluenceページが2つ作成された
  - 要件定義ページ
  - 設計書ページ

- [ ] JIRAが作成された
  - 1つのEpic
  - 複数のStories（全6フェーズ）

- [ ] GitHubブランチが作成された

- [ ] 実装準備が完了した

おつかれさまでした！すべてのフェーズが正常に完了しました。🎉

## 📚 関連ドキュメント

- [ワークフロー体験ガイド](./workflow-walkthrough.md)
- [トラブルシューティング](./troubleshooting.md)
- [ワークフローガイド](../guides/workflow.md)
- [クイックリファレンス](../reference/quick-reference.md)





