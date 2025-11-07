#!/bin/bash

# 環境変数設定スクリプト
# このスクリプトは.envファイルのテンプレートを作成します

# 既存の.envファイルがある場合は確認
if [ -f .env ]; then
  echo "⚠️  .env ファイルが既に存在します"
  read -p "上書きしますか？ (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
  fi
fi

cat > .env << 'EOF'
# Atlassian設定（MCP + REST API共通）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=sk8metalme/michi

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRAプロジェクトキー（カンマ区切り）
JIRA_PROJECT_KEYS=MICHI,PRJA,PRJB

# Slack通知用（オプション）
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
EOF

# セキュアなパーミッション設定（所有者のみ読み取り/書き込み可能）
chmod 600 .env

echo "✅ .env ファイルが作成されました"
echo "✅ パーミッション 600 を設定しました（所有者のみ読み取り/書き込み可能）"
echo ""
echo "⚠️  重要: .env ファイルをGitにコミットしないでください"
echo "   .gitignore で除外されていることを確認してください"
echo ""
echo "📝 次のステップ:"
echo "   1. 実際の認証情報で .env の値を更新してください"
echo "   2. セットアップ手順に従ってください"

