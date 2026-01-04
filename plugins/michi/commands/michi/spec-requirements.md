---
name: /michi:spec-requirements
description: Generate comprehensive requirements with ultrathink enabled (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name>
---

# Michi: Requirements Generation with Ultrathink

## Base Command Reference
@.claude/commands/kiro/spec-requirements.md

## Development Guidelines
{{DEV_GUIDELINES}}

---

## Michi Extension: Ultrathink & Enhanced Workflow

このコマンドは cc-sdd 標準の `/kiro:spec-requirements` を拡張し、以下のMichi固有機能を追加します。

### 追加機能

1. **Ultrathink自動有効化**:
   - 要件定義は複雑な分析を要するため、extended thinking（ultrathink）をデフォルトで有効化
   - より深い分析とより包括的な要件生成を実現

2. **JIRA/Confluence連携の事前確認**:
   - 環境変数チェックを実行し、連携設定状況を表示
   - 後続フェーズ（Phase 0.6: JIRA同期）への準備状況を確認

3. **次ステップ案内の変更**:
   - `/kiro:spec-design` → `/michi:spec-design` に変更
   - Michiワークフロー全体の案内を追加

### 環境変数チェック（実行開始時）

```bash
echo "=== Michi Requirements Generation ==="
echo ""

# JIRA連携チェック
if [ -n "$ATLASSIAN_URL" ] && [ -n "$ATLASSIAN_EMAIL" ] && [ -n "$ATLASSIAN_API_TOKEN" ]; then
    JIRA_CONFIGURED=true
    echo "✅ JIRA連携: 設定済み"
else
    JIRA_CONFIGURED=false
    echo "⚠️  JIRA連携: 未設定"
    echo "   ヒント: Phase 0.6（タスクのJIRA同期）を利用する場合は設定が必要です"
    echo "   設定方法: docs/guides/atlassian-integration.md"
fi
echo ""
```

### Output Description（Michi拡張）

基底コマンドの出力後、以下を追加表示:

```bash
echo ""
echo "============================================"
echo " Michi Requirements Generation Complete"
echo "============================================"
echo ""
echo "### 生成された要件定義書"
echo "\`.kiro/specs/$1/requirements.md\`"
echo ""
echo "### 次のステップ"
echo ""
echo "**Requirements Approved の場合**:"
echo "1. **設計書を生成**:"
echo "   /michi:spec-design $1"
echo ""
echo "**Modifications Needed の場合**:"
echo "- フィードバックを提供し、再度実行:"
echo "  /michi:spec-requirements $1"
echo ""
echo "---"

if [ "$JIRA_CONFIGURED" = "true" ]; then
    echo "ℹ️  JIRA連携: 設定済み"
else
    echo "ℹ️  JIRA連携: 未設定"
fi
echo "ℹ️  Ultrathink: 有効（深い分析モード）"
echo ""
```

---

## Safety & Fallback

### 追加エラーシナリオ

- **Steering Directory Empty**:
  - `.kiro/steering/` ディレクトリが空の場合、警告を表示
  - 要件品質への影響を通知し、steering作成を推奨

- **Language Undefined**:
  - `spec.json.language` が未定義の場合、デフォルトで英語（`en`）を使用
  - ユーザーに言語設定を確認

### Fallback Strategy

- **ultrathink timeout**: 長時間処理の場合、中間結果を保存して再開可能に
- **大規模プロジェクト**: セクション単位での生成を検討

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-requirements` を拡張し、ultrathink自動有効化とJIRA/Confluence連携確認を追加します。

think hard
