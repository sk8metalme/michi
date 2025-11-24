# Pre-Publish Checklist

NPMパッケージ公開前の動作確認チェックリスト。

## 自動実行（推奨）

### 開発環境での確認（必須）

プロジェクトルートで以下のスクリプトを実行：

```bash
# プロジェクトルートで実行
npm run pre-publish
```

スクリプトは以下を自動的に実行します：
- ✅ TypeScriptビルド確認
- ✅ テスト実行（回帰テスト）
- ✅ 新フェーズの動作確認（Phase 0.3-0.4, 1, A, B）
- ✅ バリデーション確認
- ✅ CLIヘルプ表示確認

### パッケージインストール後の確認（推奨）

クリーンな環境（/tmp/michi-test-*）でNPMパッケージとしての動作確認：

```bash
# デフォルト: /tmp/michi-test-<timestamp>
npm run test:package

# カスタムディレクトリ指定
bash scripts/test-npm-package.sh /tmp/michi-test-gemini
```

スクリプトは以下を自動的に実行します：
- ✅ npm pack でパッケージ作成
- ✅ クリーンな環境でパッケージインストール
- ✅ .kiro ディレクトリ構造の準備
- ✅ 全phase:runコマンドの動作確認
- ✅ 全validate:phaseコマンドの動作確認
- ✅ CLIヘルプメッセージ確認
- ✅ 自動クリーンアップ（パッケージファイル、テストディレクトリ）

## 手動確認（詳細版）

自動スクリプトが失敗した場合、または詳細に確認したい場合は以下の手順で手動確認してください。

### Step 1: ビルド確認

```bash
npm run build
```

**期待される結果:**
- `dist/` ディレクトリが作成される
- エラーなくビルドが完了
- 警告がないこと（または既知の警告のみ）

**確認ポイント:**
- [ ] ビルドエラーなし
- [ ] TypeScript型エラーなし
- [ ] `dist/` に全ファイルが出力されている

### Step 2: テスト実行

```bash
npm test
```

**期待される結果:**
- 全テストケースがパス
- カバレッジ95%以上

**確認ポイント:**
- [ ] 既存テストが全てパス
- [ ] 新フェーズ用のテストが含まれている
- [ ] `tasks-format-validator.test.ts` で新ワークフロー構造のテストがパス

### Step 3: テスト用featureの準備

```bash
# テスト用featureを作成
TEST_FEATURE="test-publish-verification"

mkdir -p ".kiro/specs/${TEST_FEATURE}"

# spec.json作成
cat > ".kiro/specs/${TEST_FEATURE}/spec.json" <<EOF
{
  "feature": "${TEST_FEATURE}",
  "description": "Publish verification test",
  "status": "draft",
  "milestones": {},
  "confluence": {},
  "jira": {}
}
EOF

# requirements.md作成
cat > ".kiro/specs/${TEST_FEATURE}/requirements.md" <<EOF
# Requirements: ${TEST_FEATURE}
Test feature for publish verification.
EOF

# design.md作成
cat > ".kiro/specs/${TEST_FEATURE}/design.md" <<EOF
# Design: ${TEST_FEATURE}
Test feature for publish verification.
EOF

# tasks.md作成（新ワークフロー構造）
cat > ".kiro/specs/${TEST_FEATURE}/tasks.md" <<EOF
# tasks.md

## Phase 0.1: 要件定義
### Story 0.1.1: 要件定義書作成

## Phase 0.2: 設計
### Story 0.2.1: 基本設計

## Phase 2: TDD実装
### Story 2.1: プロジェクトセットアップ

## Phase 4: リリース準備
### Story 4.1: 本番環境構築

## Phase 5: リリース
### Story 5.1: ステージング環境デプロイ

Day 1（月）: 営業日ベース
EOF
```

### Step 4: 新フェーズの動作確認

#### Phase 0.3: テストタイプ選択

```bash
npm run phase:run ${TEST_FEATURE} test-type-selection
```

**期待される結果:**
- ガイダンスが表示される
- エラーなく完了
- 終了コード: 0

