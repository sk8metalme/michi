---
# タスクリストテンプレート
# このテンプレートは /michi:create-tasks コマンドで生成される構造を定義します
# プレースホルダー（{{...}}）は生成時に実際の値に置き換えられます
feature: {{FEATURE_NAME}}
created_at: {{CREATED_AT}}
updated_at: {{UPDATED_AT}}
language: {{LANGUAGE}}
phase: tasks-generated
sequential_mode: {{SEQUENTIAL_MODE}}  # true / false
---

# タスクリスト: {{FEATURE_NAME}}

<!--
このドキュメントは、設計を実行可能な作業項目に変換したタスクリストです。
- 各タスクは1-3時間で完了可能なサイズ
- TDD（テスト駆動開発）で実装
- 要件のトレーサビリティを維持
-->

## タスク実行ガイド

### 実行方法

**特定のタスクを実行**:
```bash
/michi:dev {{FEATURE_NAME}} 1.1
```

**複数のタスクを実行**:
```bash
/michi:dev {{FEATURE_NAME}} 1.1,1.2
```

**すべての保留中タスクを実行** (非推奨):
```bash
/michi:dev {{FEATURE_NAME}}
```

### 重要な注意事項

1. **コンテキストのクリア**: 各タスク間でコンテキストをクリアすることを推奨
2. **タスクサイズ**: 各サブタスクのgit diffは200-400行を目標、最大500行
3. **1タスク1PR**: コード・ドキュメントの変更は1タスクごとに1つのPRを作成
4. **並列化**: `(P)` マーカー付きタスクは並列実行可能
5. **TDD**: Red → Green → Refactor サイクルを守る

---

## タスク概要

**合計**: {{TOTAL_MAJOR_TASKS}} 主要タスク、{{TOTAL_SUBTASKS}} サブタスク

**要件カバレッジ**: {{REQUIREMENTS_COVERED}} / {{TOTAL_REQUIREMENTS}} 要件

**シーケンシャルモード**: {{SEQUENTIAL_MODE}} (true = すべて直列 / false = 並列マーカー有効)

**推定工数**: {{ESTIMATED_HOURS}} 時間

---

## タスク進行状況

<!-- /michi:dev コマンドで自動更新されます -->

| タスクID | ステータス | 要件カバレッジ | PRリンク | 完了日 |
|---------|----------|--------------|---------|--------|
| 1.1 | [ ] | {{REQ_1_1}} | - | - |
| 1.2 | [ ] | {{REQ_1_2}} | - | - |
| 2.1 | [ ] | {{REQ_2_1}} | - | - |
| 2.2 | [ ] | {{REQ_2_2}} | - | - |

**ステータス**: `[ ]` 未着手 / `[x]` 完了

---

## 品質インフラセットアップ (自動生成)

<!-- /michi:create-tasks で言語検出後、自動追加されるセクション -->

### 言語: {{DETECTED_LANGUAGE}}

**必須項目のセットアップ**:

<!-- Node.js/TypeScript の例 -->
- [ ] huskyのインストールと設定
  ```bash
  npm install --save-dev husky
  npx husky install
  npx husky add .husky/pre-commit "npm run lint-staged"
  ```

- [ ] lint-stagedの設定
  ```bash
  npm install --save-dev lint-staged
  ```
  `package.json` に追加:
  ```json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
  ```

- [ ] TypeScript strict modeの有効化
  `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true
    }
  }
  ```

- [ ] CI/CD設定 ({{CI_PLATFORM}})
  - GitHub Actions: `.github/workflows/{{LANGUAGE}}.yml`
  - Screwdriver: `screwdriver.yaml`

**推奨項目のセットアップ**:

- [ ] {{RECOMMENDED_TOOL_1}} のインストール
- [ ] {{RECOMMENDED_TOOL_2}} の設定

---

## タスク 1: {{TASK_1_TITLE}} {{PARALLEL_MARKER_1}}

<!-- 主要タスクの概要 -->
{{TASK_1_DESCRIPTION}}

**要件カバレッジ**: {{TASK_1_REQUIREMENTS}} (例: 1, 2, 3)

**依存関係**: {{TASK_1_DEPENDENCIES}} (例: なし / Task 2完了後)

**推定工数**: {{TASK_1_HOURS}} 時間

---

### 1.1. {{SUBTASK_1_1_TITLE}} {{PARALLEL_MARKER_1_1}}

<!-- サブタスクの詳細 -->
{{SUBTASK_1_1_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_1_1_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_1_1_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_1_1_DIFF}} 行 (目標: 200-400行)

**チェックリスト**:
- [ ] {{CHECKLIST_1_1_1}}
- [ ] {{CHECKLIST_1_1_2}}
- [ ] {{CHECKLIST_1_1_3}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_1_1_1}}
- {{DELIVERABLE_1_1_2}}
- テストカバレッジ: 95%以上

