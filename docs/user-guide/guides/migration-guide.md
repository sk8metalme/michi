# Michi マイグレーションガイド

このドキュメントは、Michi の異なるバージョン間での移行手順を説明します。

---

## v0.8.6 → v0.8.7 (Unreleased)

### 重要な変更点

#### 1. Multi-Repo AIコマンド名の変更

**変更内容**:
- `/michi_multi_repo:*` → `/michi-multi-repo:*`

**影響を受けるコマンド**:

| 旧コマンド | 新コマンド |
|-----------|-----------|
| `/michi_multi_repo:spec-init` | `/michi-multi-repo:spec-init` |
| `/michi_multi_repo:spec-requirements` | `/michi-multi-repo:spec-requirements` |
| `/michi_multi_repo:spec-design` | `/michi-multi-repo:spec-design` |

**移行手順**:
1. スクリプトやドキュメントで `/michi_multi_repo:` を使用している箇所を `/michi-multi-repo:` に置換してください
2. 特に以下のファイルを確認:
   - プロジェクトの README.md
   - 開発ドキュメント
   - 自動化スクリプト

#### 2. コマンド配布先の修正

**変更内容**:
- `michi init` コマンドが作成するディレクトリ構造が変更されました

**変更前**:
```
.claude/commands/kiro/
├── kiro/              # 二重ネスト（バグ）
├── michi/
└── michi_multi_repo/
```

**変更後**:
```
.claude/commands/
├── kiro/              # 正しい階層
├── michi/
└── michi-multi-repo/
```

**移行手順**:

##### 既存プロジェクトの場合

1. **二重ネストディレクトリの削除**:
   ```bash
   # プロジェクトルートで実行
   rm -rf .claude/commands/kiro/kiro
   rm -rf .claude/commands/kiro/michi
   rm -rf .claude/commands/kiro/michi_multi_repo
   ```

2. **新しい構造でコマンドを再配置**:
   ```bash
   # michi init を再実行（上書き確認なし）
   michi init --claude
   ```

3. **確認**:
   ```bash
   ls -la .claude/commands/
   # 以下が表示されること:
   # - kiro/
   # - michi/
   # - michi-multi-repo/
   ```

##### 新規プロジェクトの場合

v0.8.7 以降では、`michi init` を実行すると自動的に正しい構造が作成されます。

```bash
michi init --claude
```

### その他の変更点

#### `michi config:init` コマンドの参照を修正

**問題**:
- spec-init.md のエラーメッセージで `michi config:init` コマンドが参照されていましたが、このコマンドは実装されていませんでした

**修正内容**:
- `michi config:init` → `michi init`

**影響**:
- エラーメッセージで正しいコマンドが案内されるようになりました

---

## トラブルシューティング

### Q1: 既存の `.claude/commands/kiro/kiro/` が残っている

**回答**: 手動で削除してください:
```bash
rm -rf .claude/commands/kiro/kiro
```

### Q2: `/michi_multi_repo:*` コマンドが認識されなくなった

**回答**: v0.8.7 では `/michi-multi-repo:*` に変更されました。新しいコマンド名を使用してください。

### Q3: `michi init` を実行してもコマンドがコピーされない

**回答**:
1. Michi を最新版（v0.8.7以降）にアップデートしてください:
   ```bash
   npm install -g michi-cli@latest
   ```

2. 再度 `michi init --claude` を実行してください

### Q4: 二重ネストディレクトリが残っているとどうなる?

**回答**:
- 機能的な問題はありませんが、混乱を招く可能性があります
- 新しい構造（`.claude/commands/kiro/`）が優先されます
- クリーンな状態にするため、削除を推奨します

---

## 参考リンク

- [Multi-Repo管理ガイド](multi-repo-guide.md)
- [CHANGELOG](../../../CHANGELOG.md)
- [README](../../../README.md)