**確認ポイント:**
- [ ] ガイダンスメッセージが表示される
- [ ] 必須テスト（単体テスト、Lint、ビルド）が記載されている
- [ ] 推奨テスト（統合、E2E、性能、セキュリティ）が記載されている
- [ ] 参考ドキュメントのパスが正しい

#### Phase 0.4: テスト仕様書作成

```bash
npm run phase:run ${TEST_FEATURE} test-spec
```

**期待される結果:**
- テンプレート案内が表示される
- エラーなく完了
- 終了コード: 0

**確認ポイント:**
- [ ] テンプレートファイルのパスが表示される
- [ ] 作成場所（`docs/testing/specs/<feature>/`）が明記されている
- [ ] 次のステップが明確

#### Phase 1: 環境構築

```bash
npm run phase:run ${TEST_FEATURE} environment-setup
```

**期待される結果:**
- チェックリストが表示される
- エラーなく完了
- 終了コード: 0

**確認ポイント:**
- [ ] 環境構築チェックリストが表示される
- [ ] CI/CD、テストフレームワーク、依存関係などが網羅されている
- [ ] 次のステップ（Phase 2）への案内がある

#### Phase A: PR前自動テスト

```bash
npm run phase:run ${TEST_FEATURE} phase-a
```

**期待される結果:**
- CI/CD案内が表示される
- エラーなく完了
- 終了コード: 0

**確認ポイント:**
- [ ] CI/CD自動実行の説明がある
- [ ] 自動実行テスト（単体テスト、Lint、ビルド）が記載されている
- [ ] CI/CD設定ファイルのパスが正しい

#### Phase B: リリース準備テスト

```bash
npm run phase:run ${TEST_FEATURE} phase-b
```

**期待される結果:**
- 手動テストチェックリストが表示される
- エラーなく完了
- 終了コード: 0

**確認ポイント:**
- [ ] リリース準備テストチェックリストが表示される
- [ ] 性能テスト、セキュリティテスト、手動回帰テストが含まれている
- [ ] 次のステップ（Phase 4）への案内がある

### Step 5: バリデーション確認

#### Phase 0.3バリデーション

```bash
npm run validate:phase ${TEST_FEATURE} test-type-selection
```

**期待される結果:**
- 警告が表示される（「マニュアル対応です」）
- バリデーション成功（valid: true）
- 終了コード: 0

**確認ポイント:**
- [ ] 警告メッセージが適切
- [ ] エラーなし
- [ ] 成功メッセージが表示される

#### Phase 0.4バリデーション

```bash
npm run validate:phase ${TEST_FEATURE} test-spec
```

**期待される結果:**
- 警告が表示される
- テスト仕様書ディレクトリの存在確認
- バリデーション成功
- 終了コード: 0

**確認ポイント:**
- [ ] ディレクトリ不存在の警告（存在しない場合）
- [ ] マニュアル対応の案内
- [ ] エラーなし

#### Phase 1バリデーション

```bash
npm run validate:phase ${TEST_FEATURE} environment-setup
```

**期待される結果:**
- 警告が表示される
- バリデーション成功
- 終了コード: 0

**確認ポイント:**
- [ ] マニュアル対応の案内
- [ ] エラーなし

#### Phase Aバリデーション

```bash
npm run validate:phase ${TEST_FEATURE} phase-a
```

**期待される結果:**
- 警告が表示される（「CI/CD自動実行です」）
- バリデーション成功
- 終了コード: 0

**確認ポイント:**
- [ ] CI/CD自動実行の説明
- [ ] エラーなし

#### Phase Bバリデーション

```bash
npm run validate:phase ${TEST_FEATURE} phase-b
```

**期待される結果:**
- 警告が表示される
- バリデーション成功
- 終了コード: 0

**確認ポイント:**
- [ ] マニュアル対応の案内
- [ ] エラーなし

### Step 6: 既存フェーズの回帰テスト

#### Phase 0.1: 要件定義（バリデーションのみ）

```bash
npm run validate:phase ${TEST_FEATURE} requirements
```

