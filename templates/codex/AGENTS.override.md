# AGENTS.override.md - Michi Project Extensions

このファイルはcc-sddのAGENTS.mdを拡張し、Michi固有のワークフローとルールを追加します。

## Michi Overview

**Michi**は、AI駆動開発を支援するプロジェクト管理・ドキュメント管理フレームワークです。Claude Code、Cursor、Codex CLI、Claude Agent SDKと統合し、効率的な開発フローを実現します。

- **Repository**: https://github.com/sk8metalme/michi
- **Documentation**: `docs/user-guide/`
- **License**: MIT

---

## Michi-Specific Workflows

### 1. Confluence Integration

#### Confluence同期コマンド
```bash
/prompts:confluence-sync FEATURE=<機能名>
```

#### 必要な環境変数
```bash
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

#### プロジェクト設定
`.kiro/project.json`に以下を設定：
```json
{
  "confluenceSpaceKey": "YOUR_SPACE",
  "confluenceLabels": ["ai-development", "michi"]
}
```

#### 同期対象
- 要件定義書（requirements.md）→ Confluenceページ
- 設計書（design.md）→ Confluenceページ
- タスク一覧（tasks.md）→ Confluenceページ（オプション）

---

### 2. JIRA Integration

#### プロジェクトキー設定
`.kiro/project.json`の`jiraProjectKey`を使用してJIRAチケットを管理：
```json
{
  "jiraProjectKey": "MYPROJ"
}
```

#### リリース管理
- JIRAでリリースバージョンを作成
- Confluenceでリリース手順書を管理
- GitHub Releasesと連携

---

### 3. Multi-Language Support

Michiは以下の言語とビルドツールをサポート：

| 言語 | ビルドツール | テストコマンド |
|------|------------|---------------|
| Node.js/TypeScript | npm | `npm test` |
| Java | **Gradle のみ** | `./gradlew test` |
| PHP | Composer | `composer test` |

**重要:** Javaプロジェクトでは**Gradleのみ**を使用してください。Mavenは使用しません。

---

### 4. Test Strategy - Master Test Approach

Michiは**マスタテスト方式**を採用しています：

#### 基本原則
- テストは常に最新の仕様を反映（phase-0、phase-1のような履歴管理はしない）
- 仕様変更時は既存のテストファイルを更新
- テスト実行時間を一定に保つ

#### Phase構成
- **Phase A**: PR時に自動実行
  - Unit tests
  - Lint
  - Build
- **Phase B**: リリース前に手動実行
  - Integration tests
  - E2E tests
  - Performance tests
  - Security tests

#### テストカバレッジ
- 目標: **95%以上**
- テストは仕様として扱う
- 実装に合わせてテストを変更しない（仕様通りでない場合のみ修正）

---

### 5. CI/CD Integration

#### サポート対象
- **GitHub Actions**
- **Screwdriver**

#### 推奨ワークフロー
```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Phase A Tests
        run: |
          npm install
          npm run test:unit
          npm run lint
          npm run build
```

---

### 6. Release Flow

#### セマンティックバージョニング
```
v<major>.<minor>.<patch>
例: v1.2.3
```

#### リリース手順
1. **Confluenceでリリース手順書作成**
   - テンプレート: `.kiro/templates/release-procedure.md`
2. **JIRAでリリースチケット起票**
   - チケットタイプ: Release
   - バージョン: 自動生成
3. **GitHub Releaseの作成**
   - リリースノート自動生成
   - タグ付け

---

## Coding Standards

### TypeScript/Node.js
- **Style Guide**: Airbnb JavaScript Style Guide準拠
- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checking**: `tsc --noEmit`

### Java (Gradle)
- **Style Guide**: Google Java Style Guide
- **Build Tool**: Gradle 8.x
- **Test Framework**: JUnit 5
- **Coverage**: JaCoCo

### PHP
- **Style Guide**: PSR-12
- **Build Tool**: Composer
- **Test Framework**: PHPUnit
- **Static Analysis**: PHPStan

---

## File Structure Standards

### .kiro/ Directory
```
.kiro/
├── project.json              # プロジェクトメタデータ
├── specs/                    # 機能仕様（cc-sdd管理）
│   └── {feature}/
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       └── spec.json
├── steering/                 # AI指導ルール（cc-sdd管理）
│   ├── structure.md
│   ├── tech.md
│   └── product.md
└── settings/                 # 共通ルール（cc-sdd管理）
```

### Michi Extensions
```
.kiro/
├── project.json              # ⭐ Michi固有
└── templates/                # ⭐ Michi固有
    ├── confluence-page.md
    ├── jira-ticket.md
    └── release-procedure.md
```

---

## Security Policy

### 環境変数管理
- **絶対禁止**: APIキー、トークンのハードコード
- **推奨**: `.env`ファイル + `.gitignore`
- **CI/CD**: GitHub Secrets / Screwdriver Secrets

### 依存関係管理
- 定期的な脆弱性スキャン（`npm audit`, `snyk`）
- 依存ライブラリの最小化
- 信頼できるソースからのみダウンロード

---

## Workflow Integration

### cc-sdd + Michi 連携フロー

1. **プロジェクト初期化**
   ```bash
   # cc-sddインストール
   npx cc-sdd@latest --codex --lang ja

   # Michi拡張インストール
   npx michi setup --codex
   ```

2. **仕様作成（cc-sdd）**
   ```bash
   /kiro:spec-init FEATURE=user-auth
   /kiro:spec-requirements FEATURE=user-auth
   /kiro:spec-design FEATURE=user-auth
   ```

3. **Confluence同期（Michi）**
   ```bash
   /prompts:confluence-sync FEATURE=user-auth
   ```

4. **実装とテスト（cc-sdd + TDD）**
   ```bash
   /kiro:spec-tasks FEATURE=user-auth
   /kiro:spec-impl FEATURE=user-auth
   ```

5. **検証（cc-sdd）**
   ```bash
   /kiro:validate-impl FEATURE=user-auth
   ```

---

## Communication Guidelines

### 日本語優先
- コミュニケーションは日本語を基本とする
- 技術用語は適切に英語/日本語を使い分ける

### 質問と確認
- 不明な点は必ず質問し精度を高めることを最優先する
- AskUserQuestionツールを積極的に活用

---

## Reference Links

- [Michi Documentation](https://github.com/sk8metalme/michi/tree/main/docs)
- [cc-sdd Documentation](https://github.com/gotalab/cc-sdd)
- [Confluence API](https://developer.atlassian.com/cloud/confluence/rest/v2/)
- [JIRA API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

---

**Note**: このファイルはCodex CLIの`AGENTS.md`を上書き（override）するものではなく、cc-sddの基本ルールに**追加**される形で適用されます。
