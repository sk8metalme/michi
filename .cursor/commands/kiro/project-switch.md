---
name: /kiro:project-switch
description: プロジェクトを切り替える
---

# プロジェクト切り替えコマンド

1つのリポジトリ内で複数プロジェクトを管理している場合、プロジェクトを切り替えるコマンドです。

**1リポジトリ構成**:
- 各プロジェクトは`projects/`ディレクトリ配下に配置
- 各プロジェクトディレクトリに`.kiro/project.json`が存在
- プロジェクト切り替えは、該当ディレクトリに移動するだけ

## 使い方

### 対話式切り替え（推奨）

パラメータを指定しない場合、リポジトリ内のプロジェクトリストが表示され、対話的に選択できます：

```
/kiro:project-switch
```

**実行例**:
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

### 直接指定

プロジェクトIDを直接指定することもできます：

```
/kiro:project-switch <project_id>
```

**パラメータ**:
- `project_id`: プロジェクトID（例: `20240115-payment-api`, `michi`）

**例**:
```
/kiro:project-switch 20240115-payment-api
/kiro:project-switch michi
```

## 実行内容

1. プロジェクトIDに対応するディレクトリを特定（`projects/<project_id>`または`michi/`）
2. 該当ディレクトリに移動（Cursorの作業ディレクトリを変更）
3. `.kiro/project.json` を読み込んで表示
4. プロジェクト情報を表示
5. 対応するConfluenceプロジェクトページのURLを表示（該当する場合）
6. JIRAプロジェクトダッシュボードのURLを表示（該当する場合）

## 出力例

```
✅ プロジェクト切り替え: michi

プロジェクト情報:
  名前: Michi - Managed Intelligent Comprehensive Hub for Integration
  JIRA: MICHI
  Confluence Labels: project:michi, service:hub
  ステータス: active
  チーム: @arigatatsuya

リンク:
  📄 Confluence: https://your-domain.atlassian.net/wiki/spaces/PRD/pages/
  🎯 JIRA Dashboard: https://your-domain.atlassian.net/jira/projects/MICHI
  🐙 GitHub: https://github.com/sk8metalme/michi
```

## ターミナル実行

1リポジトリ構成では、プロジェクトディレクトリに直接移動します：

```bash
# リポジトリルートに移動
cd /path/to/repository

# プロジェクトディレクトリに移動
cd projects/20240115-payment-api

# プロジェクト情報を表示
cat .kiro/project.json
```

## 実装ロジック（対話式モード）

パラメータが指定されていない場合、以下の手順で対話式にプロジェクトを選択します：

1. **プロジェクトスキャン**: `projects/`ディレクトリ配下をスキャン
2. **プロジェクト検出**: `.kiro/project.json`が存在するディレクトリを検出
3. **情報読み込み**: 各プロジェクトの`.kiro/project.json`から以下を読み込み：
   - `projectId`: プロジェクトID
   - `projectName`: プロジェクト名
   - `status`: ステータス（active, maintenance, completed, inactive）
4. **リスト表示**: プロジェクトリストを番号付きで表示
5. **ユーザー選択**: ユーザーが番号で選択
6. **ディレクトリ移動**: 選択されたプロジェクトディレクトリに移動
7. **情報表示**: プロジェクト情報を表示

**スキャン対象**:
- `projects/`ディレクトリ配下のすべてのサブディレクトリ
- `.kiro/project.json`が存在するディレクトリのみをプロジェクトとして認識

**注意**: `michi/`ディレクトリ（統合ハブ）は、`.kiro/project.json`が存在する場合にプロジェクトとして認識されます。設定ファイルがない場合は統合ハブとして扱われ、個別プロジェクト一覧には表示されません。

## 関連コマンド

- `/kiro:project-list`: すべてのプロジェクトを一覧表示
- `/kiro:spec-status`: 現在のプロジェクトの仕様ステータスを表示

