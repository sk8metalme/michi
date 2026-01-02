# Michi (道)

AI駆動開発ワークフロー自動化CLI

- **パッケージ**: `@sk8metal/michi-cli`
- **バージョン**: 0.19.0
- **アーキテクチャ**: Onion Architecture（4層構造）
- **主要機能**: JIRA/Confluence/GitHub連携、Spec-Driven Development

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| **Runtime** | Node.js | >= 20.0.0 |
| | npm | >= 10.0.0 |
| **Language** | TypeScript | 5.3.3 (ES2022, ESNext modules) |
| **テスト** | Vitest | 4.0.8 |
| | ts-arch-kit | 2.4.0 (アーキテクチャテスト) |
| | @vitest/coverage-v8 | 4.0.8 (カバレッジ: 49%閾値) |
| **Lint/Format** | ESLint | 9.39.1 + typescript-eslint 8.46.4 |
| | Prettier | 3.1.1 |
| | Husky | 9.1.7 (git hooks) |
| | lint-staged | 16.2.6 (pre-commit) |
| **CLI** | Commander | 14.0.2 |
| **Validation** | Zod | 4.1.12 |
| **外部API** | @octokit/rest | 22.0.1 (GitHub API) |
| | jira-client | 8.2.2 (JIRA API) |
| | axios | 1.13.1 (Confluence API) |

---

## 開発コマンド

### 型チェック
```bash
npm run type-check       # TypeScript型チェック（tsc --noEmit）
```

### Lint
```bash
npm run lint             # ESLintチェック
npm run lint:fix         # ESLint自動修正
```

### テスト
```bash
npm run test             # watchモードでテスト実行
npm run test:run         # 単発実行
npm run test:coverage    # カバレッジ付き実行（閾値: 49%）
npm run test:arch        # アーキテクチャテスト（Onion Architecture検証）
npm run test:ui          # Vitest UI
```

### ビルド
```bash
npm run build            # TypeScriptコンパイル + 静的アセットコピー
```

### フォーマット
```bash
npm run format           # Prettierでフォーマット
```

---

## コミット前チェック（必須）

**コミット前に必ず以下を全て実行すること:**

```bash
npm run lint             # Lintチェック
npm run type-check       # 型チェック
npm run test:run         # 全テスト実行
npm run test:arch        # アーキテクチャテスト
```

### 自動実行（pre-commit hook）
Husky + lint-stagedにより、コミット時に以下が自動実行される:
- **ステージングファイル**: ESLint自動修正 + Prettier
- **全体**: lint, test:run

**失敗時はコミット不可。**

---

## パッケージ公開

### CI経由での自動公開（推奨）

```bash
# 1. バージョンタグを作成
git tag v0.x.x

# 2. タグをpush
git push origin v0.x.x
```

**CIワークフロー（release.yml）が自動実行:**
1. 全テスト実行（test:run）
2. Lintチェック（lint）
3. 型チェック（type-check）
4. ビルド（build）
5. **npm publish** (NPM_TOKEN使用)
6. GitHub Release作成

**注意: 手動公開は非推奨（CI経由を推奨）**

---

## ディレクトリ構造

### 本番コード（src/）
```
src/
├── domain/           # ドメイン層（ビジネスロジック、依存なし）
│   ├── entities/     # エンティティ（Spec, Task, Project）
│   ├── value-objects/ # 値オブジェクト（FeatureName, Phase, ApprovalStatus）
│   ├── services/     # ドメインサービス（SpecValidator, PhaseTransitionService）
│   └── constants/    # ドメイン定数（phases.ts, validation-rules.ts）
│
├── application/      # アプリケーション層（ユースケース）
│   ├── use-cases/    # ユースケース（spec/, jira/, confluence/）
│   ├── services/     # アプリサービス（WorkflowOrchestrator, SpecLoader）
│   ├── interfaces/   # インターフェース定義（DI用）
│   └── templates/    # テンプレート処理ロジック
│
├── infrastructure/   # インフラ層（外部システム連携）
│   ├── external-apis/
│   │   ├── atlassian/jira/       # JIRA API
│   │   ├── atlassian/confluence/ # Confluence API
│   │   └── github/               # GitHub API
│   ├── filesystem/   # ファイルシステム操作
│   ├── parsers/      # パーサー（Markdown, JSON, YAML）
│   └── config/       # 設定管理
│
├── presentation/     # プレゼンテーション層（CLI）
│   ├── cli.ts        # CLIエントリーポイント
│   ├── commands/     # コマンドハンドラ
│   ├── formatters/   # 出力フォーマッタ
│   └── interactive/  # インタラクティブプロンプト
│
└── shared/           # 共有ユーティリティ
    └── types/        # 共有型定義
```

### 開発ツール（scripts/）
```
scripts/              # ビルド・開発ツール（本番コードではない）
├── build/            # ビルドスクリプト
├── dev-tools/        # 開発ユーティリティ
├── utils/            # スクリプト共通ユーティリティ
└── __tests__/        # スクリプトテスト
```

