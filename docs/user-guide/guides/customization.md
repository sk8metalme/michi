# カスタマイズ機能ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../README.md#凡例の記号説明) を参照してください。

## 概要

Michiでは、チームやPJごとに異なる開発フローに対応するため、Confluence/JIRAの作成粒度やワークフロー設定をカスタマイズ可能にしています。

## cc-sddのカスタマイズとの関係

Michiは[cc-sdd](https://github.com/gotalab/cc-sdd)をベースとしており、カスタマイズには2つの種類があります：

### 1. cc-sddのカスタマイズ（テンプレート・ルール）

**対象**: AIが生成するドキュメントの構造や判断基準
- **templates/**: `requirements.md`, `design.md`, `tasks.md`の構造・フォーマット
- **rules/**: AIの判断基準・生成原則
- **steering/**: プロジェクトメモリ（`/kiro:steering-custom`で作成）

**詳細**: [cc-sdd カスタマイズガイド](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/ja/customization-guide.md)

**主なカスタマイズ内容**:
- 要件定義書の見出し形式（日本語/英語/カスタム）
- 設計ドキュメントのセクション構造
- タスク分解の粒度と形式
- EARS形式の要件記述ルール
- カスタムSteeringドキュメント（API標準、セキュリティポリシーなど）

### 2. Michiのカスタマイズ（設定ファイル）

**対象**: Confluence/JIRAの作成方法やワークフロー設定
- **`.michi/config.json`**: Confluence階層構造、JIRA Story作成粒度、承認ゲート設定

**詳細**: 本ドキュメント（以下を参照）

**主なカスタマイズ内容**:
- Confluenceページの階層構造（フラット/階層/セクション分割）
- JIRA Story作成粒度（全作成/フェーズごと/選択フェーズのみ）
- ワークフロー承認ゲート設定

### 使い分け

| カスタマイズ種類 | 対象 | 設定場所 | コマンド |
|----------------|------|---------|---------|
| **cc-sdd** | ドキュメント構造・AI判断基準 | `.kiro/settings/templates/`, `.kiro/settings/rules/`, `.kiro/steering/` | `/kiro:steering-custom` |
| **Michi** | Confluence/JIRA作成方法 | `.michi/config.json` | 手動編集または`npm run config:global` |

**例**: 
- 要件定義書の見出しを「要件 N:」から「REQ-N:」に変更 → **cc-sddのカスタマイズ**（`templates/requirements.md`を編集）
- Confluenceページを階層構造にする → **Michiのカスタマイズ**（`.michi/config.json`で設定）

## 設定ファイルの構造

### デフォルト設定

`scripts/config/default-config.json` - Michiリポジトリに含まれるデフォルト設定

### プロジェクト固有設定

`.michi/config.json` - プロジェクトルートに配置（オプション）

**重要**: `.michi/config.json`は`.gitignore`に追加することを推奨します（チーム固有設定のため）

**注意**: 以前は `.kiro/config.json` を使用していましたが、Michi専用の設定ファイルとして `.michi/config.json` に変更されました。

### 設定のマージ順序

1. デフォルト設定を読み込み
2. プロジェクト固有設定があればマージ（深いマージ）
3. 環境変数で最終上書き（既存の動作を維持）

### 設定値の詳細

すべての設定値の詳細は [設定値リファレンス](../reference/config.md) を参照してください。

## Confluence階層構造のカスタマイズ

### パターン1: フラット構造（デフォルト）

**設定**: 設定ファイル不要、または`pageCreationGranularity: "single"`

**動作**: 1ドキュメント = 1ページ（現在の動作を維持）

```
Confluenceスペース
└── [Michi] health-check-endpoint 要件定義
└── [Michi] health-check-endpoint 設計
└── [Michi] health-check-endpoint タスク分割
```

**設定例**:
```json
{
  "confluence": {
    "pageCreationGranularity": "single"
  }
}
```

### パターン2: 機能ごとの親ページ（simple階層）

**設定**: `pageCreationGranularity: "by-hierarchy"` + `hierarchy.mode: "simple"`

**動作**: 親ページを作成し、要件定義/設計/タスク分割を子ページとして配置

```
Confluenceスペース
└── [Michi] health-check-endpoint（親ページ）
    ├── 要件定義
    ├── 設計
    └── タスク分割
```

**設定例**:
```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  }
}
```

### パターン3: セクション分割

**設定**: `pageCreationGranularity: "by-section"`

**動作**: Markdownの`##`セクションごとにページを作成（フラット）

```
Confluenceスペース
└── [Michi] health-check-endpoint 要件定義 - 概要
└── [Michi] health-check-endpoint 要件定義 - 機能要件
└── [Michi] health-check-endpoint 要件定義 - 非機能要件
```

**設定例**:
```json
{
  "confluence": {
    "pageCreationGranularity": "by-section",
    "pageTitleFormat": "[{projectName}] {featureName} {docTypeLabel} - {sectionTitle}"
  }
}
```

### パターン4: 階層構造（nested階層）

**設定**: `pageCreationGranularity: "by-hierarchy"` + `hierarchy.mode: "nested"`

**動作**: 親ページ → ドキュメントタイプ親 → セクション子ページの3階層

```
Confluenceスペース
└── [Michi] health-check-endpoint（親ページ）
    ├── 要件定義（親）
    │   ├── 概要
    │   ├── 機能要件
    │   └── 非機能要件
    ├── 設計（親）
    │   ├── アーキテクチャ
    │   └── API仕様
    └── タスク分割
```

**設定例**:
```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "hierarchy": {
      "mode": "nested",
      "parentPageTitle": "[{projectName}] {featureName}",
      "createDocTypeParents": true
    }
  }
}
```

### パターン5: 手動指定（manual）

**設定**: `pageCreationGranularity: "manual"` + `hierarchy.structure`で明示的に定義

**動作**: 設定ファイルで指定した通りにページを作成

```
Confluenceスペース
└── [Michi] health-check-endpoint（親ページ）
    ├── 要件定義 - 概要
    ├── 要件定義 - 機能要件
    ├── 要件定義 - 非機能要件
    ├── 設計 - アーキテクチャ
    └── 設計 - API仕様
```

**設定例**:
```json
{
  "confluence": {
    "pageCreationGranularity": "manual",
    "hierarchy": {
      "parentPageTitle": "[{projectName}] {featureName}",
      "structure": {
        "requirements": {
          "pages": [
            {
              "title": "[{projectName}] {featureName} 要件定義 - 概要",
              "sections": ["## 1. 概要", "## 1.1 背景"],
              "labels": ["requirements", "overview"]
            },
            {
              "title": "[{projectName}] {featureName} 要件定義 - 機能要件",
              "sections": ["## 2. 機能要件", "## 2.1 ユーザー機能"],
              "labels": ["requirements", "functional"]
            }
          ]
        },
        "design": {
          "pages": [
            {
              "title": "[{projectName}] {featureName} 設計 - アーキテクチャ",
              "sections": ["## 1. アーキテクチャ概要"],
              "labels": ["design", "architecture"]
            }
          ]
        }
      }
    }
  }
}
```

## タイトル形式のカスタマイズ

`pageTitleFormat`でページタイトルの形式をカスタマイズできます。

**利用可能な変数**:
- `{projectName}` - プロジェクト名
- `{featureName}` - 機能名
- `{docTypeLabel}` - ドキュメントタイプ（要件定義、設計、タスク分割）
- `{sectionTitle}` - セクションタイトル（by-sectionの場合）

**設定例**:
```json
{
  "confluence": {
    "pageTitleFormat": "{projectName} - {featureName} - {docTypeLabel}"
  }
}
```

## ラベルのカスタマイズ

`autoLabels`で自動付与されるラベルをカスタマイズできます。

**利用可能な変数**:
- `{projectLabel}` - プロジェクトラベル（`.kiro/project.json`の`confluenceLabels[0]`）
- `{docType}` - ドキュメントタイプ（requirements, design, tasks）
- `{featureName}` - 機能名

**設定例**:
```json
{
  "confluence": {
    "autoLabels": [
      "{projectLabel}",
      "{docType}",
      "{featureName}",
      "custom-label"
    ]
  }
}
```

## JIRA設定のカスタマイズ

### Story作成粒度

**設定例1: 全Storyを作成（デフォルト）**
```json
{
  "jira": {
    "storyCreationGranularity": "all"
  }
}
```

**設定例2: 指定フェーズのみ作成**
```json
{
  "jira": {
    "storyCreationGranularity": "selected-phases",
    "selectedPhases": ["implementation", "testing"]
  }
}
```

### Epic作成の制御

**設定例: Epic作成をスキップ**
```json
{
  "jira": {
    "createEpic": false
  }
}
```

### Story Points設定

**設定例1: 自動抽出（デフォルト）**
```json
{
  "jira": {
    "storyPoints": "auto"
  }
}
```

**設定例2: Story Pointsを設定しない**
```json
{
  "jira": {
    "storyPoints": "disabled"
  }
}
```

## ワークフロー設定のカスタマイズ

### フェーズの有効化

**設定例: 設計フェーズをスキップ**
```json
{
  "workflow": {
    "enabledPhases": ["requirements", "tasks"]
  }
}
```

### 承認者の設定

**設定例: 日本語ロール名を使用**
```json
{
  "workflow": {
    "approvalGates": {
      "requirements": ["PL", "部長"],
      "design": ["アーキテクト", "部長"],
      "release": ["SM", "部長"]
    }
  }
}
```

## グローバル設定

全プロジェクトで共通の設定は、グローバル設定として保存できます。

### グローバル設定の作成

```bash
npm run config:global
```

このツールで `~/.michi/config.json` を作成できます。

### グローバル設定のメリット

- 新規プロジェクトごとに同じ設定を繰り返し入力する必要がない
- 組織標準の設定を統一できる
- プロジェクト固有の設定で上書き可能

### 設定の優先順位

設定値は以下の優先順位で決定されます：

1. **`spec.json`**: 機能固有の設定（最優先）
2. **`.michi/config.json`**: プロジェクト固有の設定
3. **`~/.michi/config.json`**: グローバル設定
4. **環境変数**: システム環境変数または`.env`ファイル
5. **デフォルト値**: スキーマで定義されたデフォルト値

### 使い方

1. **コマンド実行**: `npm run config:global`
2. **設定項目を選択**:
   - Confluence設定のカスタマイズ
   - JIRA設定のカスタマイズ
   - ワークフロー設定のカスタマイズ
3. **各設定を対話的に入力**: プロンプトに従って選択・入力
4. **設定を確認**: 最終的な設定内容を確認
5. **保存**: 設定ファイルを`~/.michi/config.json`に保存

### プロジェクト設定との使い分け

- **グローバル設定（`~/.michi/config.json`）**: 組織全体で共通の設定（Confluence階層構造、JIRA Story作成粒度など）
- **プロジェクト設定（`.michi/config.json`）**: プロジェクト固有の設定（特定プロジェクトのみカスタマイズが必要な場合）

**推奨フロー**:
1. 初回: `npm run config:global` でグローバル設定を作成
2. プロジェクトごと: `michi init` で初期化（グローバル設定を自動コピー）
3. カスタマイズ: 必要に応じて `.michi/config.json` を手動編集

## プロジェクト固有の設定

プロジェクト固有の`.michi/config.json`は以下の方法で作成できます：

### 自動作成（推奨）

```bash
# プロジェクト初期化時にグローバル設定から自動コピー
michi init
```

### 手動作成

1. グローバル設定をコピー：
```bash
cp ~/.michi/config.json .michi/config.json
```

2. プロジェクト固有のカスタマイズを適用：
   - Confluence設定のカスタマイズ
   - JIRA設定のカスタマイズ
   - ワークフロー設定のカスタマイズ

3. 設定ファイルを保存

**注意**: グローバル設定（`~/.michi/config.json`）を作成する場合は、`npm run config:global` を使用してください。

### 設定項目

- **Confluence階層構造**: 5つのパターンから選択
- **ページタイトル形式**: カスタマイズ可能
- **JIRA Story作成粒度**: 全作成/フェーズごと/選択フェーズのみ
- **ワークフロー有効化フェーズ**: 要件定義/設計/タスク分割から選択
- **承認者**: 各フェーズの承認者を設定

## 設定ファイルのバリデーション

設定ファイルの妥当性をチェックするには、以下のコマンドを実行します：

```bash
# 設定ファイルのバリデーション
npx @sk8metal/michi-cli config:validate

# または
michi config:validate
```

## 完全な設定例

```json
{
  "confluence": {
    "pageCreationGranularity": "by-hierarchy",
    "pageTitleFormat": "[{projectName}] {featureName} {docTypeLabel}",
    "autoLabels": [
      "{projectLabel}",
      "{docType}",
      "{featureName}",
      "github-sync"
    ],
    "hierarchy": {
      "mode": "simple",
      "parentPageTitle": "[{projectName}] {featureName}"
    }
  },
  "jira": {
    "storyCreationGranularity": "all",
    "createEpic": true,
    "storyPoints": "auto",
    "autoLabels": [
      "{projectLabel}",
      "{featureName}",
      "{phaseLabel}"
    ]
  },
  "workflow": {
    "enabledPhases": [
      "requirements",
      "design",
      "tasks"
    ],
    "approvalGates": {
      "requirements": ["pm", "director"],
      "design": ["architect", "director"],
      "release": ["sm", "director"]
    }
  }
}
```

## 後方互換性

- 設定ファイルが存在しない場合はデフォルト設定を使用（既存動作を維持）
- 環境変数は引き続き優先（既存の`.env`設定が動作）
- 段階的な移行を可能にする

## トラブルシューティング

### 設定ファイルが読み込まれない

1. `.michi/config.json`がプロジェクトルートに存在するか確認
2. JSONの構文エラーがないか確認
3. 設定ファイルのパスが正しいか確認

### 階層構造が作成されない

1. `pageCreationGranularity`が正しく設定されているか確認
2. `hierarchy`設定が適切に設定されているか確認
3. Confluence APIの権限を確認

### バリデーションエラー

1. エラーメッセージを確認
2. スキーマに準拠しているか確認
3. 必須フィールドが設定されているか確認

## 参考リンク

### Michi関連
- [セットアップガイド](../getting-started/setup.md)
- [ワークフローガイド](./workflow.md)
- [新規リポジトリセットアップ](../getting-started/new-repository-setup.md)
- [設定値リファレンス](../reference/config.md)

### cc-sdd関連
- [cc-sdd カスタマイズガイド](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/ja/customization-guide.md) - テンプレート・ルール・Steeringのカスタマイズ方法
- [cc-sdd コマンドリファレンス](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/ja/command-reference.md) - `/kiro:steering-custom`などのコマンド詳細
- [cc-sdd Spec-Driven Guide](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/ja/spec-driven.md) - 仕様駆動開発のワークフロー

