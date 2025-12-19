# Michi 設定統合設計書 - 解決策と新アーキテクチャ

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 4. 解決策の提案

### 4.1 3層の設定階層

新しいアーキテクチャでは、設定を3つのレイヤーに分離します:

```
Layer 1: グローバル設定 (~/.michi/)
  ├─ config.json     - Confluence/JIRA/ワークフロー設定
  └─ .env            - 認証情報・組織共通設定
    ↓ (低優先度)

Layer 2: プロジェクト設定 (.michi/)
  └─ config.json     - プロジェクト固有のオーバーライド（optional）
    ↓ (中優先度)

Layer 3: プロジェクトメタデータ (.kiro/, .env)
  ├─ .kiro/project.json  - projectId, projectName, jiraProjectKey
  └─ .env                - プロジェクト固有の環境変数のみ
    ↓ (高優先度)

[マージされた設定]
```

**利点:**
1. **明確な階層**: どのレベルで設定を管理すべきか明確
2. **設定の共有**: グローバル設定は全プロジェクトで自動的に共有
3. **柔軟なオーバーライド**: プロジェクト固有の要件にも対応可能

### 4.2 設定項目の再分類

**Category A: 組織レベル (グローバル設定)**

| 項目 | ファイル | 説明 |
|------|---------|------|
| `ATLASSIAN_URL` | `~/.michi/.env` | AtlassianベースURL |
| `ATLASSIAN_EMAIL` | `~/.michi/.env` | Atlassian認証用メールアドレス |
| `ATLASSIAN_API_TOKEN` | `~/.michi/.env` | Atlassian APIトークン |
| `GITHUB_ORG` | `~/.michi/.env` | GitHub組織名 |
| `GITHUB_TOKEN` | `~/.michi/.env` | GitHubアクセストークン |
| `CONFLUENCE_PRD_SPACE` | `~/.michi/.env` | 要件定義書スペース |
| `CONFLUENCE_QA_SPACE` | `~/.michi/.env` | テスト仕様書スペース |
| `CONFLUENCE_RELEASE_SPACE` | `~/.michi/.env` | リリースノートスペース |
| `JIRA_ISSUE_TYPE_STORY` | `~/.michi/.env` | Story Issue Type ID |
| `JIRA_ISSUE_TYPE_SUBTASK` | `~/.michi/.env` | Subtask Issue Type ID |
| `confluence.*` | `~/.michi/config.json` | Confluence設定（pageCreationGranularity等） |
| `jira.*` | `~/.michi/config.json` | JIRA設定（createEpic等） |
| `workflow.*` | `~/.michi/config.json` | ワークフロー設定 |

**Category B: プロジェクトレベル (プロジェクト設定)**

| 項目 | ファイル | 説明 |
|------|---------|------|
| `projectId` | `.kiro/project.json` | プロジェクトID |
| `projectName` | `.kiro/project.json` | プロジェクト名 |
| `jiraProjectKey` | `.kiro/project.json` | JIRAプロジェクトキー |
| `JIRA_PROJECT_KEYS` | `.env` | JIRAプロジェクトキー |
| `language` | `.kiro/project.json` | ドキュメント言語 |
| `confluenceLabels` | `.kiro/project.json` | Confluenceラベル |
| `repository` | `.kiro/project.json` | リポジトリURL（ConfigLoaderが自動的に org/repo 形式に変換） |
| `description` | `.kiro/project.json` | プロジェクト説明 |
| `confluence.*` | `.michi/config.json` (optional) | プロジェクト固有のオーバーライド |
| `jira.*` | `.michi/config.json` (optional) | プロジェクト固有のオーバーライド |
| `workflow.*` | `.michi/config.json` (optional) | プロジェクト固有のオーバーライド |

**注**: `repository` から `org/repo` 形式が必要な場合、ConfigLoaderが自動的にパースして提供します。

### 4.3 コマンド統一案

**新しいコマンド構成:**

