# Multi-Repo管理ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

### Multi-Repo機能とは

Multi-Repo機能は、1つのプロジェクトで複数のGitHubリポジトリを統合的に管理するための機能です。マイクロサービスアーキテクチャやモノレポ分割後のプロジェクトなど、複数リポジトリにまたがる開発を効率化します。

### 対象ユーザー

- マイクロサービスアーキテクチャで開発しているチーム
- フロントエンド・バックエンド・インフラを別リポジトリで管理しているチーム
- 複数リポジトリのCI/CD状態を一元管理したいチーム
- 複数リポジトリの統合ドキュメントをConfluenceで管理したいチーム

### 主要機能

1. **プロジェクト管理**: 複数リポジトリをグループ化してプロジェクトとして管理
2. **CI結果集約**: 複数リポジトリのGitHub Actions実行結果を一覧表示
3. **テスト実行**: プロジェクト単位でテストスクリプトを実行
4. **Confluence同期**: プロジェクトドキュメントをConfluenceに自動同期
5. **一覧表示**: プロジェクトとリポジトリの情報を一覧表示

## セットアップ

### 前提条件

- Node.js 18以上
- GitHub Personal Access Token
- Atlassian (Confluence/JIRA) アカウント（Confluence同期を使用する場合）

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

#### GitHub Token（必須）

GitHub Actions APIを使用してCI結果を取得するために必要です。

```bash
# .env ファイルに追加
GITHUB_TOKEN=ghp_your_github_personal_access_token
```

**Token作成手順**:
1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"をクリック
3. 必要なスコープを選択:
   - `repo` (フル権限、private repositoriesへのアクセスに必要)
   - `read:org` (organizationのリポジトリにアクセスする場合)
4. トークンをコピーして環境変数に設定

#### Atlassian認証情報（Confluence同期を使用する場合）

```bash
# .env ファイルに追加
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your_atlassian_api_token
```

**API Token作成手順**:
1. Atlassian Account Settings → Security → API tokens
2. "Create API token"をクリック
3. トークン名を入力して作成
4. トークンをコピーして環境変数に設定

## 基本的な使い方

### 1. プロジェクトの初期化

新しいMulti-Repoプロジェクトを作成します。

```bash
michi multi-repo:init <project-name> --jira <JIRA-KEY> --confluence-space <SPACE>
```

**例**:
```bash
michi multi-repo:init my-microservices --jira MSV --confluence-space MSV
```

**生成されるファイル**:
- `docs/michi/<project-name>/`: プロジェクトドキュメント用ディレクトリ
  - `overview/requirements.md`: 要件定義書（テンプレート）
  - `overview/architecture.md`: アーキテクチャ設計書（テンプレート）
  - `design/sequence.md`: シーケンス図（テンプレート）
  - `test/strategy.md`: テスト戦略書（テンプレート）
- `.michi/config.json`: プロジェクト設定（multiRepoProjectsに追加）

### 2. リポジトリの登録

プロジェクトにGitHubリポジトリを追加します。

```bash
michi multi-repo:add-repo <project-name> --name <repo-name> --url <github-url> --branch <branch>
```

**例**:
```bash
# フロントエンドリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name frontend \
  --url https://github.com/myorg/frontend \
  --branch main

# バックエンドリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name backend \
  --url https://github.com/myorg/backend \
  --branch main

# インフラリポジトリを追加
michi multi-repo:add-repo my-microservices \
  --name infrastructure \
  --url https://github.com/myorg/infra \
  --branch main
```

### 3. CI結果の集約

プロジェクト内の全リポジトリのGitHub Actions実行結果を一覧表示します。

```bash
michi multi-repo:ci-status <project-name>
```

**出力例**:
```
=== Multi-Repo CI Status ===
Project: my-microservices
Repositories: 3

Repository: frontend (main)
  Latest Workflow Run: Build and Test
  Status: ✅ success
  Conclusion: success
  Created: 2025-12-17T10:30:00Z
  URL: https://github.com/myorg/frontend/actions/runs/12345

Repository: backend (main)
  Latest Workflow Run: CI
  Status: ✅ success
  Conclusion: success
  Created: 2025-12-17T10:25:00Z
  URL: https://github.com/myorg/backend/actions/runs/12346

Repository: infrastructure (main)
  Latest Workflow Run: Deploy
  Status: ❌ failure
  Conclusion: failure
  Created: 2025-12-17T10:20:00Z
  URL: https://github.com/myorg/infra/actions/runs/12347

CI結果の集約が完了しました
```

