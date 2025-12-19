# Michi 設定統合設計書 - マイグレーション戦略と後方互換性

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 7. マイグレーション戦略

### 7.1 移行の概要

#### 7.1.1 移行が必要な理由

新しい設定システムへの移行により、以下の利点が得られます：

- **設定の一元管理**: 組織レベルの認証情報を全プロジェクトで共有
- **セキュリティの強化**: 認証情報を適切なファイル（`~/.michi/.env`）に集約し、パーミッション管理を強化
- **メンテナンス性の向上**: 設定変更が容易になり、チーム全体での管理が簡素化
- **将来の拡張性**: 新機能（暗号化、複数組織サポート等）の基盤を構築

#### 7.1.2 移行しない場合のリスク

- **v1.0.0以降でサポート終了**: 旧形式（`global.env`、`GITHUB_REPO`）は完全に削除されます
- **セキュリティ警告の継続表示**: 非推奨機能使用時に警告が表示され続けます
- **新機能が利用不可**: v1.1.0以降の新機能（暗号化等）が使用できません
- **互換性の問題**: 将来のバージョンで動作しなくなる可能性があります

### 7.2 移行パターン

#### 7.2.1 パターンA: 単一プロジェクトの移行（最も一般的）

**対象**: 1つのプロジェクトで Michi を使用しているユーザー

**手順**:
1. グローバル設定を作成: `michi config:global`
2. プロジェクト設定を移行: `michi migrate`
3. 動作確認

**推定時間**: 10-15分

**詳細手順**:
```bash
# ステップ1: グローバル設定の作成
$ michi config:global
# 対話的プロンプトに従って、組織共通の設定を入力

# ステップ2: プロジェクトディレクトリに移動
$ cd /path/to/your/project

# ステップ3: 移行ツールを実行
$ michi migrate
# 変更内容を確認し、承認

# ステップ4: 動作確認
$ michi init --help
# コマンドが正常に動作することを確認
```

#### 7.2.2 パターンB: 複数プロジェクトの一括移行

**対象**: 複数のプロジェクトで Michi を使用しているユーザー

**手順**:
1. グローバル設定を一度作成
2. 各プロジェクトで `migrate` を実行
3. （オプション）スクリプト化して自動実行

**推定時間**: 5分/プロジェクト

**一括移行スクリプト例**:
```bash
#!/bin/bash

# グローバル設定を一度だけ作成
michi config:global

# プロジェクトリスト
PROJECTS=(
  "/path/to/project-a"
  "/path/to/project-b"
  "/path/to/project-c"
)

# 各プロジェクトで移行を実行
for project in "${PROJECTS[@]}"; do
  echo "Migrating $project..."
  cd "$project" || exit
  michi migrate --force  # 自動承認
  echo "✅ $project migrated"
done

echo "🎉 All projects migrated successfully!"
```

#### 7.2.3 パターンC: 新規プロジェクトの開始

**対象**: これから Michi を使い始めるユーザー

**手順**:
1. グローバル設定を作成
2. `michi init` で新規プロジェクト作成

**推定時間**: 5分

```bash
# ステップ1: グローバル設定
$ michi config:global

# ステップ2: 新規プロジェクト作成
$ mkdir my-new-project
$ cd my-new-project
$ michi init

# または、既存プロジェクトに追加
$ cd /path/to/existing-project
$ michi init --existing
```

### 7.3 自動移行ツール: `michi migrate`

#### 7.3.1 コマンド構文

```bash
michi migrate [options]

Options:
  --dry-run          実際には変更せず、変更内容をプレビュー
  --backup-dir DIR   バックアップディレクトリを指定
                     （デフォルト: .michi-backup-YYYYMMDDHHMMSS）
  --force            確認プロンプトをスキップ
  --verbose          詳細なログを表示
  --help             ヘルプを表示
```

#### 7.3.2 実行フロー