---

### 1.2. {{SUBTASK_1_2_TITLE}} {{PARALLEL_MARKER_1_2}}

{{SUBTASK_1_2_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_1_2_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_1_2_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_1_2_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_1_2_1}}
- [ ] {{CHECKLIST_1_2_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_1_2_1}}
- {{DELIVERABLE_1_2_2}}
- テストカバレッジ: 95%以上

---

### 1.3. {{SUBTASK_1_3_TITLE}} {{PARALLEL_MARKER_1_3}}

{{SUBTASK_1_3_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_1_3_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_1_3_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_1_3_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_1_3_1}}
- [ ] {{CHECKLIST_1_3_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_1_3_1}}
- {{DELIVERABLE_1_3_2}}
- テストカバレッジ: 95%以上

---

## タスク 2: {{TASK_2_TITLE}} {{PARALLEL_MARKER_2}}

{{TASK_2_DESCRIPTION}}

**要件カバレッジ**: {{TASK_2_REQUIREMENTS}}

**依存関係**: {{TASK_2_DEPENDENCIES}}

**推定工数**: {{TASK_2_HOURS}} 時間

---

### 2.1. {{SUBTASK_2_1_TITLE}} {{PARALLEL_MARKER_2_1}}

{{SUBTASK_2_1_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_2_1_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_2_1_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_2_1_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_2_1_1}}
- [ ] {{CHECKLIST_2_1_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_2_1_1}}
- {{DELIVERABLE_2_1_2}}
- テストカバレッジ: 95%以上

---

### 2.2. {{SUBTASK_2_2_TITLE}} {{PARALLEL_MARKER_2_2}}

{{SUBTASK_2_2_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_2_2_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_2_2_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_2_2_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_2_2_1}}
- [ ] {{CHECKLIST_2_2_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_2_2_1}}
- {{DELIVERABLE_2_2_2}}
- テストカバレッジ: 95%以上

---

## タスク 3: {{TASK_3_TITLE}} {{PARALLEL_MARKER_3}}

{{TASK_3_DESCRIPTION}}

**要件カバレッジ**: {{TASK_3_REQUIREMENTS}}

**依存関係**: {{TASK_3_DEPENDENCIES}}

**推定工数**: {{TASK_3_HOURS}} 時間

---

### 3.1. {{SUBTASK_3_1_TITLE}} {{PARALLEL_MARKER_3_1}}

{{SUBTASK_3_1_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_3_1_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_3_1_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_3_1_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_3_1_1}}
- [ ] {{CHECKLIST_3_1_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_3_1_1}}
- {{DELIVERABLE_3_1_2}}
- テストカバレッジ: 95%以上

---

### 3.2. {{SUBTASK_3_2_TITLE}} {{PARALLEL_MARKER_3_2}}

{{SUBTASK_3_2_DESCRIPTION}}

**能力に焦点を当てた説明**:
{{SUBTASK_3_2_CAPABILITY}}

**要件カバレッジ**: {{SUBTASK_3_2_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_3_2_DIFF}} 行

**チェックリスト**:
- [ ] {{CHECKLIST_3_2_1}}
- [ ] {{CHECKLIST_3_2_2}}
- [ ] テストを書く（TDD: Red）
- [ ] 実装する（TDD: Green）
- [ ] リファクタリング（TDD: Refactor）
- [ ] コードレビュー準備

**成果物**:
- {{DELIVERABLE_3_2_1}}
- {{DELIVERABLE_3_2_2}}
- テストカバレッジ: 95%以上

---

## タスク 4: 統合とE2Eテスト {{PARALLEL_MARKER_4}}

<!-- 統合テストとE2Eテストのタスク -->

{{TASK_4_DESCRIPTION}}

**要件カバレッジ**: {{TASK_4_REQUIREMENTS}}

**依存関係**: Task 1, 2, 3 完了後

**推定工数**: {{TASK_4_HOURS}} 時間

---

### 4.1. 統合テスト実装 {{PARALLEL_MARKER_4_1}}

{{SUBTASK_4_1_DESCRIPTION}}

**要件カバレッジ**: {{SUBTASK_4_1_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_4_1_DIFF}} 行

**チェックリスト**:
- [ ] 統合テストケースの洗い出し
- [ ] テストデータの準備
- [ ] 統合テストの実装
- [ ] CIでの自動実行設定
- [ ] テスト結果の検証

**成果物**:
- 統合テストコード
- テストレポート

---

### 4.2. E2Eテスト実装 {{PARALLEL_MARKER_4_2}}

{{SUBTASK_4_2_DESCRIPTION}}

