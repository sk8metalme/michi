# テスト戦略

このドキュメントでは、michiを使用したプロジェクトでの総合的なテスト戦略について説明します。

## michiのテスト方針

michiは、テスト駆動開発（TDD）と段階的なテスト実行（Phase A/B）を組み合わせたテスト戦略を採用しています。

### 基本原則

1. **テストファーストアプローチ**: コードを書く前にテストを書く（TDD）
2. **段階的テスト実行**: PR前（Phase A）とリリース前（Phase B）で異なるテストを実行
3. **自動化の推進**: Phase Aは完全自動化、Phase Bは計画的な手動実行
4. **マスタテスト管理**: テストは常に最新の仕様を反映

## テスト実行の2つのフェーズ

| フェーズ | タイミング | 実行方式 | テストタイプ |
|---------|----------|---------|------------|
| **Phase A** | PR作成前 | CI/CD自動実行 | 単体テスト、Lint、ビルド |
| **Phase B** | リリース準備時 | 手動実行 | 統合テスト、E2E、パフォーマンス、セキュリティ |

詳細は [テスト実行フロー](./testing/test-execution-flow.md) を参照してください。

## テスト計画から実行までの流れ

```text
Phase -1: テストタイプ選択
    ↓
Phase 0-1〜0-5: テスト計画
    ↓
Phase A: PR前の自動テスト（CI/CD）
    ↓
Phase B: リリース前の手動テスト
    ↓
リリース
```

### 各フェーズの詳細ドキュメント

- **Phase -1〜0-5（テスト計画）**: [テスト計画フロー](./testing/test-planning-flow.md)
- **TDD実践方法**: [TDDサイクル](./testing/tdd-cycle.md)
- **Phase A/B実行**: [テスト実行フロー](./testing/test-execution-flow.md)
- **テスト失敗時**: [テスト失敗時の対応](./testing/test-failure-handling.md)

## テストタイプと選択基準

| テストタイプ | 必須/任意 | 実行フェーズ | 選択基準 |
|------------|---------|------------|---------|
| 単体テスト | **必須** | Phase A | すべてのプロジェクト |
| 統合テスト | **推奨** | Phase B | 複数コンポーネントが連携 |
| E2Eテスト | **推奨** | Phase B | UIを持つアプリケーション |
| パフォーマンステスト | 任意 | Phase B | 高負荷・レスポンスタイム重要 |
| セキュリティテスト | 任意 | Phase B | 機密データ・外部公開API |

### テスト仕様書テンプレート

各テストタイプの仕様書テンプレートを用意しています：

- [単体テスト仕様書テンプレート](./templates/test-specs/unit-test-spec-template.md)
- [統合テスト仕様書テンプレート](./templates/test-specs/integration-test-spec-template.md)
- [E2Eテスト仕様書テンプレート](./templates/test-specs/e2e-test-spec-template.md)
- [パフォーマンステスト仕様書テンプレート](./templates/test-specs/performance-test-spec-template.md)
- [セキュリティテスト仕様書テンプレート](./templates/test-specs/security-test-spec-template.md)

## 対応言語とツール

### Node.js / TypeScript
- テストフレームワーク: Vitest
- Lint: ESLint
- ビルド: tsc

### Java
- テストフレームワーク: JUnit 5
- ビルドツール: Gradle
- Lint: Checkstyle

### PHP
- テストフレームワーク: PHPUnit
- Lint: PHPStan
- パッケージ管理: Composer

## CI/CD連携

Phase Aのテスト（単体テスト、Lint、ビルド）は、以下のCI/CDツールで自動実行されます：

- GitHub Actions
- Screwdriver

詳細は [CI/CD設定](./release/ci-setup.md) を参照してください。

## リリースフロー

```text
[開発完了]
    ↓
Phase A: 単体テスト + Lint + ビルド（自動）
    ↓
[PR作成・レビュー・マージ]
    ↓
Phase B: 統合 + E2E + その他（手動）
    ↓
[リリースタグ作成]
    ↓
CI/CD実行（自動）
    ↓
[GitHub Release作成]
```

詳細は [リリースフロー](./release/release-flow.md) を参照してください。

## クイックスタートガイド

### 1. 新規プロジェクトでmichiを導入する場合

1. [テスト計画フロー](./testing/test-planning-flow.md) でテストタイプを選択
2. テスト仕様書テンプレートを使用してテスト計画を作成
3. [TDDサイクル](./testing/tdd-cycle.md) に従ってテストコードを実装
4. [CI/CD設定](./release/ci-setup.md) でPhase Aを自動化
5. [テスト実行フロー](./testing/test-execution-flow.md) に従って開発

### 2. 既存プロジェクトにmichiを導入する場合

1. 既存のテストをmichiのディレクトリ構造に移行
2. Phase A（単体テスト）から段階的に自動化
3. CI/CD設定を追加
4. Phase B（統合テスト等）を計画的に追加

## よくある質問

### Q1: Phase Bのテストは毎回実行する必要がありますか？

A: Phase Bはリリース前のみ実行します。毎PRで実行する必要はありません。

### Q2: テストカバレッジの目標は？

A: 単体テストで95%以上を推奨します。最低でも80%以上を目指してください。

### Q3: パフォーマンステストやセキュリティテストは必須ですか？

A: 必須ではありません。プロジェクトの要件に応じて選択してください。

### Q4: Phase Bで問題が見つかったらどうすれば？

A: バグ修正のPRを作成し、Phase Aを通過させてからマージ、Phase Bを再実行します。

## 関連ドキュメント

### テスト関連
- [テスト計画フロー](./testing/test-planning-flow.md) - Phase -1〜0-5
- [TDDサイクル](./testing/tdd-cycle.md) - RED-GREEN-REFACTOR
- [テスト実行フロー](./testing/test-execution-flow.md) - Phase A/B
- [テスト失敗時の対応](./testing/test-failure-handling.md) - トラブルシューティング

### リリース関連
- [リリースフロー](./release/release-flow.md) - タグ作成からリリースまで
- [CI/CD設定](./release/ci-setup.md) - GitHub Actions/Screwdriver

### テンプレート
- [テスト仕様書テンプレート](./templates/test-specs/) - 各テストタイプ
