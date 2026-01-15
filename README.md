# Michi (道)

**M**anaged **I**ntelligent **C**omprehensive **H**ub for **I**ntegration

AI駆動開発ワークフロー自動化Plugin

---

## 概要

MichiはClaude Code向けの**Spec-Driven Development**フレームワークです。
純粋なMarkdownプラグインとして動作し、ビルド・テスト不要で即座に利用可能です。

**主な機能:**
- 仕様駆動開発（Spec-Driven Development）の自動化
- JIRA/Confluence連携（タスク同期、仕様書公開）
- テスト計画・TDD実装支援
- マルチリポジトリプロジェクト対応

---

## インストール

### Claude Code内でインストール

```
/plugin marketplace add yourorg/michi
/plugin install michi@yourorg
```

### 前提条件

**推奨プラグイン（ai-agent-setup）:**
```
/plugin marketplace add yourorg/ai-agent-setup
/plugin install design-review@ai-agent-setup
/plugin install oss-compliance@ai-agent-setup
/plugin install version-audit@ai-agent-setup
/plugin install e2e-planning@ai-agent-setup
```

---

## 使い方

### 基本ワークフロー

```bash
# 1. 仕様初期化
/michi:launch-pj "機能の説明"

# 2. 要件定義
/michi:create-requirements {feature-name}

# 3. 設計
/michi:create-design {feature-name}

# 4. テスト計画
/michi:plan-tests {feature-name}

# 5. タスク分割
/michi:create-tasks {feature-name}

# 6. 実装（TDD + 品質自動化）
/michi:dev {feature-name}
```

---

## ドキュメント

- **プラグイン詳細**: [plugins/michi/README.md](plugins/michi/README.md)
- **プロジェクト設定**: [.claude/CLAUDE.md](.claude/CLAUDE.md)
- **テンプレート**: [templates/](templates/)

---

## バージョン

**v1.2.0** - 初期バージョン

---

## ライセンス

MIT