1. **`michi config:global`** (初回のみ、組織で一度)
   - ~/.michi/config.json 作成
   - ~/.michi/.env 作成（認証情報を安全に保存）
   - 全プロジェクトで共通の設定を一元管理

2. **`michi init`** (新規・既存プロジェクト統一)
   - `--existing` フラグで既存プロジェクトモードを切り替え
   - 自動検出機能により、既存プロジェクトを自動判別
   - プロジェクトメタデータのみ対話的に取得
   - グローバル設定を自動参照

3. **`michi migrate`** (既存ユーザー向け)
   - 既存の .env を新形式に自動変換
   - バックアップを作成して安全に移行

4. **`setup-existing` の即時非推奨化**
   - v0.5.0以降、setup-existing は警告を表示して `michi init --existing` に委譲
   - 完全な後方互換性を維持しつつ、新しいコマンドへの移行を促す
   - コマンド実行時に明確な移行メッセージを表示

**michi init vs michi init --existing の違い:**

| 項目 | `michi init` | `michi init --existing` |
|------|-------------|------------------------|
| **用途** | 新規プロジェクトの作成 | 既存プロジェクトにMichiを追加 |
| **プロジェクトID** | 対話的に入力を要求 | ディレクトリ名から自動生成 |
| **リポジトリURL** | Git設定から取得、なければ対話的入力 | Git設定から取得（必須） |
| **.gitディレクトリ** | なくてもOK（警告のみ） | 必須（なければエラー） |
| **既存ファイルの扱い** | .envが存在する場合は警告 | .envが存在する場合はマージ |
| **テンプレート** | すべてのテンプレートをコピー | 必要なテンプレートのみ追加 |
| **自動検出** | 既存プロジェクトを検出した場合、--existing モードを提案 | - |

**プロジェクトID自動生成の具体例:**

`michi init --existing` を実行した際、プロジェクトIDはカレントディレクトリ名から自動生成されます：

```bash
# 例1: Node.jsプロジェクト
$ pwd
/Users/username/Work/git/my-awesome-project

$ michi init --existing
# → projectId: "my-awesome-project" として自動設定

# 例2: Javaプロジェクト
$ pwd
/home/developer/projects/ecommerce-api

$ michi init --existing
# → projectId: "ecommerce-api" として自動設定

# 例3: PHPプロジェクト
$ pwd
/var/www/customer-portal

$ michi init --existing
# → projectId: "customer-portal" として自動設定
```

**注**: 自動生成された projectId は、対話的プロンプトで確認され、必要に応じて変更可能です。

**自動検出ロジック:**

`michi init` 実行時、以下のファイル/ディレクトリが存在する場合、自動的に既存プロジェクトと判断:
- `.git/` ディレクトリ
- `package.json` (Node.js)
- `pom.xml` または `build.gradle` (Java)
- `composer.json` (PHP)

検出された場合、以下のプロンプトを表示:
```
⚠️  既存のプロジェクトが検出されました
   既存プロジェクトモードで初期化しますか？ (Y/n)
```

**使い方のシンプル化:**

```bash
# 1. グローバル設定（初回のみ、組織で一度）
michi config:global

# 2a. 新規プロジェクト初期化
cd /path/to/new-project
michi init

# 2b. 既存プロジェクトにMichiを追加
cd /path/to/existing-project
michi init --existing
# または、自動検出により michi init でもOK（確認プロンプトが表示される）

# 3. (非推奨) 既存の setup-existing も引き続き動作（警告付き）
npx @sk8metal/michi-cli setup-existing
# → 警告: "このコマンドは非推奨です。michi init --existing を使用してください"
```

---

## 5. 新アーキテクチャ

### 5.1 ファイル構成

```
~/.michi/                          # グローバル設定ディレクトリ
├── config.json                    # Confluence/JIRA/ワークフロー設定
└── .env                           # 認証情報・組織共通設定 (chmod 600)

<project-root>/
├── .michi/
│   └── config.json                # プロジェクト固有のオーバーライド（optional）
├── .kiro/
│   ├── project.json               # プロジェクトメタデータ
│   ├── settings/
│   ├── steering/
│   └── specs/
└── .env                           # プロジェクト固有の環境変数 (chmod 600)
```

