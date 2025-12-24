# Atlassian連携ガイド

JIRA と Confluence との連携機能を説明します。

## 前提条件

### 環境変数の設定

以下の環境変数が必要です。

**必須**:
- `ATLASSIAN_URL` - Atlassianドメイン（例: `https://your-domain.atlassian.net`）
- `ATLASSIAN_EMAIL` - Atlassianアカウントのメールアドレス
- `ATLASSIAN_API_TOKEN` - Atlassian APIトークン

**オプション**:
- `CONFLUENCE_PRD_SPACE` - Confluenceスペースキー（デフォルト: PRD）

**APIトークン取得**: https://id.atlassian.com/manage-profile/security/api-tokens から取得します。

**設定方法**: `.env` または `~/.michi/.env` ファイルでの設定方法と優先順位については、[環境変数リファレンス](../reference/environment-variables.md) を参照してください。

## Confluence同期

### 基本的な使い方

```bash
michi confluence:sync my-feature              # 要件定義
michi confluence:sync my-feature design       # 設計書
michi confluence:sync my-feature tasks        # タスク
```

### 設定

`.michi/config.json` でカスタマイズできます。

```json
{
  "confluence": {
    "spaces": {
      "requirements": "PRD",
      "design": "TECH"
    },
    "pageCreationGranularity": "hierarchical",
    "autoLabels": ["{projectLabel}", "{docType}", "github-sync"]
  }
}
```

**pageCreationGranularity**:
- `single`: 1ページ（デフォルト）
- `hierarchical`: 見出しごとに子ページ

### レートリミット

```bash
export ATLASSIAN_REQUEST_DELAY=1000  # ミリ秒
```

## JIRA同期

### 基本的な使い方

```bash
michi jira:sync my-feature
```

### Story詳細設定

```markdown
### Story 1.1: ユーザー認証

**説明**: OAuth2認証の実装
**優先度**: High
**見積もり**: 5 SP
**期限**: 2025-01-15

**完了条件**:
- [ ] OAuth2認証フロー
- [ ] トークン管理

**依存関係**: DB設計完了
```

### その他の操作

```bash
michi jira:transition PROJ-123 "In Progress"
michi jira:comment PROJ-123 "実装完了"
```

## トラブルシューティング

### Epic Linkが設定されない

```bash
export JIRA_EPIC_LINK_FIELD=customfield_10014
```

### Story Pointsが設定されない

```bash
export JIRA_STORY_POINTS_FIELD=customfield_10016
```

### APIレート制限エラー

```bash
export ATLASSIAN_REQUEST_DELAY=2000
```

## 関連リンク

- [設定ガイド](configuration.md)
- [ワークフローガイド](workflow.md)
- [Multi-Repoガイド](multi-repo.md)
