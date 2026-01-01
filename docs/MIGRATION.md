# Migration Guide: Onion Architecture

このドキュメントは、Michiプロジェクトのオニオンアーキテクチャ移行について説明します。

## 目次

- [概要](#概要)
- [移行の背景と目的](#移行の背景と目的)
- [Before/After ディレクトリ構造比較](#beforeafter-ディレクトリ構造比較)
- [ハイブリッドアプローチ: src/ + scripts/](#ハイブリッドアプローチ-src--scripts)
- [ファイル移動マッピング](#ファイル移動マッピング)
- [移行の影響](#移行の影響)
- [開発者向けガイドライン](#開発者向けガイドライン)

## 概要

**移行期間**: Phase 1 - Phase 7 (v0.13.0 - v0.18.x)

Michiは、従来の`scripts/`中心のフラット構造から、**オニオンアーキテクチャ（4層構造）**に移行しました。これにより、以下を実現します:

- ✅ **明確な責務分離**: ビジネスロジックと外部依存の分離
- ✅ **テスト容易性**: 各層を独立してテスト可能
- ✅ **保守性向上**: 依存関係ルールによる変更影響の局所化
- ✅ **ハイブリッドアプローチ**: プロダクションコード（`src/`）とビルドツール（`scripts/`）の共存

## 移行の背景と目的

### 移行前の課題

1. **責務の混在**: プロダクションコードとビルドツールが同じ`scripts/`に混在
2. **依存関係の複雑化**: 外部APIとビジネスロジックが密結合
3. **テストの困難性**: モックが困難で単体テストが書きにくい
4. **コード重複**: 類似処理が複数箇所に散在（約1,600行）

### 移行後の改善

1. **4層構造**: Domain/Application/Infrastructure/Presentation に責務を分離
2. **依存性逆転**: インターフェースを介した疎結合設計
3. **テスト戦略**: 各層ごとに適切なテスト手法を適用
4. **コード簡素化**: 重複コード削減と共通化により約1,600行削減

## Before/After ディレクトリ構造比較

### Before: フラット構造（v0.12.x以前）

```
michi/
├── scripts/
│   ├── confluence-sync.ts          # Presentation層相当
│   ├── jira-sync.ts                # Presentation層相当
│   ├── workflow-orchestrator.ts    # Application層相当
│   ├── phase-runner.ts             # Application層相当
│   ├── spec-impl-workflow.ts       # Application層相当
│   ├── utils/
│   │   ├── confluence-api.ts       # Infrastructure層相当
│   │   ├── jira-api.ts             # Infrastructure層相当
│   │   ├── github-api.ts           # Infrastructure層相当
│   │   ├── spec-file-system.ts     # Infrastructure層相当
│   │   ├── template-engine.ts      # Application層相当
│   │   ├── feature-name-validator.ts # Domain層相当
│   │   ├── project-finder.ts       # 削除（ProjectAnalyzerに統合）
│   │   ├── project-detector.ts     # 削除（ProjectAnalyzerに統合）
│   │   └── ... （40以上のファイルが混在）
│   ├── build/
│   │   ├── copy-static-assets.js   # ビルドツール（scripts/に残る）
│   │   └── set-permissions.js      # ビルドツール（scripts/に残る）
│   └── dev-tools/
│       ├── test-interactive.ts     # 開発ツール（scripts/に残る）
│       └── mermaid-converter.ts    # 開発ツール（scripts/に残る）
└── src/
    └── cli.ts                      # CLIエントリーポイントのみ
```

**課題**:
- プロダクションコード（`confluence-api.ts`, `spec-file-system.ts`など）がビルドツールと混在
- 依存関係が不明確（どのファイルがどれに依存しているか分からない）
- テストが困難（外部APIとビジネスロジックが密結合）

### After: オニオンアーキテクチャ（v0.18.x）

```
michi/
├── src/                           # プロダクションコード（4層構造）
│   ├── domain/                    # Layer 1: ビジネスロジック
│   │   ├── entities/
│   │   │   ├── spec.ts            # 仕様エンティティ
│   │   │   ├── feature-name.ts    # 値オブジェクト
│   │   │   └── phase-identifier.ts
│   │   ├── services/
│   │   │   ├── spec-validator.ts
│   │   │   └── template-validator.ts
│   │   └── constants/
│   │       └── phases.ts
│   │
│   ├── application/               # Layer 2: ユースケース調整
│   │   ├── use-cases/
│   │   │   ├── init-spec.ts
│   │   │   ├── generate-requirements.ts
│   │   │   └── generate-design.ts
│   │   ├── interfaces/            # DI用インターフェース
│   │   │   ├── spec-repository.ts
│   │   │   ├── external-api.ts
│   │   │   └── template-engine.ts
│   │   ├── services/
│   │   │   └── template-processor.ts
│   │   └── dto/
│   │       └── spec-dto.ts
│   │
│   ├── infrastructure/            # Layer 3: 外部サービス統合
│   │   ├── repositories/
│   │   │   └── file-system-spec-repository.ts
│   │   ├── external-apis/
│   │   │   ├── confluence/
│   │   │   │   ├── confluence-client.ts
│   │   │   │   └── confluence-parser.ts
│   │   │   ├── jira/
│   │   │   │   ├── jira-client.ts
│   │   │   │   └── jira-parser.ts
│   │   │   └── github/
│   │   │       └── github-client.ts
│   │   ├── config/
│   │   │   └── config-loader.ts
│   │   └── file-system/
│   │       └── safe-file-reader.ts
│   │
│   ├── presentation/              # Layer 4: ユーザーインターフェース
│   │   ├── commands/
│   │   │   ├── confluence/
│   │   │   │   └── confluence-sync-handler.ts
│   │   │   ├── jira/
│   │   │   │   └── jira-sync-handler.ts
│   │   │   ├── spec/
│   │   │   │   ├── init-handler.ts
│   │   │   │   ├── requirements-handler.ts
│   │   │   │   └── design-handler.ts
│   │   │   └── workflow/
│   │   │       └── workflow-orchestrator-handler.ts
│   │   ├── formatters/
│   │   │   └── console-formatter.ts
│   │   └── cli.ts                 # CLIエントリーポイント
│   │
│   └── shared/                    # 共通ユーティリティ
│       ├── utils/
│       │   ├── logger.ts
│       │   └── error-handler.ts
│       └── types/
│           └── common.ts
│
└── scripts/                       # ビルド・開発ツール（層なし）
    ├── build/                     # ビルドツール
    │   ├── copy-static-assets.js
    │   └── set-permissions.js
    ├── dev-tools/                 # 開発ツール
    │   ├── test-interactive.ts
    │   └── mermaid-converter.ts
    ├── utils/                     # スクリプト共通ユーティリティ
    │   ├── env-loader.js
    │   ├── config-loader.ts
    │   └── safe-file-reader.ts
    ├── confluence-sync.ts         # Entry Point → src/presentation/commands/confluence/
    ├── jira-sync.ts               # Entry Point → src/presentation/commands/jira/
    ├── workflow-orchestrator.ts   # Entry Point → src/presentation/commands/workflow/
    └── ...
```

**改善点**:
- ✅ プロダクションコードが`src/`に明確に分離
- ✅ 4層構造で責務が明確（Domain/Application/Infrastructure/Presentation）
- ✅ ビルド・開発ツールは`scripts/`に残る（ハイブリッドアプローチ）
- ✅ 依存関係ルールが明確（内側→外側の一方向のみ）

## ハイブリッドアプローチ: src/ + scripts/

Michiは**ハイブリッドアプローチ**を採用しています:

### src/ - プロダクションコード（4層構造）

**対象**: CLIツール本体の実装

**適用ルール**:
- ✅ オニオンアーキテクチャの4層構造を適用
- ✅ 依存関係ルール（内側→外側の一方向）
- ✅ TypeScriptパスエイリアス（`@domain/*`, `@application/*`, etc.）
- ✅ ts-archによる自動アーキテクチャ検証

**例**:
```typescript
// src/presentation/commands/spec/init-handler.ts
import { InitSpecUseCase } from '@application/use-cases/init-spec';
import { FileSystemSpecRepository } from '@infrastructure/repositories/file-system-spec-repository';

export class InitHandler {
  async execute(featureName: string, description: string): Promise<void> {
    const repo = new FileSystemSpecRepository();
    const useCase = new InitSpecUseCase(repo);
    await useCase.execute(featureName, description);
  }
}
```

### scripts/ - ビルド・開発ツール（層なし）

**対象**: ビルドツール、開発支援ツール、ワークフロー自動化

**適用ルール**:
- ❌ オニオンアーキテクチャの層構造は**適用しない**
- ✅ シンプルなディレクトリ分類（`build/`, `dev-tools/`, `utils/`）
- ✅ Entry Point方式（実装本体は`src/`に配置し、`scripts/`はラッパーのみ）

**例**:
```typescript
// scripts/confluence-sync.ts - Entry Point
import { ConfluenceSyncHandler } from '../src/presentation/commands/confluence/confluence-sync-handler.js';

async function main() {
  const handler = new ConfluenceSyncHandler();
  await handler.execute(process.argv.slice(2));
}

main();
```

### 判断基準

**scripts/に配置すべきもの**:
- ✅ ビルドスクリプト（`copy-static-assets.js`, `set-permissions.js`）
- ✅ 開発ツール（`test-interactive.ts`, `mermaid-converter.ts`）
- ✅ Entry Point（`confluence-sync.ts`, `jira-sync.ts`）
- ✅ npm scriptsから直接実行されるツール

**src/に配置すべきもの**:
- ✅ ビジネスロジック（バリデーション、エンティティ、値オブジェクト）
- ✅ ユースケース（`InitSpecUseCase`, `GenerateRequirementsUseCase`）
- ✅ 外部API統合（`ConfluenceClient`, `JiraClient`）
- ✅ コマンドハンドラー（`InitHandler`, `RequirementsHandler`）
- ✅ 再利用可能な共通コード

## ファイル移動マッピング

### Domain Layer（ビジネスロジック）

| Before (scripts/) | After (src/domain/) | 説明 |
|------------------|---------------------|------|
| `utils/feature-name-validator.ts` | `domain/services/spec-validator.ts` | 仕様検証ロジック |
| `utils/phase-constants.ts` | `domain/constants/phases.ts` | フェーズ定数 |
| `utils/template-validator.ts` | `domain/services/template-validator.ts` | テンプレート検証 |
| `utils/types/spec.ts` | `domain/entities/spec.ts` | 仕様エンティティ |
| `utils/types/feature-name.ts` | `domain/entities/feature-name.ts` | 値オブジェクト |

### Application Layer（ユースケース）

| Before (scripts/) | After (src/application/) | 説明 |
|------------------|--------------------------|------|
| `spec-init-workflow.ts` | `application/use-cases/init-spec.ts` | 仕様初期化ユースケース |
| `spec-requirements-generator.ts` | `application/use-cases/generate-requirements.ts` | 要件定義生成 |
| `spec-design-generator.ts` | `application/use-cases/generate-design.ts` | 設計書生成 |
| `utils/template-engine.ts` | `application/services/template-processor.ts` | テンプレート処理 |
| `workflow-orchestrator.ts` | `application/use-cases/orchestrate-workflow.ts` | ワークフロー調整 |
| `phase-runner.ts` | `application/use-cases/run-phase.ts` | フェーズ実行 |
| `spec-impl-workflow.ts` | `application/use-cases/implement-spec.ts` | 実装ワークフロー |

### Infrastructure Layer（外部サービス）

| Before (scripts/) | After (src/infrastructure/) | 説明 |
|------------------|----------------------------|------|
| `utils/confluence-api.ts` | `infrastructure/external-apis/confluence/confluence-client.ts` | Confluence統合 |
| `utils/jira-api.ts` | `infrastructure/external-apis/jira/jira-client.ts` | JIRA統合 |
| `utils/github-api.ts` | `infrastructure/external-apis/github/github-client.ts` | GitHub統合 |
| `github-actions-client.ts` | `infrastructure/external-apis/github/github-actions-client.ts` | GitHub Actions |
| `utils/spec-file-system.ts` | `infrastructure/repositories/file-system-spec-repository.ts` | ファイルシステム |
| `utils/config-loader.ts` | `infrastructure/config/config-loader.ts` | 設定読み込み |
| `utils/safe-file-reader.ts` | `infrastructure/file-system/safe-file-reader.ts` | ファイル読み込み |
| `utils/markdown-parser.ts` | `infrastructure/parsers/markdown-parser.ts` | Markdown解析 |
| `utils/confluence-parser.ts` | `infrastructure/external-apis/confluence/confluence-parser.ts` | Confluence解析 |

### Presentation Layer（CLI）

| Before (scripts/) | After (src/presentation/) | 説明 |
|------------------|--------------------------|------|
| `confluence-sync.ts` | `presentation/commands/confluence/confluence-sync-handler.ts` | Confluence同期 |
| `jira-sync.ts` | `presentation/commands/jira/jira-sync-handler.ts` | JIRA同期 |
| `workflow-orchestrator.ts` | `presentation/commands/workflow/workflow-orchestrator-handler.ts` | ワークフロー |
| `utils/console-formatter.ts` | `presentation/formatters/console-formatter.ts` | コンソール出力 |
| `utils/progress-reporter.ts` | `presentation/formatters/progress-reporter.ts` | 進捗表示 |
| `utils/interactive-prompt.ts` | `presentation/ui/interactive-prompt.ts` | 対話型UI |

### Shared Layer（共通）

| Before (scripts/) | After (src/shared/) | 説明 |
|------------------|---------------------|------|
| `utils/logger.ts` | `shared/utils/logger.ts` | ロガー |
| `utils/error-handler.ts` | `shared/utils/error-handler.ts` | エラーハンドリング |
| `utils/types/common.ts` | `shared/types/common.ts` | 共通型定義 |
| `utils/types/validation.ts` | `shared/types/validation.ts` | バリデーション型 |

### scripts/に残るファイル（ビルド・開発ツール）

| ファイルパス | 分類 | 説明 |
|-------------|------|------|
| `scripts/build/copy-static-assets.js` | ビルドツール | 静的ファイルコピー |
| `scripts/build/set-permissions.js` | ビルドツール | 実行権限設定 |
| `scripts/dev-tools/test-interactive.ts` | 開発ツール | 対話型テスト |
| `scripts/dev-tools/mermaid-converter.ts` | 開発ツール | Mermaid図変換 |
| `scripts/utils/env-loader.js` | スクリプト共通 | 環境変数読み込み |
| `scripts/config-global.ts` | 開発ツール | グローバル設定 |
| `scripts/pre-flight-check.ts` | 開発ツール | 環境チェック |
| `scripts/validate-phase.ts` | 開発ツール | フェーズ検証 |
| `scripts/confluence-sync.ts` | Entry Point | Confluence同期（ラッパー） |
| `scripts/jira-sync.ts` | Entry Point | JIRA同期（ラッパー） |
| `scripts/workflow-orchestrator.ts` | Entry Point | ワークフロー（ラッパー） |

### 削除されたファイル（未使用・重複）

| ファイルパス | 理由 |
|-------------|------|
| `scripts/setup-existing.ts` | 非推奨コマンド |
| `scripts/utils/resource-dashboard.ts` | 完全未使用 |
| `scripts/utils/test-spec-generator.ts` | 完全未使用 |
| `scripts/utils/template-finder.ts` | 完全未使用 |
| `scripts/utils/test-new-features.ts` | 完全未使用 |
| `scripts/utils/project-finder.ts` | ProjectAnalyzerに統合 |
| `scripts/utils/project-detector.ts` | ProjectAnalyzerに統合 |
| `scripts/utils/language-detector.ts` | ProjectAnalyzerに統合 |

**削減コード量**: 約1,600行

## 移行の影響

### 1. インポートパスの変更

**Before**:
```typescript
import { ConfluenceAPI } from './utils/confluence-api';
import { SpecValidator } from './utils/feature-name-validator';
```

**After**:
```typescript
import { ConfluenceClient } from '@infrastructure/external-apis/confluence/confluence-client';
import { SpecValidator } from '@domain/services/spec-validator';
```

### 2. 依存性注入（DI）の導入

**Before**: 直接インスタンス化
```typescript
export class WorkflowOrchestrator {
  async run() {
    const confluenceAPI = new ConfluenceAPI();
    await confluenceAPI.sync();
  }
}
```

**After**: インターフェースを介した注入
```typescript
export class OrchestrateWorkflowUseCase {
  constructor(private confluenceAPI: IConfluenceAPI) {}

  async execute(): Promise<void> {
    await this.confluenceAPI.sync();
  }
}
```

### 3. テスト戦略の変更

**Before**: 統合テストのみ
```typescript
describe('WorkflowOrchestrator', () => {
  it('should sync to Confluence', async () => {
    // 実際のConfluence APIを呼び出す必要がある
    const orchestrator = new WorkflowOrchestrator();
    await orchestrator.run();
  });
});
```

**After**: 単体テスト + モック
```typescript
describe('OrchestrateWorkflowUseCase', () => {
  it('should sync to Confluence', async () => {
    // モックで単体テスト可能
    const mockConfluenceAPI: IConfluenceAPI = {
      sync: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new OrchestrateWorkflowUseCase(mockConfluenceAPI);
    await useCase.execute();
    expect(mockConfluenceAPI.sync).toHaveBeenCalled();
  });
});
```

### 4. package.jsonスクリプトの変更

**Before**:
```json
{
  "scripts": {
    "confluence:sync": "tsx scripts/utils/confluence-api.ts"
  }
}
```

**After**:
```json
{
  "scripts": {
    "confluence:sync": "tsx scripts/confluence-sync.ts"
  }
}
```

**変更点**: 実装が`src/`に移動し、`scripts/`はEntry Pointのみ

### 5. tsconfig.jsonの更新

**追加されたパスエイリアス**:
```json
{
  "compilerOptions": {
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@presentation/*": ["./src/presentation/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

## 開発者向けガイドライン

### 新しいファイルを作成する場合

1. **ビルド・開発ツールか？** → `scripts/build/` or `scripts/dev-tools/`
2. **プロダクションコードか？** → 以下の判断フローに従う:
   - **ユーザーと直接やり取り** → `src/presentation/`
   - **外部サービスと統合** → `src/infrastructure/`
   - **ビジネスロジック調整** → `src/application/`
   - **コアビジネスルール** → `src/domain/`
   - **共通ユーティリティ** → `src/shared/`

詳細は [アーキテクチャガイド](architecture.md) を参照してください。

### 既存コードの修正

**原則**: ファイルの配置場所に応じて、適切なルールに従う

| 配置場所 | 適用ルール |
|---------|-----------|
| `src/domain/` | 外部ライブラリ禁止、`shared/`のみ依存可 |
| `src/application/` | `domain/`, `shared/`のみ依存可 |
| `src/infrastructure/` | インターフェースに依存、実装は具体的 |
| `src/presentation/` | すべての層に依存可 |
| `scripts/` | オニオンアーキテクチャルールなし |

### アーキテクチャ検証

**自動テスト**: `npm run test:arch`

```bash
npm run test:arch
```

**検証内容** (13テスト):
- ✅ Domain層は外部ライブラリに依存しない
- ✅ Application層はDomain層のみに依存
- ✅ Infrastructure層はインターフェースに依存
- ✅ Presentation層はすべての層に依存可
- ✅ 循環依存の検出

### トラブルシューティング

#### インポートエラー

**エラー**: `Cannot find module '@domain/...'`

**解決策**:
```bash
# TypeScriptコンパイル
npm run build

# または開発モード
npm run michi
```

#### アーキテクチャ違反

**エラー**: `Architecture violation: Domain layer cannot depend on ...`

**解決策**:
1. 依存関係を確認
2. 適切な層に移動
3. インターフェースを介した疎結合に変更

詳細は [アーキテクチャガイド - トラブルシューティング](architecture.md#トラブルシューティング) を参照してください。

## 関連ドキュメント

- [アーキテクチャガイド](architecture.md) - 4層構造の詳細説明
- [プロジェクト構成](.kiro/steering/structure.md) - 全体構成
- [開発ワークフロー](.kiro/steering/workflow.md) - 開発フロー

## バージョン履歴

- **v0.18.x**: Phase 7完了 - ドキュメント整備、最終調整
- **v0.17.x**: Phase 6完了 - Presentation層リファクタリング
- **v0.16.x**: Phase 5完了 - scripts/分離とEntry Point化
- **v0.15.x**: Phase 4完了 - Application層構築
- **v0.14.x**: Phase 3完了 - Infrastructure層リファクタリング
- **v0.13.x**: Phase 1-2完了 - Domain層構築とts-arch導入
