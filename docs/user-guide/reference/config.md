# 設定値リファレンス

このドキュメントでは、`.michi/config.json`で設定可能なすべての設定値について説明します。

## 設定ファイルの場所

Michiの設定ファイルは以下の2つの場所に配置できます：

### グローバル設定

**場所**: `~/.michi/config.json`

**用途**: 全プロジェクトで共通の設定（組織標準の設定など）

**作成方法**: `npm run config:global` コマンドを使用

### プロジェクト固有設定

**場所**: プロジェクトルートの `.michi/config.json`

**用途**: プロジェクト固有の設定（グローバル設定を上書き）

**作成方法**:
- 自動作成: `michi init` コマンド実行時にグローバル設定から自動コピー
- 手動作成: グローバル設定（`~/.michi/config.json`）をコピーして編集

**注意**: 以前は `.kiro/config.json` を使用していましたが、Michi専用の設定ファイルとして `.michi/config.json` に変更されました。`.kiro/config.json` が存在する場合は警告が表示されます。

### 設定ファイルのフォーマット

```json
{
  "confluence": { ... },
  "jira": { ... },
  "workflow": { ... }
}
```

## Confluence設定

| 設定項目                             | 型                                                                                                              | デフォルト                                                        | 必須                                                              | 説明                                                           | 値の説明                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confluence.pageCreationGranularity` | `'single' \| 'by-section' \| 'by-hierarchy' \| 'manual'`                                                        | `'single'`                                                        | いいえ                                                            | ページ作成の粒度を指定                                         | `'single'`: 1つのMarkdownファイルを1つのConfluenceページとして作成<br>`'by-section'`: Markdownのセクションごとにページを作成<br>`'by-hierarchy'`: 階層構造に基づいてページを作成（`hierarchy`設定が必要）<br>`'manual'`: 手動で定義した構造に基づいてページを作成（`hierarchy.structure`設定が必要） |
| `confluence.pageTitleFormat`         | `string`                                                                                                        | `'[{projectName}] {featureName} {docTypeLabel}'`                  | いいえ                                                            | ページタイトルのフォーマットを指定                             | プレースホルダー: `{projectName}`（プロジェクト名）、`{featureName}`（機能名）、`{docTypeLabel}`（ドキュメントタイプのラベル）                                                                                                                                                                       |
| `confluence.autoLabels`              | `string[]`                                                                                                      | `['{projectLabel}', '{docType}', '{featureName}', 'github-sync']` | いいえ                                                            | Confluenceページに自動的に付与するラベルのリスト               | プレースホルダー: `{projectLabel}`（プロジェクトラベル）、`{docType}`（ドキュメントタイプ）、`{featureName}`（機能名）                                                                                                                                                                               |
| `confluence.spaces`                  | `{ requirements?: string, design?: string, tasks?: string }`                                                    | 環境変数`CONFLUENCE_PRD_SPACE`、または`'PRD'`                     | いいえ（推奨）                                                    | 各ドキュメントタイプをどのConfluenceスペースに作成するかを指定 | `requirements`: 要件定義用スペース<br>`design`: 設計用スペース<br>`tasks`: タスク用スペース                                                                                                                                                                                                          |
| `confluence.hierarchy`               | `{ mode?: 'simple' \| 'nested', parentPageTitle?: string, createDocTypeParents?: boolean, structure?: object }` | なし                                                              | `pageCreationGranularity`が`'by-hierarchy'`または`'manual'`の場合 | 階層構造の設定                                                 | 詳細は下記の子項目を参照                                                                                                                                                                                                                                                                             |

### `confluence.spaces` の設定例

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

### `confluence.hierarchy` の子項目

| 設定項目                                    | 型                     | デフォルト | 必須                                                      | 説明                                                     | 値の説明                                                                                                                |
| ------------------------------------------- | ---------------------- | ---------- | --------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `confluence.hierarchy.mode`                 | `'simple' \| 'nested'` | `'simple'` | いいえ                                                    | 階層構造のモードを指定                                   | `'simple'`: シンプルな親子構造<br>`'nested'`: ネストされた階層構造                                                      |
| `confluence.hierarchy.parentPageTitle`      | `string`               | なし       | `pageCreationGranularity`が`'by-hierarchy'`の場合（推奨） | 親ページのタイトルフォーマットを指定                     | プレースホルダー: `{projectName}`（プロジェクト名）、`{featureName}`（機能名）<br>例: `"[{projectName}] {featureName}"` |
| `confluence.hierarchy.createDocTypeParents` | `boolean`              | `false`    | いいえ                                                    | ドキュメントタイプごとの親ページを作成するかどうかを指定 | `true`: 作成する<br>`false`: 作成しない                                                                                 |
| `confluence.hierarchy.structure`            | `object`               | なし       | `pageCreationGranularity`が`'manual'`の場合               | 手動で定義した階層構造                                   | 詳細は実装を参照してください                                                                                            |

## JIRA設定

| 設定項目                        | 型                                                    | デフォルト                                                          | 必須                                                  | 説明                                                                         | 値の説明                                                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jira.storyCreationGranularity` | `'all' \| 'by-phase' \| 'selected-phases'`            | `'all'`                                                             | いいえ                                                | ストーリー作成の粒度を指定                                                   | `'all'`: すべてのフェーズのストーリーを作成<br>`'by-phase'`: フェーズごとにストーリーを作成<br>`'selected-phases'`: `selectedPhases`で指定したフェーズのみストーリーを作成                        |
| `jira.createEpic`               | `boolean`                                             | `true`                                                              | いいえ                                                | Epicを作成するかどうかを指定                                                 | `true`: Epicを作成<br>`false`: Epicを作成しない                                                                                                                                                   |
| `jira.storyPoints`              | `'auto' \| 'manual' \| 'disabled'`                    | `'auto'`                                                            | いいえ                                                | ストーリーポイントの設定方法を指定                                           | `'auto'`: 自動計算<br>`'manual'`: 手動設定（tasks.mdから取得）<br>`'disabled'`: ストーリーポイントを設定しない                                                                                    |
| `jira.autoLabels`               | `string[]`                                            | `['{projectLabel}', '{featureName}', '{phaseLabel}']`               | いいえ                                                | JIRAチケットに自動的に付与するラベルのリスト                                 | プレースホルダー: `{projectLabel}`（プロジェクトラベル）、`{featureName}`（機能名）、`{phaseLabel}`（フェーズラベル）                                                                             |
| `jira.issueTypes`               | `{ epic?: string, story?: string, subtask?: string }` | `{ epic: 'Epic', story: null, subtask: null }`                      | いいえ（`story`は推奨）                               | JIRAのIssue Type IDを指定                                                    | `epic`: EpicのIssue Type ID<br>`story`: StoryのIssue Type ID（環境変数`JIRA_ISSUE_TYPE_STORY`でも設定可能）<br>`subtask`: SubtaskのIssue Type ID（環境変数`JIRA_ISSUE_TYPE_SUBTASK`でも設定可能） |
| `jira.selectedPhases`           | `string[]`                                            | なし                                                                | `storyCreationGranularity`が`'selected-phases'`の場合 | ストーリーを作成するフェーズのリスト                                         | 例: `['Requirements', 'Design', 'Implementation']`                                                                                                                                                |
| `jira.statusMapping`            | `{ inProgress?: string, readyForReview?: string }`    | `{ inProgress: 'In Progress', readyForReview: 'Ready for Review' }` | いいえ                                                | `spec-impl:start`/`spec-impl:complete`で使用するJIRAステータス名のマッピング | プロジェクトのJIRAワークフローに合わせてカスタマイズ可能                                                                                                                                          |