### Spec-Driven Development（.kiro/）
```
.kiro/
├── project.json      # プロジェクトメタデータ（ID, 名前, 言語, 連携設定）
├── steering/         # プロジェクト全体のAIガイド（現在空）
├── specs/            # 仕様書（feature単位）
│   ├── {feature}/
│   │   ├── spec.json        # 仕様メタデータ
│   │   ├── requirements.md  # 要件定義
│   │   ├── design.md        # 設計書
│   │   └── tasks.md         # タスク一覧
└── settings/         # ルール・テンプレート
    ├── rules/        # 開発ルール（design-principles.md等）
    └── templates/    # テンプレート（spec/, steering/）
```

### その他
```
docs/                 # ドキュメント
├── architecture.md   # アーキテクチャガイド（775行）
├── MIGRATION.md      # マイグレーションガイド
├── guides/           # ユーザーガイド
├── getting-started/  # 導入ガイド
└── reference/        # リファレンス
templates/            # 配布用テンプレート
plugins/              # プラグイン実装
dist/                 # ビルド出力
coverage/             # テストカバレッジレポート
```

---

## アーキテクチャルール

### Onion Architecture 依存方向（外→内のみ許可）

```
Presentation → Infrastructure → Application → Domain
                                     ↓
                                  Shared
```

**層別制約:**
- **Domain層**: 外部ライブラリ禁止（純粋なビジネスロジックのみ）
- **Application層**: Infrastructure層への直接依存禁止（interfaceを通す）
- **Infrastructure層**: Presentation層への依存禁止

**検証方法:**
```bash
npm run test:arch
```
- 依存方向違反を自動検出
- 循環依存を検出（DFSアルゴリズム）

### パスエイリアス
tsconfig.jsonで以下のパスエイリアスを定義:
- `@domain/*` → `./src/domain/*`
- `@application/*` → `./src/application/*`
- `@infrastructure/*` → `./src/infrastructure/*`
- `@presentation/*` → `./src/presentation/*`
- `@shared/*` → `./src/shared/*`
- `@kiro/*` → `./.kiro/*`

---

## TDD（テスト駆動開発）

**このプロジェクトはTDDで開発を進める。**

### TDDサイクル（Red-Green-Refactor）

1. **🔴 Red** - 失敗するテストを書く
   - 新機能の仕様をテストコードで表現
   - テストが失敗することを確認

2. **🟢 Green** - テストが通る最小限のコードを書く
   - テストを通すための最小実装
   - リファクタリングはまだしない

3. **🔵 Refactor** - コードをリファクタリングする
   - テストが通る状態を保ちながら改善
   - 重複排除、可読性向上

### 実践ルール

- **新機能は必ずテストから書く**
  - 実装コードより先にテストを書く
  - テストがない機能は存在しない

- **テストが通る前に次の機能に進まない**
  - Greenになるまで次に進まない
  - 常にテストが通る状態を維持

- **カバレッジ目標: 49%以上**
  - 現在の閾値設定（vitest.config.ts）
  - CI/CDで自動チェック

- **アーキテクチャテストも必須**
  - Onion Architecture違反を防ぐ
  - 循環依存を防ぐ

### TDDワークフロー

```bash
# 開発時（watchモード推奨）
npm run test          # ファイル変更時に自動テスト実行

# 確認
npm run test:run      # 単発実行
npm run test:coverage # カバレッジ確認

# コミット前
npm run test:run      # 全テスト実行（必須）
npm run test:arch     # アーキテクチャテスト（必須）
```

---

## CI/CD

### ワークフロー一覧

| ワークフロー | ファイル | トリガー | 内容 |
|-------------|---------|---------|------|
| **CI** | `.github/workflows/ci.yml` | push/PR to main, develop | test, lint, type-check, arch |
| **Release** | `.github/workflows/release.yml` | tag `v*` | **npm publish** + GitHub Release |
| **Security** | `.github/workflows/security.yml` | push to main + 週次（日曜 00:00 UTC） | npm audit |
| **Multi-Repo CI** | `.github/workflows/multi-repo-ci.yml` | push/PR（パスフィルタ付き） | Multi-repo機能テスト |
| **Multi-Repo Release** | `.github/workflows/multi-repo-release.yml` | tag `v*` | 拡張リリース検証 |
| **Knowledge Collection** | `.github/workflows/trigger-knowledge-collection.yml` | PR merge | knowledge-repoへディスパッチ |

### 主要ワークフロー詳細

**CI（ci.yml）**: Test (Node 20, 22) + Lint + Type Check + Architecture Check
**Release（release.yml）**: 全テスト実行 → ビルド → npm publish → GitHub Release

詳細は各ワークフローファイル（`.github/workflows/`）を参照。
