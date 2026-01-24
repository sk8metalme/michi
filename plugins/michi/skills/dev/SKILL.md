---
name: dev
description: |
  TDD実装 + 品質自動化スキル

  Red-Green-Refactor サイクルでTDD実装を行います。
  事前品質監査（OSS License, Version Audit）、自動修正ループ（最大5回）、
  事後品質レビュー（Code Review, Design Review）を含みます。
  カバレッジ95%以上、Mutation Testing（オプション）を実施します。

trigger_keywords:
  - "実装したい"
  - "TDDで実装"
  - "開発を開始"
  - "dev"
---

# dev: TDD実装 + 品質自動化

TDD実装 + 品質自動化スキルは、テスト駆動開発（Red-Green-Refactor）サイクルで実装を行い、包括的な品質管理を実施します。

## 概要

このスキルは以下のフェーズを自動実行します：

### Phase 6.1: 実装準備
1. タスク一覧を確認
2. **TODO状況確認**（高優先度TODOの警告表示）
3. ブランチ作成（feature/{pj-name}）
4. 実装対象タスクを選択

### Phase 6.2: 事前品質監査
1. OSS License Check（`oss-license-checker` エージェント）
2. Version Audit（`stable-version-auditor` エージェント）
3. 問題検出時は修正を実行

### Phase 6.3: TDD実装（Red-Green-Refactor）
1. **Red**: テストを先に書く（失敗することを確認）
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コードを整理・改善
4. 1タスクあたり最大500行の変更を推奨

### Phase 6.4: 自動修正ループ（最大5回）
1. テスト実行
2. 失敗時は自動修正を試行
3. 最大5回までループ
4. 5回失敗時はユーザーに報告

### Phase 6.5: カバレッジ検証
1. テストカバレッジを測定
2. 95%以上を目標
3. 不足時は追加テストを作成

### Phase 6.6: Mutation Testing（オプション）
1. Stryker / PIT を使用
2. Mutation Score 80%以上を目標

### Phase 6.7: 事後品質レビュー
1. Code Review（`code-review` エージェント）
2. Design Review（`design-review` エージェント）
3. 問題検出時は修正を実行

### Phase 6.8: コミット・PR作成
1. git add / git commit
2. gh pr create
3. CI/CD実行確認

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「実装したい」
- 「TDDで実装」
- project.json の `phase: "tasks-generated"` の場合に自動提案

### 明示的発動

```bash
/michi dev {pj-name}
```

**例**:
```bash
/michi dev user-auth
```

## 実行内容

### Phase 6.1: 実装準備

1. **タスク一覧確認**:
   - `docs/michi/YYYYMMDD-{pj-name}/tasks/tasks.md` を読み込み
   - 未完了タスクを表示

2. **TODO状況確認**:
   - `docs/michi/YYYYMMDD-{pj-name}/todos/todos.md` を読み込み
   - 未解決の高優先度TODOがある場合は警告表示
   ```
   ⚠️ 警告: 未解決の高優先度TODOがあります

   TODO-Q-001: 認証トークンの有効期限は何分にすべきか？

   実装を続行しますか？
   ```text
   - ユーザーが続行を選択した場合のみ次に進む

3. **タスク選択**:
   - ユーザーに実装するタスクを選択させる
   - 依存関係を確認

4. **ブランチ作成**:
   ```bash
   git checkout -b feature/{pj-name}/{task-id}
   ```

### Phase 6.2: 事前品質監査

**サブエージェント活用（Bashエージェント並行実行）**:

品質監査を複数のBashエージェントで並行実行します：

| エージェント | タイプ | コマンド | 目的 |
|-------------|-------|---------|------|
| ライセンスチェック | Bash | `npx license-checker --summary` | OSS License 監査 |
| バージョン監査 | Bash | `npm outdated --json` | EOL/非推奨バージョン検出 |
| 依存脆弱性 | Bash | `npm audit --json` | 既知脆弱性チェック |

→ Critical検出時は即時停止

**実行内容**:

