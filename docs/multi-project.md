# マルチプロジェクト管理ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

Michiは、複数プロジェクト（3-5案件）を同時並行で管理できるように設計されています。

## アーキテクチャ

### マイクロサービス構成

```
organization/
├── customer-a-service-1/  ← A社 サービス1
│   └── .kiro/
│       ├── project.json
│       └── specs/
├── customer-a-service-2/  ← A社 サービス2
│   └── .kiro/
├── customer-b-api/        ← B社 API
│   └── .kiro/
└── michi/                 ← 統合ハブ（本プロジェクト）
    └── .kiro/
```

### 統合管理

**Confluence**: 共有スペース（PRD, QA, RELEASE）
- ラベルでプロジェクトを識別
- プロジェクト横断ダッシュボード

**JIRA**: プロジェクトキー別
- PRJA（A社案件）
- PRJB（B社案件）
- MICHI（統合ハブ）

## プロジェクトのセットアップ

### 新規プロジェクト追加

詳細な手順は [新規プロジェクトセットアップガイド](./new-project-setup.md) を参照してください。

**クイックスタート**:
1. 既存リポジトリに追加: `bash /path/to/michi/scripts/setup-existing.sh`
2. 新規リポジトリ作成: `npm run create-project -- --name <id> --project-name <name> --jira-key <key>`

**マルチプロジェクト特有の注意点**:
- 各プロジェクトは独立したリポジトリで管理
- `.kiro/project.json`でプロジェクトを識別
- Confluenceラベルでプロジェクト横断検索が可能

### 環境変数設定

各プロジェクトで`.env`ファイルを設定します。詳細は [新規プロジェクトセットアップガイド](./new-project-setup.md#step-5-環境変数設定) を参照してください。

### 動作確認

セットアップ完了後、プロジェクト情報を確認します：

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# テスト機能で確認（オプション）
/kiro:spec-init テスト機能
/kiro:spec-requirements test-feature
npx @michi/cli phase:run test-feature requirements
```

## プロジェクト切り替え

### Cursorで切り替え

```
/kiro:project-switch customer-a-service-1
```

### ターミナルで切り替え

```bash
cd ~/work/projects/customer-a-service-1
cat .kiro/project.json
```

## プロジェクト横断操作

### すべてのプロジェクトを一覧表示

```bash
npm run project:list
```

出力例：
```
📋 プロジェクト一覧:

| プロジェクト | ID | ステータス | JIRA | チーム |
|------------|-------|----------|------|--------|
| Michi | michi | active | MICHI | @developer1 |
| A社 サービス1 | customer-a-service-1 | active | PRJA | @dev1, @dev2 |
| B社 API | customer-b-api | active | PRJB | @dev3 |

合計: 3 プロジェクト
```

### リソースダッシュボード生成

```bash
npm run project:dashboard
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
- A社案件のみ: `label = "project:a"`
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
  "dependents": ["customer-a-service-1", "customer-b-api"]
}
```

## ベストプラクティス

### 命名規則の統一

**プロジェクトID**: `customer-{id}-{service}`
- 例: `customer-a-service-1`, `customer-b-api`

**JIRA プロジェクトキー**: 3-4文字
- 例: `PRJA`, `PRJB`, `MICHI`

**Confluenceラベル**: `project:{projectId}, service:{service}`
- 例: `project:customer-a-service-1, service:s1`

**ラベル生成ロジック**: 詳細は [新規プロジェクトセットアップガイド](./new-project-setup.md#ラベル生成ロジック) を参照してください。
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

