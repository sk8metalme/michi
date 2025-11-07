# 新規プロジェクトセットアップガイド

別のリポジトリで新しいプロジェクトを開始する手順です。

## クイックスタート

### 方法1: 新規プロジェクト自動作成（新規リポジトリ）

GitHubに新規リポジトリを作成してプロジェクトをセットアップ：

```bash
# Michiリポジトリから実行
cd /path/to/michi
npm run create-project -- \
  --name "customer-a-service-1" \
  --project-name "A社 サービス1" \
  --customer "A社" \
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
jj commit -m "chore: Michiワークフロー追加"
jj git push

# 開発開始
cursor .
/kiro:spec-init <機能説明>
```

### 方法3: 手動セットアップ

詳細な制御が必要な場合は、以下の手順で手動セットアップします。

## 手動セットアップ手順

### Step 1: GitHubリポジトリ作成

```bash
# GitHub CLI で新規リポジトリ作成
gh repo create your-org/customer-a-service-1 --private --description "A社 サービス1"

# ローカルにクローン
cd ~/work/projects
jj git clone https://github.com/your-org/customer-a-service-1
cd customer-a-service-1
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
  "projectId": "customer-a-service-1",
  "projectName": "A社 サービス1",
  "customer": "A社",
  "jiraProjectKey": "PRJA",
  "confluenceLabels": ["project:a", "service:s1"],
  "status": "active",
  "team": ["@dev1", "@dev2"],
  "stakeholders": ["@企画", "@部長", "@A社担当"],
  "repository": "https://github.com/your-org/customer-a-service-1",
  "description": "A社向けサービス1の開発"
}
```

**重要なフィールド**:
- `projectId`: リポジトリ名と一致させる
- `jiraProjectKey`: JIRA プロジェクトキー（一意）
- `confluenceLabels`: プロジェクト識別用ラベル

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
GITHUB_REPO=your-org/customer-a-service-1

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

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# TypeScriptコンパイル確認
npm run type-check

# Git初期化（まだの場合）
git init
jj git init
jj bookmark track main@origin
```

### Step 8: 初期コミット

```bash
jj commit -m "chore: プロジェクト初期化

- cc-sdd導入
- プロジェクトメタデータ設定
- 自動化スクリプト追加
- ドキュメント追加"

jj bookmark create main -r '@-'
jj git push --bookmark main --allow-new
```

## プロジェクト開始後の開発フロー

### 新機能開発

```bash
# 1. 要件定義
/kiro:spec-init <機能説明>
/kiro:spec-requirements <feature>
jj commit -m "docs: 要件定義追加"
jj git push
npx @michi/cli phase:run <feature> requirements

# 2. 設計
/kiro:spec-design <feature>
jj commit -m "docs: 設計追加"
jj git push
npx @michi/cli phase:run <feature> design

# 3. タスク分割
/kiro:spec-tasks <feature>
jj commit -m "docs: タスク分割追加"
jj git push
npx @michi/cli phase:run <feature> tasks

# 4. 実装
/kiro:spec-impl <feature> <tasks>
jj commit -m "feat: 実装 [PRJA-XXX]"
jj bookmark create customer-a-service-1/feature/<feature> -r '@-'
jj git push --bookmark customer-a-service-1/feature/<feature> --allow-new
gh pr create --head customer-a-service-1/feature/<feature> --base main
```

## プロジェクト間の切り替え

### Cursor で切り替え

```text
/kiro:project-switch customer-a-service-1
```

### ターミナルで切り替え

```bash
# プロジェクトAに切り替え
cd ~/work/projects/customer-a-service-1

# プロジェクトBに切り替え
cd ~/work/projects/customer-b-api

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
| A社 サービス1 | customer-a-service-1 | active | PRJA | @dev1, @dev2 |
| B社 API | customer-b-api | active | PRJB | @dev3 |
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

**リポジトリ名**: `customer-{id}-{service}`
- 例: `customer-a-service-1`, `customer-b-api`, `customer-c-poc`

**プロジェクトID**: リポジトリ名と同じ
- 例: `customer-a-service-1`

**JIRA プロジェクトキー**: 3-4文字、一意
- 例: `PRJA`, `PRJB`, `PRJC`

**Confluenceラベル**: `project:{customer}, service:{service}`
- 例: `["project:a", "service:s1"]`

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
cd ~/work/projects/customer-a-service-1

# ターミナル2: プロジェクトB
cd ~/work/projects/customer-b-api

# ターミナル3: Michiハブ（横断操作用）
cd ~/work/projects/michi
```

### VS Code Workspaceを使う

`.code-workspace` ファイル作成：

```json
{
  "folders": [
    { "path": "../michi" },
    { "path": "../customer-a-service-1" },
    { "path": "../customer-b-api" }
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
- [ワークフローガイド](./workflow.md)
- [マルチプロジェクト管理](./multi-project.md)

