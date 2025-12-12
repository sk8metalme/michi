# Michi 設定統合設計書

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**対象リリース**: v0.5.0 - v1.0.0

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [現状分析](#2-現状分析)
3. [問題点の特定](#3-問題点の特定)
4. [解決策の提案](#4-解決策の提案)
5. [新アーキテクチャ](#5-新アーキテクチャ)
6. [実装詳細](#6-実装詳細)
7. [マイグレーション戦略](#7-マイグレーション戦略)
8. [テスト戦略](#8-テスト戦略)
9. [セキュリティとパフォーマンス](#9-セキュリティとパフォーマンス)
10. [後方互換性](#10-後方互換性)
11. [ロードマップ](#11-ロードマップ)
12. [付録](#12-付録)

---

## 1. エグゼクティブサマリー

### 1.1 背景

Michiプロジェクトでは、現在3つのコマンド（`michi init`、`npx @sk8metal/michi-cli setup-existing`、`npm run config:global`）がプロジェクトの初期設定を担当しています。しかし、これらのコマンドには以下の問題があります:

- **重複する対話的プロンプト**: プロジェクト名、JIRAキー、環境の入力が複数のコマンドで重複
- **設定項目の分散**: 組織レベルで共通の設定が `.env` に分散し、プロジェクトごとに重複入力が必要
- **使い分けの不明瞭さ**: どのコマンドをいつ使うべきか、ユーザーにとって不明確

### 1.2 目的

本設計書では、以下を達成する統一的な設定管理システムを提案します:

1. **設定の階層化**: グローバル設定（組織レベル）とプロジェクト設定（プロジェクトレベル）の明確な分離
2. **コマンドの統一**: `init` と `setup-existing` を統合し、使い分けをシンプルに
3. **自動マイグレーション**: 既存ユーザーが簡単に新形式に移行できるツールの提供
4. **後方互換性**: 段階的な移行により、既存ユーザーへの影響を最小化

### 1.3 期待される効果

- **ユーザー体験の向上**: 組織設定を一度だけ入力すれば、全プロジェクトで共有
- **保守性の向上**: 設定の一元管理により、変更が容易に
- **セキュリティの向上**: 認証情報を適切なファイル（`~/.michi/.env`）に集約し、パーミッション管理を強化

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

## 6. 実装詳細

### 6.1 ConfigLoader クラス設計

ConfigLoaderは、複数の設定ファイルを読み込み、優先順位に従ってマージし、型安全なアクセスを提供するクラスです。

**ファイルパス:** `scripts/utils/config-loader-v2.ts`

**責務:**
1. 複数の設定ファイルを読み込み
2. 優先順位に従ってマージ
3. バリデーション
4. 型安全なアクセス提供
5. キャッシュによるパフォーマンス向上

**クラス定義:**

```typescript
import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

/**
 * 設定の読み込み元
 */
type ConfigSource =
  | 'global-env'      // ~/.michi/global.env
  | 'global-config'   // ~/.michi/config.json
  | 'project-meta'    // .kiro/project.json
  | 'project-config'  // .michi/config.json
  | 'project-env';    // .env

/**
 * 読み込まれた設定（ソース情報付き）
 */
interface ConfigWithSource<T> {
  value: T;
  source: ConfigSource;
}

/**
 * 統合設定
 */
interface MergedConfig {
  // Atlassian認証
  atlassian: {
    url: string;
    email: string;
    apiToken: string;
  };

  // GitHub設定
  github: {
    org: string;              // 組織名（グローバル設定から）
    token: string;            // アクセストークン（グローバル設定から）
    repository: string;       // フルURL（project.jsonから）
    repositoryShort: string;  // "org/repo" 形式（自動抽出）
    repositoryOrg: string;    // リポジトリの組織名（自動抽出）
    repositoryName: string;   // リポジトリ名（自動抽出）
  };

  // Confluenceスペース
  confluence: {
    spaces: {
      prd: string;
      qa: string;
      release: string;
    };
    // 設定
    pageCreationGranularity: string;
    pageTitleFormat?: string;
    hierarchy?: unknown;
  };

  // JIRA設定
  jira: {
    issueTypes: {
      story: string;
      subtask: string;
    };
    projectKeys: string; // プロジェクト固有
    createEpic: boolean;
    storyCreationGranularity: string;
    selectedPhases?: string[];
    storyPoints: string;
  };

  // ワークフロー設定
  workflow: {
    enabledPhases: string[];
    approvalGates?: {
      requirements?: string[];
      design?: string[];
      release?: string[];
    };
  };

  // プロジェクトメタデータ
  project: {
    id: string;
    name: string;
    language: string;
    jiraProjectKey: string;
    confluenceLabels: string[];
    status: string;
    team: string[];
    stakeholders: string[];
    repository: string;
    description: string;
  };
}

/**
 * 読み込みオプション
 */
interface LoadOptions {
  projectRoot?: string;     // プロジェクトルート（デフォルト: process.cwd()）
  skipValidation?: boolean; // バリデーションをスキップ
  useCache?: boolean;       // キャッシュを使用（デフォルト: true）
}

/**
 * 設定ローダー
 */
export class ConfigLoader {
  private cache: MergedConfig | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 60000; // 1分

  /**
   * 設定を読み込んでマージ
   */
  async load(options?: LoadOptions): Promise<MergedConfig> {
    // キャッシュチェック
    if (this.cache && options?.useCache !== false) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.cacheTTL) {
        return this.cache;
      }
    }

    const projectRoot = options?.projectRoot || process.cwd();

    // パフォーマンス計測開始
    const start = performance.now();

    // 並列読み込み
    const [globalEnv, globalConfig, projectMeta, projectConfig, projectEnv] =
      await Promise.all([
        this.loadGlobalEnv(),
        this.loadGlobalConfig(),
        this.loadProjectMeta(projectRoot),
        this.loadProjectConfig(projectRoot),
        this.loadProjectEnv(projectRoot),
      ]);

    // マージ
    const merged = this.merge([
      globalEnv,
      globalConfig,
      projectMeta,
      projectConfig,
      projectEnv,
    ]);

    // リポジトリURLのパース（project.jsonから取得）
    if (merged.project?.repository) {
      const parsed = this.parseGitHubRepository(merged.project.repository);
      merged.github = {
        ...merged.github,
        repository: parsed.url,
        repositoryShort: parsed.shortForm,
        repositoryOrg: parsed.org,
        repositoryName: parsed.repo,
      };
    }

    // バリデーション
    if (!options?.skipValidation) {
      this.validate(merged);
    }

    // キャッシュ更新
    this.cache = merged;
    this.cacheTimestamp = Date.now();

    // パフォーマンス計測終了
    const elapsed = performance.now() - start;
    if (elapsed > 100) {
      console.warn(`⚠️  設定の読み込みに ${elapsed.toFixed(2)}ms かかりました（目標: <100ms）`);
    }

    return merged;
  }

  /**
   * 設定をリロード（キャッシュをクリア）
   */
  reload(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * 特定の設定値を取得
   */
  get<T>(path: string): T | undefined {
    if (!this.cache) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    // ドットパスで設定値を取得
    return this.getValueByPath(this.cache, path);
  }

  /**
   * 設定値の設定元を取得
   */
  getSource(path: string): ConfigSource | undefined {
    // TODO: 実装
    // 各設定値がどのファイルから来たかを追跡する
    return undefined;
  }

  /**
   * グローバル.envを読み込み
   */
  private async loadGlobalEnv(): Promise<Partial<MergedConfig>> {
    const globalEnvPath = this.getGlobalEnvPath();
    if (!existsSync(globalEnvPath)) {
      return {};
    }

    const parsed = dotenv.parse(readFileSync(globalEnvPath, 'utf-8'));

    return {
      atlassian: {
        url: parsed.ATLASSIAN_URL || '',
        email: parsed.ATLASSIAN_EMAIL || '',
        apiToken: parsed.ATLASSIAN_API_TOKEN || '',
      },
      github: {
        org: parsed.GITHUB_ORG || '',
        token: parsed.GITHUB_TOKEN || '',
        // repository関連はproject.jsonから取得
        repository: '',
        repositoryShort: '',
        repositoryOrg: '',
        repositoryName: '',
      },
      confluence: {
        spaces: {
          prd: parsed.CONFLUENCE_PRD_SPACE || 'PRD',
          qa: parsed.CONFLUENCE_QA_SPACE || 'QA',
          release: parsed.CONFLUENCE_RELEASE_SPACE || 'RELEASE',
        },
      },
      jira: {
        issueTypes: {
          story: parsed.JIRA_ISSUE_TYPE_STORY || '',
          subtask: parsed.JIRA_ISSUE_TYPE_SUBTASK || '',
        },
        projectKeys: '', // プロジェクト固有
      },
    };
  }

  /**
   * グローバル設定を読み込み
   */
  private async loadGlobalConfig(): Promise<Partial<MergedConfig>> {
    const globalConfigPath = this.getGlobalConfigPath();
    if (!existsSync(globalConfigPath)) {
      return {};
    }

    const content = readFileSync(globalConfigPath, 'utf-8');
    const config = JSON.parse(content);

    // TODO: 変換処理
    return config;
  }

  /**
   * プロジェクトメタデータを読み込み
   */
  private async loadProjectMeta(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectMetaPath = join(projectRoot, '.kiro/project.json');
    if (!existsSync(projectMetaPath)) {
      return {};
    }

    const content = readFileSync(projectMetaPath, 'utf-8');
    const meta = JSON.parse(content);

    return {
      project: meta,
    };
  }

  /**
   * プロジェクト設定を読み込み
   */
  private async loadProjectConfig(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectConfigPath = join(projectRoot, '.michi/config.json');
    if (!existsSync(projectConfigPath)) {
      return {};
    }

    const content = readFileSync(projectConfigPath, 'utf-8');
    const config = JSON.parse(content);

    // TODO: 変換処理
    return config;
  }

  /**
   * プロジェクト.envを読み込み
   */
  private async loadProjectEnv(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectEnvPath = join(projectRoot, '.env');
    if (!existsSync(projectEnvPath)) {
      return {};
    }

    const parsed = dotenv.parse(readFileSync(projectEnvPath, 'utf-8'));

    return {
      jira: {
        projectKeys: parsed.JIRA_PROJECT_KEYS || '',
      },
      // GITHUB_REPO は削除（project.jsonのrepositoryから取得）
    };
  }

  /**
   * マージ処理
   */
  private merge(configs: Partial<MergedConfig>[]): MergedConfig {
    // deep merge with priority
    return this.deepMerge({}, ...configs) as MergedConfig;
  }

  /**
   * ディープマージ
   */
  private deepMerge(target: any, ...sources: any[]): any {
    for (const source of sources) {
      if (!source) continue;

      for (const key in source) {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          target[key] = this.deepMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined && sourceValue !== '') {
          target[key] = sourceValue;
        }
      }
    }

    return target;
  }

  /**
   * オブジェクトチェック
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * バリデーション
   */
  private validate(config: MergedConfig): void {
    try {
      MergedConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigValidationError(
          'Configuration validation failed',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * パスで値を取得
   */
  private getValueByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * グローバル.envのパスを取得
   *
   * 注: 後方互換性のため、旧形式（global.env）も確認する
   */
  private getGlobalEnvPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Could not determine home directory');
    }

    const newPath = join(homeDir, '.michi', '.env');
    const oldPath = join(homeDir, '.michi', 'global.env');

    // 旧形式が存在し、新形式が存在しない場合は警告
    if (existsSync(oldPath) && !existsSync(newPath)) {
      console.warn('⚠️  古い設定ファイルが見つかりました: ~/.michi/global.env');
      console.warn('   ~/.michi/.env に移行してください');
      console.warn('   コマンド: michi migrate config');
      return oldPath; // 後方互換性のため旧パスを返す
    }

    return newPath;
  }

  /**
   * グローバル設定のパスを取得
   */
  private getGlobalConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Could not determine home directory');
    }
    return join(homeDir, '.michi', 'config.json');
  }

  /**
   * GitHubリポジトリURLをパース
   *
   * @param repoUrl - GitHub リポジトリURL（HTTPS または SSH）
   * @returns パースされたリポジトリ情報
   * @throws {ConfigValidationError} 無効なURLの場合
   */
  private parseGitHubRepository(repoUrl: string): {
    url: string;
    org: string;
    repo: string;
    shortForm: string;
  } {
    // HTTPSとSSH両方のURLをサポート
    const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    const sshMatch = repoUrl.match(/github\.com:([^/]+)\/([^/]+?)(\.git)?$/);
    const match = httpsMatch || sshMatch;

    if (!match) {
      throw new ConfigValidationError(
        'REPOSITORY_URL_INVALID',
        `Invalid GitHub repository URL: ${repoUrl}`,
        []
      );
    }

    const org = match[1];
    const repo = match[2];

    return {
      url: repoUrl,
      org,
      repo,
      shortForm: `${org}/${repo}`,
    };
  }
}

/**
 * シングルトンインスタンス
 */
export const configLoader = new ConfigLoader();

/**
 * ヘルパー関数（後方互換性のため）
 */
export async function loadConfig(options?: LoadOptions): Promise<MergedConfig> {
  return configLoader.load(options);
}
```

### 6.2 Zodスキーマ定義

```typescript
// scripts/utils/config-schema.ts

import { z } from 'zod';

/**
 * MergedConfig のZodスキーマ
 */
export const MergedConfigSchema = z.object({
  atlassian: z.object({
    url: z.string().url(),
    email: z.string().email(),
    apiToken: z.string().min(1),
  }),

  github: z.object({
    org: z.string().min(1),
    token: z.string().min(1),
    repository: z.string().url(),
    repositoryShort: z.string().min(1),
    repositoryOrg: z.string().min(1),
    repositoryName: z.string().min(1),
  }),

  confluence: z.object({
    spaces: z.object({
      prd: z.string().min(1),
      qa: z.string().min(1),
      release: z.string().min(1),
    }),
    pageCreationGranularity: z.enum(['single', 'by-section', 'by-hierarchy', 'manual']),
    pageTitleFormat: z.string().optional(),
    hierarchy: z.any().optional(),
  }),

  jira: z.object({
    issueTypes: z.object({
      story: z.string().min(1),
      subtask: z.string().min(1),
    }),
    projectKeys: z.string().min(1),
    createEpic: z.boolean(),
    storyCreationGranularity: z.enum(['all', 'by-phase', 'selected-phases']),
    selectedPhases: z.array(z.string()).optional(),
    storyPoints: z.enum(['auto', 'manual', 'disabled']),
  }),

  workflow: z.object({
    enabledPhases: z.array(z.string()).min(1),
    approvalGates: z.object({
      requirements: z.array(z.string()).optional(),
      design: z.array(z.string()).optional(),
      release: z.array(z.string()).optional(),
    }).optional(),
  }),

  project: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    language: z.enum(['ja', 'en']),
    jiraProjectKey: z.string().regex(/^[A-Z]{2,10}$/),
    confluenceLabels: z.array(z.string()),
    status: z.string(),
    team: z.array(z.string()),
    stakeholders: z.array(z.string()),
    repository: z.string().url(),
    description: z.string(),
  }),
});

export type MergedConfig = z.infer<typeof MergedConfigSchema>;
```

### 6.3 エラークラス定義

```typescript
// scripts/utils/config-errors.ts

import { z } from 'zod';

/**
 * 設定関連のエラー基底クラス
 */
export class ConfigError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * バリデーションエラー
 */
export class ConfigValidationError extends ConfigError {
  constructor(message: string, public details: z.ZodIssue[]) {
    super(message, 'CONFIG_VALIDATION_ERROR');
    this.name = 'ConfigValidationError';
  }
}

/**
 * 必須設定が見つからない
 */
export class ConfigNotFoundError extends ConfigError {
  constructor(message: string, public missingKeys: string[]) {
    super(message, 'CONFIG_NOT_FOUND');
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * マイグレーションエラー
 */
export class MigrationError extends ConfigError {
  constructor(message: string, public phase: string) {
    super(message, 'MIGRATION_ERROR');
    this.name = 'MigrationError';
  }
}
```

---

## 7. マイグレーション戦略

### 7.1 移行の概要

#### 7.1.1 移行が必要な理由

新しい設定システムへの移行により、以下の利点が得られます：

- **設定の一元管理**: 組織レベルの認証情報を全プロジェクトで共有
- **セキュリティの強化**: 認証情報を適切なファイル（`~/.michi/.env`）に集約し、パーミッション管理を強化
- **メンテナンス性の向上**: 設定変更が容易になり、チーム全体での管理が簡素化
- **将来の拡張性**: 新機能（暗号化、複数組織サポート等）の基盤を構築

#### 7.1.2 移行しない場合のリスク

- **v1.0.0以降でサポート終了**: 旧形式（`global.env`、`GITHUB_REPO`）は完全に削除されます
- **セキュリティ警告の継続表示**: 非推奨機能使用時に警告が表示され続けます
- **新機能が利用不可**: v1.1.0以降の新機能（暗号化等）が使用できません
- **互換性の問題**: 将来のバージョンで動作しなくなる可能性があります

### 7.2 移行パターン

#### 7.2.1 パターンA: 単一プロジェクトの移行（最も一般的）

**対象**: 1つのプロジェクトで Michi を使用しているユーザー

**手順**:
1. グローバル設定を作成: `michi config:global`
2. プロジェクト設定を移行: `michi migrate`
3. 動作確認

**推定時間**: 10-15分

**詳細手順**:
```bash
# ステップ1: グローバル設定の作成
$ michi config:global
# 対話的プロンプトに従って、組織共通の設定を入力

# ステップ2: プロジェクトディレクトリに移動
$ cd /path/to/your/project

# ステップ3: 移行ツールを実行
$ michi migrate
# 変更内容を確認し、承認

# ステップ4: 動作確認
$ michi init --help
# コマンドが正常に動作することを確認
```

#### 7.2.2 パターンB: 複数プロジェクトの一括移行

**対象**: 複数のプロジェクトで Michi を使用しているユーザー

**手順**:
1. グローバル設定を一度作成
2. 各プロジェクトで `migrate` を実行
3. （オプション）スクリプト化して自動実行

**推定時間**: 5分/プロジェクト

**一括移行スクリプト例**:
```bash
#!/bin/bash

# グローバル設定を一度だけ作成
michi config:global

# プロジェクトリスト
PROJECTS=(
  "/path/to/project-a"
  "/path/to/project-b"
  "/path/to/project-c"
)

# 各プロジェクトで移行を実行
for project in "${PROJECTS[@]}"; do
  echo "Migrating $project..."
  cd "$project" || exit
  michi migrate --force  # 自動承認
  echo "✅ $project migrated"
done

echo "🎉 All projects migrated successfully!"
```

#### 7.2.3 パターンC: 新規プロジェクトの開始

**対象**: これから Michi を使い始めるユーザー

**手順**:
1. グローバル設定を作成
2. `michi init` で新規プロジェクト作成

**推定時間**: 5分

```bash
# ステップ1: グローバル設定
$ michi config:global

# ステップ2: 新規プロジェクト作成
$ mkdir my-new-project
$ cd my-new-project
$ michi init

# または、既存プロジェクトに追加
$ cd /path/to/existing-project
$ michi init --existing
```

### 7.3 自動移行ツール: `michi migrate`

#### 7.3.1 コマンド構文

```bash
michi migrate [options]

Options:
  --dry-run          実際には変更せず、変更内容をプレビュー
  --backup-dir DIR   バックアップディレクトリを指定
                     （デフォルト: .michi-backup-YYYYMMDDHHMMSS）
  --force            確認プロンプトをスキップ
  --verbose          詳細なログを表示
  --help             ヘルプを表示
```

#### 7.3.2 実行フロー

```
[1. 現状のスキャン]
  ├─ ~/.michi/config.json の存在確認
  ├─ ~/.michi/.env の存在確認（新形式）
  ├─ ~/.michi/global.env の存在確認（旧形式）
  ├─ .kiro/project.json の存在確認
  └─ .env の存在確認
  ↓
[2. 変更内容のプレビュー]
  ├─ 組織共通設定の抽出（N項目）
  ├─ プロジェクト固有設定の保持（M項目）
  ├─ 旧形式ファイルのリネーム（該当する場合）
  └─ 変更内容の表示
  ↓
[3. ユーザー確認]
  ├─ 変更内容の確認
  └─ 続行するか確認（--force でスキップ）
  ↓
[4. バックアップ作成]
  ├─ .michi-backup-YYYYMMDDHHMMSS/ ディレクトリ作成
  ├─ 既存ファイルをすべてコピー
  └─ バックアップの場所を表示
  ↓
[5. 設定の分離・移行]
  ├─ .env から組織共通設定を抽出
  ├─ ~/.michi/.env に書き込み（chmod 600）
  ├─ .env を更新（プロジェクト固有設定のみ）
  └─ 旧形式ファイルのリネーム（該当する場合）
  ↓
[6. バリデーション]
  ├─ ConfigLoader で設定を読み込み
  ├─ 必須項目のチェック
  └─ エラーがあれば表示
  ↓
[7. 完了レポート]
  ├─ 変更内容のサマリー
  ├─ バックアップの場所
  ├─ 次のステップ
  └─ トラブルシューティングへのリンク
```

##### 7.3.3 実行例

**例1: 単一プロジェクトの移行（Pattern A）**

```bash
$ cd /Users/username/Work/git/my-project
$ michi migrate

🔄 Michi 設定移行ツール
================================================

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ✓ .michi/config.json 検出
  ✓ .env 検出
  ✓ project.json 検出

[2] 移行が必要な設定を分析中...
  ℹ 以下の設定をグローバル化します:
    - CONFLUENCE_URL
    - CONFLUENCE_USERNAME
    - CONFLUENCE_API_TOKEN
    - JIRA_URL
    - JIRA_USERNAME
    - JIRA_API_TOKEN
    - GITHUB_TOKEN
    - GITHUB_USERNAME
    - GITHUB_EMAIL
    - GITHUB_ORG

  ℹ 以下の設定はプロジェクト固有のままです:
    - GITHUB_REPO (→ project.json.repository に統合)
    - PROJECT_NAME (→ project.json.projectId)

[3] 変更内容の確認
  変更されるファイル:
    - ~/.michi/.env (新規作成)
    - .env (更新: 10項目削除、1項目追加)
    - project.json (更新: repository フィールド追加)

  続行しますか? (y/n): y

[4] バックアップ作成中...
  ✓ バックアップ作成: .michi-backup-20250112143022/

[5] 設定の分離・移行中...
  ✓ ~/.michi/.env に組織設定を書き込みました
  ✓ .env を更新しました
  ✓ project.json を更新しました

[6] バリデーション実行中...
  ✓ ConfigLoader で設定を読み込みました
  ✓ すべての必須項目が設定されています

[7] 移行完了！
================================================
✅ 設定の移行が完了しました

変更内容:
  - グローバル設定ファイル作成: ~/.michi/.env (10項目)
  - プロジェクト.env更新: 10項目削除
  - project.json更新: repository フィールド追加

バックアップ:
  - 場所: .michi-backup-20250112143022/
  - 復元方法: michi migrate --rollback .michi-backup-20250112143022

次のステップ:
  1. 設定を確認: michi config:validate
  2. 動作確認: michi confluence:sync {feature} --dry-run
  3. 問題があれば: docs/michi-development/design/config-unification.md#7.7

移行ログ: .michi/migration.log
```

**例2: 強制実行（確認スキップ）**

```bash
$ michi migrate --force

🔄 Michi 設定移行ツール
================================================
⚠️  --force オプションが指定されています。確認をスキップします。

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ...

[4] バックアップ作成中...
  ✓ バックアップ作成: .michi-backup-20250112143105/

[5] 設定の分離・移行中...
  ...

✅ 設定の移行が完了しました
```

**例3: ドライラン（変更なし）**

```bash
$ michi migrate --dry-run

🔄 Michi 設定移行ツール (ドライランモード)
================================================
⚠️  このモードでは実際の変更は行われません

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ✓ .michi/config.json 検出
  ✓ .env 検出
  ✓ project.json 検出

[2] 移行が必要な設定を分析中...
  ℹ 以下の設定をグローバル化します:
    - CONFLUENCE_URL
    - CONFLUENCE_USERNAME
    - ...

[予定される変更]
  作成: ~/.michi/.env
    CONFLUENCE_URL=https://example.atlassian.net
    CONFLUENCE_USERNAME=admin@example.com
    ...

  更新: .env (10行削除)

  更新: project.json
    + "repository": "https://github.com/myorg/my-project.git"

[3] ドライラン完了
================================================
⚠️  --dry-run モードのため、実際の変更は行われませんでした

実際に移行を実行する場合:
  $ michi migrate
```

#### 7.4 手動移行手順

自動移行ツールを使用しない場合や、カスタマイズが必要な場合の手動移行手順です。

##### 7.4.1 グローバル設定の作成

**ステップ1: ~/.michi/.env の作成**

```bash
# ディレクトリ作成
mkdir -p ~/.michi

# .env ファイル作成
cat > ~/.michi/.env << 'EOF'
# Michi グローバル設定（組織共通）

# Confluence設定
CONFLUENCE_URL=https://your-domain.atlassian.net
CONFLUENCE_USERNAME=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# JIRA設定
JIRA_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# GitHub設定
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-username
GITHUB_EMAIL=your-email@example.com
GITHUB_ORG=your-organization
EOF

# パーミッション設定
chmod 600 ~/.michi/.env
```

**ステップ2: 既存プロジェクトの .env を更新**

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# バックアップ作成
cp .env .env.backup

# グローバル化される項目を削除
# （以下は sed コマンドの例、実際には手動編集を推奨）
sed -i '' '/^CONFLUENCE_URL=/d' .env
sed -i '' '/^CONFLUENCE_USERNAME=/d' .env
sed -i '' '/^CONFLUENCE_API_TOKEN=/d' .env
sed -i '' '/^JIRA_URL=/d' .env
sed -i '' '/^JIRA_USERNAME=/d' .env
sed -i '' '/^JIRA_API_TOKEN=/d' .env
sed -i '' '/^GITHUB_TOKEN=/d' .env
sed -i '' '/^GITHUB_USERNAME=/d' .env
sed -i '' '/^GITHUB_EMAIL=/d' .env
sed -i '' '/^GITHUB_ORG=/d' .env
```

##### 7.4.2 プロジェクト設定の更新

**ステップ3: project.json の更新**

```bash
# .env から GITHUB_REPO を取得
GITHUB_REPO=$(grep GITHUB_REPO .env | cut -d= -f2)

# project.json に repository フィールドを追加
# （jq コマンドを使用する例）
jq --arg repo "https://github.com/$GITHUB_REPO.git" \
  '.repository = $repo' \
  .michi/project.json > .michi/project.json.tmp

mv .michi/project.json.tmp .michi/project.json

# または手動で編集
# {
#   "projectId": "my-project",
#   "repository": "https://github.com/myorg/my-project.git",
#   ...
# }
```

**ステップ4: .env から GITHUB_REPO を削除**

```bash
sed -i '' '/^GITHUB_REPO=/d' .env
```

##### 7.4.3 設定の検証

```bash
# ConfigLoader でバリデーション
npm run config:validate

# または
npx tsx scripts/utils/config-validator.ts

# Michi CLIで動作確認（ドライラン）
michi confluence:sync my-feature --dry-run
```

#### 7.5 検証方法

移行後の設定が正しいことを確認するためのチェックリストです。

##### 7.5.1 ファイル存在チェック

```bash
# グローバル設定の確認
[ -f ~/.michi/.env ] && echo "✓ ~/.michi/.env 存在" || echo "✗ ~/.michi/.env が見つかりません"

# パーミッション確認
ls -l ~/.michi/.env | grep "^-rw-------" && echo "✓ パーミッション正常 (600)" || echo "⚠️ パーミッションを確認してください"

# プロジェクト設定の確認
[ -f .michi/project.json ] && echo "✓ .michi/project.json 存在" || echo "✗ .michi/project.json が見つかりません"
[ -f .env ] && echo "✓ .env 存在" || echo "✗ .env が見つかりません"
```

##### 7.5.2 設定内容チェック

**グローバル設定のチェック**

```bash
# 必須項目が含まれているか確認
grep -q "CONFLUENCE_URL=" ~/.michi/.env && echo "✓ CONFLUENCE_URL" || echo "✗ CONFLUENCE_URL が見つかりません"
grep -q "JIRA_URL=" ~/.michi/.env && echo "✓ JIRA_URL" || echo "✗ JIRA_URL が見つかりません"
grep -q "GITHUB_TOKEN=" ~/.michi/.env && echo "✓ GITHUB_TOKEN" || echo "✗ GITHUB_TOKEN が見つかりません"
```

**プロジェクト設定のチェック**

```bash
# GITHUB_REPO が削除されているか確認
! grep -q "GITHUB_REPO=" .env && echo "✓ GITHUB_REPO は削除されています" || echo "⚠️ GITHUB_REPO がまだ残っています"

# project.json に repository が追加されているか確認
grep -q '"repository"' .michi/project.json && echo "✓ project.json に repository フィールド追加済み" || echo "✗ repository フィールドが見つかりません"
```

##### 7.5.3 バリデーション実行

```bash
# Michi の設定バリデーション
npm run config:validate

# 期待される出力:
# ✅ 設定ファイルは有効です
# ✅ グローバル設定: ~/.michi/.env
# ✅ プロジェクト設定: .michi/config.json
# ✅ プロジェクト環境: .env
# ✅ すべての必須項目が設定されています
```

##### 7.5.4 機能テスト

**Confluence同期のテスト**

```bash
# ドライランで確認（実際にページは作成されない）
michi confluence:sync my-feature requirements --dry-run

# 期待される動作:
# - Confluence URLに接続できる
# - 認証が成功する
# - スペースにアクセスできる
# - ページ作成のシミュレーションが成功する
```

**JIRA同期のテスト**

```bash
# ドライランで確認
michi jira:sync my-feature --dry-run

# 期待される動作:
# - JIRA URLに接続できる
# - プロジェクトが見つかる
# - Epic/Story作成のシミュレーションが成功する
```

**GitHub PR作成のテスト**

```bash
# 現在のブランチ情報を確認
michi github:pr --info

# 期待される動作:
# - リポジトリ情報が正しく取得できる
# - ブランチ情報が表示される
# - PR作成の準備ができている
```

#### 7.6 ロールバック手順

移行後に問題が発生した場合の復元手順です。

##### 7.6.1 自動バックアップからの復元

`michi migrate` コマンドは自動的にバックアップを作成します。

```bash
# バックアップディレクトリの確認
ls -la .michi-backup-*

# 例: .michi-backup-20250112143022/

# ロールバック実行
michi migrate --rollback .michi-backup-20250112143022

# または手動で復元
cp -r .michi-backup-20250112143022/.michi .michi
cp .michi-backup-20250112143022/.env .env
cp .michi-backup-20250112143022/project.json .michi/project.json
```

##### 7.6.2 手動バックアップからの復元

手動移行を行った場合のロールバック手順：

**ステップ1: バックアップファイルを確認**

```bash
# バックアップファイルの確認
ls -la *.backup

# 例:
# .env.backup
# project.json.backup
```

**ステップ2: ファイルを復元**

```bash
# .env の復元
cp .env.backup .env

# project.json の復元
cp .michi/project.json.backup .michi/project.json

# 権限の確認
chmod 600 .env
```

**ステップ3: グローバル設定の削除（オプション）**

```bash
# グローバル設定をロールバックする場合
rm ~/.michi/.env

# または、グローバル設定は残して .env を旧形式に戻すのみでもOK
```

**ステップ4: 動作確認**

```bash
# 設定が正しく復元されたか確認
npm run config:validate

# 実際の機能をテスト
michi confluence:sync my-feature --dry-run
```

##### 7.6.3 部分的なロールバック

グローバル設定のみ、またはプロジェクト設定のみをロールバックする場合：

**グローバル設定のみロールバック**

```bash
# グローバル設定を削除
rm ~/.michi/.env

# .env に組織設定を復元
# （バックアップから CONFLUENCE_*, JIRA_*, GITHUB_* をコピー）
```

**プロジェクト設定のみロールバック**

```bash
# project.json の repository フィールドを削除
jq 'del(.repository)' .michi/project.json > .michi/project.json.tmp
mv .michi/project.json.tmp .michi/project.json

# .env に GITHUB_REPO を復元
echo "GITHUB_REPO=myorg/my-project" >> .env
```

#### 7.7 トラブルシューティング

移行中または移行後に発生する可能性のある問題と解決策です。

##### 7.7.1 移行ツールのエラー

**エラー: "No .env file found"**

```
原因: プロジェクトディレクトリに .env ファイルが存在しない

解決策:
1. 現在のディレクトリを確認: pwd
2. .env ファイルを作成: cp env.example .env
3. 必要な設定を記入
4. 再度移行を実行: michi migrate
```

**エラー: "~/.michi/.env already exists"**

```
原因: グローバル設定ファイルが既に存在する

解決策:
1. 既存のファイルを確認: cat ~/.michi/.env
2. バックアップを作成: cp ~/.michi/.env ~/.michi/.env.backup
3. --force オプションで上書き: michi migrate --force
   または
4. 手動でマージ: 既存の ~/.michi/.env に不足している項目を追加
```

**エラー: "Invalid repository URL in project.json"**

```
原因: project.json の repository フィールドが不正な形式

解決策:
1. project.json を確認: cat .michi/project.json
2. repository フィールドを修正:
   正しい形式: "https://github.com/org/repo.git"
              または "git@github.com:org/repo.git"
3. 再度移行を実行: michi migrate
```

##### 7.7.2 バリデーションエラー

**エラー: "CONFLUENCE_URL is required"**

```
原因: グローバル設定に必須項目が不足している

解決策:
1. ~/.michi/.env を編集
2. 不足している項目を追加:
   CONFLUENCE_URL=https://your-domain.atlassian.net
3. パーミッションを確認: chmod 600 ~/.michi/.env
4. 再度バリデーション: npm run config:validate
```

**エラー: "Repository URL does not match GITHUB_REPO"**

```
原因: project.json.repository と .env.GITHUB_REPO が一致しない

解決策:
1. どちらが正しいか確認
2. 正しい値を project.json に設定
3. .env から GITHUB_REPO を削除
4. 再度バリデーション: npm run config:validate
```

##### 7.7.3 機能テストの失敗

**エラー: "Confluence authentication failed"**

```
原因: Confluence の認証情報が間違っている、または期限切れ

解決策:
1. ~/.michi/.env の認証情報を確認
2. Atlassian でAPIトークンを再生成:
   https://id.atlassian.com/manage-profile/security/api-tokens
3. ~/.michi/.env を更新
4. 再度テスト: michi confluence:sync my-feature --dry-run
```

**エラー: "GitHub repository not found"**

```
原因: リポジトリURLが間違っている、またはアクセス権限がない

解決策:
1. project.json の repository を確認
2. GitHub でリポジトリの存在とアクセス権限を確認
3. 必要に応じて GITHUB_TOKEN の権限を確認
4. 正しいURLに修正
5. 再度テスト: michi github:pr --info
```

##### 7.7.4 パーミッションの問題

**エラー: "Permission denied: ~/.michi/.env"**

```
原因: ファイルのパーミッションが正しくない

解決策:
1. 現在のパーミッションを確認: ls -l ~/.michi/.env
2. 正しいパーミッションに修正: chmod 600 ~/.michi/.env
3. 所有者を確認: ls -l ~/.michi/.env
4. 必要に応じて所有者を変更: sudo chown $USER ~/.michi/.env
```

##### 7.7.5 マルチプロジェクトでの問題

**問題: "複数プロジェクトで異なる組織設定が必要"**

```
原因: 複数の組織に跨ってプロジェクトを管理している

解決策（現在の制限事項）:
1. グローバル設定は1つの組織のみをサポート
2. 別の組織のプロジェクトでは .env に組織設定を直接記述
3. 将来的にはプロファイル機能で複数組織をサポート予定（Section 11参照）

一時的な回避策:
- 主に使用する組織を ~/.michi/.env に設定
- 他の組織のプロジェクトでは .env に全設定を記述（グローバル設定を使用しない）
```

**問題: "プロジェクトAの変更がプロジェクトBに影響する"**

```
原因: グローバル設定を誤って変更した

解決策:
1. グローバル設定の変更は慎重に行う
2. プロジェクト固有の設定は必ず .env または .michi/config.json に記述
3. 設定の優先順位を理解する:
   プロジェクト .env > プロジェクト config.json > グローバル .env
```

##### 7.7.6 ロールバック失敗

**エラー: "Backup directory not found"**

```
原因: バックアップディレクトリが見つからない

解決策:
1. バックアップディレクトリを検索: find . -name ".michi-backup-*"
2. 見つからない場合は手動バックアップを使用: .env.backup など
3. 最悪の場合は Git で復元: git checkout .env .michi/
```

**エラー: "Cannot restore: files are modified"**

```
原因: 復元先のファイルが変更されている

解決策:
1. 現在の変更を確認: git status
2. 変更を保存: git stash
3. ロールバックを実行
4. 必要に応じて変更を復元: git stash pop
```

---

### 参考情報

- **移行ログの確認**: `.michi/migration.log` に詳細なログが記録されます
- **バックアップの保管期間**: 自動バックアップは30日後に自動削除されます（設定で変更可能）
- **サポート**: 問題が解決しない場合は GitHub Issues で報告してください

---

## 8. テスト戦略

設定統一に伴う変更を安全に実施するためのテスト戦略です。

### 8.1 テストスコープ

#### 8.1.1 対象範囲

設定統一により影響を受ける主要な機能をテスト対象とします：

| カテゴリ | テスト対象 | テストレベル |
|---------|-----------|------------|
| **設定読み込み** | ConfigLoader の3層マージ | 単体 + 統合 |
| **バリデーション** | Zodスキーマによる検証 | 単体 |
| **パス解決** | リポジトリURLのパース | 単体 |
| **コマンドライン** | michi init / migrate | 統合 + E2E |
| **外部API** | Confluence/JIRA/GitHub連携 | 統合 + E2E |
| **マイグレーション** | 既存設定の移行処理 | 統合 + E2E |
| **後方互換性** | 旧形式設定のサポート | 統合 |

#### 8.1.2 テスト優先順位

**P0 (Critical): リリースブロッカー**
- ConfigLoader の3層マージロジック
- 必須項目のバリデーション
- リポジトリURLパーサー
- `michi migrate` コマンド

**P1 (High): リリース前に必須**
- `michi init` コマンド（新規・既存）
- Confluence/JIRA/GitHub連携の動作確認
- 設定ファイルのパーミッション
- エラーメッセージの内容

**P2 (Medium): リリース後でも対応可能**
- 詳細なエラーメッセージ
- ドライランモード
- ロールバック機能
- 設定バリデーションの詳細

### 8.2 単体テスト

#### 8.2.1 ConfigLoader のテスト

**ファイル**: `src/config/__tests__/config-loader.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../config-loader.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('ConfigLoader', () => {
  let testDir: string;
  let globalEnvPath: string;
  let projectDir: string;

  beforeEach(() => {
    // テスト用の一時ディレクトリ作成
    testDir = join(tmpdir(), `michi-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // グローバル設定ディレクトリ
    globalEnvPath = join(testDir, '.michi', '.env');
    mkdirSync(join(testDir, '.michi'), { recursive: true });

    // プロジェクトディレクトリ
    projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, '.michi'), { recursive: true });

    // 環境変数を上書き
    process.env.HOME = testDir;
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('3層マージ', () => {
    it('グローバル設定を正しく読み込む', () => {
      // グローバル .env を作成
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
JIRA_URL=https://global.atlassian.net
GITHUB_TOKEN=global-token
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.confluence?.url).toBe('https://global.atlassian.net');
      expect(config.jira?.url).toBe('https://global.atlassian.net');
      expect(config.github?.token).toBe('global-token');
    });

    it('プロジェクト設定がグローバル設定を上書きする', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
GITHUB_TOKEN=global-token
      `.trim());

      // プロジェクト .env
      writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_URL=https://project.atlassian.net
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      // プロジェクト設定が優先される
      expect(config.confluence?.url).toBe('https://project.atlassian.net');
      // グローバル設定は保持される
      expect(config.github?.token).toBe('global-token');
    });

    it('プロジェクト config.json がグローバル設定を上書きする', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
      `.trim());

      // プロジェクト config.json
      writeFileSync(join(projectDir, '.michi', 'config.json'), JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-section'
        }
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.confluence?.url).toBe('https://global.atlassian.net');
      expect(config.confluence?.pageCreationGranularity).toBe('by-section');
    });

    it('優先順位: プロジェクト .env > プロジェクト config.json > グローバル .env', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_SPACE=GLOBAL
JIRA_PROJECT=GLOBAL
      `.trim());

      // プロジェクト config.json
      writeFileSync(join(projectDir, '.michi', 'config.json'), JSON.stringify({
        confluence: { space: 'CONFIG' },
        jira: { project: 'CONFIG' }
      }, null, 2));

      // プロジェクト .env
      writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_SPACE=PROJECT
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      // プロジェクト .env が最優先
      expect(config.confluence?.space).toBe('PROJECT');
      // プロジェクト config.json が次
      expect(config.jira?.project).toBe('CONFIG');
    });
  });

  describe('リポジトリURLパーサー', () => {
    it('HTTPS形式のURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo.git'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repository).toBe('https://github.com/myorg/myrepo.git');
      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
      expect(config.github?.repositoryShort).toBe('myorg/myrepo');
    });

    it('SSH形式のURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'git@github.com:myorg/myrepo.git'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
      expect(config.github?.repositoryShort).toBe('myorg/myrepo');
    });

    it('.git拡張子なしのURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
    });

    it('不正な形式のURLでエラーをスローする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'invalid-url'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow('Invalid GitHub repository URL');
    });
  });

  describe('バリデーション', () => {
    it('必須項目が不足している場合エラーをスローする', () => {
      // グローバル .env なし、プロジェクト .env も最小限
      writeFileSync(join(projectDir, '.env'), `
# 何も設定しない
      `.trim());

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow();
    });

    it('CONFLUENCE_URL が不正な場合エラーをスローする', () => {
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=not-a-url
      `.trim());

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow();
    });
  });

  describe('後方互換性', () => {
    it('GITHUB_REPO が .env に存在する場合、警告を表示する', () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      writeFileSync(join(projectDir, '.env'), `
GITHUB_REPO=myorg/myrepo
      `.trim());

      const loader = new ConfigLoader(projectDir);
      loader.load();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GITHUB_REPO is deprecated')
      );
    });

    it('project.json に repository が存在する場合、GITHUB_REPO は無視される', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/correct/repo.git'
      }, null, 2));

      writeFileSync(join(projectDir, '.env'), `
GITHUB_REPO=wrong/repo
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryShort).toBe('correct/repo');
    });
  });
});
```

#### 8.2.2 バリデーションのテスト

**ファイル**: `src/config/__tests__/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AppConfigSchema } from '../config-schema.js';

