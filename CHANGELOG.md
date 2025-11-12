# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-11-13

### Changed
- Vitest 4への移行（1.x → 4.x）
- ESLint 9への移行（8.x → 9.x、Flat Config対応）
- Zod 4への移行（3.x → 4.x）

### Dependencies
- Updated `vitest` from `^1.6.1` to `^4.0.8`
- Updated `@vitest/coverage-v8` from `^1.6.1` to `^4.0.8`
- Updated `eslint` from `^8.57.1` to `^9.39.1`
- Updated `@typescript-eslint/eslint-plugin` from `^6.21.0` to `^8.46.4`
- Updated `@typescript-eslint/parser` from `^6.21.0` to `^8.46.4`
- Updated `typescript-eslint` from `^6.21.0` to `^8.46.4`
- Updated `zod` from `^3.25.76` to `^4.1.12`
- Updated `@octokit/rest` from `^20.1.2` to `^22.0.1`
- Updated `googleapis` from `^126.0.1` to `^166.0.0`
- Updated `@types/node` from `^20.19.24` to `^24.10.1`
- Updated `@types/markdown-it` from `^13.0.9` to `^14.1.2`

## [0.0.3] - 2025-11-12

### Added
- CI/CDパイプラインの整備
- テストカバレッジレポートの自動生成

## [0.0.2] - 2025-11-12

### Changed
- パッケージ名を `@sk8metalme/michi-cli` から `@sk8metal/michi-cli` に変更
- ドキュメント内のパッケージ名参照を更新（README.md、docs/setup.md）

## [0.0.1] - 2025-11-12

### Added
- 初回リリース
- AI駆動開発ワークフロー自動化プラットフォーム
- Confluence/JIRA連携機能
- GitHub SSoT（Single Source of Truth）管理
- マルチプロジェクト対応
- フェーズバリデーション機能
- 自動化スクリプト（Markdown↔Confluence同期、JIRA連携、PR自動化）

