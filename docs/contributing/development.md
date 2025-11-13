# Michi 開発環境セットアップガイド

このガイドは、Michiプロジェクト自体の開発に貢献したい開発者向けのセットアップ手順です。

Michiを使ってプロジェクト開発を始めたい場合は、[利用者向けセットアップガイド](../getting-started/setup.md)を参照してください。

## 前提条件

- Node.js 20.x以上
- npm 10.x以上
- Git または Jujutsu (jj)
- Cursor IDE または VS Code
- GitHub CLI (gh) - PR作成時に使用

## 1. リポジトリのフォーク・クローン

### Gitを使う場合

```bash
# リポジトリをフォーク（GitHubのWebインターフェースで実行）

# フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/michi
cd michi

# 上流リポジトリをremoteに追加
git remote add upstream https://github.com/sk8metalme/michi
```

### Jujutsu (jj) を使う場合

```bash
# リポジトリをクローン
jj git clone https://github.com/YOUR_USERNAME/michi
cd michi

# 上流リポジトリを設定
jj git remote add upstream https://github.com/sk8metalme/michi
```

## 2. 依存関係のインストール

```bash
npm install
```

## 3. cc-sddのインストール（開発用）

```bash
# Cursor IDE を使用する場合
npx cc-sdd@latest --lang ja --cursor

# Claude Code を使用する場合
npx cc-sdd@latest --lang ja --claude
```

## 4. 環境変数の設定

開発環境でも、Confluence/JIRA連携のテストのために環境変数が必要です。

```bash
# テンプレートファイルをコピー
cp env.example .env
```

詳細な設定方法は、[利用者向けセットアップガイド](../getting-started/setup.md#3-環境変数の設定)を参照してください。

## 5. 開発ワークフロー

### ブランチ戦略

- `main`: 本番環境相当（常にデプロイ可能な状態）
- `feature/XXX`: 機能開発用
- `bugfix/XXX`: バグ修正用
- `docs/XXX`: ドキュメント更新用

### 開発サイクル

1. **issueを作成** または 既存のissueを確認
2. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   # または jj new -m "feature/your-feature-name"
   ```
3. **コードを実装**
4. **テストを追加・実行**
5. **コミット**
6. **PRを作成**

## 6. コーディング規約

### TypeScript

- **Strict Mode**: `tsconfig.json`で厳格な型チェックを有効化
- **ESLint**: すべてのコードはESLintルールに準拠
- **Prettier**: コードフォーマットは自動化

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/)形式を使用：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット（ロジック変更なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルドプロセスやツールの変更

**例:**
```
feat(confluence): Confluence階層構造のカスタマイズ機能を追加

- config.jsonでhierarchy.modeを設定可能に
- simple/detailedの2モードをサポート

Closes #123
```

## 7. テストの実行

### 全テストを実行

```bash
npm run test:run
```

### watchモードでテスト

```bash
npm test
```

### カバレッジ確認

```bash
npm run test:coverage
```

**カバレッジ目標**: 95%以上

### 型チェック

```bash
npm run type-check
```

## 8. リントとフォーマット

### リント実行

```bash
npm run lint
```

### リント自動修正

```bash
npm run lint:fix
```

### フォーマット

```bash
npm run format
```

## 9. ビルドとパッケージング

### TypeScriptビルド

```bash
npm run build
```

### ローカルでのパッケージテスト

```bash
# パッケージをリンク
npm link

# 他のプロジェクトでテスト
cd /path/to/test-project
npm link @sk8metal/michi-cli

# テスト後、リンクを解除
npm unlink @sk8metal/michi-cli
```

## 10. PRの作成

### PR作成前のチェックリスト

- [ ] すべてのテストがパス
- [ ] カバレッジが95%以上
- [ ] ESLintエラーが0件
- [ ] TypeScript型エラーが0件
- [ ] コミットメッセージがConventional Commits形式
- [ ] ドキュメントを更新（必要に応じて）

### PRの作成

```bash
# GitHubにプッシュ
git push origin feature/your-feature-name

# PRを作成
gh pr create --title "feat: 機能の説明" --body "詳細な説明"
```

### Jujutsuの場合

```bash
# 変更をコミット
jj commit -m "feat: 機能の説明"

# GitHubにプッシュ
jj git push

# PRを作成
gh pr create --title "feat: 機能の説明" --body "詳細な説明"
```

### PRテンプレート

```markdown
## 概要
何を実装したか簡潔に説明

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] 単体テスト追加
- [ ] E2Eテスト追加（必要に応じて）
- [ ] 手動テスト実施

## チェックリスト
- [ ] テストがパス
- [ ] カバレッジ95%以上
- [ ] ESLintエラー0件
- [ ] ドキュメント更新

## 関連Issue
Closes #123
```

## 11. CI/CDパイプライン

プッシュすると、以下のCI/CDパイプラインが自動実行されます：

- **リント**: ESLint実行
- **型チェック**: TypeScriptコンパイル
- **テスト**: Vitest実行
- **カバレッジ**: Codecovにアップロード
- **セキュリティスキャン**: npm auditとSnyk

詳細は [CI/CDガイド](./ci-cd.md) を参照してください。

## 12. トラブルシューティング

### npm install でエラーが出る

キャッシュをクリア：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### テストが失敗する

```bash
# キャッシュをクリア
npm run test:run -- --clearCache

# 特定のテストのみ実行
npm run test:run -- path/to/test-file.test.ts
```

### GitHub認証エラー

```bash
gh auth status
gh auth login
gh auth setup-git
```

## 参考リンク

- [コントリビューションガイド](../../CONTRIBUTING.md)
- [リリース手順](./release.md)
- [CI/CD設定](./ci-cd.md)
- [Jujutsu公式ドキュメント](https://martinvonz.github.io/jj/)
