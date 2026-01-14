---
description: Multi-Repoプロジェクトを初期化し、プロジェクト説明とメタデータを設定
allowed-tools: Bash, Glob, Read, Write, Edit
argument-hint: "<project-description>" --jira <JIRA_KEY> --confluence-space <SPACE>
---

# Multi-Repo Specification Initialization

<background_information>
- **Mission**: Multi-Repoプロジェクトの初期化（`michi multi-repo:init` の代替）
- **Success Criteria**:
  - プロジェクト説明からfeature-name形式のプロジェクト名を生成
  - ディレクトリ構造を作成
  - spec.jsonでメタデータ管理を開始
  - `.michi/config.json` のmultiRepoProjectsに登録
  - 次のステップ（リポジトリ登録、要件定義）への明確な誘導
</background_information>

<instructions>
## Core Task
プロジェクト説明 **$1** から Multi-Repoプロジェクトを初期化し、`michi multi-repo:init` と同等の機能をAIコマンドとして提供します。

## 引数解析

引数の形式:
```
/michi-multi-repo:launch-pj "<プロジェクト説明>" --jira <JIRA_KEY> --confluence-space <SPACE>
```

パラメータ:
- **$1**: プロジェクト説明（必須） - 例: "マイクロサービスアーキテクチャでECサイトを構築"
- **--jira**: JIRAプロジェクトキー（必須） - 例: MSV
- **--confluence-space**: Confluenceスペースキー（必須） - 例: MSV

## Execution Steps

### Step 1: 引数解析とバリデーション

1. **プロジェクト説明の取得**: $1 からプロジェクト説明を抽出
2. **JIRA/Confluenceキーの取得**:
   - `--jira` オプションの値を取得（なければエラー）
   - `--confluence-space` オプションの値を取得（なければエラー）
3. **バリデーション**:
   - JIRAキー: 2-10文字の大文字英字のみ（正規表現: `^[A-Z]{2,10}$`）
   - Confluenceスペースキー: 空でない文字列

### Step 2: プロジェクト名の生成

1. **feature-name形式に変換**:
   - プロジェクト説明から簡潔なプロジェクト名を生成
   - 形式: 小文字英数字とハイフン（例: `my-microservices`, `ec-platform`）
   - 日本語説明の場合は英語に変換

2. **一意性チェック**:
   - `.michi/config.json` の `multiRepoProjects` を確認
   - 重複する場合は数値サフィックスを追加（例: `my-project-2`）

### Step 3: ディレクトリ構造の作成

以下のディレクトリとファイルを作成:

```
docs/michi/{project-name}/
├── spec.json                    # メタデータファイル（NEW）
├── overview/
│   ├── requirements.md          # 要件定義書（プロジェクト説明を含む）
│   ├── architecture.md          # アーキテクチャ設計書（テンプレート）
│   └── sequence.md              # シーケンス図（テンプレート）
├── tests/
│   ├── scripts/                 # テストスクリプト配置用
│   ├── results/                 # テスト結果保存用
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── performance/
└── docs/
    ├── ci-status.md             # CI結果サマリー（テンプレート）
    └── release-notes.md         # リリースノート（テンプレート）
```

### Step 4: メタデータ初期化

1. **spec.jsonの生成**:
   - テンプレート: `templates/multi-repo/spec.json`
   - プレースホルダー置換:
     - `{{PROJECT_NAME}}` → 生成されたプロジェクト名
     - `{{CREATED_AT}}` → 現在のISO 8601タイムスタンプ
     - `{{JIRA_KEY}}` → JIRAキー
     - `{{CONFLUENCE_SPACE}}` → Confluenceスペースキー
   - 出力先: `docs/michi/{project-name}/spec.json`

2. **requirements.mdの初期化**:
   - テンプレート: `templates/multi-repo/overview/requirements.md`
   - 「概要」セクションにプロジェクト説明を記載
   - プレースホルダー置換
   - 出力先: `docs/michi/{project-name}/overview/requirements.md`

3. **その他テンプレートファイルのレンダリング**:
   - `templates/multi-repo/overview/architecture.md` → `docs/michi/{project-name}/overview/architecture.md`
   - `templates/multi-repo/overview/sequence.md` → `docs/michi/{project-name}/overview/sequence.md`
   - `templates/multi-repo/tests/strategy.md` → `docs/michi/{project-name}/tests/strategy.md`
   - `templates/multi-repo/docs/ci-status.md` → `docs/michi/{project-name}/docs/ci-status.md`
   - `templates/multi-repo/docs/release-notes.md` → `docs/michi/{project-name}/docs/release-notes.md`

