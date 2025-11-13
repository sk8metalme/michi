# リリース手順

このドキュメントでは、Michiプロジェクトのリリース手順を説明します。

## 概要

Michiプロジェクトでは、GitHub Actionsを使用して自動リリースを行います。`v*`形式のGitタグを作成すると、自動的に以下が実行されます：

1. テスト実行（`npm run test:run`）
2. リント実行（`npm run lint`）
3. 型チェック（`npm run type-check`）
4. ビルド（`npm run build`）
5. NPMパッケージ公開（`npm publish`）
6. GitHub Release作成

詳細は [`.github/workflows/release.yml`](../.github/workflows/release.yml) を参照してください。

## リリース前のチェックリスト

リリースを実行する前に、以下を確認してください：

- [ ] すべてのテストが通過している（`npm run test:run`）
- [ ] リントエラーがない（`npm run lint`）
- [ ] 型チェックが成功している（`npm run type-check`）
- [ ] ビルドが成功する（`npm run build`）
- [ ] `package.json`のバージョン番号が正しい
- [ ] `CHANGELOG.md`が最新の状態である
- [ ] 未コミットの変更がない（`jj status`または`git status`で確認）
- [ ] NPM_TOKENがGitHub Secretsに設定されている（初回リリース時のみ確認）

### NPM_TOKENの設定

初回リリース時、またはNPM_TOKENが未設定の場合は、以下の手順で設定してください：

1. NPMアカウントでAutomation Tokenを生成
   - https://www.npmjs.com/settings/[your-username]/tokens にアクセス
   - "Generate New Token" > "Automation" を選択
   - トークンをコピー（一度しか表示されません）

2. GitHub Secretsに追加
   - リポジトリの Settings > Secrets and variables > Actions
   - "New repository secret" をクリック
   - Name: `NPM_TOKEN`
   - Secret: コピーしたトークンを貼り付け
   - "Add secret" をクリック

詳細は [NPM_TOKEN設定ガイド](./tmp/npm-token-setup.md) を参照してください。

## リリースワークフロー

リリースは**プルリク経由**で行います。

**メリット**:
- 変更内容をレビューできる
- CI/CDで自動チェックが実行される
- チーム内で変更を共有できる
- リリースとバージョン更新が独立している

**ワークフロー**:
1. バージョン更新（package.json、CHANGELOG.md）
2. プルリク作成
3. レビュー・マージ
4. タグ作成（GitHub UIまたはコマンドライン）
5. 自動リリース実行

## バージョン更新手順

### Step 1: package.jsonのバージョン更新

`package.json`の`version`フィールドを更新します：

```json
{
  "name": "@sk8metal/michi-cli",
  "version": "0.0.4",  // 例: 0.0.3 → 0.0.4
  ...
}
```

**セマンティックバージョニング**に従ってバージョンを決定してください：
- **MAJOR** (x.0.0): 破壊的変更
- **MINOR** (0.x.0): 新機能追加（後方互換性あり）
- **PATCH** (0.0.x): バグ修正、ドキュメント更新

### Step 2: CHANGELOG.mdの更新

`CHANGELOG.md`に新しいバージョンのエントリを追加します。

**形式**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) に準拠

**例**:
```markdown
## [0.0.4] - 2025-11-13

### Added
- 新機能の説明

### Changed
- 変更内容の説明

### Fixed
- バグ修正の説明

### Dependencies
- Updated `package-name` from `^old-version` to `^new-version`
```

**日付形式**: `YYYY-MM-DD`（ISO 8601形式）

### Step 3: プルリクの作成

変更をコミットしてプルリクを作成します：

```bash
# 作業ディレクトリに移動
cd /Users/arigatatsuya/Work/git/michi

# 未コミット変更を確認
jj status
# または
git status

# 新しいブランチで作業開始（Jujutsuの場合）
jj new main
# または（Gitの場合）
git checkout -b release/v0.0.4

# 変更をコミット
jj commit -m "chore: bump version to 0.0.4"
# または
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.0.4"

# ブックマーク作成（Jujutsuの場合）
jj bookmark create release/v0.0.4 -r '@-'

# プッシュ
jj git push --bookmark release/v0.0.4 --allow-new
# または
git push origin release/v0.0.4

# プルリク作成（GitHub CLIを使用）
gh pr create --head release/v0.0.4 --base main \
  --title "chore: bump version to 0.0.4" \
  --body "バージョンを0.0.3から0.0.4に更新します。

## 変更内容
- package.jsonのバージョン更新
- CHANGELOG.mdに0.0.4のエントリを追加

## リリース手順
このPRがマージされた後、GitHub UIまたはコマンドラインからタグを作成してリリースを実行してください。"
```

### Step 4: プルリクのレビュー・マージ

1. CI/CDが成功することを確認
2. 必要に応じてレビューを依頼
3. マージを実行

**重要**: プルリクがマージされた後、mainブランチに変更が反映されてからタグを作成してください。

## Gitタグの作成とプッシュ

プルリクがマージされた後、タグを作成してリリースを実行します。

### 方法A: GitHub UIからタグを作成（推奨）

**手順**:

1. **GitHubリポジトリのReleasesページにアクセス**
   - リポジトリページで "Releases" をクリック
   - または直接: `https://github.com/sk8metalme/michi/releases`

2. **"Draft a new release" をクリック**
   - または "Create a new release" をクリック

3. **タグとリリース情報を入力**
   - **Tag version**: `v0.0.4`（例）
   - **Target**: `main`（デフォルト）
   - **Release title**: `Release v0.0.4`（自動生成される）
   - **Description**: CHANGELOG.mdの内容をコピー&ペースト

