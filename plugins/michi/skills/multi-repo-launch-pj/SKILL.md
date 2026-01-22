---
name: multi-repo-launch-pj
description: |
  マルチリポジトリプロジェクト初期化スキル

  複数リポジトリにまたがるプロジェクトを初期化します。

trigger_keywords:
  - "マルチリポジトリプロジェクト"
  - "複数リポジトリ"
  - "マルチリポ"
  - "multi-repo-launch-pj"
---

# multi-repo-launch-pj: マルチリポジトリプロジェクト初期化

マルチリポジトリプロジェクト初期化スキルは、複数のリポジトリにまたがるプロジェクトを初期化します。

## 概要

このスキルは以下を実行します：

1. **プロジェクト初期化**: 統合仕様を管理するプロジェクトを作成
2. **リポジトリリスト作成**: 対象リポジトリのリストを作成
3. **メタデータ作成**: `templates/multi-repo/project.json` から初期化

## 使用方法

### 明示的発動

```bash
/michi-multi-repo launch-pj "プロジェクト説明"
```

**例**:
```bash
/michi-multi-repo launch-pj "EC Platform"
```

## 実行内容

### 1. プロジェクト初期化

`templates/multi-repo/project.json` から初期化します：

```json
{
  "name": "ec-platform",
  "fullName": "20260117-ec-platform",
  "description": "EC Platform",
  "type": "multi-repo",
  "repositories": [
    "frontend-web",
    "backend-api",
    "mobile-app"
  ],
  "phase": "initialized"
}
```

### 2. ディレクトリ構造作成

```
.michi/pj/YYYYMMDD-{pj-name}/
docs/michi/YYYYMMDD-{pj-name}/
├── spec/
│   ├── requirements.md
│   ├── architecture.md
│   └── sequence.md
└── test-plan/
```

## 次のステップ

初期化が完了したら、統合要件定義を作成します。

```bash
/michi-multi-repo create-requirements {pj-name}
```

## 参照

- **マルチリポガイド**: `../references/multi-repo-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**次のスキル**: `multi-repo-create-requirements` - 統合要件定義
