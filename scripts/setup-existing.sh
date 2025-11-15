#!/bin/bash
#
# 既存プロジェクトにMichi共通ルール・コマンド・テンプレートをコピー
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

echo -e "${BLUE}🚀 Michi共通ルール・コマンド・テンプレートをコピー${NC}"
echo ""

# Michiリポジトリのパスを推測
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICHI_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}📂 Michiパス: ${MICHI_PATH}${NC}"
echo -e "${BLUE}📂 現在のディレクトリ: $(pwd)${NC}"
echo ""

PROJECT_ID=$(basename "$(pwd)")

echo -e "${GREEN}✅ プロジェクトID: ${PROJECT_ID}${NC}"
echo ""

read -p "このプロジェクトにMichi共通ルール・コマンドをコピーしますか？ [Y/n]: " CONFIRM
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
  --michi-path "${MICHI_PATH}"; then
  echo ""
  echo -e "${YELLOW}❌ セットアップスクリプトが失敗しました${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 共通ルール・コマンド・テンプレートのコピー完了！${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 次のステップ（重要）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Step 1: cc-sddを導入${NC}"
echo "   ${GREEN}$ npx cc-sdd@latest --lang ja --cursor${NC}"
echo "   ※ 使用する環境に合わせて --cursor / --claude / --gemini などを指定"
echo ""
echo -e "${YELLOW}Step 2: 設定を対話的に作成${NC}"
echo "   ${BLUE}方法A: 対話的設定ツールを使用（推奨）${NC}"
echo "      ${GREEN}$ npm run setup:interactive${NC}"
echo "      または"
echo "      ${GREEN}$ npx @sk8metal/michi-cli setup:interactive${NC}"
echo ""
echo "   ${BLUE}方法B: 手動で.envファイルを編集${NC}"
echo "      ファイル: projects/${PROJECT_ID}/.env"
echo ""
echo "      ${BLUE}🔑 Atlassian API トークンの取得:${NC}"
echo "         1. Atlassian アカウントにログイン"
echo "         2. https://id.atlassian.com/manage-profile/security/api-tokens にアクセス"
echo "         3. 「APIトークンを作成」をクリック"
echo "         4. ラベルを入力（例: Michi Workflow）して作成"
echo "         5. 生成されたトークンをコピー（※一度しか表示されません）"
echo ""
echo "      ${BLUE}🔑 GitHub Personal Access Token の取得:${NC}"
echo "         1. GitHub にログイン"
echo "         2. https://github.com/settings/tokens にアクセス"
echo "         3. 「Generate new token (classic)」をクリック"
echo "         4. スコープを選択: repo, workflow, read:org"
echo "         5. 「Generate token」をクリックしてトークンをコピー"
echo ""
echo -e "${YELLOW}Step 3: Cursor IDE で開く${NC}"
echo "   ${GREEN}$ cursor .${NC}"
echo "   ※ Cursor がインストールされていない場合:"
echo "      https://cursor.sh からダウンロード"
echo ""
echo -e "${YELLOW}Step 4: 開発開始${NC}"
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
echo "   - セットアップガイド: ${MICHI_PATH}/docs/getting-started/setup.md"
echo "   - ワークフロー: ${MICHI_PATH}/docs/guides/workflow.md"
echo "   - クイックリファレンス: ${MICHI_PATH}/docs/reference/quick-reference.md"
echo ""
echo -e "${GREEN}✨ 準備完了！開発を始めましょう！${NC}"
echo ""