```
[1. 現状のスキャン]
  ├─ ~/.michi/config.json の存在確認
  ├─ ~/.michi/.env の存在確認（新形式）
  ├─ ~/.michi/global.env の存在確認（旧形式）
  ├─ .kiro/project.json の存在確認
  └─ .env の存在確認
  ↓
[2. 変更内容のプレビュー]
  ├─ 組織共通設定の抽出（N項目）
  ├─ プロジェクト固有設定の保持（M項目）
  ├─ 旧形式ファイルのリネーム（該当する場合）
  └─ 変更内容の表示
  ↓
[3. ユーザー確認]
  ├─ 変更内容の確認
  └─ 続行するか確認（--force でスキップ）
  ↓
[4. バックアップ作成]
  ├─ .michi-backup-YYYYMMDDHHMMSS/ ディレクトリ作成
  ├─ 既存ファイルをすべてコピー
  └─ バックアップの場所を表示
  ↓
[5. 設定の分離・移行]
  ├─ .env から組織共通設定を抽出
  ├─ ~/.michi/.env に書き込み（chmod 600）
  ├─ .env を更新（プロジェクト固有設定のみ）
  └─ 旧形式ファイルのリネーム（該当する場合）
  ↓
[6. バリデーション]
  ├─ ConfigLoader で設定を読み込み
  ├─ 必須項目のチェック
  └─ エラーがあれば表示
  ↓
[7. 完了レポート]
  ├─ 変更内容のサマリー
  ├─ バックアップの場所
  ├─ 次のステップ
  └─ トラブルシューティングへのリンク
```

##### 7.3.3 実行例

**例1: 単一プロジェクトの移行（Pattern A）**

```bash
$ cd /Users/username/Work/git/my-project
$ michi migrate

🔄 Michi 設定移行ツール
================================================

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ✓ .michi/config.json 検出
  ✓ .env 検出
  ✓ project.json 検出

[2] 移行が必要な設定を分析中...
  ℹ 以下の設定をグローバル化します:
    - CONFLUENCE_URL
    - CONFLUENCE_USERNAME
    - CONFLUENCE_API_TOKEN
    - JIRA_URL
    - JIRA_USERNAME
    - JIRA_API_TOKEN
    - GITHUB_TOKEN
    - GITHUB_USERNAME
    - GITHUB_EMAIL
    - GITHUB_ORG

  ℹ 以下の設定はプロジェクト固有のままです:
    - GITHUB_REPO (→ project.json.repository に統合)
    - PROJECT_NAME (→ project.json.projectId)

[3] 変更内容の確認
  変更されるファイル:
    - ~/.michi/.env (新規作成)
    - .env (更新: 10項目削除、1項目追加)
    - project.json (更新: repository フィールド追加)

  続行しますか? (y/n): y

[4] バックアップ作成中...
  ✓ バックアップ作成: .michi-backup-20250112143022/

[5] 設定の分離・移行中...
  ✓ ~/.michi/.env に組織設定を書き込みました
  ✓ .env を更新しました
  ✓ project.json を更新しました

[6] バリデーション実行中...
  ✓ ConfigLoader で設定を読み込みました
  ✓ すべての必須項目が設定されています

[7] 移行完了！
================================================
✅ 設定の移行が完了しました

変更内容:
  - グローバル設定ファイル作成: ~/.michi/.env (10項目)
  - プロジェクト.env更新: 10項目削除
  - project.json更新: repository フィールド追加

バックアップ:
  - 場所: .michi-backup-20250112143022/
  - 復元方法: michi migrate --rollback .michi-backup-20250112143022

次のステップ:
  1. 設定を確認: michi config:validate
  2. 動作確認: michi confluence:sync {feature} --dry-run
  3. 問題があれば: docs/michi-development/design/config-unification.md#7.7

移行ログ: .michi/migration.log
```

**例2: 強制実行（確認スキップ）**

```bash
$ michi migrate --force

🔄 Michi 設定移行ツール
================================================
⚠️  --force オプションが指定されています。確認をスキップします。

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ...

[4] バックアップ作成中...
  ✓ バックアップ作成: .michi-backup-20250112143105/

[5] 設定の分離・移行中...
  ...

✅ 設定の移行が完了しました
```

