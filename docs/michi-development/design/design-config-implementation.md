# Michi 設定統合設計書 - 実装詳細

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 6. 実装詳細

### 6.1 ConfigLoader クラス設計

ConfigLoaderは、複数の設定ファイルを読み込み、優先順位に従ってマージし、型安全なアクセスを提供するクラスです。

**ファイルパス:** `scripts/utils/config-loader-v2.ts`

**責務:**
1. 複数の設定ファイルを読み込み
2. 優先順位に従ってマージ
3. バリデーション
4. 型安全なアクセス提供
5. キャッシュによるパフォーマンス向上

**クラス定義:**

```typescript
import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

/**
 * 設定の読み込み元
 */
type ConfigSource =
  | 'global-env'      // ~/.michi/global.env
  | 'global-config'   // ~/.michi/config.json
  | 'project-meta'    // .kiro/project.json
  | 'project-config'  // .michi/config.json
  | 'project-env';    // .env

/**
 * 読み込まれた設定（ソース情報付き）
 */
interface ConfigWithSource<T> {
  value: T;
  source: ConfigSource;
}

/**
 * 統合設定
 */
interface MergedConfig {
  // Atlassian認証
  atlassian: {
    url: string;
    email: string;
    apiToken: string;
  };

  // GitHub設定
  github: {
    org: string;              // 組織名（グローバル設定から）
    token: string;            // アクセストークン（グローバル設定から）
    repository: string;       // フルURL（project.jsonから）
    repositoryShort: string;  // "org/repo" 形式（自動抽出）
    repositoryOrg: string;    // リポジトリの組織名（自動抽出）
    repositoryName: string;   // リポジトリ名（自動抽出）
  };

  // Confluenceスペース
  confluence: {
    spaces: {
      prd: string;
      qa: string;
      release: string;
    };
    // 設定
    pageCreationGranularity: string;
    pageTitleFormat?: string;
    hierarchy?: unknown;
  };

  // JIRA設定
  jira: {
    issueTypes: {
      story: string;
      subtask: string;
    };
    projectKeys: string; // プロジェクト固有
    createEpic: boolean;
    storyCreationGranularity: string;
    selectedPhases?: string[];
    storyPoints: string;
  };

  // ワークフロー設定
  workflow: {
    enabledPhases: string[];
    approvalGates?: {
      requirements?: string[];
      design?: string[];
      release?: string[];
    };
  };

  // プロジェクトメタデータ
  project: {
    id: string;
    name: string;
    language: string;
    jiraProjectKey: string;
    confluenceLabels: string[];
    status: string;
    team: string[];
    stakeholders: string[];
    repository: string;
    description: string;
  };
}

/**
 * 読み込みオプション
 */
interface LoadOptions {
  projectRoot?: string;     // プロジェクトルート（デフォルト: process.cwd()）
  skipValidation?: boolean; // バリデーションをスキップ
  useCache?: boolean;       // キャッシュを使用（デフォルト: true）
}

/**
 * 設定ローダー
 */
export class ConfigLoader {
  private cache: MergedConfig | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 60000; // 1分

  /**
   * 設定を読み込んでマージ
   */
  async load(options?: LoadOptions): Promise<MergedConfig> {
    // キャッシュチェック
    if (this.cache && options?.useCache !== false) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.cacheTTL) {
        return this.cache;
      }
    }

    const projectRoot = options?.projectRoot || process.cwd();

    // パフォーマンス計測開始
    const start = performance.now();

    // 並列読み込み
    const [globalEnv, globalConfig, projectMeta, projectConfig, projectEnv] =
      await Promise.all([
        this.loadGlobalEnv(),
        this.loadGlobalConfig(),
        this.loadProjectMeta(projectRoot),
        this.loadProjectConfig(projectRoot),
        this.loadProjectEnv(projectRoot),
      ]);

    // マージ
    const merged = this.merge([
      globalEnv,
      globalConfig,
      projectMeta,
      projectConfig,
      projectEnv,
    ]);

    // リポジトリURLのパース（project.jsonから取得）
    if (merged.project?.repository) {
      const parsed = this.parseGitHubRepository(merged.project.repository);
      merged.github = {
        ...merged.github,
        repository: parsed.url,
        repositoryShort: parsed.shortForm,
        repositoryOrg: parsed.org,
        repositoryName: parsed.repo,
      };
    }

    // バリデーション
    if (!options?.skipValidation) {
      this.validate(merged);
    }

    // キャッシュ更新
    this.cache = merged;
    this.cacheTimestamp = Date.now();

    // パフォーマンス計測終了
    const elapsed = performance.now() - start;
    if (elapsed > 100) {
      console.warn(`⚠️  設定の読み込みに ${elapsed.toFixed(2)}ms かかりました（目標: <100ms）`);
    }

    return merged;
  }

  /**
   * 設定をリロード（キャッシュをクリア）
   */
  reload(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * 特定の設定値を取得
   */
  get<T>(path: string): T | undefined {
    if (!this.cache) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    // ドットパスで設定値を取得
    return this.getValueByPath(this.cache, path);
  }

  /**
   * 設定値の設定元を取得
   */
  getSource(path: string): ConfigSource | undefined {
    // TODO: 実装
    // 各設定値がどのファイルから来たかを追跡する
    return undefined;
  }

  /**
   * グローバル.envを読み込み
   */
  private async loadGlobalEnv(): Promise<Partial<MergedConfig>> {
    const globalEnvPath = this.getGlobalEnvPath();
    if (!existsSync(globalEnvPath)) {
      return {};
    }

    const parsed = dotenv.parse(readFileSync(globalEnvPath, 'utf-8'));

    return {
      atlassian: {
        url: parsed.ATLASSIAN_URL || '',
        email: parsed.ATLASSIAN_EMAIL || '',
        apiToken: parsed.ATLASSIAN_API_TOKEN || '',
      },
      github: {
        org: parsed.GITHUB_ORG || '',
        token: parsed.GITHUB_TOKEN || '',
        // repository関連はproject.jsonから取得
        repository: '',
        repositoryShort: '',
        repositoryOrg: '',
        repositoryName: '',
      },
      confluence: {
        spaces: {
          prd: parsed.CONFLUENCE_PRD_SPACE || 'PRD',
          qa: parsed.CONFLUENCE_QA_SPACE || 'QA',
          release: parsed.CONFLUENCE_RELEASE_SPACE || 'RELEASE',
        },
      },
      jira: {
        issueTypes: {
          story: parsed.JIRA_ISSUE_TYPE_STORY || '',
          subtask: parsed.JIRA_ISSUE_TYPE_SUBTASK || '',
        },
        projectKeys: '', // プロジェクト固有
      },
    };
  }

  /**
   * グローバル設定を読み込み
   */
  private async loadGlobalConfig(): Promise<Partial<MergedConfig>> {
    const globalConfigPath = this.getGlobalConfigPath();
    if (!existsSync(globalConfigPath)) {
      return {};
    }

    const content = readFileSync(globalConfigPath, 'utf-8');
    const config = JSON.parse(content);

    // TODO: 変換処理
    return config;
  }

  /**
   * プロジェクトメタデータを読み込み
   */
  private async loadProjectMeta(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectMetaPath = join(projectRoot, '.kiro/project.json');
    if (!existsSync(projectMetaPath)) {
      return {};
    }

    const content = readFileSync(projectMetaPath, 'utf-8');
    const meta = JSON.parse(content);

    return {
      project: meta,
    };
  }

  /**
   * プロジェクト設定を読み込み
   */
  private async loadProjectConfig(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectConfigPath = join(projectRoot, '.michi/config.json');
    if (!existsSync(projectConfigPath)) {
      return {};
    }

    const content = readFileSync(projectConfigPath, 'utf-8');
    const config = JSON.parse(content);

    // TODO: 変換処理
    return config;
  }

  /**
   * プロジェクト.envを読み込み
   */
  private async loadProjectEnv(projectRoot: string): Promise<Partial<MergedConfig>> {
    const projectEnvPath = join(projectRoot, '.env');
    if (!existsSync(projectEnvPath)) {
      return {};
    }

    const parsed = dotenv.parse(readFileSync(projectEnvPath, 'utf-8'));

    return {
      jira: {
        projectKeys: parsed.JIRA_PROJECT_KEYS || '',
      },
      // GITHUB_REPO は削除（project.jsonのrepositoryから取得）
    };
  }

  /**
   * マージ処理
   */
  private merge(configs: Partial<MergedConfig>[]): MergedConfig {
    // deep merge with priority
    return this.deepMerge({}, ...configs) as MergedConfig;
  }

  /**
   * ディープマージ
   */
  private deepMerge(target: any, ...sources: any[]): any {
    for (const source of sources) {
      if (!source) continue;

      for (const key in source) {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          target[key] = this.deepMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined && sourceValue !== '') {
          target[key] = sourceValue;
        }
      }
    }

    return target;
  }

  /**
   * オブジェクトチェック
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * バリデーション
   */
  private validate(config: MergedConfig): void {
    try {
      MergedConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigValidationError(
          'Configuration validation failed',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * パスで値を取得
   */
  private getValueByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * グローバル.envのパスを取得
   *
   * 注: 後方互換性のため、旧形式（global.env）も確認する
   */
  private getGlobalEnvPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Could not determine home directory');
    }

    const newPath = join(homeDir, '.michi', '.env');
    const oldPath = join(homeDir, '.michi', 'global.env');

    // 旧形式が存在し、新形式が存在しない場合は警告
    if (existsSync(oldPath) && !existsSync(newPath)) {
      console.warn('⚠️  古い設定ファイルが見つかりました: ~/.michi/global.env');
      console.warn('   ~/.michi/.env に移行してください');
      console.warn('   コマンド: michi migrate config');
      return oldPath; // 後方互換性のため旧パスを返す
    }

    return newPath;
  }

  /**
   * グローバル設定のパスを取得
   */
  private getGlobalConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Could not determine home directory');
    }
    return join(homeDir, '.michi', 'config.json');
  }

  /**
   * GitHubリポジトリURLをパース
   *
   * @param repoUrl - GitHub リポジトリURL（HTTPS または SSH）
   * @returns パースされたリポジトリ情報
   * @throws {ConfigValidationError} 無効なURLの場合
   */
  private parseGitHubRepository(repoUrl: string): {
    url: string;
    org: string;
    repo: string;
    shortForm: string;
  } {
    // HTTPSとSSH両方のURLをサポート
    const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    const sshMatch = repoUrl.match(/github\.com:([^/]+)\/([^/]+?)(\.git)?$/);
    const match = httpsMatch || sshMatch;

    if (!match) {
      throw new ConfigValidationError(
        'REPOSITORY_URL_INVALID',
        `Invalid GitHub repository URL: ${repoUrl}`,
        []
      );
    }

    const org = match[1];
    const repo = match[2];

    return {
      url: repoUrl,
      org,
      repo,
      shortForm: `${org}/${repo}`,
    };
  }
}

/**
 * シングルトンインスタンス
 */
export const configLoader = new ConfigLoader();

/**
 * ヘルパー関数（後方互換性のため）
 */
export async function loadConfig(options?: LoadOptions): Promise<MergedConfig> {
  return configLoader.load(options);
}
```

