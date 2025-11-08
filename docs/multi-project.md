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

#### Step 1: リポジトリ作成

```bash
# GitHub で新しいリポジトリを作成
gh repo create org/customer-a-service-1 --private

# ローカルにクローン
jj git clone https://github.com/org/customer-a-service-1
cd customer-a-service-1
```

#### Step 2: cc-sdd 導入

```bash
npx cc-sdd@latest --cursor --lang ja --yes
```

#### Step 3: プロジェクトメタデータ作成

`.kiro/project.json`:
```json
{
  "projectId": "customer-a-service-1",
  "projectName": "A社 サービス1",
  "jiraProjectKey": "PRJA",
  "confluenceLabels": ["project:customer-a-service-1", "service:s1"],
  "status": "active",
  "team": ["@dev1", "@dev2"],
  "stakeholders": ["@企画", "@部長"],
  "repository": "https://github.com/org/customer-a-service-1",
  "description": "A社向けサービス1の開発"
}
```

#### Step 4: 環境変数設定

```bash
npm run setup:env
# .env を編集して認証情報を設定
```

#### Step 5: 動作確認

```bash
# プロジェクト情報を表示
cat .kiro/project.json

# テスト機能で確認
/kiro:spec-init テスト機能
/kiro:spec-requirements test-feature
npm run confluence:sync test-feature
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

