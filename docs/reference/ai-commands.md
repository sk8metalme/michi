# AIコマンドリファレンス

AI駆動開発を支援するコマンドセットです。

## コマンド体系

| プレフィックス | 提供元 | 用途 |
|---------------|--------|------|
| `/kiro:*` | cc-sdd | 基本ワークフロー |
| `/michi:*` | Michi | テスト計画、品質自動化 |
| `/michi-multi-repo:*` | Michi | Multi-Repo管理 |

## cc-sdd標準コマンド

### 仕様管理

| コマンド | 機能説明 | パラメータ |
|---------|---------|----------|
| `/kiro:spec-init` | 新規仕様を初期化 | `"プロジェクト説明"` |
| `/kiro:spec-requirements` | 要件定義を作成 | `{feature}` |
| `/kiro:spec-design` | 設計書を作成 | `{feature}` |
| `/kiro:spec-tasks` | タスク分割とJIRA同期 | `{feature}` |
| `/kiro:spec-impl` | TDD実装を実行 | `{feature} [tasks]` |
| `/kiro:spec-archive` | 仕様をアーカイブ | `{feature}` |
| `/kiro:spec-status` | 仕様の状態を表示 | `{feature}` |

### 検証

| コマンド | 機能説明 | パラメータ |
|---------|---------|----------|
| `/kiro:validate-gap` | 実装ギャップを分析 | `{feature}` |
| `/kiro:validate-design` | 設計品質をレビュー | `{feature}` |
| `/kiro:validate-impl` | 実装を検証 | `{feature}` |

## Michi拡張コマンド

| コマンド | 機能説明 | パラメータ | 備考 |
|---------|---------|----------|------|
| `/michi:spec-design` | テスト計画統合設計書を作成 | `{feature}` | Phase 0.3-0.4ガイダンス付き |
| `/michi:test-planning` | テスト計画を実行 | `{feature}` | テストタイプ選択+仕様書作成 |
| `/michi:validate-design` | テスト計画レビュー | `{feature}` | テスト計画完了確認付き |
| `/michi:spec-impl` | TDD実装+品質自動化 | `{feature}` | ライセンス/バージョン監査+レビュー |
| `/michi:confluence-sync` | Confluence同期 | `{feature} {type}` | type: requirements/design |

**テストタイプ**: Unit, Integration, E2E, Performance, Security

**品質自動化内容**:
- OSSライセンスチェック
- バージョン監査
- 品質自動修正
- 自動レビュー

## Multi-Repoコマンド

| コマンド | 機能説明 | パラメータ | 備考 |
|---------|---------|----------|------|
| `/michi-multi-repo:spec-init` | Multi-Repoプロジェクト初期化 | なし | プロジェクト説明入力 |
| `/michi-multi-repo:spec-requirements` | Multi-Repo要件定義 | `{project}` | プロジェクト全体の要件 |
| `/michi-multi-repo:spec-design` | Multi-Repo設計書作成 | `{project}` | クロスリポジトリ設計 |
| `/michi-multi-repo:spec-review` | クロスリポジトリレビュー | `{project}` | API契約/データモデル整合性 |
| `/michi-multi-repo:propagate-specs` | 各リポジトリへ仕様展開 | `{project}` | 並列実行 |
| `/michi-multi-repo:impl-all` | 全リポジトリで実装実行 | `{project}` | 並列実行 |

**spec-review レビュー項目**:
- API契約の一貫性
- データモデルの整合性
- 依存関係の妥当性

## 推奨フロー

### 通常プロジェクト

```
/kiro:spec-init → /kiro:spec-requirements → /michi:spec-design
→ /michi:test-planning → /kiro:spec-tasks → /michi:spec-impl
→ /michi:confluence-sync
```

### Multi-Repoプロジェクト

```
/michi-multi-repo:spec-init → /michi-multi-repo:spec-requirements
→ /michi-multi-repo:spec-design → /michi-multi-repo:spec-review
→ /michi-multi-repo:propagate-specs → /michi-multi-repo:impl-all
```

## 関連リンク

- [ワークフローガイド](../guides/workflow.md)
- [Multi-Repoガイド](../guides/multi-repo.md)
- [Atlassian連携ガイド](../guides/atlassian-integration.md)
