# AI開発ワークフローガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

このガイドでは、Michiを使用したAI駆動開発フローの全体像を説明します。

## ワークフロー全体像

> **注**: このワークフローは cc-sdd (Spec-Driven Development) の標準フローを Michi が拡張したものです。
> - **cc-sdd 標準**: Phase 0.0-0.2, 0.5 (`/kiro:*` コマンド)
> - **Michi 固有拡張**: Phase 0.3-0.4, 0.6-0.7, Phase 1-5, Phase A/B (テスト計画・実行、JIRA/Confluence連携)

```
Phase 0.0: 仕様の初期化 (/kiro:spec-init) ← cc-sdd 標準
   ↓
Phase 0.1: 要件定義 (/kiro:spec-requirements) ← cc-sdd 標準
   ↓ GitHub → Confluence同期 ← Michi 固有
   ↓ 企画・部長が承認

Phase 0.2: 設計 (/michi:spec-design または /kiro:spec-design)
   ↓ /michi:spec-design 推奨（Phase 0.3-0.4 ガイダンス付き）
   ↓ GitHub → Confluence同期 ← Michi 固有
   ↓ 見積もり生成 → Excel出力 ← Michi 固有
   ↓ アーキテクト・部長が承認

Phase 0.3: テストタイプの選択 ← Michi 固有（重要）
   ↓ テスト計画フローに従う

Phase 0.4: テスト仕様書の作成 ← Michi 固有（重要）
   ↓ テンプレートを使用

Phase 0.5: タスク分割 (/kiro:spec-tasks) ← cc-sdd 標準
   ↓ tasks.md生成

Phase 0.6: タスクのJIRA同期 ← Michi 固有
   ↓ Epic/Story/Subtask自動作成

Phase 0.7: Confluence同期 ← Michi 固有
   ↓
Phase 1: 環境構築・基盤整備 ← Michi 固有
   ↓ テスト環境セットアップ

Phase 2: TDD実装 (/kiro:spec-impl) ← cc-sdd 標準
   ↓ テスト → コード → リファクタリング

Phase A: PR作成前の自動テスト（CI/CD） ← Michi 固有
   ↓ 単体テスト + Lint + ビルド
   ↓ GitHub PR作成
   ↓ PRマージ

Phase 3: 追加の品質保証（PRマージ後） ← Michi 固有
   ↓ 静的解析・セキュリティスキャン

Phase B: リリース準備時の手動テスト ← Michi 固有
   ↓ 統合・E2E・パフォーマンス・セキュリティ

Phase 4: リリース準備ドキュメント作成 (/kiro:release-prep) ← Michi 固有
   ↓ Confluenceリリース手順書
   ↓ リリースJIRA起票

Phase 5: リリース実行 ← Michi 固有
   ↓ タグ作成 → CI/CD → GitHub Release作成
```

## フェーズ別詳細

### Phase 0.0-0.1: 仕様の初期化と要件定義

#### Phase 0.0 Step 1: 仕様の初期化

Cursorで実行：

```bash
# 凡例
/kiro:spec-init <機能説明>

# 具体例
/kiro:spec-init ユーザー認証機能を実装したい。OAuth 2.0とJWTを使用。
```

AIが `.kiro/specs/<feature>/` ディレクトリを作成します。

#### Phase 0.1 Step 1: 要件定義の生成

```bash
# 凡例
/kiro:spec-requirements <feature>

# 具体例
/kiro:spec-requirements user-auth
```

AIが以下を生成：

- `.kiro/specs/<feature>/requirements.md`
- ビジネス要件、機能要件、非機能要件、リスク

#### Phase 0.1 Step 2: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> 要件定義追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 要件定義追加"
jj git push
```

#### Phase 0.1 Step 3: Confluenceに同期

Cursorで実行：

```bash
# 凡例
/michi:confluence-sync <feature>

# 具体例
/michi:confluence-sync user-auth
```

AIが自動的に：

- Confluenceページ作成
- プロジェクト情報付与
- 企画・部長にメンション通知

#### Phase 0.1 Step 4: 承認待ち

企画・部長がConfluenceで：

- 要件をレビュー
- コメントでフィードバック
- Page Propertiesで承認

### Phase 0.2: 設計

#### Phase 0.2 Step 1: 設計書の生成

```bash
# 推奨: Michi 拡張版（Phase 0.3-0.4 ガイダンス付き）
/michi:spec-design <feature>

