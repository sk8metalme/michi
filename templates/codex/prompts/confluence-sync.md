---
description: Confluenceへのドキュメント同期 - Michi仕様書をConfluenceに連携
argument-hint: [FEATURE=<機能名>]
---
# Michi Confluence Sync

機能「$1」の仕様ドキュメントをConfluenceに同期します。

## 前提条件

### 環境変数の設定
以下の環境変数が必要です：
```bash
ATLASSIAN_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

### プロジェクトメタデータ
`.kiro/project.json`に以下が設定されていること：
- `confluenceSpaceKey`: Confluenceスペースキー
- `confluenceLabels`: 自動付与するラベル

## 同期対象ファイル

以下のファイルをConfluenceページに変換して同期します：

1. **要件定義書**
   - ソース: `.kiro/specs/$1/requirements.md`
   - タイトル: `[$1] 要件定義`

2. **設計ドキュメント**
   - ソース: `.kiro/specs/$1/design.md`
   - タイトル: `[$1] 設計書`

3. **タスク一覧**（オプション）
   - ソース: `.kiro/specs/$1/tasks.md`
   - タイトル: `[$1] タスク管理`

## 実行手順

### 1. 環境変数の確認
```typescript
// 必要な環境変数をチェック
const requiredEnvVars = [
  'ATLASSIAN_URL',
  'ATLASSIAN_EMAIL',
  'ATLASSIAN_API_TOKEN'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} が設定されていません`);
    process.exit(1);
  }
}
```

### 2. プロジェクトメタデータの読み込み
```typescript
import { readFileSync } from 'fs';

const projectMeta = JSON.parse(
  readFileSync('.kiro/project.json', 'utf-8')
);

const spaceKey = projectMeta.confluenceSpaceKey;
const labels = projectMeta.confluenceLabels || [];
```

### 3. Confluence APIクライアントの初期化
```typescript
import { ConfluenceClient } from '../path/to/confluence-client';

const confluence = new ConfluenceClient({
  url: process.env.ATLASSIAN_URL!,
  email: process.env.ATLASSIAN_EMAIL!,
  apiToken: process.env.ATLASSIAN_API_TOKEN!
});
```

### 4. Markdownファイルの読み込みと変換
```typescript
const requirements = readFileSync(
  `.kiro/specs/$1/requirements.md`,
  'utf-8'
);

// Markdown → Confluence Storage Format変換
const confluenceHtml = convertMarkdownToConfluence(requirements);
```

### 5. ページの作成または更新
```typescript
// 既存ページの検索
const existingPage = await confluence.findPageByTitle(
  spaceKey,
  `[$1] 要件定義`
);

if (existingPage) {
  // 更新
  await confluence.updatePage(existingPage.id, {
    title: `[$1] 要件定義`,
    body: confluenceHtml,
    version: existingPage.version + 1
  });
  console.log('✅ ページを更新しました');
} else {
  // 新規作成
  const newPage = await confluence.createPage({
    spaceKey,
    title: `[$1] 要件定義`,
    body: confluenceHtml,
    labels
  });
  console.log('✅ ページを作成しました:', newPage.url);
}
```

### 6. 同期結果の報告
```typescript
console.log('\n📊 Confluence同期結果:');
console.log(`  機能: $1`);
console.log(`  スペース: ${spaceKey}`);
console.log(`  同期ファイル数: 2`);
console.log(`  ラベル: ${labels.join(', ')}`);
```

## エラーハンドリング

### 認証エラー
```
❌ Confluence API認証失敗
- ATLASSIAN_URLが正しいか確認
- API Tokenが有効か確認
- メールアドレスが正しいか確認
```

### スペースが見つからない
```
❌ Confluenceスペースが見つかりません
- .kiro/project.jsonのconfluenceSpaceKeyを確認
- スペースへのアクセス権限を確認
```

### ページ作成失敗
```
❌ ページ作成に失敗しました
- スペースへの書き込み権限を確認
- タイトルの重複がないか確認
```

## Markdown変換の注意点

Confluenceは独自のStorage Format（XHTML）を使用するため、以下に注意：

- **コードブロック**: \`\`\`言語 → `<ac:structured-macro ac:name="code">`
- **表**: GitHub Markdown → Confluence Table
- **画像**: 相対パス → Confluence添付ファイル
- **リンク**: 他の.mdファイル → Confluenceページリンク

## 参考リソース

- [Confluence REST API ドキュメント](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/)
- [Storage Format仕様](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)
- Michiの`scripts/utils/confluence-client.ts`実装を参照

## 使用例

```bash
# Codex CLIから実行
/prompts:confluence-sync FEATURE=user-authentication

# 複数ファイルを一括同期（カスタムスクリプト）
node scripts/sync-all-specs-to-confluence.js
```
