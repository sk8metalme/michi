# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Michi - AI Development Workflow Automation

**Michi** (道) は、企業の開発フロー全体をAIで自動化するプラットフォームです。

- **GitHub SSoT**: GitHubを真実の源として管理
- **Confluence/JIRA統合**: Atlassian MCP経由で連携
- **マルチプロジェクト対応**: 3-5プロジェクト同時進行

### Paths
- Steering: `.kiro/steering/` - AI guidance and project context
- Specs: `.kiro/specs/` - Feature specifications (GitHub SSoT)
- Commands: `.cursor/commands/` - Cursor slash commands
- Scripts: `scripts/` - Automation scripts (Confluence/JIRA sync)

### Project Metadata
- **プロジェクト設定**: `.kiro/project.json`
- **プロジェクトID**: `michi`
- **JIRA Key**: `MICHI`
- **Confluence Labels**: `project:michi, service:hub`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
- `product.md`: Business objectives and goals
- `tech.md`: Technology stack and architecture
- `structure.md`: File organization and code patterns

**Specs** (`.kiro/specs/`) - Formalize development process for individual features
- `requirements.md`: Requirements (synced to Confluence)
- `design.md`: Design + estimates (synced to Confluence)
- `tasks.md`: Task breakdown (synced to JIRA)