**キャッシング機能**:
- CI結果は `.ci-cache.json` にキャッシュされます（有効期限: 15分）
- キャッシュがある場合は高速に結果を表示します

### 4. テストスクリプトの実行

プロジェクトに登録されたテストスクリプトを実行します。

```bash
# Phase A テスト（PR時）
michi multi-repo:test <project-name> --phase A

# Phase B テスト（リリース前）
michi multi-repo:test <project-name> --phase B
```

**テストスクリプトの登録方法**:

`.michi/config.json` を編集:
```json
{
  "multiRepoProjects": [
    {
      "name": "my-microservices",
      "jiraKey": "MSV",
      "confluenceSpace": "MSV",
      "createdAt": "2025-12-17T00:00:00Z",
      "repositories": [...],
      "testScripts": {
        "phaseA": [
          "npm test:unit",
          "npm run lint",
          "npm run type-check"
        ],
        "phaseB": [
          "npm test:integration",
          "npm test:e2e",
          "npm test:performance"
        ]
      }
    }
  ]
}
```

### 5. Confluenceへの同期

プロジェクトドキュメントをConfluenceに同期します。

```bash
# 全ドキュメントを同期
michi multi-repo:confluence-sync <project-name>

# 特定のドキュメントタイプのみ同期
michi multi-repo:confluence-sync <project-name> --doc-type requirements
michi multi-repo:confluence-sync <project-name> --doc-type architecture
michi multi-repo:confluence-sync <project-name> --doc-type sequence
michi multi-repo:confluence-sync <project-name> --doc-type strategy
```

**同期されるドキュメント**:
- `requirements.md` → Confluence Requirements ページ
- `architecture.md` → Confluence Architecture ページ
- `sequence.md` → Confluence Sequence Diagrams ページ
- `strategy.md` → Confluence Test Strategy ページ

**Mermaidダイアグラムの変換**:
- Markdown内のMermaidダイアグラムは自動的にConfluence形式に変換されます

### 6. プロジェクト一覧の表示

登録されているプロジェクトとリポジトリの一覧を表示します。

```bash
michi multi-repo:list
```

**出力例**:
```
=== Multi-Repo Projects ===

Project: my-microservices
  JIRA Key: MSV
  Confluence Space: MSV
  Created: 2025-12-17T00:00:00Z

  Repositories (3):
    1. frontend
       URL: https://github.com/myorg/frontend
       Branch: main

    2. backend
       URL: https://github.com/myorg/backend
       Branch: main

    3. infrastructure
       URL: https://github.com/myorg/infra
       Branch: main

  Test Scripts:
    Phase A: npm test:unit, npm run lint, npm run type-check
    Phase B: npm test:integration, npm test:e2e, npm test:performance

Total Projects: 1
```

## コマンドリファレンス

### multi-repo:init

新しいMulti-Repoプロジェクトを初期化します。

**構文**:
```bash
michi multi-repo:init <project-name> --jira <JIRA-KEY> --confluence-space <SPACE>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）
  - 1-100文字
  - パス区切り文字 (`/`, `\`)、相対パス (`.`, `..`)、制御文字は使用不可

**オプション**:
- `--jira <JIRA-KEY>`: JIRAプロジェクトキー（必須）
  - 2-10文字の大文字英字のみ
  - 例: `MSV`, `PROJ`, `MICROSVCS`
- `--confluence-space <SPACE>`: Confluenceスペースキー（必須）
  - 空でない文字列
  - 例: `MSV`, `PROJ`

**例**:
```bash
michi multi-repo:init my-microservices --jira MSV --confluence-space MSV
```

### multi-repo:add-repo

プロジェクトにリポジトリを追加します。

**構文**:
```bash
michi multi-repo:add-repo <project-name> --name <repo-name> --url <github-url> --branch <branch>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--name <repo-name>`: リポジトリ名（必須）
  - 空でない文字列
- `--url <github-url>`: GitHub URL（必須）
  - `https://github.com/{owner}/{repo}` 形式
  - HTTPSプロトコル必須（HTTP、SSH不可）
  - `.git` 拡張子は不要
