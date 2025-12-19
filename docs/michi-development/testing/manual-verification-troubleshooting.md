# Michi 手動検証フロー - トラブルシューティング

**親ドキュメント**: [manual-verification-flow.md](./manual-verification-flow.md)

---

## トラブルシューティング

### 問題1: cc-sddのインストールが失敗する

**症状:**

```
Error: Unknown option: --cline
```

**原因:**
指定したAI開発ツール用のフラグがcc-sddに存在しない

**解決方法:**

1. cc-sddの最新版を確認: `npm info cc-sdd`
2. サポートされているフラグを確認: `npx cc-sdd@latest --help`
3. 対応していない場合は、他のツール（Cursor または Claude Code）を使用

### 問題2: Michiセットアップが既存ファイルと競合する

**症状:**

```
Warning: File already exists: .cursor/commands/michi-confluence-sync.md
```

**原因:**
既にMichiがセットアップされている、または手動で同名ファイルが作成されている

**解決方法:**

```bash
# 既存のMichiファイルを削除してから再セットアップ
rm -rf .cursor/commands/michi-*.md
michi setup-existing --cursor --lang ja
```

### 問題3: phase:run コマンドが feature を見つけられない

**症状:**

```
Error: Feature 'java-calculator-webapp' not found
```

**原因:**
`.kiro/specs/java-calculator-webapp/` ディレクトリまたは `spec.json` が存在しない

**解決方法:**

1. AIコマンドで初期化されているか確認
   ```bash
   ls -la .kiro/specs/java-calculator-webapp/spec.json
   ```
2. 存在しない場合は、AIコマンド `/kiro:spec-init` を再実行

### 問題4: validate:phase が失敗する

**症状:**

```
Error: Validation failed for phase test-type-selection
```

**原因:**
必要なファイルが生成されていない、またはフォーマットが不正

**解決方法:**

1. 該当フェーズの出力ファイルを確認
   ```bash
   cat .kiro/specs/java-calculator-webapp/test-types.md
   ```
2. ファイルが空または不正な場合は、フェーズを再実行
   ```bash
   michi phase:run java-calculator-webapp test-type-selection
   ```

### 問題5: 絶対パスコマンドが動作しない（Pattern B）

**症状:**

```
Error: Cannot find module '~/Work/git/michi/src/cli.ts'
```

**原因:**
シェルがチルダ `~` を展開していない

**解決方法:**

```bash
# チルダの代わりに $HOME を使用
npx tsx $HOME/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection

# または完全な絶対パスを使用
npx tsx /Users/yourusername/Work/git/michi/src/cli.ts phase:run java-calculator-webapp test-type-selection
```

### 問題6: 自動テストスクリプトが途中で失敗する

**症状:**
自動テストスクリプト（pre-publish または test:package）が途中でエラーで終了する

**原因:**
スクリプトは `set -e` を使用しており、最初のエラーで即座に終了する

**解決方法:**

1. エラーメッセージを確認
2. 該当するコマンドを手動で実行して詳細を確認
3. 問題を修正してから再実行

---