### 5.2 各ファイルの内容例

#### 5.2.1 `~/.michi/config.json`

```json
{
  "version": "0.5.0",
  "confluence": {
    "pageCreationGranularity": "single",
    "pageTitleFormat": "{projectName} - {featureName}",
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "all",
    "storyPoints": "auto"
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"],
    "approvalGates": {
      "requirements": ["pm", "director"],
      "design": ["architect", "director"],
      "release": ["sm", "director"]
    }
  }
}
```

#### 5.2.2 `~/.michi/.env`

```bash
# Atlassian認証
ATLASSIAN_URL=https://your-org.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com
ATLASSIAN_API_TOKEN=your-api-token

# GitHub認証
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx

# Confluence共有スペース
CONFLUENCE_PRD_SPACE=PRD
CONFLUENCE_QA_SPACE=QA
CONFLUENCE_RELEASE_SPACE=RELEASE

# JIRA Issue Type IDs（組織固有）
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037
```

#### 5.2.3 `.kiro/project.json`

```json
{
  "projectId": "my-project",
  "projectName": "マイプロジェクト",
  "language": "ja",
  "jiraProjectKey": "MYPRJ",
  "confluenceLabels": ["project:my-project"],
  "status": "active",
  "team": [],
  "stakeholders": ["@企画", "@部長"],
  "repository": "https://github.com/org/my-project",
  "description": "マイプロジェクトの開発"
}
```

#### 5.2.4 `.env` (新形式)

```bash
# プロジェクト固有の環境変数のみ
JIRA_PROJECT_KEYS=MYPRJ

# (必要に応じて) プロジェクト固有のオーバーライド
# CONFLUENCE_PRD_SPACE=CUSTOM_PRD

# 注: GITHUB_REPO は不要です
# リポジトリ情報は .kiro/project.json の repository から自動的に抽出されます
```

#### 5.2.5 `.michi/config.json` (optional)

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy"
  },
  "jira": {
    "storyPoints": "manual"
  }
}
```

### 5.3 設定の読み込み順序と優先度

**読み込み順序（優先度: 低 → 高）:**

1. `~/.michi/.env` (組織レベルの環境変数)
2. `~/.michi/config.json` (組織レベルの設定)
3. `.kiro/project.json` (プロジェクトメタデータ)
4. `.michi/config.json` (プロジェクト固有のオーバーライド)
5. `.env` (プロジェクト固有の環境変数)

**マージロジック:**

- 後に読み込まれた設定が、前の設定を上書き
- オブジェクトはディープマージ
- 配列は完全置換（マージしない）

**例:**

```javascript
// ~/.michi/config.json
{
  "confluence": {
    "pageCreationGranularity": "single",
    "pageTitleFormat": "{projectName}"
  }
}

// .michi/config.json (プロジェクト固有)
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy"
  }
}

// マージ結果
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",  // プロジェクト設定で上書き
    "pageTitleFormat": "{projectName}"          // グローバル設定を継承
  }
}
```

### 5.4 各コマンドの新しい動作フロー

#### 5.4.1 `michi config:global`

```
[開始]
  ↓
[既存のグローバル設定を確認]
  ├─ ~/.michi/config.json の存在確認
  └─ ~/.michi/.env の存在確認
  ↓
  [存在する場合]
    ↓
  [上書き確認]
    ├─ No → [終了]
    └─ Yes → [続行]
  ↓
