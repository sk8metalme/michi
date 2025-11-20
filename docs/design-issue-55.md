# Issue #55: バリデーションエラーハンドリング修正 - 詳細設計

## 問題の根本原因

### 現在の実装（src/commands/setup-existing.ts）

```typescript
// buildConfig関数内（Line 167-172）
try {
  projectName = validateProjectName(projectName);
} catch (error) {
  throw new Error(`プロジェクト名が不正です: ${error instanceof Error ? error.message : error}`);
}

// buildConfig関数内（Line 180-185）
try {
  jiraKey = validateJiraKey(jiraKey);
} catch (error) {
  throw new Error(`JIRAキーが不正です: ${error instanceof Error ? error.message : error}`);
}
```

### テストの期待値

```typescript
// validation.test.ts（Line 214）
.rejects.toThrow(/プロジェクト名が空です/);

// validation.test.ts（Line 225）
.rejects.toThrow(/パス区切り文字/);
```

### 問題

**実際のエラーメッセージ**: `プロジェクト名が不正です: プロジェクト名が空です`  
**期待されるメッセージ**: `プロジェクト名が空です`

→ **ラッピングによってマッチしない**

---

## 修正方針

### Option 1: エラーをラッピングせずそのままスロー（推奨）

**メリット**:
- テストの期待値と一致する
- エラーメッセージがシンプル
- エラーの原因が直接的に伝わる

**実装**:
```typescript
// buildConfig関数内（Line 167-172）
try {
  projectName = validateProjectName(projectName);
} catch (error) {
  // ラッピングせず、そのままスロー
  throw error;
}

// buildConfig関数内（Line 180-185）
try {
  jiraKey = validateJiraKey(jiraKey);
} catch (error) {
  // ラッピングせず、そのままスロー
  throw error;
}
```

### Option 2: テストの期待値を修正（非推奨）

**デメリット**:
- エラーメッセージが冗長になる
- ラッピングの必要性が不明瞭

**実装**:
```typescript
// テストを修正
.rejects.toThrow(/プロジェクト名が不正です.*プロジェクト名が空です/);
```

---

## 採用する修正方針

**Option 1を採用**

理由:
1. エラーメッセージがシンプルで分かりやすい
2. `validateProjectName`や`validateJiraKey`が既に適切なエラーメッセージを返している
3. 二重ラッピングの必要性がない
4. テストの期待値が自然

---

## 修正対象ファイル

### 1. src/commands/setup-existing.ts

**修正箇所**: `buildConfig`関数内のエラーハンドリング

```typescript
// Line 167-172: プロジェクト名バリデーション
try {
  projectName = validateProjectName(projectName);
} catch (error) {
  throw error; // 修正: ラッピングを削除
}

// Line 180-185: JIRAキーバリデーション
try {
  jiraKey = validateJiraKey(jiraKey);
} catch (error) {
  throw error; // 修正: ラッピングを削除
}
```

### 2. src/__tests__/integration/setup/validation.test.ts

**修正箇所**: スキップされた5つのテストの`.skip`を削除

```typescript
// Line 145
it('should reject unsupported language', async () => { ... });

// Line 207
it('should reject empty project name', async () => { ... });

// Line 218
it('should reject project name with path traversal characters', async () => { ... });

// Line 229
it('should reject project name with backslash', async () => { ... });

// Line 240
it('should reject project name with control characters', async () => { ... });
```

---

## 影響範囲

### 変更による影響

1. **エラーメッセージの変更**:
   - 修正前: `プロジェクト名が不正です: <詳細メッセージ>`
   - 修正後: `<詳細メッセージ>`（例: `プロジェクト名が空です`）

2. **ユーザー体験**:
   - より直接的でシンプルなエラーメッセージ
   - エラーの原因が明確になる

3. **他のテストへの影響**:
   - 既存の成功テスト（プロジェクト名とJIRAキーの正常系）には影響なし
   - エラーテストのうち、以下は既に成功している（ラッピングされていないため）:
     - Line 250: `should reject project name that is too long`
     - Line 328-366: JIRAキーバリデーションのエラーテスト

### 回帰テストの必要性

以下のテストが引き続き成功することを確認:
- [ ] Line 250: `should reject project name that is too long`
- [ ] Line 328: `should reject JIRA key with 1 character`
- [ ] Line 338: `should reject JIRA key with 11 characters`
- [ ] Line 348: `should reject JIRA key with numbers`
- [ ] Line 358: `should reject JIRA key with special characters`

---

## テスト実行計画

### Step 1: 修正前のテスト実行（失敗確認）

```bash
cd /Users/arigatatsuya/Work/git/michi
npm test -- validation.test.ts
```

**期待結果**: 5つのテストがスキップされていることを確認

### Step 2: 実装修正

1. `src/commands/setup-existing.ts`のエラーハンドリングを修正
2. まだ`.skip`は残す

### Step 3: テスト実行（成功確認）

```bash
npm test -- validation.test.ts
```

**期待結果**: 修正後も既存の成功テストが全て成功

### Step 4: `.skip`削除

`src/__tests__/integration/setup/validation.test.ts`の5つのテストから`.skip`を削除

### Step 5: 最終テスト実行

```bash
npm test -- validation.test.ts
```

**期待結果**: 全テスト（5つの新規有効化テストを含む）が成功

### Step 6: 全テストスイート実行

```bash
npm test
```

**期待結果**: 全プロジェクトのテストが成功

---

## チェックリスト

### 実装
- [ ] `src/commands/setup-existing.ts` Line 167-172 修正
- [ ] `src/commands/setup-existing.ts` Line 180-185 修正

### テスト
- [ ] `validation.test.ts` Line 145 `.skip`削除
- [ ] `validation.test.ts` Line 207 `.skip`削除
- [ ] `validation.test.ts` Line 218 `.skip`削除
- [ ] `validation.test.ts` Line 229 `.skip`削除
- [ ] `validation.test.ts` Line 240 `.skip`削除

### 検証
- [ ] 修正前テスト実行（失敗/スキップ確認）
- [ ] 実装修正
- [ ] テスト実行（既存テスト成功確認）
- [ ] `.skip`削除
- [ ] テスト実行（新規テスト成功確認）
- [ ] 全テストスイート実行（全テスト成功確認）

---

最終更新: 2025-11-17 (月)

