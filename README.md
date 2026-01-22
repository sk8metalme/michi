# Michi (道)

**M**anaged **I**ntelligent **C**omprehensive **H**ub for **I**ntegration

AI駆動開発ワークフロー自動化Plugin

---

## 概要

MichiはClaude Code向けの**Spec-Driven Development**フレームワークです。
純粋なMarkdownプラグインとして動作し、ビルド・テスト不要で即座に利用可能です。

**主な機能:**
- 仕様駆動開発（Spec-Driven Development）の自動化
- テスト計画・TDD実装支援
- マルチリポジトリプロジェクト対応

---

## インストール

### Claude Code内でインストール

```
/plugin marketplace add sk8metalme/michi
/plugin install michi@sk8metalme
```

---

## 使い方

### 基本ワークフロー

```bash
# 1. 仕様初期化
/launch-pj "機能の説明"

# 2. 要件定義
/create-requirements {feature-name}

# 3. 設計
/create-design {feature-name}

# 4. テスト計画
/plan-tests {feature-name}

# 5. タスク分割
/create-tasks {feature-name}

# 6. 実装（TDD + 品質自動化）
/dev {feature-name}
```

---

## ドキュメント

- **プラグイン詳細**: [plugins/michi/README.md](plugins/michi/README.md)
- **プロジェクト設定**: [.claude/CLAUDE.md](.claude/CLAUDE.md)
- **テンプレート**: [templates/](templates/)

---

## バージョン

**v1.4.0** - 19個の独立したスキルに分割（保守性向上、発動制御の精密化）

---

## ライセンス

MIT
