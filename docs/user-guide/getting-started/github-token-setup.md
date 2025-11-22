# GitHubトークン作成ガイド

このガイドでは、MichiでGitHub連携を行うために必要なPersonal Access Token (PAT)の作成方法を説明します。

## 目次

1. [トークンの種類](#1-トークンの種類)
2. [作成手順](#2-作成手順)
3. [必要な権限](#3-必要な権限)
4. [トークンの保存](#4-トークンの保存)
5. [セキュリティベストプラクティス](#5-セキュリティベストプラクティス)
6. [トラブルシューティング](#6-トラブルシューティング)
7. [参考リンク](#7-参考リンク)

## 1. トークンの種類

GitHubでは2種類のPersonal Access Tokenが利用可能です。

### Fine-grained tokens（推奨）

**特徴**:
- ✅ リポジトリ単位で権限を制御可能
- ✅ より細かいアクセス制御
- ✅ 有効期限を細かく設定可能
- ✅ セキュリティが高い

**デメリット**:
- 設定項目が多い
- リポジトリごとに設定が必要

### Tokens (classic)

**特徴**:
- ✅ シンプルな設定
- ✅ 全リポジトリに対する権限
- ✅ 既存ツールとの互換性が高い

**デメリット**:
- 権限の粒度が粗い
- リポジトリ単位の制御ができない

**推奨**: セキュリティ重視の場合は **Fine-grained tokens**、シンプルさ重視の場合は **Tokens (classic)** を選択してください。

## 2. 作成手順

### 2.1 Fine-grained tokensの作成

#### Step 1: GitHubにアクセス

1. [GitHub](https://github.com) にログイン
2. 右上のプロフィール写真をクリック
3. **Settings** を選択

#### Step 2: Developer settingsに移動

1. 左サイドバーの一番下にある **Developer settings** をクリック
2. 左サイドバーで **Personal access tokens** を展開
3. **Fine-grained tokens** を選択

#### Step 3: トークンを生成

1. **Generate new token** をクリック
2. 以下の項目を入力:

   | 項目 | 設定値 | 説明 |
   |------|--------|------|
   | **Token name** | `michi-cli-automation` | トークンの識別名 |
   | **Expiration** | `90 days` | 有効期限（推奨） |
   | **Description** | （任意） | トークンの用途説明 |
   | **Resource owner** | あなたのアカウント | トークンの所有者 |

3. **Repository access** を選択:
   - **Only select repositories** を選択
   - Michiを使用するリポジトリを選択

#### Step 4: 権限を設定

**Repository permissions** セクションで以下を設定:

| 権限 | アクセスレベル | 用途 |
|------|----------------|------|
| **Contents** | **Read and write** | ファイルの読み書き、ブランチ作成 |
| **Pull requests** | **Read and write** | PRの作成、更新、マージ |
| **Metadata** | **Read-only** | リポジトリ情報取得（自動選択） |
| **Issues** | Read and write（オプション） | Issue作成（JIRA連携時） |
| **Workflows** | Read and write（オプション） | GitHub Actions実行 |

#### Step 5: トークンを生成

1. ページ下部の **Generate token** をクリック
2. **トークンをコピー**

   ⚠️ **重要**: この画面を離れると二度と表示されません！必ずコピーして安全な場所に保存してください。

### 2.2 Tokens (classic)の作成

#### Step 1: GitHubにアクセス

1. [GitHub](https://github.com) にログイン
2. 右上のプロフィール写真をクリック
3. **Settings** を選択

#### Step 2: Developer settingsに移動

1. 左サイドバーの一番下にある **Developer settings** をクリック
2. 左サイドバーで **Personal access tokens** を展開
3. **Tokens (classic)** を選択

#### Step 3: トークンを生成

1. **Generate new token** → **Generate new token (classic)** をクリック
2. 以下の項目を入力:

   | 項目 | 設定値 | 説明 |
   |------|--------|------|
   | **Note** | `michi-cli-automation` | トークンの識別名 |
   | **Expiration** | `90 days` | 有効期限（推奨） |

#### Step 4: スコープを選択

**必須スコープ**:

```
✅ repo (Full control of private repositories)
   ├─ ✅ repo:status (Access commit status)
   ├─ ✅ repo_deployment (Access deployment status)
   ├─ ✅ public_repo (Access public repositories)
   └─ ✅ repo:invite (Access repository invitations)

✅ workflow (Update GitHub Action workflows)
```

**オプショナルスコープ**:

```
⬜ admin:org (組織管理者のみ)
⬜ notifications (通知管理が必要な場合)
```

#### Step 5: トークンを生成

1. ページ下部の **Generate token** をクリック
2. **トークンをコピー**

   ⚠️ **重要**: この画面を離れると二度と表示されません！

## 3. 必要な権限

### 3.1 Michiで必要な最小権限

| 権限 | Fine-grained | Classic | 説明 | 用途 |
|------|--------------|---------|------|------|
| Contents | Read and write | `repo` | ファイルの読み書き | ブランチ作成、コミット |
| Pull requests | Read and write | `repo` | PRの管理 | PR作成、更新、マージ |
| Metadata | Read-only | `repo` | リポジトリ情報 | 基本情報取得 |

### 3.2 推奨権限セット（フル機能利用）

| 権限 | Fine-grained | Classic | 説明 | 用途 |
|------|--------------|---------|------|------|
| Contents | Read and write | `repo` | ファイルの読み書き | ブランチ作成、コミット、ファイル変更 |
| Pull requests | Read and write | `repo` | PRの管理 | PR作成、更新、マージ、レビュー |
| Workflows | Read and write | `workflow` | GitHub Actions | CI/CD連携、ワークフロー実行 |
| Issues | Read and write | `repo` | Issueの管理 | Issue作成、ラベル管理（JIRA連携時） |
| Metadata | Read-only | `repo` | リポジトリ情報 | 基本情報取得（自動） |

### 3.3 権限の詳細説明

#### Contents: Read and write

**用途**:
- ブランチの作成
- ファイルのコミット
- ファイルの読み取り

**Michiでの使用例**:
```bash
# 機能ブランチの作成
git checkout -b feature/new-feature

# ファイルのコミット
git add .
git commit -m "feat: 新機能追加"
git push origin feature/new-feature
```

#### Pull requests: Read and write

**用途**:
- PRの作成
- PRの更新
- PRのマージ
- レビューの管理

**Michiでの使用例**:
```bash
# PR作成（GitHub CLI経由）
gh pr create --head feature/new-feature --base main \
  --title "新機能追加" \
  --body "詳細説明"
```

#### Workflows: Read and write

**用途**:
- GitHub Actionsの実行
- ワークフローファイルの更新
- CI/CD連携

**Michiでの使用例**:
- PR作成時に自動テスト実行
- CI/CDパイプラインの管理

## 4. トークンの保存

### 4.1 .envファイルに保存（推奨）

Michiプロジェクトの `.env` ファイルに保存します。

```bash
cd /path/to/your-project

# .env ファイルを編集
nano .env
```

以下の内容を追加:

```bash
# GitHub設定
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ORG=your-organization  # または your-username
GITHUB_REPO=your-org/your-repo
```

**セキュリティ**:
```bash
# .env ファイルのパーミッションを600に設定
chmod 600 .env

# .gitignore に .env が含まれているか確認
cat .gitignore | grep .env
```

### 4.2 環境変数として設定

#### macOS / Linux（一時的）

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### macOS / Linux（永続的）

`~/.zshrc` または `~/.bash_profile` に追加:

```bash
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
source ~/.zshrc
```

#### Windows（PowerShell）

```powershell
# 一時的
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 永続的
[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'ghp_xxx...', 'User')
```

### 4.3 トークンの検証

設定したトークンが正しく動作するか確認:

```bash
# 環境変数の確認
echo $GITHUB_TOKEN

# GitHub APIで検証
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 成功時のレスポンス例
# {
#   "login": "your-username",
#   "id": 12345,
#   ...
# }
```

## 5. セキュリティベストプラクティス

### 5.1 トークンの取り扱い

#### ✅ やるべきこと

- **`.env` ファイルに保存し、`.gitignore` に追加**
  ```bash
  # .gitignore
  .env
  .env.local
  .env.*.local
  ```

- **ファイルパーミッションを600に設定**
  ```bash
  chmod 600 .env
  ```

- **定期的にトークンをローテーション**
  - 推奨: 90日ごと
  - 最大: 1年

- **権限の最小化**
  - 必要な権限のみを付与
  - Fine-grained tokensでリポジトリを限定

#### ❌ やってはいけないこと

- **コードにハードコード**
  ```javascript
  // ❌ 絶対にダメ！
  const token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  ```

- **Gitにコミット**
  ```bash
  # ❌ ダメ！
  git add .env
  git commit -m "環境変数追加"
  ```

- **公開リポジトリで使用**
  - Secretsやenvファイルの扱いに十分注意

### 5.2 トークンの無効化

トークンが漏洩した疑いがある場合:

1. GitHub Settings → Developer settings → Personal access tokens
2. 該当トークンを選択
3. **Delete** または **Regenerate** をクリック
4. 新しいトークンを生成し、`.env` を更新

### 5.3 有効期限の設定

| 期間 | 推奨 | 用途 |
|------|------|------|
| 7日 | ⭐⭐⭐ | テスト・検証用 |
| 30日 | ⭐⭐⭐ | 短期プロジェクト |
| 90日 | ⭐⭐ | 通常の開発（推奨） |
| 1年 | ⭐ | 長期プロジェクト |
| 無期限 | ❌ | 避けるべき |

## 6. トラブルシューティング

### 6.1 `Bad credentials`

**エラーメッセージ**:
```
Error: Bad credentials
```

**原因**:
- トークンが無効または期限切れ
- トークンの形式が間違っている
- 環境変数が正しく設定されていない

**解決方法**:

1. トークンの有効期限を確認:
   - GitHub Settings → Developer settings → Personal access tokens
   - 該当トークンの "Expires" を確認

2. トークンを再生成:
   - 期限切れの場合は新しいトークンを作成
   - `.env` ファイルを更新

3. 環境変数を確認:
   ```bash
   echo $GITHUB_TOKEN
   # 正しいトークンが表示されるか確認
   ```

### 6.2 `Resource not accessible by integration`

**エラーメッセージ**:
```
Error: Resource not accessible by integration
```

**原因**:
- 権限が不足している
- リポジトリへのアクセス権がない

**解決方法**:

1. トークンの権限を確認:
   - Fine-grained tokens: Repository permissions を確認
   - Classic tokens: `repo` スコープが有効か確認

2. リポジトリアクセスを確認:
   - Fine-grained tokens: Repository access で対象リポジトリが選択されているか確認

3. 必要に応じてトークンを再作成:
   - 不足している権限を追加
   - `.env` ファイルを更新

### 6.3 `API rate limit exceeded`

**エラーメッセージ**:
```
Error: API rate limit exceeded for user ID xxxxx
```

**原因**:
- API呼び出し制限に到達
- 認証済み: 5000 requests/hour
- 未認証: 60 requests/hour

**解決方法**:

1. レート制限を確認:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/rate_limit
   ```

2. リセット時刻を確認:
   ```json
   {
     "rate": {
       "limit": 5000,
       "remaining": 0,
       "reset": 1234567890  // Unix timestamp
     }
   }
   ```

3. 対処法:
   - リセット時刻まで待つ
   - API呼び出しを減らす
   - キャッシュを活用する

### 6.4 トークンが表示されない

**症状**:
- トークン生成後、画面を離れてトークンが見えなくなった

**解決方法**:

1. **トークンは再表示できません**
2. 新しいトークンを生成:
   - Generate new token で新規作成
   - 古いトークンは削除

### 6.5 Michiで認識されない

**症状**:
```bash
npx @sk8metal/michi-cli setup-existing --cursor
# GitHub設定でエラー
```

**解決方法**:

1. `.env` ファイルの場所を確認:
   ```bash
   pwd
   ls -la .env
   ```

2. `.env` の内容を確認:
   ```bash
   cat .env | grep GITHUB_TOKEN
   ```

3. パーミッションを確認:
   ```bash
   ls -l .env
   # -rw------- 1 user group ... .env (600)
   ```

4. Michiを再実行:
   ```bash
   npx @sk8metal/michi-cli setup-existing --cursor --lang ja
   ```

## 7. 参考リンク

### GitHub公式ドキュメント

- [Personal Access Tokens (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)
- [GitHub Token Permissions](https://docs.github.com/en/rest/overview/permissions-required-for-fine-grained-personal-access-tokens)

### Michi関連ドキュメント

- [セットアップガイド](./setup.md)
- [クイックスタート](./quick-start.md)
- [トラブルシューティング](../hands-on/troubleshooting.md)
- [Michiメインドキュメント](../../README.md)

---

**次のステップ**: トークンを作成したら、[セットアップガイド](./setup.md)に戻って環境変数の設定を完了してください。