4. **"Publish release" をクリック**
   - これにより、タグが作成され、GitHub Actionsが自動的にリリース処理を開始します

**メリット**:
- リリースノートを同時に作成できる
- タグとリリースが1つの操作で完了
- 視覚的に確認しやすい

### 方法B: コマンドラインからタグを作成

#### Jujutsu (jj) を使用する場合

```bash
# 作業ディレクトリに移動
cd /Users/arigatatsuya/Work/git/michi

# リモートの最新状態を取得
jj git fetch

# mainブランチを最新に更新
jj bookmark set main -r 'main@origin'

# 最新のmainから作業開始
jj new main

# Gitタグを作成（jj経由でGitコマンドを実行）
git tag v0.0.4

# タグをプッシュ
git push origin v0.0.4
```

**注意**: JujutsuはChange IDベースで管理するため、タグはGitコマンドで直接作成します。

#### Gitを使用する場合

```bash
# 作業ディレクトリに移動
cd /Users/arigatatsuya/Work/git/michi

# mainブランチに切り替え
git checkout main

# 最新の状態を取得
git pull origin main

# タグを作成
git tag v0.0.4

# タグをプッシュ
git push origin v0.0.4
```

**タグ名の形式**: `v` + バージョン番号（例: `v0.0.4`）

GitHub Actionsのリリースワークフローは`v*`形式のタグでトリガーされます。

## 自動リリースの確認

タグをプッシュすると、GitHub Actionsが自動的にリリース処理を開始します。

### 1. GitHub Actionsの実行状況を確認

1. GitHubリポジトリのページにアクセス
2. "Actions" タブをクリック
3. "Release" ワークフローを確認
4. 実行状況を監視

**URL例**: `https://github.com/sk8metalme/michi/actions/workflows/release.yml`

### 2. 各ステップの確認

リリースワークフローは以下の順序で実行されます：

1. ✅ **Checkout code** - コードのチェックアウト
2. ✅ **Setup Node.js** - Node.js環境のセットアップ
3. ✅ **Install dependencies** - 依存関係のインストール
4. ✅ **Run tests** - テスト実行
5. ✅ **Run lint** - リント実行
6. ✅ **Run type check** - 型チェック
7. ✅ **Build** - ビルド実行
8. ✅ **Publish to NPM** - NPMパッケージ公開
9. ✅ **Create GitHub Release** - GitHub Release作成

すべてのステップが成功することを確認してください。

### 3. NPM公開の確認

NPMパッケージが正常に公開されたか確認します：

```bash
# NPMパッケージの情報を確認
npm view @sk8metal/michi-cli version

# 最新バージョンが表示されることを確認
# 例: 0.0.4
```

**NPMパッケージページ**: https://www.npmjs.com/package/@sk8metal/michi-cli

### 4. GitHub Releaseの確認

GitHub Releaseが正常に作成されたか確認します：

1. GitHubリポジトリの "Releases" ページにアクセス
2. 最新のリリースが表示されることを確認
3. リリースノートが正しく表示されることを確認

**URL例**: `https://github.com/sk8metalme/michi/releases`

## トラブルシューティング

### エラー1: NPM公開が失敗する

**症状**: "Publish to NPM" ステップでエラーが発生

**原因**:
- NPM_TOKENが未設定または無効
- パッケージ名が既に使用されている（通常は発生しない）
- バージョン番号が既に存在する

**対処法**:
1. GitHub SecretsでNPM_TOKENが正しく設定されているか確認
2. NPM_TOKENが有効期限内か確認（Automation Tokenは無期限）
3. バージョン番号が既に存在しないか確認（`npm view @sk8metal/michi-cli versions`）

### エラー2: テストが失敗する

**症状**: "Run tests" ステップでエラーが発生

**対処法**:
1. ローカルでテストを実行して確認（`npm run test:run`）
2. テストコードを修正
3. 再度コミット・プッシュしてタグを作成

### エラー3: ビルドが失敗する

**症状**: "Build" ステップでエラーが発生

**対処法**:
1. ローカルでビルドを実行して確認（`npm run build`）
2. TypeScriptのコンパイルエラーを修正
3. 再度コミット・プッシュしてタグを作成

### エラー4: タグが既に存在する

**症状**: `git tag v0.0.4` で "tag already exists" エラー

**対処法**:
1. 既存のタグを削除（ローカル）: `git tag -d v0.0.4`
2. 既存のタグを削除（リモート）: `git push origin --delete v0.0.4`
3. 新しいタグを作成: `git tag v0.0.4`
4. タグをプッシュ: `git push origin v0.0.4`

**注意**: 既にリリース済みのタグを削除する場合は、慎重に判断してください。

### エラー5: GitHub Actionsが実行されない

**症状**: タグをプッシュしたが、GitHub Actionsが実行されない

**対処法**:
1. タグ名が`v*`形式か確認（例: `v0.0.4`）
2. GitHub Actionsが有効になっているか確認（Settings > Actions > General）
3. ワークフローファイル（`.github/workflows/release.yml`）が正しいか確認

## リリース後の確認事項

リリースが正常に完了したら、以下を確認してください：

- [ ] NPMパッケージが最新バージョンで公開されている
- [ ] GitHub Releaseが作成されている
- [ ] リリースノートが正しく表示されている
- [ ] パッケージが正常にインストールできる（`npm install -g @sk8metal/michi-cli`）

## 参考リンク

- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [NPM公開ガイド](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [セマンティックバージョニング](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [CI/CD整備計画](./tmp/cicd-plan.md)

