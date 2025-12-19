# Michi 設定統合設計書 - 現状分析と問題点

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft echo **親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 2. 現状分析

### 2.1 現在の3つのコマンド

#### 2.1.1 `michi init` (新規プロジェクト用)

**対話的に取得する情報:**
- `projectId`: プロジェクトID
- `projectName`: プロジェクト名
- `jiraKey`: JIRAプロジェクトキー
- `environment`: 開発環境 (cursor/claude/gemini/codex/cline)
- `langCode`: ドキュメント言語 (ja/en)

**作成するファイル:**
- `.kiro/project.json`: プロジェクトメタデータ
- `.env`: 環境変数（テンプレート）
- `.michi/config.json`: ワークフロー設定（グローバル設定から自動コピーまたは対話的作成）
- テンプレート/ルール (--michi-path 指定時)

**動作フロー:**
```
[開始]
  ↓
[環境を決定] (cursor/claude/etc)
  ↓
[対話的プロンプト] (projectId, projectName, jiraKey)
  ↓
[確認]
  ↓
[.kiro/ ディレクトリ作成]
  ↓
[.kiro/project.json 作成]
  ↓
[.env テンプレート作成]
  ↓
[テンプレート/ルールコピー] (--michi-path 指定時)
  ↓
[ワークフロー設定] (.michi/config.json)
  ├─ グローバル設定がある場合: 自動コピー
  └─ グローバル設定がない場合: 対話的作成 or デフォルト設定
  ↓
[完了]
```

#### 2.1.2 `npx @sk8metal/michi-cli setup-existing` (既存プロジェクト用)

**対話的に取得する情報:**
- `projectName`: プロジェクト名
- `jiraKey`: JIRAプロジェクトキー
- `environment`: 開発環境
- `langCode`: ドキュメント言語

**作成するファイル:**
- `.kiro/project.json`: プロジェクトメタデータ
- `.env`: 環境変数（対話的設定またはテンプレート）
- テンプレート/ルール
- スキル/サブエージェント (Claude環境の場合)

**動作フロー:**
```
[開始]
  ↓
[環境を決定]
  ↓
[対話的プロンプト] (projectName, jiraKey)
  ↓
[確認]
  ↓
[.kiro/ ディレクトリ作成]
  ↓
[.kiro/project.json 作成]
  ↓
[Codex環境の場合]
  └─ cc-sdd インストールプロンプト
  ↓
[テンプレート/ルールコピー]
  ├─ 環境別テンプレート
  ├─ Steeringテンプレート
  ├─ Specテンプレート
  └─ cc-sdd オーバーライド
  ↓
[.env 対話的設定]
  ├─ 既存の .env がある場合: 上書き確認
  └─ 新規の場合: 対話的設定 or テンプレート作成
  ↓
[.gitignore 更新]
  ↓
[スキル/サブエージェントインストール] (Claude環境)
  ↓
[バリデーション]
  ↓
[完了]
```

#### 2.1.3 `npm run config:global` (グローバル設定)

**対話的に取得する情報:**
- Confluence設定
  - `pageCreationGranularity`: ページ作成粒度
  - `pageTitleFormat`: ページタイトル形式 (optional)
  - `hierarchy`: 階層構造設定 (optional)
- JIRA設定
  - `createEpic`: Epic作成有無
  - `storyCreationGranularity`: Story作成粒度
  - `selectedPhases`: 選択フェーズ (optional)
  - `storyPoints`: Story Points設定
- ワークフロー設定
  - `enabledPhases`: 有効フェーズ
  - `approvalGates`: 承認ゲート (optional)

**作成するファイル:**
- `~/.michi/config.json`: グローバル設定

**動作フロー:**
```
[開始]
  ↓
[既存のグローバル設定を確認]
  ├─ 存在する場合: 上書き確認
  └─ 存在しない場合: 新規作成
  ↓
[対話的に設定を取得]
  ├─ Confluence設定をカスタマイズするか？
  ├─ JIRA設定をカスタマイズするか？
  └─ ワークフロー設定をカスタマイズするか？
  ↓
[設定内容の確認表示]
  ↓
[保存確認]
  ↓
[~/.michi/ディレクトリ作成]
  ↓
[~/.michi/config.json 保存]
  ↓
[バリデーション]
  ↓
[完了]
```

### 2.2 設定ファイルと設定項目

#### 2.2.1 設定ファイルの一覧

