---
description: Create comprehensive technical design for a specification (Michi version with test planning flow)
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name> [-y]
---

# Michi: Spec Design with Test Planning Flow

## Base Command Reference
@.claude/commands/kiro/spec-design.md

## Michi Extension: Next Phase Guidance

設計ドキュメント生成完了後、以下のフローを案内:

### Next Phase: Phase 0.3 - テストタイプの選択

設計が完了したら、タスク生成前に **Phase 0.3-0.4: テスト計画** を実施してください。

#### 1. Phase 0.3: テストタイプの選択

設計書の Testing Strategy セクションを基に、必要なテストタイプを決定してください。

**参照ドキュメント**: `docs/user-guide/testing/test-planning-flow.md`

**選択肢**:
- 単体テスト (Unit Test)
- 統合テスト (Integration Test)
- E2Eテスト (End-to-End Test)
- パフォーマンステスト (Performance Test)
- セキュリティテスト (Security Test)

#### 2. Phase 0.4: テスト仕様書の作成

選択したテストタイプに応じて、テンプレートを使用してテスト仕様書を作成してください。

**テンプレート**:
- 単体テスト: `docs/user-guide/templates/test-specs/unit-test-spec-template.md`
- 統合テスト: `docs/user-guide/templates/test-specs/integration-test-spec-template.md`
- E2Eテスト: `docs/user-guide/templates/test-specs/e2e-test-spec-template.md`
- パフォーマンステスト: `docs/user-guide/templates/test-specs/performance-test-spec-template.md`
- セキュリティテスト: `docs/user-guide/templates/test-specs/security-test-spec-template.md`

**出力先**: `.kiro/specs/{feature}/test-specs/`

### After Test Planning: Task Generation

Phase 0.3-0.4 完了後、以下のステップに進んでください:

**推奨フロー**:
1. `/michi:validate-design {feature}` で設計レビューを実施（任意）
2. `/kiro:spec-tasks {feature}` でタスク生成

**クイックフロー**:
- `/kiro:spec-tasks {feature} -y` で自動承認してタスク生成

**重要**: テスト計画（Phase 0.3-0.4）を完了してからタスク生成することで、実装タスクにテスト実装が適切に含まれます。

---

**Michi 固有機能**: このコマンドは cc-sdd 標準の `/kiro:spec-design` を拡張し、Michi 固有のテスト計画フロー（Phase 0.3-0.4）を Next Phase として案内します。
