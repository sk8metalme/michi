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
3. {{SPEC_DIR}}/project.json を読み込んで表示
4. 対応するConfluenceプロジェクトページのURLを表示

## 言語処理

- {{SPEC_DIR}}/project.json から言語を読み取り
- 指定された言語ですべての出力を生成
- 言語フィールドが欠落している場合は英語をデフォルトとする
