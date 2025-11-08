# テスト・検証ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## E2Eテストシナリオ

### シナリオ1: 単一機能の完全フロー

新機能「ユーザー認証」を要件定義からリリースまで実行：

#### Step 1: 要件定義
```bash
# 凡例
/kiro:spec-init <機能説明>
/kiro:spec-requirements <feature>
jj commit -m "docs: <feature> 要件定義"
jj git push
npm run confluence:sync <feature> requirements

# 具体例
/kiro:spec-init OAuth 2.0を使ったユーザー認証機能
/kiro:spec-requirements user-auth
jj commit -m "docs: ユーザー認証 要件定義"
jj git push
npm run confluence:sync user-auth requirements
```

**確認ポイント**:
- [ ] `.kiro/specs/user-auth/requirements.md` が生成された
- [ ] Confluenceページが作成された
- [ ] ラベル `project:michi, requirements, user-auth` が付与された
- [ ] 企画・部長にメンション通知が届いた

#### Step 2: 設計
```bash
# 凡例
/kiro:spec-design <feature>
jj commit -m "docs: <feature> 設計"
jj git push
npm run confluence:sync <feature> design
npm run excel:sync <feature>

# 具体例
/kiro:spec-design user-auth
jj commit -m "docs: ユーザー認証 設計"
jj git push
npm run confluence:sync user-auth design
npm run excel:sync user-auth
```

**確認ポイント**:
- [ ] `.kiro/specs/user-auth/design.md` が生成された
- [ ] 見積もりセクションが含まれている
- [ ] Confluenceページが作成された（親: 要件定義）
- [ ] Excelファイルが出力された

#### Step 3: タスク分割
```bash
# 凡例
/kiro:spec-tasks <feature>
jj commit -m "docs: <feature> タスク分割"
jj git push
npm run jira:sync <feature>

# 具体例
/kiro:spec-tasks user-auth
jj commit -m "docs: ユーザー認証 タスク分割"
jj git push
npm run jira:sync user-auth
```

**確認ポイント**:
- [ ] `.kiro/specs/user-auth/tasks.md` が生成された
- [ ] JIRA Epicが作成された
- [ ] JIRA Storyが作成された（複数）
- [ ] Epic-Storyリンクが設定された

#### Step 4: 実装
```
/kiro:spec-impl user-auth FE-1,BE-1
jj commit -m "feat: ユーザー認証実装 [MICHI-123]"
jj bookmark create michi/feature/user-auth -r '@-'
jj git push --bookmark michi/feature/user-auth --allow-new
npm run github:create-pr michi/feature/user-auth
```

**確認ポイント**:
- [ ] テストが先に書かれた（TDD）
- [ ] コードが実装された
- [ ] PRが作成された
- [ ] JIRA ステータスが "In Review" に更新された

### シナリオ2: マルチプロジェクト横断テスト

3つのプロジェクトで同時に要件定義を実施：

```bash
# プロジェクトA
cd customer-a-service-1
/kiro:spec-requirements payment-feature
npm run confluence:sync payment-feature

# プロジェクトB
cd ../customer-b-api
/kiro:spec-requirements user-api
npm run confluence:sync user-api

# プロジェクトC（Michi）
cd ../michi
/kiro:spec-requirements integration-hub
npm run confluence:sync integration-hub

# 横断確認
npm run project:list
npm run project:dashboard
```

**確認ポイント**:
- [ ] 3つのプロジェクトすべてでページ作成成功
- [ ] Confluenceダッシュボードに3プロジェクト表示
- [ ] ラベルでフィルタリング可能
- [ ] JIRAダッシュボードに3プロジェクト表示

## チームフィードバック収集

### フィードバック項目

#### 使いやすさ
- [ ] Cursorコマンドは直感的か？
- [ ] ドキュメントは理解しやすいか？
- [ ] エラーメッセージは明確か？

#### 効率性
- [ ] 要件定義の時間短縮できたか？
- [ ] Confluence/JIRA連携は手間を減らしたか？
- [ ] 全体の開発スピードは向上したか？

#### 品質
- [ ] AIが生成する仕様書の品質は十分か？
- [ ] テンプレートは実務に適しているか？
- [ ] 見積もりの精度は妥当か？

### フィードバック方法

GitHub Issuesで収集：
```bash
gh issue create --title "フィードバック: <内容>" --body "<詳細>"
```

ラベル:
- `feedback:usability`: 使いやすさ
- `feedback:efficiency`: 効率性
- `feedback:quality`: 品質

## 継続的改善

### Week 1-2: パイロット運用
- 1プロジェクトで全フロー実行
- 問題点を記録
- フィードバック収集

### Week 3-4: 改善
- テンプレート調整
- スクリプト改善
- ドキュメント更新

### Week 5-6: 横展開
- 2-3プロジェクトに展開
- チーム全体でフィードバック

### Week 7-8: 最適化
- ベストプラクティス確立
- 自動化範囲の拡大
- ツールの安定化

## メトリクス

### 効率化指標

| 指標 | 導入前 | 導入後 | 改善率 |
|------|--------|--------|--------|
| 要件定義時間 | 3日 | 0.5日 | 83% |
| 設計時間 | 5日 | 1日 | 80% |
| タスク分割時間 | 2日 | 0.5日 | 75% |
| ドキュメント作成 | 2日 | 0.2日 | 90% |

### 品質指標

| 指標 | 目標値 | 測定方法 |
|------|--------|---------|
| 仕様書の完成度 | 90%以上 | レビュースコア |
| 見積もり精度 | ±20%以内 | 実績との比較 |
| テストカバレッジ | 95%以上 | 自動測定 |

## 次のステップ

1. パイロットプロジェクトでE2Eテスト実行
2. フィードバック収集
3. 改善実施
4. 他プロジェクトに横展開
5. ベストプラクティス確立