- `--branch <branch>`: ブランチ名（必須）
  - デフォルトブランチ（通常は `main` または `master`）

**例**:
```bash
michi multi-repo:add-repo my-microservices \
  --name api-gateway \
  --url https://github.com/myorg/api-gateway \
  --branch main
```

### multi-repo:ci-status

プロジェクトのCI結果を集約して表示します。

**構文**:
```bash
michi multi-repo:ci-status <project-name>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**動作**:
1. 各リポジトリの最新ワークフロー実行結果をGitHub APIから取得
2. キャッシュファイル (`.ci-cache.json`) に保存（有効期限: 15分）
3. 結果を一覧表示

**パフォーマンス**:
- 並列処理により高速化（10リポジトリで30秒以内）
- キャッシュヒット時は即座に表示

**例**:
```bash
michi multi-repo:ci-status my-microservices
```

### multi-repo:test

プロジェクトのテストスクリプトを実行します。

**構文**:
```bash
michi multi-repo:test <project-name> --phase <phase>
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--phase <phase>`: テストフェーズ（必須）
  - `A`: Phase A テスト（PR時: unit, lint, build）
  - `B`: Phase B テスト（リリース前: integration, e2e, performance, security）

**例**:
```bash
# Phase A テスト
michi multi-repo:test my-microservices --phase A

# Phase B テスト
michi multi-repo:test my-microservices --phase B
```

### multi-repo:confluence-sync

プロジェクトドキュメントをConfluenceに同期します。

**構文**:
```bash
michi multi-repo:confluence-sync <project-name> [--doc-type <type>]
```

**引数**:
- `<project-name>`: プロジェクト名（必須）

**オプション**:
- `--doc-type <type>`: ドキュメントタイプ（オプション）
  - `requirements`: 要件定義書のみ
  - `architecture`: アーキテクチャ設計書のみ
  - `sequence`: シーケンス図のみ
  - `strategy`: テスト戦略書のみ
  - 未指定: 全ドキュメントを同期

**動作**:
1. 親ページ（プロジェクト名）を作成または取得
2. 各ドキュメントを子ページとして作成または更新
3. Mermaidダイアグラムを自動変換

**例**:
```bash
# 全ドキュメントを同期
michi multi-repo:confluence-sync my-microservices

# 要件定義書のみ同期
michi multi-repo:confluence-sync my-microservices --doc-type requirements
```

### multi-repo:list

登録されているプロジェクトの一覧を表示します。

**構文**:
```bash
michi multi-repo:list
```

**引数**: なし

**動作**:
- `.michi/config.json` からプロジェクト情報を読み込み
- プロジェクト名、JIRA キー、Confluence スペース、リポジトリ一覧を表示

**例**:
```bash
michi multi-repo:list
```

## トラブルシューティング

### GitHub Token未設定

**症状**:
```
Error: GITHUB_TOKEN environment variable is not set
```

**原因**:
`GITHUB_TOKEN` 環境変数が設定されていません。

**対処法**:
1. GitHub Personal Access Token を作成（上記「セットアップ」参照）
2. `.env` ファイルに追加:
   ```
   GITHUB_TOKEN=ghp_your_token
   ```
3. コマンドを再実行

### Confluence認証失敗

**症状**:
```
Error: Confluence authentication failed
```

**原因**:
- Atlassian認証情報が正しく設定されていない
- API Tokenの有効期限が切れている
- URLが間違っている

**対処法**:
1. `.env` ファイルの設定を確認:
   ```
   ATLASSIAN_URL=https://your-domain.atlassian.net
   ATLASSIAN_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your_token
   ```
2. URLが正しい形式か確認（`https://` で始まり、`.atlassian.net` で終わる）
3. API Tokenを再作成して設定

### レート制限超過

**症状**:
```
Error: GitHub API rate limit exceeded
```

**原因**:
GitHub APIのレート制限（5000リクエスト/時）を超えました。

