---
name: manage-todos
description: |
  TODO管理スキル

  要件定義・設計段階でのTODO（不明点、仮定、リスク、技術的負債）を管理します。
  既存ドキュメントからTODOを抽出し、対話的に確認・更新します。

trigger_keywords:
  - "TODOを確認"
  - "不明点を整理"
  - "仮定を確認"
  - "リスクを管理"
  - "TODO一覧"
  - "manage-todos"
---

# manage-todos: TODO管理

TODO管理スキルは、プロジェクトの不明点、仮定、リスク、技術的負債を一元管理するために使用します。

## 概要

このスキルは以下を実行します：

1. **TODO抽出**: 既存ドキュメント（requirements.md、architecture.md、design.md、research.md）からTODOを抽出
2. **TODO追加**: 新規TODOを対話的に追加
3. **TODO表示**: カテゴリ別、優先度別にTODOを表示
4. **TODO解決**: TODOを解決済みにマーク

## TODOカテゴリ

| カテゴリ | 略称 | 説明 | 例 |
|---------|------|------|---|
| Question | Q | 確認が必要な不明点 | 認証トークンの有効期限は？ |
| Assumption | A | 暫定的に仮定している事項 | DBはPostgreSQLを使用すると仮定 |
| Risk | R | 識別されたリスク | 外部API障害時の動作が未定義 |
| Tech Debt | T | 技術的負債 | 一時的なハードコーディングあり |

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「TODOを確認したい」
- 「不明点を整理」
- 「仮定を確認」
- 「リスクを管理」

### 明示的発動（サブコマンド）

#### 1. scan - TODO抽出

既存ドキュメントからTODOを抽出します。

```bash
/michi manage-todos scan {pj-name}
```

**抽出対象**:
- `docs/michi/YYYYMMDD-{pj-name}/spec/requirements.md`
  - 「前提条件」セクションの仮定
  - 「制約事項」セクションの不明点
- `docs/michi/YYYYMMDD-{pj-name}/spec/architecture.md`
  - 設計上のリスク
  - 技術選定の仮定
- `docs/michi/YYYYMMDD-{pj-name}/spec/design.md`
  - 詳細設計の不明点
- `docs/michi/YYYYMMDD-{pj-name}/research/research.md`
  - リスクセクション

**認識パターン**:
```markdown
<!-- TODO: [Q] 認証トークンの有効期限は何分にすべきか？ -->
- [ ] TODO: [A] DBはPostgreSQLを使用すると仮定
```

**サブエージェント活用（並列TODO抽出）**:

scanサブコマンドで複数ドキュメントを並列検索します：

#### Phase 1: 並列TODO抽出

| エージェント | 対象 | パターン | 出力 |
|-------------|------|---------|------|
| 要件定義TODO | spec/requirements.md | TODO: [Q], TODO: [A] | 要件TODOリスト |
| 設計TODO | spec/architecture.md, design.md | TODO: [R], TODO: [A], TODO: [T] | 設計TODOリスト |
| 調査ログTODO | research/research.md | すべてのカテゴリ | 調査TODOリスト |
| コードTODO | src/**/*.ts, src/**/*.js | // TODO:, /* TODO: | コードTODOリスト |

#### Phase 2: TODO統合（メインエージェント）

- Phase 1の結果をマージ
- 重複排除、優先度設定
- todos.md生成

**メリット**:
- ドキュメント横断検索の高速化
- 各ドキュメントを独立して探索
- TODO抽出精度の向上

#### 2. show - TODO一覧表示

TODO一覧を表示します。

```bash
/michi manage-todos show {pj-name}
```

**表示形式**:
```text
TODO一覧: user-auth

[Q] Question (2件)
  TODO-Q-001 ⚠️ High   | 認証トークンの有効期限は何分にすべきか？
  TODO-Q-002 📌 Medium | パスワードの最小文字数は？

[A] Assumption (1件)
  TODO-A-001 📌 Medium | DBはPostgreSQLを使用すると仮定

[R] Risk (1件)
  TODO-R-001 ⚠️ High   | 外部API障害時の動作が未定義

統計:
  全TODO: 4件
  未解決: 4件
  高優先度: 2件
```