[対話的に設定を取得]
  ├─ Atlassian認証情報
  │   ├─ ATLASSIAN_URL
  │   ├─ ATLASSIAN_EMAIL
  │   └─ ATLASSIAN_API_TOKEN
  ├─ GitHub認証情報
  │   ├─ GITHUB_ORG
  │   └─ GITHUB_TOKEN
  ├─ Confluenceスペース設定
  │   ├─ CONFLUENCE_PRD_SPACE
  │   ├─ CONFLUENCE_QA_SPACE
  │   └─ CONFLUENCE_RELEASE_SPACE
  ├─ JIRA Issue Type IDs
  │   ├─ JIRA_ISSUE_TYPE_STORY
  │   └─ JIRA_ISSUE_TYPE_SUBTASK
  ├─ Confluence設定
  │   ├─ pageCreationGranularity
  │   ├─ pageTitleFormat (optional)
  │   └─ hierarchy (optional)
  ├─ JIRA設定
  │   ├─ createEpic
  │   ├─ storyCreationGranularity
  │   ├─ selectedPhases (optional)
  │   └─ storyPoints
  └─ ワークフロー設定
      ├─ enabledPhases
      └─ approvalGates (optional)
  ↓
[設定内容の確認表示]
  ↓
[保存確認]
  ├─ No → [終了]
  └─ Yes → [続行]
  ↓
[~/.michi/ディレクトリ作成]
  ↓
[~/.michi/config.json 保存]
  ↓
[~/.michi/.env 保存]
  └─ chmod 600 (セキュリティ)
  ↓
[バリデーション実行]
  ↓
[完了メッセージ表示]
  ├─ 作成されたファイルの一覧
  ├─ セキュリティに関する注意事項
  │   └─ ~/.michi/.env と <project>/.env の違いを明記
  └─ 次のステップ（michi init の実行）
```

#### 5.4.2 `michi init`

```
[開始]
  ↓
[オプション解析]
  └─ --existing フラグの有無を確認
  ↓
[グローバル設定の存在確認]
  ├─ ~/.michi/config.json
  └─ ~/.michi/.env
  ↓
  [グローバル設定がない場合]
    ↓
  [警告表示]
    「グローバル設定が未作成です」
    「michi config:global を先に実行することを推奨します」
    「組織共通の認証情報（Atlassian, GitHub）を全プロジェクトで共有できます」
    ↓
  [続行確認]
    ├─ No → [終了]
    └─ Yes → [後方互換モードで続行]
  ↓
[environment の決定]
  ├─ --cursor, --claude 等のフラグをチェック
  ├─ 環境変数 (CLAUDE_CODE=1 等) をチェック
  ├─ 自動検出を試みる
  └─ 対話的プロンプト (自動検出できない場合)
  ↓
[プロジェクトメタデータの対話的取得]
  ├─ projectId
  │   └─ --existing の場合はディレクトリ名を使用
  ├─ projectName
  ├─ jiraProjectKey
  └─ language (デフォルト: ja)
  ↓
[設定内容の確認表示]
  ├─ projectId
  ├─ projectName
  ├─ jiraProjectKey
  ├─ environment
  ├─ language
  └─ (グローバル設定が読み込まれることを明示)
  ↓
[続行確認]
  ├─ No → [終了]
  └─ Yes → [続行]
  ↓
[リポジトリルートの検出]
  ├─ .git ディレクトリを探索
  └─ 見つからない場合は警告（Gitリポジトリでない）
  ↓
[.kiro/ ディレクトリ構造作成]
  ├─ .kiro/settings/templates/
  ├─ .kiro/steering/
  └─ .kiro/specs/
  ↓
[.kiro/project.json 作成]
  ├─ projectId, projectName, jiraProjectKey
  ├─ repository URL (git config から取得)
  ├─ confluenceLabels (自動生成)
  └─ 他のメタデータ
  ↓
[.env 作成]
  ├─ 既存の .env をチェック
  │   └─ 存在する場合: マージ（既存値を優先）
  ├─ プロジェクト固有設定のみを追加
  │   ├─ GITHUB_REPO (git config から取得)
  │   └─ JIRA_PROJECT_KEYS
  └─ テンプレートコメントを追加
  ↓
