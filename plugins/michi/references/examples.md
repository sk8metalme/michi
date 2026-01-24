# Michi スキル - 使用例とユースケース

このドキュメントは、Michiスキルの具体的な使用例とユースケースを紹介します。

## 目次

- [基本的な使用例](#基本的な使用例)
- [ユースケース](#ユースケース)
- [高度な使用例](#高度な使用例)

---

## 基本的な使用例

### 例1: 新規プロジェクトの開始（自動発動）

**シナリオ**: ユーザー認証機能を新しく開発したい

**会話**:
```
ユーザー: 新しいプロジェクトを開始したい。ユーザー認証機能を実装する。

Claude: プロジェクトを初期化します。
[launch-pj を自動実行]

Claude: プロジェクト「20260115-user-auth」を初期化しました。
次は要件定義フェーズに進みますか？

ユーザー: はい、要件定義を作成してください。

Claude: 要件定義書を作成します。
[create-requirements を自動実行]

Claude: 要件定義書が完成しました。次は設計フェーズに進みますか？
```

**ポイント**:
- Claude が自動的にキーワードを検出して機能を発動
- フェーズごとにユーザーに確認を求める

---

### 例2: 新規プロジェクトの開始（明示的発動）

**シナリオ**: 上記と同じだが、明示的にコマンドを実行したい

**会話**:
```
ユーザー: /michi launch-pj "ユーザー認証機能"

Claude: プロジェクト「20260115-user-auth」を初期化しました。
...

ユーザー: /michi create-requirements 20260115-user-auth

Claude: 要件定義書を作成します。
...

ユーザー: /michi create-design 20260115-user-auth

Claude: 設計書を作成します。
...
```

**ポイント**:
- 明示的にコマンドを実行することで、より制御しやすい
- プロジェクト名を毎回指定する必要がある

---

## ユースケース

### ユースケース1: Web APIの新規開発

**目的**: RESTful APIを新規開発する

**ワークフロー**:
```
1. プロジェクト初期化
   /michi launch-pj "RESTful API for User Management"

2. 要件定義
   /michi create-requirements 20260115-user-api

   【生成される要件の例】
   - システムはユーザー一覧を取得するAPIを提供する
   - システムはユーザーを新規登録するAPIを提供する
   - システムはユーザー情報を更新するAPIを提供する

3. 設計
   /michi create-design 20260115-user-api

   【生成される設計の例】
   - C4モデル: API Gateway → Service Layer → Repository Layer
   - シーケンス図: ユーザー登録フロー
   - データモデル: User, Role, Permission

4. テスト計画
   /michi plan-tests 20260115-user-api

   【生成されるテストの例】
   - Unit: Service Layer のロジックテスト
   - Integration: API Gateway → Service Layer の統合テスト
   - E2E: クライアント → API の E2E テスト

5. タスク分割
   /michi create-tasks 20260115-user-api

   【生成されるタスクの例】
   - Task 1.1: User エンティティの実装
   - Task 1.2: UserRepository の実装
   - Task 1.3: UserService の実装
   - Task 2.1: GET /api/users エンドポイントの実装
   - Task 2.2: POST /api/users エンドポイントの実装

6. TDD実装
   /michi dev 20260115-user-api

   【実装プロセス】
   - Phase 6.2: OSS License チェック、Version 監査
   - Phase 6.3: TDD サイクル (RED → GREEN → REFACTOR)
   - Phase 6.4: コードレビュー
   - Phase 6.5: カバレッジ95%以上確認

7. アーカイブ
   /michi archive-pj 20260115-user-api
```

---

### ユースケース2: Frontendコンポーネントの開発

**目的**: Reactコンポーネントを開発する

**特徴**: Frontend変更を検出すると、デザインレビューが自動実行される

**ワークフロー**:
```
1-5. （上記と同じ）

6. TDD実装（Frontend検出あり）
   /michi dev 20260115-login-form

   【実装プロセス】
   - Phase 6.2: Frontend検出 → true
   - Phase 6.3: TDD サイクル
   - Phase 6.4: コードレビュー + デザインレビュー（自動実行）
     - アクセシビリティ（WCAG 2.1）
     - レスポンシブデザイン
     - UXパターン
   - Phase 6.5: カバレッジ95%以上確認

7. アーカイブ
   /michi archive-pj 20260115-login-form
```

---

### ユースケース3: マルチリポジトリプロジェクトの開発

**目的**: Frontend + Backend + Database の3リポジトリで構成されるECサイトを開発する

**ワークフロー**:
```
1. マルチリポジトリプロジェクト初期化
   /michi-multi-repo launch-pj "EC Platform"

2. 統合要件定義
   /michi-multi-repo create-requirements ec-platform

   【生成される統合要件の例】
   - Requirement 1: ユーザー登録機能
     - Frontend: 登録フォームの実装
     - Backend: 登録APIの実装
     - Database: ユーザーテーブルの作成

3. 統合設計
   /michi-multi-repo create-design ec-platform

   【生成される統合設計の例】
   - C4モデル: Frontend → Backend → Database
   - クロスリポジトリシーケンス図
   - インターフェース定義

4. クロスリポジトリ整合性検証
   /michi-multi-repo review-cross ec-platform

   【チェック項目】
   - Frontend が呼び出す API が Backend に定義されているか
   - データ型が一致しているか

5. 各リポジトリへ仕様展開
   /michi-multi-repo propagate ec-platform

   【展開先】
   - repos/frontend/requirements.md
   - repos/frontend/architecture.md
   - repos/backend/requirements.md
   - repos/backend/architecture.md
   - repos/database/requirements.md
   - repos/database/architecture.md

6. 全リポジトリ並行実装
   /michi-multi-repo dev-all ec-platform

   【実装プロセス】
   - Database: スキーマ作成
   - Backend: API実装（並行）
   - Frontend: コンポーネント実装（並行）
   - 統合テスト
```

---

## 高度な使用例

### 例1: Mutation Testing を使用した実装

**シナリオ**: テストの品質を Mutation Testing で検証したい

**コマンド**:
```bash
/michi dev 20260115-user-auth --mutation
```

**処理内容**:
- Phase 6.5 で Mutation Testing を実行
- Mutation Score 80%以上を確認
- テストの質が低い場合は警告

---

### 例2: デザインレビューをスキップ

**シナリオ**: Backend APIの開発で、デザインレビューは不要

**コマンド**:
```bash
/michi dev 20260115-user-api --skip-design
```

**処理内容**:
- Frontend検出があってもデザインレビューをスキップ

---

### 例3: 特定のタスクのみ実装

**シナリオ**: タスク1.1とタスク2.2のみを実装したい

**コマンド**:
```bash
/michi dev 20260115-user-auth 1.1,2.2
```

**処理内容**:
- 指定されたタスクのみを実装
- 他のタスクはスキップ

---

### 例4: Gap分析を使用した既存コードベースへの追加

**シナリオ**: 既存のプロジェクトに新機能を追加したい

**ワークフロー**:
```
1-3. （要件定義、設計まで実行）

4. Gap分析
   /michi analyze-gap 20260115-new-feature

   【分析内容】
   - 既存コードベースとの差分を分析
   - 新規実装が必要な箇所を特定
   - 既存コンポーネントの活用可能箇所を提案
   - 統合ポイントを明示

5. タスク分割（Gap分析結果を反映）
   /michi create-tasks 20260115-new-feature

6. TDD実装
   /michi dev 20260115-new-feature
```

---

## まとめ

Michiスキルは、新規プロジェクト、既存プロジェクトへの追加、マルチリポジトリプロジェクトなど、様々なシナリオに対応しています。

詳細については、以下のドキュメントを参照してください：

- **command-reference.md**: 全20機能の詳細リファレンス
- **workflow-guide.md**: 開発ワークフローの全体説明
- **multi-repo-guide.md**: マルチリポジトリ開発の詳細
- **triggers.md**: 発動トリガーの一覧
