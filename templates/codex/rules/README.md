# Codex CLI + Michi Integration Guide

## 🎉 Updated Integration with cc-sdd

**Good News!** Codex CLIは[cc-sdd](https://github.com/gotalab/cc-sdd)と統合することで、Michiワークフローを完全にサポートできるようになりました。

## Quick Start

### Step 1: Install cc-sdd (Required)

```bash
npx cc-sdd@latest --codex --lang ja
```

**cc-sddがインストールするもの:**
- ✅ 11個の `/kiro:*` コマンド（`.codex/commands/`）
- ✅ `AGENTS.md`（`.codex/docs/`）
- ✅ `.kiro/` ディレクトリ構造
- ✅ Spec-Driven Development (SDD) ワークフロー

### Step 2: Install Michi Extensions (Automatic)

Michiのセットアップ時に自動的にインストールされます:

```bash
npx @sk8metal/michi-cli setup-existing --codex --lang ja
```

**Michi拡張がインストールするもの:**
- ✅ `/prompts:confluence-sync` コマンド（Confluence連携）
- ✅ `AGENTS.override.md`（Michi固有ルール）
- ✅ `.kiro/project.json`（プロジェクトメタデータ）

---

## Available Commands

### cc-sdd Commands (11 total)

| Command | Description |
|---------|-------------|
| `/kiro:steering` | プロジェクトメモリの生成・更新 |
| `/kiro:steering-custom` | ドメイン固有ステアリングファイル作成 |
| `/kiro:spec-init` | 新規仕様フォルダ初期化 |
| `/kiro:spec-requirements` | 要件定義書作成（EARS形式） |
| `/kiro:spec-design` | 設計ドキュメント作成 |
| `/kiro:spec-tasks` | タスク分割（並列実行可能） |
| `/kiro:spec-impl` | TDDベース実装 |
| `/kiro:spec-status` | ワークフロー進捗確認 |
| `/kiro:validate-gap` | 既存コードとのギャップ分析 |
| `/kiro:validate-design` | 設計レビュー |
| `/kiro:validate-impl` | 実装品質検証 |

### Michi Commands (1 total)

| Command | Description |
|---------|-------------|
| `/prompts:confluence-sync` | 仕様ドキュメントをConfluenceに同期 |

---

## Workflow Example

### 1. 初期化
```bash
/kiro:steering
```
→ プロジェクトメモリ（structure.md、tech.md、product.md）を生成

### 2. 仕様作成
```bash
/kiro:spec-init FEATURE=user-authentication
/kiro:spec-requirements FEATURE=user-authentication
/kiro:spec-design FEATURE=user-authentication
```

### 3. Confluence同期 (Michi拡張)
```bash
/prompts:confluence-sync FEATURE=user-authentication
```
→ requirements.mdとdesign.mdをConfluenceページに変換

### 4. 実装
```bash
/kiro:spec-tasks FEATURE=user-authentication
/kiro:spec-impl FEATURE=user-authentication
```

### 5. 検証
```bash
/kiro:validate-impl FEATURE=user-authentication
```

---

## Confluence Integration Setup

### 環境変数設定
`.env`ファイルに以下を追加:

```bash
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

### プロジェクトメタデータ設定
`.kiro/project.json`に以下を追加:

```json
{
  "confluenceSpaceKey": "YOUR_SPACE",
  "confluenceLabels": ["ai-development", "michi"]
}
```

---

## File Structure

```
project/
├── .codex/
│   ├── commands/          # cc-sdd: /kiro:* commands
│   ├── docs/
│   │   └── AGENTS.md      # cc-sdd: Base project context
│   └── prompts/           # Michi: /prompts:* commands
│       └── confluence-sync.md
├── .kiro/
│   ├── project.json       # Michi: Project metadata
│   ├── specs/             # cc-sdd: Feature specifications
│   │   └── {feature}/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       ├── tasks.md
│   │       └── spec.json
│   ├── steering/          # cc-sdd: AI guidance documents
│   │   ├── structure.md
│   │   ├── tech.md
│   │   └── product.md
│   └── settings/          # cc-sdd: Templates and rules
└── AGENTS.override.md     # Michi: Project-specific rules
```

---

## Project Metadata

Reference `.kiro/project.json` for project information:

- **Project ID**: {{PROJECT_ID}}
- **Language**: {{LANG_CODE}}
- **JIRA Key**: (from project.json)
- **Confluence Space**: (from project.json)
- **Confluence Labels**: (from project.json)

---

## Michi-Specific Features

### 1. Multi-Language Support
- Node.js/TypeScript (npm)
- Java (Gradle only)
- PHP (Composer)

### 2. Master Test Approach
- 常に最新の仕様を反映（履歴管理なし）
- Phase A: Auto (unit, lint, build)
- Phase B: Manual (integration, e2e, performance, security)

### 3. CI/CD Integration
- GitHub Actions
- Screwdriver

### 4. Release Flow
- セマンティックバージョニング（v<major>.<minor>.<patch>）
- Confluence手順書
- JIRA Release管理

---

## Troubleshooting

### Q1: cc-sddコマンドが見つからない
```bash
# 再インストール
npx cc-sdd@latest --codex --lang ja
```

### Q2: Confluence同期が失敗する
```bash
# 環境変数を確認
cat .env | grep ATLASSIAN

# 接続テスト
curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  "$ATLASSIAN_URL/wiki/rest/api/content"
```

### Q3: AGENTS.override.mdが反映されない
Codex CLIは`AGENTS.md`と`AGENTS.override.md`を自動的にマージします。プロジェクトルートに配置されていることを確認してください。

---

## Learn More

- **cc-sdd**: https://github.com/gotalab/cc-sdd
- **Michi Documentation**: https://github.com/sk8metalme/michi
- **Codex CLI**: https://developers.openai.com/codex/cli
- **Confluence API**: https://developer.atlassian.com/cloud/confluence/rest/v2/
