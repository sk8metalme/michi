# Shared Layer (共有層)

## 責務

複数の層で共通利用されるユーティリティや型定義を提供する層。

## 配置するもの

- **Types**: 共通型定義
  - 例: `Result<T, E>`, `ValidationResult`
- **Utils**: 汎用ユーティリティ関数
  - 例: `StringUtils`, `DateUtils`, `ArrayUtils`
- **Errors**: 共通エラー型
  - 例: `ApplicationError`, `ValidationError`
- **Logger**: ロギング機能
  - 例: `Logger`, `LogLevel`

## 依存関係ルール

- ✅ **依存可能**: なし（外部依存最小限）
- ❌ **依存禁止**: Domain、Application、Infrastructure、Presentation層
- ⚠️ **外部ライブラリ**: 必要最小限のみ（型定義パッケージ等）

## ディレクトリ構造

```
shared/
├── types/            # 共通型定義
├── utils/            # 汎用ユーティリティ
├── errors/           # 共通エラー型
└── logger/           # ロギング
```

## 実装ガイドライン

1. **ドメイン非依存**: ビジネスロジックに依存しない汎用機能のみ
2. **再利用性**: どの層からも安全に利用可能
3. **Pure Functions**: 副作用のない純粋関数を推奨
4. **最小限**: 本当に共有が必要なもののみ配置