### Step 5: .michi/config.json の更新

1. **config.jsonの読み込み**: `.michi/config.json` を読み込む
2. **multiRepoProjects に追加**:
   ```json
   {
     "name": "{project-name}",
     "jiraKey": "{JIRA_KEY}",
     "confluenceSpace": "{CONFLUENCE_SPACE}",
     "createdAt": "{ISO 8601 timestamp}",
     "repositories": []
   }
   ```
3. **保存**: `.michi/config.json` を保存

## Important Constraints
- プロジェクト名は1-100文字、パストラバーサル文字（`/`, `\`, `..`）、制御文字は禁止
- JIRAキーは2-10文字の大文字英字のみ
- Confluenceスペースキーは空でない文字列
- 既存プロジェクト名と重複する場合は数値サフィックスを自動追加
- DO NOT generate requirements/design at this stage（要件・設計は後続コマンドで生成）

</instructions>

## Tool Guidance
- **Glob**: `.michi/config.json` 存在確認、プロジェクト名の一意性チェック
- **Read**: テンプレートファイル読み込み、config.json 読み込み
- **Write**: spec.json、requirements.md、config.json、その他テンプレート出力
- **Edit**: config.json の multiRepoProjects 配列に追加（必要に応じて）

## Output Description
日本語で以下の情報を出力してください:

1. **生成されたプロジェクト名**: `{project-name}` 形式（1-2文で理由を説明）
2. **プロジェクト概要**: プロジェクト説明の要約（1文）
3. **作成されたファイル**: 箇条書きで主要ファイルのパス
4. **次のステップ**: 次に実行すべきコマンド（リポジトリ登録、要件定義）

**出力形式**:
```markdown
## Multi-Repoプロジェクト初期化完了

### プロジェクト名
`{project-name}`

プロジェクト説明「{description}」から生成しました。

### プロジェクト概要
{プロジェクト説明の要約}

### 作成されたファイル
- `docs/michi/{project}/spec.json` - メタデータ（phase: initialized）
- `docs/michi/{project}/overview/requirements.md` - 要件定義書（初期化済み）
- `docs/michi/{project}/overview/architecture.md` - 設計書（テンプレート）
- `.michi/config.json` - multiRepoProjects に登録

### 次のステップ

1. **リポジトリを登録**:
   \`\`\`bash
   michi multi-repo:add-repo {project} --name frontend --url https://github.com/org/frontend --branch main
   michi multi-repo:add-repo {project} --name backend --url https://github.com/org/backend --branch main
   \`\`\`

2. **AI要件定義書を生成**:
   \`\`\`bash
   /michi-multi-repo:create-requirements {project}
   \`\`\`

3. **AI設計書を生成**:
   \`\`\`bash
   /michi-multi-repo:create-design {project}
   \`\`\`

4. **Confluenceに同期**:
   \`\`\`bash
   michi multi-repo:confluence-sync {project}
   \`\`\`
```

## Safety & Fallback

### Error Scenarios

- **引数不足**:
  ```
  エラー: 必須パラメータが不足しています。

  使用方法:
  /michi-multi-repo:launch-pj "<プロジェクト説明>" --jira <JIRA_KEY> --confluence-space <SPACE>

  例:
  /michi-multi-repo:launch-pj "マイクロサービスでECサイト構築" --jira MSV --confluence-space MSV
  ```

- **JIRAキーが不正**:
  ```
  エラー: JIRAキーは2-10文字の大文字英字のみです（例: MSV, PROJ）
  ```

- **プロジェクト名重複**:
  ```
  警告: プロジェクト名 '{project-name}' は既に存在します。
  自動的に '{project-name-2}' として作成しました。
  ```

- **config.json が存在しない**:
  ```
  エラー: .michi/config.json が見つかりません。

  Michiプロジェクトのルートディレクトリで実行してください。
  または、次のコマンドで初期設定を行ってください:
  michi init
  ```

### Fallback Strategy
- プロジェクト名生成が曖昧な場合: 2-3の候補を提示し、ユーザーに選択を求める
- テンプレートファイル不在: エラーメッセージと対処方法を表示
- ディレクトリ作成失敗: パーミッションまたはディスク容量の確認を促す

think hard