**期待される結果:**
- requirements.mdが存在するためエラーなし
- Confluence未作成のため警告あり
- 終了コード: 1（Confluenceページがないため）

**確認ポイント:**
- [ ] requirements.md存在確認OK
- [ ] Confluenceページ未作成の警告

#### Phase 0.2: 設計（バリデーションのみ）

```bash
npm run validate:phase ${TEST_FEATURE} design
```

**期待される結果:**
- design.mdが存在するためエラーなし
- Confluence未作成のため警告あり
- 終了コード: 1

**確認ポイント:**
- [ ] design.md存在確認OK
- [ ] 前提条件チェック（要件定義完了）
- [ ] Confluenceページ未作成の警告

#### Phase 0.5-0.6: タスク分割（バリデーションのみ）

```bash
npm run validate:phase ${TEST_FEATURE} tasks
```

**期待される結果:**
- tasks.mdが存在するためエラーなし
- JIRA未作成のため警告あり
- 終了コード: 1

**確認ポイント:**
- [ ] tasks.md存在確認OK
- [ ] フォーマットバリデーション成功
- [ ] JIRA未作成の警告

### Step 7: CLIヘルプメッセージ確認

#### phase:runのヘルプ

```bash
npm run phase:run
```

**期待される結果:**
- 使い方が表示される
- 全フェーズ（8個）が列挙される
- 終了コード: 1

**確認ポイント:**
- [ ] `requirements` が表示される
- [ ] `design` が表示される
- [ ] `test-type-selection` が表示される（新フェーズ）
- [ ] `test-spec` が表示される（新フェーズ）
- [ ] `tasks` が表示される
- [ ] `environment-setup` が表示される（新フェーズ）
- [ ] `phase-a` が表示される（新フェーズ）
- [ ] `phase-b` が表示される（新フェーズ）

#### validate:phaseのヘルプ

```bash
npm run validate:phase
```

**期待される結果:**
- 使い方が表示される
- 全フェーズ（8個）が列挙される
- 終了コード: 1

**確認ポイント:**
- [ ] 全8フェーズが表示される
- [ ] 各フェーズの説明が適切

### Step 8: クリーンアップ

```bash
# テスト用featureを削除
rm -rf ".kiro/specs/${TEST_FEATURE}"
```

### Step 9: ドキュメント確認

#### README.md

```bash
cat README.md | grep -A 20 "ワークフロー構造の概要"
```

**確認ポイント:**
- [ ] 新ワークフロー構造（Phase 0.0-0.6, 1, 2, A, 3, B, 4-5）が記載されている
- [ ] レガシー6-Phaseサポートの記載がある
- [ ] Phase 0.3-0.4が「任意」と記載されている
- [ ] Phase 1, A, B, 3が「任意」と記載されている

#### tasks.mdテンプレート

```bash
cat .kiro/settings/templates/specs/tasks.md | grep "## Phase"
```

**確認ポイント:**
- [ ] Phase 0.1: 要件定義
- [ ] Phase 0.2: 設計
- [ ] Phase 0.3: テストタイプ選択（任意）
- [ ] Phase 0.4: テスト仕様書作成（任意）
- [ ] Phase 1: 環境構築（任意）
- [ ] Phase 2: TDD実装
- [ ] Phase A: PR前自動テスト（任意）
- [ ] Phase 3: 追加QA（任意）
- [ ] Phase B: リリース準備テスト（任意）
- [ ] Phase 4: リリース準備
- [ ] Phase 5: リリース

## 最終確認チェックリスト

すべての確認が完了したら、以下をチェック：

### ビルド
- [ ] `npm run build` が成功
- [ ] TypeScript型エラーなし
- [ ] `dist/` ディレクトリが正しく生成

### テスト
- [ ] `npm test` が全てパス
- [ ] カバレッジ95%以上
- [ ] 新フェーズのテストケースが含まれている

