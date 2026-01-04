# Michi 統括動作確認手順書

**バージョン**: v0.19.0
**最終更新**: 2026-01-01
**対象**: 全機能網羅（85項目）

## 目次

1. [概要](#概要)
2. [前提条件と環境準備](#1-前提条件と環境準備)
3. [インストールと初期設定](#2-インストールと初期設定)
4. [単一リポジトリワークフロー](#3-単一リポジトリワークフロー)
   - [Phase 0: 仕様化フェーズ](#phase-0-仕様化フェーズ)
   - [Phase 0.6-0.7: 外部ツール連携](#phase-06-07-外部ツール連携)
   - [Phase 1: 環境構築](#phase-1-環境構築)
   - [Phase 2: TDD実装](#phase-2-tdd実装)
   - [Phase A: PR前自動テスト](#phase-a-pr前自動テスト)
   - [Phase 3: 追加品質保証](#phase-3-追加品質保証)
   - [Phase B: リリース準備テスト](#phase-b-リリース準備テスト)
   - [Phase 4-5: リリース](#phase-4-5-リリース)
5. [Multi-Repoワークフロー](#4-multi-repoワークフロー)
6. [外部連携詳細テスト](#5-外部連携詳細テスト)
7. [品質自動化テスト](#6-品質自動化テスト)
8. [その他機能テスト](#7-その他機能テスト)
9. [障害対応・ロールバック手順](#8-障害対応ロールバック手順)
10. [チェックリストサマリー](#9-チェックリストサマリー)

---

## 概要

このドキュメントは、Michiの全機能を網羅的に確認するための統括動作確認手順書です。

### 対象範囲

- ✅ インストールからリリースまでの全ワークフロー
- ✅ 単一リポジトリとMulti-Repo両対応
- ✅ JIRA/Confluence連携
- ✅ 品質自動化機能
- ✅ 障害対応・ロールバック

### 使い方

1. 各セクションの手順を順番に実行
2. チェックボックス `[ ]` で進捗管理
3. サンプル出力と実際の出力を比較
4. 問題発生時は障害対応セクションを参照

---

## 1. 前提条件と環境準備

### 1.1 システム要件確認

**必須ソフトウェア**:

| ソフトウェア | 最小バージョン | 確認コマンド |
|-------------|---------------|-------------|
| Node.js | 20.0.0以上 | `node --version` |
| npm | 10.0.0以上 | `npm --version` |
| Git | 2.0以上 | `git --version` |
| GitHub CLI | 2.0以上 | `gh --version` |

**確認手順**:
```bash
# システム要件確認
node --version  # v20.0.0以上
npm --version   # 10.0.0以上
git --version   # 2.x以上
gh --version    # 2.x以上
```

<details>
<summary>サンプル出力</summary>

```text
$ node --version
v20.11.0

$ npm --version
10.2.4

$ git --version
git version 2.39.2

$ gh --version
gh version 2.40.1 (2024-01-15)
```
</details>

- [ ] **チェック**: すべてのソフトウェアが必要バージョン以上であることを確認

### 1.2 アカウント準備

**必要なアカウント**:

1. **Atlassianアカウント** (JIRA/Confluence)
   - JIRA Project作成権限
   - Confluenceスペース作成権限
   - API Token発行権限

2. **GitHubアカウント**
   - リポジトリ作成権限
   - Personal Access Token発行権限

3. **Claude Codeライセンス**
   - cc-sdd利用可能
   - Michiプラグイン利用可能

- [ ] **チェック**: すべてのアカウントが準備済みで、必要な権限を持つことを確認

### 1.3 テスト用リソース準備

**JIRA**:
- テスト用プロジェクト作成 (例: `MICHI-TEST`)
- Issue Type確認: Story, Subtask
- ワークフロー確認: To Do → In Progress → Done

**Confluence**:
- テスト用スペース作成 (例: `MICHI-TEST`)
- ページ作成・編集権限確認

**GitHub**:
- テスト用リポジトリ作成 (例: `michi-test-repo`)
- Actionsワークフロー有効化

- [ ] **チェック**: すべてのテスト用リソースが作成済み

---

## 2. インストールと初期設定

### 2.1 cc-sddセットアップ

**前提条件**: Claude Codeがインストール済みであること

**コマンド**:
```bash
npx cc-sdd@latest --claude --lang ja
```

<details>
<summary>サンプル出力</summary>

```text
✔ Claude Code detected
✔ Setting up cc-sdd for Claude...
✔ Created .michi/ directory structure
✔ Installed kiro commands
✔ Setup complete!

Next steps:
  1. Start Claude Code
  2. Type /michi:spec-init "<feature-name>: <description>"
```
</details>

- [ ] **チェック**: cc-sddセットアップ完了、`.michi/` ディレクトリ作成確認

### 2.2 Michiプラグインインストール

**Claude Code内で実行**:

```text
/plugin marketplace add sk8metalme/michi
/plugin install michi@sk8metalme
```

<details>
<summary>サンプル出力</summary>

```text
✔ Added marketplace: sk8metalme/michi
✔ Installed plugin: michi@sk8metalme

Available commands:
  /michi:spec-design
  /michi:spec-tasks
  /michi:spec-impl
  /michi:confluence-sync
  /michi-multi-repo:spec-init
  ... (and more)
```
</details>

- [ ] **チェック**: Michiプラグインインストール完了、`/michi:*` コマンド利用可能

### 2.3 CLIツールインストール（オプション）

**グローバルインストール**:
```bash
npm install -g @sk8metal/michi-cli
```

<details>
<summary>サンプル出力</summary>

```text
added 342 packages, and audited 343 packages in 12s

98 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

✔ @sk8metal/michi-cli@0.19.0 installed successfully
```
</details>

**バージョン確認**:
```bash
michi --version
```

<details>
<summary>サンプル出力</summary>

```text
@sk8metal/michi-cli/0.19.0 darwin-arm64 node-v20.11.0
```
</details>

- [ ] **チェック**: CLIツールインストール完了、`michi` コマンド利用可能

### 2.4 環境変数設定

**1. `.env` ファイル作成**:
```bash
cd /path/to/your/project
cp env.example .env
```

**2. `.env` 編集**:
```bash
# Atlassian認証
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token

# GitHub認証
GITHUB_ORG=your-org
GITHUB_TOKEN=your-github-token

# JIRA設定
JIRA_PROJECT_KEYS=MICHI-TEST
JIRA_ISSUE_TYPE_STORY=10036
JIRA_ISSUE_TYPE_SUBTASK=10037

# Confluence設定
CONFLUENCE_PRD_SPACE=MICHI-TEST
```

**3. グローバル設定（オプション）**:
```bash
mkdir -p ~/.michi
cp .env ~/.michi/.env
```

- [ ] **チェック**: `.env` ファイル作成済み、必須変数設定済み
- [ ] **チェック**: APIトークンが有効であることを確認

### 2.5 接続確認

**全チェック**:
```bash
michi preflight
```

<details>
<summary>サンプル出力</summary>

```text
🔍 Michi環境チェック

✅ Node.js: v20.11.0
✅ npm: 10.2.4
✅ Git: 2.39.2
✅ GitHub CLI: 2.40.1

📋 環境変数チェック:
✅ ATLASSIAN_URL: https://your-domain.atlassian.net
✅ ATLASSIAN_EMAIL: your-email@example.com
✅ ATLASSIAN_API_TOKEN: ********
✅ JIRA_PROJECT_KEYS: MICHI-TEST
✅ CONFLUENCE_PRD_SPACE: MICHI-TEST

🔗 接続確認:
✅ JIRA接続: OK
✅ Confluence接続: OK
✅ GitHub接続: OK

✅ すべてのチェックに成功しました
```
</details>

**個別チェック**:
```bash
michi preflight jira       # JIRA接続確認
michi preflight confluence # Confluence接続確認
michi config:validate      # 設定検証
michi config:check-security # セキュリティチェック
```

- [ ] **チェック**: `michi preflight` で全項目パス
- [ ] **チェック**: JIRA/Confluence接続成功
- [ ] **チェック**: セキュリティチェックパス

---

## 3. 単一リポジトリワークフロー

### Phase 0: 仕様化フェーズ

#### 3.1 仕様初期化 (Phase 0.0)

**コマンド**:
```text
/michi:spec-init "test-feature: テスト用の新機能実装"
```

<details>
<summary>サンプル出力</summary>

```text
📋 仕様初期化: test-feature

✅ ディレクトリ作成: .michi/specs/test-feature/
✅ spec.json作成
✅ requirements.mdテンプレート作成

次のステップ:
  /michi:spec-requirements test-feature
```
</details>

**確認事項**:
- [ ] `.michi/specs/test-feature/` ディレクトリ作成確認
- [ ] `spec.json` 生成確認（language: ja, phase: requirements-pending）
- [ ] `requirements.md` テンプレート確認

#### 3.2 要件定義 (Phase 0.1)

**コマンド**:
```text
/michi:spec-requirements test-feature
```

<details>
<summary>サンプル出力</summary>

```text
📝 要件定義生成中...

✅ requirements.md生成完了（152行）

要件サマリー:
  - Requirement 1: ユーザー認証機能 (8 criteria)
  - Requirement 2: データ管理機能 (6 criteria)
  - Requirement 3: レポート機能 (5 criteria)

次のステップ:
  /michi:spec-design test-feature
```
</details>

**確認事項**:
- [ ] `requirements.md` 生成確認
- [ ] EARS形式フォーマット確認（The [system] shall...）
- [ ] 要件番号付与確認（1.1, 1.2, ...）
- [ ] Acceptance Criteria記載確認

#### 3.3 設計 (Phase 0.2) - Michi版

**コマンド**:
```text
/michi:spec-design test-feature
```

<details>
<summary>サンプル出力</summary>

```text
🎨 技術設計書生成中...

📋 Phase 0.3: テストタイプ選択
選択されたテストタイプ:
  ✅ Unit Test
  ✅ Integration Test
  ✅ E2E Test

📋 Phase 0.4: テスト仕様書生成中...

✅ design.md生成完了（328行）
✅ test-plan.md生成完了（156行）

設計サマリー:
  - アーキテクチャ: 4層構造（Domain/Application/Infrastructure/Presentation）
  - テーブル設計: 5テーブル
  - API設計: 8エンドポイント
  - テスト計画: 42テストケース

次のステップ:
  /michi:validate-design test-feature  # オプション
  /michi:spec-tasks test-feature
```
</details>

**確認事項**:
- [ ] `design.md` 生成確認
- [ ] テスト計画フロー実行確認（Phase 0.3-0.4）
- [ ] テストタイプ選択確認（Unit/Integration/E2E）
- [ ] `test-plan.md` 生成確認

#### 3.4 設計検証（オプション）

**コマンド**:
```text
/michi:validate-design test-feature
```

<details>
<summary>サンプル出力</summary>

```text
🔍 設計品質レビュー実行中...

✅ アーキテクチャ整合性: OK
✅ データモデル設計: OK
⚠️  API設計: 2件の指摘
  - GET /users エラーハンドリング不足
  - POST /items バリデーション詳細化推奨

✅ テスト計画: OK
✅ 非機能要件: OK

総合評価: PASS（修正推奨事項あり）

推奨対応:
  1. API設計の指摘事項を design.md に反映
  2. 再レビュー実施（オプション）
```
</details>

**確認事項**:
- [ ] 設計品質レビュー実行確認
- [ ] 指摘事項の確認と修正

#### 3.5 タスク分割 (Phase 0.5) - Michi版

**コマンド**:
```text
/michi:spec-tasks test-feature
```

<details>
<summary>サンプル出力</summary>

```text
📋 実装タスク生成中...

✅ tasks.md生成完了（218行）

タスクサマリー:
  - 合計タスク数: 24
  - Phase 1（環境構築）: 4タスク
  - Phase 2（実装）: 16タスク
    - 並列実行可能: 8タスク (P)
    - 依存関係あり: 8タスク
  - Phase 3（テスト）: 4タスク

🔗 JIRA同期オプション:
  このタスクをJIRAに同期しますか？
  → "yes" でEpic/Story作成
  → "skip" で後で手動同期
```
</details>

**確認事項**:
- [ ] `tasks.md` 生成確認
- [ ] 並列実行可能タスクの識別確認（(P)マーカー）
- [ ] JIRA同期オプション確認

### Phase 0.6-0.7: 外部ツール連携

#### 3.6 JIRA同期 (Phase 0.6)

**コマンド**:
```bash
michi jira:sync test-feature
```

<details>
<summary>サンプル出力</summary>

```text
🔗 JIRA同期実行中...

📌 Epic作成:
  ✅ MICHI-TEST-123: [test-feature] テスト用の新機能実装
     Status: To Do
     Labels: test-feature, phase-2

📌 Story作成:
  ✅ MICHI-TEST-124: Phase 1 - 環境構築
  ✅ MICHI-TEST-125: Phase 2 - ユーザー認証実装
  ✅ MICHI-TEST-126: Phase 2 - データ管理実装
  ✅ MICHI-TEST-127: Phase 2 - レポート機能実装
  ✅ MICHI-TEST-128: Phase 3 - テスト実施

合計: 1 Epic, 5 Stories作成

📋 JIRA URL:
  https://your-domain.atlassian.net/browse/MICHI-TEST-123
```
</details>

**確認事項**:
- [ ] Epic作成確認（JIRA Webで確認）
- [ ] Story作成確認（5件）
- [ ] ラベル付与確認（test-feature, phase-2）
- [ ] Epic-Story リンク確認

#### 3.7 Confluence同期 (Phase 0.7)

**コマンド**:
```text
/michi:confluence-sync test-feature
```

<details>
<summary>サンプル出力</summary>

```text
📚 Confluence同期実行中...

✅ スペース確認: MICHI-TEST
✅ 親ページ作成: test-feature

📄 ページ同期:
  ✅ 要件定義書 (requirements.md)
     → https://your-domain.atlassian.net/wiki/.../requirements
  ✅ 設計書 (design.md)
     → https://your-domain.atlassian.net/wiki/.../design
  ✅ タスク一覧 (tasks.md)
     → https://your-domain.atlassian.net/wiki/.../tasks

ラベル付与: test-feature, github-sync

✅ Confluence同期完了
```
</details>

**確認事項**:
- [ ] 要件定義書同期確認（Confluence Webで確認）
- [ ] 設計書同期確認
- [ ] タスク一覧同期確認
- [ ] ラベル付与確認

### Phase 1: 環境構築

#### 3.8 環境構築

**コマンド**:
```bash
michi phase:run test-feature environment-setup
```

<details>
<summary>サンプル出力</summary>

```text
🔧 Phase 1: 環境構築実行中...

✅ プロジェクト構造作成
✅ package.json作成
✅ TypeScript設定
✅ テスト環境設定（Vitest）
✅ Lint設定（ESLint）
✅ CI/CD設定（GitHub Actions）

✅ Phase 1完了
```
</details>

**確認事項**:
- [ ] 開発環境設定確認（package.json, tsconfig.json）
- [ ] CI/CD設定確認（.github/workflows/*.yml）

### Phase 2: TDD実装

#### 3.9 TDD実装 - Michi版

**コマンド**:
```text
/michi:spec-impl test-feature
```

<details>
<summary>サンプル出力</summary>

```text
🚀 Phase 2: TDD実装開始

📋 Phase 1: OSSライセンスチェック
✅ package.json分析完了
✅ すべての依存パッケージが許可ライセンス

📋 Phase 1: バージョン監査
✅ すべてのパッケージが最新LTS

📋 Phase 2: RED-GREEN-REFACTORサイクル
  Task 2.1: ユーザーモデル実装
    🔴 RED: テスト失敗（期待通り）
    🟢 GREEN: テストパス
    🔵 REFACTOR: コード最適化
    ✅ Task 2.1完了

  Task 2.2: 認証サービス実装
    🔴 RED: テスト失敗（期待通り）
    🟢 GREEN: テストパス
    🔵 REFACTOR: コード最適化
    ✅ Task 2.2完了

  ... (省略)

📋 Phase 2: 自動修正ループ
  ループ 1:
    ✅ Type Check: PASS
    ✅ Lint: PASS
    ✅ Test: PASS
  → 自動修正不要

📋 Phase 4: カバレッジ確認
  ✅ Line Coverage: 96.5% (目標: 95%以上)
  ✅ Branch Coverage: 94.2%
  ✅ Function Coverage: 97.8%

✅ TDD実装完了
  - 実装タスク: 16/16 complete
  - テストカバレッジ: 96.5%
  - 全テストパス: 124/124

次のステップ:
  /michi:validate-impl test-feature  # オプション
  git add . && git commit -m "feat: test-feature implementation"
```
</details>

**確認事項**:
- [ ] RED-GREEN-REFACTORサイクル実行確認
- [ ] OSSライセンスチェック確認
- [ ] バージョン監査確認
- [ ] 自動修正ループ確認（Type Check→Lint→Test）
- [ ] カバレッジ確認（95%以上）

#### 3.10 実装検証

**コマンド**:
```text
/michi:validate-impl test-feature
```

<details>
<summary>サンプル出力</summary>

```text
🔍 実装検証実行中...

📋 要件カバレッジ:
  ✅ Requirement 1: 100% (8/8 criteria)
  ✅ Requirement 2: 100% (6/6 criteria)
  ✅ Requirement 3: 100% (5/5 criteria)

📋 設計との整合性:
  ✅ アーキテクチャ: OK
  ✅ データモデル: OK
  ✅ API設計: OK

📋 テスト品質:
  ✅ ユニットテスト: 82件
  ✅ 統合テスト: 28件
  ✅ E2Eテスト: 14件
  ✅ カバレッジ: 96.5%

総合評価: PASS

✅ すべての検証項目をクリアしました
```
</details>

**確認事項**:
- [ ] 要件カバレッジ100%確認
- [ ] 設計との整合性確認
- [ ] テスト品質確認

### Phase A: PR前自動テスト

#### 3.11 PR前テスト

**コマンド**:
```bash
michi phase:run test-feature phase-a
```

<details>
<summary>サンプル出力</summary>

```text
🧪 Phase A: PR前自動テスト実行中...

✅ 単体テスト: 82/82 passed
✅ Lint: 0 errors, 0 warnings
✅ ビルド: 成功（3.2秒）
✅ Type Check: 0 errors

✅ Phase A完了 - PRを作成できます
```
</details>

**確認事項**:
- [ ] 単体テスト全パス確認
- [ ] Lint成功確認（0 errors, 0 warnings）
- [ ] ビルド成功確認
- [ ] Type Check成功確認（0 errors）

#### 3.12 PR作成

**コマンド**:
```text
/development-toolkit:create_pr
```

<details>
<summary>サンプル出力</summary>

```text
📝 PR作成中...

✅ ブランチ確認: feature/test-feature
✅ コミット確認: 12 commits
✅ 変更ファイル: 24 files changed, 1,856 insertions(+), 12 deletions(-)

✅ PR作成完了
   URL: https://github.com/your-org/your-repo/pull/123
   Title: feat: test-feature - テスト用の新機能実装

次のステップ:
  1. PRレビュー依頼
  2. CI/CDパス待ち
  3. レビュー承認後マージ
```
</details>

**確認事項**:
- [ ] PR作成確認（GitHub Webで確認）
- [ ] レビュー依頼確認
- [ ] CI/CD自動実行確認

### Phase 3: 追加品質保証

#### 3.13 コードレビュー

**コマンド**:
```text
/code-review:code-review
```

<details>
<summary>サンプル出力</summary>

```text
🔍 コードレビュー実行中...

📋 コード品質レビュー:
  ✅ 可読性: Good
  ✅ 保守性: Good
  ✅ DRY原則: OK
  ⚠️  複雑度: 1箇所で高複雑度検出
     → src/services/report-generator.ts:L42-68
     推奨: メソッド分割

📋 セキュリティレビュー:
  ✅ 入力検証: OK
  ✅ XSS対策: OK
  ✅ SQLインジェクション対策: OK
  ✅ 認証・認可: OK

📋 パフォーマンスレビュー:
  ✅ アルゴリズム効率: OK
  ⚠️  メモリ使用量: 1箇所で最適化推奨
     → src/services/data-processor.ts:L123
     推奨: ストリーム処理に変更

総合評価: PASS（改善推奨事項あり）

推奨対応:
  1. 複雑度の高いメソッドをリファクタリング
  2. メモリ使用量の最適化
```
</details>

**確認事項**:
- [ ] コード品質レビュー確認
- [ ] セキュリティレビュー確認
- [ ] パフォーマンスレビュー確認
- [ ] 指摘事項の対応

#### 3.14 デザインレビュー（Frontend時）

**確認事項**（Frontend実装時のみ）:
- [ ] アクセシビリティ確認（WCAG 2.1）
- [ ] レスポンシブデザイン確認
- [ ] UXパターン確認
- [ ] Core Web Vitals確認

### Phase B: リリース準備テスト

#### 3.15 リリース準備テスト

**コマンド**:
```bash
michi phase:run test-feature phase-b
```

<details>
<summary>サンプル出力</summary>

```text
🧪 Phase B: リリース準備テスト実行中...

✅ 統合テスト: 28/28 passed (実行時間: 45秒)
✅ E2Eテスト: 14/14 passed (実行時間: 2分18秒)
✅ パフォーマンステスト:
   - API応答時間: 平均 156ms (目標: <200ms)
   - スループット: 842 req/sec (目標: >500 req/sec)
✅ セキュリティテスト:
   - 脆弱性スキャン: 0 vulnerabilities
   - 依存関係監査: OK

✅ Phase B完了 - リリース準備完了
```
</details>

**確認事項**:
- [ ] 統合テスト実行確認
- [ ] E2Eテスト実行確認
- [ ] パフォーマンステスト実行確認（応答時間、スループット）
- [ ] セキュリティテスト実行確認

### Phase 4-5: リリース

#### 3.16 リリース準備

**手動作業**:

1. **CHANGELOGアップデート**:
   ```bash
   # CHANGELOG.mdに以下を追加
   ## [1.2.0] - 2026-01-01
   ### Added
   - test-feature: テスト用の新機能実装
   ```

2. **バージョン更新**:
   ```bash
   npm version minor  # 1.1.0 → 1.2.0
   ```

3. **Gitタグ作成**:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

**確認事項**:
- [ ] CHANGELOGアップデート確認
- [ ] バージョン更新確認（package.json）
- [ ] Gitタグ作成確認

#### 3.17 リリース実行

**npmリリース**:
```bash
npm publish
```

<details>
<summary>サンプル出力</summary>

```text
npm notice
npm notice 📦  your-package@1.2.0
npm notice === Tarball Contents ===
npm notice 1.2kB  package.json
npm notice 3.4kB  README.md
npm notice 124.5kB dist/
npm notice === Tarball Details ===
npm notice name:          your-package
npm notice version:       1.2.0
npm notice package size:  42.3 kB
npm notice unpacked size: 129.1 kB
npm notice shasum:        a1b2c3d4e5f6...
npm notice integrity:     sha512-...
npm notice total files:   24
npm notice
+ your-package@1.2.0
```
</details>

**リリースノート公開**:
- GitHubリリース作成
- Confluenceリリースノートページ作成

**確認事項**:
- [ ] npmリリース確認
- [ ] リリースノート公開確認

#### 3.18 仕様アーカイブ

**コマンド**:
```text
/michi:spec-archive test-feature
```

<details>
<summary>サンプル出力</summary>

```text
📦 仕様アーカイブ実行中...

✅ アーカイブ作成: .michi/specs/archived/test-feature-20260101/
✅ メタデータ更新: archived_at: 2026-01-01T12:00:00Z
✅ 元ディレクトリ削除: .michi/specs/test-feature/

✅ アーカイブ完了
```
</details>

**確認事項**:
- [ ] 仕様アーカイブ確認
- [ ] `.michi/specs/archived/` 移動確認

---

## 4. Multi-Repoワークフロー

### 4.1 Multi-Repoプロジェクト初期化

**コマンド**:
```text
/michi-multi-repo:spec-init "multi-repo-test: マイクロサービステストプロジェクト"
```

<details>
<summary>サンプル出力</summary>

```text
🚀 Multi-Repoプロジェクト初期化中...

✅ 親プロジェクト作成: .michi/multi-repo/multi-repo-test/
✅ metadata.json作成
✅ overview/ディレクトリ作成
✅ steering/ディレクトリ作成

プロジェクト構成:
  - Project Name: multi-repo-test
  - Description: マイクロサービステストプロジェクト
  - Repositories: 0 (add with /michi-multi-repo:add-repo)

次のステップ:
  1. michi multi-repo:add-repo multi-repo-test --name service-a --url ...
  2. michi multi-repo:add-repo multi-repo-test --name service-b --url ...
```
</details>

**確認事項**:
- [ ] 親プロジェクト作成確認
- [ ] メタデータ設定確認（.michi/multi-repo/multi-repo-test/metadata.json）

### 4.2 リポジトリ追加

**コマンド**:
```bash
michi multi-repo:add-repo multi-repo-test \
  --name service-a \
  --url https://github.com/your-org/service-a \
  --branch main

michi multi-repo:add-repo multi-repo-test \
  --name service-b \
  --url https://github.com/your-org/service-b \
  --branch main
```

<details>
<summary>サンプル出力</summary>

```text
✅ リポジトリ追加: service-a
   URL: https://github.com/your-org/service-a
   Branch: main

✅ リポジトリ追加: service-b
   URL: https://github.com/your-org/service-b
   Branch: main

現在の構成:
  - multi-repo-test
    - service-a (main)
    - service-b (main)
```
</details>

**プロジェクト一覧確認**:
```bash
michi multi-repo:list
```

<details>
<summary>サンプル出力</summary>

```text
📋 Multi-Repoプロジェクト一覧:

multi-repo-test
  Description: マイクロサービステストプロジェクト
  Repositories: 2
    - service-a (main) - https://github.com/your-org/service-a
    - service-b (main) - https://github.com/your-org/service-b
  Status: active
  Created: 2026-01-01
```
</details>

**確認事項**:
- [ ] リポジトリ登録確認（2件）
- [ ] プロジェクト一覧確認

### 4.3 Multi-Repo要件定義

**コマンド**:
```text
/michi-multi-repo:spec-requirements multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
📝 Multi-Repo要件定義生成中...

✅ 統合要件定義書生成: overview/requirements.md (245行)

要件サマリー:
  - Global Requirements: 4件
  - service-a Requirements: 6件
  - service-b Requirements: 5件
  - Integration Requirements: 3件

次のステップ:
  /michi-multi-repo:spec-design multi-repo-test
```
</details>

**確認事項**:
- [ ] 統合要件定義書生成確認

### 4.4 Multi-Repo設計

**コマンド**:
```text
/michi-multi-repo:spec-design multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
🎨 Multi-Repo設計書生成中...

✅ 統合設計書生成: overview/design.md (412行)
✅ シーケンス図生成: overview/sequence.md (89行)
✅ API契約定義: overview/api-contracts.md (156行)

設計サマリー:
  - アーキテクチャ: マイクロサービス
  - サービス間通信: REST API + Event Bus
  - API契約: 12エンドポイント
  - イベントスキーマ: 5イベント
  - 共通データモデル: 8モデル

次のステップ:
  /michi-multi-repo:spec-review multi-repo-test
```
</details>

**確認事項**:
- [ ] 統合設計書生成確認
- [ ] シーケンス図生成確認
- [ ] API契約定義確認

### 4.5 クロスリポジトリレビュー

**コマンド**:
```text
/michi-multi-repo:spec-review multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
🔍 クロスリポジトリレビュー実行中...

📋 API契約整合性:
  ✅ service-a ↔ service-b: OK
  ✅ エンドポイント定義: 一致
  ✅ リクエスト/レスポンス型: 一致

📋 データモデル整合性:
  ✅ User モデル: 一致
  ✅ Product モデル: 一致
  ⚠️  Order モデル: フィールド不一致
     service-a: { id, userId, productId, quantity, status }
     service-b: { id, customerId, itemId, amount, state }
     → フィールド名の統一を推奨

📋 イベントスキーマ整合性:
  ✅ OrderCreatedEvent: 一致
  ✅ OrderUpdatedEvent: 一致

📋 依存関係整合性:
  ✅ 循環依存: なし
  ✅ 依存方向: OK

📋 テスト仕様整合性:
  ✅ 統合テストシナリオ: 定義済み
  ✅ E2Eテストシナリオ: 定義済み

総合評価: WARN

品質ゲート判定: WARN
  - データモデル不一致（Order）の修正を推奨
  - 修正後、再レビュー実施を推奨

推奨対応:
  1. Order モデルのフィールド名を統一
  2. /michi-multi-repo:spec-design multi-repo-test で再生成
  3. /michi-multi-repo:spec-review multi-repo-test で再レビュー
```
</details>

**確認事項**:
- [ ] API契約整合性確認
- [ ] データモデル整合性確認
- [ ] イベントスキーマ整合性確認
- [ ] 品質ゲート判定確認（PASS/WARN/BLOCK）

### 4.6 仕様展開（並列実行）

**コマンド**:
```text
/michi-multi-repo:propagate-specs multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
🚀 仕様展開開始（並列実行）...

並列実行（最大3並列）:
  [1/2] service-a: spec-init → spec-requirements → spec-design
  [2/2] service-b: spec-init → spec-requirements → spec-design

service-a:
  ✅ spec-init完了
  ✅ spec-requirements完了
  ✅ spec-design完了
  ✅ チェックポイント保存

service-b:
  ✅ spec-init完了
  ✅ spec-requirements完了
  ✅ spec-design完了
  ✅ チェックポイント保存

✅ 仕様展開完了（2/2リポジトリ）

次のステップ:
  /michi-multi-repo:impl-all multi-repo-test
```
</details>

**確認事項**:
- [ ] 各リポジトリへの仕様展開確認
- [ ] 並列実行確認（最大3並列）
- [ ] チェックポイント保存確認

### 4.7 全リポジトリ実装（並列実行）

**コマンド**:
```text
/michi-multi-repo:impl-all multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
🚀 全リポジトリ実装開始（並列実行）...

並列実行（2リポジトリ）:
  [1/2] service-a: /michi:spec-impl
  [2/2] service-b: /michi:spec-impl

service-a:
  ✅ TDDサイクル完了（24タスク）
  ✅ カバレッジ: 97.2% (目標: 95%以上)
  ✅ 全テストパス: 156/156

service-b:
  ✅ TDDサイクル完了（18タスク）
  ✅ カバレッジ: 96.8% (目標: 95%以上)
  ✅ 全テストパス: 124/124

✅ 全リポジトリ実装完了（2/2リポジトリ）

次のステップ:
  1. michi multi-repo:ci-status multi-repo-test
  2. 統合テスト実行
  3. PRマージ
```
</details>

**確認事項**:
- [ ] 各リポジトリでのTDD実装確認
- [ ] カバレッジ95%以上確認

### 4.8 CI結果集約

**コマンド**:
```bash
michi multi-repo:ci-status multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
📊 Multi-Repo CI結果集約

service-a:
  ✅ Build: success (3.2秒)
  ✅ Test: 156/156 passed
  ✅ Lint: 0 errors
  ✅ Type Check: 0 errors
  最終コミット: feat: implement service-a (2分前)

service-b:
  ✅ Build: success (2.8秒)
  ✅ Test: 124/124 passed
  ✅ Lint: 0 errors
  ✅ Type Check: 0 errors
  最終コミット: feat: implement service-b (3分前)

総合結果: ✅ ALL PASS

差分レポート（--diff）:
  - 新規ファイル: 48
  - 変更ファイル: 12
  - 削除ファイル: 0
```
</details>

**確認事項**:
- [ ] 全リポジトリのCI結果確認（ALL PASS）
- [ ] 差分レポート確認

### 4.9 Multi-Repo Confluence同期

**コマンド**:
```bash
michi multi-repo:confluence-sync multi-repo-test
```

<details>
<summary>サンプル出力</summary>

```text
📚 Multi-Repo Confluence同期実行中...

✅ 親ページ作成: multi-repo-test
✅ 概要ドキュメント同期: overview/*
  - architecture.md
  - requirements.md
  - sequence.md
  - api-contracts.md

✅ service-aドキュメント同期
✅ service-bドキュメント同期

✅ Confluence同期完了
   URL: https://your-domain.atlassian.net/wiki/.../multi-repo-test
```
</details>

**確認事項**:
- [ ] 統合ドキュメント同期確認

### 4.10 Multi-Repoテスト実行

**コマンド**:
```bash
michi multi-repo:test multi-repo-test --type integration
```

<details>
<summary>サンプル出力</summary>

```text
🧪 Multi-Repo統合テスト実行中...

✅ ヘルスチェック:
  - service-a: OK (200ms)
  - service-b: OK (180ms)

✅ 統合テスト実行:
  Scenario 1: User registration flow
    ✅ service-a → service-b: OK
  Scenario 2: Order creation flow
    ✅ service-a → service-b: OK
  Scenario 3: Event propagation
    ✅ service-a → EventBus → service-b: OK

✅ 統合テスト完了: 12/12 passed

次のステップ:
  E2Eテスト実行: michi multi-repo:test multi-repo-test --type e2e
```
</details>

**確認事項**:
- [ ] 統合テスト実行確認
- [ ] ヘルスチェック確認

---

## 5. 外部連携詳細テスト

### 5.1 JIRA連携

#### ステータス更新

**コマンド**:
```bash
michi jira:transition MICHI-TEST-123 "In Progress"
michi jira:transition MICHI-TEST-123 "Done"
```

<details>
<summary>サンプル出力</summary>

```text
✅ MICHI-TEST-123: To Do → In Progress
✅ MICHI-TEST-123: In Progress → Done
```
</details>

**確認事項**:
- [ ] ステータス更新確認（JIRA Webで確認）

#### コメント追加

**コマンド**:
```bash
michi jira:comment MICHI-TEST-123 "実装完了、レビュー依頼"
```

<details>
<summary>サンプル出力</summary>

```text
✅ MICHI-TEST-123にコメント追加
   コメント: 実装完了、レビュー依頼
   投稿者: your-email@example.com
   投稿日時: 2026-01-01 12:00:00
```
</details>

**確認事項**:
- [ ] コメント追加確認（JIRA Webで確認）

### 5.2 Confluence連携

#### ドキュメントタイプ別同期

**コマンド**:
```bash
michi confluence:sync test-feature requirements
michi confluence:sync test-feature design
michi confluence:sync test-feature tasks
```

<details>
<summary>サンプル出力</summary>

```text
✅ requirements.md → Confluence同期完了
   URL: https://your-domain.atlassian.net/wiki/.../requirements

✅ design.md → Confluence同期完了
   URL: https://your-domain.atlassian.net/wiki/.../design

✅ tasks.md → Confluence同期完了
   URL: https://your-domain.atlassian.net/wiki/.../tasks
```
</details>

**確認事項**:
- [ ] 各ドキュメントタイプの同期確認（Confluence Webで確認）

### 5.3 GitHub連携

#### PR操作

**確認事項**:
- [ ] PR作成確認（`/development-toolkit:create_pr`）
- [ ] PRレビュー確認（GitHub Web）
- [ ] PRマージ確認（`gh pr merge`）

#### Actions連携

**確認事項**:
- [ ] Workflow実行確認（GitHub Actions）
- [ ] CI結果取得確認（`michi multi-repo:ci-status`）

---

## 6. 品質自動化テスト

### 6.1 OSSライセンスチェック

**実行タイミング**: `/michi:spec-impl` のPhase 1で自動実行

**確認事項**:
- [ ] GPL/AGPL/SSPL検出確認（Critical）
- [ ] LGPL/MPL警告確認（Warning）
- [ ] 代替パッケージ提案確認

**サンプル出力**（問題検出時）:
```text
❌ OSSライセンスチェック失敗

Critical:
  - package-with-gpl@1.0.0 (GPL-3.0)
    → 即時削除が必要

推奨代替パッケージ:
  - alternative-package@2.0.0 (MIT)
  - npm install alternative-package

実装を停止しています。代替パッケージをインストール後、再実行してください。
```

### 6.2 バージョン監査

**実行タイミング**: `/michi:spec-impl` のPhase 1で自動実行

**確認事項**:
- [ ] EOL検出確認（Critical）
- [ ] アップグレードパス提案確認

**サンプル出力**（問題検出時）:
```text
⚠️  バージョン監査警告

Warning:
  - node@16.20.0 (EOL: 2023-09-11)
    → アップグレード推奨: node@20.11.0

Info:
  - express@4.18.0 (最新LTSでない)
    → 最新: express@4.19.0
```

### 6.3 自動コードレビュー

**実行タイミング**: `/michi:spec-impl` のPhase 3で自動実行

**確認事項**:
- [ ] コード品質レビュー確認
- [ ] セキュリティレビュー確認
- [ ] パフォーマンスレビュー確認

**サンプル出力**: セクション3.13参照

### 6.4 自動修正ループ

**実行タイミング**: `/michi:spec-impl` のPhase 2で自動実行

**確認事項**:
- [ ] Type Check自動修正確認
- [ ] Lint自動修正確認（`npm run lint:fix`）
- [ ] 最大5回ループ確認

**サンプル出力**:
```text
📋 Phase 2: 自動修正ループ

ループ 1:
  ❌ Type Check: 3 errors
     → 自動修正試行...
  ⚠️  Lint: 5 warnings
     → npm run lint:fix 実行...
  ✅ Test: PASS

ループ 2:
  ✅ Type Check: PASS
  ✅ Lint: PASS
  ✅ Test: PASS

✅ 自動修正完了（2ループで収束）
```

---

## 7. その他機能テスト

### 7.1 Steeringドキュメント管理

**コマンド**:
```text
/michi:steering
/michi:steering-custom
```

<details>
<summary>サンプル出力</summary>

```text
📝 Steeringドキュメント管理

/michi:steering:
  ✅ .michi/steering/product.md 作成
  ✅ .michi/steering/tech.md 作成
  ✅ .michi/steering/structure.md 作成

/michi:steering-custom:
  選択したカスタムSteering:
    ✅ api-standards.md
    ✅ security.md
    ✅ testing.md

✅ Steeringドキュメント作成完了
```
</details>

**確認事項**:
- [ ] ステアリングドキュメント作成確認（.michi/steering/）
- [ ] カスタムステアリング作成確認

### 7.2 ドキュメントレビュー

**コマンド**:
```text
/doc:review
```

<details>
<summary>サンプル出力</summary>

```text
## ドキュメントレビュー結果

### 📊 文量チェック
✅ OK (45行、目標: 30-50行)

### 🔍 禁止パターンチェック
⚠️ 冗長表現: 2箇所
  - L12: 「利用することができます」 → 「利用できます」
  - L28: 「という機能」 → 「機能」

### ✅ 必須セクションチェック
✅ すべて揃っています
  - 概要
  - 使い方
  - ライセンス

### 🎯 総合評価
⚠️ 改善推奨 - 冗長表現の修正をお勧めします
```
</details>

**確認事項**:
- [ ] 文量チェック確認
- [ ] 禁止パターンチェック確認
- [ ] 必須セクションチェック確認

### 7.3 仕様ステータス確認

**コマンド**:
```text
/michi:spec-status test-feature
```

<details>
<summary>サンプル出力</summary>

```text
📊 仕様ステータス: test-feature

基本情報:
  - Feature Name: test-feature
  - Created: 2026-01-01
  - Language: ja
  - Phase: implementation-complete

承認状態:
  ✅ Requirements: approved
  ✅ Design: approved
  ✅ Tasks: approved

実装進捗:
  ✅ Phase 1完了
  ✅ Phase 2完了（24/24タスク）
  ✅ Phase A完了
  ✅ Phase B完了

テスト結果:
  - ユニットテスト: 82/82 passed
  - 統合テスト: 28/28 passed
  - E2Eテスト: 14/14 passed
  - カバレッジ: 96.5%

次のステップ:
  Phase 4-5: リリース準備
```
</details>

**確認事項**:
- [ ] 進捗表示確認
- [ ] フェーズ状態確認

### 7.4 設定移行

**ドライラン**:
```bash
michi migrate --dry-run
```

<details>
<summary>サンプル出力</summary>

```text
🔄 Michi設定移行ツール
   (ドライランモード - 実際の変更は行われません)

[移行内容]
  グローバル設定に移行: 10項目
    - ATLASSIAN_URL
    - ATLASSIAN_EMAIL
    - ATLASSIAN_API_TOKEN
    - GITHUB_ORG
    - GITHUB_TOKEN
    (省略)
  プロジェクト設定に維持: 1項目
    - JIRA_PROJECT_KEYS

⚠️  --dry-runモードのため、実際の変更は行われませんでした

実際に移行を実行する場合:
  $ michi migrate
```
</details>

**実行**:
```bash
michi migrate --force
```

**ロールバック**:
```bash
michi migrate --rollback /path/to/backup
```

**確認事項**:
- [ ] 移行プレビュー確認（--dry-run）
- [ ] 移行実行確認（--force）
- [ ] ロールバック確認（--rollback）

---

## 8. 障害対応・ロールバック手順

### 8.1 JIRA同期失敗時

**症状**: `michi jira:sync` がエラーで失敗

**対処手順**:

1. **接続確認**:
   ```bash
   michi preflight jira
   ```

2. **認証情報確認**:
   ```bash
   # .envファイルを確認
   cat .env | grep ATLASSIAN
   ```
   - `ATLASSIAN_URL` が正しいか
   - `ATLASSIAN_EMAIL` が正しいか
   - `ATLASSIAN_API_TOKEN` が有効か

3. **再同期**:
   ```bash
   michi jira:sync <feature> --force
   ```

4. **JIRA設定確認**:
   - プロジェクトキーが正しいか
   - Issue Type IDが正しいか

### 8.2 Confluence同期失敗時

**症状**: `/michi:confluence-sync` がエラーで失敗

**対処手順**:

1. **接続確認**:
   ```bash
   michi preflight confluence
   ```

2. **スペース権限確認**:
   - Confluenceスペースへの書き込み権限があるか
   - スペースキーが正しいか

3. **再同期**:
   ```text
   /michi:confluence-sync <feature>
   ```

### 8.3 実装失敗時

**症状**: `/michi:spec-impl` が途中で失敗

**対処手順**:

1. **タスクステータス確認**:
   ```text
   /michi:spec-status <feature>
   ```

2. **部分再実装**（特定タスクのみ）:
   ```text
   /michi:spec-impl <feature> <task-id>
   ```
   例: `/michi:spec-impl test-feature 2.3`

3. **全体再実装**:
   ```text
   /michi:spec-impl <feature>
   ```

4. **エラーログ確認**:
   - Type Checkエラー: `npm run type-check`
   - Lintエラー: `npm run lint`
   - テストエラー: `npm run test`

### 8.4 Multi-Repo失敗時

**症状**: `/michi-multi-repo:propagate-specs` または `/michi-multi-repo:impl-all` が失敗

**対処手順**:

1. **チェックポイント確認**:
   - `.michi/multi-repo/<project>/checkpoints/` を確認

2. **個別リポジトリで修正**:
   - 失敗したリポジトリをクローン
   - 手動で `/michi:spec-impl` 実行

3. **再実行**:
   ```text
   /michi-multi-repo:propagate-specs <project>
   ```
   または
   ```text
   /michi-multi-repo:impl-all <project>
   ```

4. **CI確認**:
   ```bash
   michi multi-repo:ci-status <project>
   ```

---

## 9. チェックリストサマリー

### 全体進捗

| フェーズ | 確認項目数 | 完了 |
|---------|-----------|------|
| **1. 前提条件・環境準備** | 5 | [ ] |
| **2. インストール・初期設定** | 8 | [ ] |
| **3. 単一リポジトリワークフロー** | | |
| 　Phase 0: 仕様化 | 12 | [ ] |
| 　Phase 0.6-0.7: 外部連携 | 6 | [ ] |
| 　Phase 1-2: 環境構築・実装 | 8 | [ ] |
| 　Phase A-B: テスト | 8 | [ ] |
| 　Phase 4-5: リリース | 4 | [ ] |
| **4. Multi-Repo** | 12 | [ ] |
| **5. 外部連携詳細** | 8 | [ ] |
| **6. 品質自動化** | 8 | [ ] |
| **7. その他機能** | 6 | [ ] |
| **合計** | **85** | [ ] |

### フェーズ別チェックリスト

#### 前提条件・環境準備（5項目）

- [ ] 1.1 システム要件確認
- [ ] 1.2 アカウント準備
- [ ] 1.3 テスト用リソース準備

#### インストール・初期設定（8項目）

- [ ] 2.1 cc-sddセットアップ
- [ ] 2.2 Michiプラグインインストール
- [ ] 2.3 CLIツールインストール
- [ ] 2.4 環境変数設定
- [ ] 2.5 接続確認（preflight全パス）

#### Phase 0: 仕様化（12項目）

- [ ] 3.1 仕様初期化
- [ ] 3.2 要件定義（EARS形式）
- [ ] 3.3 設計（テスト計画統合）
- [ ] 3.4 設計検証（オプション）
- [ ] 3.5 タスク分割

#### Phase 0.6-0.7: 外部連携（6項目）

- [ ] 3.6 JIRA同期（Epic/Story作成）
- [ ] 3.7 Confluence同期（要件/設計/タスク）

#### Phase 1-2: 環境構築・実装（8項目）

- [ ] 3.8 環境構築
- [ ] 3.9 TDD実装（カバレッジ95%以上）
- [ ] 3.10 実装検証

#### Phase A-B: テスト（8項目）

- [ ] 3.11 PR前テスト（単体/Lint/ビルド/Type Check）
- [ ] 3.12 PR作成
- [ ] 3.13 コードレビュー
- [ ] 3.14 デザインレビュー（Frontend時）
- [ ] 3.15 リリース準備テスト（統合/E2E/性能/セキュリティ）

#### Phase 4-5: リリース（4項目）

- [ ] 3.16 リリース準備（CHANGELOG/バージョン/タグ）
- [ ] 3.17 リリース実行（npm publish）
- [ ] 3.18 仕様アーカイブ

#### Multi-Repo（12項目）

- [ ] 4.1 プロジェクト初期化
- [ ] 4.2 リポジトリ追加
- [ ] 4.3 要件定義
- [ ] 4.4 設計
- [ ] 4.5 クロスリポジトリレビュー（品質ゲート）
- [ ] 4.6 仕様展開（並列実行）
- [ ] 4.7 全リポジトリ実装（並列実行）
- [ ] 4.8 CI結果集約
- [ ] 4.9 Confluence同期
- [ ] 4.10 統合テスト実行

#### 外部連携詳細（8項目）

- [ ] 5.1 JIRAステータス更新
- [ ] 5.1 JIRAコメント追加
- [ ] 5.2 Confluenceドキュメントタイプ別同期
- [ ] 5.3 GitHub PR操作
- [ ] 5.3 GitHub Actions連携

#### 品質自動化（8項目）

- [ ] 6.1 OSSライセンスチェック（GPL/AGPL/SSPL検出）
- [ ] 6.2 バージョン監査（EOL検出）
- [ ] 6.3 自動コードレビュー
- [ ] 6.4 自動修正ループ（最大5回）

#### その他機能（6項目）

- [ ] 7.1 Steeringドキュメント管理
- [ ] 7.2 ドキュメントレビュー
- [ ] 7.3 仕様ステータス確認
- [ ] 7.4 設定移行（migrate）

---

## 付録

### A. 参考リンク

- [Michiドキュメント](../../README.md)
- [ワークフローガイド](./workflow.md)
- [CLIリファレンス](../reference/cli.md)
- [AIコマンドリファレンス](../reference/ai-commands.md)
- [Multi-Repoガイド](./multi-repo.md)
- [Atlassian連携ガイド](./atlassian-integration.md)

### B. バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v0.19.0 | 2026-01-01 | 初版作成 |

---

**お問い合わせ**: [GitHub Issues](https://github.com/sk8metalme/michi/issues)
