# Build Scripts (ビルドスクリプト)

## 目的

プロダクションビルドに必要なスクリプトを配置。

## 配置するもの

- **copy-static-assets.js**: 静的ファイルのコピー
  - `.kiro/settings/` 配下のテンプレートファイル
  - その他のビルド時に必要な静的アセット
- **set-permissions.js**: 実行権限の設定
  - ビルド成果物の権限設定

## 実行タイミング

- `npm run build` 実行時
- `npm run postbuild` 実行時

## 注意事項

- このディレクトリにはビルドに関連するスクリプトのみを配置
- プロダクションコードは `src/` 配下に配置
- 開発ツールは `scripts/dev-tools/` に配置