# または cc-sdd 標準版
/kiro:spec-design <feature>

# 具体例
/michi:spec-design user-auth
```

**推奨**: `/michi:spec-design` を使用すると、設計完了後に Phase 0.3-0.4（テスト計画）へのガイダンスが自動的に表示されます。

AIが以下を生成：

- アーキテクチャ図
- API設計
- データベース設計
- 見積もり

#### Phase 0.2 Step 2: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> 設計追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 設計追加"
jj git push
```

#### Phase 0.2 Step 3: Confluenceに同期 + 見積もり出力

```bash
# 凡例
/michi:confluence-sync <feature>

# 具体例
/michi:confluence-sync user-auth
```

見積もりExcelファイルが `estimates/<feature>-estimate.xlsx` に出力されます。

#### Phase 0.2 Step 4: 承認待ち

アーキテクト・部長がレビュー・承認

### Phase 0.3-0.4: テスト計画

> **Michi 固有機能**: Phase 0.3-0.4 は Michi 独自の拡張フェーズです。cc-sdd 標準には含まれません。
>
> `/michi:spec-design` コマンドを使用すると、設計完了後に自動的にこのフェーズへのガイダンスが表示されます。

#### Phase 0.3: テストタイプの選択

Phase 0.2（設計）完了後、Phase 0.5（タスク分割）の前に、どのテストタイプが必要かを決定します。