**要件カバレッジ**: {{SUBTASK_4_2_REQUIREMENTS}}

**推定git diff**: {{SUBTASK_4_2_DIFF}} 行

**チェックリスト**:
- [ ] E2Eテストシナリオの洗い出し
- [ ] テスト環境の準備
- [ ] E2Eテストの実装
- [ ] CIでの自動実行設定
- [ ] テスト結果の検証

**成果物**:
- E2Eテストコード
- テストレポート

---

## オプションタスク (MVP後に延期可能)

<!-- MVP完了後に実装するオプションのタスク -->
<!-- `- [ ]*` マーカーで識別される -->

### オプション 1: パフォーマンス最適化 (P)

- [ ]* {{OPTIONAL_1_1}}
- [ ]* {{OPTIONAL_1_2}}
- [ ]* {{OPTIONAL_1_3}}

**要件カバレッジ**: {{OPTIONAL_1_REQUIREMENTS}}

**推定工数**: {{OPTIONAL_1_HOURS}} 時間

---

### オプション 2: 高度なエラーハンドリング (P)

- [ ]* {{OPTIONAL_2_1}}
- [ ]* {{OPTIONAL_2_2}}
- [ ]* {{OPTIONAL_2_3}}

**要件カバレッジ**: {{OPTIONAL_2_REQUIREMENTS}}

**推定工数**: {{OPTIONAL_2_HOURS}} 時間

---

## 並列化マーカーの説明

### `(P)` マーカー

**意味**: このタスクは他のタスクと並列実行可能

**適用基準**:
1. タスクフォーカスの独立性（異なるコンポーネント/機能を対象とする）
2. コード変更の分離（異なるファイル/モジュールを変更する）
3. データソースの非競合（異なるデータベーステーブル/APIエンドポイントを使用）
4. 統合テストの分離（他の並列タスクのテストと干渉しない）
5. ブランチ戦略の独立性（異なるfeatureブランチで作業可能）

**シーケンシャルモード**: `{{SEQUENTIAL_MODE}}` が `true` の場合、すべてのタスクは直列実行され、`(P)` マーカーは省略されます。

**参照**: `docs/michi/{{FEATURE_NAME}}/research/research.md` の「将来のタスクの並列化考慮事項」セクション

---

### `- [ ]*` マーカー

**意味**: MVPには含まれないオプションのテストカバレッジサブタスク

**適用基準**:
1. 厳密にコア実装によって既に満たされた受入基準をカバーする
2. MVP後に延期できる
3. 品質向上のための追加テストケース

**注意**: 基本的なテストケース（TDDで実装されるもの）には使用しない

---

## 要件トレーサビリティマトリックス

<!-- すべての要件がタスクにマッピングされていることを確認 -->

| 要件ID | 要件名 | 対応タスク | ステータス |
|--------|--------|-----------|----------|
| {{REQ_1}} | {{REQ_1_NAME}} | 1.1, 1.2 | [ ] |
| {{REQ_2}} | {{REQ_2_NAME}} | 2.1 | [ ] |
| {{REQ_3}} | {{REQ_3_NAME}} | 2.2, 3.1 | [ ] |
| {{REQ_4}} | {{REQ_4_NAME}} | 3.2 | [ ] |

**注意**: 要件IDは requirements.md で定義された数値IDのみを使用（カンマ区切り、説明サフィックスなし）

---

## タスク分割戦略

<!-- このタスクリストで使用された分割戦略 -->

**適用した戦略**:
1. {{SPLIT_STRATEGY_1}} (例: 水平分割 - レイヤー別)
2. {{SPLIT_STRATEGY_2}} (例: 垂直分割 - 機能スライス別)
3. {{SPLIT_STRATEGY_3}} (例: フェーズ分割 - 段階別)

**git diffサイズ管理**:
- 目標: 各サブタスク 200-400行
- 最大: 500行
- 除外: ロックファイル、自動生成ファイル

---

## 重要な注意事項

<!--
テンプレート使用時の注意点:
1. タスクは自然言語で能力に焦点を当てた説明を記述（コード構造の詳細ではない）
2. 最大2レベル（主要タスク + サブタスク）の階層構造を守る
3. シーケンシャル番号付けを使用（主要タスクは1, 2, 3...）
4. すべての要件をタスクにマッピングする（完全なカバレッジ）
5. 単一サブタスク構造は主要タスクに昇格させて折りたたみを避ける
6. 並列マーカー `(P)` は適用基準を満たすタスクにのみ使用
7. オプションマーカー `- [ ]*` はMVP後に延期可能なテストカバレッジのみに使用
8. TDD（Red → Green → Refactor）サイクルを守る
9. テストカバレッジ95%以上を維持
10. 各タスク間でコンテキストをクリアすることを推奨
-->