### `jira.issueTypes` の詳細

**注意**: `story`が設定されていない場合、環境変数`JIRA_ISSUE_TYPE_STORY`が使用されます。それもない場合はエラーになります。

**確認方法**:

- JIRA管理画面: Settings > Issues > Issue types
- REST API: `GET https://your-domain.atlassian.net/rest/api/3/issuetype`

## ワークフロー設定

| 設定項目                 | 型                                                                   | デフォルト                            | 必須   | 説明                         | 値の説明                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------- | ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflow.enabledPhases` | `string[]`                                                           | `['requirements', 'design', 'tasks']` | いいえ | 有効化するフェーズのリスト   | 有効な値: `'requirements'`, `'design'`, `'tasks'`                                                                                                   |
| `workflow.approvalGates` | `{ requirements?: string[], design?: string[], release?: string[] }` | なし                                  | いいえ | 各フェーズの承認ゲートを指定 | 承認者のロール名のリストを指定<br>`requirements`: 要件定義フェーズの承認者<br>`design`: 設計フェーズの承認者<br>`release`: リリースフェーズの承認者 |

### `workflow.approvalGates` の設定例

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

### Atlassian共通設定

| 環境変数名                | 対応する設定項目 | 説明                                                | デフォルト |
| ------------------------- | ---------------- | --------------------------------------------------- | ---------- |
| `ATLASSIAN_REQUEST_DELAY` | -                | Confluence/JIRA APIリクエスト間の遅延時間（ミリ秒） | `500`      |

### Confluence関連

| 環境変数名             | 対応する設定項目    | 説明                                                        | デフォルト |
| ---------------------- | ------------------- | ----------------------------------------------------------- | ---------- |
| `CONFLUENCE_PRD_SPACE` | `confluence.spaces` | Confluenceスペースキー（`confluence.spaces`のデフォルト値） | `'PRD'`    |
| `CONFLUENCE_BASE_URL`  | -                   | ConfluenceのベースURL                                       | なし       |
| `CONFLUENCE_USERNAME`  | -                   | Confluenceのユーザー名                                      | なし       |
| `CONFLUENCE_API_TOKEN` | -                   | ConfluenceのAPIトークン                                     | なし       |

### JIRA関連

| 環境変数名                | 対応する設定項目          | 説明                                                       | デフォルト |
| ------------------------- | ------------------------- | ---------------------------------------------------------- | ---------- |
| `JIRA_BASE_URL`           | -                         | JIRAのベースURL                                            | なし       |
| `JIRA_USERNAME`           | -                         | JIRAのユーザー名                                           | なし       |
| `JIRA_API_TOKEN`          | -                         | JIRAのAPIトークン                                          | なし       |
| `JIRA_PROJECT_KEY`        | -                         | JIRAプロジェクトキー（`.kiro/project.json`からも取得可能） | なし       |
| `JIRA_ISSUE_TYPE_STORY`   | `jira.issueTypes.story`   | StoryのIssue Type ID                                       | なし       |
| `JIRA_ISSUE_TYPE_SUBTASK` | `jira.issueTypes.subtask` | SubtaskのIssue Type ID                                     | なし       |
| `JIRA_EPIC_LINK_FIELD`    | -                         | Epic LinkカスタムフィールドID（例: `customfield_10014`）   | なし       |

## 設定の優先順位

設定値は以下の優先順位で決定されます：

1. **`spec.json`**: 機能固有の設定（最優先）
2. **`.michi/config.json`**: プロジェクト固有の設定
3. **`~/.michi/config.json`**: グローバル設定
4. **環境変数**: システム環境変数または`.env`ファイル
5. **デフォルト値**: スキーマで定義されたデフォルト値

**推奨される使い方**:
- **グローバル設定（`~/.michi/config.json`）**: 組織全体で共通の設定（Confluence階層構造、JIRA Story作成粒度など）
- **プロジェクト設定（`.michi/config.json`）**: プロジェクト固有の設定（特定プロジェクトのみカスタマイズが必要な場合）

## 設定例

### パターン1: 最小構成（シンプル）

最小限の設定で動作させる場合：

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

**特徴**:

- Confluenceスペースのみ指定
- JIRA Issue Type IDのみ指定
- その他はデフォルト値を使用

**使用場面**:

- 小規模プロジェクト
- デフォルト動作で十分な場合

### パターン2: 標準構成（推奨）

一般的なプロジェクトで推奨される設定：

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    },
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto",
    "issueTypes": {
      "story": "1",
      "subtask": "2"
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

**特徴**:

- Confluence階層構造を使用
- JIRA Epicを自動作成
- ワークフロー承認ゲートを設定

**使用場面**:

- 中規模以上のプロジェクト
- 承認フローが必要な場合
- チーム開発

### パターン3: 完全な構成（高度）

すべての設定を明示的に指定する場合：

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "pageTitleFormat": "[{projectName}] {featureName} {docTypeLabel}",
    "autoLabels": [
      "{projectLabel}",
      "{docType}",
      "{featureName}",
      "github-sync"
    ],
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
      "story": "1",
      "subtask": "2"
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

**特徴**:

- すべての設定値を明示
- カスタムラベルとタイトルフォーマット
- 詳細なワークフロー設定

**使用場面**:

- 大規模プロジェクト
- 複雑な承認フローが必要な場合
- カスタマイズ要件が多い場合

### 実際のプロジェクト例: michi-practice1

実際のプロジェクト（`michi-practice1`）で使用されている設定：

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    },
    "spaces": {
      "requirements": "Michi",
      "design": "Michi",
      "tasks": "Michi"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto",
    "issueTypes": {
      "story": "1",
      "subtask": "2"
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

**説明**:

- Confluence階層構造を使用して、機能ごとに親ページを作成
- JIRA Epicを自動作成し、すべてのフェーズのストーリーを作成
- ワークフロー承認ゲートを設定して、各フェーズで承認が必要

**参考**: この設定は`michi-practice1`プロジェクトで実際に使用されています。

## バリデーション

設定ファイルは実行前に自動的にバリデーションされます。エラーがある場合は、実行前にエラーメッセージが表示されます。

バリデーションを手動で実行する場合：

```bash
# 推奨: michiコマンド経由
michi config:validate

