# Michiへのコントリビューション

Michiへのコントリビューションに興味を持っていただき、ありがとうございます！

このドキュメントでは、Michiプロジェクトに貢献する方法を説明します。

## 目次

- [はじめに](#はじめに)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [コーディング規約](#コーディング規約)
- [PRの作成](#prの作成)
- [イシューの報告](#イシューの報告)
- [コミュニティガイドライン](#コミュニティガイドライン)

## はじめに

Michiは、AI駆動開発ワークフロー自動化プラットフォームです。以下のような貢献を歓迎します：

- **バグ報告**: 問題を発見した場合は、issueを作成してください
- **機能提案**: 新機能のアイデアがあれば、issueで提案してください
- **ドキュメント改善**: ドキュメントの誤りや改善案を提案してください
- **コード貢献**: バグ修正や機能実装のPRを送ってください

## 開発環境のセットアップ

詳細なセットアップ手順は、[開発環境セットアップガイド](./docs/contributing/development.md)を参照してください。

### クイックスタート

```bash
# リポジトリをフォーク・クローン
git clone https://github.com/YOUR_USERNAME/michi
cd michi

# 依存関係のインストール
npm install

# テスト実行
npm run test:run

# リント実行
npm run lint

# ビルド
npm run build
```

## コーディング規約

### TypeScript

- **Strict Mode**: 厳格な型チェックを有効化
- **ESLint**: すべてのコードはESLintルールに準拠
- **Prettier**: コードフォーマットは自動化
- **テストカバレッジ**: 95%以上を目標

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/)形式を使用：

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: ビルドプロセス変更
```

**例:**
```
feat(confluence): Confluence階層構造のカスタマイズ機能を追加

Closes #123
```

### コーディングスタイル

- **変数名**: camelCase
- **クラス名**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **ファイル名**: kebab-case.ts
- **関数**: 単一責任原則に従う
- **コメント**: 複雑なロジックには説明を追加

## PRの作成

### PR作成前のチェックリスト

- [ ] すべてのテストがパス (`npm run test:run`)
- [ ] カバレッジが95%以上 (`npm run test:coverage`)
- [ ] ESLintエラーが0件 (`npm run lint`)
- [ ] TypeScript型エラーが0件 (`npm run type-check`)
- [ ] コミットメッセージがConventional Commits形式
- [ ] ドキュメントを更新（必要に応じて）
- [ ] CHANGELOG.mdを更新（必要に応じて）

### PRの作成手順

1. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **変更を実装・テスト**
   ```bash
   npm test
   npm run lint
   ```

3. **コミット**
   ```bash
   git add .
   git commit -m "feat: 機能の説明"
   ```

4. **プッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **PRを作成**
   ```bash
   gh pr create --title "feat: 機能の説明" --body "詳細な説明"
   ```

### PRテンプレート

```markdown
## 概要
何を実装したか簡潔に説明

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] 単体テスト追加
- [ ] E2Eテスト追加（必要に応じて）
- [ ] 手動テスト実施

## チェックリスト
- [ ] テストがパス
- [ ] カバレッジ95%以上
- [ ] ESLintエラー0件
- [ ] ドキュメント更新

## 関連Issue
Closes #123
```

## イシューの報告

### バグ報告

バグを発見した場合は、以下の情報を含めてissueを作成してください：

```markdown
## バグの説明
簡潔にバグを説明してください

## 再現手順
1. xxx を実行
2. yyy を確認
3. エラーが発生

## 期待される動作
どのように動作すべきか

## 実際の動作
実際にどう動作したか

## 環境
- OS: macOS 14.0
- Node.js: 20.10.0
- Michi: 0.0.5
```

### 機能提案

新機能のアイデアがあれば、以下の情報を含めてissueを作成してください：

```markdown
## 機能の説明
提案する機能を簡潔に説明してください

## モチベーション
なぜこの機能が必要か

## 詳細な設計案（オプション）
実装方法のアイデア

## 代替案（オプション）
他に考えられる実装方法
```

## コミュニティガイドライン

### 行動規範

- **尊重**: すべての参加者を尊重してください
- **建設的**: フィードバックは建設的に行ってください
- **協力的**: オープンなコミュニケーションを心がけてください
- **包括的**: 多様性を尊重してください

### コミュニケーション

- **issue**: バグ報告や機能提案
- **PR**: コードの変更提案
- **Discussions**: 一般的な質問や議論

## リリース手順

リリース手順については、[リリースガイド](./docs/contributing/release.md)を参照してください。

## 参考リンク

- [開発環境セットアップ](./docs/contributing/development.md)
- [リリース手順](./docs/contributing/release.md)
- [CI/CD設定](./docs/contributing/ci-cd.md)
- [ドキュメント構造](./docs/README.md)

## 質問がある場合

質問がある場合は、issueを作成するか、[Discussions](https://github.com/sk8metalme/michi/discussions)で質問してください。

---

あなたのコントリビューションを楽しみにしています！ 🚀
