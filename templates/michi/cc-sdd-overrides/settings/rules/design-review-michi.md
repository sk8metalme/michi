# Michi Extension: Design Review with Test Planning Readiness

> **Michi 固有拡張**: この設計レビュールールは cc-sdd 標準の `design-review.md` を拡張し、Michi 固有のテスト計画準備状況評価を追加します。

## Base Rules Reference
@.kiro/settings/rules/design-review.md

## Additional Review Criteria

### 5. Testing Strategy Readiness (Michi Extension)

設計レビュー時に、Phase 0.3-0.4（テスト計画）の準備状況も確認してください：

#### 評価ポイント

- [ ] **Testing Strategy セクションの詳細度**: Phase 0.3 のテストタイプ選択を支援できる十分な詳細を含むか
  - 各テストタイプ（単体/統合/E2E/パフォーマンス/セキュリティ）の必要性が検討されているか
  - テストシナリオが具体的に記述されているか
  - テスト対象コンポーネントが明確か

- [ ] **トレーサビリティ**: テストシナリオが requirements.md のトレーサビリティと整合しているか
  - 各要件に対応するテストシナリオが存在するか
  - 要件IDとテストシナリオの紐付けが明確か

- [ ] **非機能要件への対応**: パフォーマンス/セキュリティテストの必要性が検討されているか
  - 高負荷が予想されるシステムでパフォーマンステストが計画されているか
  - 機密データを扱うシステムでセキュリティテストが計画されているか
  - 外部公開APIでセキュリティテストが計画されているか

#### 判定基準

**GO 判定の条件**:
- Testing Strategy セクションが Phase 0.3 のテストタイプ選択に必要な情報を提供している
- テストシナリオが要件とトレーサブルである
- 非機能要件に対するテスト計画が適切に検討されている

**NO-GO 判定の条件**:
- Testing Strategy セクションが不足または不明確
- テストシナリオと要件の紐付けが不明確
- 明らかに必要な非機能テスト（パフォーマンス/セキュリティ）が検討されていない

#### レビュー後の推奨アクション

設計が承認された場合（GO Decision）:
1. Phase 0.3: テストタイプの選択を実施
2. Phase 0.4: テスト仕様書の作成を実施
3. Phase 0.5: タスク分割（`/kiro:spec-tasks`）に進む

詳細は [テスト計画フロー](docs/user-guide/testing/test-planning-flow.md) を参照してください。

---

**使用方法**: この拡張ルールを適用するには、`/michi:validate-design` コマンドを使用してください。
