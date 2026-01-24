# Michi スキル - ワークフローガイド

このドキュメントは、Michiスキルを使用した開発ワークフローの全体像を説明します。

## 目次

- [概要](#概要)
- [標準的な開発フロー](#標準的な開発フロー)
- [フェーズ詳細](#フェーズ詳細)
- [ワークフローのベストプラクティス](#ワークフローのベストプラクティス)
- [トラブルシューティング](#トラブルシューティング)

---

## 概要

Michiスキルは、**仕様駆動開発（Spec-Driven Development: SDD）** と **テスト駆動開発（Test-Driven Development: TDD）** を組み合わせた開発ワークフローを提供します。

### ワークフローの全体像

```
Phase 1: プロジェクト初期化 (launch-pj)
  ↓
Phase 2: 要件定義 (create-requirements)
  ↓
Phase 3: 設計 (create-design)
  ↓
Phase 4: テスト計画 (plan-tests)
  ↓
Phase 5: タスク分割 (create-tasks)
  ↓
Phase 6: TDD実装 (dev)
  ↓
Phase 7: アーカイブ (archive-pj)
```

### 主要な特徴

- **フェーズ分離**: 各フェーズは独立して実行され、前のフェーズの承認が必要
- **品質ゲート**: 各フェーズで品質基準をクリアする必要がある
- **メタデータ管理**: project.json でフェーズと承認状況を管理
- **自動化**: Claude が自動的に次のステップを提案

---

## 標準的な開発フロー

### Phase 1: プロジェクト初期化

**目的**: 新しい仕様のディレクトリ構造とメタデータを作成します。

**コマンド**:
```bash
/michi launch-pj "ユーザー認証機能"
```

**処理内容**:
1. プロジェクト名を生成（例: `20260115-user-auth`）
2. ディレクトリ構造を作成
   - `.michi/pj/20260115-user-auth/`
   - `docs/michi/20260115-user-auth/`
3. 初期ファイルを生成
   - `project.json`
   - `requirements.md`（テンプレート）
   - `architecture.md`（テンプレート）
   - `sequence.md`（テンプレート）
   - `strategy.md`（テンプレート）

**成功基準**:
- プロジェクトディレクトリが作成された
- project.json が生成された
- `phase: "initialized"` が設定された

**次のステップ**: Phase 2: 要件定義

---

### Phase 2: 要件定義

**目的**: EARS形式の包括的な要件定義書を生成します。

**コマンド**:
```bash
/michi create-requirements 20260115-user-auth
```

**処理内容**:
1. グローバル設定の確認と自動プロビジョニング
2. コンテキストの読み込み
   - project.json
   - requirements.md のプロジェクト説明
   - マスタードキュメント（`docs/master/`）
3. 要件定義の生成
   - EARS形式（Ubiquitous, Event-driven, State-driven, etc.）
   - テスト可能な受入基準
4. メタデータの更新
   - `phase: "requirements-generated"`
   - `approvals.requirements.generated: true`

**成功基準**:
- requirements.md が生成された
- すべての要件がEARS形式に従っている
- 受入基準が明確に定義されている

**オプション: TODO抽出**:
要件定義書から不明点や仮定を抽出してTODO管理を開始できます。

```bash
/michi manage-todos scan 20260115-user-auth
```

抽出対象:
- 「前提条件」セクションの仮定（Assumption）
- 「制約事項」セクションの不明点（Question）

**次のステップ**: Phase 3: 設計

---

### Phase 3: 設計

**目的**: アーキテクチャ設計とシーケンス図を生成します。

**コマンド**:
```bash
/michi create-design 20260115-user-auth
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

**成功基準**:
- architecture.md が生成された
- sequence.md が生成された
- C4モデルの階層構造が適切
- Mermaid図が正しく記述されている

**オプション: TODO抽出**:
設計書からリスクや不明点を抽出してTODO管理を更新できます。

```bash
/michi manage-todos scan 20260115-user-auth
```

抽出対象:
- 設計上のリスク（Risk）
- 技術選定の仮定（Assumption）
- 詳細設計の不明点（Question）
- 技術的負債（Tech Debt）

**次のステップ**: Phase 4: テスト計画

---

### Phase 4: テスト計画

**目的**: テスト戦略とテスト仕様を生成します。

**コマンド**:
```bash
/michi plan-tests 20260115-user-auth
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

**成功基準**:
- test-plan/strategy.md が生成された
- test-plan/unit/*.md が生成された
- test-plan/integration/*.md が生成された
- test-plan/e2e/*.md が生成された（必要に応じて）
- test-plan/performance/*.md が生成された（必要に応じて）

**次のステップ**: Phase 5: タスク分割

---

### Phase 5: タスク分割

**目的**: 設計を実装可能なタスクに分割します。

**コマンド**:
```bash
/michi create-tasks 20260115-user-auth
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

**成功基準**:
- tasks.md が生成された
- タスク粒度が1-3日単位
- 依存関係が明記されている

**次のステップ**: Phase 6: TDD実装

---

### Phase 6: TDD実装

**目的**: テスト駆動開発（TDD）で実装タスクを実行します。

**コマンド**:
```bash
/michi dev 20260115-user-auth
```

**処理内容**:

#### Phase 6.1: コンテキストロード
1. project.json, requirements.md, design.md, tasks.md を読み取り
2. 実行するタスクを決定

#### Phase 6.2: 事前品質監査
1. **oss-license-checker**: OSS License 監査
2. **stable-version-auditor**: Version 監査
3. **Frontend検出**: Frontend変更を検出

#### Phase 6.3: TDD実装サイクル
1. **RED**: 失敗するテストを書く
2. **GREEN**: 最小限のコードを書く
3. **REFACTOR**: クリーンアップ
4. **VERIFY**: 品質チェック（最大5回の自動修正ループ）

#### Phase 6.4: 事後品質レビュー
1. **コードレビュー**（常に実行）
2. **デザインレビュー**（Frontend検出時のみ）

#### Phase 6.5: 最終検証
1. 品質チェック最終実行
2. カバレッジ95%以上確認
3. Mutation Testing（オプション）

#### Phase 6.6: タスク完了マーク
1. tasks.md のチェックボックスを更新

#### Phase 6.7: 進捗チェックガイダンス
1. `/michi show-status` の案内表示

#### Phase 6.8: タスク完了後の処理
1. すべてのタスク完了時、アーカイブを提案

**成功基準**:
- すべてのテストが合格
- カバレッジ95%以上
- tasks.md で完了タスクがマークされている

**次のステップ**: Phase 7: アーカイブ（すべてのタスク完了時）

---

### Phase 7: アーカイブ

**目的**: 完了したプロジェクトをアーカイブに移動します。

**コマンド**:
```bash
/michi archive-pj 20260115-user-auth
```

**処理内容**:
1. `.michi/pj/20260115-user-auth/` を `.michi/archive-pj/user-auth-{timestamp}/` に移動
2. `docs/michi/20260115-user-auth/` は Git 管理されているため、そのまま維持

**成功基準**:
- プロジェクトがアーカイブに移動された
- メタデータが保持されている

---

## フェーズ詳細

### フェーズ管理の仕組み

各フェーズの状態は `project.json` で管理されます：

```json
{
  "name": "20260115-user-auth",
  "description": "ユーザー認証機能",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T11:00:00Z",
  "phase": "requirements-generated",
  "approvals": {
    "requirements": { "approved": true, "generated": true },
    "design": { "approved": false, "generated": false },
    "tasks": { "approved": false, "generated": false }
  }
}
```

### フェーズ遷移

Claude は `project.json` のフェーズ情報を参照して、次のステップを自動提案します：

| 現在のフェーズ | 次のステップ提案 |
|-------------|--------------|
| `initialized` | 要件定義（create-requirements） |
| `requirements-generated` | 設計（create-design） |
| `design-generated` | テスト計画（plan-tests）またはタスク分割（create-tasks） |
| `tasks-generated` | TDD実装（dev） |
| `implementation-complete` | アーカイブ（archive-pj） |

---

## ワークフローのベストプラクティス

### 1. フェーズ分離を守る

各フェーズは独立して実行し、前のフェーズの承認を得てから次に進みます。

**良い例**:
```
Phase 1: launch-pj → 完了
Phase 2: create-requirements → ユーザー承認 → 完了
Phase 3: create-design → ユーザー承認 → 完了
...
```

**悪い例**:
```
Phase 1-3を一気に実行 ❌
```

### 2. ultrathinkを活用する

要件定義では ultrathink が自動的に有効化され、深い分析が行われます。

### 3. マスタードキュメントを最新に保つ

プロジェクト横断の共通知識は `docs/master/` に記録し、定期的に更新します。

```bash
/michi update-master-docs
```

### 4. TDDサイクルを守る

実装では必ず **RED → GREEN → REFACTOR** のサイクルを守ります。

- **RED**: 失敗するテストを先に書く
- **GREEN**: テストを通過させる最小限のコードを書く
- **REFACTOR**: コードをクリーンアップ

### 5. カバレッジ95%以上を維持

すべての新しいコードにはテストが必要です。カバレッジは95%以上を目標にします。

### 6. レビューを活用する

- **設計レビュー**: 実装前に設計の妥当性を確認
- **コードレビュー**: 実装後にコード品質を確認
- **デザインレビュー**: Frontend変更時にアクセシビリティを確認

---

## トラブルシューティング

### Q1: フェーズが進まない

**原因**: 前のフェーズが承認されていない

**対処法**:
```bash
/michi show-status {feature-name}
```
で現在の状態を確認し、未承認のフェーズを承認します。

---

### Q2: テストが失敗する

**原因**: 実装がテスト仕様に合っていない

**対処法**:
1. テスト仕様を確認（test-plan/ 配下）
2. 実装コードを修正
3. 再度テストを実行

**注意**: テストは仕様です。実装に合わせてテストを修正するのではなく、テストに合わせて実装を修正してください。

---

### Q3: カバレッジが95%に満たない

**原因**: テストが不足している

**対処法**:
1. カバレッジレポートを確認
2. テストされていない箇所を特定
3. 追加のテストを書く

---

### Q4: Critical問題が検出された（Phase 6.2）

**原因**: 禁止ライセンスまたはEOL済みバージョンを使用している

**対処法**:
1. 代替パッケージを検討
2. バージョンをアップグレード
3. ユーザーに確認して対応

---

### Q5: マルチリポジトリでクロスリポ整合性エラー

**原因**: 各リポジトリのインターフェースが不整合

**対処法**:
```bash
/michi-multi-repo review-cross {project-name}
```
で整合性を検証し、不整合箇所を修正します。

---

## まとめ

Michiスキルは、仕様駆動開発（SDD）からTDD実装まで、包括的な開発ワークフローをサポートします。フェーズ分離、品質ゲート、自動化により、高品質なソフトウェア開発を実現します。

詳細については、以下のドキュメントを参照してください：

- **command-reference.md**: 全19機能の詳細リファレンス
- **multi-repo-guide.md**: マルチリポジトリ開発の詳細
- **triggers.md**: 発動トリガーの一覧
- **examples.md**: 使用例・ユースケース
