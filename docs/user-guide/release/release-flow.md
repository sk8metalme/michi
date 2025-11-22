# リリースフロー

このドキュメントでは、michiを使用したプロジェクトでのリリースフローについて説明します。

## リリースフロー全体図

```text
[開発完了]
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase A: PR前の確認（自動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ├─ 単体テスト実行（CI/CD）
    ├─ Lint実行（CI/CD）
    ├─ ビルド実行（CI/CD）
    └─ ✅ すべて成功 → PR作成可能
    ↓
[PR作成・レビュー・マージ]
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase B: リリース準備（手動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ├─ 統合テスト実行（手動）
    ├─ E2Eテスト実行（手動）
    ├─ パフォーマンステスト実行（手動、必要に応じて）
    ├─ セキュリティテスト実行（手動、必要に応じて）
    └─ ✅ すべて成功
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
リリース準備ドキュメント作成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ├─ Confluenceリリース手順書作成
    └─ リリースJIRA起票
    ↓
[タグ作成（手動）]
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CI/CD実行（自動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ├─ 単体テスト実行（CI/CD）
    ├─ Lint実行（CI/CD）
    ├─ ビルド実行（CI/CD）
    └─ ✅ すべて成功 → CI/CD完了
    ↓
[GitHub Release作成（手動）]
    ├─ リリースノート作成（手動）
    ├─ ビルド成果物生成（ローカル、手動）
    └─ GitHub Releaseに添付
    ↓
[リリース完了]
    ↓
[リリースJIRAをクローズ]

※ パッケージpublish/deployはmichiの対象外
```

## Phase A: PR前の自動テスト

