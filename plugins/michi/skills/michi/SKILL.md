---
name: michi
description: |
  AI駆動開発ワークフロー自動化スキル（Spec-Driven Development + TDD）

  プロジェクト初期化から要件定義、設計、テスト計画、タスク分割、TDD実装まで、
  包括的な開発ワークフローをサポートします。

  マルチリポジトリプロジェクトにも対応し、クロスリポジトリ整合性検証や
  並行実装を実行できます。

  **主要機能**:
  - 仕様駆動開発(SDD): 要件定義 → 設計 → テスト計画 → タスク分割
  - TDD実装: Red-Green-Refactor サイクル + 品質自動化
  - レビュー・検証: 設計レビュー、実装検証、Gap分析
  - プロジェクト管理: ステータス確認、アーカイブ、プロジェクト切り替え
  - マルチリポジトリ: 統合仕様管理、クロスリポ検証、並行実装

  **発動条件**:
  - キーワード: 「仕様」「要件定義」「設計」「テスト計画」「実装」など
  - ワークフロー: project.json のフェーズ情報を参照して次のステップを提案
  - 明示的呼び出し: /michi [サブコマンド] [引数]

trigger_keywords:
  - "仕様"
  - "要件定義"
  - "設計"
  - "設計書"
  - "テスト計画"
  - "タスク分割"
  - "実装"
  - "TDD"
  - "マルチリポ"
  - "マルチリポジトリ"
  - "プロジェクト初期化"
  - "アーカイブ"
  - "ステータス"
  - "レビュー"
  - "Gap分析"
  - "michi"
---

# Michi: AI駆動開発ワークフロー自動化スキル

Michiは、仕様駆動開発（SDD）からTDD実装まで、包括的な開発ワークフローを自動化するClaude Code スキルです。

## 使用方法

このスキルは2つの方法で使用できます：

### 1. 自動発動（推奨）

Claude が会話の文脈やプロジェクトの状態から自動的に判断して発動します。

**発動トリガー**:
- **キーワード**: 「要件定義したい」「設計書を作成」「テスト計画を立てたい」「実装したい」など
- **ワークフローフェーズ**: project.json のフェーズ情報を参照
  - `phase: "initialized"` → 要件定義を提案
  - `phase: "requirements-generated"` → 設計フェーズを提案
  - `phase: "design-generated"` → テスト計画またはタスク分割を提案
  - `phase: "tasks-generated"` → TDD実装を提案
- **ユーザーの意図**: 文脈から次のステップを判断

**例**:
- 「新しいプロジェクトを開始したい」→ Claude がプロジェクト初期化を提案
- 「要件定義したい」→ Claude が要件定義書作成を実行
- 「設計書を作成」→ Claude が設計書作成を実行
- 「実装したい」→ Claude がTDD実装を開始

### 2. 明示的な発動

スキルを直接呼び出すこともできます：

```bash
/michi [サブコマンド] [引数]
```

**例**:
```bash
# プロジェクト初期化
/michi launch-pj "ユーザー認証機能"

# 要件定義
/michi create-requirements user-auth

# 設計書作成
/michi create-design user-auth

# テスト計画
/michi plan-tests user-auth

# タスク分割
/michi create-tasks user-auth

# TDD実装
/michi dev user-auth

# ステータス確認
/michi show-status user-auth

# マルチリポジトリプロジェクト初期化
/michi-multi-repo launch-pj "EC Platform" --jira KEY --confluence-space SPACE
```

詳細は `references/command-reference.md` を参照してください。

---

## 主要機能（19機能）

### プロジェクト管理（4機能）

1. **launch-pj**: プロジェクト初期化
   - プロジェクト説明から一意の機能名を生成
   - ディレクトリ構造とメタデータを作成
   - 次のフェーズ（要件定義）への準備

2. **show-status**: ステータス表示
   - 仕様全体の進捗状況を確認
   - 完了タスク数 / 全タスク数
   - 次に実行すべきアクション

3. **archive-pj**: アーカイブ
   - 完了したプロジェクトをアーカイブに移動
   - メタデータを保持

4. **switch-pj**: プロジェクト切り替え
   - 複数のプロジェクト間を切り替え
   - 現在のコンテキストを変更

### 仕様作成（3機能）

5. **create-requirements**: 要件定義書作成
   - EARS形式の要件定義を生成
   - ultrathink自動有効化で深い分析
   - マスタードキュメントコンテキストと整合

6. **create-design**: 設計書作成
   - アーキテクチャ設計（C4モデル）
   - シーケンス図
   - データモデル

