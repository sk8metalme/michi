# Presentation Layer (プレゼンテーション層)

## 責務

ユーザーインターフェース（CLI）を提供し、入力を受け取り、結果を表示する層。

## 配置するもの

- **CLI**: コマンドライン処理
  - `cli.ts`: コマンド登録とグローバルオプション
- **Commands**: コマンドハンドラー
  - `init/`, `spec/`, `jira/`, `confluence/`, `multi-repo/`
- **Formatters**: 出力フォーマット
  - 例: `OutputFormatter`, `ErrorFormatter`, `ProgressFormatter`
- **Interactive**: 対話型UI
  - 例: `Prompts`, `Confirmation`, `Selection`
- **Validators**: 入力検証（プレゼンテーション層固有）
  - CLIパラメータの形式検証のみ（ビジネスルールはDomain層）

## 依存関係ルール

- ✅ **依存可能**: Application層、Domain層
- ❌ **依存禁止**: Infrastructure層（Application層経由で利用）
- ✅ **外部ライブラリ**: CLI関連ライブラリ（commander、inquirer等）

## ディレクトリ構造

```
presentation/
├── cli.ts            # CLIエントリーポイント
├── commands/         # コマンドハンドラー
│   ├── init/         # init コマンド
│   ├── spec/         # spec-* コマンド群
│   ├── jira/         # jira-sync コマンド
│   ├── confluence/   # confluence-sync コマンド
│   └── multi-repo/   # multi-repo-* コマンド群
├── formatters/       # 出力フォーマッター
├── interactive/      # 対話型UI
└── validators/       # 入力検証
```

## 実装ガイドライン

1. **薄い層**: ビジネスロジックは持たず、Application層に委譲
2. **入力変換**: CLI入力をDTOに変換してApplication層に渡す
3. **出力整形**: Application層の結果を整形してユーザーに表示
4. **エラー表示**: ユーザーフレンドリーなエラーメッセージ