**例3: ドライラン（変更なし）**

```bash
$ michi migrate --dry-run

🔄 Michi 設定移行ツール (ドライランモード)
================================================
⚠️  このモードでは実際の変更は行われません

[1] 現在の設定を検出中...
  ✓ プロジェクトディレクトリ: /Users/username/Work/git/my-project
  ✓ .michi/config.json 検出
  ✓ .env 検出
  ✓ project.json 検出

[2] 移行が必要な設定を分析中...
  ℹ 以下の設定をグローバル化します:
    - CONFLUENCE_URL
    - CONFLUENCE_USERNAME
    - ...

[予定される変更]
  作成: ~/.michi/.env
    CONFLUENCE_URL=https://example.atlassian.net
    CONFLUENCE_USERNAME=admin@example.com
    ...

  更新: .env (10行削除)

  更新: project.json
    + "repository": "https://github.com/myorg/my-project.git"

[3] ドライラン完了
================================================
⚠️  --dry-run モードのため、実際の変更は行われませんでした

実際に移行を実行する場合:
  $ michi migrate
```

#### 7.4 手動移行手順

自動移行ツールを使用しない場合や、カスタマイズが必要な場合の手動移行手順です。

##### 7.4.1 グローバル設定の作成

**ステップ1: ~/.michi/.env の作成**

```bash
# ディレクトリ作成
mkdir -p ~/.michi

# .env ファイル作成
cat > ~/.michi/.env << 'EOF'
# Michi グローバル設定（組織共通）

# Confluence設定
CONFLUENCE_URL=https://your-domain.atlassian.net
CONFLUENCE_USERNAME=your-email@example.com
CONFLUENCE_API_TOKEN=your-confluence-api-token

# JIRA設定
JIRA_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# GitHub設定
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-github-username
GITHUB_EMAIL=your-email@example.com
GITHUB_ORG=your-organization
EOF

# パーミッション設定
chmod 600 ~/.michi/.env
```

**ステップ2: 既存プロジェクトの .env を更新**

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# バックアップ作成
cp .env .env.backup

# グローバル化される項目を削除
# （以下は sed コマンドの例、実際には手動編集を推奨）
sed -i '' '/^CONFLUENCE_URL=/d' .env
sed -i '' '/^CONFLUENCE_USERNAME=/d' .env
sed -i '' '/^CONFLUENCE_API_TOKEN=/d' .env
sed -i '' '/^JIRA_URL=/d' .env
sed -i '' '/^JIRA_USERNAME=/d' .env
sed -i '' '/^JIRA_API_TOKEN=/d' .env
sed -i '' '/^GITHUB_TOKEN=/d' .env
sed -i '' '/^GITHUB_USERNAME=/d' .env
sed -i '' '/^GITHUB_EMAIL=/d' .env
sed -i '' '/^GITHUB_ORG=/d' .env
```

##### 7.4.2 プロジェクト設定の更新

**ステップ3: project.json の更新**

```bash
# .env から GITHUB_REPO を取得
GITHUB_REPO=$(grep GITHUB_REPO .env | cut -d= -f2)

# project.json に repository フィールドを追加
# （jq コマンドを使用する例）
jq --arg repo "https://github.com/$GITHUB_REPO.git" \
  '.repository = $repo' \
  .michi/project.json > .michi/project.json.tmp

mv .michi/project.json.tmp .michi/project.json

# または手動で編集
# {
#   "projectId": "my-project",
#   "repository": "https://github.com/myorg/my-project.git",
#   ...
# }
```

**ステップ4: .env から GITHUB_REPO を削除**

```bash
sed -i '' '/^GITHUB_REPO=/d' .env
```

##### 7.4.3 設定の検証

```bash
# ConfigLoader でバリデーション
npm run config:validate

# または
npx tsx scripts/utils/config-validator.ts

