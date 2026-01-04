# コードスタイルと規約

## TypeScript設定

### コンパイラオプション
- **target**: ES2022
- **module**: ESNext
- **moduleResolution**: bundler
- **strict**: true（厳格な型チェック）
- **esModuleInterop**: true
- **skipLibCheck**: true
- **forceConsistentCasingInFileNames**: true
- **declaration**: true（型定義ファイル生成）
- **sourceMap**: true

### パスエイリアス
```json
{
  "@/*": ["./src/*"],
  "@scripts/*": ["./scripts/*"],
  "@spec/*": ["./.michi/*"]
}
```

## ESLint設定

### 基本ルール
- **インデント**: 2スペース（必須）
- **行末**: Unix（LF）（必須）
- **クォート**: シングルクォート（必須）
- **セミコロン**: 必須

### TypeScript固有ルール
- **@typescript-eslint/no-explicit-any**: warn（`any`の使用を警告）
- **@typescript-eslint/no-unused-vars**: warn（未使用変数を警告、`_`プレフィックスは除外）
- **prefer-const**: error（可能な場合は`const`を使用）
- **no-case-declarations**: error

### 除外ファイル
- `dist/`
- `node_modules/`
- `*.js`
- `*.d.ts`
- `coverage/`
- `vitest.config.ts`
- `**/*.test.ts`
- `**/__tests__/**`

## Prettier設定（lint-staged）

### 対象ファイル
- **TypeScript/JavaScript**: `*.{ts,tsx,js,jsx}`
  - ESLintで修正 → Prettierでフォーマット
- **その他**: `*.{json,md,yml,yaml}`
  - Prettierでフォーマット

## 命名規則

### ファイル・ディレクトリ
- **TypeScriptファイル**: `kebab-case.ts`（例: `confluence-sync.ts`）
- **テストファイル**: `*.test.ts` または `__tests__/` ディレクトリ内
- **ディレクトリ**: `kebab-case`

### コード内
- **変数・関数**: `camelCase`
- **クラス・インターフェース**: `PascalCase`
- **定数**: `UPPER_SNAKE_CASE`
- **プライベート変数**: `_`プレフィックス（未使用警告を無視する場合）

## ドキュメント作成規約

### ドキュメント種別による記述言語
- **テンプレートファイル**: 英語で記述
- **ガイドドキュメント**: 日本語で記述
- **コード例**: 対応3言語（Node.js、Java/Gradle、PHP）を含める

### Markdownドキュメント
- **コード記述の回避**: markdownドキュメントにコードを記述することはできるだけ避ける（実コードと二重管理になる）
- **冗長表現の禁止**: 「〜することができます」→「〜できます」
- **過剰な背景説明の禁止**: 不必要な前置き、自明な内容の長い説明
- **重複記載の禁止**: 同じ情報は1箇所にのみ記載

### コードコメント
- **言語**: 日本語
- **原則**: 複雑なロジックのみコメント追加（self-documentingなコードを優先）
- **禁止**: 自明なコードコメントの転記、変数名や関数名を繰り返すだけの説明

## テスト駆動開発（TDD）

### 原則
- **RED-GREEN-REFACTORサイクル**を遵守
- **テストは仕様として扱う**: 実装に合わせてテストを変更しない
- **カバレッジ目標**: 95%以上
- **基本的にテストを修正しない**: 仕様通りのテストでない時のみテストを修正

### テストファイルの配置
- ユニットテスト: `src/__tests__/`
- 統合テスト: `src/__tests__/integration/`

## Gitコミットメッセージ

### フォーマット
```
[種別] 簡潔な説明

詳細な説明（オプション）
```

### 種別
- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント
- **style**: フォーマット
- **refactor**: リファクタリング
- **test**: テスト
- **chore**: その他

### 例
```
feat: Confluence同期機能を追加

Phase 0.1, 0.2の完了時にConfluenceページを自動作成する機能を実装
```

## セキュリティ

### 禁止事項
- **ハードコーディング禁止**: APIキー、パスワード、接続文字列、暗号化キー、個人情報
- **安全でない関数の使用禁止**: `eval()`や同等の動的コード実行
- **機密情報のログ出力禁止**: パスワード、トークンなど

### 必須対策
- 入力値検証（サーバーサイド）
- 出力値エスケープ
- 環境変数での機密情報管理（`.env`ファイル）
- HTTPSの使用
- セキュリティヘッダーの設定

## コード品質管理

### 静的解析
- **ESLint**: コード品質チェック
- **TypeScript**: 型チェック
- **マージ前に警告を解消**: 静的解析の警告はマージ前に解消

### 依存関係管理
- **定期的な脆弱性スキャン**: npm audit
- **依存ライブラリの更新**: Dependabot
- **ライセンスの確認**: ライセンス互換性チェック
