# テスト失敗時の対応

このドキュメントでは、michiを使用したプロジェクトでテストが失敗した場合の対応手順について説明します。

## テスト失敗時の基本フロー

```
テスト失敗
    ↓
1. エラーログを確認
    ↓
2. 失敗原因を特定
    ↓
3. 問題の分類
    ├─ コードのバグ → バグ修正
    ├─ テストコードの問題 → テスト修正
    ├─ 環境の問題 → 環境修正
    └─ 仕様変更 → 仕様確認後、修正
    ↓
4. 修正を実装
    ↓
5. テストを再実行
    ↓
6. すべて成功 → 次のステップへ
```

## Phase A（PR前）でのテスト失敗

Phase Aでは、以下のテストが実行されます：
- 単体テスト
- Lint
- ビルド

### ケース1: 単体テストが失敗

**症状**:
```
❌ FAIL tests/unit/calculator.test.ts
  calculateTotal
    ✗ should return sum of array elements
      Expected: 60
      Received: 70
```

**対応手順**:

1. **失敗したテストを特定**
   ```bash
   npm test -- --reporter=verbose
   ```

2. **該当するテストケースのみを実行**
   ```bash
   # Node.js (Vitest)
   npm test -- tests/unit/calculator.test.ts

   # Java (Gradle)
   ./gradlew test --tests CalculatorTest

   # PHP
   composer test -- tests/Unit/CalculatorTest.php
   ```

3. **原因を特定**
   - **コードのバグ**: 実装コードが間違っている
   - **テストの誤り**: テストの期待値が間違っている
   - **仕様変更**: 仕様が変更されたが、テストが更新されていない

4. **修正を実装**

   **パターンA: コードのバグ**
   ```typescript
   // ❌ 間違った実装
   export function calculateTotal(numbers: number[]): number {
     return numbers.reduce((sum, num) => sum + num, 10); // 初期値が10になっている
   }

   // ✅ 正しい実装
   export function calculateTotal(numbers: number[]): number {
     return numbers.reduce((sum, num) => sum + num, 0);
   }
   ```

   **パターンB: テストの誤り**（注意: 実装に合わせてテストを変更するのは避ける）
   ```typescript
   // テストが間違っている場合のみ修正
   // ただし、「実装がこうなっているから」という理由で修正してはいけない
   ```

5. **テストを再実行して確認**
   ```bash
   npm test
   ```

### ケース2: Lintエラー

**症状**:
```
❌ ESLint: 5 errors found

src/calculator.ts
  10:1  error  Missing semicolon  semi
  15:3  error  'result' is never reassigned  prefer-const
```

**対応手順**:

1. **自動修正を試みる**
   ```bash
   # Node.js
   npm run lint:fix

   # または
   npx eslint src/**/*.ts --fix
   ```

2. **自動修正できないエラーは手動で修正**
   ```typescript
   // ❌ Before
   let result = calculateTotal([10, 20, 30])

   // ✅ After
   const result = calculateTotal([10, 20, 30]);
   ```

3. **Lintを再実行して確認**
   ```bash
   npm run lint
   ```

### ケース3: ビルドエラー

**症状**:
```
❌ ERROR in src/calculator.ts:10:15
TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

**対応手順**:

1. **型エラーを確認**
   ```bash
   # Node.js
   npm run type-check

   # または
   npx tsc --noEmit
   ```

2. **型定義を修正**
   ```typescript
   // ❌ 間違った型
   function calculateTotal(numbers: string[]): number {
     // ...
   }

   // ✅ 正しい型
   function calculateTotal(numbers: number[]): number {
     // ...
   }
   ```

3. **ビルドを再実行**
   ```bash
   npm run build
   ```

## Phase B（リリース準備時）でのテスト失敗

Phase Bでは、以下のテストが実行されます：
- 統合テスト
- E2Eテスト
- パフォーマンステスト（任意）
- セキュリティテスト（任意）

### ケース4: 統合テストが失敗

**症状**:
```
❌ FAIL tests/integration/user-api.test.ts
  User Registration
    ✗ should register user and save to database
      Database connection refused
