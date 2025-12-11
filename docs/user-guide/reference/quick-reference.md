# クイックリファレンス

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 新規プロジェクト作成

### 推奨: `michi init` コマンド（最も簡単 ⭐）

```bash
# 既存リポジトリに移動
cd /path/to/existing-repo

# 1コマンドで初期設定完了
michi init --michi-path /path/to/michi
```

このコマンドが自動的に：

- プロジェクトメタデータ（`.kiro/project.json`）を作成
- 環境変数テンプレート（`.env`）を作成
- 共通ルール・コマンドをコピー（`--michi-path` 指定時）
- Steeringテンプレート（`.kiro/steering/`）をコピー
- Specテンプレート（`.kiro/settings/templates/`）をコピー
- ワークフロー設定（`.michi/config.json`）を作成
  - グローバル設定（`~/.michi/config.json`）があればコピー
  - なければ対話的に設定

**オプション**:

```bash
# 非対話モード（プロジェクト名とJIRAキーを指定）
michi init \
  --name "project-id" \
  --project-name "プロジェクト名" \
  --jira-key "PRJA" \
  --michi-path /path/to/michi \
  -y

# ワークフロー設定をスキップ
michi init --michi-path /path/to/michi --skip-config

# 環境を指定（デフォルト: Cursor）
michi init --michi-path /path/to/michi --cursor
michi init --michi-path /path/to/michi --claude
```

**次のステップ**:

1. `.env` ファイルの内容を確認・編集
2. `.michi/config.json` の内容を確認（必要に応じて編集）
3. 開発開始: `/kiro:spec-init <機能説明>`

### 代替: 個別セットアップ

グローバル設定を先に作成する場合:

```bash
# 1. グローバル設定を作成（組織で一度だけ）
michi config:global

# 2. プロジェクト初期設定
cd /path/to/project
michi init --michi-path /path/to/michi

# グローバル設定が自動的にコピーされます
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

### cc-sdd 標準コマンド

| コマンド                                 | 説明                       |
| ---------------------------------------- | -------------------------- |
| `/kiro:spec-init <description>`          | 仕様初期化                 |
| `/kiro:spec-requirements <feature>`      | 要件定義生成               |
| `/kiro:spec-design <feature>`            | 設計生成（cc-sdd標準版）   |
| `/kiro:spec-tasks <feature>`             | タスク分割                 |
| `/kiro:spec-impl <feature> <tasks>`      | TDD実装                    |
| `/kiro:spec-status <feature>`            | 進捗確認                   |
| `/kiro:steering`                         | Steering作成/更新          |
| `/kiro:steering-custom`                  | カスタムSteering作成       |
| `/kiro:validate-gap <feature>`           | 既存コードと要件の差異分析 |
| `/kiro:validate-design <feature>`        | 設計の品質レビューと検証   |

### Michi 拡張コマンド

> **注**: これらのコマンドは Michi 独自の拡張機能です。cc-sdd 標準には含まれません。

| コマンド                                 | 説明                                           |
| ---------------------------------------- | ---------------------------------------------- |
| `/michi:spec-design <feature>`           | 設計生成（Phase 0.3-0.4 ガイダンス付き）⭐推奨 |
| `/michi:validate-design <feature>`       | 設計レビュー（テスト計画完了確認付き）         |
| `/michi:confluence-sync <feature> [type]` | Confluence同期                                 |
| `/michi:project-switch <project_id>`      | プロジェクト切り替え                           |

## Michi CLIコマンド一覧

**使用方法**: `npx @sk8metal/michi-cli <command>` または `michi <command>`（グローバルインストール後）

| コマンド                                    | 説明                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `michi init`                                | プロジェクト初期設定（推奨）⭐                    |
| `michi config:global`                       | グローバル設定作成（~/.michi/config.json）        |
| `michi jira:sync <feature>`                 | JIRA連携（tasks.md → Epic/Stories）               |
| `michi confluence:sync <feature> [type]`    | Confluence同期（requirements/design）             |
| `michi phase:run <feature> <phase>`         | フェーズ実行（requirements/design/tasks）         |
| `michi validate:phase <feature> <phase>`    | フェーズ完了バリデーション                        |
| `michi preflight [phase]`                   | プリフライトチェック                              |
| `michi project:list`                        | プロジェクト一覧                                  |
| `michi project:dashboard`                   | リソースダッシュボード生成                        |
| `michi workflow:run --feature <name>`       | 統合ワークフロー実行                              |
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
/michi:project-switch <project-id>
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

**注意**: `/kiro:steering`コマンドで作成（セットアップ時には自動生成されません）

- `.kiro/steering/product.md`
- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`

## 参考リンク

- [セットアップガイド](./setup.md)
- [新規リポジトリセットアップ](../getting-started/new-repository-setup.md)
- [ワークフローガイド](./workflow.md)
- [マルチプロジェクト管理](./multi-project.md)
- [テスト・検証](./testing.md)