### Active Specifications
- **health-check-endpoint**: APIサーバーの稼働状態を確認するヘルスチェックエンドポイント（テスト機能）
- Check `.kiro/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)
- **GitHub SSoT**: すべての仕様書はGitHubで管理（Confluenceは参照のみ）
- **Multi-Project**: `.kiro/project.json` を常に参照してプロジェクト識別

## Workflow

### Phase 0: Steering (Optional)
`/kiro/steering` - Create/update steering documents
`/kiro/steering-custom` - Create custom steering for specialized contexts

**Note**: Optional for new features or small additions. Can proceed directly to spec-init.

### Phase 1: Specification Creation
1. `/kiro/spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro/spec-requirements [feature]` - Generate requirements document
   - **自動実行**: Confluenceページ作成（要件定義）
   - **自動実行**: spec.json更新
3. `/kiro/spec-design [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
   - **自動実行**: Confluenceページ作成（設計書）
   - **自動実行**: spec.json更新
4. `/kiro/spec-tasks [feature]` - Interactive: Confirms both requirements and design review
   - **自動実行**: JIRA Epic作成
   - **自動実行**: JIRA Story作成（全ストーリー）
   - **自動実行**: spec.json更新

### Phase 2: Progress Tracking
`/kiro/spec-status [feature]` - Check current progress and phases

### 各フェーズの完了チェックリスト

#### `/kiro:spec-requirements` 完了時
- [ ] requirements.md作成済み
- [ ] **Confluenceページ作成済み（要件定義）**
- [ ] spec.jsonにconfluence.requirementsPageId記録
- [ ] PMや部長にレビュー依頼通知

#### `/kiro:spec-design` 完了時
- [ ] design.md作成済み
- [ ] **Confluenceページ作成済み（設計書）**
- [ ] spec.jsonにconfluence.designPageId記録
- [ ] PMや部長にレビュー依頼通知

#### `/kiro:spec-tasks` 完了時
- [ ] tasks.md作成済み（営業日ベース）
- [ ] **JIRA Epic作成済み**
- [ ] **JIRA Story全作成済み**
- [ ] spec.jsonにjira.epicKey, jira.stories記録
- [ ] 開発チームに実装開始通知

**重要**: これらのチェックリストが完了していない場合、次のフェーズに進まないこと

### スクリプトによる自動化（推奨）

**抜け漏れ防止**: 各フェーズ完了時にスクリプトを実行することで、Confluence/JIRA作成を確実に実行できます。

#### 要件定義フェーズ

```bash
# AIで requirements.md を作成後
npm run phase:run calculator-app requirements

# 実行内容:
#  1. requirements.md 存在確認
#  2. Confluenceページ自動作成
#  3. spec.json自動更新
#  4. バリデーション実行
```

#### 設計フェーズ

```bash
# AIで design.md を作成後
npm run phase:run calculator-app design

# 実行内容:
#  1. design.md 存在確認
#  2. Confluenceページ自動作成
#  3. spec.json自動更新
#  4. バリデーション実行
```

#### タスク分割フェーズ

```bash
# AIで tasks.md を作成後（営業日ベース）
npm run phase:run calculator-app tasks

# 実行内容:
#  1. tasks.md 存在確認
#  2. JIRA Epic自動作成
#  3. JIRA Story自動作成（全ストーリー）
#  4. spec.json自動更新
#  5. バリデーション実行
```

#### バリデーションのみ実行

```bash
# フェーズが完了しているか確認
npm run validate:phase calculator-app requirements
npm run validate:phase calculator-app design
npm run validate:phase calculator-app tasks

# Exit code 0: 成功（すべて完了）
# Exit code 1: 失敗（未完了項目あり）
```

## tasks.mdの構造（6フェーズ）

tasks.mdは**全開発フェーズ**を含む必要があります：

1. **Phase 0: 要件定義（Requirements）** - 要件定義書作成、PM承認
2. **Phase 1: 設計（Design）** - 基本設計、詳細設計、技術レビュー
3. **Phase 2: 実装（Implementation）** - プロジェクトセットアップ、コア機能実装
4. **Phase 3: 試験（Testing）** - 結合テスト、E2E、性能テスト
5. **Phase 4: リリース準備（Release Preparation）** - 本番環境構築、リリースドキュメント作成
6. **Phase 5: リリース（Release）** - ステージングデプロイ、本番リリース、承認

### フェーズヘッダーの形式（必須）

```markdown
## Phase X: フェーズ名（ラベル）
```

**重要**: `（ラベル）`部分は必須です。JIRAストーリーのラベル検出に使用されます。

**例**:
```markdown
## Phase 0: 要件定義（Requirements）
### Story 0.1: 要件定義書作成

## Phase 1: 設計（Design）
### Story 1.1: 基本設計

## Phase 3: 試験（Testing）
### Story 3.1: 結合テスト
```

詳細なテンプレートは `docs/tasks-template.md` を参照してください。

## Development Rules
1. **Consider steering**: Run `/kiro/steering` before major development (optional for new features)
2. **Follow 6-phase workflow**: Requirements → Design → Implementation → Testing → Release-Prep → Release
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro/steering` after significant changes
7. **Check spec compliance**: Use `/kiro/spec-status` to verify alignment
8. **Tasks with business days**: タスク分割（tasks.md）作成時は、必ず土日・祝日を除いた営業日ベースでスケジュールを計算すること
9. **Confluence/JIRA自動作成**: 各フェーズ完了後、必ずスクリプトでConfluence/JIRAを自動作成すること
   - `/kiro:spec-requirements` 完了後 → `npm run phase:run <feature> requirements` でConfluenceページ作成（要件定義）
   - `/kiro:spec-design` 完了後 → `npm run phase:run <feature> design` でConfluenceページ作成（設計書）
   - `/kiro:spec-tasks` 完了後 → `npm run phase:run <feature> tasks` で**全6フェーズのJIRA Epic/Story作成**（ラベル自動付与）
   - **重要**: MCPツールは使用せず、REST APIスクリプト（jira-sync.ts, confluence-sync.ts）を使用すること
   - PMや部長のレビューのため、実装前に必須

## Steering Configuration

### Current Steering Files
Managed by `/kiro/steering` command. Updates here reflect command changes.

### Active Steering Files
- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro/steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes
- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Reference with `@filename.md` syntax

## Atlassian REST API Scripts（推奨）

### 自動化スクリプト

Confluence/JIRAの作成・更新は、**REST APIスクリプトを使用**します：

- **`confluence-sync.ts`**: Confluenceページの作成・更新、Markdown変換、ラベル付与
- **`jira-sync.ts`**: JIRA Epic/Storyの作成・更新、詳細説明文生成、期限設定、Story Points設定

**注意**: MCPツールは**検索・参照のみ**に使用します（ページ/チケットの作成・更新には使用しません）。

参考: [Atlassian MCP](https://www.atlassian.com/ja/platform/remote-mcp-server) - 参照用途のみ

### 自動化ワークフロー

#### 要件定義 → Confluence
```text
/kiro:spec-requirements <feature>
  ↓ .kiro/specs/<feature>/requirements.md 生成
  ↓ jj commit & push → GitHub
  ↓ 
スクリプト実行（必須）:
  npm run phase:run <feature> requirements
  - Markdown → Confluence変換
  - REST APIでページ作成（confluence-sync.ts）
  - プロジェクトラベル付与
  - spec.json自動更新
```

#### 設計 → Confluence + 見積もり
```text
/kiro:spec-design <feature>
  ↓ design.md生成（見積もり含む）
  ↓ jj commit & push
  ↓
スクリプト実行（必須）:
  npm run phase:run <feature> design
  - REST APIでConfluence同期（confluence-sync.ts）
  - spec.json自動更新
  - 見積もりExcel出力（オプション）
```

#### タスク分割 → JIRA
```text
/kiro:spec-tasks <feature>
  ↓ tasks.md生成（土日・祝日を除いた営業日ベースで計算）
  ↓ jj commit & push
  ↓
スクリプト実行（必須）:
  npm run phase:run <feature> tasks
  - REST APIでEpic作成（jira-sync.ts）
  - REST APIでStory作成（全ストーリー、階層構造）
  - 見積もりポイント設定
  - spec.json自動更新
```

**重要**: マイルストーンとタイムラインは営業日ベース
- 土曜日・日曜日を除外
- 祝日を除外（該当する場合）
- 曜日表記を追加（月、火、水、木、金）
- 営業日カウント（Day 1, Day 2...）を明記

#### 実装 → GitHub PR + JIRA更新
```text
/kiro:spec-impl <feature> <tasks>
  ↓ TDD実装
  ↓ jj commit & push
  ↓
Scripts:
  - GitHub PR作成
  - JIRA ステータス更新
```

### カスタムコマンド

- `/kiro:confluence-sync <feature> [type]` - Confluence同期
- `/kiro:project-switch <project_id>` - プロジェクト切り替え

### npm Scripts

```bash
# フェーズ実行（Confluence/JIRA自動作成）
npm run phase:run <feature> requirements  # 要件定義フェーズ実行
npm run phase:run <feature> design        # 設計フェーズ実行
npm run phase:run <feature> tasks         # タスク分割フェーズ実行

# フェーズバリデーション
npm run validate:phase <feature> requirements  # 要件定義チェック
npm run validate:phase <feature> design        # 設計チェック
npm run validate:phase <feature> tasks         # タスク分割チェック

# 個別実行（従来通り）
npm run confluence:sync <feature> [type]  # Confluence同期
npm run jira:sync <feature>               # JIRA連携
npm run github:create-pr <branch>         # PR作成
npm run project:list                       # プロジェクト一覧
npm run project:dashboard                  # ダッシュボード生成
npm run multi-estimate                     # 見積もり集計
npm run workflow:run -- --feature <name>  # 統合ワークフロー
```

## Multi-Project Support

### プロジェクト構成

複数リポジトリ、統一ワークフロー：
- 各リポジトリに `.kiro/project.json`
- Confluence共有スペース（ラベルで分類）
- JIRA プロジェクトキー別管理

### プロジェクト一覧

```bash
npm run project:list
```

### リソース管理

```bash
npm run project:dashboard
```

Confluence にプロジェクト横断ダッシュボードを作成