### 6.2 Zodスキーマ定義

```typescript
// scripts/utils/config-schema.ts

import { z } from 'zod';

/**
 * MergedConfig のZodスキーマ
 */
export const MergedConfigSchema = z.object({
  atlassian: z.object({
    url: z.string().url(),
    email: z.string().email(),
    apiToken: z.string().min(1),
  }),

  github: z.object({
    org: z.string().min(1),
    token: z.string().min(1),
    repository: z.string().url(),
    repositoryShort: z.string().min(1),
    repositoryOrg: z.string().min(1),
    repositoryName: z.string().min(1),
  }),

  confluence: z.object({
    spaces: z.object({
      prd: z.string().min(1),
      qa: z.string().min(1),
      release: z.string().min(1),
    }),
    pageCreationGranularity: z.enum(['single', 'by-section', 'by-hierarchy', 'manual']),
    pageTitleFormat: z.string().optional(),
    hierarchy: z.any().optional(),
  }),

  jira: z.object({
    issueTypes: z.object({
      story: z.string().min(1),
      subtask: z.string().min(1),
    }),
    projectKeys: z.string().min(1),
    createEpic: z.boolean(),
    storyCreationGranularity: z.enum(['all', 'by-phase', 'selected-phases']),
    selectedPhases: z.array(z.string()).optional(),
    storyPoints: z.enum(['auto', 'manual', 'disabled']),
  }),

  workflow: z.object({
    enabledPhases: z.array(z.string()).min(1),
    approvalGates: z.object({
      requirements: z.array(z.string()).optional(),
      design: z.array(z.string()).optional(),
      release: z.array(z.string()).optional(),
    }).optional(),
  }),

  project: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    language: z.enum(['ja', 'en']),
    jiraProjectKey: z.string().regex(/^[A-Z]{2,10}$/),
    confluenceLabels: z.array(z.string()),
    status: z.string(),
    team: z.array(z.string()),
    stakeholders: z.array(z.string()),
    repository: z.string().url(),
    description: z.string(),
  }),
});

export type MergedConfig = z.infer<typeof MergedConfigSchema>;
```

### 6.3 エラークラス定義

```typescript
// scripts/utils/config-errors.ts

import { z } from 'zod';

/**
 * 設定関連のエラー基底クラス
 */
export class ConfigError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * バリデーションエラー
 */
export class ConfigValidationError extends ConfigError {
  constructor(message: string, public details: z.ZodIssue[]) {
    super(message, 'CONFIG_VALIDATION_ERROR');
    this.name = 'ConfigValidationError';
  }
}

/**
 * 必須設定が見つからない
 */
export class ConfigNotFoundError extends ConfigError {
  constructor(message: string, public missingKeys: string[]) {
    super(message, 'CONFIG_NOT_FOUND');
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * マイグレーションエラー
 */
export class MigrationError extends ConfigError {
  constructor(message: string, public phase: string) {
    super(message, 'MIGRATION_ERROR');
    this.name = 'MigrationError';
  }
}
```

---

