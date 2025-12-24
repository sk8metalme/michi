# 開発に必要なコマンド

## セットアップ

### 依存関係のインストール
```bash
npm install
```

### ビルド
```bash
npm run build
```

### グローバルコマンドとしてリンク（開発時）
```bash
npm link
```

### cc-sddのインストール（AI駆動開発ワークフローのコア）
```bash
# Cursor IDE用
npx cc-sdd@latest --lang ja --cursor

# Claude Code用
npx cc-sdd@latest --lang ja --claude
```

### 環境変数の設定
```bash
cp env.example .env
# .envファイルを編集して認証情報を設定
```

## 開発コマンド

### ローカルでCLIを実行
```bash
# npm scriptを使用
npm run michi <command>

# tsxで直接実行
npx tsx src/cli.ts <command>
```

### ビルド
```bash
npm run build
```

## テスト

### すべてのテスト実行
```bash
npm test
```

### テスト実行（一度だけ）
```bash
npm run test:run
```

### 統合テストのみ実行
```bash
npm run test:integration:setup
```

### カバレッジ付き実行
```bash
npm run test:coverage
npm run test:coverage:setup
```

### 監視モード
```bash
npm test -- --watch
```

### UIモード
```bash
npm run test:ui
```

## コード品質

### Lint実行
```bash
npm run lint
```

### Lint修正
```bash
npm run lint:fix
```

### フォーマット
```bash
npm run format
```

### 型チェック
```bash
npm run type-check
```

## Michi CLIコマンド

### プロジェクト管理

```bash
# プロジェクト初期化
michi init --name <project-name> --jira-key <jira-key>

# 既存プロジェクトにセットアップ
michi setup-existing --cursor --lang ja
michi setup-existing --claude --lang ja

# 仕様書一覧
michi spec:list

# 仕様書アーカイブ
michi spec:archive <feature>
```

### フェーズ管理

```bash
# フェーズ実行（バリデーション + 自動化）
michi phase:run <feature> requirements  # Phase 0.1
michi phase:run <feature> design        # Phase 0.2
michi phase:run <feature> tasks         # Phase 0.5-0.6

# バリデーション確認
michi validate:phase <feature> requirements
michi validate:phase <feature> design
michi validate:phase <feature> tasks
```

### Confluence/JIRA連携

```bash
# Confluence同期
michi confluence:sync <feature> requirements
michi confluence:sync <feature> design
michi confluence:sync <feature> tasks

# JIRA同期
michi jira:sync <feature>

# JIRAステータス変更
michi jira:transition <issueKey> "In Progress"
michi jira:transition <issueKey> "Done"

# JIRAコメント追加
michi jira:comment <issueKey> "コメント内容"
```

### マルチプロジェクト管理

```bash
# マルチプロジェクト初期化
michi multi-repo:init <project-id> --jira <key> --confluence-space <space>

# リポジトリ追加
michi multi-repo:add-repo <project-id> --name <repo-name> --url <github-url> --branch <branch>

# プロジェクト一覧
michi multi-repo:list

# Confluence同期
michi multi-repo:confluence-sync <project-id>

# CI/CD状態確認
michi multi-repo:ci-status <project-id>

# テスト実行
michi multi-repo:test <project-id>
```

### ワークフロー管理

```bash
# ワークフロー実行
michi workflow:run --feature <feature>

# プリフライトチェック
michi preflight

# 設定バリデーション
michi config:validate
```

## Git/GitHub

### ブランチ作成（featureブランチで作業）
```bash
git checkout -b feature/<task-description>
```

### コミット
```bash
git add .
git commit -m "[種別] 簡潔な説明"
```

### プッシュ
```bash
git push -u origin feature/<task-description>
```

### PR作成（GitHub CLI）
```bash
gh pr create --title "タイトル" --body "説明"
```

### Jujutsu (jj) を使う場合
```bash
# ブランチ作成
jj branch create feature/<task-description>

# コミット
jj commit -m "[種別] 簡潔な説明"

# プッシュ
jj git push
```

## Macユーティリティコマンド（Darwin）

### ファイル操作
```bash
ls -la              # ファイル一覧（詳細）
cd <directory>      # ディレクトリ移動
pwd                 # 現在のディレクトリ
mkdir <directory>   # ディレクトリ作成
rm -rf <directory>  # ディレクトリ削除
cp -r <src> <dst>   # コピー
mv <src> <dst>      # 移動/名前変更
```

### ファイル検索・確認
```bash
find . -name "*.ts"         # ファイル検索
grep -r "keyword" .         # テキスト検索
cat <file>                  # ファイル内容表示
head -n 20 <file>           # 先頭20行表示
tail -n 20 <file>           # 末尾20行表示
wc -l <file>                # 行数カウント
```

### プロセス管理
```bash
ps aux | grep node          # Node.jsプロセス確認
kill <pid>                  # プロセス終了
killall node                # すべてのNode.jsプロセス終了
```

### ネットワーク
```bash
curl <url>                  # HTTPリクエスト
ping <host>                 # 疎通確認
netstat -an | grep LISTEN   # リスニングポート確認
```

### その他
```bash
echo $PATH                  # PATH環境変数確認
which <command>             # コマンドのパス確認
open .                      # Finderで現在のディレクトリを開く
```

## NPMパッケージ管理

### グローバルインストール
```bash
npm install -g @sk8metal/michi-cli
```

### パッケージ確認
```bash
npm list -g --depth=0       # グローバルパッケージ一覧
npm outdated                # 更新可能なパッケージ
npm audit                   # 脆弱性チェック
npm audit fix               # 脆弱性修正
```

### パッケージ更新
```bash
npm update                  # すべてのパッケージ更新
npm update <package>        # 特定のパッケージ更新
```

## リリース

### パッケージ公開準備
```bash
npm run pre-publish         # 公開前チェック
npm run test:package        # パッケージテスト
```

### タグ作成（自動リリース）
```bash
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
# GitHub Actionsで自動的にnpm publishとGitHub Release作成が実行される
```

## トラブルシューティング

### ビルドエラー
```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### キャッシュクリア
```bash
npm cache clean --force
```

### 権限エラー
```bash
# set-permissions.jsを実行（ビルド後に自動実行される）
node scripts/set-permissions.js
```