詳細は [テスト実行フロー - Phase A](../testing/test-execution-flow.md#phase-a-pr作成前の自動テスト) を参照してください。

### 実行内容

- 単体テスト
- Lint
- ビルド

### 実行方法

CI/CDが自動実行します（GitHub Actions / Screwdriver）。

## Phase B: リリース準備の手動テスト

詳細は [テスト実行フロー - Phase B](../testing/test-execution-flow.md#phase-b-リリース準備時の手動テスト) を参照してください。

### 実行内容

- 統合テスト（推奨）
- E2Eテスト（推奨）
- パフォーマンステスト（任意）
- セキュリティテスト（任意）

### 実行方法

手動で実行します。

## Confluenceリリース手順書作成

Phase B完了後、Confluenceにリリース手順書を作成します。

### リリース手順書の構成

```markdown
# [プロジェクト名] リリース手順書 v1.0.0

## 1. リリース概要

- **リリースバージョン**: v1.0.0
- **リリース予定日**: YYYY-MM-DD
- **リリース担当者**: [名前]
- **承認者**: [名前]

## 2. リリース内容

### 新機能
- [機能名]: 説明

### バグ修正
- [バグ名]: 説明

### 変更点
- [変更内容]: 説明

## 3. 影響範囲

- **影響を受けるシステム**: [システム名]
- **影響を受けるユーザー**: [ユーザー種別]
- **ダウンタイム**: あり/なし

## 4. リリース手順

### 4.1 事前準備

- [ ] Phase Bテスト完了確認
- [ ] リリースJIRA起票
- [ ] 関係者への通知

### 4.2 リリース作業

1. タグ作成

   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. CI/CD実行確認
   - GitHub ActionsまたはScrewdriverのステータス確認

3. GitHub Release作成

   ```bash
   gh release create v1.0.0 --title "Release v1.0.0" --notes-file release-notes.md
   ```

### 4.3 リリース後確認

- [ ] アプリケーションが正常に起動
- [ ] 主要機能の動作確認
- [ ] エラーログの確認

## 5. ロールバック手順

問題が発生した場合の手順：

1. GitHub Releaseを削除
2. タグを削除

   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

3. 前バージョンに戻す

## 6. 連絡先

- **リリース担当者**: [メールアドレス]
- **緊急連絡先**: [電話番号]
```

## リリースJIRA起票

Confluenceリリース手順書作成後、JIRAでリリースチケットを起票します。

### JIRAチケットの構成

| 項目 | 内容 |
|------|------|
| **プロジェクト** | [プロジェクト名] |
| **課題タイプ** | タスクまたはリリース |
| **要約** | Release v1.0.0 |
| **説明** | 下記参照 |
| **優先度** | 高 |
| **担当者** | [リリース担当者] |
| **期限** | [リリース予定日] |

### JIRAチケット説明文のテンプレート

```markdown
## リリース情報

- **バージョン**: v1.0.0
- **リリース予定日**: YYYY-MM-DD
- **Confluence手順書**: [リンク]
- **GitHub PR**: [リンク]

## リリース内容

### 新機能
- [機能名]: 説明

### バグ修正
- [バグ名]: 説明

## Phase B完了確認

- [x] 統合テスト
- [x] E2Eテスト
- [x] パフォーマンステスト（該当する場合）
- [x] セキュリティテスト（該当する場合）

## リリース作業チェックリスト

- [ ] タグ作成
- [ ] CI/CD成功確認
- [ ] GitHub Release作成
- [ ] 動作確認
- [ ] 関係者への完了報告

## 関連チケット

- [開発チケット一覧]
```

### JIRAチケット起票コマンド例

```bash
# JIRA CLIを使用する場合
jira create \
  --project=PROJ \
  --type=Task \
  --summary="Release v1.0.0" \
  --description="$(cat release-description.md)" \
  --priority=High \
  --assignee=username
```

## タグ作成

Phase Bのすべてのテストが成功し、リリース準備ドキュメントを作成したら、リリースタグを作成します。

### タグ命名規則

セマンティックバージョニングに従います：

```text
v<major>.<minor>.<patch>
```

例：
- `v1.0.0` - 初回リリース
- `v1.1.0` - 機能追加
- `v1.1.1` - バグ修正

### タグ作成コマンド

```bash
# タグ作成
git tag -a v1.0.0 -m "Release version 1.0.0"

# リモートにプッシュ
git push origin v1.0.0
```

## タグ作成後のCI/CD

タグがプッシュされると、CI/CDが自動的に実行されます：

1. 単体テスト
2. Lint
3. ビルド

すべて成功すると、CI/CD完了です。

## GitHub Release作成

CI/CD完了後、手動でGitHub Releaseを作成します。

### GitHub Release作成手順

#### 方法1: GitHub CLI（推奨）

```bash
# リリースノートを作成
cat > release-notes.md <<EOF
## 新機能

- ユーザー認証機能を追加
- ダッシュボード画面を実装

## バグ修正

- ログイン時のエラーハンドリングを改善

## 変更点

- データベーススキーマを更新
EOF

# GitHub Releaseを作成
gh release create v1.0.0 \
  --title "Release v1.0.0" \
  --notes-file release-notes.md
```

#### 方法2: GitHub Web UI

1. GitHubリポジトリページを開く
2. 「Releases」→「Draft a new release」をクリック
3. タグを選択: `v1.0.0`
4. リリースタイトルを入力: `Release v1.0.0`
5. リリースノートを記述
6. 「Publish release」をクリック

### リリースノートの書き方

```markdown
## 新機能

- [機能名]: 説明

## バグ修正

- [バグ名]: 説明

## 変更点

- [変更内容]: 説明

## 既知の問題

- [問題]: 説明（該当する場合）
```

## ビルド成果物の添付（任意）

必要に応じて、ビルド成果物をGitHub Releaseに添付します。

### ビルド成果物の生成例

```bash
# Node.js
npm run build
tar -czf dist.tar.gz dist/

# Java (Gradle)
./gradlew build
cp build/libs/app-1.0.0.jar ./

# PHP
composer install --no-dev
tar -czf vendor.tar.gz vendor/
```

### GitHub Releaseへの添付

```bash
# GitHub CLIで添付
gh release upload v1.0.0 dist.tar.gz

# または、Web UIでアップロード
```

## リリース完了後の作業

### リリースJIRAをクローズ

```bash
# JIRA CLIを使用する場合
jira close PROJ-123 \
  --comment="Release v1.0.0 completed successfully"
```

または、JIRA Web UIで：
1. リリースチケットを開く
2. ステータスを「完了」に変更
3. 完了コメントを追加

### 関係者への報告

リリース完了を関係者に報告します：

- プロジェクトマネージャー
- QAチーム
- カスタマーサポート
- エンドユーザー（必要に応じて）

## パッケージpublish/deployについて

**michiの対象外**: リリースフローはGitHub Release作成まで。

その後の以下の操作は、利用者が別途実装してください：

- npm publish（Node.js）
- Docker push（Dockerイメージ）
- RPMパッケージ作成（Linux）
- デプロイ処理

## リリースチェックリスト

### Phase A完了確認

- [ ] すべての単体テストが成功
- [ ] Lintエラーがない
- [ ] ビルドが成功
- [ ] PRがマージ済み

### Phase B完了確認

- [ ] 統合テストが成功（該当する場合）
- [ ] E2Eテストが成功（該当する場合）
- [ ] パフォーマンステストが成功（該当する場合）
- [ ] セキュリティテストが成功（該当する場合）

### リリース準備ドキュメント作成

- [ ] Confluenceリリース手順書を作成
- [ ] リリースJIRAを起票
- [ ] 関係者にリリース予定を通知

### タグ作成前確認

- [ ] Phase Bのすべてのテストが成功
- [ ] Confluenceリリース手順書が承認済み
- [ ] リリースJIRAが起票済み
- [ ] 重大なバグが残っていない
- [ ] リリースノートを準備済み

### GitHub Release作成前確認

- [ ] タグ作成後のCI/CDが成功
- [ ] リリースノートが完成
- [ ] ビルド成果物を準備済み（該当する場合）

### リリース完了後

- [ ] GitHub Releaseを作成
- [ ] リリースJIRAをクローズ
- [ ] 関係者にリリース完了を報告

## トラブルシューティング

### タグ作成後のCI/CDが失敗した場合

1. **タグを削除**

   ```bash
   # ローカルのタグを削除
   git tag -d v1.0.0

   # リモートのタグを削除
   git push origin :refs/tags/v1.0.0
   ```

2. **問題を修正**

   ```bash
   # バグ修正のPRを作成
   # Phase A → マージ → Phase B

   # Phase B完了後、タグを再作成
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

### GitHub Release作成後に問題が見つかった場合

1. **GitHub Releaseを削除**（Web UIまたはCLI）
2. **タグを削除**（上記手順）
3. **問題を修正**
4. **Phase A → Phase B → Confluenceドキュメント更新 → タグ作成 → GitHub Release作成**

## 次のステップ

- [CI/CD設定](./ci-setup.md): GitHub Actions/Screwdriverの設定方法
- [テスト実行フロー](../testing/test-execution-flow.md): Phase A/Bの詳細
