# Michi cc-sdd-overrides

このディレクトリは、cc-sddツールが生成する汎用テンプレートに対する、Michi固有のカスタマイズを管理します。

## 目的

- **問題**: cc-ssdが生成する`.kiro/settings/`はGit管理外だが、Michi固有のカスタマイズ（日本語、Phase A/B、JIRA/Confluence連携）が必要
- **解決**: Michi固有の差分をこのディレクトリで管理し、`setup-existing`実行時に適用

## ディレクトリ構造

```
cc-sdd-overrides/
└── settings/
    └── templates/
        └── specs/
            ├── tasks.md   # Michi固有のタスクテンプレート
            └── init.json  # 日本語デフォルト設定
```

## Michi固有の要素

### tasks.md
- 日本語で記述
- Michiワークフロー（Phase 0.1-0.4, Phase 1-5, Phase A, Phase B）
- JIRA連携（ラベル: `spec-init`, `requirements`, `design`, `phase-a`, `phase-b`等）
- Confluence連携（リリース手順書、完了報告）
- `michi-cli`コマンド参照

### init.json
- `"language": "ja"` - 日本語をデフォルト言語として設定

## 適用タイミング

`setup-existing`コマンド実行時、以下の順序で処理：

1. cc-ssdが汎用テンプレートを生成 → `.kiro/settings/`
2. Michiがオーバーライドを適用 ← `templates/michi/cc-sdd-overrides/`

結果として、`.kiro/settings/templates/specs/tasks.md`がMichi固有版に上書きされます。

## Git管理

- このディレクトリ（`templates/michi/cc-sdd-overrides/`）: **Git管理対象**
- 生成先（`.kiro/settings/`）: **Git管理外**（`.gitignore`に含まれる）

## 参考

- [cc-sdd公式リポジトリ](https://github.com/gotalab/cc-sdd)
- [setup-existingコマンド実装](../../src/commands/setup-existing.ts)
