---
name: review-dev
description: |
  実装検証スキル

  コード品質チェック、テストカバレッジ確認、セキュリティ脆弱性スキャンを行います。

trigger_keywords:
  - "実装を検証"
  - "実装レビュー"
  - "review-dev"
---

# review-dev: 実装検証

実装検証スキルは、実装されたコードの品質、テストカバレッジ、セキュリティ脆弱性を確認します。

## 概要

このスキルは以下を実行します：

1. **コード品質チェック**:
   - ESLint / Prettier / Checkstyle などの静的解析
   - コードの複雑度測定
   - コードスメル検出
2. **テストカバレッジ確認**:
   - カバレッジ95%以上を確認
   - 未カバー箇所を特定
3. **セキュリティ脆弱性スキャン**:
   - Snyk / Trivy などのセキュリティスキャン
   - OWASP Top 10 準拠確認
4. **設計書との整合性確認**:
   - 実装が設計書に準拠しているか
5. **検証結果レポート**: 問題点と改善提案を記載

## 使用方法

### 自動発動

以下のキーワードで自動発動します：
- 「実装を検証したい」
- 「実装レビュー」
- `dev` スキルの Phase 6.7 で自動実行

### 明示的発動

```bash
/michi review-dev {pj-name}
```

**例**:
```bash
/michi review-dev user-auth
```

## 実行内容

### 1. コード品質チェック

**静的解析**:
```bash
npm run lint
npm run format:check
```

**コード複雑度測定**:
- Cyclomatic Complexity: 10以下を推奨
- Cognitive Complexity: 15以下を推奨

**コードスメル検出**:
- 重複コード
- 長すぎる関数（50行以上）
- 長すぎるパラメータリスト（5個以上）
- 深いネスト（4階層以上）

### 2. テストカバレッジ確認

```bash
npm test -- --coverage
```

**カバレッジ目標**:
- Statements: 95%以上
- Branches: 90%以上
- Functions: 95%以上
- Lines: 95%以上

**未カバー箇所の特定**:
- カバレッジレポートを分析
- 未テスト箇所を特定
- 追加テストを提案

### 3. セキュリティ脆弱性スキャン

**依存パッケージスキャン**:
```bash
npm audit
snyk test
```

**コンテナイメージスキャン**:
```bash
trivy image {image-name}
```

**OWASP Top 10 準拠確認**:
- SQL Injection対策の実装確認
- XSS対策の実装確認
- CSRF対策の実装確認
- 認証・認可の実装確認

### 4. 設計書との整合性確認

以下を確認します：
- API仕様が設計書と一致しているか
- データモデルが設計書と一致しているか
- シーケンス図の処理フローと一致しているか

### 5. 検証結果レポート

検証結果を以下の形式でレポートします：

```markdown
# 実装検証結果: {pj-name}

## サマリー
- **合格/不合格**: 合格
- **コード品質**: ✅ 問題なし
- **テストカバレッジ**: ✅ 96.5% (目標95%以上)
- **セキュリティ**: ⚠️ 軽微な問題1件
- **設計整合性**: ✅ 問題なし

## コード品質

### 静的解析
- ESLint: 0 errors, 0 warnings
- Prettier: フォーマット済み

### コード複雑度
- 最大 Cyclomatic Complexity: 8 (目標10以下)
- 最大 Cognitive Complexity: 12 (目標15以下)

### コードスメル
- 重複コード: 1箇所（utils.ts:45-60）

## テストカバレッジ

- Statements: 96.5%
- Branches: 91.2%
- Functions: 97.1%
- Lines: 96.3%

### 未カバー箇所
- src/auth.ts:line 105-110 (エラーハンドリング)
  - 推奨: 例外発生時のテストを追加

## セキュリティ

### 依存パッケージ
- npm audit: 0 vulnerabilities

### OWASP Top 10
- SQL Injection: ✅ Parameterized Query使用
- XSS: ✅ エスケープ処理実装
- CSRF: ⚠️ CSRF tokenが未実装
  - 推奨: CSRF tokenを追加

## 設計整合性

- API仕様: ✅ 設計書と一致
- データモデル: ✅ 設計書と一致
- シーケンス図: ✅ 処理フローと一致
```

## 次のステップ

実装検証が完了したら、次のステップに進みます：

### 問題がある場合: 修正

問題を修正して、再度検証を実行します。

```bash
# 修正後
/michi review-dev {pj-name}
```

### 問題がない場合: PR作成またはアーカイブ

```bash
# PR作成
gh pr create --title "feat: user authentication" --body "..."

# または全タスク完了時はアーカイブ
/michi archive-pj {pj-name}
```

## 参照

- **コード品質ガイドライン**: `~/.claude/team/CLAUDE-team-standards.md`
- **セキュリティガイドライン**: `~/.claude/security/CLAUDE-security-policy.md`
- **ワークフロー全体**: `../references/workflow-guide.md`
- **コマンドリファレンス**: `../references/command-reference.md`

---

**関連スキル**:
- `dev` - TDD実装（修正時）
- `archive-pj` - プロジェクトアーカイブ（完了時）
