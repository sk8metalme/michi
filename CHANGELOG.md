# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-16

### Changed
- **BREAKING**: Migrated all slash commands to a single `michi` skill
- Commands are now primarily auto-invoked by Claude based on context
- **NEW**: Skills can also be explicitly invoked with `/michi [サブコマンド] [引数]`
- Skills are triggered by keywords, workflow phases, or explicit invocation
- Updated from command-based architecture to skill-based architecture

### Removed
- Removed `plugins/michi/commands/michi/` directory (13 commands)
- Removed `plugins/michi/commands/michi-multi-repo/` directory (6 commands)

### Added
- New skill: `michi` (integrates all 19 functions)
- Dual invocation mode: auto-trigger + explicit `/michi` command
- Skill references for workflow guidance:
  - `references/command-reference.md`: 全19機能の詳細リファレンス
  - `references/workflow-guide.md`: 開発ワークフローの全体説明
  - `references/multi-repo-guide.md`: マルチリポジトリ開発の詳細
  - `references/triggers.md`: 発動トリガー（キーワード、フェーズ）一覧
  - `references/examples.md`: 使用例・ユースケース
- Auto-trigger based on keywords and workflow phases
- Hybrid trigger system: keywords + workflow phases

### Technical Details

**v1.2.0 → v1.3.0 Migration**:
- Old: `/michi:launch-pj "description"` (explicit command)
- New: `/michi launch-pj "description"` (explicit skill invocation)
- New: "新しいプロジェクトを開始したい" (auto-trigger)

**Skill Structure**:
```
plugins/michi/skills/michi/
├── SKILL.md          # Main skill definition
└── references/       # Supporting documentation
    ├── command-reference.md
    ├── workflow-guide.md
    ├── multi-repo-guide.md
    ├── triggers.md
    └── examples.md
```

**19 Functions**:
- Project Management (4): launch-pj, show-status, archive-pj, switch-pj
- Specification (3): create-requirements, create-design, update-master-docs
- Test Planning (1): plan-tests
- Development (2): create-tasks, dev
- Review (3): review-design, review-dev, analyze-gap
- Multi-Repo (6): multi-repo:launch-pj, multi-repo:create-requirements, multi-repo:create-design, multi-repo:review-cross, multi-repo:propagate, multi-repo:dev-all

---

## [1.2.0] - 2026-01-15

### Added
- Phase 4 統合実装: `/michi:plan-tests` コマンド
- テスト戦略生成 (Phase 0.3)
- テスト仕様生成 (Phase 0.4)
- `/michi:create-design` にPhase 4ガイダンス追加

### Changed
- `/michi:dev` Phase 6サブフェーズ品質自動化
  - Phase 6.2: 事前品質監査 (OSS License, Version Audit)
  - Phase 6.3: TDD実装サイクル (RED-GREEN-REFACTOR + 自動修正ループ)
  - Phase 6.4: 事後品質レビュー (Code Review, Design Review)
  - Phase 6.5: 最終検証 (Coverage 95%+, Mutation Testing)
  - Phase 6.6: タスク完了マーク
  - Phase 6.7: Progress Check Guidance
  - Phase 6.8: アーカイブ準備

### Fixed
- `/michi:create-requirements` のEARS形式不整合
- マルチリポジトリコマンドのクロスリポ整合性検証

---

## [1.1.0] - 2026-01-10

### Added
- Multi-Repository サポート
  - `/michi-multi-repo:launch-pj`
  - `/michi-multi-repo:create-requirements`
  - `/michi-multi-repo:create-design`
  - `/michi-multi-repo:review-cross`
  - `/michi-multi-repo:propagate`
  - `/michi-multi-repo:dev-all`
- JIRA/Confluence 連携機能

### Changed
- プラグイン構造の整理

---

## [1.0.0] - 2026-01-05

### Added
- Initial release as Claude Code Plugin
- Markdown-based plugin architecture (no TypeScript/npm)
- 13 Michi commands:
  - launch-pj, create-requirements, create-design, create-tasks, dev
  - show-status, archive-pj, review-design, review-dev, analyze-gap
  - plan-tests, update-master-docs, switch-pj
- 5 rules:
  - michi-core, code-size-monitor, code-size-rules
  - doc-review, doc-review-rules

### Removed
- TypeScript CLI implementation (migrated to Markdown plugin)
- npm dependencies
- Build/test infrastructure

---

## [0.x] - Legacy (TypeScript CLI)

TypeScript CLI時代のバージョン。完全にMarkdownプラグインに移行済み。

- Onion Architecture 4層実装
- npm, Vitest, ESLint による品質管理
- GitHub Actions による CI/CD
- npm publish によるパッケージ配布

詳細は Git履歴を参照: `git log --before="2026-01-01"`

---

## Links

- [Michi Repository](https://github.com/sk8metalme/michi)
- [Claude Code Plugin Marketplace](https://code.claude.com/plugins)
- [Issue Tracker](https://github.com/sk8metalme/michi/issues)