# Michi CLIで動作確認（ドライラン）
michi confluence:sync my-feature --dry-run
```

#### 7.5 検証方法

移行後の設定が正しいことを確認するためのチェックリストです。

##### 7.5.1 ファイル存在チェック

```bash
# グローバル設定の確認
[ -f ~/.michi/.env ] && echo "✓ ~/.michi/.env 存在" || echo "✗ ~/.michi/.env が見つかりません"

# パーミッション確認
ls -l ~/.michi/.env | grep "^-rw-------" && echo "✓ パーミッション正常 (600)" || echo "⚠️ パーミッションを確認してください"

# プロジェクト設定の確認
[ -f .michi/project.json ] && echo "✓ .michi/project.json 存在" || echo "✗ .michi/project.json が見つかりません"
[ -f .env ] && echo "✓ .env 存在" || echo "✗ .env が見つかりません"
```

##### 7.5.2 設定内容チェック

**グローバル設定のチェック**

```bash
# 必須項目が含まれているか確認
grep -q "CONFLUENCE_URL=" ~/.michi/.env && echo "✓ CONFLUENCE_URL" || echo "✗ CONFLUENCE_URL が見つかりません"
grep -q "JIRA_URL=" ~/.michi/.env && echo "✓ JIRA_URL" || echo "✗ JIRA_URL が見つかりません"
grep -q "GITHUB_TOKEN=" ~/.michi/.env && echo "✓ GITHUB_TOKEN" || echo "✗ GITHUB_TOKEN が見つかりません"
```

**プロジェクト設定のチェック**

```bash
# GITHUB_REPO が削除されているか確認
! grep -q "GITHUB_REPO=" .env && echo "✓ GITHUB_REPO は削除されています" || echo "⚠️ GITHUB_REPO がまだ残っています"

# project.json に repository が追加されているか確認
grep -q '"repository"' .michi/project.json && echo "✓ project.json に repository フィールド追加済み" || echo "✗ repository フィールドが見つかりません"
```

##### 7.5.3 バリデーション実行

```bash
# Michi の設定バリデーション
npm run config:validate

# 期待される出力:
# ✅ 設定ファイルは有効です
# ✅ グローバル設定: ~/.michi/.env
# ✅ プロジェクト設定: .michi/config.json
# ✅ プロジェクト環境: .env
# ✅ すべての必須項目が設定されています
```

##### 7.5.4 機能テスト

**Confluence同期のテスト**

```bash
# ドライランで確認（実際にページは作成されない）
michi confluence:sync my-feature requirements --dry-run

# 期待される動作:
# - Confluence URLに接続できる
# - 認証が成功する
# - スペースにアクセスできる
# - ページ作成のシミュレーションが成功する
```

**JIRA同期のテスト**

```bash
# ドライランで確認
michi jira:sync my-feature --dry-run

# 期待される動作:
# - JIRA URLに接続できる
# - プロジェクトが見つかる
# - Epic/Story作成のシミュレーションが成功する
```

**GitHub PR作成のテスト**

```bash
# 現在のブランチ情報を確認
michi github:pr --info

# 期待される動作:
# - リポジトリ情報が正しく取得できる
# - ブランチ情報が表示される
# - PR作成の準備ができている
```

#### 7.6 ロールバック手順

移行後に問題が発生した場合の復元手順です。

##### 7.6.1 自動バックアップからの復元

`michi migrate` コマンドは自動的にバックアップを作成します。

```bash
# バックアップディレクトリの確認
ls -la .michi-backup-*

# 例: .michi-backup-20250112143022/

# ロールバック実行
michi migrate --rollback .michi-backup-20250112143022

# または手動で復元
cp -r .michi-backup-20250112143022/.michi .michi
cp .michi-backup-20250112143022/.env .env
cp .michi-backup-20250112143022/project.json .michi/project.json
```

##### 7.6.2 手動バックアップからの復元

手動移行を行った場合のロールバック手順：

**ステップ1: バックアップファイルを確認**

```bash
# バックアップファイルの確認
ls -la *.backup

