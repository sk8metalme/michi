# Michi 手動検証フロー

NPMパッケージpublish前の完全な手動検証フローガイド

## 目次

- [概要](#概要)
- [ツールサポート状況](#ツールサポート状況)
- [前提条件](#前提条件)
- [Part 1: 実ユーザーワークフロー](#part-1-実ユーザーワークフロー)
  - [1.1 Cursor IDE](#11-cursor-ide)
  - [1.2 Claude Code](#12-claude-code)
  - [1.3 Claude Agent SDK](#13-claude-agent-sdk)
  - [1.4 Cline](#14-cline)
  - [1.5 Gemini](#15-gemini)
  - [1.6 Codex](#16-codex)
- [Part 2: 自動テストワークフロー](#part-2-自動テストワークフロー)
- [トラブルシューティング](#トラブルシューティング)

---

## 概要

このドキュメントは、Michiパッケージのpublish前に実施する手動検証の完全なフローを記載しています。

### 検証の目的

1. **実環境での動作確認**: NPMパッケージとしてインストールした状態での動作を確認
2. **全ツール対応確認**: 6つのAI開発ツールすべてでセットアップと基本機能が動作することを確認
3. **2段階セットアップの検証**: cc-sdd → Michi の順序でのセットアップが正しく動作することを確認

### 2つのコマンド実行パターン

このガイドでは、各ツールに対して2つのコマンド実行パターンを提供します：

- **Pattern A (NPM Package)**: NPMパッケージとしてインストールした状態での実行
  - 実ユーザーの使用方法に最も近い
  - `npx @sk8metal/michi-cli <command>` を使用

- **Pattern B (Development)**: 開発環境から直接実行
  - 開発者が開発中のコードをテストする場合に使用
  - `npx tsx ~/Work/git/michi/src/cli.ts <command>` を使用

---

## ツールサポート状況

| AI開発ツール | cc-sdd対応 | Michi対応 | 検証状況 |
|------------|-----------|-----------|---------|
| **Cursor IDE** | ✅ 完全対応 | ✅ 完全対応 | ✅ 動作確認済み |
| **Claude Code** | ✅ 完全対応 | ✅ 完全対応 | ✅ 動作確認済み |
| **Claude Agent SDK** | ⚠️ 暫定対応 | ⚠️ 暫定対応 | ⚠️ 要検証 |
| **Cline** | ❓ 未確認 | ✅ テンプレート有 | ❓ 要検証 |
| **Gemini** | 🚧 準備中 | 🚧 準備中 | 🚧 未対応 |
| **Codex** | 🚧 準備中 | 🚧 準備中 | 🚧 未対応 |

### サポート状況の詳細

- ✅ **完全対応**: すべての機能が動作確認済み
- ⚠️ **暫定対応**: 基本機能は動作するが、一部制限あり
- ❓ **未確認**: テンプレートは存在するが動作未検証
- 🚧 **準備中**: 現在開発中

---

## 前提条件

### システム要件

- Node.js >= 20.0.0
- npm >= 10.0.0
- Git
- 各AI開発ツールのインストール（検証対象のツール）

### 事前準備

1. **Michiプロジェクトのビルド**（Pattern B使用時のみ）
   ```bash
   cd ~/Work/git/michi
   npm run build
   ```

2. **NPMパッケージの作成**（Pattern A使用時のみ）
   ```bash
   cd ~/Work/git/michi
   npm pack
   # 出力: sk8metal-michi-cli-X.X.X.tgz
   ```

---

## Part 1: 実ユーザーワークフロー

このセクションでは、各AI開発ツールごとに、実際のユーザーが行うセットアップから基本機能の確認までの完全なフローを記載します。

### 重要な原則

1. **2段階セットアップが必須**
   - Phase 1: cc-sddのインストール（AIコマンド `/kiro:spec-*` を提供）
   - Phase 2: Michiのセットアップ（CLIコマンドとチャットコマンド `/michi:*` を提供）

2. **絶対パスの使用**
   - すべてのコマンドは絶対パスで記載
   - テストディレクトリ `/tmp/michi-manual-test-<tool>` からでも実行可能

3. **feature名の統一**
   - すべての検証で `java-calculator-webapp` を使用

---

## 1.1 Cursor IDE

### サポート状況
- ✅ cc-sdd: 完全対応
- ✅ Michi: 完全対応

### Step 0: テストディレクトリの準備

```bash
# テストディレクトリを作成
mkdir -p /tmp/michi-manual-test-cursor
cd /tmp/michi-manual-test-cursor

# Gitリポジトリとして初期化
git init
git config user.name "Test User"
git config user.email "test@example.com"

# 初期コミット
touch README.md
git add README.md
git commit -m "Initial commit"
```

### Step 1: Phase 1 - cc-sddのインストール

#### Pattern A: NPM Package（推奨）

```bash
cd /tmp/michi-manual-test-cursor

# cc-sddをインストール（Cursor IDE用、日本語）
npx cc-sdd@latest --cursor --lang ja
```

#### Pattern B: Development（開発環境）

cc-sddは外部パッケージのため、Pattern Bは適用外です。常にNPMから最新版をインストールしてください。

#### 確認事項

実行後、以下のファイルが生成されることを確認：

```bash
ls -la /tmp/michi-manual-test-cursor/.cursor/
# 出力例:
# .cursor/
#   .cursorrules
#   commands/
#     kiro-spec-init.md
#     kiro-spec-requirements.md
#     kiro-spec-design.md
#     ... (cc-sdd提供の10個のコマンド)
```

### Step 2: Phase 2 - Michiのセットアップ

#### Pattern A: NPM Package（推奨）

```bash
cd /tmp/michi-manual-test-cursor

# Michiパッケージをグローバルインストール
npm install -g @sk8metal/michi-cli

# Michiセットアップ（Cursor IDE用）
michi setup-existing --cursor --lang ja
```

#### Pattern B: Development（開発環境）

```bash
cd /tmp/michi-manual-test-cursor

# 開発環境のMichiを使用してセットアップ
npx tsx ~/Work/git/michi/src/cli.ts setup-existing --cursor --lang ja
```

#### 確認事項

実行後、以下のファイルが追加されることを確認：

```bash
ls -la /tmp/michi-manual-test-cursor/.cursor/commands/
# cc-sddのコマンドに加えて、Michiのコマンドが追加されている:
#   michi-confluence-sync.md
#   michi-project-switch.md
```

### Step 3: フェーズ実行

各フェーズごとに、AIコマンド（該当する場合）とCLIコマンドを順番に実行します。

#### 3.0 初期化

Cursor IDEを開き、AIコマンドを実行：

```
/kiro:spec-init マニュアルテスト機能
```

**期待される動作:**
- `.kiro/specs/java-calculator-webapp/` ディレクトリが作成される
- `spec.json` が初期化される

#### 3.1 Phase 0.1: 要件定義（必須）

**AIコマンド:**

```
/kiro:spec-requirements java-calculator-webapp
```

**期待される動作:**
- `requirements.md` が生成される
- AIが要件を整理して記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp requirements
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp requirements
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.2 Phase 0.2: 設計（必須）

**AIコマンド:**

```
/kiro:spec-design java-calculator-webapp
```

**期待される動作:**
- `design.md` が生成される
- AIが設計内容を記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp design
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp design
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.3 Phase 0.3: テストタイプ選択（任意）

**AIコマンド:** なし（このフェーズにはAIコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp test-type-selection
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

**期待される結果:**
- テストタイプの選択が完了する
- バリデーションが成功する

#### 3.4 Phase 0.4: テスト仕様書作成（任意）

**AIコマンド:** なし（このフェーズにはAIコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp test-spec
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-spec
```

**期待される結果:**
- テスト仕様書が作成される
- バリデーションが成功する

#### 3.5 Phase 0.5-0.6: タスク分割・JIRA同期（必須）

**AIコマンド:**

```
/kiro:spec-tasks java-calculator-webapp
```

**期待される動作:**
- `tasks.md` が生成される
- ストーリー、タスク、工数が記載される

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp tasks
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp tasks
```

**期待される結果:**
- JIRAチケットが作成される
- バリデーションが成功する

#### 3.6 Phase 1: 環境構築（任意）

**AIコマンド:** なし（このフェーズにはAIコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp environment-setup
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp environment-setup
```

**期待される結果:**
- 環境構築プロセスが完了する
- バリデーションが成功する

#### 3.7 Phase 2: TDD実装（必須）

**AIコマンド:**

```
/kiro:spec-impl java-calculator-webapp
```

**期待される動作:**
- TDD（RED-GREEN-REFACTOR）サイクルで実装
- 各タスクの実装とテストが完了

**注意:** 実際の実装は行わず、コマンドの動作確認のみ

#### 3.8 Phase A: PR前自動テスト（任意）

**AIコマンド:** なし（このフェーズにはAIコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp phase-a
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-a
```

**期待される結果:**
- PR前自動テストが実行される
- バリデーションが成功する

#### 3.10 Phase B: リリース準備テスト（任意）

**AIコマンド:** なし（このフェーズにはAIコマンドは不要）

**前提条件:**
- Phase 0.3 (test-type-selection) でテストタイプが選択済みであること
- アプリケーションの実装が完了していること

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cursor
michi phase:run java-calculator-webapp phase-b
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cursor
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-b
```

**期待される結果:**
- `test-type-selection.json`から選択されたテストタイプを読み込む
- Phase Bに該当するテスト（performance, security, integration, e2e）の実行ファイルを生成
- `.kiro/specs/<feature>/test-execution/` 配下にテスト実行ファイルが作成される

**生成されるファイル例:**

| テストタイプ | 生成ファイル |
|-------------|-------------|
| performance | `test-execution/performance/locustfile.py`, `load-test-plan.md` |
| security | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration | `test-execution/integration/integration-checklist.md` |
| e2e | `test-execution/e2e/e2e-checklist.md` |

**注意:** 生成されるファイルはテンプレートとガイドです。実際のテストツール（Locust, k6, OWASP ZAP等）の選定と設定は、プロジェクトの要件に応じて行ってください。

#### 3.11 Phase 4: リリース準備（任意）

**注意:** 手動検証では実際のリリース準備は行わず、フローの確認のみ

#### 3.12 Phase 5: リリース（任意）

**注意:** 手動検証では実際のリリースは行わず、フローの確認のみ

### Step 4: 成功確認

すべてのコマンドが正常に完了し、以下のファイル構造が作成されていることを確認：

```
/tmp/michi-manual-test-cursor/
├── .cursor/
│   ├── .cursorrules
│   └── commands/
│       ├── kiro-spec-init.md (cc-sdd)
│       ├── kiro-spec-requirements.md (cc-sdd)
│       ├── kiro-spec-design.md (cc-sdd)
│       ├── kiro-spec-tasks.md (cc-sdd)
│       ├── ... (cc-sdd提供の他のコマンド)
│       ├── michi-confluence-sync.md (Michi)
│       └── michi-project-switch.md (Michi)
└── .kiro/
    └── specs/
        └── java-calculator-webapp/
            ├── spec.json
            ├── requirements.md (Step 3.2 AIで作成)
            ├── design.md (Step 3.3 AIで作成)
            ├── tasks.md (Step 3.4 AIで作成)
            ├── test-type-selection.json (Step 3.6 CLIで作成)
            ├── test-specs/ (Step 3.7 CLIで作成)
            │   └── *.md
            └── test-execution/ (Step 3.10 Phase Bで作成、任意)
                ├── performance/
                ├── security/
                ├── integration/
                └── e2e/
```

**重要な注意事項:**

Phase 0.1 (requirements)、Phase 0.2 (design)、Phase 0.5-0.6 (tasks) のCLIコマンド実行により、以下が作成されます：
- Confluenceページ（requirements、design用）
- JIRAチケット（tasks用）

これらはConfluence/JIRA上に作成されるため、ローカルファイルシステムには追加ファイルは生成されません。

---

## 1.2 Claude Code

### サポート状況
- ✅ cc-sdd: 完全対応
- ✅ Michi: 完全対応

### Step 0: テストディレクトリの準備

```bash
# テストディレクトリを作成
mkdir -p /tmp/michi-manual-test-claude-code
cd /tmp/michi-manual-test-claude-code

# Gitリポジトリとして初期化
git init
git config user.name "Test User"
git config user.email "test@example.com"

# 初期コミット
touch README.md
git add README.md
git commit -m "Initial commit"
```

### Step 1: Phase 1 - cc-sddのインストール

```bash
cd /tmp/michi-manual-test-claude-code

# cc-sddをインストール（Claude Code用、日本語）
npx cc-sdd@latest --claude --lang ja
```

#### 確認事項

実行後、以下のファイルが生成されることを確認：

```bash
ls -la /tmp/michi-manual-test-claude-code/.claude/
# 出力例:
# .claude/
#   CLAUDE.md
#   commands/kiro
#     kiro-spec-init.md
#     kiro-spec-requirements.md
#     ... (cc-sdd提供の10個のコマンド)
```

### Step 2: Phase 2 - Michiのセットアップ

#### Pattern A: NPM Package（推奨）

```bash
cd /tmp/michi-manual-test-claude-code

# Michiパッケージをグローバルインストール（まだの場合）
npm install -g @sk8metal/michi-cli

# Michiセットアップ（Claude Code用）
michi setup-existing --claude --lang ja
```

#### Pattern B: Development（開発環境）

```bash
cd /tmp/michi-manual-test-claude-code

# 開発環境のMichiを使用してセットアップ
npx tsx ~/Work/git/michi/src/cli.ts setup-existing --claude --lang ja
```

#### 確認事項

実行後、Michiのコマンドが追加されることを確認：

```bash
ls -la /tmp/michi-manual-test-claude-code/.claude/commands/kiro/michi
# Michiのコマンドが追加されている:
#   michi-confluence-sync.md
#   michi-project-switch.md
```

### Step 3: フェーズ実行

各フェーズごとに、スラッシュコマンド（該当する場合）とCLIコマンドを順番に実行します。

#### 3.0 初期化

Claude Codeを起動し、スラッシュコマンドを実行：

```
/kiro:spec-init Java電卓webアプリ
```

**期待される動作:**
- `.kiro/specs/java-calculator-webapp/` ディレクトリが作成される
- `spec.json` が初期化される

#### 3.1 Phase 0.1: 要件定義（必須）

**スラッシュコマンド:**

```
/kiro:spec-requirements java-calculator-webapp
```

**期待される動作:**
- `requirements.md` が生成される
- AIが要件を整理して記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp requirements
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp requirements
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.2 Phase 0.2: 設計（必須）

**スラッシュコマンド:**

```
/kiro:spec-design java-calculator-webapp
```

**期待される動作:**
- `design.md` が生成される
- AIが設計内容を記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp design
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp design
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.3 Phase 0.3: テストタイプ選択（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp test-type-selection
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

**期待される結果:**
- テストタイプの選択が完了する
- バリデーションが成功する

#### 3.4 Phase 0.4: テスト仕様書作成（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp test-spec
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-spec
```

**期待される結果:**
- テスト仕様書が作成される
- バリデーションが成功する

#### 3.5 Phase 0.5-0.6: タスク分割・JIRA同期（必須）

**スラッシュコマンド:**

```
/kiro:spec-tasks java-calculator-webapp
```

**期待される動作:**
- `tasks.md` が生成される
- ストーリー、タスク、工数が記載される

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp tasks
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp tasks
```

**期待される結果:**
- JIRAチケットが作成される
- バリデーションが成功する

#### 3.6 Phase 1: 環境構築（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp environment-setup
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp environment-setup
```

**期待される結果:**
- 環境構築プロセスが完了する
- バリデーションが成功する

#### 3.7 Phase 2: TDD実装（必須）

**スラッシュコマンド:**

```
/kiro:spec-impl java-calculator-webapp
```

**期待される動作:**
- TDD（RED-GREEN-REFACTOR）サイクルで実装
- 各タスクの実装とテストが完了

**注意:** 実際の実装は行わず、コマンドの動作確認のみ

#### 3.8 Phase A: PR前自動テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp phase-a
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-a
```

**期待される結果:**
- PR前自動テストが実行される
- バリデーションが成功する

#### 3.9 Phase 3: 追加QA（任意）

**注意:** 手動検証では実際のQAは行わず、フローの確認のみ

#### 3.10 Phase B: リリース準備テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**前提条件:**
- Phase 0.3 (test-type-selection) でテストタイプが選択済みであること
- アプリケーションの実装が完了していること

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
michi phase:run java-calculator-webapp phase-b
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-b
```

**期待される結果:**
- `test-type-selection.json`から選択されたテストタイプを読み込む
- Phase Bに該当するテスト（performance, security, integration, e2e）の実行ファイルを生成
- `.kiro/specs/<feature>/test-execution/` 配下にテスト実行ファイルが作成される

**生成されるファイル例:**

| テストタイプ | 生成ファイル |
|-------------|-------------|
| performance | `test-execution/performance/locustfile.py`, `load-test-plan.md` |
| security | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration | `test-execution/integration/integration-checklist.md` |
| e2e | `test-execution/e2e/e2e-checklist.md` |

**注意:** 生成されるファイルはテンプレートとガイドです。実際のテストツール（Locust, k6, OWASP ZAP等）の選定と設定は、プロジェクトの要件に応じて行ってください。

#### 3.11 Phase 4: リリース準備（任意）

**注意:** 手動検証では実際のリリース準備は行わず、フローの確認のみ

#### 3.12 Phase 5: リリース（任意）

**注意:** 手動検証では実際のリリースは行わず、フローの確認のみ

### Step 4: 成功確認

すべてのコマンドが正常に完了し、ファイル構造が作成されていることを確認：

```
/tmp/michi-manual-test-claude-code/
├── .claude/
│   ├── CLAUDE.md
│   └── commands/
│       ├── kiro-spec-init.md (cc-sdd)
│       ├── kiro-spec-requirements.md (cc-sdd)
│       ├── kiro-spec-design.md (cc-sdd)
│       ├── kiro-spec-tasks.md (cc-sdd)
│       ├── ... (cc-sdd提供の他のコマンド)
│       ├── michi-confluence-sync.md (Michi)
│       └── michi-project-switch.md (Michi)
└── .kiro/
    └── specs/
        └── java-calculator-webapp/
            ├── spec.json
            ├── requirements.md (Step 3.2 AIで作成)
            ├── design.md (Step 3.3 AIで作成)
            ├── tasks.md (Step 3.4 AIで作成)
            ├── test-type-selection.json (Step 3.6 CLIで作成)
            ├── test-specs/ (Step 3.7 CLIで作成)
            │   └── *.md
            └── test-execution/ (Step 3.10 Phase Bで作成、任意)
                ├── performance/
                ├── security/
                ├── integration/
                └── e2e/
```

**重要な注意事項:**

Phase 0.1 (requirements)、Phase 0.2 (design)、Phase 0.5-0.6 (tasks) のCLIコマンド実行により、以下が作成されます：
- Confluenceページ（requirements、design用）
- JIRAチケット（tasks用）

これらはConfluence/JIRA上に作成されるため、ローカルファイルシステムには追加ファイルは生成されません。

---

## 1.3 Claude Agent SDK

### サポート状況
- ⚠️ cc-sdd: 暫定対応（`--claude` フラグを使用）
- ⚠️ Michi: 暫定対応（`--claude-agent` フラグを使用）

### 注意事項

Claude Agent SDKは正式なcc-sdd対応が未完了です。現在は以下の制限があります：

1. cc-sddインストール時は `--claude` フラグを使用（`--claude-agent` フラグは存在しない）
2. Michiセットアップ時は `--claude-agent` フラグを使用
3. 一部機能が正常に動作しない可能性あり

### Step 0: テストディレクトリの準備

```bash
# テストディレクトリを作成
mkdir -p /tmp/michi-manual-test-claude-agent
cd /tmp/michi-manual-test-claude-agent

# Gitリポジトリとして初期化
git init
git config user.name "Test User"
git config user.email "test@example.com"

# 初期コミット
touch README.md
git add README.md
git commit -m "Initial commit"
```

### Step 1: Phase 1 - cc-sddのインストール

⚠️ **重要**: `--claude-agent` フラグは存在しないため、`--claude` を使用

```bash
cd /tmp/michi-manual-test-claude-agent

# cc-sddをインストール（Claudeフラグを使用）
npx cc-sdd@latest --claude --lang ja
```

#### 確認事項

```bash
ls -la /tmp/michi-manual-test-claude-agent/.claude/
# .claude/CLAUDE.md と commands/ が生成される
```

### Step 2: Phase 2 - Michiのセットアップ

#### Pattern A: NPM Package（推奨）

```bash
cd /tmp/michi-manual-test-claude-agent

# Michiパッケージをグローバルインストール（まだの場合）
npm install -g @sk8metal/michi-cli

# Michiセットアップ（Claude Agent SDK用）
michi setup-existing --claude-agent --lang ja
```

#### Pattern B: Development（開発環境）

```bash
cd /tmp/michi-manual-test-claude-agent

# 開発環境のMichiを使用してセットアップ
npx tsx ~/Work/git/michi/src/cli.ts setup-existing --claude-agent --lang ja
```

#### 確認事項

Michiは `.claude/subagents/` ディレクトリにサブエージェント定義を追加します：

```bash
ls -la /tmp/michi-manual-test-claude-agent/.claude/subagents/
```

### Step 3: フェーズ実行

各フェーズごとに、スラッシュコマンド（該当する場合）とCLIコマンドを順番に実行します。

#### 3.0 初期化

Claude Agent SDKを起動し、スラッシュコマンドを実行：

```
/kiro:spec-init マニュアルテスト機能
```

**期待される動作:**
- `.kiro/specs/java-calculator-webapp/` ディレクトリが作成される
- `spec.json` が初期化される

#### 3.1 Phase 0.1: 要件定義（必須）

**スラッシュコマンド:**

```
/kiro:spec-requirements java-calculator-webapp
```

**期待される動作:**
- `requirements.md` が生成される
- AIが要件を整理して記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp requirements
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp requirements
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.2 Phase 0.2: 設計（必須）

**スラッシュコマンド:**

```
/kiro:spec-design java-calculator-webapp
```

**期待される動作:**
- `design.md` が生成される
- AIが設計内容を記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp design
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp design
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.3 Phase 0.3: テストタイプ選択（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp test-type-selection
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

**期待される結果:**
- テストタイプの選択が完了する
- バリデーションが成功する

#### 3.4 Phase 0.4: テスト仕様書作成（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp test-spec
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-spec
```

**期待される結果:**
- テスト仕様書が作成される
- バリデーションが成功する

#### 3.5 Phase 0.5-0.6: タスク分割・JIRA同期（必須）

**スラッシュコマンド:**

```
/kiro:spec-tasks java-calculator-webapp
```

**期待される動作:**
- `tasks.md` が生成される
- ストーリー、タスク、工数が記載される

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp tasks
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp tasks
```

**期待される結果:**
- JIRAチケットが作成される
- バリデーションが成功する

#### 3.6 Phase 1: 環境構築（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp environment-setup
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp environment-setup
```

**期待される結果:**
- 環境構築プロセスが完了する
- バリデーションが成功する

#### 3.7 Phase 2: TDD実装（必須）

**スラッシュコマンド:**

```
/kiro:spec-impl java-calculator-webapp
```

**期待される動作:**
- TDD（RED-GREEN-REFACTOR）サイクルで実装
- 各タスクの実装とテストが完了

**注意:** 実際の実装は行わず、コマンドの動作確認のみ

#### 3.8 Phase A: PR前自動テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp phase-a
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-a
```

**期待される結果:**
- PR前自動テストが実行される
- バリデーションが成功する

#### 3.9 Phase 3: 追加QA（任意）

**注意:** 手動検証では実際のQAは行わず、フローの確認のみ

#### 3.10 Phase B: リリース準備テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**前提条件:**
- Phase 0.3 (test-type-selection) でテストタイプが選択済みであること
- アプリケーションの実装が完了していること

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
michi phase:run java-calculator-webapp phase-b
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-b
```

**期待される結果:**
- `test-type-selection.json`から選択されたテストタイプを読み込む
- Phase Bに該当するテスト（performance, security, integration, e2e）の実行ファイルを生成
- `.kiro/specs/<feature>/test-execution/` 配下にテスト実行ファイルが作成される

**生成されるファイル例:**

| テストタイプ | 生成ファイル |
|-------------|-------------|
| performance | `test-execution/performance/locustfile.py`, `load-test-plan.md` |
| security | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration | `test-execution/integration/integration-checklist.md` |
| e2e | `test-execution/e2e/e2e-checklist.md` |

**注意:** 生成されるファイルはテンプレートとガイドです。実際のテストツール（Locust, k6, OWASP ZAP等）の選定と設定は、プロジェクトの要件に応じて行ってください。

#### 3.11 Phase 4: リリース準備（任意）

**注意:** 手動検証では実際のリリース準備は行わず、フローの確認のみ

#### 3.12 Phase 5: リリース（任意）

**注意:** 手動検証では実際のリリースは行わず、フローの確認のみ

### Step 4: 成功確認

⚠️ **検証が必要**: Claude Agent SDK環境でのcc-sddコマンドとMichi CLIコマンドの動作は未検証です。

---

## 1.4 Cline

### サポート状況
- ❓ cc-sdd: 未確認（テンプレートは存在）
- ✅ Michi: テンプレート対応

### 注意事項

Clineのcc-sdd対応は未確認です。以下の手順は理論上の実行手順であり、実際の動作検証が必要です。

### Step 0: テストディレクトリの準備

```bash
# テストディレクトリを作成
mkdir -p /tmp/michi-manual-test-cline
cd /tmp/michi-manual-test-cline

# Gitリポジトリとして初期化
git init
git config user.name "Test User"
git config user.email "test@example.com"

# 初期コミット
touch README.md
git add README.md
git commit -m "Initial commit"
```

### Step 1: Phase 1 - cc-sddのインストール（未確認）

❓ **未確認**: Cline用のcc-sddフラグが存在するか不明

```bash
cd /tmp/michi-manual-test-cline

# cc-sddをインストール（Cline用フラグが存在すると仮定）
npx cc-sdd@latest --cline --lang ja
```

⚠️ **エラーが発生する場合**: `--cline` フラグが存在しない可能性があります。その場合、Clineでのcc-sdd使用は現時点で非対応です。

### Step 2: Phase 2 - Michiのセットアップ

Michiは Cline のテンプレートを提供しています。

#### Pattern A: NPM Package（推奨）

```bash
cd /tmp/michi-manual-test-cline

# Michiパッケージをグローバルインストール（まだの場合）
npm install -g @sk8metal/michi-cli

# Michiセットアップ（Cline用）
michi setup-existing --cline --lang ja
```

#### Pattern B: Development（開発環境）

```bash
cd /tmp/michi-manual-test-cline

# 開発環境のMichiを使用してセットアップ
npx tsx ~/Work/git/michi/src/cli.ts setup-existing --cline --lang ja
```

#### 確認事項

Michiは `.clinerules` ファイルを作成します：

```bash
ls -la /tmp/michi-manual-test-cline/.clinerules
```

### Step 3: フェーズ実行（要検証）

❓ **未確認**: Clineでのcc-sddコマンド実行は未検証です。以下は理論上の手順です。

各フェーズごとに、スラッシュコマンド（該当する場合）とCLIコマンドを順番に実行します。

#### 3.0 初期化

Clineを起動し、スラッシュコマンドを実行：

```
/kiro:spec-init マニュアルテスト機能
```

**期待される動作:**
- `.kiro/specs/java-calculator-webapp/` ディレクトリが作成される
- `spec.json` が初期化される

#### 3.1 Phase 0.1: 要件定義（必須）

**スラッシュコマンド:**

```
/kiro:spec-requirements java-calculator-webapp
```

**期待される動作:**
- `requirements.md` が生成される
- AIが要件を整理して記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp requirements
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp requirements
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.2 Phase 0.2: 設計（必須）

**スラッシュコマンド:**

```
/kiro:spec-design java-calculator-webapp
```

**期待される動作:**
- `design.md` が生成される
- AIが設計内容を記載

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp design
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp design
```

**期待される結果:**
- Confluenceページが作成される
- バリデーションが成功する

#### 3.3 Phase 0.3: テストタイプ選択（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp test-type-selection
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

**期待される結果:**
- テストタイプの選択が完了する
- バリデーションが成功する

#### 3.4 Phase 0.4: テスト仕様書作成（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp test-spec
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-spec
```

**期待される結果:**
- テスト仕様書が作成される
- バリデーションが成功する

#### 3.5 Phase 0.5-0.6: タスク分割・JIRA同期（必須）

**スラッシュコマンド:**

```
/kiro:spec-tasks java-calculator-webapp
```

**期待される動作:**
- `tasks.md` が生成される
- ストーリー、タスク、工数が記載される

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp tasks
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp tasks
```

**期待される結果:**
- JIRAチケットが作成される
- バリデーションが成功する

#### 3.6 Phase 1: 環境構築（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp environment-setup
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp environment-setup
```

**期待される結果:**
- 環境構築プロセスが完了する
- バリデーションが成功する

#### 3.7 Phase 2: TDD実装（必須）

**スラッシュコマンド:**

```
/kiro:spec-impl java-calculator-webapp
```

**期待される動作:**
- TDD（RED-GREEN-REFACTOR）サイクルで実装
- 各タスクの実装とテストが完了

**注意:** 実際の実装は行わず、コマンドの動作確認のみ

#### 3.8 Phase A: PR前自動テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp phase-a
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-a
```

**期待される結果:**
- PR前自動テストが実行される
- バリデーションが成功する

#### 3.9 Phase 3: 追加QA（任意）

**注意:** 手動検証では実際のQAは行わず、フローの確認のみ

#### 3.10 Phase B: リリース準備テスト（任意）

**スラッシュコマンド:** なし（このフェーズにはスラッシュコマンドは不要）

**前提条件:**
- Phase 0.3 (test-type-selection) でテストタイプが選択済みであること
- アプリケーションの実装が完了していること

**CLIコマンド - Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
michi phase:run java-calculator-webapp phase-b
```

**CLIコマンド - Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
npx tsx ~/Work/git/michi/src/cli.ts phase:run java-calculator-webapp phase-b
```

**期待される結果:**
- `test-type-selection.json`から選択されたテストタイプを読み込む
- Phase Bに該当するテスト（performance, security, integration, e2e）の実行ファイルを生成
- `.kiro/specs/<feature>/test-execution/` 配下にテスト実行ファイルが作成される

**生成されるファイル例:**

| テストタイプ | 生成ファイル |
|-------------|-------------|
| performance | `test-execution/performance/locustfile.py`, `load-test-plan.md` |
| security | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration | `test-execution/integration/integration-checklist.md` |
| e2e | `test-execution/e2e/e2e-checklist.md` |

**注意:** 生成されるファイルはテンプレートとガイドです。実際のテストツール（Locust, k6, OWASP ZAP等）の選定と設定は、プロジェクトの要件に応じて行ってください。

#### 3.11 Phase 4: リリース準備（任意）

**注意:** 手動検証では実際のリリース準備は行わず、フローの確認のみ

#### 3.12 Phase 5: リリース（任意）

**注意:** 手動検証では実際のリリースは行わず、フローの確認のみ

### Step 4: 成功確認（要検証）

❓ **未確認**: ClineでのMichi CLIコマンドの動作は未検証です。

---

## 1.5 Gemini

### サポート状況
- 🚧 cc-sdd: 準備中
- 🚧 Michi: 準備中

### 現状

Gemini用のテンプレートは現在開発中です。対応予定時期は未定です。

### 今後の対応予定

1. cc-sddにGemini用フラグの追加
2. MichiにGemini用テンプレートの追加
3. 動作検証

---

## 1.6 Codex

### サポート状況
- 🚧 cc-sdd: 準備中
- 🚧 Michi: 準備中

### 現状

Codex用のテンプレートは現在開発中です。対応予定時期は未定です。

### 今後の対応予定

1. cc-sddにCodex用フラグの追加
2. MichiにCodex用テンプレートの追加
3. 動作検証

---

## Part 2: 自動テストワークフロー

手動検証が完了した後、または手動検証の代わりに、自動テストワークフローを実行できます。

### 2.1 開発環境での自動検証

開発環境でMichiの機能を自動でテストします。

```bash
cd ~/Work/git/michi

# ビルド
npm run build

# 自動検証スクリプトを実行
npm run pre-publish
```

#### pre-publish-check.sh の実行内容

1. TypeScriptビルド確認
2. テスト実行（回帰確認）
3. テスト用featureの初期化
4. 新フェーズの動作確認（0.3-0.4, 1, A, B）
5. バリデーションの確認
6. 既存フェーズの動作確認（回帰テスト）
7. CLIヘルプ表示確認

### 2.2 NPMパッケージとしての自動検証

実際のNPMパッケージとしてインストールした状態での動作を自動でテストします。

```bash
cd ~/Work/git/michi

# ビルド
npm run build

# パッケージテストスクリプトを実行
npm run test:package
```

#### test-npm-package.sh の実行内容

1. パッケージのビルド
2. npm pack でパッケージを作成
3. テストディレクトリの作成（`/tmp/michi-test-*`）
4. パッケージのインストール
5. `.kiro` ディレクトリ構造の準備
6. CLIコマンドの動作確認（phase:run）
7. バリデーションの確認（validate:phase）
8. CLIヘルプの確認
9. 自動クリーンアップ

### 2.3 カスタムテストディレクトリの指定

デフォルトでは `/tmp/michi-test-*` が使用されますが、カスタムディレクトリを指定することもできます：

```bash
# カスタムディレクトリでテスト
bash scripts/test-npm-package.sh /tmp/my-custom-test-dir
```

---

## トラブルシューティング

### 問題1: cc-sddのインストールが失敗する

**症状:**
```
Error: Unknown option: --cline
```

**原因:**
指定したAI開発ツール用のフラグがcc-sddに存在しない

**解決方法:**
1. cc-sddの最新版を確認: `npm info cc-sdd`
2. サポートされているフラグを確認: `npx cc-sdd@latest --help`
3. 対応していない場合は、他のツール（Cursor または Claude Code）を使用

### 問題2: Michiセットアップが既存ファイルと競合する

**症状:**
```
Warning: File already exists: .cursor/commands/michi-confluence-sync.md
```

**原因:**
既にMichiがセットアップされている、または手動で同名ファイルが作成されている

**解決方法:**
```bash
# 既存のMichiファイルを削除してから再セットアップ
rm -rf .cursor/commands/michi-*.md
michi setup-existing --cursor --lang ja
```

### 問題3: phase:run コマンドが feature を見つけられない

**症状:**
```
Error: Feature 'java-calculator-webapp' not found
```

**原因:**
`.kiro/specs/java-calculator-webapp/` ディレクトリまたは `spec.json` が存在しない

**解決方法:**
1. AIコマンドで初期化されているか確認
   ```bash
   ls -la .kiro/specs/java-calculator-webapp/spec.json
   ```
2. 存在しない場合は、AIコマンド `/kiro:spec-init` を再実行

### 問題4: validate:phase が失敗する

**症状:**
```
Error: Validation failed for phase test-type-selection
```

**原因:**
必要なファイルが生成されていない、またはフォーマットが不正

**解決方法:**
1. 該当フェーズの出力ファイルを確認
   ```bash
   cat .kiro/specs/java-calculator-webapp/test-types.md
   ```
2. ファイルが空または不正な場合は、フェーズを再実行
   ```bash
   michi phase:run java-calculator-webapp test-type-selection
   ```

### 問題5: 絶対パスコマンドが動作しない（Pattern B）

**症状:**
```
Error: Cannot find module '~/Work/git/michi/src/cli.ts'
```

**原因:**
シェルがチルダ `~` を展開していない

**解決方法:**
```bash
# チルダの代わりに $HOME を使用
npx tsx $HOME/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection

# または完全な絶対パスを使用
npx tsx /Users/yourusername/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

### 問題6: 自動テストスクリプトが途中で失敗する

**症状:**
自動テストスクリプト（pre-publish または test:package）が途中でエラーで終了する

**原因:**
スクリプトは `set -e` を使用しており、最初のエラーで即座に終了する

**解決方法:**
1. エラーメッセージを確認
2. 該当するコマンドを手動で実行して詳細を確認
3. 問題を修正してから再実行

---

## まとめ

### 検証が必要な項目

1. ✅ **Cursor IDE** - 完全に動作確認済み
2. ✅ **Claude Code** - 完全に動作確認済み
3. ⚠️ **Claude Agent SDK** - 暫定対応、詳細な検証が必要
4. ❓ **Cline** - cc-sdd対応が不明、検証が必要
5. 🚧 **Gemini** - 開発中、対応待ち
6. 🚧 **Codex** - 開発中、対応待ち

### 推奨される検証順序

1. **自動テスト（必須）**
   ```bash
   npm run pre-publish
   npm run test:package
   ```

2. **Cursor IDEでの手動検証（推奨）**
   - 最も安定した環境での動作確認

3. **Claude Codeでの手動検証（推奨）**
   - もう1つの主要ツールでの動作確認

4. **その他のツール（任意）**
   - 時間とリソースがあれば、Claude Agent SDK、Clineでも検証

### チェックリスト

publish前に以下をすべて確認してください：

- [ ] `npm run pre-publish` が成功
- [ ] `npm run test:package` が成功
- [ ] Cursor IDEでの手動検証が成功（推奨）
- [ ] Claude Codeでの手動検証が成功（推奨）
- [ ] package.jsonのバージョンが更新されている
- [ ] CHANGELOG.mdが更新されている
- [ ] すべてのコミットがプッシュされている
- [ ] GitHubでCIが成功している

---

---

## Part 3: Phase Bテストの対話的作成フロー

このセクションでは、AIとの対話を通じて手動回帰テスト、負荷テスト、セキュリティテストを作成する方法を説明します。

### 3.1 対話フロー概要

```
[開始] ユーザーがテスト作成を依頼
    ↓
[ヒアリング] AIが必須項目を確認
    - テスト対象（エンドポイント、機能）
    - テストタイプ（手動回帰/負荷/セキュリティ）
    - 成功基準（応答時間、エラー率など）
    ↓
[テンプレート選択] AIが適切なテンプレートを参照
    ↓
[生成] AIがテストを作成
    ↓
[レビュー] ユーザーがレビュー
    ↓
[修正] 必要に応じて修正
    ↓
[完了] テスト成果物の確定
```

### 3.2 手動回帰テストの作成

#### 初期ヒアリング

AIに手動回帰テストの作成を依頼する際、以下の情報を提供してください：

| 項目 | 説明 | 例 |
|------|------|-----|
| テスト対象エンドポイント | APIのURL | `/api/calculator/evaluate` |
| HTTPメソッド | GET, POST, PUT, DELETE | `POST` |
| リクエストボディ形式 | JSON, XML, Form | `JSON` |
| 期待するHTTPステータス | 成功/エラー時 | `200 OK`, `400 Bad Request` |
| 期待するレスポンス形式 | レスポンスの構造 | `{"result": number}` |

#### サンプルプロンプト

```
Calculator APIの手動回帰テストを作成してください。

テスト対象:
- エンドポイント: POST /api/calculator/evaluate
- リクエストボディ: {"expression": "計算式"}
- 期待レスポンス: {"result": 計算結果} または {"error": "エラーメッセージ"}

テストケースの種類:
- 正常系: 基本的な四則演算、優先順位、小数点計算
- 異常系: ゼロ除算、構文エラー、空の式
- セキュリティ: SQLインジェクション風入力、長大入力
```

#### 生成されるファイル

- `docs/testing/manual-regression-guide.md`
- または `tests/manual/regression-tests.md`

### 3.3 負荷テストの作成

#### 初期ヒアリング

AIに負荷テストの作成を依頼する際、以下の情報を提供してください：

| 項目 | 説明 | 例 |
|------|------|-----|
| テスト対象URL | APIのベースURL | `http://localhost:8080` |
| 同時ユーザー数 | 最大同時接続数 | `100` |
| Spawn rate | ユーザー増加率 | `10/秒` |
| テスト時間 | 実行時間 | `60秒` |
| 目標スループット | 1秒あたりのリクエスト数 | `100 req/s` |
| 目標応答時間 | 平均応答時間 | `< 100ms` |

#### サンプルプロンプト

```
Calculator APIの負荷テストをLocustで作成してください。

テスト対象:
- URL: http://localhost:8080
- エンドポイント: POST /api/calculator/evaluate

テスト要件:
- 同時ユーザー数: 100
- Spawn rate: 10ユーザー/秒
- テスト時間: 60秒

成功基準:
- 平均応答時間: < 100ms
- 95パーセンタイル: < 200ms
- エラー率: < 1%
- スループット: > 100 req/s

シナリオ:
- 基本的な計算（重み5）
- 複雑な計算（重み3）
- 小数点計算（重み2）
```

#### 生成されるファイル

- `tests/load/locustfile.py`
- `tests/load/requirements.txt`
- `tests/load/README.md`

### 3.4 セキュリティテストの作成

#### 初期ヒアリング

AIにセキュリティテストの作成を依頼する際、以下の情報を提供してください：

| 項目 | 説明 | 例 |
|------|------|-----|
| テスト対象URL | APIのベースURL | `http://localhost:8080` |
| スキャンタイプ | Baseline/Quick/Full | `Quick` |
| 認証の有無 | 認証が必要か | `なし` |
| 検出対象 | 重点的に検出したい脆弱性 | `SQLインジェクション, XSS` |

#### サンプルプロンプト

```
Calculator APIのセキュリティテストをOWASP ZAPで作成してください。

テスト対象:
- URL: http://localhost:8080
- エンドポイント: /api/calculator/evaluate
- 認証: なし

スキャン要件:
- スキャンタイプ: Quick（API向け）
- 実行環境: Docker

検出対象:
- SQLインジェクション
- XSS（クロスサイトスクリプティング）
- コマンドインジェクション
- 情報漏洩

レポート形式:
- HTML（ブラウザ閲覧用）
- JSON（CI/CD連携用）
```

#### 生成されるファイル

- `tests/security/zap-config.yaml`
- `tests/security/run-zap-scan.sh`
- `tests/security/README.md`

### 3.5 テスト修正の依頼方法

生成されたテストを修正する場合、以下のようにAIに依頼します：

#### 修正依頼の例

```
# テストケースの追加
負荷テストに以下のシナリオを追加してください：
- ランダムな数式を生成するテスト（重み1）
- エラーハンドリングのテスト（重み1）

# パラメータの変更
同時ユーザー数を100から500に変更してください。

# 成功基準の変更
95パーセンタイルの目標を200msから150msに変更してください。

# ツールの変更
負荷テストをLocustからk6に変更してください。
```

### 3.6 対話的作成のベストプラクティス

1. **段階的に作成**: まず基本的なテストを生成し、レビュー後に追加・修正
2. **具体的な数値を提供**: 「高負荷」ではなく「同時100ユーザー」のように具体的に
3. **成功基準を明確に**: 何をもって成功とするか事前に定義
4. **既存テストを参照**: 既存のテストファイルがあれば、それを元に拡張
5. **テンプレートを活用**: AIにテンプレートを参照させることで一貫性を確保

### 3.7 使用ツール一覧

| テストタイプ | 推奨ツール | 代替ツール |
|-------------|-----------|-----------|
| 手動回帰テスト | curl + Markdown | Postman, Insomnia |
| 負荷テスト | Locust | k6, JMeter, Artillery |
| セキュリティテスト | OWASP ZAP | Burp Suite, Nikto |

---

## 参考リンク

- [Pre-Publish Checklist](./pre-publish-checklist.md) - 詳細なチェックリスト
- [Michi User Guide](../../user-guide/README.md) - ユーザーガイド
- [cc-sdd Documentation](https://github.com/example/cc-sdd) - cc-sddフレームワークのドキュメント
