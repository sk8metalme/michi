#!/bin/bash
#
# 既存プロジェクトにMichiワークフローを追加（簡易版）
#
# 使い方:
#   cd /path/to/existing-repo
#   bash /path/to/michi/scripts/setup-existing.sh
#

set -e

# 色付きメッセージ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 既存プロジェクトにMichiワークフローを追加${NC}"
echo ""

# Michiリポジトリのパスを推測
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICHI_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}📂 Michiパス: ${MICHI_PATH}${NC}"
echo -e "${BLUE}📂 現在のディレクトリ: $(pwd)${NC}"
echo ""

# プロジェクト情報を入力
echo -e "${YELLOW}プロジェクト情報を入力してください:${NC}"
echo ""

read -p "プロジェクト名（例: プロジェクトA）: " PROJECT_NAME
read -p "JIRAプロジェクトキー（例: PRJA）: " JIRA_KEY

# 入力値の検証
if [[ -z "${PROJECT_NAME// /}" ]]; then
  echo -e "${YELLOW}⚠️  プロジェクト名が空です${NC}"
  exit 1
fi

if [[ -z "${JIRA_KEY// /}" ]]; then
  echo -e "${YELLOW}⚠️  JIRAプロジェクトキーが空です${NC}"
  exit 1
fi

PROJECT_ID=$(basename "$(pwd)")

echo ""
echo -e "${GREEN}✅ 設定:${NC}"
echo "   プロジェクトID: ${PROJECT_ID}"
echo "   プロジェクト名: ${PROJECT_NAME}"
echo "   JIRA: ${JIRA_KEY}"
echo ""

read -p "この設定で続行しますか？ [Y/n]: " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn] ]]; then
    echo "中止しました"
    exit 0
fi

# TypeScriptスクリプトの存在確認
SETUP_SCRIPT="${MICHI_PATH}/scripts/setup-existing-project.ts"
if [ ! -f "${SETUP_SCRIPT}" ]; then
  echo -e "${YELLOW}❌ セットアップスクリプトが見つかりません: ${SETUP_SCRIPT}${NC}"
  echo "   Michiパスが正しいか確認してください"
  exit 1
fi

# TypeScriptスクリプトを実行
echo ""
echo -e "${BLUE}🔧 セットアップスクリプトを実行...${NC}"

if ! npx tsx "${SETUP_SCRIPT}" \
  --michi-path "${MICHI_PATH}" \
  --project-name "${PROJECT_NAME}" \
  --jira-key "${JIRA_KEY}"; then
  echo ""
  echo -e "${YELLOW}❌ セットアップスクリプトが失敗しました${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 セットアップ完了！${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 次のステップ（重要）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Step 1: 認証情報の設定 (.env ファイル編集)${NC}"
echo "   ファイル: $(pwd)/.env"
echo ""
echo "   ${BLUE}🔑 Atlassian API トークンの取得:${NC}"
echo "      1. Atlassian アカウントにログイン"
echo "      2. https://id.atlassian.com/manage-profile/security/api-tokens にアクセス"
echo "      3. 「APIトークンを作成」をクリック"
echo "      4. ラベルを入力（例: Michi Workflow）して作成"
echo "      5. 生成されたトークンをコピー（※一度しか表示されません）"
echo ""
echo "   ${BLUE}🔑 GitHub Personal Access Token の取得:${NC}"
echo "      1. GitHub にログイン"
echo "      2. https://github.com/settings/tokens にアクセス"
echo "      3. 「Generate new token (classic)」をクリック"
echo "      4. スコープを選択: repo, workflow, read:org"
echo "      5. 「Generate token」をクリックしてトークンをコピー"
echo ""
echo "   ${GREEN}編集例:${NC}"
echo "      ATLASSIAN_URL=https://your-domain.atlassian.net"
echo "      ATLASSIAN_EMAIL=your-email@company.com"
echo "      ATLASSIAN_API_TOKEN=<上記で取得したトークン>"
echo "      GITHUB_TOKEN=ghp_xxxxxxxxxxxxx"
echo ""
echo -e "${YELLOW}Step 2: 依存パッケージのインストール${NC}"
echo "   ${GREEN}$ npm install${NC}"
echo "   ※ package.json が新規作成された場合のみ実行"
echo ""
echo -e "${YELLOW}Step 3: 変更をコミット${NC}"
echo "   ${GREEN}$ jj status${NC}                                    # 変更確認"
echo "   ${GREEN}$ jj commit -m 'chore: Michiワークフロー追加'${NC}  # コミット"
echo "   ※ Michiプロジェクトは Jujutsu (jj) を使用しています"
echo "   ※ Gitのみ使用する場合: git add . && git commit -m 'message'"
echo ""
echo -e "${YELLOW}Step 4: Cursor IDE で開く${NC}"
echo "   ${GREEN}$ cursor .${NC}"
echo "   ※ Cursor がインストールされていない場合:"
echo "      https://cursor.sh からダウンロード"
echo ""
echo -e "${YELLOW}Step 5: 開発開始${NC}"
echo "   Cursor で以下のコマンドを実行（Cmd+K または Ctrl+K）:"
echo "   ${GREEN}/kiro:spec-init <機能の説明>${NC}"
echo ""
echo "   ${GREEN}例:${NC}"
echo "   /kiro:spec-init ユーザー認証機能（ログイン・ログアウト）"
echo "   /kiro:spec-init 商品検索API（キーワード検索・フィルタリング）"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📚 参考ドキュメント${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "   - セットアップガイド: ${MICHI_PATH}/docs/setup.md"
echo "   - ワークフロー: ${MICHI_PATH}/docs/workflow.md"
echo "   - クイックリファレンス: ${MICHI_PATH}/docs/quick-reference.md"
echo ""
echo -e "${GREEN}✨ 準備完了！開発を始めましょう！${NC}"
echo ""

