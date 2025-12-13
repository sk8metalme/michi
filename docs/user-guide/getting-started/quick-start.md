# Michi クイックスタート

このガイドでは、Michiを5分で始める方法を説明します。

## 前提条件

- Node.js 20.x以上
- Cursor IDE または VS Code

## 1. Michiをインストール

```bash
# NPMパッケージからインストール（推奨）
npm install -g @sk8metal/michi-cli

# インストール確認
michi --version
michi --help
```

**注意**: 初回実行時は依存関係のダウンロードに時間がかかる場合があります。

## 2. cc-sddをインストール

cc-sddは、Michiの仕様駆動開発ワークフローのコアフレームワークです。

### 推奨ワークフロー（cc-sdd準拠）

既存リポジトリにMichiを導入する標準的な3ステップ：

```bash
# Step 1: cc-sddで標準ファイル生成
npx cc-sdd@latest --cursor --lang ja

# Step 2: Michi固有ファイルを追加
npx @sk8metal/michi-cli setup-existing --cursor --lang ja
# または npm run michi:setup:cursor

# Step 3: 環境設定（後述）
npm run setup:interactive
```

### IDE別インストール例

```bash
# Cursor IDE（推奨）
npx cc-sdd@latest --lang ja --cursor

# Claude Code
npx cc-sdd@latest --lang ja --claude

# Gemini CLI
npx cc-sdd@latest --lang ja --gemini

# Codex CLI
npx cc-sdd@next --lang ja --codex

# Windsurf IDE
npx cc-sdd@next --lang ja --windsurf
```

**重要**: Step 2で `npx @sk8metal/michi-cli setup-existing` を実行すると、テンプレートがNPMパッケージから自動的にコピーされます。git clone不要です。

詳細な手順は [セットアップガイド](./setup.md#step-25-推奨ワークフローcc-sdd--michi) を参照してください。

## 3. 環境変数を設定

最小限の設定で始める場合:

```bash
# プロジェクトディレクトリに移動
cd your-project

# .envファイルを作成
cat > .env <<EOF
# GitHub設定（必須）
GITHUB_TOKEN=your-github-token
GITHUB_ORG=your-org
# Note: リポジトリ情報は .kiro/project.json の repository フィールドで管理されます

# JIRA設定（オプション）
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-token
JIRA_PROJECT_KEYS=YOUR_PROJECT

# JIRA Issue Type IDs（JIRAインスタンス固有 - 必須）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
EOF
```

詳細な設定方法は、[セットアップガイド](./setup.md#3-環境変数の設定)を参照してください。

## 4. 最初の機能を作成

Cursor/VS CodeでAIコマンドを実行：

```
/kiro:spec-init ユーザー認証機能
```

これにより、`.kiro/specs/user-authentication/`ディレクトリが作成され、以下が自動生成されます：

- `requirements.md`: 要件定義
- `spec.json`: 機能メタデータ

## 5. 設計を作成

```
/kiro:spec-design user-authentication
```

これにより、`design.md`が生成されます。

## 6. タスクを作成

```
/kiro:spec-tasks user-authentication
```

これにより、`tasks.md`が生成されます。

**重要**: `/kiro:spec-tasks` はローカルで `tasks.md` を生成するだけです。Confluence/JIRAに同期するには、以下のCLIコマンドを実行する必要があります：

```bash
npx @sk8metal/michi-cli phase:run user-authentication tasks
```

このコマンドにより、以下が自動実行されます：

- Confluenceページの自動作成（要件・設計）
- JIRA Epicとストーリーの自動作成（全6フェーズ）
- バリデーション実行

**注意**: 要件定義・設計フェーズでも同様に、`/kiro:spec-requirements` や `/kiro:spec-design` の後に `phase:run` を実行する必要があります：

```bash
# 要件定義フェーズ
/kiro:spec-requirements user-authentication
npx @sk8metal/michi-cli phase:run user-authentication requirements

# 設計フェーズ
/kiro:spec-design user-authentication
npx @sk8metal/michi-cli phase:run user-authentication design
```

## 7. 実装を開始

```
/kiro:spec-impl user-authentication task-1
```

TDD（テスト駆動開発）で実装が進められます。

## 8. テストを作成（オプション）

Phase Bテスト（手動回帰、負荷、セキュリティ）を対話的に作成できます：

```bash
npm run test:interactive
```

対話的に以下の情報を入力すると、テストファイルが自動生成されます：
- テストタイプ（手動回帰/負荷/セキュリティ）
- 対象エンドポイント
- 期待するレスポンス
- テスト条件

詳細は [テスト計画フロー](../testing/test-planning-flow.md) を参照してください。

## 次のステップ

### より詳しく学ぶ

- [ワークフローガイド](../guides/workflow.md) - AI開発フローの詳細
- [フェーズ自動化ガイド](../guides/phase-automation.md) - Confluence/JIRA自動化
- [クイックリファレンス](../reference/quick-reference.md) - コマンド一覧

### 高度な設定

- [カスタマイズガイド](../guides/customization.md) - Confluence/JIRA階層のカスタマイズ
- [設定値リファレンス](../reference/config.md) - `.michi/config.json`の全設定値

### 複数プロジェクトの管理

- [マルチプロジェクト管理](../guides/multi-project.md) - 3-5プロジェクトの同時管理

## トラブルシューティング

### GitHub Tokenが無効

```bash
gh auth login
gh auth token
```

### JIRA Issue Type IDが不明

```bash
# REST APIで確認
curl -u your-email@company.com:your-token \
  https://your-domain.atlassian.net/rest/api/3/issuetype
```

### コマンドが見つからない

Cursor/VS Codeを再起動してください。

## ヘルプ

質問がある場合は、[issue](https://github.com/sk8metalme/michi/issues)を作成してください。