**対処法**:
1. 1時間待機してから再実行
2. キャッシュを活用（15分以内の再実行はキャッシュから取得）
3. 複数のGitHub Tokenをローテーションで使用

### スクリプト未存在エラー

**症状**:
```
Error: Script not found: npm test:unit
```

**原因**:
`.michi/config.json` に登録されているテストスクリプトが存在しません。

**対処法**:
1. `package.json` の `scripts` セクションを確認
2. スクリプト名を修正:
   ```json
   {
     "scripts": {
       "test:unit": "vitest run tests/unit",
       "lint": "eslint .",
       "type-check": "tsc --noEmit"
     }
   }
   ```
3. `.michi/config.json` のスクリプト名を修正

### プロジェクトが見つからない

**症状**:
```
Error: Project 'my-project' not found
```

**原因**:
指定されたプロジェクト名が `.michi/config.json` に存在しません。

**対処法**:
1. プロジェクト名を確認:
   ```bash
   michi multi-repo:list
   ```
2. プロジェクト名のスペル、大文字小文字を確認
3. 必要に応じてプロジェクトを初期化:
   ```bash
   michi multi-repo:init my-project --jira PROJ --confluence-space PROJ
   ```

## FAQ

### Q1: Multi-Repo機能はどのようなプロジェクトに適していますか？

**A**: 以下のようなプロジェクトに適しています:
- マイクロサービスアーキテクチャ（複数の独立したサービスリポジトリ）
- フロントエンド・バックエンド分離アーキテクチャ
- モバイルアプリ + API + Webダッシュボード
- インフラ as Code を別リポジトリで管理

### Q2: リポジトリの最大数に制限はありますか？

**A**: 技術的な制限はありませんが、以下の推奨事項があります:
- 実用的には10-20リポジトリ程度を推奨
- CI結果集約は並列処理により高速化（10リポジトリで30秒以内）
- 100リポジトリまでテスト済み（5分以内）

### Q3: Private リポジトリは使用できますか？

**A**: はい、使用できます。GitHub Personal Access Token に `repo` スコープ（フル権限）を付与してください。

### Q4: GitHub Actions以外のCIツール（Jenkins、CircleCIなど）には対応していますか？

**A**: 現在はGitHub Actionsのみ対応しています。他のCIツールのサポートは将来のバージョンで検討中です。

### Q5: Mermaidダイアグラムの変換に対応していない記法はありますか？

**A**: 基本的な記法（graph, flowchart, sequenceDiagram, classDiagram）はサポートしています。複雑なカスタマイズや最新の実験的機能は未サポートの可能性があります。

### Q6: Confluenceの複数スペースに同期できますか？

**A**: 1プロジェクトにつき1つのConfluenceスペースに同期します。複数スペースに同期する場合は、プロジェクトを分けて管理してください。

### Q7: キャッシュファイル (`.ci-cache.json`) は削除しても大丈夫ですか？

**A**: はい、削除しても問題ありません。次回のCI結果集約時に自動的に再生成されます。ただし、キャッシュがない状態では初回取得に時間がかかります。

### Q8: テストスクリプトはどこで実行されますか？

**A**: プロジェクトルートディレクトリ（`.michi/config.json` が存在するディレクトリ）で実行されます。リポジトリごとに異なるディレクトリでスクリプトを実行することはできません。

### Q9: 既存のプロジェクトにMulti-Repo機能を追加できますか？

**A**: はい、可能です。`michi multi-repo:init` を実行すれば、既存の `.michi/config.json` に `multiRepoProjects` セクションが追加されます。

### Q10: プロジェクトを削除するにはどうすればいいですか？

**A**: 現在、削除用のコマンドはありません。`.michi/config.json` を直接編集して該当プロジェクトを削除してください。将来のバージョンで削除コマンドを追加予定です。

## 関連ドキュメント

- [ワークフローガイド](./workflow.md): Michiの全体的な開発ワークフロー
- [Phase自動化ガイド](./phase-automation.md): テストフェーズの自動化について
- [カスタマイズガイド](./customization.md): Michiのカスタマイズ方法
- [Multi-Repo API仕様書](../reference/multi-repo-api.md): Multi-Repo機能のAPI仕様（作成予定）
