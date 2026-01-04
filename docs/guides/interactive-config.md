# 対話的設定ガイド

このガイドでは、Michiの対話的設定機能を使って、各種設定ファイルを作成する方法を説明します。

## 目次

1. [コマンド一覧](#コマンド一覧)
2. [設定ファイルの種類](#設定ファイルの種類)
3. [使い方](#使い方)
4. [3層設定アーキテクチャ](#3層設定アーキテクチャ)
5. [セキュリティ](#セキュリティ)

---

## コマンド一覧

| コマンド | 作成ファイル | 説明 |
|---------|-------------|------|
| `michi init` | `.kiro/`, `.env`(テンプレート), `.michi/config.json` | プロジェクト全体の初期化 |
| `michi config:init` | すべての設定ファイル（`--all`オプション時） | 対話的に設定ファイルを作成 |
| `michi config:init --global` | `~/.michi/config.json` | グローバル設定を対話的に作成 |
| `michi config:init --global-env` | `~/.michi/.env` | グローバル.envを対話的に作成 |
| `michi config:init --project` | `.michi/config.json` | プロジェクト設定を対話的に作成 |
| `michi config:init --env` | `.env` | プロジェクト.envを対話的に作成 |
| `michi config:init --all` | 上記すべて | 全設定ファイルを作成 |

### michi init と michi config:init の違い

- **`michi init`**: プロジェクトの初期化（.kiroディレクトリ構造、プロジェクトメタデータ作成）
  - `.env`はテンプレートのみ（値の入力なし）
  - `.michi/config.json`はグローバル設定をコピー、またはデフォルト値を使用

- **`michi config:init`**: 設定ファイルの対話的作成（値を入力）
  - `.env`の各項目を対話的に入力（APIトークンはパスワード非表示）
  - `.michi/config.json`も対話的に作成可能

---

## 設定ファイルの種類

### 1. グローバル設定 (`~/.michi/config.json`)

すべてのプロジェクトに適用される共通設定です。

**含まれる内容:**
- Confluence設定（ページ作成粒度）
- JIRA設定（Epic作成、ストーリー作成粒度、ストーリーポイント）
- ワークフロー設定（有効なフェーズ）

**作成方法:**
```bash
michi config:init --global
```

### 2. グローバル環境変数 (`~/.michi/.env`)

すべてのプロジェクトで使用する環境変数です（機密情報）。

**含まれる内容:**
- Atlassian連携（URL、Email、APIトークン）
- GitHub連携（Organization、Personalトークン）
- Confluence Space設定
- JIRAプロジェクトキー

**作成方法:**
```bash
michi config:init --global-env
```

### 3. プロジェクト設定 (`.michi/config.json`)

プロジェクト固有の設定です。グローバル設定を上書きできます。

**作成方法:**
```bash
michi config:init --project
```

### 4. プロジェクト環境変数 (`.env`)

プロジェクト固有の環境変数です。グローバル環境変数を上書きできます。

**作成方法:**
```bash
michi config:init --env
```

---

## 使い方

### 基本的な使い方

#### 1. プロジェクト初期化時

プロジェクト新規作成時は、まず `michi init` でプロジェクト構造を作成します。

```bash
cd your-project
michi init
```

`.env` と `.michi/config.json` はテンプレートまたはデフォルト値で作成されます。

#### 2. 機密情報を含む .env の作成

APIトークンなどの機密情報を対話的に入力して、`.env` を作成します。

```bash
michi config:init --env
```

**入力例:**
```
========================================
 .env Interactive Setup
========================================

設定ファイル: /path/to/your-project/.env

=== Atlassian連携設定 ===

Atlassian URL (空白でスキップ): https://your-domain.atlassian.net
Atlassian Email: your-email@company.com
Atlassian API Token: ********** (入力は非表示)

=== Confluence Space設定 ===

PRD Space Key (空白でスキップ): PRD
QA Space Key (空白でスキップ): QA
Release Space Key (空白でスキップ): RELEASE

=== JIRA設定 ===

JIRA Project Keys (カンマ区切り、空白でスキップ): PROJ1,PROJ2

=== GitHub連携設定 ===

GitHub Organization (空白でスキップ): your-org
GitHub Personal Access Token: ********** (入力は非表示)

✅ .envファイルを作成しました:
   /path/to/your-project/.env
```

#### 3. グローバル設定の作成

複数のプロジェクトで共通の設定を使う場合、グローバル設定を作成します。

```bash
michi config:init --global
```

#### 4. すべての設定ファイルを一度に作成

```bash
michi config:init --all
```

上記コマンドは、以下の順序で実行されます:
1. `~/.michi/.env` 作成
2. `.env` 作成
3. `~/.michi/config.json` 作成
4. `.michi/config.json` 作成

---

## 3層設定アーキテクチャ

Michiは、3層の設定アーキテクチャを採用しています。

### 読み込み優先順位（低 → 高）

1. **デフォルト設定**（内蔵）
2. **グローバル設定** (`~/.michi/config.json`)
3. **グローバル環境変数** (`~/.michi/.env`)
4. **プロジェクト設定** (`.michi/config.json`)
5. **プロジェクト環境変数** (`.env`)

**例:**
- グローバル設定で `ATLASSIAN_URL=https://global.atlassian.net` を設定
- プロジェクト環境変数で `ATLASSIAN_URL=https://project.atlassian.net` を設定
- → プロジェクト環境変数の値 (`https://project.atlassian.net`) が使用される

### 設定の上書きルール

- 上位の設定（番号が大きい）が下位の設定を上書きします
- プロジェクト固有の設定が必要な場合は、プロジェクト設定/環境変数で上書き
- 共通設定はグローバル設定/環境変数で管理

---

## セキュリティ

### .envファイルの機密情報入力

APIトークンなどの機密情報は、入力時に非表示になります（`@inquirer/prompts`使用）。

```bash
Atlassian API Token: ********** (入力は見えません)
GitHub Personal Access Token: ********** (入力は見えません)
```

### ファイルパーミッション

`.env` ファイルは、セキュリティのため、所有者のみ読み書き可能な権限（`0o600`）で作成されます。

```bash
ls -la .env
-rw------- 1 user user 512 Jan  1 12:00 .env
```

### .gitignore

`.env` ファイルは機密情報を含むため、必ず `.gitignore` に追加してください。

```
# .gitignore
.env
```

**注意:** `.env.example` はGitで管理しても問題ありませんが、実際の値は含めないでください。

---

## 既存機能との関係

### `michi init` との使い分け

| タイミング | コマンド | 目的 |
|-----------|---------|------|
| プロジェクト新規作成時 | `michi init` | プロジェクト構造の初期化 |
| .envに値を入力したい | `michi config:init --env` | 機密情報を対話的に入力 |
| グローバル設定を作成 | `michi config:init --global` | 複数プロジェクトで共通設定 |

### 過去の `npm run config:global` との関係

以前は `npm run config:global` を使用していましたが、`michi config:init --global` に統合されました。

**移行方法:**
```bash
# 旧コマンド
npm run config:global

# 新コマンド
michi config:init --global
```

---

## トラブルシューティング

### Q1. `.env` ファイルが既に存在する場合は？

上書き確認が表示されます。

```
⚠️  既存の.envファイルが見つかりました。上書きしますか？ (y/N):
```

- `y` を入力すると上書き
- `N` または Enter で中止

### Q2. グローバル設定とプロジェクト設定の違いは？

- **グローバル設定** (`~/.michi/config.json`): すべてのプロジェクトに適用
- **プロジェクト設定** (`.michi/config.json`): プロジェクト固有の設定（グローバル設定を上書き）

### Q3. パスワード入力時、入力が見えない

セキュリティのため、APIトークンやパスワードは入力時に非表示になります。

入力後、Enterを押してください。

---

## 関連ドキュメント

- [Atlassian連携ガイド](./atlassian-integration.md)
- [アーキテクチャガイド](../architecture.md)
- [設定ファイルリファレンス](../reference/config.md)

---

**更新日:** 2026-01-04