7. **update-master-docs**: マスタードキュメント更新
   - プロジェクト横断の共通知識を更新
   - structure.md, tech.md, product.md

### テスト計画（1機能）

8. **plan-tests**: テスト計画作成
   - テスト戦略（Phase 0.3）
   - テスト仕様（Phase 0.4）
   - 単体・統合・E2E・パフォーマンステスト

### 開発実行（2機能）

9. **create-tasks**: タスク分割
   - 設計を実装可能なタスクに分割
   - 1-3日単位のタスク粒度
   - 依存関係マッピング

10. **dev**: TDD実装 + 品質自動化
    - Red-Green-Refactor サイクル
    - 事前品質監査（OSS License, Version Audit）
    - 自動修正ループ（最大5回）
    - 事後品質レビュー（Code Review, Design Review）
    - カバレッジ95%以上
    - Mutation Testing（オプション）

### レビュー・検証（3機能）

11. **review-design**: 設計レビュー
    - 技術的妥当性確認
    - セキュリティチェック
    - テスト計画準備状況確認

12. **review-dev**: 実装検証
    - コード品質チェック
    - テストカバレッジ確認
    - セキュリティ脆弱性スキャン

13. **analyze-gap**: Gap分析
    - 既存コードベースとの差分分析
    - 統合ポイント特定
    - 実装戦略提案

### マルチリポジトリ（6機能）

14. **multi-repo:launch-pj**: マルチリポジトリプロジェクト初期化
    - 複数リポジトリにまたがるプロジェクトを初期化
    - JIRA/Confluence連携設定

15. **multi-repo:create-requirements**: マルチリポジトリ要件定義
    - EARS形式の統合要件定義
    - リポジトリ間の依存関係を明記

16. **multi-repo:create-design**: マルチリポジトリ設計
    - C4モデルによるアーキテクチャ設計
    - クロスリポジトリ整合性を考慮

17. **multi-repo:review-cross**: クロスリポジトリ整合性検証
    - 各リポジトリの仕様間の整合性を検証
    - インターフェース不整合を検出

18. **multi-repo:propagate**: 各リポジトリへ仕様展開
    - 統合仕様を各リポジトリに展開
    - 並行実行で効率化

19. **multi-repo:dev-all**: 全リポジトリ並行実装
    - 複数リポジトリで並行してTDD実装
    - 依存関係を考慮した実行順序

---

## 推奨ワークフロー

### 標準的な開発フロー

```
Phase 1: プロジェクト初期化
  /michi launch-pj "プロジェクト説明"

Phase 2: 要件定義
  /michi create-requirements {feature-name}

Phase 3: 設計
  /michi create-design {feature-name}

Phase 4: テスト計画
  /michi plan-tests {feature-name}

Phase 5: タスク分割
  /michi create-tasks {feature-name}

Phase 6: TDD実装
  /michi dev {feature-name}

Phase 7: アーカイブ（完了時）
  /michi archive-pj {feature-name}
```

### マルチリポジトリワークフロー

```
Phase 1: マルチリポジトリプロジェクト初期化
  /michi-multi-repo launch-pj "プロジェクト説明" --jira KEY --confluence-space SPACE

Phase 2: 統合要件定義
  /michi-multi-repo create-requirements {project-name}

Phase 3: 統合設計
  /michi-multi-repo create-design {project-name}

Phase 4: クロスリポジトリ整合性検証
  /michi-multi-repo review-cross {project-name}

Phase 5: 各リポジトリへ仕様展開
  /michi-multi-repo propagate {project-name}

Phase 6: 全リポジトリ並行実装
  /michi-multi-repo dev-all {project-name}
```

詳細は `references/workflow-guide.md` を参照してください。

---

## ディレクトリ構造

Michiは以下のディレクトリ構造を使用します：

```
.michi/                                    # プロジェクト内メタデータ（.gitignore対象）
├── pj/                                    # プロジェクト単位のメタデータ
│   └── YYYYMMDD-{pj-name}/                # 例: 20260115-user-auth/
│       └── project.json                   # 仕様メタデータ（フェーズ、承認状況）
└── archive-pj/                            # アーカイブ済みプロジェクト
    └── {pj-name}-{timestamp}/
        └── project.json

docs/michi/YYYYMMDD-{pj-name}/             # 仕様書（Git管理される）
├── spec/
│   ├── requirements.md                    # 要件定義書
│   ├── architecture.md                    # 構造設計（C4モデル）
│   ├── design.md                          # 詳細設計
│   └── sequence.md                        # シーケンス図
├── tasks/
│   └── tasks.md                           # タスク一覧
├── research/
│   └── research.md                        # 発見ログ
└── test-plan/
    ├── strategy.md                        # テスト戦略
    ├── unit/                              # 単体テスト仕様
    ├── integration/                       # 統合テスト仕様
    ├── e2e/                               # E2Eテスト仕様
    └── performance/                       # パフォーマンステスト仕様

~/.michi/                                  # グローバル設定（ユーザーホーム）
└── settings/
    ├── rules/                             # ルール定義
    │   ├── ears-format.md                 # EARS形式ガイドライン
    │   └── master-docs-principles.md      # マスタードキュメント原則
    └── templates/                         # テンプレート
        └── specs/
            └── requirements.md            # 要件定義テンプレート
```

