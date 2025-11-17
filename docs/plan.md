# 実行計画

## プロジェクト概要
**タイトル**: Issue #55, #56 修正 - テストスキップ解消  
**バージョン**: v0.0.9  
**期限**: 2営業日（2025-11-17 〜 2025-11-18）

---

## Phase 1: Issue #55 - バリデーションエラーハンドリング修正

### 🎯 目標
`buildConfig`関数のバリデーションエラーがテストで正しくキャッチされるようにする

### 📝 タスク

#### Task 1.1: 原因調査（30分）
**実施日**: Day 1 - 11/17 (月)

- [ ] テストファイル確認
  - ファイル: `src/__tests__/integration/setup/validation.test.ts`
  - スキップされた5つのテストを分析
  - エラー検証方法を確認

- [ ] 実装コード確認
  - ファイル: `src/commands/setup-existing.ts`
  - `buildConfig`関数のエラースロー箇所を特定
  - `validateProjectName`, `validateJiraKey`の動作確認

- [ ] 問題原因特定
  - async関数のエラーハンドリング問題
  - `prompt`関数の対話的処理がテストを妨げているか
  - モック不足の可能性

#### Task 1.2: テスト修正（TDD）（30分）
**実施日**: Day 1 - 11/17 (月)

- [ ] テスト実行（失敗確認）
  ```bash
  npm test -- validation.test.ts
  ```

- [ ] エラー検証方法の改善
  - `await expect(...).rejects.toThrow()` パターン
  - モック設定の追加（`prompt`関数）
    - **方法**: Vitestの`vi.mock('readline')`を使用
    - `readline.createInterface`をモック化

- [ ] テストコード修正
  - 5つのスキップされたテストを修正
  - まだ`.skip`は残す

#### Task 1.3: 実装修正（15分）
**実施日**: Day 1 - 11/17 (月)

- [ ] `buildConfig`のエラーハンドリング改善
  - エラーが確実にスローされることを確認
  - テスト用のモック対応追加

#### Task 1.4: テスト有効化と検証（15分）
**実施日**: Day 1 - 11/17 (月)

- [ ] `.skip`削除
- [ ] 全テスト実行
  ```bash
  npm test -- validation.test.ts
  ```
- [ ] カバレッジ確認

---

## Phase 2: Issue #56 - Claude-agentテンプレート構造修正

### 🎯 目標
`templates/claude-agent/`に必要なテンプレートファイルを追加し、テストを有効化

### 📝 タスク

#### Task 2.1: テンプレート設計（30分）
**実施日**: Day 1 - 11/17 (月)

- [ ] 環境設定確認（優先）
  - `scripts/constants/environments.ts`を確認
  - `claude-agent`の`rulesDir`, `commandsDir`パスを把握

- [ ] 既存環境の参考調査
  - `templates/cursor/`の構造確認
  - `templates/claude/`の構造確認
  - Claude Code Subagents仕様の確認（`.claude/README.md`など）

- [ ] 必要なテンプレート決定
  - `subagents/`: 必要なサブエージェントリスト
  - `commands/`: 必要なコマンドリスト

- [ ] ディレクトリ構造設計
  ```
  templates/claude-agent/
  ├── README.md
  ├── subagents/
  │   ├── manager-pj.md
  │   ├── manager-agent.md
  │   ├── developer.md
  │   ├── test-developer.md
  │   ├── design-expert.md
  │   └── review-cq.md
  └── commands/
      └── kiro/
          ├── spec-init.md
          ├── spec-requirements.md
          ├── spec-design.md
          └── spec-tasks.md
  ```

#### Task 2.2: テンプレートファイル作成（60分）
**実施日**: Day 1-2 - 11/17 (月) 〜 11/18 (火)

- [ ] `subagents/`ディレクトリ作成
  - Day 1: `manager-pj.md`, `developer.md`, `test-developer.md`
  - Day 2: `design-expert.md`, `review-cq.md`, `manager-agent.md`

