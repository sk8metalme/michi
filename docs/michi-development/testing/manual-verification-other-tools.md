# Michi 手動検証フロー - その他のツール

**親ドキュメント**: [manual-verification-flow.md](./manual-verification-flow.md)

このドキュメントでは、Cursor IDE以外のツールでの手動検証フローを説明します。

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

**JIRA連携について:**
JIRA連携は `/kiro:spec-impl` コマンド実行時に自動で行われます：

- spec.json から JIRA 情報（Epic + Story）を自動取得
- Epic と最初の Story を「進行中」に移動
- TDD 実装
- PR 作成
- Epic と最初の Story を「レビュー待ち」に移動
- JIRA に PR リンクをコメント

**CLIコマンド - 個別JIRA操作（任意）- Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-code
# ステータス変更
michi jira:transition DEMO-103 "In Progress"

# コメント追加
michi jira:comment DEMO-103 "テストコメント"
```

**CLIコマンド - 個別JIRA操作（任意）- Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-code
# ステータス変更
npx tsx ~/Work/git/michi/src/cli.ts jira:transition DEMO-103 "In Progress"

# コメント追加
npx tsx ~/Work/git/michi/src/cli.ts jira:comment DEMO-103 "テストコメント"
```

**期待される結果:**

- JIRAステータスが変更される
- JIRAにコメントが追加される

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

| テストタイプ | 生成ファイル                                                                          |
| ------------ | ------------------------------------------------------------------------------------- |
| performance  | `test-execution/performance/locustfile.py`, `load-test-plan.md`                       |
| security     | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration  | `test-execution/integration/integration-checklist.md`                                 |
| e2e          | `test-execution/e2e/e2e-checklist.md`                                                 |

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

Michiは `.claude/agents/` ディレクトリにサブエージェント定義を追加します：

```bash
ls -la /tmp/michi-manual-test-claude-agent/.claude/agents/
# 出力例:
# .claude/agents/
#   manager-agent.md
#   developer.md
#   designer.md
#   tester.md
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

**JIRA連携について:**
JIRA連携は `/kiro:spec-impl` コマンド実行時に自動で行われます：

- spec.json から JIRA 情報（Epic + Story）を自動取得
- Epic と最初の Story を「進行中」に移動
- TDD 実装
- PR 作成
- Epic と最初の Story を「レビュー待ち」に移動
- JIRA に PR リンクをコメント

**CLIコマンド - 個別JIRA操作（任意）- Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-claude-agent
# ステータス変更
michi jira:transition DEMO-103 "In Progress"

# コメント追加
michi jira:comment DEMO-103 "テストコメント"
```

**CLIコマンド - 個別JIRA操作（任意）- Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-claude-agent
# ステータス変更
npx tsx ~/Work/git/michi/src/cli.ts jira:transition DEMO-103 "In Progress"

# コメント追加
npx tsx ~/Work/git/michi/src/cli.ts jira:comment DEMO-103 "テストコメント"
```

**期待される結果:**

- JIRAステータスが変更される
- JIRAにコメントが追加される

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

| テストタイプ | 生成ファイル                                                                          |
| ------------ | ------------------------------------------------------------------------------------- |
| performance  | `test-execution/performance/locustfile.py`, `load-test-plan.md`                       |
| security     | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration  | `test-execution/integration/integration-checklist.md`                                 |
| e2e          | `test-execution/e2e/e2e-checklist.md`                                                 |

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

**JIRA連携について:**
JIRA連携は `/kiro:spec-impl` コマンド実行時に自動で行われます：

- spec.json から JIRA 情報（Epic + Story）を自動取得
- Epic と最初の Story を「進行中」に移動
- TDD 実装
- PR 作成
- Epic と最初の Story を「レビュー待ち」に移動
- JIRA に PR リンクをコメント

**CLIコマンド - 個別JIRA操作（任意）- Pattern A (NPM Package):**

```bash
cd /tmp/michi-manual-test-cline
# ステータス変更
michi jira:transition DEMO-103 "In Progress"

# コメント追加
michi jira:comment DEMO-103 "テストコメント"
```

**CLIコマンド - 個別JIRA操作（任意）- Pattern B (Development):**

```bash
cd /tmp/michi-manual-test-cline
# ステータス変更
npx tsx ~/Work/git/michi/src/cli.ts jira:transition DEMO-103 "In Progress"

# コメント追加
npx tsx ~/Work/git/michi/src/cli.ts jira:comment DEMO-103 "テストコメント"
```

**期待される結果:**

- JIRAステータスが変更される
- JIRAにコメントが追加される

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

| テストタイプ | 生成ファイル                                                                          |
| ------------ | ------------------------------------------------------------------------------------- |
| performance  | `test-execution/performance/locustfile.py`, `load-test-plan.md`                       |
| security     | `test-execution/security/zap-config.yaml`, `run-zap-scan.sh`, `security-test-plan.md` |
| integration  | `test-execution/integration/integration-checklist.md`                                 |
| e2e          | `test-execution/e2e/e2e-checklist.md`                                                 |

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

