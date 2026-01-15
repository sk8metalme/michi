---
name: /michi:switch-pj
description: プロジェクト間の切り替え（Michi固有機能）
---

# プロジェクト切り替えコマンド

> **Michi 固有機能**: このコマンドは Michi 独自の機能です。base コマンドには含まれません。
>
> マルチプロジェクト環境で、異なるプロジェクト間を切り替えるための機能です。

## 開発ガイドライン

{{DEV_GUIDELINES}}

---

## 変数定義

- `{{MICHI_DIR}}` = `.michi/` （プロジェクト内）
  - プロジェクトメタデータ: `{{MICHI_DIR}}/pj/`
- `{{MICHI_GLOBAL_DIR}}` = `~/.michi/` （グローバル）
  - 共通設定: `{{MICHI_GLOBAL_DIR}}/settings/`

**パス解釈の注意点:**
- このコマンドは `{{MICHI_DIR}}/pj/` のプロジェクトメタデータを読み込む
- グローバル設定（`{{MICHI_GLOBAL_DIR}}/settings/`）は通常参照しない

---

## 使用方法

```
/michi:switch-pj <project_id>
```

**パラメータ**:
- `project_id`: プロジェクトID（例: customer-a-service-1, michi）

**例**:
```
/michi:switch-pj michi
/michi:switch-pj customer-a-service-1
```

## 実行手順

1. プロジェクトIDに対応するGitHubリポジトリを特定
2. ローカルにクローン（未クローンの場合）またはチェックアウト
3. {{MICHI_DIR}}/pj/$1/project.json を読み込んで表示

## 言語設定

- すべての出力は日本語で生成する
