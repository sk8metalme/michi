# Michi スキル - コマンドリファレンス

このドキュメントは、Michiスキルで利用可能な全20機能の詳細リファレンスです。

## 目次

- [プロジェクト管理](#プロジェクト管理)
- [仕様作成](#仕様作成)
- [テスト計画](#テスト計画)
- [開発実行](#開発実行)
- [レビュー・検証](#レビュー検証)
- [マルチリポジトリ](#マルチリポジトリ)

---

## プロジェクト管理

### 1. launch-pj - プロジェクト初期化

**用途**: 新しい仕様をプロジェクト説明から初期化します。

**使用方法**:
```bash
# 自動発動
「新しいプロジェクトを開始したい: ユーザー認証機能」

# 明示的発動
/michi launch-pj "ユーザー認証機能"
```

**処理内容**:
1. プロジェクト名を生成（YYYYMMDD-{pj-name} 形式）
2. ディレクトリ構造を作成
   - `.michi/pj/YYYYMMDD-{pj-name}/`
   - `docs/michi/YYYYMMDD-{pj-name}/`
3. 初期ファイルを生成
   - `project.json`: メタデータ
   - `requirements.md`: 要件定義書のテンプレート
   - `architecture.md`: 設計書のテンプレート
   - `sequence.md`: シーケンス図のテンプレート
   - `strategy.md`: テスト戦略のテンプレート

**出力**:
- プロジェクト名
- 作成されたファイルのリスト
- 次のステップ（要件定義）へのガイダンス

**重要な制約**:
- この段階では要件/設計/タスクを生成しない
- 初期化のみを実行

---

### 2. show-status - ステータス表示

**用途**: 仕様全体の進捗状況を確認します。

**使用方法**:
```bash
# 自動発動
「現在のステータスは？」

# 明示的発動
/michi show-status {feature-name}
```

**処理内容**:
1. project.json を読み取り
2. requirements.md, design.md, tasks.md の完了状況を確認
3. タスクの完了数 / 全タスク数を集計

**出力**:
- 現在のフェーズ
- Requirements / Design / Tasks の承認状況
- 完了タスク数 / 全タスク数
- 次に実行すべきアクション

---

### 3. archive-pj - アーカイブ

**用途**: 完了したプロジェクトをアーカイブに移動します。

**使用方法**:
```bash
# 自動発動
「プロジェクトをアーカイブしたい」

# 明示的発動
/michi archive-pj {feature-name}
```

**処理内容**:
1. `.michi/pj/YYYYMMDD-{pj-name}/` を `.michi/archive-pj/{pj-name}-{timestamp}/` に移動
2. `docs/michi/YYYYMMDD-{pj-name}/` は Git 管理されているため、そのまま維持

**出力**:
- アーカイブ先のパス
- アーカイブの成功確認

---

### 4. switch-pj - プロジェクト切り替え

**用途**: 複数のプロジェクト間を切り替えます。

**使用方法**:
```bash
# 自動発動
「別のプロジェクトに切り替えたい」

# 明示的発動
/michi switch-pj {feature-name}
```

**処理内容**:
1. 既存のプロジェクト一覧を表示
2. ユーザーが選択したプロジェクトにコンテキストを切り替え

**出力**:
- 利用可能なプロジェクト一覧
- 切り替え後の現在のプロジェクト

---

### 5. manage-todos - TODO管理

**用途**: 要件定義・設計段階での不明点、仮定、リスク、技術的負債を一元管理します。

**使用方法**:
```bash
# 自動発動
「TODOを確認したい」
「不明点を整理」

# 明示的発動 - サブコマンド
/michi manage-todos scan {pj-name}    # TODO抽出
/michi manage-todos show {pj-name}    # TODO一覧表示
/michi manage-todos add {pj-name}     # TODO追加
/michi manage-todos resolve {pj-name} TODO-Q-001  # TODO解決
```

**TODOカテゴリ**:
- **Question (Q)**: 確認が必要な不明点
- **Assumption (A)**: 暫定的に仮定している事項
- **Risk (R)**: 識別されたリスク
- **Tech Debt (T)**: 技術的負債

**処理内容**:

1. **scan**: 既存ドキュメントからTODOを抽出
   - `requirements.md`: 前提条件、制約事項
   - `architecture.md`: 設計上のリスク、技術選定の仮定
   - `design.md`: 詳細設計の不明点
   - `research.md`: リスクセクション

2. **show**: TODO一覧を表示
   - カテゴリ別、優先度別に表示
   - 統計情報（全TODO、未解決、高優先度）

3. **add**: 新規TODOを対話的に追加
   - カテゴリ選択
   - 優先度選択（High / Medium / Low）
   - TODO内容入力

4. **resolve**: TODOを解決済みにマーク
   - 解決日時を記録
   - `project.json` を更新

**出力**:
- TODO一覧（カテゴリ別）
- 統計情報
- 高優先度TODOの警告

**ファイル構造**:
```
docs/michi/YYYYMMDD-{pj-name}/
└── todos/
    └── todos.md              # TODO一覧
```

**既存スキルとの連携**:
- `create-requirements`: 要件定義後にTODO抽出を提案
- `create-design`: 設計後にリスク・不明点を抽出
- `show-status`: TODO状況サマリーを表示
- `dev`: 実装前に高優先度TODOの警告表示

---

## 仕様作成

### 6. create-requirements - 要件定義書作成

**用途**: EARS形式の包括的な要件定義書を生成します。

**使用方法**:
```bash
# 自動発動
「要件定義したい」

# 明示的発動
/michi create-requirements {feature-name}
```

**処理内容**:
1. グローバル設定の確認と自動プロビジョニング
2. コンテキストの読み込み
   - project.json
   - requirements.md のプロジェクト説明
   - マスタードキュメント（`docs/master/`）
   - EARS形式ルール（`~/.michi/settings/rules/ears-format.md`）
3. 要件定義の生成
   - EARS形式（Ubiquitous, Event-driven, State-driven, etc.）
   - テスト可能な受入基準
4. メタデータの更新
   - `phase: "requirements-generated"`
   - `approvals.requirements.generated: true`

**出力**:
- 生成された要件定義のサマリー
- requirements.md の更新確認
- 次のステップ（設計）へのガイダンス

**重要な制約**:
- ultrathink自動有効化（深い分析モード）
- HOWではなくWHATに焦点
- 要件はテスト可能で検証可能でなければならない

---

### 6. create-design - 設計書作成

**用途**: アーキテクチャ設計とシーケンス図を生成します。

**使用方法**:
```bash
# 自動発動
「設計書を作成」

# 明示的発動
/michi create-design {feature-name}
```

**処理内容**:
1. コンテキストの読み込み
   - requirements.md
   - マスタードキュメント
2. 設計書の生成
   - C4モデル（Context, Container, Component, Code）
   - シーケンス図（Mermaid形式）
   - データモデル
3. メタデータの更新
   - `phase: "design-generated"`
   - `approvals.design.generated: true`

**出力**:
- 設計書のサマリー
- architecture.md, sequence.md の更新確認
- 次のステップ（テスト計画またはタスク分割）へのガイダンス

**重要な制約**:
- C4モデルの階層構造に従う
- Mermaid図の構文を正しく記述

---

### 7. update-master-docs - マスタードキュメント更新

**用途**: プロジェクト横断の共通知識を更新します。

**使用方法**:
```bash
# 自動発動
「マスタードキュメントを更新したい」

# 明示的発動
/michi update-master-docs
```

**処理内容**:
1. `docs/master/` ディレクトリの確認
2. 既存のマスタードキュメントを読み取り
   - structure.md: プロジェクト構造
   - tech.md: 技術スタック
   - product.md: プロダクト知識
3. 新しい知識を追加・更新

**出力**:
- 更新されたマスタードキュメントのサマリー
- 変更箇所のハイライト

---

## テスト計画

### 8. plan-tests - テスト計画作成

**用途**: テスト戦略とテスト仕様を生成します。

**使用方法**:
```bash
# 自動発動
「テスト計画を立てたい」

# 明示的発動
/michi plan-tests {feature-name}
```

**処理内容**:
1. **Phase 0.3: テスト戦略**
   - テストタイプの選択（Unit, Integration, E2E, Performance）
   - カバレッジ目標設定（95%以上推奨）
   - テスト環境の定義
2. **Phase 0.4: テスト仕様**
   - 各テストタイプの具体的なテストケース作成
   - Given-When-Then 形式
   - テストデータの定義

**出力**:
- `test-plan/strategy.md`: テスト戦略
- `test-plan/unit/*.md`: 単体テスト仕様
- `test-plan/integration/*.md`: 統合テスト仕様
- `test-plan/e2e/*.md`: E2Eテスト仕様
- `test-plan/performance/*.md`: パフォーマンステスト仕様

**重要な制約**:
- テストタイプの選択は設計に基づく
- カバレッジ目標は95%以上を推奨

---

## 開発実行

### 9. create-tasks - タスク分割

**用途**: 設計を実装可能なタスクに分割します。

**使用方法**:
```bash
# 自動発動
「タスクに分割したい」

# 明示的発動
/michi create-tasks {feature-name}
```

**処理内容**:
1. design.md を読み取り
2. 実装可能なタスクに分割
   - 1-3日単位のタスク粒度
   - 依存関係マッピング
   - 優先度設定
3. tasks.md を生成
   - チェックボックス形式（`- [ ] タスク名`）
   - タスク番号
   - 説明
4. メタデータの更新
   - `phase: "tasks-generated"`
   - `approvals.tasks.generated: true`

**出力**:
- タスク一覧のサマリー
- tasks.md の作成確認
- 次のステップ（TDD実装）へのガイダンス

**重要な制約**:
- タスク粒度は1-3日単位
- 依存関係を明記

---

### 10. dev - TDD実装 + 品質自動化

**用途**: テスト駆動開発（TDD）で実装タスクを実行します。

**使用方法**:
```bash
# 自動発動
「実装したい」

# 明示的発動
/michi dev {feature-name} [task-numbers] [options]

# オプション
--mutation         Mutation Testing を実行
--skip-license     ライセンスチェックをスキップ
--skip-version     バージョンチェックをスキップ
--skip-design      デザインレビューをスキップ
```

**処理内容**:

**Phase 6.1: コンテキストロード**
1. project.json, requirements.md, design.md, tasks.md を読み取り
2. 実行するタスクを決定

**Phase 6.2: 事前品質監査**
1. **oss-license-checker**: OSS License 監査
   - 🔴 Critical: GPL, AGPL, SSPL → 即時停止
   - 🟡 Warning: LGPL, MPL → 警告表示
2. **stable-version-auditor**: Version 監査
   - 🔴 Critical: EOL済み → 即時停止
   - 🟡 Warning: EOL 6ヶ月以内 → 警告表示
3. **Frontend検出**: Frontend変更を検出

**Phase 6.3: TDD実装サイクル**
1. **RED**: 失敗するテストを書く
2. **GREEN**: 最小限のコードを書く
3. **REFACTOR**: クリーンアップ
4. **VERIFY**: 品質チェック（最大5回の自動修正ループ）
   - Type Check
   - Lint
   - Test

**Phase 6.4: 事後品質レビュー**
1. **コードレビュー**（常に実行）
   - コード品質、セキュリティ、パフォーマンス
2. **デザインレビュー**（Frontend検出時のみ）
   - アクセシビリティ（WCAG 2.1）
   - レスポンシブデザイン
   - UXパターン

**Phase 6.5: 最終検証**
1. 品質チェック最終実行
2. カバレッジ95%以上確認
3. Mutation Testing（オプション）

**Phase 6.6: タスク完了マーク**
1. tasks.md のチェックボックスを更新

**Phase 6.7: 進捗チェックガイダンス**
1. `/michi show-status` の案内表示

**Phase 6.8: タスク完了後の処理**
1. すべてのタスク完了時、アーカイブを提案

**出力**:
- 実行されたタスクのサマリー
- 事前監査結果（OSS License, Version Audit）
- 品質チェック結果（Type Check, Lint, Test, Coverage）
- レビュー結果（Code Review, Design Review）
- 次のステップへのガイダンス

**重要な制約**:
- TDD必須（テストは実装コードの前）
- カバレッジ95%以上
- 全テスト合格
- Critical問題は即時停止

---

## レビュー・検証

### 11. review-design - 設計レビュー

**用途**: 設計書の技術的妥当性を確認します。

**使用方法**:
```bash
# 自動発動
「設計をレビューしたい」

# 明示的発動
/michi review-design {feature-name}
```

**処理内容**:
1. design.md を読み取り
2. 技術的妥当性の確認
   - アーキテクチャの整合性
   - セキュリティリスク
   - パフォーマンス懸念
3. テスト計画準備状況の確認

**出力**:
- レビュー結果のサマリー
- 指摘事項（Critical, Warning, Info）
- 修正推奨箇所

---

### 12. review-dev - 実装検証

**用途**: 実装コードの品質を検証します。

**使用方法**:
```bash
# 自動発動
「実装を検証したい」

# 明示的発動
/michi review-dev {feature-name}
```

**処理内容**:
1. 実装コードの読み取り
2. コード品質チェック
   - 可読性、保守性
   - DRY原則
3. テストカバレッジ確認
4. セキュリティ脆弱性スキャン

**出力**:
- 検証結果のサマリー
- 指摘事項（Critical, Warning, Info）
- 改善提案

---

### 13. analyze-gap - Gap分析

**用途**: 既存コードベースとの差分を分析します。

**使用方法**:
```bash
# 自動発動
「Gap分析したい」

# 明示的発動
/michi analyze-gap {feature-name}
```

**処理内容**:
1. requirements.md, design.md を読み取り
2. 既存コードベースを分析
3. 実装ギャップを特定
   - 新規実装が必要な箇所
   - 既存コンポーネントの活用可能箇所
   - 統合ポイント
4. 実装戦略を提案

**出力**:
- Gap分析結果のサマリー
- 実装ギャップの一覧
- 実装戦略の提案

---

## マルチリポジトリ

### 14. multi-repo:launch-pj - マルチリポジトリプロジェクト初期化

**用途**: 複数リポジトリにまたがるプロジェクトを初期化します。

**使用方法**:
```bash
# 自動発動
「マルチリポジトリプロジェクトを開始したい: EC Platform」

# 明示的発動
/michi-multi-repo launch-pj "EC Platform"
```

**処理内容**:
1. マルチリポジトリプロジェクトのディレクトリ構造を作成
2. 統合仕様のテンプレートを生成

**出力**:
- プロジェクト名
- 作成されたファイルのリスト
- 次のステップ（統合要件定義）へのガイダンス

---

### 15. multi-repo:create-requirements - マルチリポジトリ要件定義

**用途**: 複数リポジトリにまたがる統合要件定義を生成します。

**使用方法**:
```bash
# 自動発動
「マルチリポジトリの要件定義を作成」

# 明示的発動
/michi-multi-repo create-requirements {project-name}
```

**処理内容**:
1. 統合要件定義の生成（EARS形式）
2. リポジトリ間の依存関係を明記
3. 各リポジトリへの要件の割り当て

**出力**:
- 統合要件定義のサマリー
- リポジトリ間の依存関係
- 次のステップ（統合設計）へのガイダンス

---

### 16. multi-repo:create-design - マルチリポジトリ設計

**用途**: 複数リポジトリにまたがる統合設計を生成します。

**使用方法**:
```bash
# 自動発動
「マルチリポジトリの設計を作成」

# 明示的発動
/michi-multi-repo create-design {project-name}
```

**処理内容**:
1. C4モデルによる統合アーキテクチャ設計
2. クロスリポジトリのシーケンス図
3. インターフェース定義

**出力**:
- 統合設計のサマリー
- クロスリポジトリ整合性の確認
- 次のステップ（クロスリポ検証）へのガイダンス

---

### 17. multi-repo:review-cross - クロスリポジトリ整合性検証

**用途**: 各リポジトリの仕様間の整合性を検証します。

**使用方法**:
```bash
# 自動発動
「クロスリポジトリの整合性を検証」

# 明示的発動
/michi-multi-repo review-cross {project-name}
```

**処理内容**:
1. 各リポジトリの仕様を読み取り
2. インターフェース整合性のチェック
3. 依存関係の検証

**出力**:
- 整合性検証結果のサマリー
- 不整合箇所の一覧
- 修正推奨箇所

---

### 18. multi-repo:propagate - 各リポジトリへ仕様展開

**用途**: 統合仕様を各リポジトリに展開します。

**使用方法**:
```bash
# 自動発動
「各リポジトリに仕様を展開」

# 明示的発動
/michi-multi-repo propagate {project-name}
```

**処理内容**:
1. 統合仕様を各リポジトリ用に分割
2. 並行実行で各リポジトリに展開
3. 各リポジトリの project.json を更新

**出力**:
- 展開結果のサマリー
- 各リポジトリの仕様ファイルのパス
- 次のステップ（並行実装）へのガイダンス

---

### 19. multi-repo:dev-all - 全リポジトリ並行実装

**用途**: 複数リポジトリで並行してTDD実装を行います。

**使用方法**:
```bash
# 自動発動
「全リポジトリで実装を開始」

# 明示的発動
/michi-multi-repo dev-all {project-name}
```

**処理内容**:
1. 依存関係を考慮した実行順序の決定
2. 並行実行で各リポジトリの TDD実装
3. 統合テストの実行

**出力**:
- 各リポジトリの実装結果
- 統合テスト結果
- 次のステップへのガイダンス

---

## まとめ

このリファレンスは、Michiスキルで利用可能な全19機能の詳細を提供しています。より詳細な実装手順や技術的な詳細については、以下のドキュメントを参照してください：

- **workflow-guide.md**: 開発ワークフローの全体説明
- **multi-repo-guide.md**: マルチリポジトリ開発の詳細
- **triggers.md**: 発動トリガーの一覧
- **examples.md**: 使用例・ユースケース