詳細は [テスト計画フロー](../testing/test-planning-flow.md#phase-03-テストタイプの選択) を参照してください。

**選択基準**:

- 単体テスト: すべてのプロジェクトで必須
- 統合テスト: 複数コンポーネントが連携するシステムで推奨
- E2Eテスト: ユーザーインターフェースを持つアプリケーションで推奨
- パフォーマンステスト: 高負荷が予想される、レスポンスタイムが重要な場合
- セキュリティテスト: 機密データを扱う、外部公開APIの場合

#### Phase 0.4: テスト仕様書の作成

Phase 0.3で選択したテストタイプごとに、テスト仕様書を作成します。

詳細は [テスト計画フロー](../testing/test-planning-flow.md#phase-04-テスト仕様書の作成) を参照してください。

**使用するテンプレート**:

- 単体テスト: `templates/test-specs/unit-test-spec-template.md`
- 統合テスト: `templates/test-specs/integration-test-spec-template.md`
- E2Eテスト: `templates/test-specs/e2e-test-spec-template.md`
- パフォーマンステスト: `templates/test-specs/performance-test-spec-template.md`
- セキュリティテスト: `templates/test-specs/security-test-spec-template.md`

### Phase 0.5-0.6: タスク分割とJIRA同期

#### Phase 0.5 Step 1: タスク生成

```bash
# 凡例
/kiro:spec-tasks <feature>

# 具体例
/kiro:spec-tasks user-auth
```

AIが実装タスクをストーリーに分割し、tasks.mdを生成します。

#### Phase 0.5 Step 2: GitHubにコミット

```bash
# 凡例
jj commit -m "docs: <feature> タスク分割追加"
jj git push

# 具体例
jj commit -m "docs: ユーザー認証 タスク分割追加"
jj git push
```

#### Phase 0.6 Step 1: JIRAに同期

```bash
# 凡例
michi jira:sync <feature>

# 具体例
michi jira:sync user-auth
```

自動的に：

- Epic作成: `[<project-name>] <feature>`
- Story作成: 各実装タスク
- Subtask作成: テスト、レビュータスク

### Phase 1: 環境構築・基盤整備

Phase 0.6までのテスト計画が完了したら、Phase 1で実装環境とテスト環境を整備します。

詳細は [テスト計画フロー](../testing/test-planning-flow.md#phase-1-環境構築基盤整備) を参照してください。

**実施内容**:

- プロジェクト初期化
- 依存関係インストール（テストフレームワーク、Lintツール等）
- データベース接続設定
- テスト環境の準備（pytest, vitest, JUnit等）
- テストデータの準備（fixtures, seed等）
- テストディレクトリ構造の作成

**テストディレクトリ構造例**:

```
tests/
├── specs/            # テスト仕様書（Phase 0.4で作成）
├── unit/             # 単体テスト（Phase 2で作成）
├── integration/      # 統合テスト（Phase 2で作成、必要に応じて）
├── e2e/              # E2Eテスト（Phase 2で作成、必要に応じて）
├── performance/      # パフォーマンステスト（Phase 2で作成、任意）
└── security/         # セキュリティテスト（Phase 2で作成、任意）
```

### Phase 2: TDD実装

#### Phase 2 Step 1: TDD実装（JIRA連携付き）

```bash
# 凡例
/kiro:spec-impl <feature>

# 具体例
/kiro:spec-impl user-auth
```

AIがTDD（テスト駆動開発）で実装します。JIRA連携は**自動**で行われます。

**自動実行される処理**:

- ✅ spec.json から JIRA 情報（Epic + Story）を自動取得
- ✅ Epic と最初の Story を「進行中」に移動
- ✅ TDD サイクルで実装
- ✅ PR 作成
- ✅ Epic と最初の Story を「レビュー待ち」に移動
- ✅ JIRA に PR リンクをコメント

詳細は [TDDサイクル](../testing/tdd-cycle.md) を参照してください。

**TDDサイクル**:

1. RED: 失敗するテストを書く
2. GREEN: 最小限の実装でテストを通す
3. REFACTOR: コードを改善する

**重要**: Phase 2では、テストコードと実装コードを同時進行で作成します。Phase 0.4で作成したテスト仕様書に基づき、TDDサイクルを繰り返しながら開発を進めます。

#### Phase 2 Step 2: コミット

```bash
# 凡例
jj commit -m "feat: <feature> 実装 [JIRA-XXX]"
jj bookmark create <project-id>/feature/<feature> -r '@-'
jj git push --bookmark <project-id>/feature/<feature> --allow-new

# 具体例
jj commit -m "feat: ユーザー認証実装 [MICHI-123]"
jj bookmark create michi/feature/user-auth -r '@-'
jj git push --bookmark michi/feature/user-auth --allow-new
```

**注意**: JIRA連携は `/kiro:spec-impl` コマンドが自動で行うため、手動でのステータス変更は不要です。

**個別のJIRA操作が必要な場合**:

```bash
# ステータス変更
michi jira:transition MICHI-123 "In Progress"

# コメント追加
michi jira:comment MICHI-123 "補足コメント"
```

### Phase A: PR作成前の自動テスト

Phase 2（実装）が完了したら、PR作成前にPhase Aのテストを実行します。

詳細は [テスト実行フロー - Phase A](../testing/test-execution-flow.md#phase-a-pr作成前の自動テスト) を参照してください。

**実行内容**:

- 単体テスト（必須）
- Lint（必須）
- ビルド（必須）

**実行方法**:

- ローカルで事前確認: `npm test && npm run lint && npm run build`
- CI/CDが自動実行（GitHub Actions / Screwdriver）

**合格基準**:

- すべての単体テストが成功
- Lintエラー: 0件
- ビルドエラー: 0件

Phase Aが成功したら、PRを作成します。

#### Phase A Step 1: PR作成

```bash
# 凡例
gh pr create --head <project-id>/feature/<feature> --base main \
  --title "[JIRA-XXX] <タイトル>" \
  --body "<説明>"

# 具体例
gh pr create --head michi/feature/user-auth --base main \
  --title "[MICHI-123] ユーザー認証実装" \
  --body "実装内容..."
```

### Phase 3: 追加の品質保証（PRマージ後）

PRがマージされた後、Phase 3で追加の品質保証を実施します。

**実行内容**:

- 静的解析（詳細な品質チェック）
- セキュリティスキャン
- カバレッジ確認と改善

**目的**:

- Phase Aで検出できなかった問題の早期発見
- コード品質の継続的な向上
- リリース前の品質保証を強化

### Phase B: リリース準備時の手動テスト

Phase 3完了後、リリース準備時にPhase Bのテストを実行します。

詳細は [テスト実行フロー - Phase B](../testing/test-execution-flow.md#phase-b-リリース準備時の手動テスト) を参照してください。

**実行内容**:

- 統合テスト（推奨）: 複数コンポーネント間の連携を検証
- E2Eテスト（推奨）: ユーザー視点での完全なフローを検証
- パフォーマンステスト（任意）: システムの性能を検証
- セキュリティテスト（任意）: セキュリティ脆弱性を検証

**対話的テスト作成**:

テストファイルを対話的に作成できます：

```bash
npm run test:interactive
```

以下のテストタイプに対応：

1. **手動回帰テスト**: curlベースのAPIテスト
2. **負荷テスト**: Locustを使用した負荷テスト
3. **セキュリティテスト**: OWASP ZAPを使用したセキュリティスキャン

実行ファイルは `michi phase:run` コマンドにより動的に生成されます。

**実行タイミング**:

- PRがmainブランチにマージされた後
- リリースタグを作成する前

**重要**: Phase Bで問題が見つかった場合は、バグ修正のPRを作成し、Phase A → マージ → Phase Bのフローを経て修正します。

### Phase 4-5: リリース準備と実行

Phase Bのすべてのテストが成功したら、リリース準備とリリース実行を行います。

詳細は [リリースフロー](../release/release-flow.md) を参照してください。

#### Phase 4: リリース準備ドキュメント作成

**Confluenceリリース手順書作成**:

- リリースバージョン、予定日、担当者
- リリース内容（新機能、バグ修正、変更点）
- 影響範囲
- リリース手順（事前準備、作業、事後確認）
- ロールバック手順

**リリースJIRA起票**:

- プロジェクト、課題タイプ、要約、説明
- Phase B完了確認チェックリスト
- リリース作業チェックリスト

#### Phase 5: リリース実行

**タグ作成**:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**CI/CD実行確認**:

- GitHub ActionsまたはScrewdriverのステータス確認

**GitHub Release作成**:

```bash
gh release create v1.0.0 --title "Release v1.0.0" --notes-file release-notes.md
```

**リリース完了後**:

- リリースJIRAをクローズ
- 関係者への報告

## 統合ワークフロー実行

すべてのフェーズを自動実行：

```bash
# 凡例
michi workflow:run --feature <feature>

# 具体例
michi workflow:run --feature user-auth
```

承認ゲートで一時停止し、承認後に次のフェーズに進みます。

### 承認ゲートの設定

ワークフロー実行時の承認ゲートで使用するロール名は、環境変数で設定できます。

#### 環境変数設定

`.env` ファイルに以下を追加：

```bash
# 要件定義フェーズの承認者
APPROVAL_GATES_REQUIREMENTS=pm,director

# 設計フェーズの承認者
APPROVAL_GATES_DESIGN=architect,director

# リリースフェーズの承認者
APPROVAL_GATES_RELEASE=sm,director
```

#### 設定例

**デフォルト（英語ロール名）:**

```bash
APPROVAL_GATES_REQUIREMENTS=pm,director
APPROVAL_GATES_DESIGN=architect,director
APPROVAL_GATES_RELEASE=sm,director
```

**日本語ロール名:**

```bash
APPROVAL_GATES_REQUIREMENTS=企画,部長
APPROVAL_GATES_DESIGN=アーキテクト,部長
APPROVAL_GATES_RELEASE=SM,部長
```

**カスタムロール名:**

```bash
APPROVAL_GATES_REQUIREMENTS=product-manager,cto,legal
APPROVAL_GATES_DESIGN=tech-lead,architect,security
APPROVAL_GATES_RELEASE=release-manager,qa-lead,director
```

詳細は [セットアップガイド](./setup.md#4-3-ワークフロー承認ゲートの設定オプション) を参照してください。

## ベストプラクティス

1. **小さく始める**: 最初は1フェーズずつ手動実行
2. **承認を待つ**: 各フェーズで承認を取ってから次へ
3. **GitHubを真実の源に**: 編集は常にGitHubで
4. **定期的な同期**: GitHub更新後は必ずConfluence/JIRA同期
5. **プロジェクトメタデータの維持**: `.kiro/project.json` を最新に保つ

## トラブルシューティング

### Confluence同期エラー

- `.env` の認証情報を確認
- Confluenceスペースが存在するか確認
- Markdownファイルが存在するか確認

### JIRA同期エラー

- JIRAプロジェクトキーが正しいか確認
- Epic/Storyの作成権限があるか確認

### PR作成エラー

- GitHub認証を確認: `gh auth status`
- ブランチが存在するか確認: `jj bookmark list`
