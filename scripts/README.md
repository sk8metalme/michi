# scripts/ - Build and Development Tools

このディレクトリはビルドツールおよび開発ツール専用です。プロダクションコードは含めないでください。

## ディレクトリ構造

```
scripts/
├── build/              # ビルド関連スクリプト
│   ├── copy-static-assets.js    # 静的ファイルコピー
│   └── set-permissions.js       # 実行権限設定
├── dev-tools/          # 開発支援ツール
│   ├── test-interactive.ts      # 対話型テスト
│   └── mermaid-converter.ts     # Mermaid図変換ユーティリティ
├── utils/              # 共通ユーティリティ
│   ├── env-loader.js            # 環境変数読み込み
│   ├── config-loader.ts         # 設定ファイル読み込み
│   ├── safe-file-reader.ts      # 安全なファイル読み込み
│   └── ...
├── config/             # 設定ファイル・スキーマ
└── constants/          # 定数定義
```

## スクリプト分類

### Entry Points（エントリーポイント）

プロダクションコード（`src/`）へのCLIエントリーポイント。実装本体は`src/`に配置されています。

- `confluence-sync.ts` → `src/presentation/commands/confluence/`
- `jira-sync.ts` → `src/presentation/commands/jira/`
- `workflow-orchestrator.ts` → `src/presentation/commands/workflow/`
- `github-actions-client.ts` → `src/infrastructure/external-apis/github/`

**使用例:**
```bash
npm run confluence:sync <feature-name> [docType]
npm run jira:sync <feature-name>
npm run workflow:run -- --feature <feature-name>
```

### Development Tools（開発ツール）

開発・テスト支援のためのスタンドアロンツール。

- `config-global.ts` - グローバル設定ファイル作成・更新
- `pre-flight-check.ts` - 実行前環境チェック
- `validate-phase.ts` - フェーズ完了バリデーション
- `test-workflow-stages.ts` - ワークフロー新規ステージテスト
- `health-check-service.ts` - 依存サービス状態確認
- `test-execution-generator.ts` - テスト実行ファイル生成
- `test-script-runner.ts` - Multi-Repoテストスクリプト実行

**使用例:**
```bash
npm run config:global
npm run preflight
npm run validate:phase <feature-name> <phase>
npm run test:interactive
```

### Workflow Automation（ワークフロー自動化）

開発ワークフロー自動化のためのツール。

- `phase-runner.ts` - フェーズ実行オーケストレーション
- `spec-impl-workflow.ts` - spec-impl統合ワークフロー管理
- `pr-automation.ts` - GitHub PR自動作成
- `multi-project-estimate.ts` - マルチプロジェクト見積もり集計

**使用例:**
```bash
npm run phase:run -- --feature <feature-name> --phase <phase>
npm run github:create-pr
npm run multi-estimate
```

### Utilities（ユーティリティ）

変換・フォーマット処理。

- `markdown-to-confluence.ts` - Markdown → Confluence Storage Format変換

**使用例:**
```bash
npm run markdown:convert <input.md> <output.html>
```

## 重要な原則

### ❌ scripts/に配置してはいけないもの

- **プロダクションコード**: ビジネスロジック、ドメインモデル、アプリケーションサービス
  - → `src/domain/`、`src/application/`、`src/infrastructure/`、`src/presentation/` に配置
- **再利用可能なライブラリコード**: 複数の機能で使われる共通コード
  - → `src/` の適切な層に配置

### ✅ scripts/に配置すべきもの

- **ビルドツール**: コンパイル、アセットコピー、パーミッション設定など
- **開発ツール**: テストヘルパー、対話型ツール、デバッグユーティリティ
- **自動化スクリプト**: CI/CD、ワークフロー、デプロイメント
- **Entry Points**: 本体が`src/`にある機能へのCLIラッパー

## 実装ガイドライン

### 新しいスクリプトを追加する場合

1. **配置場所を決定**:
   - ビルドツール → `scripts/build/`
   - 開発ツール → `scripts/dev-tools/`
   - 共通ユーティリティ → `scripts/utils/`

2. **ファイルヘッダーを記載**:
   ```typescript
   /**
    * スクリプト名
    * 簡潔な説明（1-2行）
    */
   ```

3. **Entry Pointの場合**:
   ```typescript
   /**
    * 機能名 - Entry Point
    * The actual logic has been moved to src/path/to/implementation/
    */
   ```

4. **package.jsonにスクリプトを追加**:
   ```json
   "scripts": {
     "your-script": "tsx scripts/path/to/script.ts"
   }
   ```

### コーディング規約

- **環境変数**: `loadEnv()`を使用
- **ファイル読み込み**: `safeReadFileOrThrow()`を使用
- **設定読み込み**: `loadConfig()`を使用
- **エラーハンドリング**: 適切なエラーメッセージとexit code

## 関連ドキュメント

- [Onion Architecture設計書](../.michi/specs/onion-architecture/design.md)
- [プロジェクト構成](../.michi/steering/structure.md)
- [開発ワークフロー](../.michi/steering/workflow.md)
