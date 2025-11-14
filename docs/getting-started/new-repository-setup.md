# 新規リポジトリセットアップガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

新規リポジトリを作成してMichiを使い始める手順です。

## クイックスタート

### 方法1: 新規プロジェクト自動作成（新規リポジトリ）

GitHubに新規リポジトリを作成してプロジェクトをセットアップ：

```bash
# Michiリポジトリから実行
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

スクリプトが自動的に：
1. GitHub リポジトリ作成
2. cc-sdd 導入
3. `.kiro/project.json` 作成
4. 共通ファイルコピー
5. `.env` テンプレート作成
6. npm install
7. 初期コミット・プッシュ

### 方法2: 既存プロジェクトにMichiワークフローを追加（推奨 - 既存リポジトリ）

既存のリポジトリにAI開発フローを導入：

```bash
# 既存プロジェクトのディレクトリに移動
cd /path/to/existing-repo

# Michiのセットアップスクリプトを実行（対話式）
bash /path/to/michi/scripts/setup-existing.sh
```

対話式でプロジェクト情報を入力すると、自動的に：
1. ✅ cc-sdd 導入確認・インストール
2. ✅ `.kiro/project.json` 作成
3. ✅ Michiから共通ファイルコピー（ルール、コマンド、テンプレート）
4. ✅ `.env` テンプレート作成
5. ✅ README.md と .gitignore 更新
6. ✅ CLIツールのセットアップ案内

**完了後**:
```bash
# 認証情報を設定
vim .env

# 依存関係インストール（package.jsonが新規作成された場合）
npm install

# セットアップをコミット
# Jujutsu (jj) を使用する場合:
jj commit -m "chore: Michiワークフロー追加"
jj git push

# Git を使用する場合:
git add .
git commit -m "chore: Michiワークフロー追加"
git push

# 開発開始
cursor .
/kiro:spec-init <機能説明>
```

### 方法3: 手動セットアップ

詳細な制御が必要な場合は、以下の手順で手動セットアップします。

## 手動セットアップ手順

### Step 1: GitHubリポジトリ作成

#### Jujutsu (jj) を使用する場合

```bash
# GitHub CLI で新規リポジトリ作成
gh repo create your-org/20240115-payment-api --private --description "プロジェクトA"

# ローカルにクローン
cd ~/work/projects
jj git clone https://github.com/your-org/20240115-payment-api
cd 20240115-payment-api
```

#### Git を使用する場合

```bash
# GitHub CLI で新規リポジトリ作成
gh repo create your-org/20240115-payment-api --private --description "プロジェクトA"

# ローカルにクローン
cd ~/work/projects
git clone https://github.com/your-org/20240115-payment-api
cd 20240115-payment-api
```

### Step 2: cc-sdd 導入

```bash
# cc-sddをインストール
npx cc-sdd@latest --cursor --lang ja --yes
```

これにより以下が作成されます：
- `.cursor/commands/kiro/`: 11のスラッシュコマンド
- 基本的なプロジェクト構造

### Step 3: プロジェクトメタデータ作成

`.kiro/project.json` を作成：

```json
{
  "projectId": "20240115-payment-api",
  "projectName": "プロジェクトA",
  "jiraProjectKey": "PRJA",
  "confluenceLabels": ["project:20240115-payment-api", "service:payment"],
  "status": "active",
  "team": ["@dev1", "@dev2"],
  "stakeholders": ["@企画", "@部長"],
  "repository": "https://github.com/your-org/20240115-payment-api",
  "description": "プロジェクトA向け決済APIの開発"
}
```

**重要なフィールド**:
- `projectId`: リポジトリ名と一致させる
- `jiraProjectKey`: JIRA プロジェクトキー（一意）
- `confluenceLabels`: プロジェクト識別用ラベル（`project:{projectId}`形式で自動生成）

**ラベル生成ロジック**:

プロジェクトラベルは常に生成され、サービスラベルは条件付きで生成されます：

- **プロジェクトラベル**: `project:{projectId}` を常に生成
- **サービスラベル**: ハイフン（`-`）が含まれる場合のみ生成
  - ハイフンがない場合: `project:michi` のみ（サービスラベルなし）
  - ハイフンがある場合: `project:20240115-payment-api, service:payment`
  - 重複防止: サービスラベルがプロジェクトラベルと同一の場合は追加しない

**動作例**:
- `projectId: 'michi'` → `['project:michi']`（サービスラベルなし）
- `projectId: '20240115-payment-api'` → `['project:20240115-payment-api', 'service:payment']`
- `projectId: 'michi-service'` → `['project:michi-service']`（サービスラベルがプロジェクトラベルと同一のため追加しない）
### Step 4: Michiから共通設定をコピー

Michiリポジトリから必要なファイルをコピー：

```bash
# Michiリポジトリの場所
MICHI_PATH=/path/to/michi

