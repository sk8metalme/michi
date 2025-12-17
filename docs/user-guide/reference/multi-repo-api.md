# Multi-Repo API仕様書

このドキュメントは、Multi-Repo機能のAPI仕様を定義します。データモデル、設定スキーマ、外部API統合、内部APIのインターフェースを含みます。

## 目次

1. [データモデル](#データモデル)
2. [設定スキーマ](#設定スキーマ)
3. [外部API統合](#外部api統合)
4. [内部API](#内部api)

---

## データモデル

### MultiRepoProject

Multi-Repoプロジェクトを表すデータモデル。

```typescript
interface MultiRepoProject {
  name: string;           // プロジェクト名（1-100文字、パス区切り文字・制御文字禁止）
  jiraKey: string;        // JIRAキー（2-10文字の大文字英字）
  confluenceSpace: string; // Confluenceスペースキー
  createdAt: string;      // 作成日時（ISO 8601形式）
  repositories: Repository[]; // リポジトリリスト
}
```

**バリデーションルール:**
- `name`:
  - 長さ: 1-100文字
  - 禁止文字: `/`, `\`, `.`, `..`, 制御文字（`\x00-\x1F`, `\x7F`）
- `jiraKey`: 正規表現 `/^[A-Z]{2,10}$/`（2-10文字の大文字英字のみ）
- `confluenceSpace`: 非空文字列
- `createdAt`: ISO 8601形式（タイムゾーン付き）
- `repositories`: Repositoryの配列（デフォルト: 空配列）

### Repository

Multi-Repoプロジェクトに含まれるGitHubリポジトリ情報。

```typescript
interface Repository {
  name: string;   // リポジトリ名（識別用）
  url: string;    // GitHub HTTPS URL
  branch: string; // ブランチ名（デフォルト: 'main'）
}
```

**バリデーションルール:**
- `name`: 非空文字列
- `url`:
  - プロトコル: HTTPS必須
  - 形式: `https://github.com/{owner}/{repo}`
  - 禁止: `.git`拡張子、プレースホルダー値（`your-org`, `your-repo`, `repo-name`）
- `branch`: デフォルト値 `'main'`

---

## 設定スキーマ

### AppConfigSchema

`.michi/config.json`のトップレベル設定スキーマ。

```typescript
interface AppConfig {
  confluence?: ConfluenceConfig;
  jira?: JiraConfig;
  workflow?: WorkflowConfig;
  validation?: ValidationConfig;
  atlassian?: AtlassianConfig;
  project?: ProjectMeta;
  multiRepoProjects?: MultiRepoProject[]; // Multi-Repo拡張
}
```

### MultiRepoProjectSchema

Multi-Repoプロジェクトのスキーマ定義（Zod）。

```typescript
import { z } from 'zod';

export const MultiRepoProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Project name must be at least 1 character' })
    .max(100, { message: 'Project name must be at most 100 characters' })
    .refine(
      (name) => {
        // パストラバーサル対策
        if (name.includes('/') || name.includes('\\')) return false;
        // 相対パス対策
        if (name === '.' || name === '..') return false;
        // 制御文字対策
        const controlCharRegex = /[\x00-\x1F\x7F]/;
        if (controlCharRegex.test(name)) return false;
        return true;
      },
      {
        message: 'Project name must not contain path traversal characters (/, \\), relative path components (., ..), or control characters',
      }
    ),
  jiraKey: z
    .string()
    .min(1)
    .regex(/^[A-Z]{2,10}$/, {
      message: 'JIRA key must be 2-10 uppercase letters',
    }),
  confluenceSpace: z.string().min(1, {
    message: 'Confluence space must be a non-empty string',
  }),
  createdAt: z.string().datetime({
    offset: true,
    message: 'createdAt must be in ISO 8601 format',
  }),
  repositories: z.array(RepositorySchema).default([]),
});
```

### RepositorySchema

リポジトリのスキーマ定義（Zod）。

```typescript
export const RepositorySchema = z.object({
  name: z.string().min(1),
  url: z
    .string()
    .url()
    .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+$/, {
      message: 'GitHub URL must be in format: https://github.com/{owner}/{repo}',
    }),
  branch: z.string().default('main'),
});
```

### バリデーション関数

#### validateProjectName

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProjectName(name: string): ValidationResult;
```

**用途**: プロジェクト名のセキュリティバリデーション（パストラバーサル、相対パス、制御文字対策）

**戻り値**:
- `isValid`: バリデーション成功の場合 `true`
- `errors`: エラーメッセージの配列
- `warnings`: 警告メッセージの配列

#### validateJiraKey

```typescript
export function validateJiraKey(key: string): ValidationResult;
```

**用途**: JIRAキーの形式バリデーション（2-10文字の大文字英字）

#### validateRepositoryUrl

```typescript
export function validateRepositoryUrl(url: string): ValidationResult;
```

**用途**: リポジトリURLの形式バリデーション（GitHub HTTPS URLのみ許可）

**検証項目**:
- HTTPSプロトコル必須
- GitHub URL形式: `https://github.com/{owner}/{repo}`
- `.git`拡張子禁止
- プレースホルダー値禁止
- SSH URL形式（`git@github.com:`）禁止

---

## 外部API統合

### GitHub Actions API

Multi-Repo機能は、GitHub Actions APIを使用してWorkflow Runsを取得します。

#### 使用ライブラリ

- `@octokit/rest`: GitHub REST APIクライアント

#### 認証

環境変数 `GITHUB_TOKEN` にPersonal Access Token（PAT）を設定。

**必要なスコープ**:
- `repo`: リポジトリへのフルアクセス（publicリポジトリの場合は `public_repo`）
- `workflow`: GitHub Actionsワークフローへのアクセス

#### API呼び出し例

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Workflow Runs取得
const response = await octokit.actions.listWorkflowRunsForRepo({
  owner: 'gotalab',
  repo: 'michi',
  branch: 'main',
  status: 'completed',
  per_page: 1,
});

const latestRun = response.data.workflow_runs[0];
console.log(`Status: ${latestRun.conclusion}`);
```

#### レート制限対策

- **Exponential Backoff**: レート制限エラー（403）発生時、指数関数的に待機時間を増やして再試行
- **再試行回数**: 最大3回
- **待機時間**: 1秒、2秒、4秒

```typescript
async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status !== 403 || attempt === maxRetries - 1) {
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Confluence API

Multi-Repo機能は、Confluence REST APIを使用してページの作成・更新を行います。

#### 認証

環境変数による認証:
- `ATLASSIAN_URL`: Atlassianインスタンス URL（例: `https://your-company.atlassian.net`）
- `ATLASSIAN_EMAIL`: Atlassianアカウントのメールアドレス
- `ATLASSIAN_API_TOKEN`: Atlassian API トークン（[アカウント設定](https://id.atlassian.com/manage/api-tokens)で生成）

#### API呼び出し例

```typescript
import axios from 'axios';

const config = {
  url: process.env.ATLASSIAN_URL,
  email: process.env.ATLASSIAN_EMAIL,
  apiToken: process.env.ATLASSIAN_API_TOKEN,
  space: 'PRD',
};

const baseUrl = `${config.url}/wiki/rest/api`;
const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

// ページ検索
const response = await axios.get(`${baseUrl}/content/search`, {
  params: {
    cql: `space = PRD AND title = "My Project"`,
    expand: 'version',
  },
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
});

const page = response.data.results[0];
console.log(`Page ID: ${page.id}`);
```

#### ページ作成例

```typescript
// ページ作成ペイロード
const payload = {
  type: 'page',
  title: 'My Project',
  space: { key: 'PRD' },
  body: {
    storage: {
      value: '<p>This is the page content.</p>',
      representation: 'storage',
    },
  },
  metadata: {
    labels: [{ name: 'multi-repo' }, { name: 'michi' }],
  },
  ancestors: [{ id: '12345678' }], // 親ページID（オプション）
};

const response = await axios.post(`${baseUrl}/content`, payload, {
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
});

console.log(`Created page: ${response.data.id}`);
```

#### レート制限対策

- **リクエスト間隔**: デフォルト500ms（環境変数 `ATLASSIAN_REQUEST_DELAY` で調整可能）
- **待機処理**: すべてのAPI呼び出し前に `sleep()` 関数で待機

```typescript
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest() {
  await sleep(500); // レート制限対策
  const response = await axios.get(url);
  return response.data;
}
```

---

## 内部API

### ConfigManagement

設定ファイル（`.michi/config.json`）の読み込み・書き込み・バリデーションを行うAPI。

#### getConfig

```typescript
export function getConfig(rootDir?: string): AppConfig;
```

**用途**: プロジェクト設定を読み込み、デフォルト設定とマージして返す。

**引数**:
- `rootDir` (optional): プロジェクトルートディレクトリ（省略時はカレントディレクトリ）

**戻り値**: `AppConfig` オブジェクト（型安全、Zodバリデーション済み）

**動作**:
1. デフォルト設定読み込み（`scripts/config/default-config.json`）
2. グローバル設定読み込み（`~/.michi/config.json`）
3. プロジェクト設定読み込み（`.michi/config.json`）
4. 設定マージ（優先順位: プロジェクト > グローバル > デフォルト）
5. Zodスキーマバリデーション
6. キャッシング（ファイル更新時刻を監視）

**例**:

```typescript
import { getConfig } from './scripts/utils/config-loader.js';

const config = getConfig('/path/to/project');
console.log(config.multiRepoProjects.length);
```

#### saveConfig

```typescript
export function saveConfig(config: AppConfig, rootDir?: string): void;
```

**用途**: プロジェクト設定を `.michi/config.json` に保存。

**引数**:
- `config`: 保存する設定オブジェクト
- `rootDir` (optional): プロジェクトルートディレクトリ

**動作**:
1. Zodスキーマバリデーション
2. JSON形式で保存（インデント2スペース）
3. キャッシュクリア

**例**:

```typescript
import { getConfig, saveConfig } from './scripts/utils/config-loader.js';

const config = getConfig();
config.multiRepoProjects.push({
  name: 'my-project',
  jiraKey: 'MYPROJ',
  confluenceSpace: 'PRD',
  createdAt: new Date().toISOString(),
  repositories: [],
});
saveConfig(config);
```

#### clearConfigCache

```typescript
export function clearConfigCache(): void;
```

**用途**: 設定キャッシュをクリア（テスト用）。

### GitHubActionsClient

GitHub Actions APIへのアクセスを抽象化し、Workflow Runsの取得とレート制限対策を提供。

#### コンストラクタ

```typescript
export class GitHubActionsClient {
  constructor();
}
```

**用途**: GitHub Actions Clientのインスタンスを作成。

**動作**:
- 環境変数 `GITHUB_TOKEN` を読み込み
- Octokitインスタンスを初期化

**エラー**: `GITHUB_TOKEN` が未設定の場合、エラーをスロー

**例**:

```typescript
import { GitHubActionsClient } from './scripts/github-actions-client.js';

const client = new GitHubActionsClient();
```

#### getLatestWorkflowRun

```typescript
async getLatestWorkflowRun(
  owner: string,
  repo: string,
  branch: string
): Promise<Result<IGitHubWorkflowRun, GitHubAPIError>>;
```

**用途**: 指定リポジトリ・ブランチの最新Workflow Runを取得。

**引数**:
- `owner`: リポジトリオーナー（例: `'gotalab'`）
- `repo`: リポジトリ名（例: `'michi'`）
- `branch`: ブランチ名（例: `'main'`）

**戻り値**: `Result<IGitHubWorkflowRun, GitHubAPIError>`
- 成功時: `{ success: true, data: IGitHubWorkflowRun }`
- 失敗時: `{ success: false, error: GitHubAPIError }`

**エラー型**:

```typescript
export type GitHubAPIError =
  | { type: 'RATE_LIMIT_EXCEEDED'; retryAfter: number }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'SERVER_ERROR'; message: string; statusCode: number };
```

**例**:

```typescript
const result = await client.getLatestWorkflowRun('gotalab', 'michi', 'main');

if (result.success) {
  const run = result.data;
  console.log(`Status: ${run.conclusion}`);
} else {
  const error = result.error;
  if (error.type === 'RATE_LIMIT_EXCEEDED') {
    console.error(`Rate limit exceeded. Retry after ${error.retryAfter} seconds.`);
  } else {
    console.error(`Error: ${error.message}`);
  }
}
```

#### IGitHubWorkflowRun

```typescript
export interface IGitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: 'completed' | 'in_progress' | 'queued';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}
```

#### parseGitHubWorkflowRun

```typescript
export function parseGitHubWorkflowRun(
  run: IGitHubWorkflowRun
): Omit<IRepositoryCIStatus, 'name' | 'url' | 'branch'>;
```

**用途**: GitHub Workflow Runを解析してCI結果に変換。

**引数**: `IGitHubWorkflowRun` オブジェクト

**戻り値**: 部分的な `IRepositoryCIStatus` オブジェクト

```typescript
{
  status: 'success' | 'failure' | 'running' | 'unknown';
  testStatus: 'passed' | 'failed' | 'skipped' | 'unknown';
  lastExecutionTime: Date;
  failureDetails?: string;
}
```

**変換ルール**:
- `status === 'completed' && conclusion === 'success'` → `status: 'success', testStatus: 'passed'`
- `status === 'completed' && conclusion === 'failure'` → `status: 'failure', testStatus: 'failed'`
- `status === 'in_progress' || status === 'queued'` → `status: 'running', testStatus: 'unknown'`
- その他 → `status: 'unknown', testStatus: 'unknown'`

### ConfluenceClient

Confluence REST APIへのアクセスを抽象化し、ページの検索・作成・更新を提供。

#### コンストラクタ

```typescript
export class ConfluenceClient {
  constructor(config: ConfluenceConfig);
}

interface ConfluenceConfig {
  url: string;
  email: string;
  apiToken: string;
  space: string;
}
```

**用途**: Confluence Clientのインスタンスを作成。

**例**:

```typescript
import { ConfluenceClient, getConfluenceConfig } from './scripts/confluence-sync.js';

const config = getConfluenceConfig();
const client = new ConfluenceClient(config);
```

#### searchPage

```typescript
async searchPage(
  spaceKey: string,
  title: string,
  parentId?: string
): Promise<ConfluencePage | null>;
```

**用途**: Confluenceページを検索。

**引数**:
- `spaceKey`: Confluenceスペースキー（例: `'PRD'`）
- `title`: ページタイトル（完全一致）
- `parentId` (optional): 親ページID（指定時は子ページのみ検索）

**戻り値**: `ConfluencePage | null`
- 見つかった場合: `ConfluencePage` オブジェクト
- 見つからない場合: `null`

**例**:

```typescript
const page = await client.searchPage('PRD', 'My Project');
if (page) {
  console.log(`Page ID: ${page.id}`);
} else {
  console.log('Page not found');
}
```

#### createPage

```typescript
async createPage(
  spaceKey: string,
  title: string,
  content: string,
  parentId?: string,
  labels?: string[]
): Promise<ConfluencePage>;
```

**用途**: Confluenceページを作成。

**引数**:
- `spaceKey`: Confluenceスペースキー
- `title`: ページタイトル
- `content`: ページ内容（Confluence Storage形式）
- `parentId` (optional): 親ページID
- `labels` (optional): ページラベルの配列

**戻り値**: 作成された `ConfluencePage` オブジェクト

**例**:

```typescript
const page = await client.createPage(
  'PRD',
  'My Project',
  '<p>This is the page content.</p>',
  '12345678',
  ['multi-repo', 'michi']
);
console.log(`Created page: ${page.id}`);
```

#### updatePage

```typescript
async updatePage(
  pageId: string,
  title: string,
  content: string,
  currentVersion: number
): Promise<ConfluencePage>;
```

**用途**: 既存Confluenceページを更新。

**引数**:
- `pageId`: ページID
- `title`: ページタイトル
- `content`: 更新後のページ内容（Confluence Storage形式）
- `currentVersion`: 現在のページバージョン番号

**戻り値**: 更新された `ConfluencePage` オブジェクト

**例**:

```typescript
const existingPage = await client.searchPage('PRD', 'My Project');
if (existingPage) {
  const updatedPage = await client.updatePage(
    existingPage.id,
    'My Project',
    '<p>Updated content.</p>',
    existingPage.version!.number
  );
  console.log(`Updated page: ${updatedPage.id}`);
}
```

#### ConfluencePage

```typescript
export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  version?: {
    number: number;
  };
  _links?: {
    webui: string;
  };
  ancestors?: Array<{ id: string }>;
}
```

### MermaidConverter

MarkdownテキストからMermaidブロックを検出し、Confluenceマクロ形式に変換。

#### convertMermaidToConfluence

```typescript
export class MermaidConverter {
  convertMermaidToConfluence(markdown: string): string;
}
```

**用途**: MarkdownテキストからMermaidブロック（` ```mermaid ... ``` `）を検出し、Confluenceマクロ形式（`<ac:structured-macro ac:name="mermaid">`）に変換。

**引数**:
- `markdown`: Markdownテキスト

**戻り値**: 変換後のテキスト

**変換ルール**:
1. ` ```mermaid\n...\n``` ` 形式を検出
2. Mermaidコードを抽出
3. CDATA内の `]]>` をエスケープ（`]]]]><![CDATA[>` に置換）
4. Confluenceマクロ形式に変換

**例**:

```typescript
import { MermaidConverter } from './scripts/mermaid-converter.js';

const converter = new MermaidConverter();
const markdown = `
# My Diagram

\`\`\`mermaid
graph TD
  A[Start] --> B[End]
\`\`\`
`;

const converted = converter.convertMermaidToConfluence(markdown);
console.log(converted);
// Output:
// # My Diagram
//
// <ac:structured-macro ac:name="mermaid">
//   <ac:plain-text-body><![CDATA[graph TD
//   A[Start] --> B[End]]]></ac:plain-text-body>
// </ac:structured-macro>
```

---

## セキュリティ考慮事項

### パストラバーサル対策

- プロジェクト名、リポジトリ名に `/`, `\`, `.`, `..` を禁止
- 制御文字（`\x00-\x1F`, `\x7F`）を禁止
- 固定パスプレフィックス使用（`docs/michi/{project-name}/`）

### コマンドインジェクション対策

- `execSync()` の引数に固定パスを使用
- ユーザー入力を直接シェルコマンドに渡さない
- リポジトリURLはHTTPS GitHub URLのみ許可

### 認証情報管理

- 環境変数による認証情報管理（`.env`ファイル）
- API Tokenは平文で保存しない
- `.env`ファイルを `.gitignore` に追加

---

## 関連ドキュメント

- [Multi-Repoユーザーガイド](../guides/multi-repo-guide.md)
- [設定リファレンス](./config.md)
- [クイックリファレンス](./quick-reference.md)