# 例:
# .env.backup
# project.json.backup
```

**ステップ2: ファイルを復元**

```bash
# .env の復元
cp .env.backup .env

# project.json の復元
cp .michi/project.json.backup .michi/project.json

# 権限の確認
chmod 600 .env
```

**ステップ3: グローバル設定の削除（オプション）**

```bash
# グローバル設定をロールバックする場合
rm ~/.michi/.env

# または、グローバル設定は残して .env を旧形式に戻すのみでもOK
```

**ステップ4: 動作確認**

```bash
# 設定が正しく復元されたか確認
npm run config:validate

# 実際の機能をテスト
michi confluence:sync my-feature --dry-run
```

##### 7.6.3 部分的なロールバック

グローバル設定のみ、またはプロジェクト設定のみをロールバックする場合：

**グローバル設定のみロールバック**

```bash
# グローバル設定を削除
rm ~/.michi/.env

# .env に組織設定を復元
# （バックアップから CONFLUENCE_*, JIRA_*, GITHUB_* をコピー）
```

**プロジェクト設定のみロールバック**

```bash
# project.json の repository フィールドを削除
jq 'del(.repository)' .michi/project.json > .michi/project.json.tmp
mv .michi/project.json.tmp .michi/project.json

# .env に GITHUB_REPO を復元
echo "GITHUB_REPO=myorg/my-project" >> .env
```

#### 7.7 トラブルシューティング

移行中または移行後に発生する可能性のある問題と解決策です。

##### 7.7.1 移行ツールのエラー

**エラー: "No .env file found"**

```
原因: プロジェクトディレクトリに .env ファイルが存在しない

解決策:
1. 現在のディレクトリを確認: pwd
2. .env ファイルを作成: cp env.example .env
3. 必要な設定を記入
4. 再度移行を実行: michi migrate
```

**エラー: "~/.michi/.env already exists"**

```
原因: グローバル設定ファイルが既に存在する

解決策:
1. 既存のファイルを確認: cat ~/.michi/.env
2. バックアップを作成: cp ~/.michi/.env ~/.michi/.env.backup
3. --force オプションで上書き: michi migrate --force
   または
4. 手動でマージ: 既存の ~/.michi/.env に不足している項目を追加
```

**エラー: "Invalid repository URL in project.json"**

```
原因: project.json の repository フィールドが不正な形式

解決策:
1. project.json を確認: cat .michi/project.json
2. repository フィールドを修正:
   正しい形式: "https://github.com/org/repo.git"
              または "git@github.com:org/repo.git"
3. 再度移行を実行: michi migrate
```

##### 7.7.2 バリデーションエラー

**エラー: "CONFLUENCE_URL is required"**

```
原因: グローバル設定に必須項目が不足している

解決策:
1. ~/.michi/.env を編集
2. 不足している項目を追加:
   CONFLUENCE_URL=https://your-domain.atlassian.net
3. パーミッションを確認: chmod 600 ~/.michi/.env
4. 再度バリデーション: npm run config:validate
```

**エラー: "Repository URL does not match GITHUB_REPO"**

```
原因: project.json.repository と .env.GITHUB_REPO が一致しない

解決策:
1. どちらが正しいか確認
2. 正しい値を project.json に設定
3. .env から GITHUB_REPO を削除
4. 再度バリデーション: npm run config:validate
```

##### 7.7.3 機能テストの失敗

**エラー: "Confluence authentication failed"**

```
原因: Confluence の認証情報が間違っている、または期限切れ

解決策:
1. ~/.michi/.env の認証情報を確認
2. Atlassian でAPIトークンを再生成:
   https://id.atlassian.com/manage-profile/security/api-tokens
3. ~/.michi/.env を更新
4. 再度テスト: michi confluence:sync my-feature --dry-run
```

**エラー: "GitHub repository not found"**

```
原因: リポジトリURLが間違っている、またはアクセス権限がない