# または、npx経由
npx tsx scripts/utils/config-validator.ts
```

## トラブルシューティング

### 設定値が反映されない

**症状**: 設定ファイルを変更したが、動作が変わらない

**原因と解決方法**:

1. **JSON構文エラー**
   - `.michi/config.json`のJSON構文が正しいか確認
   - JSONバリデーターを使用: `npx tsx scripts/utils/config-validator.ts`
   - よくあるエラー: 末尾のカンマ、引用符の不一致

2. **設定ファイルのパスが間違っている**
   - 設定ファイルのパスが正しいか確認（プロジェクトルートの`.michi/config.json`）
   - 現在のディレクトリを確認: `pwd`
   - 設定ファイルの存在確認: `ls -la .michi/config.json`

3. **優先順位の問題**
   - 環境変数が設定されている場合、環境変数の優先順位を確認
   - `spec.json`に設定がある場合、`spec.json`が最優先であることを確認
   - 設定の優先順位: `spec.json` > `.michi/config.json` > `~/.michi/config.json` > 環境変数 > デフォルト値

4. **設定ファイルの読み込みエラー**
   - 設定ファイルの権限を確認: `chmod 644 .michi/config.json`
   - ファイルエンコーディングを確認（UTF-8推奨）

### 必須設定値エラー

**症状**: 実行時に「設定値が不足しています」というエラーが表示される

**よくあるエラーケース**:

#### エラー1: `jira.issueTypes.story`が設定されていません

**エラーメッセージ例**:

```
❌ Configuration errors:
   jira.issueTypes.storyが設定されていません。環境変数JIRA_ISSUE_TYPE_STORYも設定されていないため、JIRA同期を実行できません。