### 新フェーズ（Phase 0.3-0.4, 1, A, B）
- [ ] Phase 0.3: test-type-selection が動作
- [ ] Phase 0.4: test-spec が動作
- [ ] Phase 1: environment-setup が動作
- [ ] Phase A: phase-a が動作
- [ ] Phase B: phase-b が動作

### バリデーション
- [ ] Phase 0.3-0.4, 1, A, B のバリデーションが成功
- [ ] 適切な警告メッセージが表示される
- [ ] エラーがない

### 既存フェーズ（回帰テスト）
- [ ] Phase 0.1: requirements バリデーション動作
- [ ] Phase 0.2: design バリデーション動作
- [ ] Phase 0.5-0.6: tasks バリデーション動作

### CLIヘルプ
- [ ] `phase:run` のヘルプで全8フェーズが表示
- [ ] `validate:phase` のヘルプで全8フェーズが表示
- [ ] 各フェーズの説明が適切

### ドキュメント
- [ ] README.mdに新ワークフロー構造が記載
- [ ] tasks.mdテンプレートに全フェーズが含まれている
- [ ] レガシー6-Phaseサポートの記載がある

### パッケージインストール後の確認（推奨）
- [ ] `npm run test:package` が成功
- [ ] クリーンな環境でパッケージインストール成功
- [ ] 全phase:runコマンドが動作
- [ ] 全validate:phaseコマンドが動作
- [ ] CLIヘルプメッセージが表示される

## publish実行

すべてのチェックが完了したら、以下のコマンドでpublishします：

```bash
# Step 1: 開発環境での確認（必須）
npm run pre-publish

# Step 2: パッケージインストール後の確認（推奨）
npm run test:package

# Step 3: バージョン更新
npm version patch  # または minor / major

# Step 4: publish
npm publish
```

**推奨フロー:**
1. `npm run pre-publish` で開発環境の確認（必須）
2. `npm run test:package` でパッケージとしての動作確認（推奨）
3. すべてのチェックがパスしたら `npm version` → `npm publish`

## トラブルシューティング

### ビルドエラー

**エラー:** TypeScript型エラー

**対処:**
1. `npm run build` の出力を確認
2. 型定義が正しいか確認
3. `Phase` 型定義が8フェーズすべて含まれているか確認

### テスト失敗

**エラー:** 新ワークフローのテストが失敗

**対処:**
1. `scripts/utils/__tests__/tasks-format-validator.test.ts` を確認
2. 新ワークフロー構造のテストケースが含まれているか確認
3. バリデーションロジックが正しいか確認

### フェーズ実行エラー

**エラー:** `Unknown phase: test-type-selection`

**対処:**
1. `scripts/phase-runner.ts` の `Phase` 型定義を確認
2. `runPhase()` 関数のswitch文に全フェーズが含まれているか確認
3. `validPhases` 配列に全フェーズが含まれているか確認

### バリデーションエラー

**エラー:** バリデーション関数が見つからない

**対処:**
1. `scripts/validate-phase.ts` の関数定義を確認
2. `validatePhase()` 関数のswitch文に全フェーズが含まれているか確認

### パッケージテストエラー

**エラー:** `npm run test:package` が失敗

**対処:**
1. `npm run build` が成功しているか確認
2. パッケージファイル（*.tgz）が作成されているか確認
3. テストディレクトリの権限を確認（/tmp/に書き込み可能か）
4. 手動で確認：
   ```bash
   npm pack
   mkdir /tmp/test-manual
   cd /tmp/test-manual
   npm install /path/to/michi/sk8metal-michi-cli-*.tgz
   ```

**エラー:** `michi command not found`

**対処:**
1. `package.json` の `bin` フィールドが正しいか確認
2. `dist/src/cli.js` が存在するか確認
3. ビルド後に `postbuild` スクリプトが実行されているか確認

## 参考リンク

- [手動動作確認フロー（完全版）](./manual-verification-flow.md) - initから全フェーズを手動で確認する手順
- [Michiワークフロー](../../user-guide/guides/workflow.md)
- [テスト戦略](../../user-guide/testing-strategy.md)
- [トラブルシューティング](../../user-guide/hands-on/troubleshooting.md)
