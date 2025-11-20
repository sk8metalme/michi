# 実行計画

## プロジェクト概要
**タイトル**: Issue #58 - テンプレートディレクトリ名の整合性修正  
**バージョン**: v0.0.10（次期リリース）  
**期限**: 即日対応（2025-11-17）  
**工数**: 1h

---

## 📋 Issue #58: テンプレートディレクトリ名の不整合修正

### 🎯 目標
`templates/claude-agent/rules/` を `templates/claude-agent/subagents/` にリネームし、テンプレートソース名と配置先名を一致させる。

### 問題の詳細
- **現状**: テンプレートディレクトリが`rules`だが、配置先は`subagents`
- **影響**: 新規開発者への混乱、保守性の低下
- **優先度**: 高（技術的負債の早期解消）

### 採用する解決策
**Option 1**: テンプレートディレクトリをリネーム
- シンプル、明確、一貫性がある
- 追加の複雑性なし

---

## Phase 1: リファクタリング実装

### 📝 タスク

#### Task 1.1: 事前確認（10分）
**実施日**: Day 1 - 11/17 (月)

- [x] 現在のテンプレート構造を確認
  ```bash
  ls -la templates/claude-agent/
  ```
  確認済み: `rules/`ディレクトリが存在

- [ ] 既存テストの状態確認
  ```bash
  npm test -- claude-agent.test.ts
  ```

- [ ] 影響範囲の特定
  - `src/commands/setup-existing.ts` (Line 378-384)
  - テストファイル: `src/__tests__/integration/setup/claude-agent.test.ts`

#### Task 1.2: テストの作成（TDD）（15分）
**実施日**: Day 1 - 11/17 (月)

- [ ] 既存テストの動作確認
  - `claude-agent.test.ts`が`subagents`ディレクトリを期待していることを確認
  - 現在のテストが成功していることを確認（Issue #55, #56で修正済み）

- [ ] リネーム後の動作を想定
  - テンプレートソース: `templates/claude-agent/subagents/`
  - 配置先: `.claude/subagents`
  - 両者が一致していることを確認するテスト追加は不要（既存テストで十分）

#### Task 1.3: ディレクトリリネーム実装（10分）
**実施日**: Day 1 - 11/17 (月)

- [ ] Gitでリネーム
  ```bash
  cd /Users/arigatatsuya/Work/git/michi
  
  # Jujutsuでディレクトリをリネーム
  jj status  # 未コミット変更の確認
  
  # 直接リネーム（Gitが自動検出）
  mv templates/claude-agent/rules templates/claude-agent/subagents
  
  # 変更確認
  jj status
  jj diff
  ```

- [ ] ディレクトリ構造確認
  ```bash
  ls -la templates/claude-agent/
  # 期待: subagents/ ディレクトリが存在
  ```

#### Task 1.4: コード確認（5分）
**実施日**: Day 1 - 11/17 (月)

- [ ] `setup-existing.ts`の変数名を確認
  - Line 378: `const rulesTemplateDir = join(templateSourceDir, 'rules');`
  - この行は変更不要（`envConfig.rulesDir`に従っており、claude-agentでは`subagents`になる）
  - コメントが必要かどうか検討

- [ ] コメント追加（必要に応じて）
  ```typescript
  // テンプレートディレクトリ名は環境ごとに異なる
  // claude-agent: 'subagents', cursor/claude: 'rules'
  const rulesTemplateDir = join(templateSourceDir, 'rules');
  ```

**重要**: コードの変更は不要です。`envConfig.rulesDir`が適切にマッピングを行っています。

#### Task 1.5: テスト実行（15分）
**実施日**: Day 1 - 11/17 (月)

- [ ] Claude-agentテスト実行
  ```bash
  npm test -- claude-agent.test.ts
  ```

- [ ] 全テストスイート実行
  ```bash
  npm test
  ```
  期待: 全テスト成功（235 passed）

- [ ] Lint確認
  ```bash
  npm run lint
  ```

#### Task 1.6: ドキュメント更新（5分）
**実施日**: Day 1 - 11/17 (月)

- [ ] README.mdの確認
  - テンプレート構造の記載を確認
  - 必要に応じて更新

- [ ] `templates/claude-agent/README.md`の確認
  - ディレクトリ構造の説明を更新

