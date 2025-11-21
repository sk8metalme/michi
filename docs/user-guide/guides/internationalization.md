# AI駆動多言語対応ガイド

> **凡例について**: `<feature>` などの記号の意味は [README.md#凡例の記号説明](../../README.md#凡例の記号説明) を参照してください。

## 概要

Michiは、cc-sdd準拠のAI駆動多言語対応システムを採用しています。このアプローチでは、静的な翻訳ファイルを使用せず、AIの多言語生成能力を最大限に活用します。

### 主な特徴

- ✅ **単一の英語テンプレート**: 翻訳ファイル不要、英語テンプレートのみ管理
- ✅ **AI駆動生成**: 実行時に目的言語で出力を生成
- ✅ **12言語サポート**: 日本語、英語、中国語（繁体字/簡体字）、スペイン語、ポルトガル語、ドイツ語、フランス語、ロシア語、イタリア語、韓国語、アラビア語
- ✅ **1行で言語追加**: 新言語追加が簡単
- ✅ **ゼロ依存**: 外部i18nライブラリ不要

## 設計思想

### Think in English, Generate in Target Language

```typescript
const DEV_GUIDELINES_MAP = {
    ja: '- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)'
};
```

この指示により：

1. **AIは英語で推論**: 最高品質の推論能力を発揮
2. **出力は目的言語で生成**: 自然で文化的に適切な表現
3. **翻訳臭さを回避**: 機械翻訳的な不自然さがない

### 従来のアプローチとの比較

#### ❌ 従来のi18nアプローチ（不採用）

```
locales/ja/rules/michi-core.md       ← 日本語翻訳ファイル
locales/en/rules/michi-core.md       ← 英語ファイル
locales/zh/rules/michi-core.md       ← 中国語翻訳ファイル
locales/es/rules/michi-core.md       ← スペイン語翻訳ファイル
...
```

**問題点**:
- 翻訳ファイル12個×ファイル数の管理負担
- 翻訳の品質管理が困難
- 更新時の同期作業が発生
- 翻訳の一貫性を保つのが難しい
- ファイル数の爆発（言語 × ファイル）

#### ✅ AI駆動アプローチ（採用）

```
templates/cursor/rules/github-ssot.md (英語のみ)
+ {{DEV_GUIDELINES}} プレースホルダー
+ AI が実行時に指定言語で生成
```

**利点**:
- 英語テンプレート1つのみ管理
- 新言語追加が1行で完了
- AIの多言語能力を最大限活用
- 文脈依存の自然な表現
- メンテナンスコストが低い

### メタデータ駆動

プロジェクトの言語設定は `.kiro/project.json` で管理：

```json
{
  "projectId": "my-project",
  "language": "ja"
}
```

AIコマンド実行時、このメタデータを読み取り、指定言語で出力を生成します。

## サポート言語

Michiは以下の12言語をサポートしています：

| 言語コード | 言語名 | DEV_GUIDELINES |
|-----------|--------|----------------|
| `en` | English | Think in English, generate responses in English |
| `ja` | 日本語 | Think in English, but generate responses in Japanese |
| `zh-TW` | 繁體中文 | 以英文思考,但以繁體中文生成回應 |
| `zh` | 简体中文 | 以英文思考,但以简体中文生成回复 |
| `es` | Español | Think in English, generate responses in Spanish |
| `pt` | Português | Think in English, generate responses in Portuguese |
| `de` | Deutsch | Think in English, generate responses in German |
| `fr` | Français | Think in English, generate responses in French |
| `ru` | Русский | Think in English, generate responses in Russian |
| `it` | Italiano | Think in English, generate responses in Italian |
| `ko` | 한국어 | Think in English, generate responses in Korean |
| `ar` | العربية | Think in English, generate responses in Arabic |

## プレースホルダーシステム

### 利用可能なプレースホルダー

テンプレートで使用できるプレースホルダー：

| プレースホルダー | 説明 | 例 |
|-----------------|------|-----|
| `{{LANG_CODE}}` | 言語コード | `ja`, `en` |
| `{{DEV_GUIDELINES}}` | 開発ガイドライン | `- Think in English, but generate responses in Japanese...` |
| `{{KIRO_DIR}}` | Kiroディレクトリ名 | `.kiro` |
| `{{AGENT_DIR}}` | エージェントディレクトリ名 | `.cursor`, `.claude` |
| `{{PROJECT_ID}}` | プロジェクトID | `my-project` |
| `{{FEATURE_NAME}}` | 機能名 | `user-auth` |
| `{{TIMESTAMP}}` | タイムスタンプ | `2025-01-15T10:30:00Z` |

### プレースホルダーの置換ルール

プレースホルダーは正規表現ベースで置換されます：

```typescript
template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
  const value = context[key];
  return value !== undefined ? String(value) : match;
});
```

**重要**: プレースホルダー名は：
- 大文字のみ（`A-Z`）
- アンダースコア区切り（`_`）
- 二重中括弧で囲む（`{{...}}`）

## テンプレート作成ガイド

### 基本的なテンプレート構造

英語でテンプレートを作成し、`{{DEV_GUIDELINES}}`プレースホルダーを挿入します。

**テンプレート例** (`templates/cursor/rules/github-ssot.md`):

```markdown
---
title: GitHub Single Source of Truth Rules
description: {{DEV_GUIDELINES}} for using GitHub as SSoT and syncing with Confluence
---

# GitHub Single Source of Truth (SSoT) Rules

## Basic Principles

### Single Source of Truth
- **All specifications managed in GitHub** (.kiro/specs/)
- Confluence is **for reference and approval only** (edit only in GitHub)
- Avoid dual management

### Data Flow
```
GitHub (.kiro/specs/)  ← Source of Truth (editable)
    ↓ sync
Confluence ← View & Approval only (read-only)
```
```

### `{{DEV_GUIDELINES}}`の挿入位置

`{{DEV_GUIDELINES}}`は以下の場所に挿入することを推奨します：

1. **ファイルヘッダーのdescription**: メタデータとして
2. **開発ルールセクション**: AIへの指示として
3. **コマンドの説明**: 出力言語の指定として

**推奨パターン**:

```markdown
---
title: Rule Name
description: {{DEV_GUIDELINES}} for specific context
---

# Rule Title

## Development Guidelines

{{DEV_GUIDELINES}}

## Other Sections
...
```

### レンダリング結果

上記のテンプレートが日本語（`ja`）でレンダリングされた場合：

```markdown
---
title: GitHub Single Source of Truth Rules
description: - Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように) for using GitHub as SSoT and syncing with Confluence
---

# GitHub Single Source of Truth (SSoT) Rules

## Basic Principles
...
```

## 実装詳細

### TemplateContext

テンプレートコンテキストは `createTemplateContext()` 関数で作成されます：

```typescript
// scripts/template/renderer.ts
export interface TemplateContext {
  LANG_CODE: SupportedLanguage;
  DEV_GUIDELINES: string;
  KIRO_DIR: string;
  AGENT_DIR: string;
  PROJECT_ID?: string;
  FEATURE_NAME?: string;
  TIMESTAMP?: string;
}

export const createTemplateContext = (
  lang: SupportedLanguage,
  kiroDir: string,
  agentDir: string
): TemplateContext => ({
  LANG_CODE: lang,
  DEV_GUIDELINES: getDevGuidelines(lang),
  KIRO_DIR: kiroDir,
  AGENT_DIR: agentDir,
});
```

### DEV_GUIDELINES_MAP

各言語のガイドラインは `scripts/constants/languages.ts` で定義されています：

```typescript
export const DEV_GUIDELINES_MAP: Record<SupportedLanguage, string> = {
  en: '- Think in English, generate responses in English',
    
  ja: '- Think in English, but generate responses in Japanese ' +
        '(思考は英語、回答の生成は日本語で行うように)',
    
  'zh-TW': '- 以英文思考,但以繁體中文生成回應' +
             '(Think in English, generate in Traditional Chinese)',
    
  // ... 他の言語
};
```

### レンダリング処理

テンプレートのレンダリングは `renderTemplate()` 関数で行われます：

```typescript
// scripts/template/renderer.ts
export const renderTemplate = (
  template: string,
  context: TemplateContext
): string => {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    const value = context[key as keyof TemplateContext];
    return value !== undefined ? String(value) : match;
  });
};
```

### プロジェクトセットアップでの使用

`setup-existing` コマンドでテンプレートコンテキストが作成され、テンプレートがレンダリングされます：

```typescript
// src/commands/setup-existing.ts (L374-378)
const templateContext = createTemplateContext(
  config.langCode,
  '.kiro',
  envConfig.rulesDir.startsWith('.') 
    ? envConfig.rulesDir.substring(1, envConfig.rulesDir.indexOf('/', 1)) 
    : envConfig.rulesDir.split('/')[0]
);

// テンプレートをコピーしてレンダリング
copyAndRenderTemplates(templateSourceDir, destDir, templateContext);
```

## 新言語の追加方法

新しい言語を追加するのは非常に簡単です。

### Step 1: DEV_GUIDELINES_MAPに追加

`scripts/constants/languages.ts` を編集：

```typescript
export const supportedLanguages = [
  'ja', 'en', 'zh-TW', 'zh', 'es', 'pt', 
  'de', 'fr', 'ru', 'it', 'ko', 'ar',
  'vi' // ← 新しい言語を追加（ベトナム語の例）
] as const;

export const DEV_GUIDELINES_MAP: Record<SupportedLanguage, string> = {
  // ... 既存の言語
  
  vi: '- Think in English, generate responses in Vietnamese ' +
        '(Suy nghĩ bằng tiếng Anh, trả lời bằng tiếng Việt)',
};
```

### Step 2: テスト追加（推奨）

`scripts/constants/__tests__/languages.test.ts` にテストを追加：

```typescript
it('should have Vietnamese guideline', () => {
  expect(DEV_GUIDELINES_MAP.vi).toContain('Think in English');
  expect(DEV_GUIDELINES_MAP.vi).toContain('Vietnamese');
});
```

### Step 3: 完了

これだけです！新しい言語が即座に利用可能になります：

```bash
# ベトナム語でプロジェクトをセットアップ
npx @sk8metal/michi-cli setup-existing --cursor --lang vi
```

## 使用例

### Cursorでのプロジェクトセットアップ

```bash
# 日本語（デフォルト）
npx @sk8metal/michi-cli setup-existing --cursor

# 英語
npx @sk8metal/michi-cli setup-existing --cursor --lang en

# スペイン語
npx @sk8metal/michi-cli setup-existing --cursor --lang es
```

### 対話的セットアップ

```bash
# 対話的プロンプトで言語を選択
npx @sk8metal/michi-cli setup-existing

# 出力例:
# 環境を選択してください:
#   1) Cursor IDE (推奨)
#   2) Claude Code
#   3) Claude Code Subagents
# 選択 [1-3] (デフォルト: 1): 1
# プロジェクト名（例: プロジェクトA）: My Project
# JIRAプロジェクトキー（例: PRJA）: MYPROJ
```

### プログラムからの使用

```typescript
import { setupExisting } from '@sk8metal/michi-cli/commands';

await setupExisting({
  cursor: true,
  lang: 'ja',
  projectName: 'マイプロジェクト',
  jiraKey: 'MYPROJ'
});
```

## トラブルシューティング

### テンプレートが正しくレンダリングされない

**症状**: `{{DEV_GUIDELINES}}`がそのまま残っている

**原因**: プレースホルダー名が大文字でない、または形式が正しくない

**解決方法**:
- プレースホルダー名を確認: `{{DEV_GUIDELINES}}` (大文字のみ)
- 二重中括弧を確認: `{{...}}` (シングル括弧は不可)

### サポートされていない言語コードを指定

**症状**: `Unsupported language: xx` エラー

**原因**: 指定された言語コードがサポートされていない

**解決方法**:
- サポート言語リストを確認（本ドキュメントの「サポート言語」セクション参照）
- 新しい言語を追加（「新言語の追加方法」セクション参照）

### テンプレートファイルが見つからない

**症状**: `Templates directory not found` エラー

**原因**: テンプレートディレクトリが存在しない、またはパスが正しくない

**解決方法**:
```bash
# パッケージが正しくインストールされているか確認
npm list @sk8metal/michi-cli

# 再インストール
npm install -g @sk8metal/michi-cli
```

## ベストプラクティス

### 1. 英語でテンプレートを作成

すべてのテンプレートは英語で記述してください。AIが各言語で適切に生成します。

**推奨**:
```markdown
# User Authentication Rules

{{DEV_GUIDELINES}}

## Basic Principles
- Use secure password hashing
- Implement 2FA for sensitive operations
```

**非推奨**: 各言語で個別ファイルを作成
```
templates/ja/auth.md  ← 避ける
templates/en/auth.md  ← 避ける
```

### 2. `{{DEV_GUIDELINES}}`を適切な場所に配置

- ファイルの先頭（メタデータ内）
- AIへの指示セクション
- コンテキスト依存の場所

### 3. プレースホルダーの過度な使用を避ける

必要な場所にのみプレースホルダーを使用してください。過度な使用はテンプレートを読みにくくします。

**推奨**:
```markdown
# {{FEATURE_NAME}} Specification

Project: {{PROJECT_ID}}
Language: {{LANG_CODE}}

{{DEV_GUIDELINES}}
```

**非推奨**: 過度なプレースホルダー
```markdown
# {{TITLE_{{LANG_CODE}}}}  ← 複雑すぎる
```

### 4. テストを追加

新しい言語を追加した場合は、必ずテストを追加してください：

```typescript
describe('New Language', () => {
  it('should have guidelines for new language', () => {
    expect(DEV_GUIDELINES_MAP.newlang).toBeDefined();
    expect(DEV_GUIDELINES_MAP.newlang).toContain('Think in English');
  });
});
```

## 参考資料

### Michiドキュメント

- [クイックスタート](../getting-started/quick-start.md)
- [セットアップガイド](../getting-started/setup.md)
- [ワークフローガイド](./workflow.md)

### ソースコード

- `scripts/constants/languages.ts` - 言語定義とDEV_GUIDELINES_MAP
- `scripts/template/renderer.ts` - テンプレートレンダリングエンジン
- `src/commands/setup-existing.ts` - プロジェクトセットアップコマンド

### 外部リソース

- [cc-sdd多言語実装](https://github.com/gotalab/cc-sdd/blob/main/dist/template/context.js)
- [cc-sdd言語定義](https://github.com/gotalab/cc-sdd/blob/main/dist/constants/languages.js)

## FAQ

### Q: なぜ静的翻訳ファイルではなくAI駆動アプローチを採用したのですか？

A: 以下の理由からです：

1. **保守性**: 1つの英語テンプレートのみ管理すればよい
2. **拡張性**: 新言語追加が1行で完了
3. **品質**: AIの多言語能力により、文脈依存の自然な表現が可能
4. **軽量性**: 外部i18nライブラリ不要
5. **cc-ssd互換**: 同じ設計思想でリファレンス実装として位置づけ可能

### Q: cc-sddとの違いは何ですか？

A: Michiはcc-sddの設計思想を踏襲していますが、以下の点が異なります：

- **Michi**: プロジェクト管理特化（Confluence/JIRA連携、フェーズ管理）
- **cc-sdd**: 汎用AI駆動開発フレームワーク

多言語対応の実装方法は両者で同じです。

### Q: カスタム言語ガイドラインを追加できますか？

A: はい、`DEV_GUIDELINES_MAP`を拡張することで可能です。プロジェクト固有のガイドラインが必要な場合は、テンプレートに直接記述することも検討してください。

### Q: AIが指定した言語で出力しない場合はどうすればよいですか？

A: 以下を確認してください：

1. `.kiro/project.json`の`language`フィールドが正しいか
2. テンプレートに`{{DEV_GUIDELINES}}`が含まれているか
3. AIモデルが多言語対応しているか（Claude、GPT-4など）

それでも問題が解決しない場合は、テンプレートに追加のコンテキストを明示的に記述してください。

## まとめ

Michiの多言語対応システムは、cc-sdd準拠のAI駆動アプローチにより：

- ✅ 保守性が高い（1つの英語テンプレートのみ）
- ✅ 拡張性が高い（新言語追加が1行）
- ✅ 品質が高い（AIの多言語能力を活用）
- ✅ 軽量（外部依存なし）

このアプローチにより、開発者は翻訳管理の負担から解放され、本質的な開発作業に集中できます。





