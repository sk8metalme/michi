# スキル・サブエージェント連携ガイド

## 概要

Michiは、ai-agent-setupの汎用スキル・サブエージェントと連携し、開発ワークフローの品質を向上させます。

## 連携対象

### スキル（Claude Code Skills）

| スキル名 | 用途 |
|---------|------|
| design-review | UIデザイン品質ガイドライン |
| oss-license | OSSライセンス確認手順 |
| stable-version | バージョン選定基準 |
| e2e-first-planning | E2Eファースト設計指針 |

### サブエージェント（Claude Code Sub-agents）

| サブエージェント | 用途 | スラッシュコマンド |
|----------------|------|-------------------|
| design-reviewer | デザイン品質レビュー | `/michi:design-review` |
| oss-license-checker | ライセンス確認 | `/michi:license-check` |
| stable-version-auditor | Stableバージョン確認 | `/michi:version-audit` |
| e2e-first-planner | E2Eプロトタイプ計画 | `/michi:e2e-plan` |
| pr-resolver | PRコメントresolve | `/michi:pr-resolve` |

## セットアップ

### オプション1: セットアップ時に一括インストール

```bash
npx @sk8metal/michi-cli setup-existing \
  --claude \
  --lang ja \
  --with-agent-skills
```

このコマンドは以下を実行します：
1. Michiワークフローのセットアップ
2. スキル/サブエージェントを `~/.claude/` にインストール
3. スラッシュコマンドを `.claude/commands/michi/` に配置

### オプション2: 既存プロジェクトに追加

既にMichiを導入済みの場合：

```bash
# スキル/サブエージェントのみをインストール
npx @sk8metal/michi-cli setup-existing \
  --claude \
  --with-agent-skills
```

## スラッシュコマンドの使い方

### /michi:design-review

UIコンポーネントのデザイン品質をレビューします。

**使用タイミング**:
- UI/フロントエンドコードの実装後
- PR作成前のセルフレビュー

**レビュー観点**:
- アクセシビリティ（WCAG 2.1準拠）
- レスポンシブデザイン
- デザインシステムとの整合性
- UXベストプラクティス

**使用例**:
```bash
/michi:design-review
```

---

### /michi:license-check

依存パッケージのOSSライセンスを確認します。

**使用タイミング**:
- 新しいライブラリを追加した時
- Phase A（PR前自動テスト）
- Phase 4（リリース準備）

**チェック項目**:
- ライセンスタイプの確認
- GPL等のコピーレフト条項
- 商用利用の可否
- ライセンス互換性

**使用例**:
```bash
/michi:license-check
```

---

### /michi:version-audit

依存パッケージのバージョンを確認し、Stable/LTSバージョンを推奨します。

**使用タイミング**:
- Phase 0.2（設計）での技術選定時
- 依存パッケージのバージョン指定時
- アップグレード検討時

**確認観点**:
- Stableバージョンかどうか
- LTSバージョンの利用可否
- EOL（End of Life）の確認

**使用例**:
```bash
/michi:version-audit
```

---

### /michi:e2e-plan

E2Eファースト方式でタスク分割を計画します。

**使用タイミング**:
- Phase 0.5（タスク分割）
- `/kiro:spec-tasks` 実行前

**計画方針**:
- ミニマム動作確認可能な単位を優先
- E2Eテスト可能なマイルストーン設定
- Walking Skeletonアプローチ

**使用例**:
```bash
/michi:e2e-plan
```

---

### /michi:pr-resolve

PRレビューコメントへの対応を支援します。

**使用タイミング**:
- PRレビューコメントへの対応完了後
- Phase A（PR前チェック）

**機能**:
- 未解決コメントの一覧化
- 対応状況の確認
- マージ可能状態の検証

**使用例**:
```bash
/michi:pr-resolve
```

## 既存コマンドとの連携

Michiの既存コマンドは、適切なタイミングでこれらのスラッシュコマンドを推奨します。

### /kiro:spec-tasks（タスク分割）

**推奨**: タスク分割前に `/michi:e2e-plan` を実行

```markdown
## Recommended: E2E-First Planning

タスク分割を行う前に、`/michi:e2e-plan` コマンドの使用を検討してください。
```

### /kiro:spec-impl（TDD実装）

**推奨**: UI実装時に `/michi:design-review` を実行

```markdown
1. **Design Review (/michi:design-review)** - Recommended for UI Components
   - UI/フロントエンドコードを実装した場合、`/michi:design-review` を使用
```

## トラブルシューティング

### スキル/サブエージェントが見つからない

**症状**: コマンド実行時に「スキルが見つかりません」エラー

**解決策**:
```bash
# スキル/サブエージェントを再インストール
npx @sk8metal/michi-cli setup-existing \
  --claude \
  --with-agent-skills
```

### サブエージェントが自動発動しない

**原因**: サブエージェントの自動発動は保証されていません。

**解決策**: スラッシュコマンドで明示的に呼び出してください。

```bash
# 明示的呼び出し（推奨）
/michi:design-review
```

## 参考資料

- [Claude Code Skills Documentation](https://docs.claude.com/ja/docs/claude-code/skills)
- [Claude Code Sub-agents Documentation](https://docs.claude.com/ja/docs/claude-code/sub-agents)
- [ai-agent-setup Repository](https://github.com/sk8metalme/ai-agent-setup)

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-05 | 初版作成 |
