# Multi-Repoガイド

複数リポジトリにまたがるプロジェクトを一元管理します。

## Multi-Repoとは

**特徴**:
- 複数リポジトリの仕様書を一元管理
- CI/CD結果の集約表示
- クロスリポジトリのテスト実行
- Confluenceへの統合同期

## プロジェクト管理

### 初期化

```bash
michi multi-repo:init my-project --jira MYPROJ --confluence-space MYPROJ
```

### リポジトリ追加

```bash
michi multi-repo:add-repo my-project \
  --name frontend \
  --url https://github.com/myorg/frontend.git \
  --branch main
```

### 一覧表示

```bash
michi multi-repo:list
```

## Confluence同期

```bash
michi multi-repo:sync my-project
michi multi-repo:confluence-sync my-project --doc-type requirements
```

**ドキュメントタイプ**:
- requirements, architecture, sequence
- strategy, ci-status, release-notes

## CI結果の集約

```bash
michi multi-repo:ci-status my-project
michi multi-repo:ci-status my-project --diff
```

## テスト実行

```bash
michi multi-repo:test my-project --type e2e
michi multi-repo:test my-project --type integration
michi multi-repo:test my-project --type performance
```

## AIコマンド

Multi-Repo専用のAIコマンドが利用できます。

```
/michi-multi-repo:spec-init
/michi-multi-repo:spec-requirements my-project
/michi-multi-repo:spec-design my-project
/michi-multi-repo:spec-review my-project
/michi-multi-repo:propagate-specs my-project
/michi-multi-repo:impl-all my-project
```

各コマンドの詳細な機能説明とパラメータについては、[AIコマンドリファレンス](../reference/ai-commands.md#multi-repoコマンド) を参照してください。

## ベストプラクティス

**リポジトリ分割**:
- マイクロサービス単位で分割
- 独立デプロイ可能な単位で分割
- 過度に細かい分割は避ける

**CI/CD戦略**:
- 各リポジトリで独立パイプライン
- Multi-Repoレベルで統合テスト
- CI結果を定期的に集約

**バージョン管理**:
- セマンティックバージョニング統一
- 互換性を明記
- 依存関係を `multi-repo.md` に記載

## トラブルシューティング

### リポジトリが追加できない

```bash
michi multi-repo:list
cat .michi/config.json
```

### CI結果が取得できない

- GitHub APIトークンに `repo` 権限が必要
- リポジトリURLを確認

### テスト実行が失敗

- `docs/michi/{project}/tests/scripts/` にスクリプト配置
- 実行権限を付与（`chmod +x`）

## 関連リンク

- [Atlassian連携ガイド](atlassian-integration.md)
- [ワークフローガイド](workflow.md)
- [AIコマンドリファレンス](../reference/ai-commands.md)