```

**解決方法**:

1. `.michi/config.json`に以下を追加:

```json
{
  "jira": {
    "issueTypes": {
      "story": "10036"
    }
  }
}
```

2. または、環境変数を設定:

```bash
export JIRA_ISSUE_TYPE_STORY=10036
```

3. Issue Type IDの確認方法:
   - JIRA管理画面: Settings > Issues > Issue types
   - REST API: `GET https://your-domain.atlassian.net/rest/api/3/issuetype`

#### エラー2: `confluence.hierarchy`が設定されていません

**エラーメッセージ例**:

```
❌ Configuration errors:
   confluence.hierarchyが設定されていません。pageCreationGranularityが"by-hierarchy"の場合、hierarchy設定が必須です。
```

**解決方法**:
`.michi/config.json`に以下を追加:

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  }
}
```

または、`pageCreationGranularity`を`"single"`に変更:

```json
{
  "confluence": {
    "pageCreationGranularity": "single"
  }
}
```

#### エラー3: `confluence.spaces.requirements`が設定されていません

**エラーメッセージ例**:

```
⚠️  Warnings:
   confluence.spaces.requirementsが設定されていません。環境変数CONFLUENCE_PRD_SPACEも設定されていないため、デフォルト値（PRD）を使用します。
```

**解決方法**:

1. `.michi/config.json`に以下を追加:

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

2. または、環境変数を設定:

```bash
export CONFLUENCE_PRD_SPACE=Michi
```

### バリデーションエラー

**症状**: バリデーション実行時にエラーが表示される

**よくあるエラーケース**:

#### エラー1: JSON構文エラー

**エラーメッセージ例**:

```
❌ Validation errors:
   Invalid JSON: Unexpected token } in JSON at position 123