#### 3. add - TODO追加

新規TODOを対話的に追加します。

```bash
/michi manage-todos add {pj-name}
```

**対話フロー** (AskUserQuestion ツール使用):
1. カテゴリ選択（Q / A / R / T）
   - AskUserQuestion でカテゴリを選択
2. 優先度選択（High / Medium / Low）
   - AskUserQuestion で優先度を選択
3. TODO内容入力
   - ユーザーに入力を促す
4. `todos/todos.md` に追加
   - TODOをファイルに書き込み

#### 4. resolve - TODO解決

TODOを解決済みにマークします。

```bash
/michi manage-todos resolve {pj-name} TODO-Q-001
```

**実行内容**:
1. TODO内容を確認
   - 指定されたTODO IDの内容を表示
   - AskUserQuestion で解決を確認
2. 解決内容を入力
   - ユーザーに解決方法・決定事項を入力させる
3. TODOを解決済みにマーク
   - 解決日時を記録
   - 解決内容を追記
   - `project.json` を更新

**対話的な確認フロー**:
```text
TODO-Q-001の内容:
  認証トークンの有効期限は何分にすべきか？

このTODOを解決済みにしますか？
> はい

解決内容を入力してください:
> 15分に決定。セキュリティ要件と合わせて確認済み。

✓ TODO-Q-001 を解決済みにマークしました
```

## 実行内容

### 1. TODOファイル構造

TODOは以下の構造で管理されます：

```text
docs/michi/YYYYMMDD-{pj-name}/
└── todos/
    └── todos.md              # TODO一覧
```

### 2. todos.mdフォーマット

```markdown
# TODO一覧: {pj-name}

## [Q] Question - 不明点

- [ ] TODO-Q-001 ⚠️ High | 認証トークンの有効期限は何分にすべきか？
  - 発見元: requirements.md
  - 登録日: 2026-01-17
- [x] TODO-Q-002 📌 Medium | パスワードの最小文字数は？
  - 発見元: requirements.md
  - 登録日: 2026-01-17
  - 解決日: 2026-01-18
  - 解決内容: 8文字以上に決定

## [A] Assumption - 仮定

- [ ] TODO-A-001 📌 Medium | DBはPostgreSQLを使用すると仮定
  - 発見元: architecture.md
  - 登録日: 2026-01-17

## [R] Risk - リスク

- [ ] TODO-R-001 ⚠️ High | 外部API障害時の動作が未定義
  - 発見元: research.md
  - 登録日: 2026-01-17

## [T] Tech Debt - 技術的負債

（なし）

---

統計:
- 全TODO: 3件
- 未解決: 3件
- 高優先度: 2件
```

## 既存スキルとの連携

### create-requirements との連携

要件定義書生成後、以下を自動提案します：

```
要件定義書を生成しました。

TODOを抽出しますか？
  - manage-todos scan {pj-name}
```

### create-design との連携

設計書生成後、リスク・不明点をTODOとして抽出提案します。

### show-status との連携

ステータス表示時にTODO状況サマリーを含めます：

```
プロジェクト: user-auth
フェーズ: design-generated

タスク進捗: 3 / 10 完了 (30%)
TODO状況: 未解決 4件（高優先度 2件）

次のアクション:
  - 高優先度TODOを解決（manage-todos show）
  - テスト計画を立てる（plan-tests）
```

### dev との連携

実装開始前に高優先度TODOの警告を表示します：

```
⚠️ 警告: 未解決の高優先度TODOがあります

TODO-Q-001: 認証トークンの有効期限は何分にすべきか？

実装を続行しますか？
```

## 次のステップ

TODO管理後、フェーズに応じて次のステップを実行します：

| 現在のフェーズ | 次のステップ |
|-------------|------------|
| `requirements-generated` | `create-design` - 設計 |
| `design-generated` | `plan-tests` または `create-tasks` |
| `tasks-generated` | `dev` - TDD実装 |

## 参照

- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `create-requirements` - 要件定義書作成
- `create-design` - 設計書作成
- `show-status` - ステータス表示
- `dev` - TDD実装