```

**対応手順**:

1. **環境を確認**
   ```bash
   # データベースが起動しているか確認
   docker ps | grep postgres

   # 起動していなければ起動
   docker-compose up -d postgres
   ```

2. **接続設定を確認**
   ```typescript
   // テスト用の接続設定が正しいか確認
   const dbConfig = {
     host: process.env.TEST_DB_HOST || 'localhost',
     port: process.env.TEST_DB_PORT || 5432,
     database: process.env.TEST_DB_NAME || 'testdb',
   };
   ```

3. **テストデータを確認**
   ```bash
   # テストデータが正しく準備されているか
   npm run db:seed:test
   ```

4. **テストを再実行**
   ```bash
   npm run test:integration
   ```

### ケース5: E2Eテストが失敗

**症状**:
```
❌ FAIL tests/e2e/user-registration.test.ts
  User Registration Flow
    ✗ should complete registration
      Timeout: element not found: button[type="submit"]
```

**対応手順**:

1. **セレクターを確認**
   ```typescript
   // ❌ 間違ったセレクター
   await page.click('button[type="submit"]');

   // ✅ 正しいセレクター（実際のHTMLに合わせる）
   await page.click('[data-testid="register-button"]');
   ```

2. **待機時間を調整**
   ```typescript
   // 要素が表示されるまで待機
   await page.waitForSelector('[data-testid="register-button"]', {
     timeout: 10000,
   });
   ```

3. **スクリーンショットで確認**
   ```typescript
   // 失敗時点のスクリーンショットを撮る
   await page.screenshot({ path: 'debug-screenshot.png' });
   ```

4. **テストを再実行**
   ```bash
   npx playwright test tests/e2e/user-registration.test.ts
   ```

## 問題の分類と対応

### 1. コードのバグ

**特徴**:
- 実装ロジックが間違っている
- 期待される動作と異なる結果が返される

**対応**:
1. バグを修正
2. Phase Aのテストを再実行
3. PRを作成してマージ
4. Phase Bを再実行

### 2. テストコードの問題

**特徴**:
- テストの期待値が間違っている
- テストのセットアップが不適切

**重要**: **実装に合わせてテストを変更してはいけない**

**対応**:
1. テストの期待値が仕様と一致しているか確認
2. 仕様が正しい場合のみテストを修正
3. 仕様が変更された場合は、ステークホルダーに確認

### 3. 環境の問題

**特徴**:
- ローカルでは成功するがCI/CDで失敗
- データベースや外部サービスの接続エラー

**対応**:
1. 環境変数を確認
2. 依存サービスの起動状態を確認
3. ネットワーク設定を確認
4. タイムゾーンなどの環境依存要因を確認

### 4. 仕様変更

**特徴**:
- 以前は成功していたテストが失敗
- 機能追加や仕様変更後に発生

**対応**:
1. ステークホルダーに仕様変更を確認
2. 仕様変更が正しい場合、テストを更新
3. 関連ドキュメントを更新

## Phase別の対応フロー

### Phase Aで失敗した場合

```
Phase A失敗
    ↓
ローカルで修正
    ↓
ローカルでPhase Aを再実行
    ↓
すべて成功？
    YES → コミット → プッシュ → CI/CD自動実行
    NO → 修正を続ける
    ↓
CI/CD成功？
    YES → PRレビュー依頼
    NO → ローカルで修正 → 再プッシュ
```

**重要**: Phase Aが成功するまでPRを作成しない

### Phase Bで失敗した場合

```
Phase B失敗
    ↓
問題を特定
    ↓
バグ修正のPRを作成
    ↓
Phase Aを通過させる（CI/CD自動実行）
    ↓
PRをマージ
    ↓
Phase Bを再実行
    ↓
すべて成功？
    YES → リリースタグ作成
    NO → 再度バグ修正