```

**解決方法**:

- JSON構文を確認
- 末尾のカンマを削除
- 引用符を統一（ダブルクォートを使用）

#### エラー2: スキーマバリデーションエラー

**エラーメッセージ例**:

```
❌ Validation errors:
   confluence.pageCreationGranularity: Invalid enum value. Expected 'single' | 'by-section' | 'by-hierarchy' | 'manual', received 'invalid-value'
```

**解決方法**:

- 設定値が有効な値か確認
- このドキュメントの各設定値の説明を参照
- デフォルト値を使用する場合は設定を削除

### 設定値の優先順位が不明確

**症状**: どの設定値が使用されているかわからない

**確認方法**:

1. **バリデーション実行時のログを確認**
   - Confluence同期時: `📌 Using Confluence space: Michi (source: config.json)`
   - JIRA同期時: 設定値のソースが表示される

2. **設定ファイルの優先順位を理解**
   - `spec.json` > `.michi/config.json` > `~/.michi/config.json` > 環境変数 > デフォルト値
   - 同じ設定値が複数箇所にある場合、優先順位の高いものが使用される

3. **デバッグ方法**

   ```bash
   # 設定値を確認
   npx tsx scripts/utils/config-validator.ts

   # 実際の設定値を表示（開発用）
   # scripts/utils/config-loader.ts を参照
   ```

### デフォルト値の確認

各設定値のデフォルト値は、このドキュメントの各セクションに記載されています。また、`scripts/config/config-schema.ts`のスキーマ定義も参照してください。

### よくある質問

**Q: 設定ファイルを変更したが、変更が反映されない**

A: 以下の順序で確認してください：

1. JSON構文が正しいか確認
2. 設定ファイルのパスが正しいか確認
3. 優先順位を確認（`spec.json`が最優先）
4. バリデーションを実行してエラーがないか確認

**Q: 環境変数と`config.json`のどちらを優先すべきか**

A: プロジェクト固有の設定は`config.json`に、個人固有の設定は環境変数に設定することを推奨します。`config.json`の方が優先順位が高いため、プロジェクト全体で統一された設定を維持できます。

**Q: `spec.json`と`config.json`の違いは何か**

A:

- `spec.json`: 機能固有の設定（`.kiro/specs/<feature>/spec.json`）
- `config.json`: プロジェクト全体の設定（`.michi/config.json`）
- `spec.json`が最優先で、機能ごとに異なる設定が可能

**Q: 設定ファイルをGitで管理すべきか**

A:

- `.michi/config.json`: チーム固有設定のため、`.gitignore`に追加することを推奨
- `spec.json`: 機能仕様の一部のため、Gitで管理することを推奨