[テンプレート/ルールのコピー]
  ├─ 環境別テンプレート
  │   └─ cursor/claude/gemini/codex/cline
  ├─ Steeringテンプレート
  ├─ Specテンプレート
  └─ cc-sdd オーバーライド
  ↓
[環境別の追加処理]
  ├─ Claude環境
  │   └─ スキル/サブエージェントのインストール
  ├─ Codex環境
  │   └─ cc-sdd インストールプロンプト
  └─ 他の環境
      └─ 環境固有の処理
  ↓
[.gitignore 更新]
  ├─ .env エントリの追加
  └─ 既に含まれている場合はスキップ
  ↓
[バリデーション実行]
  ├─ 設定ファイルのスキーマチェック
  ├─ 必須ファイルの存在確認
  └─ パーミッションのチェック (.env = 600)
  ↓
[完了メッセージ表示]
  ├─ 作成されたファイルの一覧
  ├─ 環境別の次のステップ
  └─ ドキュメントへのリンク
```

#### 5.4.3 `michi migrate`

```
[開始]
  ↓
[現在の設定を検出]
  ├─ ~/.michi/config.json の存在確認
  ├─ ~/.michi/.env の存在確認（新形式）
  ├─ ~/.michi/global.env の存在確認（旧形式、マイグレーション対象）
  ├─ .michi/config.json の存在確認
  ├─ .kiro/project.json の存在確認
  └─ .env の存在確認
  ↓
[検出された設定の表示]
  ├─ ✓ ~/.michi/config.json
  ├─ ✓ .kiro/project.json
  └─ ✓ .env
  ↓
[移行内容の説明]
  1. .env から組織共通設定を抽出 → ~/.michi/.env
  2. プロジェクト固有設定のみを .env に残す
  3. 既存の ~/.michi/global.env を ~/.michi/.env にリネーム（存在する場合）
  4. 既存の設定ファイルはすべてバックアップを作成
  ↓
[実行確認]
  ├─ No → [終了]
  └─ Yes → [続行]
  ↓
[バックアップ作成]
  ├─ .michi-backup-YYYYMMDDHHMMSS/ ディレクトリ作成
  ├─ 既存の設定ファイルをコピー
  └─ 成功メッセージ表示
  ↓
[.env を分析]
  ├─ 全環境変数を読み込み
  ├─ 組織共通設定を抽出
  │   └─ ATLASSIAN_*, GITHUB_ORG, GITHUB_TOKEN, CONFLUENCE_*, JIRA_ISSUE_TYPE_*
  └─ プロジェクト固有設定を抽出
      └─ GITHUB_REPO, JIRA_PROJECT_KEYS
  ↓
[組織共通設定の項目数を表示]
  └─ "✓ 組織共通設定: N 項目"
  ↓
[プロジェクト固有設定の項目数を表示]
  └─ "✓ プロジェクト固有設定: M 項目"
  ↓
[旧形式からのマイグレーション]
  ├─ ~/.michi/global.env が存在する場合
  │   └─ ~/.michi/.env にリネーム
  └─ 成功メッセージ表示
  ↓
[~/.michi/.env 作成または更新]
  ├─ 既存の ~/.michi/.env をチェック
  │   ├─ 存在する場合: 上書き確認
  │   └─ 存在しない場合: 新規作成
  ├─ 組織共通設定を書き込み
  ├─ chmod 600 (セキュリティ)
  └─ 成功メッセージ表示
  ↓
[.env を更新]
  ├─ プロジェクト固有設定のみを書き込み
  ├─ コメントを追加
  │   └─ 「組織共通設定は ~/.michi/.env を参照」
  │   └─ 「このファイルにはプロジェクト固有の設定のみを記載してください」
  └─ 成功メッセージ表示
  ↓
[バリデーション実行]
  ├─ ConfigLoader で設定を読み込み
  ├─ 必須項目のチェック
  └─ エラーがあれば表示
  ↓
[完了メッセージ表示]
  ├─ 変更内容のサマリー
  ├─ バックアップの場所
  └─ 次のステップ
```

---

