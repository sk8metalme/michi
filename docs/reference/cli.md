# CLIコマンドリファレンス

Michiが提供する全CLIコマンドの詳細リファレンスです。

## コマンド一覧

### 初期化・セットアップ

- [init](#init) - プロジェクト初期化
- [setup-existing](#setup-existing) - 既存プロジェクトセットアップ（非推奨）
- [migrate](#migrate) - 設定移行

### JIRA連携

- [jira:sync](#jirasync) - JIRA同期
- [jira:transition](#jiratransition) - JIRAステータス変更
- [jira:comment](#jiracomment) - JIRAコメント追加

### Confluence連携

- [confluence:sync](#confluencesync) - Confluence同期

### ワークフロー

- [phase:run](#phaserun) - フェーズ実行
- [validate:phase](#validatephase) - フェーズ検証
- [workflow:run](#workflowrun) - ワークフロー統合実行

### 仕様管理

- [spec:archive](#specarchive) - 仕様アーカイブ
- [spec:list](#speclist) - 仕様一覧

### タスク管理

- [tasks:convert](#tasksconvert) - タスク形式変換

### Multi-Repoプロジェクト

- [multi-repo:init](#multi-repoinit) - Multi-Repo初期化
- [multi-repo:add-repo](#multi-repoadd-repo) - リポジトリ追加
- [multi-repo:list](#multi-repolist) - プロジェクト一覧
- [multi-repo:ci-status](#multi-repoci-status) - CI結果集約
- [multi-repo:sync](#multi-reposync) - ドキュメント同期
- [multi-repo:confluence-sync](#multi-repoconfluence-sync) - Confluence同期（Multi-Repo）
- [multi-repo:test](#multi-repotest) - テスト実行

### 検証・チェック

- [preflight](#preflight) - 事前チェック
- [config:validate](#configvalidate) - 設定検証
- [config:check-security](#configcheck-security) - セキュリティチェック

---

## 詳細リファレンス

### init

プロジェクトを初期化します。新規プロジェクトと既存プロジェクトの両方に対応します。

#### 構文

```bash
michi init [options]
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--name <project-id>` | プロジェクトID | ディレクトリ名 |
| `--project-name <name>` | プロジェクト名 | - |
| `--jira-key <key>` | JIRAプロジェクトキー | - |
| `--existing` | 既存プロジェクトモード | 自動検出 |
| `--michi-path <path>` | Michiリポジトリパス（テンプレートコピー用） | - |
| `--skip-config` | ワークフロー設定のスキップ | false |
| `-y, --yes` | 確認プロンプトをスキップ | false |
| `--claude` | Claude Code環境を使用 | - |
| `--claude-agent` | Claude Code Subagents環境を使用（推奨） | - |
| `--lang <code>` | 言語コード | `ja` |

#### 使用例

##### 新規プロジェクト（対話的）

```bash
michi init --claude-agent
```

環境オプションを指定すると、プロジェクトID、プロジェクト名、JIRAキーを対話的に入力します。

##### 既存プロジェクト（自動検出）

```bash
cd existing-project
michi init --claude-agent
```

`package.json`, `pom.xml`, `build.gradle`, `composer.json` が存在する場合、既存プロジェクトとして自動検出されます。

##### 非対話モード

```bash
michi init \
  --name my-project \
  --project-name "My Project" \
  --jira-key MYPRJ \
  --claude-agent \
  --yes
```

#### 実行内容

1. `.kiro/` ディレクトリ構造作成
2. プロジェクトメタデータ作成（`.kiro/project.json`）
3. `.env` テンプレート作成
4. テンプレート・ルールのコピー
5. ワークフロー設定（`.michi/config.json`）

---

### setup-existing

**非推奨**: `michi init --existing` を使用してください。

既存プロジェクトにMichiをセットアップします。

#### 構文

```bash
michi setup-existing [options]
```

#### オプション

`init` コマンドと同様です。

---

### migrate

`.env` ファイルを新しい3層設定形式に移行します。

#### 構文

```bash
michi migrate [options]
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `--dry-run` | 変更をプレビュー（ファイル変更なし） |
| `--backup-dir <dir>` | バックアップディレクトリ指定 |
| `--force` | 確認プロンプトをスキップ |
| `--verbose` | 詳細ログ表示 |
| `--rollback <dir>` | バックアップから復元 |

#### 使用例

##### プレビュー

```bash
michi migrate --dry-run
```

##### 実行

```bash
michi migrate
```

##### ロールバック

```bash
michi migrate --rollback .michi-backup-20240101120000
```

---

### jira:sync

`tasks.md` をJIRAに同期します。Epic/Story/Subtaskを自動作成します。

#### 構文

```bash
michi jira:sync <feature>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<feature>` | 機能名（`.kiro/specs/<feature>/tasks.md` を使用） |

#### 使用例

```bash
michi jira:sync user-authentication
```

`.kiro/specs/user-authentication/tasks.md` の内容をJIRAに同期します。

---

### jira:transition

JIRAチケットのステータスを変更します。

#### 構文

```bash
michi jira:transition <issueKey> <status>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<issueKey>` | JIRAチケットキー（例: PROJ-123） |
| `<status>` | 変更先ステータス名（例: "In Progress"） |

#### 使用例

```bash
michi jira:transition PROJ-123 "In Progress"
```

---

### jira:comment

JIRAチケットにコメントを追加します。

#### 構文

```bash
michi jira:comment <issueKey> <comment>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<issueKey>` | JIRAチケットキー（例: PROJ-123） |
| `<comment>` | コメントテキスト |

#### 使用例

```bash
michi jira:comment PROJ-123 "実装が完了しました"
```

---

### confluence:sync

仕様ドキュメントをConfluenceに同期します。

#### 構文

```bash
michi confluence:sync <feature> [type]
```

#### 引数

| 引数 | 説明 | デフォルト |
|------|------|-----------|
| `<feature>` | 機能名 | - |
| `[type]` | ドキュメントタイプ（requirements, design, tasks） | `requirements` |

#### 使用例

##### 要件定義を同期

```bash
michi confluence:sync user-authentication requirements
```

##### 設計書を同期

```bash
michi confluence:sync user-authentication design
```

---

### phase:run

フェーズを実行します。

#### 構文

```bash
michi phase:run <feature> <phase>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<feature>` | 機能名 |
| `<phase>` | フェーズ名（requirements, design, tasks, environment-setup, phase-a, phase-b） |

#### 使用例

```bash
michi phase:run user-authentication requirements
```

---

### validate:phase

フェーズ完了を検証します。

#### 構文

```bash
michi validate:phase <feature> <phase>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<feature>` | 機能名 |
| `<phase>` | フェーズ名（requirements, design, tasks, environment-setup, phase-a, phase-b） |

#### 使用例

```bash
michi validate:phase user-authentication requirements
```

---

### workflow:run

ワークフロー全体を実行します。

#### 構文

```bash
michi workflow:run --feature <name>
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `--feature <name>` | 機能名（必須） |

#### 使用例

```bash
michi workflow:run --feature user-authentication
```

---

### spec:archive

完了した仕様をアーカイブします。

#### 構文

```bash
michi spec:archive <feature> [options]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<feature>` | 機能名 |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--reason <reason>` | アーカイブ理由 |

#### 使用例

```bash
michi spec:archive user-authentication --reason "リリース完了"
```

---

### spec:list

仕様一覧を表示します。

#### 構文

```bash
michi spec:list [options]
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `--all` | アーカイブ済み仕様も含める |

#### 使用例

##### アクティブ仕様のみ

```bash
michi spec:list
```

##### すべての仕様（アーカイブ含む）

```bash
michi spec:list --all
```

---

### tasks:convert

AI-DLC形式の `tasks.md` をMichiワークフロー形式に変換します。

#### 構文

```bash
michi tasks:convert <feature> [options]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<feature>` | 機能名 |

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--dry-run` | プレビュー（ファイル変更なし） | false |
| `--backup` | オリジナルファイルをバックアップ | false |
| `--lang <code>` | 出力言語（ja/en） | `ja` |

#### 使用例

##### プレビュー

```bash
michi tasks:convert user-authentication --dry-run
```

##### 実行（バックアップ付き）

```bash
michi tasks:convert user-authentication --backup
```

---

### multi-repo:init

Multi-Repoプロジェクトを初期化します。

#### 構文

```bash
michi multi-repo:init <project-name> --jira <KEY> --confluence-space <SPACE>
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<project-name>` | プロジェクト名 |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--jira <KEY>` | JIRAプロジェクトキー（2-10文字の大文字英字） |
| `--confluence-space <SPACE>` | Confluenceスペースキー |

#### 使用例

```bash
michi multi-repo:init my-multi-project \
  --jira MULTI \
  --confluence-space PRD
```

---

### multi-repo:add-repo

Multi-Repoプロジェクトにリポジトリを追加します。

#### 構文

```bash
michi multi-repo:add-repo <project-name> --name <repo-name> --url <URL> [--branch <branch>]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<project-name>` | プロジェクト名 |

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--name <repo-name>` | リポジトリ名 | - |
| `--url <URL>` | リポジトリURL（GitHub HTTPS形式） | - |
| `--branch <branch>` | ブランチ名 | `main` |

#### 使用例

```bash
michi multi-repo:add-repo my-multi-project \
  --name frontend \
  --url https://github.com/org/frontend \
  --branch develop
```

---

### multi-repo:list

Multi-Repoプロジェクト一覧を表示します。

#### 構文

```bash
michi multi-repo:list
```

#### 使用例

```bash
michi multi-repo:list
```

---

### multi-repo:ci-status

Multi-RepoプロジェクトのCI結果を集約します。

#### 構文

```bash
michi multi-repo:ci-status <project-name> [--diff]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<project-name>` | プロジェクト名 |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--diff` | 前回結果との差分を表示 |

#### 使用例

```bash
michi multi-repo:ci-status my-multi-project --diff
```

---

### multi-repo:sync

Multi-RepoプロジェクトのドキュメントをConfluenceに同期します。

#### 構文

```bash
michi multi-repo:sync <project-name> [--doc-type <type>]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<project-name>` | プロジェクト名 |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--doc-type <type>` | ドキュメントタイプ（requirements, architecture, sequence, strategy, ci-status, release-notes） |

#### 使用例

##### 全ドキュメント同期

```bash
michi multi-repo:sync my-multi-project
```

##### 特定ドキュメント同期

```bash
michi multi-repo:sync my-multi-project --doc-type ci-status
```

---

### multi-repo:confluence-sync

`multi-repo:sync` のエイリアスです。同じ動作をします。

---

### multi-repo:test

Multi-Repoプロジェクトのテストを実行します。

#### 構文

```bash
michi multi-repo:test <project-name> --type <type> [--skip-health-check]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `<project-name>` | プロジェクト名 |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--type <type>` | テストタイプ（e2e, integration, performance） |
| `--skip-health-check` | ヘルスチェックをスキップ |

#### 使用例

```bash
michi multi-repo:test my-multi-project --type e2e
```

---

### preflight

事前チェックを実行します。

#### 構文

```bash
michi preflight [phase]
```

#### 引数

| 引数 | 説明 | デフォルト |
|------|------|-----------|
| `[phase]` | チェックフェーズ（confluence, jira, all） | `all` |

#### 使用例

##### すべてチェック

```bash
michi preflight
```

##### JIRA接続のみチェック

```bash
michi preflight jira
```

---

### config:validate

`.michi/config.json` を検証します。

#### 構文

```bash
michi config:validate
```

#### 使用例

```bash
michi config:validate
```

---

### config:check-security

環境変数と設定のセキュリティチェックを実行します。

#### 構文

```bash
michi config:check-security
```

#### 使用例

```bash
michi config:check-security
```

---

## 終了コード

Michiコマンドは以下の終了コードを返します：

| コード | 意味 |
|--------|------|
| 0 | 成功 |
| 1 | エラー |

シェルスクリプトやCI/CDパイプラインで終了コードを確認できます：

```bash
michi preflight
if [ $? -eq 0 ]; then
  echo "✅ チェック成功"
else
  echo "❌ チェック失敗"
  exit 1
fi
```

---

## 環境変数

詳細は [環境設定ガイド](../getting-started/configuration.md) を参照してください。