- [ ] `commands/`ディレクトリ作成
  - Day 2: `/kiro/spec-*.md`ファイル群

- [ ] プレースホルダー対応
  - `{{KIRO_DIR}}` → `.kiro`
  - `{{ENV_DIR}}` → `.claude`
  - テンプレートレンダリング確認

- [ ] 国際化対応
  - 日本語版テンプレート
  - 英語版は後回し（Issue分離）

#### Task 2.3: 環境設定の見直し（15分）
**実施日**: Day 2 - 11/18 (火)

- [ ] `scripts/constants/environments.ts`確認
  - `claude-agent`の設定が正しいか
  - `rulesDir`, `commandsDir`のパス確認

#### Task 2.4: テスト有効化と検証（15分)
**実施日**: Day 2 - 11/18 (火)

- [ ] テスト有効化
  - `src/__tests__/integration/setup/claude-agent.test.ts`
  - `.skip`削除

- [ ] テスト実行
  ```bash
  npm test -- claude-agent.test.ts
  ```

- [ ] 全テストスイート実行
  ```bash
  npm test
  ```

---

## Phase 3: PR作成とCI監視

### 📝 タスク

#### Task 3.1: PR作成（10分）
**実施日**: Day 2 - 11/18 (火)

- [ ] 作業ディレクトリ確認
  ```bash
  cd /Users/arigatatsuya/Work/git/michi
  pwd
  ```

- [ ] コミット
  ```bash
  jj commit -m "fix: resolve validation error handling and claude-agent template structure (#55, #56)"
  ```

- [ ] ブックマーク作成
  ```bash
  jj bookmark create fix/test-skip-issues-55-56 -r '@-'
  ```

- [ ] プッシュ（ユーザーが実行）
  ```bash
  jj git push --bookmark fix/test-skip-issues-55-56 --allow-new
  ```

- [ ] PR作成（ユーザーが実行）
  ```bash
  gh pr create --head fix/test-skip-issues-55-56 --base main \
    --title "fix: resolve validation error handling and claude-agent template structure (#55, #56)" \
    --body "## 概要
  Issue #55とIssue #56のテストスキップを解消
  
  ## 変更内容
  - Issue #55: バリデーションエラーハンドリング修正
  - Issue #56: Claude-agentテンプレート構造追加
  
  ## テスト結果
  - 9つのスキップテストを全て有効化
  - 全テストスイート成功
  
  Fixes #55
  Fixes #56"
  ```

#### Task 3.2: CI監視（継続）
**実施日**: Day 2 - 11/18 (火)

- [ ] PR番号確認
- [ ] CI状態監視
  ```bash
  gh pr checks <pr-number>
  ```
- [ ] CI成功まで定期的にチェック

---

## 📊 スケジュールサマリー

| 日付 | 曜日 | フェーズ | 所要時間 |
|------|------|---------|----------|
| Day 1<br>11/17 (月) | 月 | Phase 1: Issue #55完了<br>Phase 2: Task 2.1-2.2（途中） | 3h |
| Day 2<br>11/18 (火) | 火 | Phase 2: Task 2.2-2.4完了<br>Phase 3: PR作成とCI監視 | 1h |

**合計**: 4h（2営業日）

---

## ✅ 完了チェックリスト

### Issue #55
- [ ] 5つのバリデーションテストが全て成功
- [ ] エラーハンドリングが正しく動作
- [ ] テストカバレッジ維持

### Issue #56
- [ ] `templates/claude-agent/subagents/`作成済み
- [ ] `templates/claude-agent/commands/`作成済み
- [ ] 4つのテストが全て成功
- [ ] `setup-existing --claude-agent`コマンド正常動作

### 共通
- [ ] 全テストスイート成功
- [ ] Lintエラーなし
- [ ] PRレビュー承認済み
- [ ] mainへマージ完了

---

最終更新: 2025-11-17 (月) - 計画作成完了