解決策:
1. project.json の repository を確認
2. GitHub でリポジトリの存在とアクセス権限を確認
3. 必要に応じて GITHUB_TOKEN の権限を確認
4. 正しいURLに修正
5. 再度テスト: michi github:pr --info
```

##### 7.7.4 パーミッションの問題

**エラー: "Permission denied: ~/.michi/.env"**

```
原因: ファイルのパーミッションが正しくない

解決策:
1. 現在のパーミッションを確認: ls -l ~/.michi/.env
2. 正しいパーミッションに修正: chmod 600 ~/.michi/.env
3. 所有者を確認: ls -l ~/.michi/.env
4. 必要に応じて所有者を変更: sudo chown $USER ~/.michi/.env
```

##### 7.7.5 マルチプロジェクトでの問題

**問題: "複数プロジェクトで異なる組織設定が必要"**

```
原因: 複数の組織に跨ってプロジェクトを管理している

解決策（現在の制限事項）:
1. グローバル設定は1つの組織のみをサポート
2. 別の組織のプロジェクトでは .env に組織設定を直接記述
3. 将来的にはプロファイル機能で複数組織をサポート予定（Section 11参照）

一時的な回避策:
- 主に使用する組織を ~/.michi/.env に設定
- 他の組織のプロジェクトでは .env に全設定を記述（グローバル設定を使用しない）
```

**問題: "プロジェクトAの変更がプロジェクトBに影響する"**

```
原因: グローバル設定を誤って変更した

解決策:
1. グローバル設定の変更は慎重に行う
2. プロジェクト固有の設定は必ず .env または .michi/config.json に記述
3. 設定の優先順位を理解する:
   プロジェクト .env > プロジェクト config.json > グローバル .env
```

##### 7.7.6 ロールバック失敗

**エラー: "Backup directory not found"**

```
原因: バックアップディレクトリが見つからない

解決策:
1. バックアップディレクトリを検索: find . -name ".michi-backup-*"
2. 見つからない場合は手動バックアップを使用: .env.backup など
3. 最悪の場合は Git で復元: git checkout .env .michi/
```

**エラー: "Cannot restore: files are modified"**

```
原因: 復元先のファイルが変更されている

解決策:
1. 現在の変更を確認: git status
2. 変更を保存: git stash
3. ロールバックを実行
4. 必要に応じて変更を復元: git stash pop
```

---

### 参考情報

- **移行ログの確認**: `.michi/migration.log` に詳細なログが記録されます
- **バックアップの保管期間**: 自動バックアップは30日後に自動削除されます（設定で変更可能）
- **サポート**: 問題が解決しない場合は GitHub Issues で報告してください

---


---

## 10. 後方互換性

既存ユーザーへの影響を最小限に抑えるための後方互換性戦略です。

### 10.1 互換性レベル

#### 10.1.1 完全互換（継続サポート）

以下の機能は引き続きサポートされます：

| 機能 | 動作 | サポート期限 |
|------|------|------------|
| `.env` ファイル（プロジェクト） | 引き続き使用可能 | 無期限 |
| `.michi/config.json` | 引き続き使用可能 | 無期限 |
| `.michi/project.json` | 引き続き使用可能 | 無期限 |
| `npm run config:global` | グローバル設定作成 | 無期限 |
| 既存のCLIコマンド | すべて継続動作 | 無期限 |

#### 10.1.2 破壊的変更（v0.5.0）

**重要**: v0.5.0 では、シンプルな設計を実現するために破壊的変更が含まれます。

**削除される機能:**
- `GITHUB_REPO` 環境変数（`.env` 内）
- `setup-existing` コマンド（`michi init --existing` に統一）

**移行が必要なユーザー:**
- `.env` で `GITHUB_REPO` を使用しているユーザー
- `setup-existing` コマンドを使用しているユーザー

**移行方法:**
`michi migrate` コマンドで自動移行が可能です。

### 10.2 移行ガイド

#### 10.2.1 GITHUB_REPO の移行

v0.5.0 では、`GITHUB_REPO` 環境変数は削除されます。代わりに `.kiro/project.json` の `repository` フィールドを使用します。

**移行方法:**

1. **自動移行（推奨）:**
   ```bash
   michi migrate
   ```

2. **手動移行:**
   - `.env` から `GITHUB_REPO` を削除
   - `.kiro/project.json` に `repository` を追加:
     ```json
     {
       "repository": "https://github.com/myorg/myrepo"
     }
     ```

**ConfigLoader の実装:**

```typescript
// ConfigLoader は repository から org/repo 形式を自動抽出
const parsed = this.parseGitHubRepository(merged.project.repository);
merged.github = {
  ...merged.github,
  repository: parsed.url,
  repositoryShort: parsed.shortForm,  // "org/repo"
  repositoryOrg: parsed.org,
  repositoryName: parsed.repo,
};
```

#### 10.2.2 setup-existing コマンドの移行

v0.5.0 では、`setup-existing` コマンドは削除されます。代わりに `michi init --existing` を使用します。

**移行方法:**

すべての `setup-existing` の使用を `michi init --existing` に置き換えてください。

```bash
# 変更前
npx @sk8metal/michi-cli setup-existing

