# 統合テストガイド

## 概要

Michiプロジェクトの統合テストは、`setup-existing`コマンドの動作を検証するために作成されています。

## テスト構造

```
src/__tests__/integration/setup/
├── helpers/
│   ├── test-project.ts      # テストプロジェクト作成ヘルパー
│   └── fs-assertions.ts     # ファイルシステムアサーション
├── cursor.test.ts           # Cursor環境テスト
├── claude.test.ts           # Claude環境テスト
├── claude-agent.test.ts     # Claude Agent環境テスト
└── validation.test.ts       # 引数バリデーションテスト
```

## テストケース

### 1. 環境別テスト

#### Cursor環境 (`cursor.test.ts`)

- ✅ `.cursor/rules/` ディレクトリ作成
- ✅ `.cursor/commands/` ディレクトリ作成
- ✅ `.kiro/` ディレクトリ構造作成
- ✅ `project.json` 作成とメタデータ検証
- ✅ `.env` テンプレート作成
- ✅ テンプレートレンダリング
- ✅ 言語サポート（ja, en）
- ✅ Git統合（リモートURL検出）
- ✅ エラーハンドリング

#### Claude環境 (`claude.test.ts`)

- ✅ `.claude/rules/` ディレクトリ作成
- ✅ `.kiro/` ディレクトリ構造作成
- ✅ `project.json` 作成
- ✅ `.env` テンプレート作成
- ✅ Cursor固有ディレクトリが作成されないことを確認
- ✅ 言語サポート

#### Claude Agent環境 (`claude-agent.test.ts`)

- ✅ `.claude/agents/` ディレクトリ作成
- ✅ `.kiro/` ディレクトリ構造作成
- ✅ `project.json` 作成
- ✅ `.env` テンプレート作成
- ✅ 他の環境固有ディレクトリが作成されないことを確認
- ✅ 言語サポート（ja, en, zh-TW）

### 2. バリデーションテスト (`validation.test.ts`)

#### 環境選択

- ✅ デフォルト環境（cursor）
- ✅ `--cursor` フラグ
- ✅ `--claude` フラグ
- ✅ `--claude-agent` フラグ

#### 言語バリデーション

- ✅ サポート言語: `ja`, `en`, `zh-TW`
- ✅ 非サポート言語でエラー

#### プロジェクト名バリデーション

**正常系:**

- ✅ 有効なプロジェクト名
- ✅ 日本語文字を含むプロジェクト名
- ✅ 前後の空白はトリム

**異常系:**

- ❌ 空文字列
- ❌ パストラバーサル文字 (`/`, `\`, `..`)
- ❌ 制御文字
- ❌ 100文字超

#### JIRAキーバリデーション

**正常系:**

- ✅ 2-10文字の大文字英字
- ✅ 小文字は自動的に大文字に変換

**異常系:**

- ❌ 1文字以下
- ❌ 11文字以上
- ❌ 数字を含む
- ❌ 特殊文字を含む

#### Gitリポジトリバリデーション

- ❌ `.git` ディレクトリがない場合エラー

## テスト実行方法

### すべてのテスト実行

```bash
npm test
```

### 統合テストのみ実行

```bash
npm run test:integration:setup
```

### カバレッジ付き実行

```bash
npm run test:coverage:setup
```

### 監視モード

```bash
npm test -- --watch
```

### UI モード

```bash
npm run test:ui
```

## CI/CD

GitHub Actionsワークフローが `.github/workflows/test-setup.yml` に定義されています。

**実行タイミング:**

- `main`, `develop`, `feature/**` ブランチへのプッシュ
- `main`, `develop` ブランチへのプルリクエスト

**マトリクス戦略:**

- Node.js 18.x
- Node.js 20.x

**ステップ:**

1. コードチェックアウト
2. Node.js セットアップ
3. 依存関係インストール
4. 統合テスト実行
5. カバレッジ生成
6. カバレッジアップロード（Codecov）
7. Lint実行
8. TypeScript型チェック

## トラブルシューティング

### テストが失敗する場合

**症状:** テストプロジェクトの作成に失敗

**原因:** 一時ディレクトリの権限問題

**解決策:**

```bash
# 一時ディレクトリの権限を確認
ls -la /tmp

# 手動でクリーンアップ
rm -rf /tmp/test-project-*
```

---

**症状:** Git初期化エラー

**原因:** Gitがインストールされていない

**解決策:**

```bash
# Gitインストール確認
git --version

# macOS
brew install git

# Ubuntu
sudo apt-get install git
```

---

**症状:** TypeScriptコンパイルエラー

**原因:** 型定義の不一致

**解決策:**

```bash
# 型チェック
npm run type-check

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

### カバレッジが低い場合

**目標:** 95%以上のカバレッジ

**確認方法:**

```bash
npm run test:coverage:setup
open coverage/lcov-report/index.html
```

**改善策:**

1. 未テストのエッジケースを追加
2. エラーハンドリングのテストを追加
3. モックが不十分な箇所を特定

### CI/CDが失敗する場合

**症状:** GitHub Actionsでテストが失敗

**原因1:** ローカルとCI環境の違い

**解決策:**

```bash
# ローカルでCI環境を再現
docker run -it -v $(pwd):/app node:20 bash
cd /app
npm ci
npm run test:integration:setup
```

**原因2:** タイムアウト

**解決策:** `.github/workflows/test-setup.yml` でタイムアウトを延長

```yaml
- name: Run integration tests
  run: npm run test:integration:setup
  timeout-minutes: 10 # デフォルト: 360分
```

## ベストプラクティス

### テスト作成時

1. **TDD原則を守る**
   - テストを先に書く
   - 最小限の実装で通す
   - リファクタリング

2. **テストは独立させる**
   - 各テストは他のテストに依存しない
   - `beforeEach`, `afterEach` でクリーンアップ

3. **意味のあるテスト名**

   ```typescript
   // ❌ Bad
   it("test 1", () => {});

   // ✅ Good
   it("should create .cursor/rules directory", () => {});
   ```

4. **アサーションは明確に**

   ```typescript
   // ❌ Bad
   expect(result).toBe(true);

   // ✅ Good
   assertDirectoryExists(
     join(testProject.path, ".cursor/rules"),
     "Expected .cursor/rules directory to exist",
   );
   ```

### テスト保守時

1. **テストが壊れたら**
   - 実装の変更が正しいか確認
   - テストの期待値を更新
   - リグレッションを防ぐ

2. **新機能追加時**
   - 必ずテストを追加
   - カバレッジを確認
   - エッジケースを考慮

3. **リファクタリング時**
   - テストが通ることを確認
   - テストコードもリファクタリング
   - 重複を削除

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [テスト戦略](../testing-strategy.md)
- [開発ガイド](../contributing/development.md)
