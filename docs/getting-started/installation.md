# インストール

Michiをインストールする3つの方法を説明します。

## 前提条件

- **Node.js**: 20.0.0以上
- **npm**: 10.0.0以上

バージョン確認：

```bash
node --version
npm --version
```

## 推奨：npmグローバルインストール

最も推奨される方法です。`michi` コマンドがグローバルに利用可能になります。

```bash
npm install -g @sk8metal/michi-cli
```

インストール確認：

```bash
michi --version
```

## npx実行（常に最新版）

インストールせずに、常に最新版を実行できます。

```bash
npx @sk8metal/michi-cli init
```

**利点**: 常に最新版を使用
**欠点**: 実行のたびにダウンロードが発生する可能性がある

## アップデート

グローバルインストールしたMichiをアップデート：

```bash
npm update -g @sk8metal/michi-cli
```

## アンインストール

```bash
npm uninstall -g @sk8metal/michi-cli
```

## 次のステップ

- [クイックスタート](quick-start.md) - 5分で始める
- [環境設定](configuration.md) - 詳細な環境設定