# 変更後
michi init --existing
```

### 10.3 バージョン間の互換性マトリクス

| 機能 | v0.4.0 (現在) | v0.5.0 (Breaking Change) | v1.0.0 |
|------|-------------|------------------------|--------|
| **GITHUB_REPO** | ✅ サポート | ❌ **削除** | - |
| **setup-existing** | ✅ サポート | ❌ **削除** | - |
| **~/.michi/.env** | ❌ 未サポート | ✅ **新規追加** | ✅ サポート |
| **project.json.repository** | ❌ 未サポート | ✅ **必須** | ✅ 必須 |
| **michi migrate** | ❌ 未サポート | ✅ **新規追加** | ✅ サポート |
| **michi init --existing** | ❌ 未サポート | ✅ **新規追加** | ✅ サポート |

### 10.4 アップグレードガイド

#### 10.4.1 v0.4.0 → v0.5.0 (Breaking Change)

**重要**: v0.5.0 は Breaking Change を含むため、移行が必須です。

**アップグレード手順**:

1. **バックアップ作成**
   ```bash
   cp -r .michi .michi.backup
   cp -r .kiro .kiro.backup
   cp .env .env.backup
   ```

2. **Michi をアップグレード**
   ```bash
   npm install -g @sk8metal/michi-cli@0.5.0
   ```

3. **移行ツールを実行（必須）**
   ```bash
   michi migrate
   ```

   移行ツールは以下を自動的に行います:
   - `GITHUB_REPO` を `.kiro/project.json` の `repository` に移行
   - `.env` から組織共通設定を `~/.michi/.env` に抽出
   - `.env` にプロジェクト固有設定のみを残す

4. **動作確認**
   ```bash
   michi config:validate
   michi confluence:sync my-feature --dry-run
   ```

5. **コマンド使用の更新**
   - `setup-existing` → `michi init --existing` に変更
   - スクリプトやドキュメントを更新

**移行しない場合**:

v0.4.0 のまま使用を続けることを推奨します。v0.5.0 は Breaking Change のため、移行なしではエラーが発生します。

### 10.5 ダウングレード

v0.5.0 から v0.4.0 へのダウングレードは可能ですが、以下の制限があります：

**ダウングレード手順**:

```bash
# 1. グローバル設定を .env に戻す
cat ~/.michi/.env >> .env

# 2. project.json から GITHUB_REPO を .env に追加
echo "GITHUB_REPO=myorg/myrepo" >> .env

# 3. Michi をダウングレード
npm install -g @sk8metal/michi-cli@0.4.0

# 4. グローバル設定を削除（オプション）
rm ~/.michi/.env
```

**注意**:
- 一度 v0.5.0 で作成した設定は、v0.4.0 では一部認識されません
- ダウングレードは緊急時のみ推奨されます

---