---

## Phase 2: PR作成とCI監視

### 📝 タスク

#### Task 2.1: コミットとPR作成（10分）
**実施日**: Day 1 - 11/17 (月)

- [ ] 作業ディレクトリ確認
  ```bash
  cd /Users/arigatatsuya/Work/git/michi
  pwd
  ```

- [ ] 未コミット変更の確認
  ```bash
  jj status
  ```

- [ ] コミット
  ```bash
  jj commit -m "refactor: rename claude-agent template directory from rules to subagents (#58)

  - Rename templates/claude-agent/rules/ to templates/claude-agent/subagents/
  - Align template source name with destination directory name
  - Improve maintainability and reduce confusion for new developers

  Fixes #58"
  ```

- [ ] ブックマーク作成
  ```bash
  jj bookmark create refactor/issue-58-template-naming -r '@-'
  ```

- [ ] プッシュ（ユーザーが実行）
  ```bash
  # Step 0: 作業ディレクトリに移動
  cd /Users/arigatatsuya/Work/git/michi
  
  # Step 1: GitHub認証確認
  gh auth status
  
  # Step 2: プッシュ
  jj git push --bookmark refactor/issue-58-template-naming --allow-new
  ```

- [ ] PR作成（ユーザーが実行）
  ```bash
  gh pr create --head refactor/issue-58-template-naming --base main \
    --title "refactor: rename claude-agent template directory from rules to subagents (#58)" \
    --body "## 概要
  Issue #58のテンプレートディレクトリ名の不整合を修正
  
  ## 問題
  - テンプレートソース: \`templates/claude-agent/rules/\`
  - 配置先: \`.claude/subagents\`
  
  名前の不整合により、新規開発者に混乱を招く可能性がありました。
  
  ## 変更内容
  - \`templates/claude-agent/rules/\` を \`templates/claude-agent/subagents/\` にリネーム
  - テンプレートソース名と配置先名を一致
  - 保守性の向上
  
  ## テスト結果
  - 全テストスイート成功（235 passed）
  - Lintエラーなし
  
  ## 影響範囲
  - テンプレートディレクトリのみ（コード変更なし）
  - 低リスク（機能的には既に動作していた）
  
  Fixes #58"
  ```

#### Task 2.2: CI監視（継続）
**実施日**: Day 1 - 11/17 (月)

- [ ] PR番号確認
  ```bash
  gh pr list
  ```

- [ ] CI状態監視
  ```bash
  gh pr checks <pr-number>
  ```

- [ ] CI成功まで定期的にチェック

---

## 📊 スケジュールサマリー

| 日付 | 曜日 | フェーズ | 所要時間 |
|------|------|---------|----------|
| Day 1<br>11/17 (月) | 月 | Phase 1: リファクタリング実装<br>Phase 2: PR作成とCI監視 | 1h |

**合計**: 1h（即日完了）

---

## ✅ 完了チェックリスト

### Phase 1: リファクタリング
- [ ] テンプレートディレクトリをリネーム（`rules` → `subagents`）
- [ ] 全テストスイート成功（235 passed）
- [ ] Lintエラーなし
- [ ] ドキュメント更新

### Phase 2: PR作成
- [ ] コミット作成
- [ ] ブックマーク作成
- [ ] プッシュ実行（ユーザー）
- [ ] PR作成（ユーザー）
- [ ] CI成功確認

### Phase 3: レビューとマージ
- [ ] PRレビュー承認済み
- [ ] mainへマージ完了
- [ ] Issue #58クローズ

---

## 📝 重要な注意事項

### コード変更は不要
`src/commands/setup-existing.ts` の Line 378の変数名`rulesTemplateDir`は変更不要です。

**理由**:
- この変数は汎用的な名前で、`envConfig.rulesDir`に従っています
- `claude-agent`環境では`envConfig.rulesDir = '.claude/subagents'`
- テンプレートディレクトリ名を環境別に動的に解決する仕組みはありません
- 将来的に柔軟性が必要になった場合は、Issue #58のOption 2を検討

### リスク評価
- **リスク**: 極低
- **理由**: ディレクトリ名のみの変更、Gitが自動的にリネームを検出

---

最終更新: 2025-11-17 (月) - 計画作成完了
