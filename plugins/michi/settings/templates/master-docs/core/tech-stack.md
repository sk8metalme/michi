# 技術スタック

<!--
このファイルは、プロジェクトで使用している主要な技術スタックと技術選定理由を文書化します。
すべての依存関係をリスト化するのではなく、主要な技術とその選定理由、使用パターンを記述します。
-->

## 技術スタック概要

**言語**: {{PRIMARY_LANGUAGE}} ({{LANGUAGE_VERSION}})
**フレームワーク**: {{PRIMARY_FRAMEWORK}} ({{FRAMEWORK_VERSION}})
**ランタイム**: {{RUNTIME}} ({{RUNTIME_VERSION}})

## コア技術

### バックエンド

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| 言語 | {{BACKEND_LANGUAGE}} | {{BACKEND_LANGUAGE_VERSION}} | {{BACKEND_LANGUAGE_RATIONALE}} |
| フレームワーク | {{BACKEND_FRAMEWORK}} | {{BACKEND_FRAMEWORK_VERSION}} | {{BACKEND_FRAMEWORK_RATIONALE}} |
| ORマッパー | {{ORM}} | {{ORM_VERSION}} | {{ORM_RATIONALE}} |
| API仕様 | {{API_SPEC}} | {{API_SPEC_VERSION}} | {{API_SPEC_RATIONALE}} |

### フロントエンド

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| 言語 | {{FRONTEND_LANGUAGE}} | {{FRONTEND_LANGUAGE_VERSION}} | {{FRONTEND_LANGUAGE_RATIONALE}} |
| フレームワーク | {{FRONTEND_FRAMEWORK}} | {{FRONTEND_FRAMEWORK_VERSION}} | {{FRONTEND_FRAMEWORK_RATIONALE}} |
| 状態管理 | {{STATE_MANAGEMENT}} | {{STATE_MANAGEMENT_VERSION}} | {{STATE_MANAGEMENT_RATIONALE}} |
| UIライブラリ | {{UI_LIBRARY}} | {{UI_LIBRARY_VERSION}} | {{UI_LIBRARY_RATIONALE}} |

### データベース

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| RDBMS | {{DATABASE}} | {{DATABASE_VERSION}} | {{DATABASE_RATIONALE}} |
| キャッシュ | {{CACHE}} | {{CACHE_VERSION}} | {{CACHE_RATIONALE}} |
| メッセージキュー | {{MESSAGE_QUEUE}} | {{MESSAGE_QUEUE_VERSION}} | {{MESSAGE_QUEUE_RATIONALE}} |

## 開発ツール

### ビルド・パッケージ管理

| ツール | 用途 | 選定理由 |
|-------|------|---------|
| {{BUILD_TOOL}} | {{BUILD_TOOL_PURPOSE}} | {{BUILD_TOOL_RATIONALE}} |
| {{PACKAGE_MANAGER}} | {{PACKAGE_MANAGER_PURPOSE}} | {{PACKAGE_MANAGER_RATIONALE}} |

### テスト

| ツール | 用途 | 選定理由 |
|-------|------|---------|
| {{TEST_FRAMEWORK}} | {{TEST_FRAMEWORK_PURPOSE}} | {{TEST_FRAMEWORK_RATIONALE}} |
| {{E2E_TEST_TOOL}} | {{E2E_TEST_TOOL_PURPOSE}} | {{E2E_TEST_TOOL_RATIONALE}} |
| {{COVERAGE_TOOL}} | {{COVERAGE_TOOL_PURPOSE}} | {{COVERAGE_TOOL_RATIONALE}} |

### 品質管理

| ツール | 用途 | 選定理由 |
|-------|------|---------|
| {{LINTER}} | {{LINTER_PURPOSE}} | {{LINTER_RATIONALE}} |
| {{FORMATTER}} | {{FORMATTER_PURPOSE}} | {{FORMATTER_RATIONALE}} |
| {{STATIC_ANALYSIS}} | {{STATIC_ANALYSIS_PURPOSE}} | {{STATIC_ANALYSIS_RATIONALE}} |

## インフラストラクチャ

### クラウドプラットフォーム

**プロバイダー**: {{CLOUD_PROVIDER}}

**主要サービス**:
- **{{CLOUD_SERVICE_1}}**: {{CLOUD_SERVICE_1_PURPOSE}}
- **{{CLOUD_SERVICE_2}}**: {{CLOUD_SERVICE_2_PURPOSE}}
- **{{CLOUD_SERVICE_3}}**: {{CLOUD_SERVICE_3_PURPOSE}}

### コンテナ・オーケストレーション

| 技術 | 用途 | 選定理由 |
|------|------|---------|
| {{CONTAINER_TECH}} | {{CONTAINER_TECH_PURPOSE}} | {{CONTAINER_TECH_RATIONALE}} |
| {{ORCHESTRATION}} | {{ORCHESTRATION_PURPOSE}} | {{ORCHESTRATION_RATIONALE}} |

### CI/CD

| ツール | 用途 | 選定理由 |
|-------|------|---------|
| {{CI_TOOL}} | {{CI_TOOL_PURPOSE}} | {{CI_TOOL_RATIONALE}} |
| {{CD_TOOL}} | {{CD_TOOL_PURPOSE}} | {{CD_TOOL_RATIONALE}} |

## 主要ライブラリ

<!-- すべてのライブラリをリスト化するのではなく、重要な判断を伴うライブラリのみを記述 -->

### {{LIBRARY_CATEGORY_1}}

**主要ライブラリ**: {{MAJOR_LIBRARY_1}}

**選定理由**: {{MAJOR_LIBRARY_1_RATIONALE}}

**使用パターン**:
```{{CODE_LANGUAGE}}
{{MAJOR_LIBRARY_1_USAGE_EXAMPLE}}
```

### {{LIBRARY_CATEGORY_2}}

**主要ライブラリ**: {{MAJOR_LIBRARY_2}}

**選定理由**: {{MAJOR_LIBRARY_2_RATIONALE}}

**使用パターン**:
```{{CODE_LANGUAGE}}
{{MAJOR_LIBRARY_2_USAGE_EXAMPLE}}
```

## 技術制約と規約

### バージョン管理方針

{{VERSION_POLICY}}

### 依存関係管理方針

{{DEPENDENCY_POLICY}}

### セキュリティポリシー

<!-- 具体的な認証情報は含めない、ポリシーとパターンのみ -->

{{SECURITY_POLICY}}

## 技術的負債

<!-- 現在の技術スタックに関する既知の課題や改善計画 -->

### {{TECH_DEBT_1}}

**現状**: {{TECH_DEBT_1_CURRENT}}

**影響**: {{TECH_DEBT_1_IMPACT}}

**改善計画**: {{TECH_DEBT_1_PLAN}}

### {{TECH_DEBT_2}}

**現状**: {{TECH_DEBT_2_CURRENT}}

**影響**: {{TECH_DEBT_2_IMPACT}}

**改善計画**: {{TECH_DEBT_2_PLAN}}

## アップグレード履歴

<!-- 重要な技術スタックの変更履歴 -->

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| {{UPGRADE_DATE_1}} | {{UPGRADE_CONTENT_1}} | {{UPGRADE_RATIONALE_1}} |
| {{UPGRADE_DATE_2}} | {{UPGRADE_CONTENT_2}} | {{UPGRADE_RATIONALE_2}} |

## 参照

- アーキテクチャ概要: [architecture.md](./architecture.md)
- プロジェクト構造: [structure.md](./structure.md)
- API設計: [../development/api-design.md](../development/api-design.md)