1. **OSS License Check**:
   - `oss-license-checker` エージェントを自動実行
   - 違反ライセンスを検出
   - 代替パッケージを提案

2. **Version Audit**:
   - `stable-version-auditor` エージェントを自動実行
   - EOLバージョンを検出
   - アップグレードを提案

3. **問題修正**:
   - 検出された問題を自動修正
   - 修正不可能な場合はユーザーに報告

**メリット**:
- 複数のnpmコマンドを並行実行
- 品質チェックの待ち時間を大幅短縮
- 各コマンドの結果を独立して評価

### Phase 6.3: TDD実装

**Red-Green-Refactor サイクル**:

1. **Red（失敗するテストを書く）**:
   ```typescript
   describe('User Registration', () => {
     it('should create a new user', async () => {
       const result = await createUser({
         email: 'test@example.com',
         password: 'password123'
       });
       expect(result).toBeDefined();
       expect(result.id).toBeDefined();
     });
   });
   ```

2. **Green（最小限の実装）**:
   ```typescript
   async function createUser(data: CreateUserInput): Promise<User> {
     // 最小限の実装
     const user = await db.users.create(data);
     return user;
   }
   ```

3. **Refactor（コード整理）**:
   ```typescript
   async function createUser(data: CreateUserInput): Promise<User> {
     // バリデーション追加
     validateEmail(data.email);
     validatePassword(data.password);

     // パスワードハッシュ化
     const hashedPassword = await hashPassword(data.password);

     // ユーザー作成
     const user = await db.users.create({
       ...data,
       password: hashedPassword
     });

     return user;
   }
   ```

### Phase 6.4: 自動修正ループ

```
テスト実行 → 失敗 → 自動修正 → テスト再実行
（最大5回までループ）
```

### Phase 6.5: カバレッジ検証

**サブエージェント活用（Bashエージェント並行実行）**:

| エージェント | タイプ | コマンド | 目的 |
|-------------|-------|---------|------|
| テスト実行 | Bash | `npm test -- --coverage` | カバレッジ95%以上確認 |
| Mutation Testing | Bash | `npx stryker run` | テスト品質検証（オプション） |

```bash
npm test -- --coverage
```

**カバレッジ目標**:
- Statements: 95%以上
- Branches: 90%以上
- Functions: 95%以上
- Lines: 95%以上

**メリット**:
- カバレッジ測定とMutation Testingを並行実行
- 最終検証の時間を短縮

### Phase 6.6: Mutation Testing（オプション）

```bash
npx stryker run
```

**Mutation Score目標**: 80%以上

### Phase 6.7: 事後品質レビュー

1. **Code Review**:
   - コード品質チェック
   - セキュリティ脆弱性スキャン
   - ベストプラクティス確認

2. **Design Review**:
   - 設計書との整合性確認
   - アーキテクチャ原則遵守確認

### Phase 6.8: コミット・PR作成

1. **コミット**:
   ```bash
   git add .
   git commit -m "feat: implement user registration API"
   ```

2. **PR作成**:
   ```bash
   gh pr create --title "feat: user registration" --body "..."
   ```

3. **CI/CD確認**:
   - GitHub Actions実行確認
   - テスト合格確認

## 次のステップ

実装完了後、次のステップに進みます：

### オプション1: 次のタスクを実装

`dev` スキルを再度実行して次のタスクを実装します。

```bash
/michi dev {pj-name}
```

### オプション2: 実装検証

`review-dev` スキルを使用して実装を検証します。

```bash
/michi review-dev {pj-name}
```

### オプション3: アーカイブ

すべてのタスクが完了したら、プロジェクトをアーカイブします。

```bash
/michi archive-pj {pj-name}
```

## コードサイズ監視

`code-size-monitor` ルールにより、500行を超える変更は警告されます。
大規模な変更の場合は、タスクを分割することを推奨します。

## 参照

- **コードサイズルール**: `../../rules/code-size-rules.md`
- **TDDガイドライン**: `../references/workflow-guide.md#tdd`
- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**次のスキル**:
- `review-dev` - 実装検証
- `archive-pj` - プロジェクトアーカイブ（完了時）
