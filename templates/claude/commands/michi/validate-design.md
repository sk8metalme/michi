---
name: /michi:validate-design
description: Interactive technical design validation with test planning readiness check (Michi version)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch, AskUserQuestion
argument-hint: <feature-name>
---

# Michi: Design Validation with Test Planning

## Base Command Reference
@.claude/commands/kiro/validate-design.md

## Development Guidelines

{{DEV_GUIDELINES}}

## Michi Extension: Test Planning Readiness Check

設計レビューで GO 判定後、Phase 0.3-0.4（テスト計画）が完了しているか確認します。

### Post-Validation Checklist

設計が承認された場合（GO Decision）、以下を確認してください：

#### テスト計画完了確認

- [ ] `.kiro/specs/$1/test-specs/` ディレクトリが存在するか
- [ ] テスト仕様書が作成されているか（Phase 0.4 完了）
- [ ] テストタイプが選択されているか（Phase 0.3 完了）

**未完了の場合の推奨アクション**:

Phase 0.3-0.4 が未完了の場合は、タスク生成前に完了することを推奨します：

1. **Phase 0.3: テストタイプの選択**
   - 参照: `docs/user-guide/testing/test-planning-flow.md#phase-03-テストタイプの選択`
   - 設計書の Testing Strategy セクションを基に決定

2. **Phase 0.4: テスト仕様書の作成**
   - テンプレート:
     - 単体テスト: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
     - 統合テスト: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
   - 出力先: `.kiro/specs/$1/test-specs/`

3. **完了後**: `/kiro:spec-tasks $1` でタスク生成に進む

### Next Phase Guidance

**テスト計画完了済みの場合**:
- `/kiro:spec-tasks $1` でタスク生成

**テスト計画未完了の場合**:
- Phase 0.3-0.4 を実施してから `/kiro:spec-tasks $1`
- または `/michi:spec-design $1` を再実行して Next Phase ガイダンスを確認

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:validate-design` を拡張し、Michi 固有のテスト計画完了確認を追加します。