| ファイル | パス | 役割 | 作成コマンド |
|---------|------|------|------------|
| **グローバル設定** | `~/.michi/config.json` | Confluence/JIRA/ワークフロー設定 | `config:global` |
| **プロジェクト設定** | `.michi/config.json` | プロジェクト固有のオーバーライド | `init` (optional) |
| **プロジェクトメタデータ** | `.kiro/project.json` | プロジェクトID、名前、JIRA キーなど | `init`, `setup-existing` |
| **環境変数** | `.env` | 認証情報、プロジェクト固有の環境変数 | `init`, `setup-existing` |

#### 2.2.2 設定項目の完全一覧 (51項目)

**A. ~/.michi/config.json (15項目)**

| 項目 | 型 | 必須 | デフォルト | 説明 |
|------|-----|------|-----------|------|
| `confluence.pageCreationGranularity` | enum | No | `'single'` | ページ作成粒度 (`'single'` \| `'by-section'` \| `'by-hierarchy'` \| `'manual'`) |
| `confluence.pageTitleFormat` | string | No | - | ページタイトル形式 (例: `{projectName} - {featureName}`) |
| `confluence.hierarchy.mode` | enum | No | - | 階層モード (`'simple'` \| `'nested'`) |
| `confluence.hierarchy.parentPageTitle` | string | No | - | 親ページタイトル形式 |
| `confluence.hierarchy.structure` | object | No | - | カスタム階層構造 |
| `jira.createEpic` | boolean | No | `true` | Epic作成有無 |
| `jira.storyCreationGranularity` | enum | No | `'all'` | Story作成粒度 (`'all'` \| `'by-phase'` \| `'selected-phases'`) |
| `jira.selectedPhases` | array | No | - | 選択フェーズ（`storyCreationGranularity='selected-phases'` の場合） |
| `jira.storyPoints` | enum | No | `'auto'` | Story Points設定 (`'auto'` \| `'manual'` \| `'disabled'`) |
| `workflow.enabledPhases` | array | Yes | `['requirements', 'design', 'tasks']` | 有効フェーズ |
| `workflow.approvalGates.requirements` | array | No | - | 要件定義フェーズの承認者 |
| `workflow.approvalGates.design` | array | No | - | 設計フェーズの承認者 |
| `workflow.approvalGates.release` | array | No | - | リリースフェーズの承認者 |

**B. .kiro/project.json (10項目)**

| 項目 | 型 | 必須 | 例 | 説明 |
|------|-----|------|-----|------|
| `projectId` | string | Yes | `'my-project'` | プロジェクトID |
| `projectName` | string | Yes | `'マイプロジェクト'` | プロジェクト名 |
| `language` | enum | Yes | `'ja'` | ドキュメント言語 (`'ja'` \| `'en'`) |
| `jiraProjectKey` | string | Yes | `'MYPRJ'` | JIRAプロジェクトキー |
| `confluenceLabels` | array | Yes | `['project:my-project']` | Confluenceラベル |
| `status` | string | Yes | `'active'` | プロジェクトステータス |
| `team` | array | No | `[]` | チームメンバー |
| `stakeholders` | array | No | `['@企画', '@部長']` | ステークホルダー |
| `repository` | string | Yes | `'https://github.com/org/repo'` | リポジトリURL |
| `description` | string | Yes | `'プロジェクトの説明'` | プロジェクト説明 |

**C. .env (11項目)**

| 項目 | 型 | 必須 | 例 | 説明 | スコープ |
|------|-----|------|-----|------|----------|
| `ATLASSIAN_URL` | string | Yes | `'https://org.atlassian.net'` | AtlassianベースURL | 組織 |
| `ATLASSIAN_EMAIL` | string | Yes | `'user@company.com'` | Atlassian認証用メールアドレス | 組織 |
| `ATLASSIAN_API_TOKEN` | string | Yes | `'token123'` | Atlassian APIトークン | 組織 |
| `GITHUB_ORG` | string | Yes | `'my-org'` | GitHub組織名 | 組織 |
| `GITHUB_TOKEN` | string | Yes | `'ghp_xxx'` | GitHubアクセストークン | 組織 |
| `CONFLUENCE_PRD_SPACE` | string | No | `'PRD'` | 要件定義書スペース | 組織 |
| `CONFLUENCE_QA_SPACE` | string | No | `'QA'` | テスト仕様書スペース | 組織 |
| `CONFLUENCE_RELEASE_SPACE` | string | No | `'RELEASE'` | リリースノートスペース | 組織 |
| `JIRA_PROJECT_KEYS` | string | Yes | `'MYPRJ'` | JIRAプロジェクトキー | プロジェクト |
| `JIRA_ISSUE_TYPE_STORY` | string | Yes | `'10036'` | Story Issue Type ID | 組織 |
| `JIRA_ISSUE_TYPE_SUBTASK` | string | Yes | `'10037'` | Subtask Issue Type ID | 組織 |