describe('設定バリデーション', () => {
  describe('Confluence設定', () => {
    it('有効なConfluence設定を受け入れる', () => {
      const config = {
        confluence: {
          url: 'https://example.atlassian.net',
          username: 'user@example.com',
          apiToken: 'token123',
          space: 'DEV',
          pageCreationGranularity: 'single'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });

    it('不正なURL形式を拒否する', () => {
      const config = {
        confluence: {
          url: 'not-a-url',
          username: 'user@example.com',
          apiToken: 'token123'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });

    it('pageCreationGranularityの不正な値を拒否する', () => {
      const config = {
        confluence: {
          url: 'https://example.atlassian.net',
          pageCreationGranularity: 'invalid-value'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });
  });

  describe('JIRA設定', () => {
    it('有効なJIRA設定を受け入れる', () => {
      const config = {
        jira: {
          url: 'https://example.atlassian.net',
          username: 'user@example.com',
          apiToken: 'token123',
          project: 'MYPROJ',
          createEpic: true,
          storyCreationGranularity: 'all'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe('GitHub設定', () => {
    it('有効なGitHub設定を受け入れる', () => {
      const config = {
        github: {
          token: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          username: 'octocat',
          email: 'octocat@github.com',
          org: 'myorg'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });

    it('トークンの形式を検証する', () => {
      const config = {
        github: {
          token: 'invalid-token-format',
          username: 'octocat'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });
  });
});
```

### 8.3 統合テスト

#### 8.3.1 コマンドラインテスト

**ファイル**: `src/__tests__/integration/cli.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('CLI統合テスト', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `michi-cli-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('michi init', () => {
    it('新規プロジェクトを初期化できる', () => {
      // Git リポジトリを初期化
      execSync('git init', { cwd: testDir });
      execSync('git config user.name "Test User"', { cwd: testDir });
      execSync('git config user.email "test@example.com"', { cwd: testDir });

      // michi init を実行（対話的入力をスキップするため --yes オプションを使用）
      const output = execSync('michi init --yes --project-id test-project', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      expect(output).toContain('プロジェクトの初期化が完了しました');
      expect(existsSync(join(testDir, '.michi', 'project.json'))).toBe(true);
      expect(existsSync(join(testDir, '.env'))).toBe(true);
    });

    it('既存プロジェクトにMichiを追加できる (--existing)', () => {
      // 既存のGitリポジトリをシミュレート
      execSync('git init', { cwd: testDir });
      execSync('git remote add origin https://github.com/test/repo.git', { cwd: testDir });

      const output = execSync('michi init --existing --yes', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      expect(output).toContain('既存プロジェクトへの追加が完了しました');

      // project.json の repository が自動設定される
      const projectJson = JSON.parse(
        readFileSync(join(testDir, '.michi', 'project.json'), 'utf-8')
      );
      expect(projectJson.repository).toBe('https://github.com/test/repo.git');
    });

    it('Gitリポジトリがない場合、--existing でエラーになる', () => {
      expect(() => {
        execSync('michi init --existing --yes', {
          cwd: testDir,
          encoding: 'utf-8'
        });
      }).toThrow();
    });
  });

  describe('michi migrate', () => {
    beforeEach(() => {
      // 旧形式の設定ファイルを作成
      mkdirSync(join(testDir, '.michi'), { recursive: true });

      writeFileSync(join(testDir, '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
CONFLUENCE_USERNAME=user@example.com
CONFLUENCE_API_TOKEN=token123
JIRA_URL=https://example.atlassian.net
JIRA_USERNAME=user@example.com
JIRA_API_TOKEN=token456
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=testuser
GITHUB_EMAIL=test@example.com
GITHUB_ORG=myorg
GITHUB_REPO=myorg/myrepo
      `.trim());

      writeFileSync(join(testDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project'
      }, null, 2));
    });

    it('設定を正しく移行する', () => {
      const output = execSync('michi migrate --force', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('設定の移行が完了しました');

      // グローバル .env が作成される
      const globalEnv = join(testDir, '.michi', '.env');
      expect(existsSync(globalEnv)).toBe(true);

      const globalContent = readFileSync(globalEnv, 'utf-8');
      expect(globalContent).toContain('CONFLUENCE_URL=');
      expect(globalContent).toContain('JIRA_URL=');
      expect(globalContent).toContain('GITHUB_TOKEN=');

      // プロジェクト .env から組織設定が削除される
      const projectEnv = readFileSync(join(testDir, '.env'), 'utf-8');
      expect(projectEnv).not.toContain('CONFLUENCE_URL=');
      expect(projectEnv).not.toContain('GITHUB_REPO=');

      // project.json に repository が追加される
      const projectJson = JSON.parse(
        readFileSync(join(testDir, '.michi', 'project.json'), 'utf-8')
      );
      expect(projectJson.repository).toBe('https://github.com/myorg/myrepo.git');
    });

    it('--dry-run で変更をシミュレートする', () => {
      const output = execSync('michi migrate --dry-run', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('ドライランモード');
      expect(output).toContain('実際の変更は行われませんでした');

      // ファイルが変更されていないことを確認
      const globalEnv = join(testDir, '.michi', '.env');
      expect(existsSync(globalEnv)).toBe(false);
    });

    it('バックアップを作成する', () => {
      execSync('michi migrate --force', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      // バックアップディレクトリが作成されている
      const backups = readdirSync(testDir).filter(f => f.startsWith('.michi-backup-'));
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('michi config:validate', () => {
    it('有効な設定を検証する', () => {
      // グローバル設定
      mkdirSync(join(testDir, '.michi'), { recursive: true });
      writeFileSync(join(testDir, '.michi', '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
JIRA_URL=https://example.atlassian.net
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      `.trim());

      // プロジェクト設定
      const projectDir = join(testDir, 'project');
      mkdirSync(join(projectDir, '.michi'), { recursive: true });
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo.git'
      }, null, 2));

      const output = execSync('michi config:validate', {
        cwd: projectDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('設定ファイルは有効です');
    });

    it('不正な設定でエラーを表示する', () => {
      mkdirSync(join(testDir, '.michi'), { recursive: true });
      writeFileSync(join(testDir, '.env'), `
CONFLUENCE_URL=not-a-url
      `.trim());

      expect(() => {
        execSync('michi config:validate', {
          cwd: testDir,
          encoding: 'utf-8'
        });
      }).toThrow();
    });
  });
});
```

#### 8.3.2 外部API連携テスト

**ファイル**: `src/__tests__/integration/external-api.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { ConfigLoader } from '../../config/config-loader.js';
import { ConfluenceClient } from '../../confluence/client.js';
import { JiraClient } from '../../jira/client.js';
import { GitHubClient } from '../../github/client.js';

// 注: これらのテストは実際のAPIキーが必要なため、CI環境では skip される
// ローカルで実行する場合は、~/.michi/.env に実際の認証情報を設定すること

describe('外部API連携テスト', () => {
  let config: ReturnType<ConfigLoader['load']>;

  beforeAll(() => {
    const loader = new ConfigLoader(process.cwd());
    config = loader.load();
  });

  describe('Confluence連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'Confluenceに接続できる',
      async () => {
        const client = new ConfluenceClient(config);
        const spaces = await client.getSpaces();

        expect(Array.isArray(spaces)).toBe(true);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'スペース情報を取得できる',
      async () => {
        const client = new ConfluenceClient(config);
        const space = await client.getSpace(config.confluence!.space!);

        expect(space).toBeDefined();
        expect(space.key).toBe(config.confluence!.space);
      }
    );
  });

  describe('JIRA連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'JIRAに接続できる',
      async () => {
        const client = new JiraClient(config);
        const projects = await client.getProjects();

        expect(Array.isArray(projects)).toBe(true);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'プロジェクト情報を取得できる',
      async () => {
        const client = new JiraClient(config);
        const project = await client.getProject(config.jira!.project!);

        expect(project).toBeDefined();
        expect(project.key).toBe(config.jira!.project);
      }
    );
  });

  describe('GitHub連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'GitHubに接続できる',
      async () => {
        const client = new GitHubClient(config);
        const user = await client.getCurrentUser();

        expect(user).toBeDefined();
        expect(user.login).toBe(config.github!.username);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'リポジトリ情報を取得できる',
      async () => {
        const client = new GitHubClient(config);
        const repo = await client.getRepository();

        expect(repo).toBeDefined();
        expect(repo.full_name).toBe(config.github!.repositoryShort);
      }
    );
  });
});
```

### 8.4 E2Eテスト

#### 8.4.1 完全なワークフローテスト

**ファイル**: `src/__tests__/e2e/full-workflow.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('E2E: 完全なワークフロー', () => {
  let testDir: string;
  let projectDir: string;

  beforeAll(() => {
    testDir = join(tmpdir(), `michi-e2e-${Date.now()}`);
    projectDir = join(testDir, 'my-project');

    mkdirSync(projectDir, { recursive: true });
    process.chdir(projectDir);

    // Git リポジトリを初期化
    execSync('git init', { cwd: projectDir });
    execSync('git config user.name "Test User"', { cwd: projectDir });
    execSync('git config user.email "test@example.com"', { cwd: projectDir });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('新規プロジェクト作成 → 設定 → Confluence同期', async () => {
    // ステップ1: プロジェクト初期化
    execSync('michi init --yes --project-id my-project', {
      cwd: projectDir,
      encoding: 'utf-8'
    });

    // ステップ2: グローバル設定を作成
    execSync('npm run config:global', {
      cwd: projectDir,
      input: 'n\nn\nn\n', // すべての設定をスキップ
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    // ステップ3: Confluence同期（ドライラン）
    const output = execSync(
      'michi confluence:sync test-feature requirements --dry-run',
      {
        cwd: projectDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      }
    );

    expect(output).toContain('ドライランモード');
  }, 30000); // 30秒タイムアウト

  it('既存プロジェクト → 移行 → 検証', async () => {
    // ステップ1: 旧形式の設定を作成
    mkdirSync(join(projectDir, '.michi'), { recursive: true });
    writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
GITHUB_REPO=myorg/myrepo
    `.trim());

    // ステップ2: 移行実行
    execSync('michi migrate --force', {
      cwd: projectDir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    // ステップ3: 設定検証
    const output = execSync('michi config:validate', {
      cwd: projectDir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    expect(output).toContain('設定ファイルは有効です');
  }, 30000);
});
```

### 8.5 カバレッジ目標

#### 8.5.1 目標値

| カテゴリ | 目標カバレッジ | 現在値 | 期限 |
|---------|-------------|--------|------|
| **全体** | 95% | TBD | リリース前 |
| **ConfigLoader** | 100% | TBD | Week 1 |
| **バリデーション** | 100% | TBD | Week 1 |
| **CLIコマンド** | 90% | TBD | Week 2 |
| **マイグレーション** | 95% | TBD | Week 2 |
| **外部API** | 80% | TBD | Week 3 |

#### 8.5.2 カバレッジ計測

```bash
# カバレッジレポートの生成
npm run test:coverage

# HTMLレポートの確認
open coverage/index.html

# 最小カバレッジのチェック（CI用）
npm run test:coverage -- --min-coverage=95
```

#### 8.5.3 除外項目

以下のファイルはカバレッジ計測から除外します：

- テストファイル: `**/*.test.ts`, `**/*.spec.ts`
- 型定義ファイル: `**/*.d.ts`
- 設定ファイル: `**/config/**/*.ts` (一部)
- CLIエントリポイント: `src/cli.ts` (メイン関数のみ)

### 8.6 テスト実行

#### 8.6.1 ローカルでのテスト実行

```bash
# すべてのテストを実行
npm run test

# 単体テストのみ
npm run test src/config/__tests__

# 統合テストのみ
npm run test src/__tests__/integration

# E2Eテストのみ
npm run test src/__tests__/e2e

# ウォッチモード（開発時）
npm run test -- --watch

# 特定のファイルのみ
npm run test src/config/__tests__/config-loader.test.ts
```

#### 8.6.2 CI/CDでのテスト実行

**GitHub Actions**: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run integration tests
        run: npm run test:run src/__tests__/integration
        env:
          RUN_INTEGRATION_TESTS: 'false'  # CI環境では外部APIテストをスキップ

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage threshold
        run: npm run test:coverage -- --min-coverage=95
```

#### 8.6.3 テスト実行のベストプラクティス

1. **開発時**
   - ウォッチモードで関連するテストのみを実行
   - 変更したファイルに対応するテストを優先

2. **コミット前**
   - すべての単体テストを実行
   - 関連する統合テストを実行

3. **PR作成時**
   - すべてのテストを実行
   - カバレッジレポートを確認

4. **リリース前**
   - すべてのテストを実行（E2E含む）
   - 外部APIテストを手動で実行
   - カバレッジが目標値を満たしているか確認

---

## 9. セキュリティとパフォーマンス

設定統一に伴うセキュリティとパフォーマンスの考慮事項です。

### 9.1 セキュリティ対策

#### 9.1.1 認証情報の保護

**脅威モデル**

| 脅威 | 影響 | 対策 |
|------|------|------|
| **認証情報の漏洩** | 高 | ファイルパーミッション、.gitignore |
| **環境変数の漏洩** | 中 | .env.example の提供、警告メッセージ |
| **不正アクセス** | 高 | 最小権限の原則、トークンの有効期限 |
| **中間者攻撃** | 中 | HTTPS必須、証明書検証 |

**実装されるセキュリティ対策**

1. **ファイルパーミッションの強制**

   ```typescript
   // scripts/utils/security.ts
   import { chmodSync, statSync } from 'fs';

   /**
    * 機密ファイルのパーミッションを強制する
    */
   export function enforceSecurePermissions(filePath: string): void {
     const stats = statSync(filePath);
     const mode = stats.mode & 0o777;

     // 600 (rw-------) 以外の場合は警告
     if (mode !== 0o600) {
       console.warn(`⚠️  警告: ${filePath} のパーミッションが不適切です`);
       console.warn(`   現在: ${mode.toString(8)}, 推奨: 600`);
       console.warn(`   自動的に 600 に変更します...`);

       chmodSync(filePath, 0o600);
       console.log(`✅ パーミッションを 600 に変更しました`);
     }
   }

   /**
    * グローバル .env ファイルの作成時にパーミッションを設定
    */
   export function createSecureEnvFile(filePath: string, content: string): void {
     writeFileSync(filePath, content, { mode: 0o600 });
     console.log(`✅ セキュアなファイルを作成しました: ${filePath}`);
   }
   ```

2. **.gitignore の自動更新**

   ```typescript
   // scripts/utils/gitignore.ts
   import { readFileSync, writeFileSync, existsSync } from 'fs';

   /**
    * .gitignore に機密ファイルを追加する
    */
   export function ensureGitignore(projectDir: string): void {
     const gitignorePath = join(projectDir, '.gitignore');
     const requiredEntries = [
       '.env',
       '.env.local',
       '~/.michi/.env',
       '.michi-backup-*/',
       '.michi/migration.log'
     ];

     let content = existsSync(gitignorePath)
       ? readFileSync(gitignorePath, 'utf-8')
       : '';

     let added = false;
     for (const entry of requiredEntries) {
       if (!content.includes(entry)) {
         content += `\n${entry}`;
         added = true;
       }
     }

     if (added) {
       writeFileSync(gitignorePath, content.trim() + '\n');
       console.log('✅ .gitignore を更新しました');
     }
   }
   ```

3. **環境変数の検証**

   ```typescript
   // src/config/validation.ts
   import { z } from 'zod';

   /**
    * 認証情報の形式を検証する
    */
   export const CredentialsSchema = z.object({
     // Atlassian API Token (24文字の英数字)
     confluenceApiToken: z.string()
       .min(24, 'API token is too short')
       .regex(/^[A-Za-z0-9]+$/, 'Invalid API token format'),

     jiraApiToken: z.string()
       .min(24, 'API token is too short')
       .regex(/^[A-Za-z0-9]+$/, 'Invalid API token format'),

     // GitHub Personal Access Token (ghp_ または ghp_classic プレフィックス)
     githubToken: z.string()
       .regex(
         /^(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})$/,
         'Invalid GitHub token format'
       ),
   });

   /**
    * 機密情報が含まれていないかチェック
    */
   export function detectSecretsInLogs(message: string): string {
     // トークンのパターンにマッチする部分をマスクする
     return message
       .replace(/ghp_[A-Za-z0-9]{36}/g, 'ghp_****')
       .replace(/github_pat_[A-Za-z0-9_]{82}/g, 'github_pat_****')
       .replace(/[A-Za-z0-9]{24,}/g, (match) => {
         // 24文字以上の英数字はトークンの可能性があるのでマスク
         return match.substring(0, 4) + '****';
       });
   }
   ```

#### 9.1.2 ファイルパーミッションの管理

**パーミッション設定基準**

| ファイル | パーミッション | 理由 |
|---------|--------------|------|
| `~/.michi/.env` | 600 (rw-------) | 組織の認証情報を含む |
| `.env` | 600 (rw-------) | プロジェクトの認証情報を含む |
| `.michi/config.json` | 644 (rw-r--r--) | 認証情報を含まない |
| `.michi/project.json` | 644 (rw-r--r--) | 認証情報を含まない |
| `.michi-backup-*/*` | 700 (rwx------) | バックアップディレクトリ |

**自動チェック機構**

```typescript
// src/config/config-loader.ts (updated)
export class ConfigLoader {
  private validateFilePermissions(): void {
    const sensitiveFiles = [
      this.globalEnvPath,
      join(this.projectDir, '.env')
    ];

    for (const filePath of sensitiveFiles) {
      if (!existsSync(filePath)) continue;

      const stats = statSync(filePath);
      const mode = stats.mode & 0o777;

      if (mode > 0o600) {
        throw new SecurityError(
          'INSECURE_PERMISSIONS',
          `File ${filePath} has insecure permissions: ${mode.toString(8)}`,
          { filePath, mode, expected: 0o600 }
        );
      }
    }
  }

  public load(): AppConfig {
    // パーミッションチェック
    this.validateFilePermissions();

    // 設定読み込み
    // ...
  }
}
```

#### 9.1.3 入力検証

**URL検証**

```typescript
// src/config/validators.ts
import { z } from 'zod';

/**
 * Atlassian URL（Confluence/JIRA）の検証
 */
export const AtlassianUrlSchema = z.string()
  .url('Invalid URL format')
  .regex(
    /^https:\/\/[a-zA-Z0-9-]+\.atlassian\.net$/,
    'Must be a valid Atlassian Cloud URL (https://xxx.atlassian.net)'
  );

/**
 * GitHub リポジトリURLの検証
 */
export const GitHubRepoUrlSchema = z.string()
  .refine(
    (url) => {
      const httpsPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+(\.git)?$/;
      const sshPattern = /^git@github\.com:[^/]+\/[^/]+(\.git)?$/;
      return httpsPattern.test(url) || sshPattern.test(url);
    },
    'Must be a valid GitHub repository URL'
  );

/**
 * メールアドレスの検証
 */
export const EmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long');
```

**コマンドインジェクション対策**

```typescript
// scripts/utils/exec-safe.ts
import { execSync } from 'child_process';

/**
 * 安全なコマンド実行（シェルインジェクション対策）
 */
export function execSafe(
  command: string,
  args: string[],
  options?: any
): string {
  // コマンドと引数を分離して実行
  // execSync の shell: false オプションを使用
  const fullCommand = `${command} ${args.map(escapeArg).join(' ')}`;

  return execSync(fullCommand, {
    ...options,
    shell: false, // シェルを経由しない
    encoding: 'utf-8'
  });
}

/**
 * シェル引数のエスケープ
 */
function escapeArg(arg: string): string {
  // シングルクォートで囲み、内部のシングルクォートをエスケープ
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
```

#### 9.1.4 セキュアなデフォルト設定

**デフォルト値の設計**

```typescript
// src/config/defaults.ts

export const SECURE_DEFAULTS = {
  // HTTPS 強制
  confluence: {
    useHttps: true,
    verifySsl: true,
  },

  jira: {
    useHttps: true,
    verifySsl: true,
  },

  github: {
    useHttps: true,
  },

  // API呼び出しのタイムアウト（DoS対策）
  api: {
    timeout: 30000, // 30秒
    maxRetries: 3,
    retryDelay: 1000, // 1秒
  },

  // ロギング
  logging: {
    maskSecrets: true, // 機密情報を自動マスク
    level: 'info',
  },
} as const;
```

**設定値のサニタイズ**

```typescript
// src/config/sanitize.ts

/**
 * ログ出力前に機密情報をマスクする
 */
export function sanitizeForLog(config: AppConfig): AppConfig {
  return {
    ...config,
    confluence: config.confluence ? {
      ...config.confluence,
      apiToken: '****',
      password: '****',
    } : undefined,
    jira: config.jira ? {
      ...config.jira,
      apiToken: '****',
      password: '****',
    } : undefined,
    github: config.github ? {
      ...config.github,
      token: config.github.token?.substring(0, 7) + '****',
    } : undefined,
  };
}
```

### 9.2 パフォーマンス最適化

#### 9.2.1 設定読み込みの最適化

**問題点**

- 毎回ファイルを読み込むとI/Oコストが高い
- 複数のコマンド実行時に同じファイルを何度も読む
- Zodバリデーションが重い

**解決策: キャッシュ機構**

```typescript
// src/config/config-loader.ts (updated)

export class ConfigLoader {
  private static cache: Map<string, {
    config: AppConfig;
    timestamp: number;
    hash: string;
  }> = new Map();

  private static CACHE_TTL = 60000; // 1分

  /**
   * ファイルのハッシュ値を計算
   */
  private getFileHash(filePath: string): string {
    if (!existsSync(filePath)) return '';

    const content = readFileSync(filePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * キャッシュキーを生成
   */
  private getCacheKey(): string {
    const globalHash = this.getFileHash(this.globalEnvPath);
    const projectConfigHash = this.getFileHash(this.projectConfigPath);
    const projectEnvHash = this.getFileHash(this.projectEnvPath);

    return `${globalHash}:${projectConfigHash}:${projectEnvHash}`;
  }

  /**
   * キャッシュから設定を取得
   */
  public load(options: { noCache?: boolean } = {}): AppConfig {
    const cacheKey = this.getCacheKey();
    const now = Date.now();

    // キャッシュチェック
    if (!options.noCache) {
      const cached = ConfigLoader.cache.get(cacheKey);
      if (cached && now - cached.timestamp < ConfigLoader.CACHE_TTL) {
        return cached.config;
      }
    }

    // 設定を読み込み
    const config = this.loadInternal();

    // キャッシュに保存
    ConfigLoader.cache.set(cacheKey, {
      config,
      timestamp: now,
      hash: cacheKey
    });

    return config;
  }

  /**
   * キャッシュをクリア
   */
  public static clearCache(): void {
    ConfigLoader.cache.clear();
  }
}
```

**ベンチマーク目標**

| 操作 | 目標時間 | 現在値 |
|------|---------|--------|
| 初回読み込み | < 100ms | TBD |
| キャッシュヒット | < 10ms | TBD |
| バリデーション | < 50ms | TBD |
| マージ処理 | < 20ms | TBD |

#### 9.2.2 メモリ使用量

**メモリプロファイリング**

```typescript
// scripts/benchmark/memory-profile.ts
import { ConfigLoader } from '../src/config/config-loader.js';

function measureMemoryUsage() {
  const before = process.memoryUsage();

  // 100回設定を読み込む
  for (let i = 0; i < 100; i++) {
    const loader = new ConfigLoader(process.cwd());
    loader.load();
  }

  const after = process.memoryUsage();

  console.log('Memory Usage:');
  console.log(`  Heap Used: ${(after.heapUsed - before.heapUsed) / 1024 / 1024}MB`);
  console.log(`  External: ${(after.external - before.external) / 1024 / 1024}MB`);
}

measureMemoryUsage();
```

**最適化目標**

- 1回の設定読み込み: < 5MB
- キャッシュ保持: < 10MB (100エントリ)
- ピークメモリ: < 50MB

#### 9.2.3 キャッシュ戦略

**多層キャッシュ**

```typescript
// src/config/cache-strategy.ts

interface CacheStrategy {
  get(key: string): AppConfig | null;
  set(key: string, value: AppConfig): void;
  invalidate(key: string): void;
  clear(): void;
}

/**
 * LRU（Least Recently Used）キャッシュ
 */
class LRUCache implements CacheStrategy {
  private cache: Map<string, { value: AppConfig; timestamp: number }>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): AppConfig | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // アクセスされたエントリを最後に移動（LRU）
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: AppConfig): void {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      // 最も古いエントリを削除
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * TTL（Time To Live）付きキャッシュ
 */
class TTLCache implements CacheStrategy {
  private cache: Map<string, { value: AppConfig; expiry: number }>;
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): AppConfig | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 有効期限チェック
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: AppConfig): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 9.3 監査とロギング

#### 9.3.1 設定変更の監査ログ

```typescript
// src/config/audit-log.ts
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  target: string;
  changes: Record<string, { old: any; new: any }>;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private logPath: string;

  constructor(projectDir: string) {
    this.logPath = join(projectDir, '.michi', 'audit.log');
  }

  /**
   * 設定変更を記録
   */
  public logConfigChange(
    action: string,
    target: string,
    changes: Record<string, { old: any; new: any }>,
    success: boolean,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      user: process.env.USER || 'unknown',
      action,
      target,
      changes: this.sanitizeChanges(changes),
      success,
      error
    };

    const logLine = JSON.stringify(entry) + '\n';

    if (!existsSync(this.logPath)) {
      writeFileSync(this.logPath, logLine, { mode: 0o600 });
    } else {
      appendFileSync(this.logPath, logLine);
    }
  }

  /**
   * 機密情報をマスク
   */
  private sanitizeChanges(
    changes: Record<string, { old: any; new: any }>
  ): Record<string, { old: any; new: any }> {
    const sensitiveKeys = ['apiToken', 'token', 'password', 'secret'];

    const sanitized: Record<string, { old: any; new: any }> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = {
          old: '****',
          new: '****'
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 監査ログを取得
   */
  public getAuditLog(limit?: number): AuditLogEntry[] {
    if (!existsSync(this.logPath)) return [];

    const content = readFileSync(this.logPath, 'utf-8');
    const lines = content.trim().split('\n');

    const entries = lines
      .map(line => {
        try {
          return JSON.parse(line) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is AuditLogEntry => entry !== null);

    if (limit) {
      return entries.slice(-limit);
    }

    return entries;
  }
}
```

**使用例**

```typescript
// michi migrate コマンド内
const auditLogger = new AuditLogger(projectDir);

try {
  // 移行前の設定を記録
  const oldConfig = readOldConfig();
  const newConfig = performMigration();

  // 変更内容を計算
  const changes = calculateChanges(oldConfig, newConfig);

  // 成功をログ
  auditLogger.logConfigChange(
    'migrate',
    '~/.michi/.env',
    changes,
    true
  );
} catch (error) {
  // 失敗をログ
  auditLogger.logConfigChange(
    'migrate',
    '~/.michi/.env',
    {},
    false,
    error.message
  );
  throw error;
}
```

#### 9.3.2 セキュリティイベントの記録

```typescript
// src/config/security-logger.ts

export class SecurityLogger {
  /**
   * 不正なアクセス試行を記録
   */
  public logUnauthorizedAccess(
    resource: string,
    reason: string
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'UNAUTHORIZED_ACCESS',
      resource,
      reason,
      user: process.env.USER,
      pid: process.pid
    };

    console.error('🚨 セキュリティイベント:', JSON.stringify(event));

    // セキュリティログに記録
    this.appendToSecurityLog(event);
  }

  /**
   * 機密ファイルへのアクセスを記録
   */
  public logSensitiveFileAccess(
    filePath: string,
    operation: 'read' | 'write'
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'SENSITIVE_FILE_ACCESS',
      filePath,
      operation,
      user: process.env.USER,
      pid: process.pid
    };

    this.appendToSecurityLog(event);
  }

  private appendToSecurityLog(event: any): void {
    const logPath = join(os.homedir(), '.michi', 'security.log');
    const logLine = JSON.stringify(event) + '\n';

    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, logLine, { mode: 0o600 });
  }
}
```

### 9.4 セキュリティチェックリスト

リリース前に確認すべき項目：

- [ ] すべての機密ファイルが .gitignore に追加されている
- [ ] ファイルパーミッションが適切（600 for .env files）
- [ ] Zodバリデーションがすべての入力に適用されている
- [ ] ログに機密情報が含まれていない
- [ ] HTTPS が強制されている
- [ ] エラーメッセージに内部情報が含まれていない
- [ ] セキュリティテストが全てパスしている
- [ ] 監査ログが正しく記録されている
- [ ] セキュリティドキュメントが最新である
- [ ] 脆弱性スキャンを実行している（npm audit）

---

## 10. 後方互換性

既存ユーザーへの影響を最小限に抑えるための後方互換性戦略です。

### 10.1 互換性レベル

#### 10.1.1 完全互換（継続サポート）

以下の機能は引き続きサポートされます：

| 機能 | 動作 | サポート期限 |
|------|------|------------|
| `.env` ファイル（プロジェクト） | 引き続き使用可能 | 無期限 |
| `.michi/config.json` | 引き続き使用可能 | 無期限 |
| `.michi/project.json` | 引き続き使用可能 | 無期限 |
| `npm run config:global` | グローバル設定作成 | 無期限 |
| 既存のCLIコマンド | すべて継続動作 | 無期限 |

#### 10.1.2 非推奨（Deprecated）

以下の機能は非推奨となりますが、当面は動作します：

| 機能 | 代替 | 廃止予定 | 動作 |
|------|------|---------|------|
| `GITHUB_REPO` (.env内) | `project.json.repository` | v1.0.0 | 警告を表示して継続 |
| `setup-existing` コマンド | `michi init --existing` | v0.6.0 | エイリアスとして動作 |
| `global.env` (名称) | `.env` | - | 廃止済み（設計段階で変更） |

#### 10.1.3 破壊的変更なし

**重要**: v0.5.0 では破壊的変更を含みません。

- 既存の設定ファイルはそのまま動作
- 既存のコマンドはそのまま動作
- 移行は任意（強制ではない）

### 10.2 移行期間の動作

#### 10.2.1 GITHUB_REPO の扱い

**Phase 1: 警告期間（v0.5.0 〜 v0.6.0）**

```typescript
// ConfigLoader 内の処理
if (projectEnv.GITHUB_REPO && !projectJson.repository) {
  console.warn(`
⚠️  警告: GITHUB_REPO は非推奨です

  現在の設定:
    .env: GITHUB_REPO=${projectEnv.GITHUB_REPO}

  推奨される設定:
    .michi/project.json: "repository": "https://github.com/${projectEnv.GITHUB_REPO}.git"

  移行方法:
    $ michi migrate
  `);

  // 後方互換性のため、GITHUB_REPO から repository を生成
  config.github.repository = `https://github.com/${projectEnv.GITHUB_REPO}.git`;
  config.github.repositoryShort = projectEnv.GITHUB_REPO;
}
```

**Phase 2: 移行推奨期間（v0.6.0 〜 v0.9.0）**

```typescript
if (projectEnv.GITHUB_REPO && !projectJson.repository) {
  console.error(`
❌ エラー: GITHUB_REPO は v1.0.0 で廃止されます

  今すぐ移行してください:
    $ michi migrate

  または手動で project.json に repository を追加:
    .michi/project.json: "repository": "https://github.com/${projectEnv.GITHUB_REPO}.git"
  `);

  // エラーではなく警告として扱い、動作は継続
  config.github.repository = `https://github.com/${projectEnv.GITHUB_REPO}.git`;
  config.github.repositoryShort = projectEnv.GITHUB_REPO;
}
```

**Phase 3: 廃止（v1.0.0 〜）**

```typescript
if (projectEnv.GITHUB_REPO && !projectJson.repository) {
  throw new ConfigValidationError(
    'GITHUB_REPO_DEPRECATED',
    'GITHUB_REPO is no longer supported. Please migrate to project.json.repository',
    []
  );
}
```

#### 10.2.2 setup-existing コマンドの扱い

**実装方針**: エイリアスとして実装し、`michi init --existing` を内部で呼び出す

```typescript
// src/cli.ts
program
  .command('setup-existing')
  .description('(非推奨) michi init --existing を使用してください')
  .action(async () => {
    console.warn(`
⚠️  警告: 'setup-existing' コマンドは非推奨です

  代わりに以下を使用してください:
    $ michi init --existing

  このコマンドは v0.6.0 で削除されます。
    `);

    // 3秒待機して、内部的に michi init --existing を実行
    await new Promise(resolve => setTimeout(resolve, 3000));

    // michi init --existing を実行
    await initCommand({ existing: true });
  });
```

### 10.3 バージョン間の互換性マトリクス

| 機能 | v0.4.0 (現在) | v0.5.0 (次) | v0.6.0 | v1.0.0 |
|------|-------------|-----------|--------|--------|
| **GITHUB_REPO** | ✅ サポート | ⚠️ 警告 | ⚠️ エラー警告 | ❌ 廃止 |
| **setup-existing** | ✅ サポート | ⚠️ 警告 | ❌ 廃止 | - |
| **~/.michi/.env** | ❌ 未サポート | ✅ サポート | ✅ サポート | ✅ サポート |
| **project.json.repository** | ❌ 未サポート | ✅ サポート | ✅ サポート | ✅ 必須 |
| **michi migrate** | ❌ 未サポート | ✅ サポート | ✅ サポート | ✅ サポート |

### 10.4 アップグレードガイド

#### 10.4.1 v0.4.0 → v0.5.0

**推奨手順**:

1. **バックアップ作成**
   ```bash
   cp -r .michi .michi.backup
   cp .env .env.backup
   ```

2. **Michi をアップグレード**
   ```bash
   npm install -g @sk8metal/michi-cli@latest
   ```

3. **移行ツールを実行**
   ```bash
   michi migrate
   ```

4. **動作確認**
   ```bash
   michi config:validate
   michi confluence:sync my-feature --dry-run
   ```

**何も変更したくない場合**:

- アップグレードのみ実行し、`michi migrate` は実行しない
- 既存の設定ファイルはそのまま動作します
- 警告メッセージが表示されますが、機能に影響はありません

#### 10.4.2 v0.5.0 → v1.0.0 (将来)

v1.0.0 リリース前に必須:

- [ ] `GITHUB_REPO` を `project.json.repository` に移行
- [ ] `setup-existing` の使用を `michi init --existing` に変更
- [ ] すべての警告メッセージを解消

### 10.5 ダウングレード

v0.5.0 から v0.4.0 へのダウングレードは可能ですが、以下の制限があります：

**ダウングレード手順**:

```bash
# 1. グローバル設定を .env に戻す
cat ~/.michi/.env >> .env

# 2. project.json から GITHUB_REPO を .env に追加
echo "GITHUB_REPO=myorg/myrepo" >> .env

# 3. Michi をダウングレード
npm install -g @sk8metal/michi-cli@0.4.0

# 4. グローバル設定を削除（オプション）
rm ~/.michi/.env
```

**注意**:
- 一度 v0.5.0 で作成した設定は、v0.4.0 では一部認識されません
- ダウングレードは緊急時のみ推奨されます

---

## 11. ロードマップ

設定統一機能の今後の開発計画です。

### 11.1 短期（v0.5.0 - v0.6.0）

**v0.5.0: 設定統一の導入（2025 Q1）**

- [x] 3層設定階層の実装
- [x] `~/.michi/.env` グローバル設定
- [x] `michi migrate` 移行ツール
- [x] `michi init --existing` 自動検出
- [x] ConfigLoader のキャッシュ機構
- [x] セキュリティ強化（パーミッション、バリデーション）
- [ ] テストカバレッジ 95%
- [ ] ドキュメント整備

**v0.5.1: バグ修正とフィードバック対応（2025 Q1）**

- [ ] ユーザーフィードバックに基づくバグ修正
- [ ] エラーメッセージの改善
- [ ] パフォーマンス最適化
- [ ] ドキュメントの改善

**v0.6.0: 非推奨機能の削除（2025 Q2）**

- [ ] `setup-existing` コマンドの完全削除
- [ ] `GITHUB_REPO` 廃止の準備（エラー警告に格上げ）
- [ ] 移行ツールの改善
- [ ] CI/CD テンプレートの提供

### 11.2 中期（v0.7.0 - v0.9.0）

**v0.7.0: マルチ組織サポート（2025 Q2-Q3）**

現在の制限事項：グローバル設定は1つの組織のみサポート

**提案される解決策：プロファイル機能**

```bash
# プロファイルの作成
$ michi profile create work
$ michi profile create personal

# プロファイルの切り替え
$ michi profile use work

# プロファイル一覧
$ michi profile list
  * work (active)
    personal

# プロファイルごとの設定
~/.michi/profiles/work/.env
~/.michi/profiles/personal/.env
```

**設定ファイル構造**:

```
~/.michi/
├── .env (デフォルトプロファイル)
├── profiles/
│   ├── work/
│   │   └── .env
│   └── personal/
│       └── .env
└── config.json (アクティブなプロファイル情報)
```

**v0.8.0: 設定のバリデーション強化（2025 Q3）**

- [ ] より詳細なエラーメッセージ
- [ ] 設定の自動修復機能
- [ ] 設定のインポート/エクスポート
- [ ] 設定のバックアップ/復元

**v0.9.0: パフォーマンス最適化（2025 Q4）**

- [ ] 設定読み込みの高速化（目標: <50ms）
- [ ] メモリ使用量の削減（目標: <30MB）
- [ ] 大規模プロジェクトでのパフォーマンステスト
- [ ] ベンチマーク結果の公開

### 11.3 長期（v1.0.0+）

**v1.0.0: 安定版リリース（2026 Q1）**

- [ ] すべての非推奨機能の削除
- [ ] `GITHUB_REPO` の完全廃止
- [ ] API の安定化
- [ ] セマンティックバージョニングの厳格化
- [ ] 長期サポート（LTS）の開始

**v1.1.0: 高度な設定管理（2026 Q2）**

- [ ] 設定の暗号化サポート
- [ ] 環境変数の動的置換（`${VAR}` 構文）
- [ ] 設定のテンプレート機能
- [ ] チーム間での設定共有機能

**v1.2.0: クラウド統合（2026 Q3）**

- [ ] 設定のクラウド同期（オプション）
- [ ] シークレット管理サービスとの統合
  - AWS Secrets Manager
  - Google Secret Manager
  - HashiCorp Vault
- [ ] チーム設定の一元管理

### 11.4 検討中の機能

以下の機能は将来的に検討されていますが、実装は未定です：

**設定のGUI管理**
- Webベースの設定管理インターフェース
- 視覚的な設定エディタ
- 設定の差分表示

**AI支援設定**
- プロジェクトの自動検出と推奨設定
- 設定エラーの自動修正
- 最適な設定の提案

**マルチプラットフォーム対応**
- Windows での完全サポート
- Dockerコンテナでの使用最適化
- CI/CD環境での専用サポート

### 11.5 コミュニティフィードバック

ロードマップは以下の方法でフィードバックを受け付けています：

- **GitHub Discussions**: 機能リクエスト、質問
- **GitHub Issues**: バグレポート、改善提案
- **Pull Requests**: 機能実装、ドキュメント改善

優先順位は以下の基準で決定されます：

1. ユーザーからの要望の多さ
2. セキュリティへの影響
3. 実装の複雑さ
4. 既存機能との互換性

---

## 付録 A: 用語集

このドキュメントで使用される主要な用語の定義です。

| 用語 | 定義 |
|------|------|
| **グローバル設定** | `~/.michi/.env` に保存される、すべてのプロジェクトで共有される設定 |
| **プロジェクト設定** | `.michi/config.json` に保存される、プロジェクト固有の設定 |
| **プロジェクト環境** | `.env` に保存される、プロジェクトの環境変数 |
| **3層マージ** | グローバル設定、プロジェクト設定、プロジェクト環境を統合するプロセス |
| **ConfigLoader** | 設定を読み込み、マージ、バリデーションを行うクラス |
| **マイグレーション** | 旧形式の設定を新形式に変換するプロセス |
| **後方互換性** | 既存のコードや設定が新バージョンでも動作すること |
| **非推奨（Deprecated）** | 将来削除される予定の機能 |

---

## 付録 B: FAQ（よくある質問）

### B.1 一般的な質問

**Q: なぜグローバル設定が必要なのですか？**

A: 複数のMichiプロジェクトを管理している場合、Confluence/JIRA/GitHubの認証情報は組織で共通です。グローバル設定により、これらを1箇所で管理でき、各プロジェクトで重複して設定する必要がなくなります。

**Q: グローバル設定を使わずに、プロジェクトごとに設定したい場合は？**

A: グローバル設定は任意です。`.env` ファイルにすべての設定を記述すれば、グローバル設定なしでも動作します。

**Q: 複数の組織に所属している場合はどうすればいいですか？**

A: 現在（v0.5.0）はグローバル設定は1つの組織のみサポートしています。他の組織のプロジェクトでは `.env` に直接認証情報を記述してください。v0.7.0 でプロファイル機能を追加予定です（Section 11参照）。

### B.2 移行に関する質問

**Q: 既存のプロジェクトを移行する必要がありますか？**

A: いいえ、移行は任意です。既存の設定はそのまま動作します。ただし、グローバル設定を使用すると設定管理が簡単になるため、移行を推奨します。

**Q: 移行に失敗した場合、元に戻せますか？**

A: はい、`michi migrate` は自動的にバックアップを作成します。`michi migrate --rollback <backup-dir>` で元に戻せます。

**Q: 移行後、GITHUB_REPO を削除しても大丈夫ですか？**

A: はい、`project.json` に `repository` が設定されていれば、`.env` の `GITHUB_REPO` は不要です。移行ツールが自動的に削除します。

### B.3 セキュリティに関する質問

**Q: ~/.michi/.env のパーミッションはどうすればいいですか？**

A: 600 (rw-------) が推奨です。`michi migrate` が自動的に設定します。手動で作成した場合は `chmod 600 ~/.michi/.env` を実行してください。

**Q: .env ファイルを Git にコミットしてしまいました。どうすればいいですか？**

A: 以下の手順で対処してください：

1. `.env` を `.gitignore` に追加
2. Git履歴から `.env` を削除: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all`
3. 認証情報をすべて再生成（漏洩したものとして扱う）
4. 新しい認証情報で `.env` を更新

**Q: パスワードやトークンはどのように保存されますか？**

A: 平文で `.env` ファイルに保存されます。ファイルパーミッション（600）により、他のユーザーからの読み取りは防止されますが、暗号化はされません。より高度なセキュリティが必要な場合は、v1.2.0 で実装予定のシークレット管理サービス統合をお待ちください。

### B.4 パフォーマンスに関する質問

**Q: 設定の読み込みが遅いのですが？**

A: ConfigLoader はキャッシュ機構を持っており、2回目以降の読み込みは高速です。それでも遅い場合は、以下を確認してください：
- ネットワークドライブ上のプロジェクトではないか
- アンチウイルスソフトが `.env` ファイルをスキャンしていないか

**Q: メモリ使用量が多いのですが？**

A: 通常、設定読み込みは 5MB 未満のメモリを使用します。異常に多い場合は、キャッシュをクリアしてみてください：`ConfigLoader.clearCache()`

### B.5 トラブルシューティング

**Q: "CONFLUENCE_URL is required" エラーが出ます**

A: グローバル設定またはプロジェクト設定に `CONFLUENCE_URL` が設定されているか確認してください。`npm run config:validate` で設定を検証できます。

**Q: "Invalid repository URL" エラーが出ます**

A: `project.json` の `repository` フィールドが正しい形式か確認してください。有効な形式：
- `https://github.com/org/repo.git`
- `git@github.com:org/repo.git`

**Q: 設定ファイルが見つからないと言われます**

A: 現在のディレクトリがMichiプロジェクトのルートか確認してください。`ls .michi` でディレクトリが存在するか確認できます。

---

## 付録 C: トラブルシューティング

詳細なトラブルシューティングガイドです。Section 7.7 も参照してください。

### C.1 診断コマンド

**設定の確認**

```bash
# 設定のバリデーション
michi config:validate

# 設定の詳細表示（機密情報はマスクされる）
michi config:show

# 現在読み込まれている設定のパスを表示
michi config:paths
```

**ファイルの確認**

```bash
# グローバル設定の存在確認
ls -la ~/.michi/.env

# プロジェクト設定の確認
ls -la .michi/config.json .michi/project.json .env

# パーミッションの確認
stat -f "%A %N" ~/.michi/.env .env
```

### C.2 一般的な問題と解決策

**問題: "Permission denied" エラー**

```bash
# パーミッションを確認
ls -l ~/.michi/.env

# 600 に修正
chmod 600 ~/.michi/.env
```

**問題: "File not found" エラー**

```bash
# ファイルが存在するか確認
test -f ~/.michi/.env && echo "存在する" || echo "存在しない"

# 存在しない場合は作成
mkdir -p ~/.michi
touch ~/.michi/.env
chmod 600 ~/.michi/.env
```

**問題: "Invalid configuration" エラー**

```bash
# 設定をバリデーション
michi config:validate

# エラーメッセージを確認し、該当する項目を修正
```

### C.3 ログの確認

**移行ログ**

```bash
# 移行の詳細ログを確認
cat .michi/migration.log

# 最新10件のエラーを表示
grep ERROR .michi/migration.log | tail -10
```

**監査ログ**

```bash
# 設定変更の履歴を確認
cat .michi/audit.log | jq '.'

# 最新の変更を表示
cat .michi/audit.log | jq '.' | tail -1
```

**セキュリティログ**

```bash
# セキュリティイベントを確認
cat ~/.michi/security.log | jq '.'
```

### C.4 デバッグモード

**環境変数でデバッグログを有効化**

```bash
# デバッグログを有効化
export MICHI_DEBUG=true

# コマンド実行
michi config:validate

# 詳細ログが出力される
```

### C.5 サポート

問題が解決しない場合は、以下の情報とともに GitHub Issues で報告してください：

1. **環境情報**
   ```bash
   michi --version
   node --version
   npm --version
   uname -a
   ```

2. **エラーメッセージ全文**

3. **再現手順**

4. **設定ファイル**（機密情報は削除してください）

---

## 付録 D: 設定例集

実際のプロジェクトでの設定例です。

### D.1 シンプルな構成

**~/.michi/.env**

```bash
# 組織共通設定
CONFLUENCE_URL=https://mycompany.atlassian.net
CONFLUENCE_USERNAME=developer@mycompany.com
CONFLUENCE_API_TOKEN=your-api-token-here

JIRA_URL=https://mycompany.atlassian.net
JIRA_USERNAME=developer@mycompany.com
JIRA_API_TOKEN=your-api-token-here

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.michi/project.json**

```json
{
  "projectId": "web-app",
  "repository": "https://github.com/mycompany/web-app.git"
}
```

**.env**

```bash
# プロジェクト固有の設定（なし）
```

### D.2 複雑な構成

**~/.michi/.env**

```bash
# 組織共通設定
CONFLUENCE_URL=https://mycompany.atlassian.net
CONFLUENCE_USERNAME=developer@mycompany.com
CONFLUENCE_API_TOKEN=your-api-token-here
CONFLUENCE_SPACE=DEV

JIRA_URL=https://mycompany.atlassian.net
JIRA_USERNAME=developer@mycompany.com
JIRA_API_TOKEN=your-api-token-here

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.michi/config.json**

```json
{
  "confluence": {
    "pageCreationGranularity": "by-section",
    "pageTitleFormat": "[Web App] {featureName}",
    "hierarchy": {
      "mode": "nested",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "by-phase",
    "selectedPhases": ["implementation", "testing"],
    "storyPoints": "auto"
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"],
    "approvalGates": {
      "requirements": ["pm", "architect"],
      "design": ["architect", "tech-lead"],
      "release": ["pm", "director"]
    }
  }
}
```

**.michi/project.json**

```json
{
  "projectId": "web-app",
  "repository": "https://github.com/mycompany/web-app.git"
}
```

**.env**

```bash
# プロジェクト固有の Confluence スペース
CONFLUENCE_SPACE=WEBAPP

# プロジェクト固有の JIRA プロジェクト
JIRA_PROJECT=WEB
```

### D.3 マルチ環境構成

本番環境と開発環境で異なる設定を使用する例：

**~/.michi/.env** (共通)

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.env.development**

```bash
CONFLUENCE_URL=https://dev.atlassian.net
CONFLUENCE_SPACE=DEV
JIRA_URL=https://dev.atlassian.net
JIRA_PROJECT=DEV
```

**.env.production**

```bash
CONFLUENCE_URL=https://prod.atlassian.net
CONFLUENCE_SPACE=PROD
JIRA_URL=https://prod.atlassian.net
JIRA_PROJECT=PROD
```

**使用方法**:

```bash
# 開発環境
cp .env.development .env
michi confluence:sync my-feature

# 本番環境
cp .env.production .env
michi confluence:sync my-feature
```

---

## 付録 E: 移行チェックリスト

v0.4.0 から v0.5.0 への移行時に確認すべき項目のチェックリストです。

### E.1 移行前の準備

- [ ] 現在の Michi バージョンを確認: `michi --version`
- [ ] すべての変更をコミット: `git status` で確認
- [ ] バックアップを作成
  - [ ] `.michi/` ディレクトリ
  - [ ] `.env` ファイル
  - [ ] `project.json` ファイル

### E.2 アップグレード

- [ ] Michi を最新版にアップグレード: `npm install -g @sk8metal/michi-cli@latest`
- [ ] バージョンを確認: `michi --version` が v0.5.0 以上であること

### E.3 グローバル設定の作成

- [ ] グローバル設定ディレクトリを作成: `mkdir -p ~/.michi`
- [ ] グローバル .env を作成: `touch ~/.michi/.env`
- [ ] パーミッションを設定: `chmod 600 ~/.michi/.env`
- [ ] 認証情報をグローバル .env に記入
  - [ ] CONFLUENCE_URL
  - [ ] CONFLUENCE_USERNAME
  - [ ] CONFLUENCE_API_TOKEN
  - [ ] JIRA_URL
  - [ ] JIRA_USERNAME
  - [ ] JIRA_API_TOKEN
  - [ ] GITHUB_TOKEN
  - [ ] GITHUB_USERNAME
  - [ ] GITHUB_EMAIL
  - [ ] GITHUB_ORG

### E.4 プロジェクトごとの移行

各プロジェクトで以下を実行：

- [ ] プロジェクトディレクトリに移動
- [ ] 移行を実行: `michi migrate`
  - または、最初にドライランで確認: `michi migrate --dry-run`
- [ ] バックアップが作成されたことを確認: `ls .michi-backup-*`
- [ ] グローバル設定が作成されたことを確認: `ls ~/.michi/.env`
- [ ] プロジェクト .env から組織設定が削除されたことを確認
  - [ ] `grep CONFLUENCE_URL .env` が何も返さない
  - [ ] `grep GITHUB_TOKEN .env` が何も返さない
- [ ] project.json に repository が追加されたことを確認
  - [ ] `cat .michi/project.json | grep repository`

### E.5 動作確認

- [ ] 設定のバリデーション: `michi config:validate`
- [ ] Confluence同期テスト: `michi confluence:sync test-feature --dry-run`
- [ ] JIRA同期テスト: `michi jira:sync test-feature --dry-run`
- [ ] GitHub PRテスト: `michi github:pr --info`

### E.6 クリーンアップ

- [ ] バックアップが不要なら削除: `rm -rf .michi-backup-*`
- [ ] 古い .env.backup が不要なら削除: `rm .env.backup`
- [ ] .gitignore に機密ファイルが追加されていることを確認
  - [ ] `.env`
  - [ ] `.michi-backup-*/`
  - [ ] `.michi/migration.log`

### E.7 ドキュメント更新

- [ ] README に新しい設定方法を記載
- [ ] チームメンバーに移行方法を共有
- [ ] CI/CD パイプラインの更新（必要な場合）

---

## まとめ

この設計ドキュメントでは、Michiプロジェクトの設定統一について詳細に説明しました。

### 主要な変更点

1. **3層設定階層**: グローバル → プロジェクト → 環境の3層で設定を管理
2. **グローバル設定**: `~/.michi/.env` で組織共通の認証情報を一元管理
3. **リポジトリURL統一**: `GITHUB_REPO` を廃止し、`project.json.repository` に統一
4. **コマンド統一**: `setup-existing` を廃止し、`michi init --existing` に統一
5. **自動移行ツール**: `michi migrate` で既存プロジェクトを簡単に移行

### 次のステップ

1. **v0.5.0 リリース**: このドキュメントに基づいて実装
2. **ユーザーフィードバック収集**: 実際の使用感を確認
3. **v0.6.0 準備**: 非推奨機能の削除計画
4. **長期計画**: マルチ組織サポート、暗号化、クラウド統合

### 貢献

このプロジェクトへの貢献を歓迎します：

- **バグレポート**: GitHub Issues
- **機能リクエスト**: GitHub Discussions
- **コード貢献**: Pull Requests
- **ドキュメント改善**: Pull Requests

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-12
**Authors**: Michi Development Team
**Status**: Final Draft

---

