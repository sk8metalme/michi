# Infrastructure Layer (インフラストラクチャ層)

## 責務

外部システムとの統合、データ永続化、技術的詳細の実装を担う層。

## 配置するもの

- **External APIs**: 外部API統合
  - JIRA: `atlassian/jira/client.ts`, `sync-service.ts`
  - Confluence: `atlassian/confluence/client.ts`
  - GitHub: `github/client.ts`, `pr-service.ts`
- **Filesystem**: ファイルシステム操作
  - 例: `SpecRepositoryImpl`, `ProjectAnalyzer`
- **Parsers**: データ解析
  - 例: `MarkdownParser`, `JsonParser`, `YamlParser`
- **Config**: 設定管理
  - 例: `ConfigLoader`, `EnvLoader`
- **Repositories**: リポジトリ実装
  - Domain層のインターフェースを実装

## 依存関係ルール

- ✅ **依存可能**: Domain層、Application層のインターフェース
- ❌ **依存禁止**: Presentation層
- ✅ **外部ライブラリ**: Node.js API、npm パッケージの利用可

## ディレクトリ構造

```
infrastructure/
├── external-apis/     # 外部API統合
│   ├── atlassian/     # Atlassian (JIRA, Confluence)
│   └── github/        # GitHub
├── filesystem/        # ファイルシステム操作
├── parsers/          # データ解析
├── config/           # 設定管理
└── repositories/     # リポジトリ実装
```

## 実装ガイドライン

1. **インターフェース実装**: Application層のインターフェースを実装
2. **エラーハンドリング**: 外部エラーをドメインエラーに変換
3. **リトライ・タイムアウト**: 外部API呼び出しには適切な制御を実装
4. **設定外部化**: ハードコーディングせず設定ファイル・環境変数を利用