---

## 発動条件の詳細

### キーワードベース発動

以下のキーワードを含む発言で自動発動します：

- **プロジェクト初期化**: 「新しいプロジェクトを開始」「仕様を初期化」「プロジェクト作成」
- **要件定義**: 「要件定義したい」「要件を作成」「要求仕様」
- **設計**: 「設計書を作成」「アーキテクチャを設計」「設計を開始」
- **テスト計画**: 「テスト計画を立てたい」「テスト戦略」「テスト仕様」
- **タスク分割**: 「タスクに分割」「タスク一覧を作成」「実装タスク」
- **実装**: 「実装したい」「TDDで実装」「開発を開始」
- **ステータス**: 「進捗を確認」「ステータスを表示」「現在の状況は？」
- **レビュー**: 「設計をレビュー」「実装を検証」「Gap分析」
- **アーカイブ**: 「プロジェクトをアーカイブ」「完了したのでアーカイブ」
- **マルチリポジトリ**: 「マルチリポジトリプロジェクト」「複数リポジトリ」「クロスリポ検証」

### ワークフローベース発動

project.json のフェーズ情報を参照して、次のステップを自動提案します：

| 現在のフェーズ | 次のステップ提案 |
|-------------|--------------|
| `initialized` | 要件定義（create-requirements） |
| `requirements-generated` | 設計（create-design） |
| `design-generated` | テスト計画（plan-tests）またはタスク分割（create-tasks） |
| `tasks-generated` | TDD実装（dev） |
| `implementation-complete` | アーカイブ（archive-pj） |

### ハイブリッド発動

キーワードとワークフローの両方を考慮して、Claude が柔軟に判断します。

**例**:
- ユーザー: 「要件定義したい」（キーワード）
- project.json: `phase: "initialized"`（ワークフロー）
- → Claude が create-requirements を自動実行

---

## 参照ドキュメント

より詳細な情報は、以下の参照ドキュメントを確認してください：

- **references/command-reference.md**: 全19機能の詳細リファレンス
- **references/workflow-guide.md**: 開発ワークフローの全体説明
- **references/multi-repo-guide.md**: マルチリポジトリ開発の説明
- **references/triggers.md**: 発動トリガー（キーワード、フェーズ）一覧
- **references/examples.md**: 使用例・ユースケース

---

## 重要な制約

- **フェーズ分離**: 各フェーズは独立して実行され、前のフェーズの承認が必要
- **TDD必須**: 実装はテスト駆動開発（Red-Green-Refactor）で行う
- **品質ゲート**: カバレッジ95%以上、全テスト合格が必須
- **仕様整合**: 実装は設計書（design.md）と要件定義書（requirements.md）に準拠
- **プロジェクト名形式**: `YYYYMMDD-{pj-name}` 形式（例: 20260115-user-auth）

---

## トラブルシューティング

### よくある問題

**Q1: スキルが自動発動しない**
- project.json が存在するか確認
- フェーズ情報が正しく設定されているか確認
- キーワードを明示的に使用してみる

**Q2: 明示的発動でエラーが出る**
- プロジェクト名（YYYYMMDD-{pj-name}）形式を確認
- 必要なファイル（project.json, requirements.md など）が存在するか確認

**Q3: フェーズが進まない**
- 前のフェーズが承認されているか確認（project.json の approvals フィールド）
- /michi show-status で現在の状態を確認

---

## バージョン情報

- **スキルバージョン**: 1.3.0
- **プラグインバージョン**: 1.3.0
- **互換性**: Claude Code 0.5.0 以降

---

**Michi統合**: このスキルは、仕様駆動開発（SDD）からTDD実装まで、包括的な品質自動化を含む開発ワークフローを提供します。JIRA/Confluence連携、マルチリポジトリ対応、レビュー・検証機能により、エンタープライズグレードの開発を支援します。
