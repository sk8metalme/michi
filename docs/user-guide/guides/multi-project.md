# マルチプロジェクト管理ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

Michiは、複数プロジェクト（3-5案件）を同時並行で管理できるように設計されています。

## アーキテクチャ

### プロジェクト構成

**構成**: 1つのリポジトリ内で複数プロジェクトを管理します。**すべてのプロジェクト（単一プロジェクトも含む）は`projects/`ディレクトリ配下に配置され、それぞれに`.kiro/project.json`を持ちます。**

```
repository/  ← 1つのGitHubリポジトリ
├── projects/
│   ├── 20240115-payment-api/  ← プロジェクトA
│   │   └── .kiro/
│   │       ├── project.json
│   │       └── specs/
│   ├── 20240201-user-management/  ← プロジェクトB
│   │   └── .kiro/
│   └── 20240310-analytics-api/  ← プロジェクトC
│       └── .kiro/
├── package.json  ← リポジトリルート（共有）
├── tsconfig.json  ← リポジトリルート（共有）
└── .gitignore  ← リポジトリルート（共有）
```

**重要な原則**:
- **統一されたディレクトリ構成**: 単一プロジェクトも`projects/{project-id}/`配下に配置
- 各プロジェクトディレクトリに`.kiro/project.json`を配置
- 作業ディレクトリ（`process.cwd()`）から`.kiro/project.json`を読み込んでプロジェクトを識別
- プロジェクト切り替えは、該当ディレクトリに移動するだけ
- `package.json`や`tsconfig.json`はリポジトリルートに配置（複数プロジェクトで共有）

### 統合管理

**Confluence**: 共有スペース（PRD, QA, RELEASE）
- ラベルでプロジェクトを識別
- プロジェクト横断ダッシュボード

**JIRA**: プロジェクトキー別
- PRJA（プロジェクトA）
- PRJB（プロジェクトB）
- MICHI（統合ハブ）

## プロジェクトのセットアップ

### 新規プロジェクト追加

詳細な手順は [新規リポジトリセットアップガイド](../getting-started/new-repository-setup.md) を参照してください。

**クイックスタート**:
1. 既存リポジトリに追加: `npx tsx /path/to/michi/scripts/setup-existing-project.ts --michi-path /path/to/michi`
2. 新規リポジトリ作成: `npm run create-project -- --name <id> --project-name <name> --jira-key <key>`

**マルチプロジェクト特有の注意点**:
- 1つのリポジトリ内で複数プロジェクトを管理
- 各プロジェクトは独立したディレクトリに配置
- `.kiro/project.json`でプロジェクトを識別
- Confluenceラベルでプロジェクト横断検索が可能
- プロジェクト切り替えは、該当ディレクトリに移動するだけ

### 環境変数設定

