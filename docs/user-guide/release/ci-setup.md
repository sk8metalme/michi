# CI/CD設定

このドキュメントでは、michiを使用したプロジェクトでのCI/CD（継続的インテグレーション/継続的デリバリー）設定について説明します。

## michiのCI/CD方針

michiでは、**Phase Aのテスト（単体テスト、Lint、ビルド）のみをCI/CDで自動実行**します。

### CI/CDで実行されるもの

| テストタイプ | 実行タイミング | CI/CDで自動実行 |
|------------|--------------|---------------|
| 単体テスト | Phase A（PR前） | ✅ はい |
| Lint | Phase A（PR前） | ✅ はい |
| ビルド | Phase A（PR前） | ✅ はい |
| 統合テスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| E2Eテスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| パフォーマンステスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| セキュリティテスト | Phase B（リリース準備時） | ❌ いいえ（手動） |

**理由**:
- Phase Aは高速実行が必要（数分以内）
- Phase Bは時間がかかる（数十分〜数時間）
- Phase Bは本番環境に近い状態での検証が必要

## 対応CI/CDツール

michiは以下のCI/CDツールをサポートしています：

### 1. GitHub Actions（推奨）

- **対象**: GitHubホストのリポジトリ
- **メリット**: GitHubとの統合が容易、無料枠が充実
- **設定ファイル**: `.github/workflows/`

### 2. Screwdriver

- **対象**: オープンソースのCI/CDツールを使用したいプロジェクト
- **メリット**: 高いカスタマイズ性、柔軟なパイプライン設定
- **設定ファイル**: `screwdriver.yaml`


## 言語別CI/CD設定ガイド

各言語のCI/CD設定については、以下のドキュメントを参照してください:

- **[Node.js/TypeScript プロジェクト](./ci-setup-nodejs.md)**
  - GitHub Actions設定
  - Screwdriver設定
  - Phase A/Bテスト実行

- **[Java（Gradle）プロジェクト](./ci-setup-java.md)**
  - GitHub Actions設定
  - Screwdriver設定
  - Phase A/Bテスト実行

- **[PHP プロジェクト](./ci-setup-php.md)**
  - GitHub Actions設定
  - Screwdriver設定
  - Phase A/Bテスト実行

## CI/CDのベストプラクティス

### 1. キャッシュの活用

**Node.js（npm）:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Java（Gradle）:**
```yaml
- uses: actions/setup-java@v4
  with:
    cache: 'gradle'
```

**PHP（Composer）:**
```yaml
- uses: actions/cache@v3
  with:
    path: vendor
    key: ${{ runner.os }}-php-${{ hashFiles('**/composer.lock') }}
```

### 2. 並列実行（マトリックス戦略）

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### 3. タイムアウト設定

```yaml
jobs:
  test:
    timeout-minutes: 10  # 10分でタイムアウト
```

### 4. エラー時の通知

**GitHub Actions（Slack通知）:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 5. アーティファクトの保存

```yaml
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: test-results
    path: build/reports/
```


## トラブルシューティング

CI/CD設定の問題については、以下のドキュメントを参照してください:

👉 **[CI/CDトラブルシューティングガイド](./ci-setup-troubleshooting.md)**

## CI/CD設定のチェックリスト

### 初回設定時

- [ ] CI/CD設定ファイルを作成（GitHub Actions or Screwdriver）
- [ ] 単体テストが自動実行される
- [ ] Lintが自動実行される
- [ ] ビルドが自動実行される
- [ ] キャッシュが有効化されている
- [ ] マトリックス戦略で複数バージョンをテスト
- [ ] タイムアウト設定を追加
- [ ] エラー時の通知設定（任意）

### 運用時の定期確認

- [ ] CI/CDの実行時間が長くなっていないか（目標: 5分以内）
- [ ] キャッシュが効いているか
- [ ] 失敗率が高くなっていないか
- [ ] 依存パッケージが古くなっていないか

## リリースタグ作成時のCI/CD

リリースタグを作成すると、CI/CDが自動的に実行されます：

```yaml
# タグプッシュ時にも実行
on:
  push:
    tags:
      - 'v*'
```

**実行内容**:
1. 単体テスト
2. Lint
3. ビルド

**すべて成功したら、GitHub Releaseを作成**します（手動）。

詳細は [リリースフロー](./release-flow.md) を参照してください。

## 次のステップ

- [リリースフロー](./release-flow.md): リリースタグ作成からGitHub Releaseまで
- [テスト実行フロー](../testing/test-execution-flow.md): Phase A/Bの詳細

## CI/CD設定テンプレート

実際のCI/CD設定ファイルテンプレートは、以下のディレクトリに用意されています：

- GitHub Actions: `templates/ci/github-actions/`
- Screwdriver: `templates/ci/screwdriver/`

詳細は各テンプレートファイルを参照してください。
