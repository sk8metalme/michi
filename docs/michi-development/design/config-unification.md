# Michi 設定統合設計書

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**対象リリース**: v0.5.0 - v1.0.0

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [現状分析](#2-現状分析)
3. [問題点の特定](#3-問題点の特定)
4. [解決策の提案](#4-解決策の提案)
5. [新アーキテクチャ](#5-新アーキテクチャ)
6. [実装詳細](#6-実装詳細)
7. [マイグレーション戦略](#7-マイグレーション戦略)
8. [テスト戦略](#8-テスト戦略)
9. [セキュリティとパフォーマンス](#9-セキュリティとパフォーマンス)
10. [後方互換性](#10-後方互換性)
11. [ロードマップ](#11-ロードマップ)
12. [付録](#12-付録)

---

## 1. エグゼクティブサマリー

### 1.1 背景

Michiプロジェクトでは、現在3つのコマンド（`michi init`、`npx @sk8metal/michi-cli setup-existing`、`npm run config:global`）がプロジェクトの初期設定を担当しています。しかし、これらのコマンドには以下の問題があります:

- **重複する対話的プロンプト**: プロジェクト名、JIRAキー、環境の入力が複数のコマンドで重複
- **設定項目の分散**: 組織レベルで共通の設定が `.env` に分散し、プロジェクトごとに重複入力が必要
- **使い分けの不明瞭さ**: どのコマンドをいつ使うべきか、ユーザーにとって不明確

### 1.2 目的

本設計書では、以下を達成する統一的な設定管理システムを提案します:

1. **設定の階層化**: グローバル設定（組織レベル）とプロジェクト設定（プロジェクトレベル）の明確な分離
2. **コマンドの統一**: `init` と `setup-existing` を統合し、使い分けをシンプルに
3. **自動マイグレーション**: 既存ユーザーが簡単に新形式に移行できるツールの提供
4. **後方互換性**: 段階的な移行により、既存ユーザーへの影響を最小化

### 1.3 期待される効果

- **ユーザー体験の向上**: 組織設定を一度だけ入力すれば、全プロジェクトで共有
- **保守性の向上**: 設定の一元管理により、変更が容易に
- **セキュリティの向上**: 認証情報を適切なファイル（`~/.michi/.env`）に集約し、パーミッション管理を強化

---


---

## 詳細ドキュメント

本設計書は、可読性と保守性を向上させるため、以下のドキュメントに分割されています:

### 現状分析と課題
- [現状分析と問題点](./design-config-current-state.md)
  - 現在の3つのコマンド分析
  - 設定ファイルと設定項目の一覧
  - データフロー図
  - 特定された問題点

### 解決策と設計
- [解決策と新アーキテクチャ](./design-config-solution.md)
  - 統一的な設定管理システムの提案
  - 新しいアーキテクチャ設計
  - 設定の階層化と優先順位

### 実装とマイグレーション
- [実装詳細](./design-config-implementation.md)
  - コマンド実装詳細
  - 設定管理ライブラリ
  - ファイル構造

- [マイグレーション戦略と後方互換性](./design-config-migration.md)
  - 段階的マイグレーション計画
  - マイグレーションツール
  - 後方互換性の維持

### 品質保証
- [テスト戦略](./design-config-testing.md)
  - 統合テスト計画
  - マイグレーションテスト
  - パフォーマンステスト

- [セキュリティとパフォーマンス](./design-config-security.md)
  - セキュリティ考慮事項
  - パーミッション管理
  - パフォーマンス最適化

---

## 11. ロードマップ

設定統一機能の今後の開発計画です。

### 11.1 短期（v0.5.0 - v0.6.0）

**v0.5.0: 設定統一の導入（Breaking Change）（2025 Q1）**

- [x] 3層設定階層の実装
- [x] `~/.michi/.env` グローバル設定
- [x] `michi migrate` 移行ツール
- [x] `michi init --existing` 自動検出
- [x] ConfigLoader のキャッシュ機構
- [x] セキュリティ強化（パーミッション、バリデーション）
- [x] **Breaking Change**: `GITHUB_REPO` 削除
- [x] **Breaking Change**: `setup-existing` 削除
- [ ] テストカバレッジ 95%
- [ ] ドキュメント整備

**v0.5.1: バグ修正とフィードバック対応（2025 Q1）**

- [ ] ユーザーフィードバックに基づくバグ修正
- [ ] エラーメッセージの改善
- [ ] パフォーマンス最適化
- [ ] ドキュメントの改善

**v0.6.0: 機能拡張（2025 Q2）**

- [ ] 移行ツールの改善
- [ ] CI/CD テンプレートの提供
- [ ] 設定のバリデーション強化
- [ ] 設定のインポート/エクスポート機能

### 11.2 中期（v0.7.0 - v0.9.0）

**v0.7.0: マルチ組織サポート（2025 Q2-Q3）**

現在の制限事項：グローバル設定は1つの組織のみサポート

**提案される解決策：プロファイル機能**

```bash
# プロファイルの作成
$ michi profile create work
$ michi profile create personal

# プロファイルの切り替え
$ michi profile use work

# プロファイル一覧
$ michi profile list
  * work (active)
    personal

# プロファイルごとの設定
~/.michi/profiles/work/.env
~/.michi/profiles/personal/.env
```

**設定ファイル構造**:

```
~/.michi/
├── .env (デフォルトプロファイル)
├── profiles/
│   ├── work/
│   │   └── .env
│   └── personal/
│       └── .env
└── config.json (アクティブなプロファイル情報)
```

**v0.8.0: 設定のバリデーション強化（2025 Q3）**

- [ ] より詳細なエラーメッセージ
- [ ] 設定の自動修復機能
- [ ] 設定のインポート/エクスポート
- [ ] 設定のバックアップ/復元

**v0.9.0: パフォーマンス最適化（2025 Q4）**

- [ ] 設定読み込みの高速化（目標: <50ms）
- [ ] メモリ使用量の削減（目標: <30MB）
- [ ] 大規模プロジェクトでのパフォーマンステスト
- [ ] ベンチマーク結果の公開

### 11.3 長期（v1.0.0+）

**v1.0.0: 安定版リリース（2026 Q1）**

- [ ] API の安定化
- [ ] セマンティックバージョニングの厳格化
- [ ] 長期サポート（LTS）の開始
- [ ] パフォーマンスの最終最適化
- [ ] セキュリティ監査の実施

**v1.1.0: 高度な設定管理（2026 Q2）**

- [ ] 設定の暗号化サポート
- [ ] 環境変数の動的置換（`${VAR}` 構文）
- [ ] 設定のテンプレート機能
- [ ] チーム間での設定共有機能

**v1.2.0: クラウド統合（2026 Q3）**

- [ ] 設定のクラウド同期（オプション）
- [ ] シークレット管理サービスとの統合
  - AWS Secrets Manager
  - Google Secret Manager
  - HashiCorp Vault
- [ ] チーム設定の一元管理

### 11.4 検討中の機能

以下の機能は将来的に検討されていますが、実装は未定です：

**設定のGUI管理**
- Webベースの設定管理インターフェース
- 視覚的な設定エディタ
- 設定の差分表示

**AI支援設定**
- プロジェクトの自動検出と推奨設定
- 設定エラーの自動修正
- 最適な設定の提案

**マルチプラットフォーム対応**
- Windows での完全サポート
- Dockerコンテナでの使用最適化
- CI/CD環境での専用サポート

### 11.5 コミュニティフィードバック

ロードマップは以下の方法でフィードバックを受け付けています：

- **GitHub Discussions**: 機能リクエスト、質問
- **GitHub Issues**: バグレポート、改善提案
- **Pull Requests**: 機能実装、ドキュメント改善

優先順位は以下の基準で決定されます：

1. ユーザーからの要望の多さ
2. セキュリティへの影響
3. 実装の複雑さ
4. 既存機能との互換性

---

## 付録 A: 用語集

このドキュメントで使用される主要な用語の定義です。

| 用語 | 定義 |
|------|------|
| **グローバル設定** | `~/.michi/.env` に保存される、すべてのプロジェクトで共有される設定 |
| **プロジェクト設定** | `.michi/config.json` に保存される、プロジェクト固有の設定 |
| **プロジェクト環境** | `.env` に保存される、プロジェクトの環境変数 |
| **3層マージ** | グローバル設定、プロジェクト設定、プロジェクト環境を統合するプロセス |
| **ConfigLoader** | 設定を読み込み、マージ、バリデーションを行うクラス |
| **マイグレーション** | 旧形式の設定を新形式に変換するプロセス |
| **後方互換性** | 既存のコードや設定が新バージョンでも動作すること |
| **非推奨（Deprecated）** | 将来削除される予定の機能 |

---

## 付録 B: FAQ（よくある質問）

### B.1 一般的な質問

**Q: なぜグローバル設定が必要なのですか？**

A: 複数のMichiプロジェクトを管理している場合、Confluence/JIRA/GitHubの認証情報は組織で共通です。グローバル設定により、これらを1箇所で管理でき、各プロジェクトで重複して設定する必要がなくなります。

**Q: グローバル設定を使わずに、プロジェクトごとに設定したい場合は？**

A: グローバル設定は任意です。`.env` ファイルにすべての設定を記述すれば、グローバル設定なしでも動作します。

**Q: 複数の組織に所属している場合はどうすればいいですか？**

A: 現在（v0.5.0）はグローバル設定は1つの組織のみサポートしています。他の組織のプロジェクトでは `.env` に直接認証情報を記述してください。v0.7.0 でプロファイル機能を追加予定です（Section 11参照）。

### B.2 移行に関する質問

**Q: v0.5.0 にアップグレードする必要がありますか？**

A: v0.5.0 は Breaking Change を含むため、アップグレード時には `michi migrate` を実行する必要があります。v0.4.0 のまま使用を続けることも可能ですが、新機能やバグ修正は v0.5.0 以降で提供されます。

**Q: 移行に失敗した場合、元に戻せますか？**

A: はい、`michi migrate` は自動的にバックアップを作成します。`michi migrate --rollback <backup-dir>` で元に戻せます。

**Q: GITHUB_REPO はどうなりますか？**

A: v0.5.0 で削除されます。代わりに `.kiro/project.json` の `repository` フィールドを使用します。`michi migrate` が自動的に変換します。

### B.3 セキュリティに関する質問

**Q: ~/.michi/.env のパーミッションはどうすればいいですか？**

A: 600 (rw-------) が推奨です。`michi migrate` が自動的に設定します。手動で作成した場合は `chmod 600 ~/.michi/.env` を実行してください。

**Q: .env ファイルを Git にコミットしてしまいました。どうすればいいですか？**

A: 以下の手順で対処してください：

1. `.env` を `.gitignore` に追加
2. Git履歴から `.env` を削除: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all`
3. 認証情報をすべて再生成（漏洩したものとして扱う）
4. 新しい認証情報で `.env` を更新

**Q: パスワードやトークンはどのように保存されますか？**

A: 平文で `.env` ファイルに保存されます。ファイルパーミッション（600）により、他のユーザーからの読み取りは防止されますが、暗号化はされません。より高度なセキュリティが必要な場合は、v1.2.0 で実装予定のシークレット管理サービス統合をお待ちください。

### B.4 パフォーマンスに関する質問

**Q: 設定の読み込みが遅いのですが？**

A: ConfigLoader はキャッシュ機構を持っており、2回目以降の読み込みは高速です。それでも遅い場合は、以下を確認してください：
- ネットワークドライブ上のプロジェクトではないか
- アンチウイルスソフトが `.env` ファイルをスキャンしていないか

**Q: メモリ使用量が多いのですが？**

A: 通常、設定読み込みは 5MB 未満のメモリを使用します。異常に多い場合は、キャッシュをクリアしてみてください：`ConfigLoader.clearCache()`

### B.5 トラブルシューティング

**Q: "CONFLUENCE_URL is required" エラーが出ます**

A: グローバル設定またはプロジェクト設定に `CONFLUENCE_URL` が設定されているか確認してください。`npm run config:validate` で設定を検証できます。

**Q: "Invalid repository URL" エラーが出ます**

A: `project.json` の `repository` フィールドが正しい形式か確認してください。有効な形式：
- `https://github.com/org/repo.git`
- `git@github.com:org/repo.git`

**Q: 設定ファイルが見つからないと言われます**

A: 現在のディレクトリがMichiプロジェクトのルートか確認してください。`ls .michi` でディレクトリが存在するか確認できます。

---

## 付録 C: トラブルシューティング

詳細なトラブルシューティングガイドです。Section 7.7 も参照してください。

### C.1 診断コマンド

**設定の確認**

```bash
# 設定のバリデーション
michi config:validate

# 設定の詳細表示（機密情報はマスクされる）
michi config:show

# 現在読み込まれている設定のパスを表示
michi config:paths
```

**ファイルの確認**

```bash
# グローバル設定の存在確認
ls -la ~/.michi/.env

# プロジェクト設定の確認
ls -la .michi/config.json .michi/project.json .env

# パーミッションの確認
stat -f "%A %N" ~/.michi/.env .env
```

### C.2 一般的な問題と解決策

**問題: "Permission denied" エラー**

```bash
# パーミッションを確認
ls -l ~/.michi/.env

# 600 に修正
chmod 600 ~/.michi/.env
```

**問題: "File not found" エラー**

```bash
# ファイルが存在するか確認
test -f ~/.michi/.env && echo "存在する" || echo "存在しない"

# 存在しない場合は作成
mkdir -p ~/.michi
touch ~/.michi/.env
chmod 600 ~/.michi/.env
```

**問題: "Invalid configuration" エラー**

```bash
# 設定をバリデーション
michi config:validate

# エラーメッセージを確認し、該当する項目を修正
```

### C.3 ログの確認

**移行ログ**

```bash
# 移行の詳細ログを確認
cat .michi/migration.log

# 最新10件のエラーを表示
grep ERROR .michi/migration.log | tail -10
```

**監査ログ**

```bash
# 設定変更の履歴を確認
cat .michi/audit.log | jq '.'

# 最新の変更を表示
cat .michi/audit.log | jq '.' | tail -1
```

**セキュリティログ**

```bash
# セキュリティイベントを確認
cat ~/.michi/security.log | jq '.'
```

### C.4 デバッグモード

**環境変数でデバッグログを有効化**

```bash
# デバッグログを有効化
export MICHI_DEBUG=true

# コマンド実行
michi config:validate

# 詳細ログが出力される
```

### C.5 サポート

問題が解決しない場合は、以下の情報とともに GitHub Issues で報告してください：

1. **環境情報**
   ```bash
   michi --version
   node --version
   npm --version
   uname -a
   ```

2. **エラーメッセージ全文**

3. **再現手順**

4. **設定ファイル**（機密情報は削除してください）

---

## 付録 D: 設定例集

実際のプロジェクトでの設定例です。

### D.1 シンプルな構成

**~/.michi/.env**

```bash
# 組織共通設定
CONFLUENCE_URL=https://mycompany.atlassian.net
CONFLUENCE_USERNAME=developer@mycompany.com
CONFLUENCE_API_TOKEN=your-api-token-here

JIRA_URL=https://mycompany.atlassian.net
JIRA_USERNAME=developer@mycompany.com
JIRA_API_TOKEN=your-api-token-here

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.michi/project.json**

```json
{
  "projectId": "web-app",
  "repository": "https://github.com/mycompany/web-app.git"
}
```

**.env**

```bash
# プロジェクト固有の設定（なし）
```

### D.2 複雑な構成

**~/.michi/.env**

```bash
# 組織共通設定
CONFLUENCE_URL=https://mycompany.atlassian.net
CONFLUENCE_USERNAME=developer@mycompany.com
CONFLUENCE_API_TOKEN=your-api-token-here
CONFLUENCE_SPACE=DEV

JIRA_URL=https://mycompany.atlassian.net
JIRA_USERNAME=developer@mycompany.com
JIRA_API_TOKEN=your-api-token-here

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.michi/config.json**

```json
{
  "confluence": {
    "pageCreationGranularity": "by-section",
    "pageTitleFormat": "[Web App] {featureName}",
    "hierarchy": {
      "mode": "nested",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "createEpic": true,
    "storyCreationGranularity": "by-phase",
    "selectedPhases": ["implementation", "testing"],
    "storyPoints": "auto"
  },
  "workflow": {
    "enabledPhases": ["requirements", "design", "tasks"],
    "approvalGates": {
      "requirements": ["pm", "architect"],
      "design": ["architect", "tech-lead"],
      "release": ["pm", "director"]
    }
  }
}
```

**.michi/project.json**

```json
{
  "projectId": "web-app",
  "repository": "https://github.com/mycompany/web-app.git"
}
```

**.env**

```bash
# プロジェクト固有の Confluence スペース
CONFLUENCE_SPACE=WEBAPP

# プロジェクト固有の JIRA プロジェクト
JIRA_PROJECT=WEB
```

### D.3 マルチ環境構成

本番環境と開発環境で異なる設定を使用する例：

**~/.michi/.env** (共通)

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=myusername
GITHUB_EMAIL=developer@mycompany.com
GITHUB_ORG=mycompany
```

**.env.development**

```bash
CONFLUENCE_URL=https://dev.atlassian.net
CONFLUENCE_SPACE=DEV
JIRA_URL=https://dev.atlassian.net
JIRA_PROJECT=DEV
```

**.env.production**

```bash
CONFLUENCE_URL=https://prod.atlassian.net
CONFLUENCE_SPACE=PROD
JIRA_URL=https://prod.atlassian.net
JIRA_PROJECT=PROD
```

**使用方法**:

```bash
# 開発環境
cp .env.development .env
michi confluence:sync my-feature

# 本番環境
cp .env.production .env
michi confluence:sync my-feature
```

---

## 付録 E: 移行チェックリスト

v0.4.0 から v0.5.0 への移行時に確認すべき項目のチェックリストです。

### E.1 移行前の準備

- [ ] 現在の Michi バージョンを確認: `michi --version`
- [ ] すべての変更をコミット: `git status` で確認
- [ ] バックアップを作成
  - [ ] `.michi/` ディレクトリ
  - [ ] `.env` ファイル
  - [ ] `project.json` ファイル

### E.2 アップグレード

- [ ] Michi を最新版にアップグレード: `npm install -g @sk8metal/michi-cli@latest`
- [ ] バージョンを確認: `michi --version` が v0.5.0 以上であること

### E.3 グローバル設定の作成

- [ ] グローバル設定ディレクトリを作成: `mkdir -p ~/.michi`
- [ ] グローバル .env を作成: `touch ~/.michi/.env`
- [ ] パーミッションを設定: `chmod 600 ~/.michi/.env`
- [ ] 認証情報をグローバル .env に記入
  - [ ] CONFLUENCE_URL
  - [ ] CONFLUENCE_USERNAME
  - [ ] CONFLUENCE_API_TOKEN
  - [ ] JIRA_URL
  - [ ] JIRA_USERNAME
  - [ ] JIRA_API_TOKEN
  - [ ] GITHUB_TOKEN
  - [ ] GITHUB_USERNAME
  - [ ] GITHUB_EMAIL
  - [ ] GITHUB_ORG

### E.4 プロジェクトごとの移行

各プロジェクトで以下を実行：

- [ ] プロジェクトディレクトリに移動
- [ ] 移行を実行: `michi migrate`
  - または、最初にドライランで確認: `michi migrate --dry-run`
- [ ] バックアップが作成されたことを確認: `ls .michi-backup-*`
- [ ] グローバル設定が作成されたことを確認: `ls ~/.michi/.env`
- [ ] プロジェクト .env から組織設定が削除されたことを確認
  - [ ] `grep CONFLUENCE_URL .env` が何も返さない
  - [ ] `grep GITHUB_TOKEN .env` が何も返さない
- [ ] project.json に repository が追加されたことを確認
  - [ ] `cat .michi/project.json | grep repository`

### E.5 動作確認

- [ ] 設定のバリデーション: `michi config:validate`
- [ ] Confluence同期テスト: `michi confluence:sync test-feature --dry-run`
- [ ] JIRA同期テスト: `michi jira:sync test-feature --dry-run`
- [ ] GitHub PRテスト: `michi github:pr --info`

### E.6 クリーンアップ

- [ ] バックアップが不要なら削除: `rm -rf .michi-backup-*`
- [ ] 古い .env.backup が不要なら削除: `rm .env.backup`
- [ ] .gitignore に機密ファイルが追加されていることを確認
  - [ ] `.env`
  - [ ] `.michi-backup-*/`
  - [ ] `.michi/migration.log`

### E.7 ドキュメント更新

- [ ] README に新しい設定方法を記載
- [ ] チームメンバーに移行方法を共有
- [ ] CI/CD パイプラインの更新（必要な場合）

---

## まとめ

この設計ドキュメントでは、Michiプロジェクトの設定統一について詳細に説明しました。

### 主要な変更点

1. **3層設定階層**: グローバル → プロジェクト → 環境の3層で設定を管理
2. **グローバル設定**: `~/.michi/.env` で組織共通の認証情報を一元管理
3. **リポジトリURL統一**: `GITHUB_REPO` を廃止し、`project.json.repository` に統一
4. **コマンド統一**: `setup-existing` を廃止し、`michi init --existing` に統一
5. **自動移行ツール**: `michi migrate` で既存プロジェクトを簡単に移行

### 次のステップ

1. **v0.5.0 リリース**: このドキュメントに基づいて実装
2. **ユーザーフィードバック収集**: 実際の使用感を確認
3. **v0.6.0 準備**: 非推奨機能の削除計画
4. **長期計画**: マルチ組織サポート、暗号化、クラウド統合

### 貢献

このプロジェクトへの貢献を歓迎します：

- **バグレポート**: GitHub Issues
- **機能リクエスト**: GitHub Discussions
- **コード貢献**: Pull Requests
- **ドキュメント改善**: Pull Requests

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-12
**Authors**: Michi Development Team
**Status**: Final Draft

---

