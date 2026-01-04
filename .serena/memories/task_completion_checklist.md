# タスク完了時のチェックリスト

## 必須チェック項目

### 1. コード品質チェック

#### Lint実行
```bash
npm run lint
```
- ✅ ESLintの警告・エラーがないこと
- ✅ 警告がある場合は修正すること

#### 型チェック
```bash
npm run type-check
```
- ✅ TypeScriptの型エラーがないこと

#### フォーマット
```bash
npm run format
```
- ✅ コードフォーマットが適用されていること

### 2. テスト実行

#### すべてのテスト実行
```bash
npm run test:run
```
- ✅ すべてのテストがPASSすること
- ✅ 新しいテストを追加した場合、既存のテストが壊れていないこと

#### カバレッジ確認
```bash
npm run test:coverage
```
- ✅ カバレッジ95%以上を維持すること（目標）
- ✅ 新規コードにはテストを追加すること

### 3. ビルド確認

```bash
npm run build
```
- ✅ ビルドが成功すること
- ✅ ビルドエラー・警告がないこと

### 4. Git操作の安全確認

#### ブランチ確認
```bash
git branch --show-current
```
- ✅ main/masterブランチで作業していないこと
- ✅ feature/, bugfix/, hotfix/ ブランチで作業していること

#### コミット前の確認
- ✅ 機密情報（APIキー、パスワードなど）が含まれていないこと
- ✅ `.env`ファイルが`.gitignore`に含まれていること
- ✅ `node_modules/`、`dist/`が`.gitignore`に含まれていること

#### コミットメッセージ
- ✅ 形式: `[種別] 簡潔な説明`
- ✅ 種別: feat, fix, docs, style, refactor, test, chore

### 5. ドキュメント更新（必要な場合）

- ✅ README.mdを更新したか（新機能追加の場合）
- ✅ CHANGELOG.mdを更新したか（リリース準備の場合）
- ✅ コードコメントを追加したか（複雑なロジックの場合）
- ✅ APIドキュメントを更新したか（API変更の場合）

## 開発フロー別チェックリスト

### Phase 0.1: 要件定義完了時

```bash
# AIコマンドで requirements.md 作成後
/michi:spec-requirements <feature>

# CLIツールで Confluence作成 + バリデーション
npx @sk8metal/michi-cli phase:run <feature> requirements
```

- ✅ `requirements.md`が作成されていること
- ✅ Confluenceページが作成されていること
- ✅ バリデーションが通ること

### Phase 0.2: 設計完了時

```bash
# AIコマンドで design.md 作成後
/michi:spec-design <feature>

# CLIツールで Confluence作成 + バリデーション
npx @sk8metal/michi-cli phase:run <feature> design
```

- ✅ `design.md`が作成されていること
- ✅ Confluenceページが作成されていること
- ✅ バリデーションが通ること

### Phase 0.5-0.6: タスク分割完了時

```bash
# AIコマンドで tasks.md 作成後
/michi:spec-tasks <feature>

# CLIツールで JIRA作成 + バリデーション
npx @sk8metal/michi-cli phase:run <feature> tasks
```

- ✅ `tasks.md`が作成されていること
- ✅ JIRAにEpic、Story、Subtaskが作成されていること
- ✅ バリデーションが通ること

### Phase 2: TDD実装完了時

```bash
# テスト実行
npm run test:run

# Lint実行
npm run lint

# 型チェック
npm run type-check

# ビルド
npm run build
```

- ✅ すべてのテストがPASSすること
- ✅ Lint、型チェック、ビルドが成功すること
- ✅ RED-GREEN-REFACTORサイクルを遵守したこと
- ✅ テストカバレッジ95%以上を維持すること

### PR作成前（Phase A）

```bash
# 必須チェックを実行
npm run lint
npm run type-check
npm run test:run
npm run build
```

- ✅ すべてのチェックが成功すること
- ✅ コミットメッセージが適切であること
- ✅ ブランチ名が適切であること（feature/*, bugfix/*, hotfix/*）

### リリース準備時（Phase 4）

```bash
# 公開前チェック
npm run pre-publish

# パッケージテスト
npm run test:package
```

- ✅ CHANGELOG.mdを更新したこと
- ✅ package.jsonのバージョンを更新したこと
- ✅ すべてのテストがPASSすること
- ✅ ビルドが成功すること

## セキュリティチェック

### コミット前の必須確認

- ✅ APIキーがハードコードされていないこと
- ✅ パスワードがハードコードされていないこと
- ✅ 接続文字列がハードコードされていないこと
- ✅ 暗号化キーがハードコードされていないこと
- ✅ 個人情報がハードコードされていないこと
- ✅ `.env`ファイルが`.gitignore`に含まれていること

### 定期的な確認

```bash
# 脆弱性スキャン
npm audit

# 脆弱性修正
npm audit fix
```

- ✅ 脆弱性がないこと
- ✅ 依存ライブラリが最新であること

## Git操作の禁止事項

### 絶対に行ってはいけないこと

- ❌ main/masterブランチへの直接push/commit
- ❌ force push（`--force`, `-f`）の使用（特にmain/masterへは厳禁）
- ❌ 機密情報のコミット
- ❌ 大きなバイナリファイルのコミット（ビルド成果物など）

## トラブルシューティング

### テストが失敗する場合

1. 依存関係を再インストール
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. キャッシュをクリア
   ```bash
   npm cache clean --force
   ```

3. ビルドを再実行
   ```bash
   npm run build
   ```

### Lintエラーが多すぎる場合

```bash
# 自動修正を試す
npm run lint:fix

# フォーマットを適用
npm run format
```

### 型エラーが発生する場合

1. TypeScript設定を確認
   ```bash
   cat tsconfig.json
   ```

2. `@types/*`パッケージが不足していないか確認
   ```bash
   npm install --save-dev @types/node
   ```

## まとめ

タスク完了時には、以下の順序でチェックを実行することを推奨します：

```bash
# 1. コード品質チェック
npm run lint
npm run format
npm run type-check

# 2. テスト実行
npm run test:run

# 3. ビルド確認
npm run build

# 4. Git操作
git branch --show-current  # ブランチ確認
git status                 # 変更確認
git add .
git commit -m "[種別] 簡潔な説明"
git push -u origin feature/<task-description>

# 5. PR作成
gh pr create --title "タイトル" --body "説明"
```

これらのチェックを習慣化することで、高品質なコードを維持できます。
