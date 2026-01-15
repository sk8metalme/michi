---
description: Multi-Repoプロジェクトを初期化し、プロジェクト説明とメタデータを設定
allowed-tools: Bash, Glob, Read, Write, Edit
argument-hint: "<project-description>"
---

# Multi-Repo 仕様初期化

<background_information>
- **Mission**: Multi-Repoプロジェクトの初期化（`michi multi-repo:init` の代替）
- **Success Criteria**:
  - プロジェクト説明からfeature-name形式のプロジェクト名を生成
  - ディレクトリ構造を作成
  - project.jsonでメタデータ管理を開始（repositories配列を含む）
  - 次のステップ（リポジトリ登録、要件定義）への明確な誘導
</background_information>

<instructions>
## コアタスク
プロジェクト説明 **$1** から Multi-Repoプロジェクトを初期化し、`michi multi-repo:init` と同等の機能をAIコマンドとして提供します。

## 引数解析

引数の形式:
```
/michi-multi-repo:launch-pj "<プロジェクト説明>"
```

パラメータ:
- **$1**: プロジェクト説明（必須） - 例: "マイクロサービスアーキテクチャでECサイトを構築"

## 実行手順

### Step 1: プロジェクト名の生成

1. **feature-name形式に変換**:
   - プロジェクト説明から簡潔なプロジェクト名を生成
   - 形式: 小文字英数字とハイフン（例: `my-microservices`, `ec-platform`）
   - 日本語説明の場合は英語に変換

2. **一意性チェック**:
   - `.michi/multi-repo/pj/` 配下の既存ディレクトリを確認
   - 重複する場合は数値サフィックスを追加（例: `20260115-my-project-2`）

### Step 2: ディレクトリ構造の作成

以下のディレクトリとファイルを作成:

```
.michi/multi-repo/pj/YYYYMMDD-{name}/
└── project.json                 # メタデータファイル

docs/michi/YYYYMMDD-{name}/
├── spec/
│   ├── requirements.md          # 要件定義書（プロジェクト説明を含む）
│   ├── architecture.md          # アーキテクチャ設計書（テンプレート）
│   └── sequence.md              # シーケンス図（テンプレート）
└── test-plan/
    ├── strategy.md              # テスト戦略
    ├── unit/
    ├── integration/
    ├── e2e/
    └── performance/
```

### Step 3: メタデータ初期化

1. **project.jsonの生成**:
   - テンプレート: `templates/multi-repo/project.json`
   - プレースホルダー置換:
     - `{{PROJECT_NAME}}` → `YYYYMMDD-{name}` 形式のプロジェクト名
     - `{{CREATED_AT}}` → 現在のISO 8601タイムスタンプ
   - 出力先: `.michi/multi-repo/pj/YYYYMMDD-{name}/project.json`

2. **requirements.mdの初期化**:
   - テンプレート: `templates/multi-repo/spec/requirements.md`
   - 「概要」セクションにプロジェクト説明を記載
   - プレースホルダー置換
   - 出力先: `docs/michi/YYYYMMDD-{name}/overview/requirements.md`

3. **その他テンプレートファイルのレンダリング**:
   - `templates/multi-repo/spec/architecture.md` → `docs/michi/YYYYMMDD-{name}/overview/architecture.md`
   - `templates/multi-repo/spec/sequence.md` → `docs/michi/YYYYMMDD-{name}/overview/sequence.md`
   - `templates/multi-repo/test-plan/strategy.md` → `docs/michi/YYYYMMDD-{name}/test-plan/strategy.md`

## 重要な制約
- プロジェクト名は1-100文字、パストラバーサル文字（`/`, `\`, `..`）、制御文字は禁止
- 既存プロジェクト名と重複する場合は数値サフィックスを自動追加
- DO NOT generate requirements/design at this stage（要件・設計は後続コマンドで生成）

</instructions>

## ツールガイダンス
- **Glob**: `.michi/multi-repo/pj/` 配下の既存ディレクトリ確認、プロジェクト名の一意性チェック
- **Read**: テンプレートファイル読み込み
- **Write**: project.json、requirements.md、その他テンプレート出力

## 出力説明
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
- `.michi/multi-repo/pj/YYYYMMDD-{name}/project.json` - メタデータ（phase: initialized）
- `docs/michi/YYYYMMDD-{name}/overview/requirements.md` - 要件定義書（初期化済み）
- `docs/michi/YYYYMMDD-{name}/overview/architecture.md` - 設計書（テンプレート）
- `docs/michi/YYYYMMDD-{name}/test-plan/strategy.md` - テスト戦略（テンプレート）

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
```

## 安全性とフォールバック

### エラーシナリオ

- **引数不足**:
  ```
  エラー: 必須パラメータが不足しています。

  使用方法:
  /michi-multi-repo:launch-pj "<プロジェクト説明>"

  例:
  /michi-multi-repo:launch-pj "マイクロサービスでECサイト構築"
  ```

- **プロジェクト名重複**:
  ```
  警告: プロジェクト名 'YYYYMMDD-{project-name}' は既に存在します。
  自動的に 'YYYYMMDD-{project-name-2}' として作成しました。
  ```

### フォールバック戦略
- プロジェクト名生成が曖昧な場合: 2-3の候補を提示し、ユーザーに選択を求める
- テンプレートファイル不在: エラーメッセージと対処方法を表示
- ディレクトリ作成失敗: パーミッションまたはディスク容量の確認を促す

think hard
