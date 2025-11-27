# クイックリファレンス

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 新規プロジェクト作成

### パターンA: 既存リポジトリにMichi共通ルール・コマンドを追加（最も簡単 ⭐）

```bash
# 既存プロジェクトに移動
cd /path/to/existing-repo

# Michiの共通ルール・コマンド・テンプレートをコピー
npx tsx /path/to/michi/scripts/setup-existing-project.ts --michi-path /path/to/michi
```

このスクリプトが自動的に：

- 共通ルール（`.cursor/rules/`）をコピー
- カスタムコマンド（`.cursor/commands/kiro/`）をコピー
- Steeringテンプレート（`.kiro/steering/`）をコピー
- Specテンプレート（`.kiro/settings/templates/`）をコピー

**次のステップ**:

1. cc-sddを導入: `npx cc-sdd@latest --lang ja --cursor`
2. 設定を対話的に作成: `npm run setup:interactive`

### パターンB: 新規リポジトリを作成してセットアップ

```bash
# Michiから実行
cd /path/to/michi

# 凡例
npm run create-project -- \
  --name "<project-id>" \
  --project-name "<project-name>" \
  --jira-key "<jira-key>"

# 具体例
npm run create-project -- \
  --name "20240115-payment-api" \
  --project-name "プロジェクトA" \
  --jira-key "PRJA"
```

**リポジトリ名**: `--name`で指定した値がそのままGitHubリポジトリ名として使用されます。

**例**:

- `--name "20240115-payment-api"` → GitHubリポジトリ: `org/20240115-payment-api`
- `--name "payment-api"` → GitHubリポジトリ: `org/payment-api`

**注意**: リポジトリ名はkebab-case（小文字、ハイフン区切り）を推奨します。

### パターンC: 完全手動セットアップ

```bash
# 1. リポジトリ作成・クローン
gh repo create org/repo-name --private
jj git clone https://github.com/org/repo-name
cd repo-name

# 2. cc-sdd導入
npx cc-sdd@latest --cursor --lang ja --yes

# 3. プロジェクトメタデータ作成
cat > .kiro/project.json << 'EOF'
{
  "projectId": "repo-name",
  "projectName": "プロジェクト名",
  "jiraProjectKey": "PRJX",
  "confluenceLabels": ["project:x", "service:y"]
}
EOF

# 4. Michiから共通ルール・コマンド・テンプレートをコピー
npx tsx /path/to/michi/scripts/setup-existing-project.ts \
  --michi-path /path/to/michi

# 5. npm install
# 6. 初期コミット
```

詳細: [新規リポジトリセットアップガイド](../getting-started/new-repository-setup.md)

## 開発フロー

詳細なワークフローは [AI開発ワークフローガイド](./workflow.md) を参照してください。

### クイックコマンド一覧

**要件定義**:

```bash
/kiro:spec-init <機能説明>
/kiro:spec-requirements <feature>
jj commit -m "docs: 要件定義" && jj git push
npx @sk8metal/michi-cli phase:run <feature> requirements
```

**設計**:

```bash
/kiro:spec-design <feature>
jj commit -m "docs: 設計" && jj git push
npx @sk8metal/michi-cli phase:run <feature> design
```

**タスク分割**:

```bash
/kiro:spec-tasks <feature>
jj commit -m "docs: タスク分割" && jj git push
npx @sk8metal/michi-cli phase:run <feature> tasks
```

**実装**:

```bash
/kiro:spec-impl <feature> <tasks>
jj commit -m "feat: 実装 [<jira-key>-XXX]"
jj bookmark create <project-id>/feature/<feature> -r '@-'
jj git push --bookmark <project-id>/feature/<feature> --allow-new
gh pr create --head <project-id>/feature/<feature> --base main
```

## コマンド一覧

| コマンド                                 | 説明                       | 分類       |
| ---------------------------------------- | -------------------------- | ---------- |
| `/kiro:spec-init <description>`          | 仕様初期化                 | cc-sdd     |
| `/kiro:spec-requirements <feature>`      | 要件定義生成               | cc-sdd     |
| `/kiro:spec-design <feature>`            | 設計生成                   | cc-sdd     |
| `/kiro:spec-tasks <feature>`             | タスク分割                 | cc-sdd     |
| `/kiro:spec-impl <feature> <tasks>`      | TDD実装                    | cc-sdd     |
| `/kiro:spec-status <feature>`            | 進捗確認                   | cc-sdd     |
| `/kiro:steering`                         | Steering作成/更新          | cc-sdd     |
| `/kiro:steering-custom`                  | カスタムSteering作成       | cc-sdd     |
| `/kiro:validate-gap <feature>`           | 既存コードと要件の差異分析 | cc-sdd     |
| `/kiro:validate-design <feature>`        | 設計の品質レビューと検証   | cc-sdd     |
| `/kiro:confluence-sync <feature> [type]` | Confluence同期             | Michi only |
| `/kiro:project-switch <project_id>`      | プロジェクト切り替え       | Michi only |

