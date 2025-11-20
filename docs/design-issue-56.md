# Issue #56: Claude-agentテンプレート構造修正 - 詳細設計

## 問題の根本原因

### 現在の状態

```
templates/claude-agent/
└── README.md  # これしかない
```

### 環境設定（scripts/constants/environments.ts）

```typescript
'claude-agent': {
  rulesDir: '.claude/rules',  // ← 問題: テストは .claude/subagents を期待
  commandsDir: '.claude/commands/kiro',
  templateSource: 'claude-agent'
}
```

### テストの期待値

1. `.claude/subagents/`ディレクトリが作成される
2. `.claude/rules`ディレクトリは作成されない（Subagents環境では不要）
3. `.claude/commands/kiro/`ディレクトリが作成される

---

## 修正方針

### 1. 環境設定の修正

**ファイル**: `scripts/constants/environments.ts`

```typescript
'claude-agent': {
  rulesDir: '.claude/subagents',  // 修正: rules → subagents
  commandsDir: '.claude/commands/kiro',
  templateSource: 'claude-agent'
}
```

**影響範囲**:
- `setup-existing.ts`が`rulesDir`を使用してディレクトリを作成
- `claude-agent`環境では`.claude/subagents`が作成される

### 2. テンプレートディレクトリ構造の作成

**目標構造**:

```
templates/claude-agent/
├── README.md
├── subagents/
│   ├── .gitkeep  # 空ディレクトリを保持
│   └── (将来的にサブエージェント定義ファイルを追加)
└── commands/
    └── kiro/
        ├── .gitkeep  # 空ディレクトリを保持
        └── (将来的にコマンド定義ファイルを追加)
```

**理由**:
- Issue #56の主目的は「テストを有効化すること」
- サブエージェントやコマンドの具体的な内容は別Issueで対応
- 最低限の構造を作成し、テストを成功させる

### 3. テスト有効化

**対象ファイル**:
1. `src/__tests__/integration/setup/validation.test.ts` (1個)
2. `src/__tests__/integration/setup/claude-agent.test.ts` (3個)

**修正箇所**:
- Line 78 (validation.test.ts): `should accept claude-agent environment flag`
- Line 43 (claude-agent.test.ts): `should create .claude/subagents directory`
- Line 99 (claude-agent.test.ts): `should have subagents directory structure`
- Line 125 (claude-agent.test.ts): `should not create basic Claude rules directory`

---

## 実装手順

### Step 1: 環境設定の修正（5分）

```bash
# ファイル: scripts/constants/environments.ts
# Line 22を修正
rulesDir: '.claude/subagents',
```

### Step 2: テンプレートディレクトリ作成（10分）

```bash
cd /Users/arigatatsuya/Work/git/michi

# subagentsディレクトリ作成
mkdir -p templates/claude-agent/subagents
touch templates/claude-agent/subagents/.gitkeep

# commandsディレクトリ作成
mkdir -p templates/claude-agent/commands/kiro
touch templates/claude-agent/commands/kiro/.gitkeep
```

### Step 3: テスト有効化（5分）

4つのテストから`.skip`を削除

### Step 4: テスト実行（5分）

```bash
npm test -- claude-agent.test.ts
npm test -- validation.test.ts
```

---

## テストの期待結果

### validation.test.ts

```
✓ should accept claude-agent environment flag
```

### claude-agent.test.ts

```
✓ should create .claude/subagents directory
✓ should have subagents directory structure
✓ should not create basic Claude rules directory
```

---

## チェックリスト

### 実装
- [ ] `scripts/constants/environments.ts` Line 22 修正
- [ ] `templates/claude-agent/subagents/.gitkeep` 作成
- [ ] `templates/claude-agent/commands/kiro/.gitkeep` 作成

### テスト
- [ ] `validation.test.ts` Line 78 `.skip`削除
- [ ] `claude-agent.test.ts` Line 43 `.skip`削除
- [ ] `claude-agent.test.ts` Line 99 `.skip`削除
- [ ] `claude-agent.test.ts` Line 125 `.skip`削除

### 検証
- [ ] `claude-agent.test.ts`実行（4つのテスト成功）
- [ ] `validation.test.ts`実行（1つのテスト成功）
- [ ] 全テストスイート実行（全テスト成功）

---

## 将来的な拡張（別Issue）

### Subagentsファイルの追加

`templates/claude-agent/subagents/`に以下を追加:
- `manager-pj.md`
- `manager-agent.md`
- `developer.md`
- `test-developer.md`
- `design-expert.md`
- `review-cq.md`

### Commandsファイルの追加

`templates/claude-agent/commands/kiro/`に以下を追加:
- `spec-init.md`
- `spec-requirements.md`
- `spec-design.md`
- `spec-tasks.md`

---

最終更新: 2025-11-17 (月)

