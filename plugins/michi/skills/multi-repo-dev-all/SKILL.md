---
name: multi-repo-dev-all
description: |
  全リポジトリ並行実装スキル

  複数リポジトリで並行してTDD実装を行い、依存関係を考慮した実行順序で実装します。

trigger_keywords:
  - "全リポジトリ実装"
  - "並行実装"
  - "multi-repo-dev-all"
---

# multi-repo-dev-all: 全リポジトリ並行実装

複数リポジトリで並行してTDD実装を行い、依存関係を考慮した実行順序で実装します。

## 概要

1. **依存関係分析**: リポジトリ間の依存を分析
2. **実行順序決定**: トポロジカルソートで順序を決定
3. **並行実装**: 依存のないリポジトリは並行実行

## 使用方法

```bash
/michi-multi-repo dev-all {pj-name}
```

## サブエージェント活用（Plan + general-purpose）

複数リポジトリの並行実装を**general-purposeエージェント**で実行します：

### Phase 1: 依存関係分析（Plan）

Planエージェントで各リポジトリの依存関係を分析：
- トポロジカルソートで実行順序を決定
- 並行実行可能なリポジトリを特定

**例**:
```
backend-api: 依存なし → Phase 1で実装
frontend-web: backend-api に依存 → Phase 2で実装
mobile-app: backend-api に依存 → Phase 2で実装
```

### Phase 2: 並行TDD実装（general-purpose x N）

依存関係のないリポジトリは並行してgeneral-purposeエージェントを起動：
- 各エージェントがdevスキル相当の処理を実行
- TDD実装（Red-Green-Refactor）
- カバレッジ確認
- PR作成

**並行実行例**:
```
Phase 1: backend-api を実装（general-purpose x 1）
Phase 2: frontend-web と mobile-app を並行実装（general-purpose x 2）
```

### Phase 3: 統合確認（メインエージェント）

- すべてのリポジトリのPRを確認
- クロスリポジトリテストを実行

**general-purposeエージェント活用のメリット**:
- 各リポジトリで独立したTDD実装が可能
- 並行実行で全体の開発時間を短縮
- 各エージェントが完全な開発権限を持つ

**Planエージェント活用のメリット**:
- 依存関係の正確な分析
- 実行順序の最適化
- 並行実行タイミングの最適化

---

## 実行内容

### 依存関係分析

```
backend-api: 依存なし
frontend-web: backend-api に依存
mobile-app: backend-api に依存
```

### 実行順序

```
Phase 1: backend-api を実装
Phase 2: frontend-web と mobile-app を並行実装
```

### 並行実装

各リポジトリで以下を実行：
1. ブランチ作成
2. TDD実装（Red-Green-Refactor）
3. テスト実行
4. カバレッジ確認（95%以上）
5. コミット・PR作成

## 完了条件

- すべてのリポジトリで実装完了
- すべてのテストが合格
- カバレッジ95%以上
- クロスリポジトリ整合性確認

## 次のステップ

全リポジトリの実装が完了したら、統合テストを実行します。

```bash
# 統合テスト実行
npm run test:integration

# アーカイブ
/michi archive-pj {pj-name}
```

## 参照

- **マルチリポガイド**: `../references/multi-repo-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**: `archive-pj` - プロジェクトアーカイブ（完了時）
