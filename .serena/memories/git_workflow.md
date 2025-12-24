# Gitワークフローガイド

## ブランチ戦略

### ブランチ構成

- **main**: 本番環境相当（常にデプロイ可能な状態）
- **develop**: 開発環境（次回リリース予定の機能を統合）
- **feature/**: 機能開発用（developから分岐）
- **bugfix/**: バグ修正用（developから分岐）
- **hotfix/**: 緊急修正用（mainから分岐）

### ブランチ命名規則

```bash
# 機能開発
feature/<feature-name>
例: feature/user-auth, feature/payment

# バグ修正
bugfix/<bug-description>
例: bugfix/login-error, bugfix/memory-leak

# 緊急修正
hotfix/<hotfix-description>
例: hotfix/security-patch, hotfix/critical-bug
```

## 絶対に守るべき禁止事項

### ❌ 禁止事項

1. **main/masterブランチへの直接push/commit** - 絶対禁止
2. **force push（`--force`, `-f`）の使用** - 特にmain/masterへは厳禁
3. **main/masterブランチでの作業** - 必ずfeature/bugfix/hotfixブランチで作業

### AIエージェント向けの安全確認手順

#### 1. ブランチ確認（必須）
```bash
git branch --show-current
```
- main/masterの場合は**即座に操作を中止**
- feature/, bugfix/, hotfix/ ブランチでのみ作業を継続

#### 2. 作業開始時のブランチ作成
```bash
git checkout -b feature/<task-description>
```
- 新しい作業は必ずfeatureブランチで開始

#### 3. プッシュ時の確認
- プッシュ先が `origin/feature/*`, `origin/bugfix/*`, `origin/hotfix/*` であることを確認
- main/masterへの直接プッシュは**絶対に行わない**

#### 4. 違反時の対応
- mainにいることに気づいた場合、ユーザーに確認を求める
- 勝手にmainで作業を続けない

## 標準的なワークフロー

### 1. 新機能開発の開始

```bash
# 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 新しいfeatureブランチを作成
git checkout -b feature/<feature-name>
```

### 2. 開発作業

```bash
# 変更を加える
# ...コーディング...

# 変更をステージング
git add .

# コミット
git commit -m "[feat] ユーザー認証機能を追加"

# リモートにプッシュ
git push -u origin feature/<feature-name>
```

### 3. PR作成

```bash
# GitHub CLIを使用してPR作成
gh pr create --title "ユーザー認証機能を追加" --body "..."
```

### 4. PR承認後のマージ

```bash
# GitHubのUIでマージ（推奨）
# または
gh pr merge <pr-number> --squash
```

### 5. ブランチのクリーンアップ

```bash
# ローカルブランチを削除
git checkout develop
git branch -d feature/<feature-name>

# リモートブランチを削除（GitHubで自動削除される場合もある）
git push origin --delete feature/<feature-name>
```

## コミットメッセージ規約

### フォーマット

```
[種別] 簡潔な説明

詳細な説明（オプション）
```

### 種別

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント
- **style**: フォーマット（コードの動作に影響しない変更）
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **chore**: その他（ビルドプロセス、依存関係の更新など）

### 良い例

```bash
git commit -m "[feat] Confluence同期機能を追加"
git commit -m "[fix] JIRAステータス更新時のエラーを修正"
git commit -m "[docs] セットアップガイドを更新"
git commit -m "[refactor] confluence-sync.tsをリファクタリング"
git commit -m "[test] phase-runnerの統合テストを追加"
git commit -m "[chore] 依存関係を更新"
```

### 悪い例

```bash
git commit -m "update"              # 何を更新したのか不明
git commit -m "fix bug"             # どのバグを修正したのか不明
git commit -m "WIP"                 # 作業中のコミットは避ける
git commit -m "test test test"      # 意味不明
```

## Jujutsu (jj) を使う場合

Michiプロジェクトでは、Gitの代わりにJujutsu (jj) も使用できます。

### 基本的なワークフロー

```bash
# ブランチ作成
jj branch create feature/<feature-name>

# 変更を加える
# ...コーディング...

# コミット
jj commit -m "[feat] ユーザー認証機能を追加"

# リモートにプッシュ
jj git push
```

### Jujutsuの利点

- **自動コミット**: 変更は自動的に追跡される
- **柔軟な履歴編集**: コミット履歴を簡単に編集できる
- **並行作業**: 複数のブランチで並行作業が容易
- **直感的な操作**: Gitよりシンプルなコマンド体系

### Jujutsuコマンド対応表

| Git                              | Jujutsu (jj)                 |
| -------------------------------- | ---------------------------- |
| `git status`                     | `jj status`                  |
| `git add .`                      | 不要（自動追跡）             |
| `git commit -m "message"`        | `jj commit -m "message"`     |
| `git push`                       | `jj git push`                |
| `git pull`                       | `jj git fetch`               |
| `git checkout <branch>`          | `jj edit <branch>`           |
| `git checkout -b <branch>`       | `jj branch create <branch>`  |
| `git log`                        | `jj log`                     |
| `git diff`                       | `jj diff`                    |

## マージ戦略

### プルリクエストのマージ方法

1. **Squash and merge（推奨）**: 複数のコミットを1つにまとめてマージ
2. **Rebase and merge**: コミット履歴を線形に保つ
3. **Merge commit**: すべてのコミットを保持（非推奨）

### マージ前の確認事項

- ✅ すべてのテストがPASSすること
- ✅ Lint、型チェック、ビルドが成功すること
- ✅ コードレビューが完了していること
- ✅ コンフリクトが解決されていること
- ✅ CI/CDパイプラインが成功していること

## コンフリクト解決

### コンフリクトが発生した場合

```bash
# 最新のdevelopブランチをマージ
git checkout feature/<feature-name>
git pull origin develop

# コンフリクトを解決
# ...エディタでコンフリクトを修正...

# 解決後にコミット
git add .
git commit -m "[fix] コンフリクトを解決"
git push
```

## リリースフロー

### 1. リリースブランチの作成

```bash
git checkout -b release/vX.Y.Z develop
```

### 2. バージョン番号の更新

- `package.json`のバージョンを更新
- `CHANGELOG.md`を更新

### 3. リリースPRの作成

```bash
git commit -m "[chore] bump version to X.Y.Z"
git push -u origin release/vX.Y.Z
gh pr create --title "Release vX.Y.Z" --body "..."
```

### 4. PRマージ後、タグ作成

```bash
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

### 5. 自動リリース

- GitHub Actionsが自動的にnpm publishとGitHub Releaseを作成

## トラブルシューティング

### 間違えてmainブランチでコミットした場合

```bash
# コミットを取り消す（まだプッシュしていない場合）
git reset --soft HEAD~1

# 正しいブランチに切り替える
git checkout -b feature/<feature-name>

# 再度コミット
git add .
git commit -m "[種別] 説明"
```

### force pushが必要な場合（慎重に）

```bash
# 自分のfeatureブランチのみで使用可能
git push --force-with-lease origin feature/<feature-name>

# 絶対にmain/masterには使用しない
```

### ブランチを間違えた場合

```bash
# 現在のブランチを確認
git branch --show-current

# 正しいブランチに切り替える
git checkout feature/<feature-name>

# または新しいブランチを作成
git checkout -b feature/<feature-name>
```

## ベストプラクティス

### コミットの粒度

- ✅ 小さく頻繁にコミットする
- ✅ 1つのコミットで1つの変更（論理的なまとまり）
- ✅ ビルドが通る状態でコミット

### コミット前の確認

```bash
# 変更内容を確認
git status
git diff

# ステージング内容を確認
git diff --staged
```

### プッシュ前の確認

```bash
# Lint、型チェック、テストを実行
npm run lint
npm run type-check
npm run test:run
npm run build

# すべて成功したらプッシュ
git push
```

### PRのサイズ

- ✅ 小さく保つ（300行以下を推奨）
- ✅ レビューしやすいサイズにする
- ✅ 大きな変更は複数のPRに分割

## まとめ

Michiプロジェクトでは、以下のGitワークフローを推奨します：

1. **main/masterブランチへの直接操作は禁止**
2. **feature/bugfix/hotfixブランチで作業**
3. **PRを通じてマージ**
4. **コミットメッセージは明確に**
5. **小さく頻繁にコミット**

これらのルールを守ることで、安全で効率的な開発が可能になります。