## Michi CLIコマンド一覧

**使用方法**: `npx @sk8metal/michi-cli <command>` または `michi <command>`（グローバルインストール後）

| コマンド                                    | 説明                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `michi jira:sync <feature>`                 | JIRA連携（tasks.md → Epic/Stories）               |
| `michi confluence:sync <feature> [type]`    | Confluence同期（requirements/design）             |
| `michi phase:run <feature> <phase>`         | フェーズ実行（requirements/design/tasks）         |
| `michi validate:phase <feature> <phase>`    | フェーズ完了バリデーション                        |
| `michi preflight [phase]`                   | プリフライトチェック                              |
| `michi project:list`                        | プロジェクト一覧                                  |
| `michi project:dashboard`                   | リソースダッシュボード生成                        |
| `michi workflow:run --feature <name>`       | 統合ワークフロー実行                              |
| `michi config:interactive`                  | 対話式設定ツール（.michi/config.json作成）        |
| `michi config:validate`                     | 設定ファイルのバリデーション                      |
| `michi tasks:convert <feature>`             | AI-DLC形式のtasks.mdをMichiワークフロー形式に変換 |
| `michi jira:transition <issueKey> <status>` | JIRAチケットのステータス変更                      |
| `michi jira:comment <issueKey> <comment>`   | JIRAチケットにコメント追加                        |
| `michi --help`                              | ヘルプ表示                                        |
| `michi --version`                           | バージョン表示                                    |

**インストール方法**:

- **npx実行（推奨）**: `npx @sk8metal/michi-cli <command>` - 常に最新版を使用
- **グローバルインストール**: `npm install -g @sk8metal/michi-cli` 後、`michi <command>`
- **ローカル開発**: `npm run michi <command>` または `npx tsx src/cli.ts <command>`

## npmスクリプト一覧（michiリポジトリ内）

| コマンド                 | 説明                  |
| ------------------------ | --------------------- |
| `npm run setup:env`      | .env テンプレート作成 |
| `npm run create-project` | 新規プロジェクト作成  |
| `npm run multi-estimate` | 見積もり集計          |
| `npm run michi`          | ローカルCLIツール実行 |

## プロジェクト切り替え

### 方法1: Cursorコマンド

```
/kiro:project-switch <project-id>
```

### 方法2: ターミナル

```bash
cd ~/work/projects/<project-name>
cat .kiro/project.json
```

## プロジェクト横断操作

### すべてのプロジェクトを確認

```bash
cd /path/to/michi
# 全プロジェクトの一覧を表示
npx @sk8metal/michi-cli project:list
```

### リソースダッシュボード

```bash
# Confluenceにプロジェクト横断ダッシュボードを作成
npx @sk8metal/michi-cli project:dashboard
```

### 見積もり集計

```bash
npm run multi-estimate
```

## Git/Jujutsuコマンド

### 基本フロー

```bash
# 作業開始
jj new main

# コミット
jj commit -m "message"

# ブックマーク作成（PR用）
jj bookmark create <project-id>/feature/<name> -r '@-'

# プッシュ
jj git push --bookmark <project-id>/feature/<name> --allow-new

# PR作成
gh pr create --head <bookmark> --base main
```

### ブランチ命名規則

```
<project-id>/feature/<feature-name>
```

例:

- `michi/feature/user-auth`
- `20240115-payment-api/feature/payment`
- `20240310-analytics-api/feature/user-endpoint`

## トラブルシューティング

### GitHub認証エラー

```bash
gh auth status
gh auth login
gh auth setup-git
```

### Confluence/JIRA認証エラー

`.env` の認証情報を確認：

```bash
cat .env | grep ATLASSIAN
```

### MCP接続エラー

1. Cursor 再起動
2. `~/.cursor/mcp.json` 確認
3. Atlassian API Token 再生成

### npm installエラー

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## ファイルパス

### プロジェクトメタデータ

- `.kiro/project.json`

### テンプレート

- `.kiro/settings/templates/requirements.md`
- `.kiro/settings/templates/design.md`
- `.kiro/settings/templates/tasks.md`

### 仕様書（GitHub SSoT）

- `.kiro/specs/<feature>/requirements.md`
- `.kiro/specs/<feature>/design.md`
- `.kiro/specs/<feature>/tasks.md`

### Steering

- `.kiro/steering/product.md`
- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`

## 参考リンク

- [セットアップガイド](./setup.md)
- [新規リポジトリセットアップ](../getting-started/new-repository-setup.md)
- [ワークフローガイド](./workflow.md)
- [マルチプロジェクト管理](./multi-project.md)
- [テスト・検証](./testing.md)