```

**重要**: Phase Bで見つかった問題は、必ず**PR → Phase A → マージ**のフローを経て修正

## トラブルシューティングチェックリスト

### 単体テスト失敗時

- [ ] テストケースを単独で実行して確認
- [ ] 実装コードのロジックを確認
- [ ] テストの期待値が仕様と一致しているか確認
- [ ] モックやスタブが正しく設定されているか確認
- [ ] テストデータが適切か確認

### 統合テスト失敗時

- [ ] データベースが起動しているか
- [ ] データベースの接続設定が正しいか
- [ ] テストデータが準備されているか
- [ ] 外部サービスのモックが適切か
- [ ] トランザクションが適切にロールバックされているか

### E2Eテスト失敗時

- [ ] アプリケーションが起動しているか
- [ ] セレクターが正しいか（最新のHTMLに対応）
- [ ] 待機時間が十分か
- [ ] テストブラウザのバージョンが適切か
- [ ] スクリーンショットで状態を確認

### パフォーマンステスト失敗時

- [ ] 負荷生成ツールが正しく動作しているか
- [ ] ターゲットサーバーのリソースが十分か
- [ ] ネットワーク帯域が十分か
- [ ] テストシナリオが適切か
- [ ] 閾値設定が現実的か

### セキュリティテスト失敗時

- [ ] 脆弱性の重要度を確認（Critical/High/Medium/Low）
- [ ] 誤検知（False Positive）ではないか確認
- [ ] 該当箇所のコードを確認
- [ ] 修正方法を検討
- [ ] 修正後、再スキャンで検証

## よくあるエラーと解決方法

### Error: Cannot find module

**原因**: 依存パッケージがインストールされていない

**解決方法**:
```bash
# Node.js
npm install

# Java
./gradlew build

# PHP
composer install
```

### Error: Port already in use

**原因**: 別のプロセスがポートを使用している

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### Error: Database connection refused

**原因**: データベースが起動していない

**解決方法**:
```bash
# Dockerの場合
docker-compose up -d postgres

# ローカルの場合
sudo service postgresql start
```

### Error: Timeout waiting for element

**原因**: 要素の表示に時間がかかっている

**解決方法**:
```typescript
// 待機時間を延長
await page.waitForSelector('button', { timeout: 30000 });
```

## 緊急時の対応

### Phase Aで繰り返し失敗する場合

1. **一時的にCI/CDをスキップ**（推奨しない）
   - 緊急の場合のみ
   - 必ず後で修正

2. **別のブランチで調査**
   ```bash
   git checkout -b debug/test-failure
   # 調査と修正
   ```

3. **チームメンバーに相談**
   - 同じ問題に遭遇していないか確認
   - ペアプログラミングで解決

### Phase Bで致命的なバグが見つかった場合

1. **リリースを延期**
   - ステークホルダーに報告
   - 修正スケジュールを調整

2. **緊急修正を実施**
   ```bash
   # hotfixブランチを作成
   git checkout -b hotfix/critical-bug

   # 修正を実装
   # Phase A → マージ → Phase B
   ```

3. **リリース後に問題が発覚した場合**
   - 即座にロールバック
   - hotfixで修正
   - 再リリース

## ベストプラクティス

### 1. エラーログを必ず保存

```bash
# ログをファイルに保存
npm test 2>&1 | tee test-output.log
```

### 2. 再現手順を記録

```markdown
## 再現手順
1. `npm test` を実行
2. `tests/unit/calculator.test.ts` が失敗
3. エラーメッセージ: "Expected: 60, Received: 70"
```

### 3. 失敗したテストは必ず修正してからマージ

**絶対にしてはいけないこと**:
- ❌ テストをコメントアウトしてスキップ
- ❌ `expect(true).toBe(true)` のようなダミーテストに変更
- ❌ 「後で直す」と言ってマージ

### 4. TDDの原則を守る

- テストが失敗したら、まず実装を疑う
- 実装を修正してテストを通す
- テストを変更するのは、仕様変更時のみ

## 次のステップ

- [テスト実行フロー](./test-execution-flow.md): Phase A/Bの詳細
- [TDDサイクル](./tdd-cycle.md): テスト駆動開発の実践方法
- [リリースフロー](../release/release-flow.md): テスト成功後のリリース手順