各プロジェクトで`.env`ファイルを設定します。詳細は [新規リポジトリセットアップガイド](../getting-started/new-repository-setup.md#step-5-環境変数設定) を参照してください。

### 動作確認

セットアップ完了後、プロジェクト情報を確認します：

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# テスト機能で確認（オプション）
/kiro:spec-init テスト機能
/kiro:spec-requirements test-feature
npx @sk8metal/michi-cli phase:run test-feature requirements
```

## プロジェクト切り替え

### 現在のプロジェクトを確認

作業中のプロジェクトを確認するには：

```bash
# 現在のディレクトリを確認
pwd

# プロジェクト情報を表示
cat .kiro/project.json

# プロジェクトIDのみ表示
cat .kiro/project.json | grep projectId
```

### Cursorで切り替え

Cursor IDE内でプロジェクトを切り替える場合：

**対話式切り替え（推奨）**:
```
/kiro:project-switch
```

パラメータを指定しない場合、リポジトリ内のプロジェクトリストが表示され、対話的に選択できます：

```
📋 利用可能なプロジェクト:
1. 20240115-payment-api (プロジェクトA サービス1) [active]
2. 20240201-user-management (プロジェクトA サービス2) [active]
3. 20240310-analytics-api (プロジェクトB API) [active]

選択してください (1-3): 1

✅ プロジェクト切り替え: 20240115-payment-api
📁 ディレクトリ: projects/20240115-payment-api

プロジェクト情報:
  名前: プロジェクトA サービス1
  JIRA: PRJA
  Confluence Labels: project:20240115-payment-api, service:payment
  ステータス: active
```

**直接指定**:
```
/kiro:project-switch 20240115-payment-api
```

**実行内容**:
1. プロジェクトIDに対応するディレクトリを特定（`projects/20240115-payment-api`）
2. 該当ディレクトリに移動（Cursorの作業ディレクトリを変更）
3. `.kiro/project.json` を読み込んで表示
4. プロジェクト情報を表示

### ターミナルで切り替え

ターミナルでプロジェクトを切り替える場合：

```bash
# リポジトリルートに移動
cd /path/to/repository

# プロジェクトAに切り替え
cd projects/20240115-payment-api

# プロジェクト情報を確認
cat .kiro/project.json

# プロジェクトBに切り替え
cd ../20240310-analytics-api

# プロジェクト情報を確認
cat .kiro/project.json
```

**ショートカット**:
```bash
# プロジェクトディレクトリへのエイリアスを設定（.zshrc または .bashrc）
alias pj-a='cd /path/to/repository/projects/20240115-payment-api'
alias pj-b='cd /path/to/repository/projects/20240310-analytics-api'

# 使用例
pj-a
cat .kiro/project.json
```

### 切り替え後の確認

プロジェクト切り替え後、以下のコマンドで正しく切り替わったか確認：

```bash
# 現在のディレクトリを確認
pwd

# プロジェクト情報を表示
cat .kiro/project.json

# プロジェクトIDを確認
cat .kiro/project.json | jq .projectId

# 仕様書の一覧を確認
ls -la .kiro/specs/
```

### よくあるトラブル

#### プロジェクトが見つからない

**症状**: `/kiro:project-switch`でエラーが発生する

**原因と解決方法**:
1. プロジェクトディレクトリが存在するか確認
   ```bash
   ls -la projects/
   ```

2. プロジェクトIDが正しいか確認
   ```bash
   cat projects/20240115-payment-api/.kiro/project.json | grep projectId
   ```

3. パスが正しいか確認（絶対パスまたはリポジトリルートからの相対パス）

#### `.kiro/project.json`が見つからない

**症状**: プロジェクトディレクトリに移動したが、`.kiro/project.json`が存在しない

**解決方法**:
1. プロジェクトディレクトリが正しいか確認
2. `.kiro/project.json`を作成（[新規リポジトリセットアップガイド](../getting-started/new-repository-setup.md)を参照）

## プロジェクト横断操作

### すべてのプロジェクトを一覧表示

```bash
michi project:list
```

出力例：
```
📋 プロジェクト一覧:

| プロジェクト | ID | ステータス | JIRA | チーム |
|------------|-------|----------|------|--------|
| Michi | michi | active | MICHI | @developer1 |
| プロジェクトA サービス1 | 20240115-payment-api | active | PRJA | @dev1, @dev2 |
| プロジェクトB API | 20240310-analytics-api | active | PRJB | @dev3 |

合計: 3 プロジェクト
```

### リソースダッシュボード生成

```bash
michi project:dashboard
```

Confluenceに「プロジェクトリソースダッシュボード」ページを作成します。

### プロジェクト横断見積もり集計

```bash
npm run multi-estimate
```

すべてのプロジェクトの見積もりを集計し、Excelファイルに出力します。

## Confluenceダッシュボード

### プロジェクト一覧ページ

Confluenceで作成：

**ページタイトル**: プロジェクト一覧

**コンテンツ**:
```
{report-table:space=PRD|label=requirements|columns=title,labels,status}
```

**フィルタ例**:
- プロジェクトAのみ: `label = "project:20240115-payment-api"`
- レビュー待ち: `status = "レビュー待ち"`
- 設計フェーズ: `label = "design"`

### JIRAダッシュボード

**フィルタ**:
```
project IN (MICHI, PRJA, PRJB) AND status IN ("In Progress", "In Review")
```

**グルーピング**: プロジェクトキー別

**集計**: ストーリーポイント合計

## プロジェクト間の依存関係

プロジェクトは基本的に独立していますが、共通基盤がある場合：

### 共通ライブラリプロジェクト

```
shared-infrastructure/
└── .kiro/
    └── project.json
        {
          "projectId": "shared-infra",
          "projectName": "共通基盤",
          "jiraProjectKey": "INFRA",
          ...
        }
```

### 依存関係の記述

各プロジェクトの `.kiro/project.json` に追加：
```json
{
  "dependencies": ["shared-infra"],
  "dependents": ["20240115-payment-api", "20240310-analytics-api"]
}
```

## ベストプラクティス

### 命名規則の統一

**プロジェクトID**: `{YYYYMMDD}-{PJ名}`
- 例: `20240115-payment-api`, `20240201-user-management`
- 形式: `YYYYMMDD-{kebab-case-name}`
- 開始日はプロジェクト開始日（YYYYMMDD形式、ハイフンなし）
- プロジェクトディレクトリ名としても使用

**JIRA プロジェクトキー**: 3-4文字
- 例: `PRJA`, `PRJB`, `MICHI`

**Confluenceラベル**: `project:{projectId}, service:{service}`
- 例: `project:20240115-payment-api, service:payment`

**ラベル生成ロジック**: 詳細は [新規リポジトリセットアップガイド](../getting-started/new-repository-setup.md#ラベル生成ロジック) を参照してください。
### チーム構成の明確化

各プロジェクトの `team` フィールドに担当者を記載：
```json
{
  "team": ["@tech-lead", "@frontend-dev", "@backend-dev"]
}
```

### ステータス管理

プロジェクトのステータスを適切に更新：
- `active`: 開発中
- `maintenance`: 保守フェーズ
- `completed`: 完了
- `inactive`: 休止中

## トラブルシューティング

### プロジェクトが一覧に表示されない

`.kiro/project.json` が正しく作成されているか確認：
```bash
cat .kiro/project.json
```

### Confluenceで他のプロジェクトが見える

ラベルでフィルタリング：
```
label = "project:michi"
```

### JIRA チケットが混在

プロジェクトキーでフィルタリング：
```
project = MICHI
```

