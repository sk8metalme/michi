# 設定値リファレンス

このドキュメントでは、`.kiro/config.json`で設定可能なすべての設定値について説明します。

## 設定ファイルの場所

プロジェクトルートの `.kiro/config.json` に設定を記述します。

```json
{
  "confluence": { ... },
  "jira": { ... },
  "workflow": { ... }
}
```

## Confluence設定

### `confluence.pageCreationGranularity`

**型**: `'single' | 'by-section' | 'by-hierarchy' | 'manual'`  
**デフォルト**: `'single'`  
**必須**: いいえ

ページ作成の粒度を指定します。

- `'single'`: 1つのMarkdownファイルを1つのConfluenceページとして作成
- `'by-section'`: Markdownのセクションごとにページを作成
- `'by-hierarchy'`: 階層構造に基づいてページを作成（`hierarchy`設定が必要）
- `'manual'`: 手動で定義した構造に基づいてページを作成（`hierarchy.structure`設定が必要）

### `confluence.pageTitleFormat`

**型**: `string`  
**デフォルト**: `'[{projectName}] {featureName} {docTypeLabel}'`  
**必須**: いいえ

ページタイトルのフォーマットを指定します。以下のプレースホルダーが使用できます：

- `{projectName}`: プロジェクト名（`.kiro/project.json`から取得）
- `{featureName}`: 機能名
- `{docTypeLabel}`: ドキュメントタイプのラベル（要件定義、設計書、タスク）

### `confluence.autoLabels`

**型**: `string[]`  
**デフォルト**: `['{projectLabel}', '{docType}', '{featureName}', 'github-sync']`  
**必須**: いいえ

Confluenceページに自動的に付与するラベルのリスト。以下のプレースホルダーが使用できます：

- `{projectLabel}`: プロジェクトラベル（`project:michi`など）
- `{docType}`: ドキュメントタイプ（`requirements`, `design`, `tasks`）
- `{featureName}`: 機能名

### `confluence.spaces`

**型**: `{ requirements?: string, design?: string, tasks?: string }`  
**デフォルト**: 環境変数`CONFLUENCE_PRD_SPACE`、または`'PRD'`  
**必須**: いいえ（推奨）

各ドキュメントタイプをどのConfluenceスペースに作成するかを指定します。

```json
{
  "confluence": {
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    }
  }
}
```

**注意**: 設定されていない場合、環境変数`CONFLUENCE_PRD_SPACE`が使用されます。それもない場合は`'PRD'`がデフォルト値として使用されます。

### `confluence.hierarchy`

**型**: `{ mode?: 'simple' | 'nested', parentPageTitle?: string, createDocTypeParents?: boolean, structure?: object }`  
**デフォルト**: なし  
**必須**: `pageCreationGranularity`が`'by-hierarchy'`または`'manual'`の場合

階層構造の設定です。

#### `confluence.hierarchy.mode`

**型**: `'simple' | 'nested'`  
**デフォルト**: `'simple'`  
**必須**: いいえ

階層構造のモードを指定します。

- `'simple'`: シンプルな親子構造
- `'nested'`: ネストされた階層構造

#### `confluence.hierarchy.parentPageTitle`

**型**: `string`  
**デフォルト**: なし  
**必須**: `pageCreationGranularity`が`'by-hierarchy'`の場合（推奨）

親ページのタイトルフォーマットを指定します。プレースホルダーが使用できます：

- `{projectName}`: プロジェクト名
- `{featureName}`: 機能名

例: `"[{projectName}] {featureName}"`

#### `confluence.hierarchy.createDocTypeParents`

**型**: `boolean`  
**デフォルト**: `false`  
**必須**: いいえ

ドキュメントタイプごとの親ページを作成するかどうかを指定します。

#### `confluence.hierarchy.structure`

**型**: `object`  
**デフォルト**: なし  
**必須**: `pageCreationGranularity`が`'manual'`の場合

手動で定義した階層構造。詳細は実装を参照してください。

## JIRA設定

### `jira.storyCreationGranularity`

**型**: `'all' | 'by-phase' | 'selected-phases'`  
**デフォルト**: `'all'`  
**必須**: いいえ

ストーリー作成の粒度を指定します。

- `'all'`: すべてのフェーズのストーリーを作成
- `'by-phase'`: フェーズごとにストーリーを作成
- `'selected-phases'`: `selectedPhases`で指定したフェーズのみストーリーを作成

### `jira.createEpic`

**型**: `boolean`  
**デフォルト**: `true`  
**必須**: いいえ

Epicを作成するかどうかを指定します。

### `jira.storyPoints`

**型**: `'auto' | 'manual' | 'disabled'`  
**デフォルト**: `'auto'`  
**必須**: いいえ

ストーリーポイントの設定方法を指定します。

- `'auto'`: 自動計算
- `'manual'`: 手動設定（tasks.mdから取得）
- `'disabled'`: ストーリーポイントを設定しない

### `jira.autoLabels`

**型**: `string[]`  
**デフォルト**: `['{projectLabel}', '{featureName}', '{phaseLabel}']`  
**必須**: いいえ

JIRAチケットに自動的に付与するラベルのリスト。以下のプレースホルダーが使用できます：

- `{projectLabel}`: プロジェクトラベル（`project:michi`など）
- `{featureName}`: 機能名
- `{phaseLabel}`: フェーズラベル（`Requirements`, `Design`など）

