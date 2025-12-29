# GitHub Org ワークフロー配布スクリプト計画

## 概要

**Issue**: https://github.com/sk8metalme/review-dojo/issues/20

GitHub Organization配下のリポジトリに `trigger-knowledge-collection.yml` ワークフローファイルを配布するスクリプトを作成する。

## 要件

### 機能要件
1. **対象リポジトリの取得**: GitHub Org配下の全リポジトリを一覧取得
2. **除外対象**: knowledgeリポジトリ（`review-dojo-knowledge`）は除外
3. **PR作成**: mainブランチへ直接コミットせず、PRを作成する
4. **ワークフロー配布**: `trigger-knowledge-collection.yml` を各リポジトリの `.github/workflows/` に配置

### 非機能要件
1. **認証**: `ORG_GITHUB_TOKEN` を使用（Organization全体へのアクセス権限必要）
2. **冪等性**: 既にワークフローが存在する場合はスキップまたは更新
3. **ログ出力**: 処理結果を明確に表示

## 配布対象ワークフロー

```yaml
# trigger-knowledge-collection.yml
# PRがマージされた際にknowledgeリポジトリへ通知を送信
# - peter-evans/repository-dispatch を使用
# - イベントタイプ: pr-merged
# - ペイロード: PR URL, 番号, リポジトリ情報, マージ者情報
```

## 設計

### アーキテクチャ

```
distribute-workflow.ts
├── 1. GitHub API クライアント初期化
├── 2. Org配下のリポジトリ一覧取得
├── 3. フィルタリング（knowledge除外）
├── 4. 各リポジトリに対してループ
│   ├── 4.1 feature branchの作成
│   ├── 4.2 ワークフローファイルの追加
│   ├── 4.3 PRの作成
│   └── 4.4 結果のログ出力
└── 5. サマリー出力
```

### 技術選定

| 項目 | 選択 | 理由 |
|------|------|------|
| 言語 | TypeScript | michiプロジェクトとの一貫性 |
| GitHub API | @octokit/rest | 既存依存パッケージ |
| 実行方法 | npx tsx scripts/... | michiの既存パターン踏襲 |

### ファイル構成

```
scripts/
└── distribute-workflow.ts    # メインスクリプト

templates/
└── workflows/
    └── trigger-knowledge-collection.yml  # 配布対象テンプレート
```

## 実装タスク

### Phase 1: 基盤準備
- [ ] Task 1.1: ワークフローテンプレートファイルの作成
- [ ] Task 1.2: 配布スクリプトの雛形作成

### Phase 2: コア機能実装
- [ ] Task 2.1: GitHub API接続・リポジトリ一覧取得機能
- [ ] Task 2.2: リポジトリフィルタリング機能（knowledge除外）
- [ ] Task 2.3: ブランチ作成・ファイル追加機能
- [ ] Task 2.4: PR作成機能

### Phase 3: 完成・テスト
- [ ] Task 3.1: エラーハンドリング・ログ出力の整備
- [ ] Task 3.2: ドライランモードの追加
- [ ] Task 3.3: README/使用方法ドキュメント

## CLI インターフェース

```bash
# ドライラン（実際には実行しない）
npx tsx scripts/distribute-workflow.ts --org sk8metalme --dry-run

# 実行
npx tsx scripts/distribute-workflow.ts --org sk8metalme

# 特定リポジトリのみ
npx tsx scripts/distribute-workflow.ts --org sk8metalme --repos repo1,repo2
```

### オプション

| オプション | 説明 | デフォルト |
|------------|------|------------|
| `--org` | GitHub Organization名 | 必須 |
| `--dry-run` | 実際に変更せずプレビュー | false |
| `--repos` | 対象リポジトリ（カンマ区切り） | 全て |
| `--exclude` | 除外リポジトリ | knowledge系 |
| `--branch` | PR用ブランチ名 | `add-knowledge-trigger-workflow` |

## 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `ORG_GITHUB_TOKEN` | Organization権限付きPAT | ✅ |

## リスク・考慮事項

1. **API レート制限**: 大量リポジトリがある場合、レート制限に注意
2. **既存ワークフロー**: 既にファイルが存在する場合の挙動を定義
3. **権限エラー**: リポジトリごとの権限差異でエラーが発生する可能性

## 次のステップ

1. この計画のレビュー・承認
2. Phase 1 から順次実装
3. ドライランでテスト
4. 本番実行