**注**: `GITHUB_REPO` は削除されました。リポジトリ情報は `.kiro/project.json` の `repository` フィールドから自動的に抽出されます。

### 2.3 データフロー図

**現状のデータフロー:**

```
[ユーザー入力]
  ├─ config:global
  │   └─ ~/.michi/config.json (Confluence/JIRA/ワークフロー設定)
  │
  ├─ init / setup-existing
  │   ├─ .kiro/project.json (プロジェクトメタデータ)
  │   ├─ .env (全環境変数)
  │   └─ .michi/config.json (プロジェクト固有設定、optional)
  │
  └─ [既存の.envを手動編集]

[設定の読み込み]
  ├─ スクリプト実行時
  │   ├─ dotenv.config() で .env を読み込み
  │   ├─ .michi/config.json を読み込み (存在する場合)
  │   └─ ~/.michi/config.json を読み込み (存在する場合)
  │
  └─ 優先順位が不明確（明示的なマージロジックなし）
```

**問題点:**
1. グローバル設定の自動読み込みがない
2. 設定の優先順位が不明確
3. .env に組織レベルの設定が分散
4. 各スクリプトが独自に設定を読み込み（一元化されていない）

---

## 3. 問題点の特定

### 3.1 重複する対話的プロンプト

**現状:**
- `init` と `setup-existing` の両方で、以下の情報を対話的に取得:
  - `projectName`
  - `jiraKey`
  - `environment`
  - `langCode`

**問題:**
- ユーザー体験の低下（同じ情報を複数回入力）
- コードの重複（同じプロンプトロジックが2箇所に存在）
- 保守性の低下（変更時に2箇所を修正する必要）

**影響範囲:**
- src/commands/init.ts:195-242
- src/commands/setup-existing.ts:180-229

### 3.2 グローバル化できる項目の分散

**現状:**
`.env` ファイルに以下の組織レベルの設定が含まれている:

| 項目 | スコープ | 変更頻度 |
|------|----------|----------|
| `ATLASSIAN_URL` | 組織 | 低 |
| `ATLASSIAN_EMAIL` | 組織/ユーザー | 低 |
| `ATLASSIAN_API_TOKEN` | 組織/ユーザー | 低 |
| `GITHUB_ORG` | 組織 | 低 |
| `GITHUB_TOKEN` | 組織/ユーザー | 低 |
| `CONFLUENCE_*_SPACE` | 組織 | 低 |
| `JIRA_ISSUE_TYPE_*` | 組織 | 低 |

**問題:**
- プロジェクトごとに同じ情報を重複入力
- 組織の設定変更時に全プロジェクトの .env を更新する必要
- セキュリティリスク（認証情報が各プロジェクトに分散）

**影響:**
- 新規プロジェクト作成時の手間が大きい
- 設定の一貫性が保たれにくい
- パーミッション管理が煩雑

### 3.3 コマンドの使い分けの不明瞭さ

**現状:**
3つのコマンドの使い分けが不明確:

| コマンド | 用途 | 実行タイミング | ユーザーの理解度 |
|---------|------|--------------|----------------|
| `config:global` | グローバル設定 | 初回のみ（組織で一度） | 低 (いつ使うべきか不明) |
| `init` | 新規プロジェクト | プロジェクト作成時 | 中 |
| `setup-existing` | 既存プロジェクト | 既存プロジェクトに追加 | 中 |

**問題:**
- ドキュメントを読まないと使い分けが分からない
- `init` と `setup-existing` の違いが微妙（内部実装はほぼ同じ）
- `config:global` がオプション扱いで、重要性が伝わらない

**ユーザーの混乱例:**
1. 「config:global を実行せずに init を実行 → .env の手動編集が必要に」
2. 「新規プロジェクトで setup-existing を使用 → 問題なく動作するが、推奨ではない」
3. 「各プロジェクトで .env を個別に編集 → 組織設定の一元管理ができていない」

### 3.4 ドキュメントのタイポ

**問題:**
`docs/user-guide/getting-started/quick-start.md:35` に以下のタイポ:

```markdown
npx @sk8metal/michi-cli setup-existin
```

正しくは:
```markdown
npx @sk8metal/michi-cli setup-existing
```

**影響:**
- ユーザーがコマンドをコピー&ペーストした際にエラー
- ドキュメントの信頼性低下

---