### `jira.issueTypes`

**型**: `{ epic?: string, story?: string, subtask?: string }`  
**デフォルト**: `{ epic: 'Epic', story: null, subtask: null }`  
**必須**: いいえ（`story`は推奨）

JIRAのIssue Type IDを指定します。`story`と`subtask`は環境変数でも設定可能です：

- `JIRA_ISSUE_TYPE_STORY`: StoryのIssue Type ID
- `JIRA_ISSUE_TYPE_SUBTASK`: SubtaskのIssue Type ID

**注意**: `story`が設定されていない場合、環境変数`JIRA_ISSUE_TYPE_STORY`が使用されます。それもない場合はエラーになります。

**確認方法**:
- JIRA管理画面: Settings > Issues > Issue types
- REST API: `GET https://your-domain.atlassian.net/rest/api/3/issuetype`

### `jira.selectedPhases`

**型**: `string[]`  
**デフォルト**: なし  
**必須**: `storyCreationGranularity`が`'selected-phases'`の場合

ストーリーを作成するフェーズのリスト。例: `['Requirements', 'Design', 'Implementation']`

## ワークフロー設定

### `workflow.enabledPhases`

**型**: `string[]`  
**デフォルト**: `['requirements', 'design', 'tasks']`  
**必須**: いいえ

有効化するフェーズのリスト。有効な値: `'requirements'`, `'design'`, `'tasks'`

### `workflow.approvalGates`

**型**: `{ requirements?: string[], design?: string[], release?: string[] }`  
**デフォルト**: なし  
**必須**: いいえ

各フェーズの承認ゲートを指定します。承認者のロール名のリストを指定します。

例:
```json
{
  "workflow": {
    "approvalGates": {
      "requirements": ["leader", "director"],
      "design": ["leader", "director"],
      "release": ["service-manager", "director"]
    }
  }
}
```

## 環境変数による設定

一部の設定値は環境変数でも設定可能です。環境変数の設定は`.env`ファイルに記述します。

### Confluence関連

- `CONFLUENCE_PRD_SPACE`: Confluenceスペースキー（`confluence.spaces`のデフォルト値）
- `CONFLUENCE_BASE_URL`: ConfluenceのベースURL
- `CONFLUENCE_USERNAME`: Confluenceのユーザー名
- `CONFLUENCE_API_TOKEN`: ConfluenceのAPIトークン
- `ATLASSIAN_REQUEST_DELAY`: リクエスト間の遅延時間（ミリ秒）

### JIRA関連

- `JIRA_BASE_URL`: JIRAのベースURL
- `JIRA_USERNAME`: JIRAのユーザー名
- `JIRA_API_TOKEN`: JIRAのAPIトークン
- `JIRA_PROJECT_KEY`: JIRAプロジェクトキー（`.kiro/project.json`からも取得可能）
- `JIRA_ISSUE_TYPE_STORY`: StoryのIssue Type ID
- `JIRA_ISSUE_TYPE_SUBTASK`: SubtaskのIssue Type ID
- `JIRA_EPIC_LINK_FIELD`: Epic LinkカスタムフィールドID（例: `customfield_10014`）

## 設定の優先順位

設定値は以下の優先順位で決定されます：

1. **`spec.json`**: 機能固有の設定（最優先）
2. **`.kiro/config.json`**: プロジェクト固有の設定
3. **環境変数**: システム環境変数または`.env`ファイル
4. **デフォルト値**: スキーマで定義されたデフォルト値

## 設定例

### 最小構成

```json
{
  "confluence": {
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    }
  },
  "jira": {
    "issueTypes": {
      "story": "10036",
      "subtask": "10037"
    }
  }
}
```

### 完全な構成例

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "pageTitleFormat": "[{projectName}] {featureName} {docTypeLabel}",
    "autoLabels": ["{projectLabel}", "{docType}", "{featureName}", "github-sync"],
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    },
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}",
      "createDocTypeParents": false
    }
  },
  "jira": {
    "storyCreationGranularity": "all",
    "createEpic": true,
    "storyPoints": "auto",
    "autoLabels": ["{projectLabel}", "{featureName}", "{phaseLabel}"],
    "issueTypes": {
      "epic": "Epic",
      "story": "10036",
      "subtask": "10037"
    }
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"],
    "approvalGates": {
      "requirements": ["leader", "director"],
      "design": ["leader", "director"],
      "release": ["service-manager", "director"]
    }
  }
}
```

## バリデーション

設定ファイルは実行前に自動的にバリデーションされます。エラーがある場合は、実行前にエラーメッセージが表示されます。

バリデーションを手動で実行する場合：

```bash
tsx scripts/utils/config-validator.ts
```

## トラブルシューティング

### 設定値が反映されない

1. `.kiro/config.json`のJSON構文が正しいか確認
2. 設定ファイルのパスが正しいか確認（プロジェクトルートの`.kiro/config.json`）
3. 環境変数が設定されている場合、環境変数の優先順位を確認
4. `spec.json`に設定がある場合、`spec.json`が最優先であることを確認

### 必須設定値エラー

実行時に必須設定値が不足している場合、エラーメッセージに解決方法が表示されます。エラーメッセージに従って設定を追加してください。

### デフォルト値の確認

各設定値のデフォルト値は、このドキュメントの各セクションに記載されています。また、`scripts/config/config-schema.ts`のスキーマ定義も参照してください。