# ルールファイルをコピー
cp $MICHI_PATH/.cursor/rules/multi-project.mdc .cursor/rules/
cp $MICHI_PATH/.cursor/rules/github-ssot.mdc .cursor/rules/
cp $MICHI_PATH/.cursor/rules/atlassian-mcp.mdc .cursor/rules/

# カスタムコマンドをコピー
cp $MICHI_PATH/.cursor/commands/kiro/confluence-sync.md .cursor/commands/kiro/
cp $MICHI_PATH/.cursor/commands/kiro/project-switch.md .cursor/commands/kiro/

# Steeringテンプレートをコピー
mkdir -p .kiro/steering
cp $MICHI_PATH/.kiro/steering/*.md .kiro/steering/

# package.json と tsconfig.json をコピー（必要に応じて）
# 注意: スクリプトはコピーしません。CLIツールを使用します
cp $MICHI_PATH/tsconfig.json .
```

### Step 5: 環境変数設定

```bash
# .env テンプレート作成
cat > .env << 'EOF'
# Atlassian設定（MCP + REST API共通）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token-here

# GitHub設定
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=your-org/20240115-payment-api

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRAプロジェクトキー
JIRA_PROJECT_KEYS=PRJA
EOF

# 実際の認証情報を編集
# .env ファイルを編集してください
```

### Step 6: 依存関係インストール

```bash
npm install
```

### Step 7: 動作確認

#### Jujutsu (jj) を使用する場合

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# TypeScriptコンパイル確認
npm run type-check

# Jujutsu初期化（まだの場合）
git init
jj git init
jj bookmark track main@origin
```

#### Git を使用する場合

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# TypeScriptコンパイル確認
npm run type-check

# Git初期化（まだの場合）
git init
git branch -M main
git remote add origin https://github.com/your-org/20240115-payment-api.git
```

### Step 8: 初期コミット

#### Jujutsu (jj) を使用する場合

```bash
jj commit -m "chore: プロジェクト初期化

- cc-sdd導入
- プロジェクトメタデータ設定
- 自動化スクリプト追加
- ドキュメント追加"

jj bookmark create main -r '@-'
jj git push --bookmark main --allow-new
```

#### Git を使用する場合

```bash
# すべてのファイルをステージング
git add .

# 初期コミット
git commit -m "chore: プロジェクト初期化

- cc-sdd導入
- プロジェクトメタデータ設定
- 自動化スクリプト追加
- ドキュメント追加"

# mainブランチにプッシュ
git push -u origin main
```

## プロジェクト開始後の開発フロー

### 新機能開発

#### Jujutsu (jj) を使用する場合

```bash
# 1. 要件定義
# 凡例
/kiro:spec-init <機能説明>
/kiro:spec-requirements <feature>
jj commit -m "docs: 要件定義追加"
jj git push
npx @michi/cli phase:run <feature> requirements

# 具体例
/kiro:spec-init ユーザー認証機能
/kiro:spec-requirements user-auth
jj commit -m "docs: 要件定義追加"
jj git push
npx @michi/cli phase:run user-auth requirements

# 2. 設計
# 凡例
/kiro:spec-design <feature>
jj commit -m "docs: 設計追加"
jj git push
npx @michi/cli phase:run <feature> design

# 具体例
/kiro:spec-design user-auth
jj commit -m "docs: 設計追加"
jj git push
npx @michi/cli phase:run user-auth design

# 3. タスク分割
# 凡例
/kiro:spec-tasks <feature>
jj commit -m "docs: タスク分割追加"
jj git push
npx @michi/cli phase:run <feature> tasks

# 具体例
/kiro:spec-tasks user-auth
jj commit -m "docs: タスク分割追加"
jj git push
npx @michi/cli phase:run user-auth tasks

# 4. 実装
# 凡例
/kiro:spec-impl <feature> <tasks>
jj commit -m "feat: 実装 [<jira-key>-XXX]"
jj bookmark create <project-id>/feature/<feature> -r '@-'
jj git push --bookmark <project-id>/feature/<feature> --allow-new
gh pr create --head <project-id>/feature/<feature> --base main

# 具体例
/kiro:spec-impl user-auth FE-1,BE-1
jj commit -m "feat: 実装 [PRJA-123]"
jj bookmark create 20240115-payment-api/feature/user-auth -r '@-'
jj git push --bookmark 20240115-payment-api/feature/user-auth --allow-new
gh pr create --head 20240115-payment-api/feature/user-auth --base main
```

#### Git を使用する場合

```bash
# 1. 要件定義
# 凡例
/kiro:spec-init <機能説明>
/kiro:spec-requirements <feature>
git add .
git commit -m "docs: 要件定義追加"
git push
npx @michi/cli phase:run <feature> requirements

# 具体例
/kiro:spec-init ユーザー認証機能
/kiro:spec-requirements user-auth
git add .
git commit -m "docs: 要件定義追加"
git push
npx @michi/cli phase:run user-auth requirements

# 2. 設計
# 凡例
/kiro:spec-design <feature>
git add .
git commit -m "docs: 設計追加"
git push
npx @michi/cli phase:run <feature> design

# 具体例
/kiro:spec-design user-auth
git add .
git commit -m "docs: 設計追加"
git push
npx @michi/cli phase:run user-auth design

# 3. タスク分割
# 凡例
/kiro:spec-tasks <feature>
git add .
git commit -m "docs: タスク分割追加"
git push
npx @michi/cli phase:run <feature> tasks

# 具体例
/kiro:spec-tasks user-auth
git add .
git commit -m "docs: タスク分割追加"
git push
npx @michi/cli phase:run user-auth tasks

# 4. 実装
# 凡例
/kiro:spec-impl <feature> <tasks>
git checkout -b <project-id>/feature/<feature>
git add .
git commit -m "feat: 実装 [<jira-key>-XXX]"
git push -u origin <project-id>/feature/<feature>
gh pr create --head <project-id>/feature/<feature> --base main

# 具体例
/kiro:spec-impl user-auth FE-1,BE-1
git checkout -b 20240115-payment-api/feature/user-auth
git add .
git commit -m "feat: 実装 [PRJA-123]"
git push -u origin 20240115-payment-api/feature/user-auth
gh pr create --head 20240115-payment-api/feature/user-auth --base main
```

## プロジェクト間の切り替え

### Cursor で切り替え

```text
/kiro:project-switch 20240115-payment-api
```

### ターミナルで切り替え

```bash
# プロジェクトAに切り替え
cd ~/work/projects/20240115-payment-api

# プロジェクトBに切り替え
cd ~/work/projects/20240201-user-management

# Michiハブに戻る
cd ~/work/projects/michi
```

## プロジェクト一覧確認

すべてのプロジェクトを一覧表示：

```bash
# Michiリポジトリから実行
cd /path/to/michi
npm run project:list
```

出力例：
```text
📋 プロジェクト一覧:

| プロジェクト | ID | ステータス | JIRA | チーム |
|------------|-------|----------|------|--------|
| Michi | michi | active | MICHI | @developer1 |
| プロジェクトA | 20240115-payment-api | active | PRJA | @dev1, @dev2 |
| プロジェクトC | 20240310-analytics-api | active | PRJB | @dev3 |
```

## トラブルシューティング

### cc-sddがインストールできない

キャッシュをクリア：
```bash
npm cache clean --force
npx cc-sdd@latest --cursor --lang ja --yes
```

### .kiro/project.json が見つからない

手動で作成してください（上記Step 3参照）

### Confluence/JIRA連携が動作しない

1. `.env` の認証情報を確認
2. `~/.cursor/mcp.json` の設定を確認
3. Atlassian API Token が有効か確認

## ベストプラクティス

### プロジェクト命名規則

**リポジトリ名**: `{YYYYMMDD}-{PJ名}`
- 例: `20240115-payment-api`, `20240201-user-management`, `20240310-analytics-api`

**プロジェクトID**: リポジトリ名と同じ
- 例: `20240115-payment-api`

**JIRA プロジェクトキー**: 3-4文字、一意
- 例: `PRJA`, `PRJB`, `PRJC`

**Confluenceラベル**: `project:{projectId}, service:{service}`
- 例: `["project:20240115-payment-api", "service:payment"]`

### チーム構成

プロジェクトごとにチームメンバーを明確化：

```json
{
  "team": ["@tech-lead", "@frontend-dev", "@backend-dev"],
  "stakeholders": ["@企画", "@部長", "@客先担当"]
}
```

### ステータス管理

プロジェクトのライフサイクルに応じてステータスを更新：

- `planning`: 企画中
- `active`: 開発中
- `maintenance`: 保守フェーズ
- `completed`: 完了
- `inactive`: 休止中

## 複数プロジェクト同時開発のTips

### ターミナルを分ける

```bash
# ターミナル1: プロジェクトA
cd ~/work/projects/20240115-payment-api

# ターミナル2: プロジェクトB
cd ~/work/projects/20240201-user-management

# ターミナル3: Michiハブ（横断操作用）
cd ~/work/projects/michi
```

### VS Code Workspaceを使う

`.code-workspace` ファイル作成：

```json
{
  "folders": [
    { "path": "../michi" },
    { "path": "../20240115-payment-api" },
    { "path": "../20240201-user-management" }
  ],
  "settings": {
    "files.associations": {
      "*.mdc": "markdown"
    }
  }
}
```

### プロジェクト横断確認

```bash
# Michiから全プロジェクトの状況を確認
cd /path/to/michi
npx @michi/cli project:list
npx @michi/cli project:dashboard
npm run multi-estimate
```

## 次のステップ

新規プロジェクトを作成したら：

1. `docs/setup.md` でセットアップ
2. `docs/workflow.md` で開発フロー確認
3. `/kiro:spec-init` で最初の機能を開始

## 参考ドキュメント

- [セットアップガイド](./setup.md)
- [ワークフローガイド](../guides/workflow.md)
- [マルチプロジェクト管理](../guides/multi-project.md)

