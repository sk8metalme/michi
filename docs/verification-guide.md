# 新規実装機能 動作確認手順書

このドキュメントでは、新規実装した3つの機能の動作確認手順を説明します。

## 📋 目次

1. [事前準備](#事前準備)
2. [機能1: テスト実行とレポート生成](#機能1-テスト実行とレポート生成)
3. [機能2: リリースノート生成](#機能2-リリースノート生成)
4. [機能3: Confluence承認状態ポーリング](#機能3-confluence承認状態ポーリング)
5. [統合テスト: ワークフロー実行](#統合テスト-ワークフロー実行)
6. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 1. プロジェクトのビルド

```bash
npm run build
```

### 2. 必要なファイルの確認

以下のファイルが存在することを確認してください:

```bash
# プロジェクトメタデータ
ls -la .kiro/project.json

# テスト用の機能仕様（既存）
ls -la .kiro/specs/health-check-endpoint/
```

もし`.kiro/project.json`が存在しない場合は、以下のコマンドで作成できます:

```bash
cat > .kiro/project.json << 'EOF'
{
  "projectId": "michi",
  "projectName": "Michi",
  "jiraProjectKey": "MICHI",
  "confluenceLabels": ["michi", "ai-development", "claude-code"],
  "status": "active",
  "team": ["Development Team"],
  "stakeholders": ["Product Team", "Engineering Team"],
  "repository": "https://github.com/sk8metalme/michi",
  "description": "AI駆動開発を支援するプロジェクト管理・ドキュメント管理フレームワーク"
}
EOF
```

---

## 機能1: テスト実行とレポート生成

### 概要

プロジェクトの言語を自動検出し、適切なテストコマンドを実行してレポートを生成します。

### 動作確認手順

#### ステップ1: 単体テストを実行

```bash
# テスト確認スクリプトを実行
node dist/scripts/test-new-features.js
```

#### ステップ2: 結果を確認

コンソール出力で以下が表示されることを確認:

```
📋 Test 1: テスト実行とレポート生成
============================================================

✅ このプロジェクトでテストを実行します...

📊 テスト結果:
  ステータス: ✅ 成功
  言語: Node.js/TypeScript
  コマンド: npm test
  実行時間: X.XX秒

📝 レポート生成中...
```

### 期待される結果

- ✅ テストが正常に実行される
- ✅ テスト結果がMarkdown形式でフォーマットされる
- ✅ 実行時間、タイムスタンプが記録される

### 個別テスト（オプション）

特定の言語でテストしたい場合:

```typescript
// test-runner-example.ts を作成
import { executeTests, generateTestReport } from './dist/scripts/utils/test-runner.js';

async function test() {
  // Node.js/TypeScriptでテスト
  const result = await executeTests('Node.js/TypeScript', process.cwd());
  console.log('Result:', result);

  // レポート生成
  const report = generateTestReport(result, 'my-feature');
  console.log('Report:', report);
}

test();
```

実行:
```bash
npx tsx test-runner-example.ts
```

---

## 機能2: リリースノート生成

### 概要

git logからコミット履歴を取得し、Conventional Commits形式でリリースノートを自動生成します。

### 動作確認手順

#### ステップ1: 単体テストを実行

```bash
# テスト確認スクリプトを実行
node dist/scripts/test-new-features.js
```

#### ステップ2: 結果を確認

コンソール出力で以下が表示されることを確認:

```
📋 Test 2: リリースノート生成
============================================================

✅ 最新10コミットを取得します...

📊 取得したコミット数: 10

最初の3コミット:
  1. [feat] Claude Code/Claude AgentにkiroコードレビューとPR確認を追加
  2. [feat] kiro:spec-implにコードレビューとPR作成確認を追加
  3. [feat] Kiro spec-impl統合ワークフローと関連機能を追加

📝 リリースノート生成中...
```

### 期待される結果

- ✅ コミット履歴が正常に取得される
- ✅ Conventional Commits形式が正しく解析される
- ✅ Features, Bug Fixes, Other Changesに分類される
- ✅ Markdown形式でリリースノートが生成される

### 個別テスト（オプション）

カスタムバージョンでリリースノートを生成:

```typescript
// release-notes-example.ts を作成
import { createReleaseNotes } from './dist/scripts/utils/release-notes-generator.js';
import { writeFileSync } from 'fs';

async function test() {
  // v2.0.0のリリースノートを生成
  const notes = await createReleaseNotes('v2.0.0', 'HEAD~20', process.cwd());

  // ファイルに保存
  writeFileSync('RELEASE_NOTES_v2.0.0.md', notes, 'utf-8');
  console.log('✅ リリースノート生成完了: RELEASE_NOTES_v2.0.0.md');
  console.log(notes);
}

test();
```

実行:
```bash
npx tsx release-notes-example.ts
```

---

## 機能3: Confluence承認状態ポーリング

### 概要

Confluence APIを使用してページの承認状態を確認します。

### 事前準備: 環境変数の設定

Confluence APIを使用するため、以下の環境変数を設定してください:

```bash
# .envファイルに追加
cat >> .env << 'EOF'

# Confluence承認状態テスト用
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
CONFLUENCE_TEST_PAGE_ID=123456
EOF
```

**API Token取得方法:**
1. Atlassianアカウントにログイン
2. https://id.atlassian.com/manage-profile/security/api-tokens にアクセス
3. 「Create API token」をクリック
4. トークンをコピーして`ATLASSIAN_API_TOKEN`に設定

**ページIDの確認方法:**
1. Confluenceページを開く
2. URLから`pageId=XXXXXX`の部分を確認
   - 例: `https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/123456/PageTitle`
   - この場合、ページIDは`123456`

### 動作確認手順

#### ステップ1: 環境変数が設定されていることを確認

```bash
echo "URL: $ATLASSIAN_URL"
echo "Email: $ATLASSIAN_EMAIL"
echo "Page ID: $CONFLUENCE_TEST_PAGE_ID"
```

#### ステップ2: テストを実行

```bash
node dist/scripts/test-new-features.js
```

#### ステップ3: 結果を確認

環境変数が設定されている場合:

```
📋 Test 3: Confluence承認状態確認
============================================================

✅ Confluence承認状態を確認します...

📊 承認状態:
  ページID: 123456
  ページタイトル: Test Page
  承認済み: ✅ はい / ❌ いいえ
  承認者: user1, user2
```

環境変数が未設定の場合:

```
⚠️  Confluence認証情報が設定されていません
   以下の環境変数を設定すると、実際のAPIテストが可能です:
   - ATLASSIAN_URL
   - ATLASSIAN_EMAIL
   - ATLASSIAN_API_TOKEN
   - CONFLUENCE_TEST_PAGE_ID (テスト用ページID)
```

### 期待される結果

- ✅ Confluence APIに正常に接続できる
- ✅ ページ情報が取得できる
- ✅ 承認状態が正しく判定される

### 個別テスト（オプション）

```typescript
// confluence-approval-example.ts を作成
import { getApprovalStatus } from './dist/scripts/utils/confluence-approval.js';

async function test() {
  const config = {
    url: process.env.ATLASSIAN_URL!,
    email: process.env.ATLASSIAN_EMAIL!,
    apiToken: process.env.ATLASSIAN_API_TOKEN!
  };

  const pageId = process.env.CONFLUENCE_TEST_PAGE_ID!;

  const status = await getApprovalStatus(pageId, config);
  console.log('承認状態:', status);
}

test();
```

実行:
```bash
npx tsx confluence-approval-example.ts
```

---

## 統合テスト: ワークフロー実行

### 概要

全機能を統合したワークフローとして実行します。

### 動作確認手順

#### ステップ1: testとreleaseステージのみを実行

```bash
npx tsx scripts/test-workflow-stages.ts --feature health-check-endpoint
```

#### ステップ2: 結果を確認

```
🧪 新規実装ステージのテスト
Feature: health-check-endpoint
Stages: test → release

🚀 Starting workflow for: health-check-endpoint
Stages: test → release
Project: Michi

📋 Stage: test
  Test phase - execute tests
  Detected language: Node.js/TypeScript (medium confidence)
  Running tests...
  ✅ Test report saved: .kiro/specs/health-check-endpoint/test-report.md
✅ Stage completed: test

📋 Stage: release
  Release preparation
  Generating release notes for v1.0.0...
  ✅ Release notes saved: .kiro/specs/health-check-endpoint/release-notes-v1.0.0.md
✅ Stage completed: release

🎉 Workflow completed successfully!
```

#### ステップ3: 生成されたファイルを確認

```bash
# テストレポートを表示
cat .kiro/specs/health-check-endpoint/test-report.md

# リリースノートを表示
cat .kiro/specs/health-check-endpoint/release-notes-v1.0.0.md
```

### 期待される結果

- ✅ testステージが正常に完了する
- ✅ releaseステージが正常に完了する
- ✅ テストレポートが生成される
- ✅ リリースノートが生成される

### カスタムバージョンでテスト

```bash
# バージョンを指定
RELEASE_VERSION=v2.1.0 npx tsx scripts/test-workflow-stages.ts --feature health-check-endpoint

# 生成されたファイルを確認
cat .kiro/specs/health-check-endpoint/release-notes-v2.1.0.md
```

---

## トラブルシューティング

### Q1. テスト実行が失敗する

**症状:**
```
❌ Test execution failed: Command failed: npm test
```

**解決方法:**
1. 依存関係を再インストール
   ```bash
   npm clean-install
   ```

2. ビルドを実行
   ```bash
   npm run build
   ```

3. テストを直接実行して確認
   ```bash
   npm test
   ```

---

### Q2. リリースノート生成でコミットが見つからない

**症状:**
```
📊 取得したコミット数: 0
⚠️  コミットが見つかりませんでした
```

**解決方法:**
1. gitリポジトリであることを確認
   ```bash
   git status
   ```

2. コミット履歴を確認
   ```bash
   git log --oneline | head -10
   ```

3. 範囲を調整
   ```typescript
   // より広い範囲で取得
   const commits = await getCommits('HEAD~50', 'HEAD', process.cwd());
   ```

---

### Q3. Confluence API接続エラー

**症状:**
```
❌ Confluence承認状態確認エラー: Request failed with status code 401
```

**解決方法:**
1. 環境変数を確認
   ```bash
   cat .env | grep ATLASSIAN
   ```

2. API Tokenを再生成
   - https://id.atlassian.com/manage-profile/security/api-tokens

3. 接続テスト
   ```bash
   curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
     "$ATLASSIAN_URL/wiki/rest/api/content/$CONFLUENCE_TEST_PAGE_ID"
   ```

---

### Q4. ワークフローが途中で停止する

**症状:**
```
❌ Stage failed: test Command failed: npm test
```

**解決方法:**
1. ログを確認
   ```bash
   # 詳細ログを有効化
   DEBUG=* npx tsx scripts/test-workflow-stages.ts --feature health-check-endpoint
   ```

2. ステージごとに個別テスト
   ```bash
   # テストステージのみ
   node dist/scripts/test-new-features.js
   ```

3. エラーメッセージを確認して対処

---

## 📊 チェックリスト

動作確認完了の確認に使用してください:

### 基本動作
- [ ] ビルドが成功する（`npm run build`）
- [ ] 全テストがパスする（`npm test`）
- [ ] `.kiro/project.json`が存在する

### 機能1: テスト実行とレポート生成
- [ ] テストが正常に実行される
- [ ] レポートがMarkdown形式で生成される
- [ ] 実行時間が記録される

### 機能2: リリースノート生成
- [ ] コミット履歴が取得できる
- [ ] Conventional Commits形式が解析される
- [ ] リリースノートが生成される

### 機能3: Confluence承認状態
- [ ] 環境変数が設定されている（オプション）
- [ ] Confluence APIに接続できる（オプション）
- [ ] 承認状態が取得できる（オプション）

### 統合テスト
- [ ] testステージが成功する
- [ ] releaseステージが成功する
- [ ] 生成ファイルが正しい場所に保存される

---

## 📝 まとめ

すべてのチェック項目が完了したら、新規実装機能の動作確認は完了です。

ご不明な点がありましたら、以下を確認してください:
- 実装コード: `scripts/utils/test-runner.ts`, `release-notes-generator.ts`, `confluence-approval.ts`
- テストコード: `scripts/utils/__tests__/test-runner.test.ts`
- 統合スクリプト: `scripts/test-new-features.ts`, `scripts/test-workflow-stages.ts`
