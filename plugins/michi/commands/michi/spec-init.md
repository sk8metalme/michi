---
name: /michi:spec-init
description: Initialize a new specification with detailed project description (Michi version)
allowed-tools: Bash, Read, Write, Glob
argument-hint: <project-description>
---

# Michi: Spec Initialization with Integration Setup

## Base Command Reference
@.claude/commands/kiro/spec-init.md

## Development Guidelines
{{DEV_GUIDELINES}}

---

## Michi Extension: Next Step Navigation

このコマンドは cc-sdd 標準の `/kiro:spec-init` を拡張し、Michi ワークフローへのシームレスな統合を提供します。

### Michi固有の拡張内容

1. **次ステップ案内の変更**:
   - `/kiro:spec-requirements` → `/michi:spec-requirements` に変更
   - Michiワークフロー全体の案内を追加

2. **JIRA/Confluence連携設定の確認**:
   - 環境変数（ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN）のチェック
   - 設定済みの場合: 後続フェーズでのJIRA連携を案内
   - 未設定の場合: 設定ヒントを表示

### Output Description（Michi拡張）

基底コマンドの出力後、以下を追加表示:

```bash
echo ""
echo "============================================"
echo " Michi Spec Initialization Complete"
echo "============================================"
echo ""
echo "### 次のステップ"
echo ""
echo "1. **要件定義書を生成**:"
echo "   /michi:spec-requirements \$(basename \$(pwd) | sed 's/^.*\///; s/-/_/g')"
echo "   ※ ultrathinkが自動有効化され、深い分析が行われます"
echo ""
echo "2. **設計書を生成**:"
echo "   /michi:spec-design <feature-name>"
echo ""
echo "---"

# JIRA連携チェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    echo "ℹ️  JIRA連携: 設定済み（タスク生成後にJIRA同期が利用可能）"
else
    echo "ℹ️  JIRA連携: 未設定"
    echo "   設定方法: docs/guides/atlassian-integration.md を参照"
fi
echo ""
```

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-init` を拡張し、Michi ワークフローへのシームレスな統合とJIRA/Confluence連携設定の確認を追加します。
