# Michi 設定統合設計書 - テスト戦略

**バージョン**: 1.0
**作成日**: 2025-01-11
**ステータス**: Draft
**親ドキュメント**: [config-unification.md](./config-unification.md)

---

## 8. テスト戦略

設定統一に伴う変更を安全に実施するためのテスト戦略です。

### 8.1 テストスコープ

#### 8.1.1 対象範囲

設定統一により影響を受ける主要な機能をテスト対象とします：

| カテゴリ | テスト対象 | テストレベル |
|---------|-----------|------------|
| **設定読み込み** | ConfigLoader の3層マージ | 単体 + 統合 |
| **バリデーション** | Zodスキーマによる検証 | 単体 |
| **パス解決** | リポジトリURLのパース | 単体 |
| **コマンドライン** | michi init / migrate | 統合 + E2E |
| **外部API** | Confluence/JIRA/GitHub連携 | 統合 + E2E |
| **マイグレーション** | 既存設定の移行処理 | 統合 + E2E |
| **後方互換性** | 旧形式設定のサポート | 統合 |

#### 8.1.2 テスト優先順位

**P0 (Critical): リリースブロッカー**
- ConfigLoader の3層マージロジック
- 必須項目のバリデーション
- リポジトリURLパーサー
- `michi migrate` コマンド

**P1 (High): リリース前に必須**
- `michi init` コマンド（新規・既存）
- Confluence/JIRA/GitHub連携の動作確認
- 設定ファイルのパーミッション
- エラーメッセージの内容

**P2 (Medium): リリース後でも対応可能**
- 詳細なエラーメッセージ
- ドライランモード
- ロールバック機能
- 設定バリデーションの詳細

### 8.2 単体テスト

#### 8.2.1 ConfigLoader のテスト

**ファイル**: `src/config/__tests__/config-loader.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../config-loader.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('ConfigLoader', () => {
  let testDir: string;
  let globalEnvPath: string;
  let projectDir: string;

  beforeEach(() => {
    // テスト用の一時ディレクトリ作成
    testDir = join(tmpdir(), `michi-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // グローバル設定ディレクトリ
    globalEnvPath = join(testDir, '.michi', '.env');
    mkdirSync(join(testDir, '.michi'), { recursive: true });

    // プロジェクトディレクトリ
    projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, '.michi'), { recursive: true });

    // 環境変数を上書き
    process.env.HOME = testDir;
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('3層マージ', () => {
    it('グローバル設定を正しく読み込む', () => {
      // グローバル .env を作成
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
JIRA_URL=https://global.atlassian.net
GITHUB_TOKEN=global-token
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.confluence?.url).toBe('https://global.atlassian.net');
      expect(config.jira?.url).toBe('https://global.atlassian.net');
      expect(config.github?.token).toBe('global-token');
    });

    it('プロジェクト設定がグローバル設定を上書きする', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
GITHUB_TOKEN=global-token
      `.trim());

      // プロジェクト .env
      writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_URL=https://project.atlassian.net
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      // プロジェクト設定が優先される
      expect(config.confluence?.url).toBe('https://project.atlassian.net');
      // グローバル設定は保持される
      expect(config.github?.token).toBe('global-token');
    });

    it('プロジェクト config.json がグローバル設定を上書きする', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=https://global.atlassian.net
      `.trim());

      // プロジェクト config.json
      writeFileSync(join(projectDir, '.michi', 'config.json'), JSON.stringify({
        confluence: {
          pageCreationGranularity: 'by-section'
        }
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.confluence?.url).toBe('https://global.atlassian.net');
      expect(config.confluence?.pageCreationGranularity).toBe('by-section');
    });

    it('優先順位: プロジェクト .env > プロジェクト config.json > グローバル .env', () => {
      // グローバル .env
      writeFileSync(globalEnvPath, `
CONFLUENCE_SPACE=GLOBAL
JIRA_PROJECT=GLOBAL
      `.trim());

      // プロジェクト config.json
      writeFileSync(join(projectDir, '.michi', 'config.json'), JSON.stringify({
        confluence: { space: 'CONFIG' },
        jira: { project: 'CONFIG' }
      }, null, 2));

      // プロジェクト .env
      writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_SPACE=PROJECT
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      // プロジェクト .env が最優先
      expect(config.confluence?.space).toBe('PROJECT');
      // プロジェクト config.json が次
      expect(config.jira?.project).toBe('CONFIG');
    });
  });

  describe('リポジトリURLパーサー', () => {
    it('HTTPS形式のURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo.git'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repository).toBe('https://github.com/myorg/myrepo.git');
      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
      expect(config.github?.repositoryShort).toBe('myorg/myrepo');
    });

    it('SSH形式のURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'git@github.com:myorg/myrepo.git'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
      expect(config.github?.repositoryShort).toBe('myorg/myrepo');
    });

    it('.git拡張子なしのURLを正しくパースする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryOrg).toBe('myorg');
      expect(config.github?.repositoryName).toBe('myrepo');
    });

    it('不正な形式のURLでエラーをスローする', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'invalid-url'
      }, null, 2));

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow('Invalid GitHub repository URL');
    });
  });

  describe('バリデーション', () => {
    it('必須項目が不足している場合エラーをスローする', () => {
      // グローバル .env なし、プロジェクト .env も最小限
      writeFileSync(join(projectDir, '.env'), `
# 何も設定しない
      `.trim());

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow();
    });

    it('CONFLUENCE_URL が不正な場合エラーをスローする', () => {
      writeFileSync(globalEnvPath, `
CONFLUENCE_URL=not-a-url
      `.trim());

      const loader = new ConfigLoader(projectDir);

      expect(() => loader.load()).toThrow();
    });
  });

  describe('後方互換性', () => {
    it('GITHUB_REPO が .env に存在する場合、警告を表示する', () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      writeFileSync(join(projectDir, '.env'), `
GITHUB_REPO=myorg/myrepo
      `.trim());

      const loader = new ConfigLoader(projectDir);
      loader.load();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GITHUB_REPO is deprecated')
      );
    });

    it('project.json に repository が存在する場合、GITHUB_REPO は無視される', () => {
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/correct/repo.git'
      }, null, 2));

      writeFileSync(join(projectDir, '.env'), `
GITHUB_REPO=wrong/repo
      `.trim());

      const loader = new ConfigLoader(projectDir);
      const config = loader.load();

      expect(config.github?.repositoryShort).toBe('correct/repo');
    });
  });
});
```

#### 8.2.2 バリデーションのテスト

**ファイル**: `src/config/__tests__/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AppConfigSchema } from '../config-schema.js';

describe('設定バリデーション', () => {
  describe('Confluence設定', () => {
    it('有効なConfluence設定を受け入れる', () => {
      const config = {
        confluence: {
          url: 'https://example.atlassian.net',
          username: 'user@example.com',
          apiToken: 'token123',
          space: 'DEV',
          pageCreationGranularity: 'single'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });

    it('不正なURL形式を拒否する', () => {
      const config = {
        confluence: {
          url: 'not-a-url',
          username: 'user@example.com',
          apiToken: 'token123'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });

    it('pageCreationGranularityの不正な値を拒否する', () => {
      const config = {
        confluence: {
          url: 'https://example.atlassian.net',
          pageCreationGranularity: 'invalid-value'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });
  });

  describe('JIRA設定', () => {
    it('有効なJIRA設定を受け入れる', () => {
      const config = {
        jira: {
          url: 'https://example.atlassian.net',
          username: 'user@example.com',
          apiToken: 'token123',
          project: 'MYPROJ',
          createEpic: true,
          storyCreationGranularity: 'all'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });
  });

  describe('GitHub設定', () => {
    it('有効なGitHub設定を受け入れる', () => {
      const config = {
        github: {
          token: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          username: 'octocat',
          email: 'octocat@github.com',
          org: 'myorg'
        }
      };

      expect(() => AppConfigSchema.parse(config)).not.toThrow();
    });

    it('トークンの形式を検証する', () => {
      const config = {
        github: {
          token: 'invalid-token-format',
          username: 'octocat'
        }
      };

      expect(() => AppConfigSchema.parse(config)).toThrow();
    });
  });
});
```

### 8.3 統合テスト

#### 8.3.1 コマンドラインテスト

**ファイル**: `src/__tests__/integration/cli.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('CLI統合テスト', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `michi-cli-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('michi init', () => {
    it('新規プロジェクトを初期化できる', () => {
      // Git リポジトリを初期化
      execSync('git init', { cwd: testDir });
      execSync('git config user.name "Test User"', { cwd: testDir });
      execSync('git config user.email "test@example.com"', { cwd: testDir });

      // michi init を実行（対話的入力をスキップするため --yes オプションを使用）
      const output = execSync('michi init --yes --project-id test-project', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      expect(output).toContain('プロジェクトの初期化が完了しました');
      expect(existsSync(join(testDir, '.michi', 'project.json'))).toBe(true);
      expect(existsSync(join(testDir, '.env'))).toBe(true);
    });

    it('既存プロジェクトにMichiを追加できる (--existing)', () => {
      // 既存のGitリポジトリをシミュレート
      execSync('git init', { cwd: testDir });
      execSync('git remote add origin https://github.com/test/repo.git', { cwd: testDir });

      const output = execSync('michi init --existing --yes', {
        cwd: testDir,
        encoding: 'utf-8'
      });

      expect(output).toContain('既存プロジェクトへの追加が完了しました');

      // project.json の repository が自動設定される
      const projectJson = JSON.parse(
        readFileSync(join(testDir, '.michi', 'project.json'), 'utf-8')
      );
      expect(projectJson.repository).toBe('https://github.com/test/repo.git');
    });

    it('Gitリポジトリがない場合、--existing でエラーになる', () => {
      expect(() => {
        execSync('michi init --existing --yes', {
          cwd: testDir,
          encoding: 'utf-8'
        });
      }).toThrow();
    });
  });

  describe('michi migrate', () => {
    beforeEach(() => {
      // 旧形式の設定ファイルを作成
      mkdirSync(join(testDir, '.michi'), { recursive: true });

      writeFileSync(join(testDir, '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
CONFLUENCE_USERNAME=user@example.com
CONFLUENCE_API_TOKEN=token123
JIRA_URL=https://example.atlassian.net
JIRA_USERNAME=user@example.com
JIRA_API_TOKEN=token456
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=testuser
GITHUB_EMAIL=test@example.com
GITHUB_ORG=myorg
GITHUB_REPO=myorg/myrepo
      `.trim());

      writeFileSync(join(testDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project'
      }, null, 2));
    });

    it('設定を正しく移行する', () => {
      const output = execSync('michi migrate --force', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('設定の移行が完了しました');

      // グローバル .env が作成される
      const globalEnv = join(testDir, '.michi', '.env');
      expect(existsSync(globalEnv)).toBe(true);

      const globalContent = readFileSync(globalEnv, 'utf-8');
      expect(globalContent).toContain('CONFLUENCE_URL=');
      expect(globalContent).toContain('JIRA_URL=');
      expect(globalContent).toContain('GITHUB_TOKEN=');

      // プロジェクト .env から組織設定が削除される
      const projectEnv = readFileSync(join(testDir, '.env'), 'utf-8');
      expect(projectEnv).not.toContain('CONFLUENCE_URL=');
      expect(projectEnv).not.toContain('GITHUB_REPO=');

      // project.json に repository が追加される
      const projectJson = JSON.parse(
        readFileSync(join(testDir, '.michi', 'project.json'), 'utf-8')
      );
      expect(projectJson.repository).toBe('https://github.com/myorg/myrepo.git');
    });

    it('--dry-run で変更をシミュレートする', () => {
      const output = execSync('michi migrate --dry-run', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('ドライランモード');
      expect(output).toContain('実際の変更は行われませんでした');

      // ファイルが変更されていないことを確認
      const globalEnv = join(testDir, '.michi', '.env');
      expect(existsSync(globalEnv)).toBe(false);
    });

    it('バックアップを作成する', () => {
      execSync('michi migrate --force', {
        cwd: testDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      // バックアップディレクトリが作成されている
      const backups = readdirSync(testDir).filter(f => f.startsWith('.michi-backup-'));
      expect(backups.length).toBeGreaterThan(0);
    });
  });

  describe('michi config:validate', () => {
    it('有効な設定を検証する', () => {
      // グローバル設定
      mkdirSync(join(testDir, '.michi'), { recursive: true });
      writeFileSync(join(testDir, '.michi', '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
JIRA_URL=https://example.atlassian.net
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      `.trim());

      // プロジェクト設定
      const projectDir = join(testDir, 'project');
      mkdirSync(join(projectDir, '.michi'), { recursive: true });
      writeFileSync(join(projectDir, '.michi', 'project.json'), JSON.stringify({
        projectId: 'test-project',
        repository: 'https://github.com/myorg/myrepo.git'
      }, null, 2));

      const output = execSync('michi config:validate', {
        cwd: projectDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      });

      expect(output).toContain('設定ファイルは有効です');
    });

    it('不正な設定でエラーを表示する', () => {
      mkdirSync(join(testDir, '.michi'), { recursive: true });
      writeFileSync(join(testDir, '.env'), `
CONFLUENCE_URL=not-a-url
      `.trim());

      expect(() => {
        execSync('michi config:validate', {
          cwd: testDir,
          encoding: 'utf-8'
        });
      }).toThrow();
    });
  });
});
```

#### 8.3.2 外部API連携テスト

**ファイル**: `src/__tests__/integration/external-api.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { ConfigLoader } from '../../config/config-loader.js';
import { ConfluenceClient } from '../../confluence/client.js';
import { JiraClient } from '../../jira/client.js';
import { GitHubClient } from '../../github/client.js';

// 注: これらのテストは実際のAPIキーが必要なため、CI環境では skip される
// ローカルで実行する場合は、~/.michi/.env に実際の認証情報を設定すること

describe('外部API連携テスト', () => {
  let config: ReturnType<ConfigLoader['load']>;

  beforeAll(() => {
    const loader = new ConfigLoader(process.cwd());
    config = loader.load();
  });

  describe('Confluence連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'Confluenceに接続できる',
      async () => {
        const client = new ConfluenceClient(config);
        const spaces = await client.getSpaces();

        expect(Array.isArray(spaces)).toBe(true);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'スペース情報を取得できる',
      async () => {
        const client = new ConfluenceClient(config);
        const space = await client.getSpace(config.confluence!.space!);

        expect(space).toBeDefined();
        expect(space.key).toBe(config.confluence!.space);
      }
    );
  });

  describe('JIRA連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'JIRAに接続できる',
      async () => {
        const client = new JiraClient(config);
        const projects = await client.getProjects();

        expect(Array.isArray(projects)).toBe(true);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'プロジェクト情報を取得できる',
      async () => {
        const client = new JiraClient(config);
        const project = await client.getProject(config.jira!.project!);

        expect(project).toBeDefined();
        expect(project.key).toBe(config.jira!.project);
      }
    );
  });

  describe('GitHub連携', () => {
    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'GitHubに接続できる',
      async () => {
        const client = new GitHubClient(config);
        const user = await client.getCurrentUser();

        expect(user).toBeDefined();
        expect(user.login).toBe(config.github!.username);
      }
    );

    it.skipIf(!process.env.RUN_INTEGRATION_TESTS)(
      'リポジトリ情報を取得できる',
      async () => {
        const client = new GitHubClient(config);
        const repo = await client.getRepository();

        expect(repo).toBeDefined();
        expect(repo.full_name).toBe(config.github!.repositoryShort);
      }
    );
  });
});
```

### 8.4 E2Eテスト

#### 8.4.1 完全なワークフローテスト

**ファイル**: `src/__tests__/e2e/full-workflow.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('E2E: 完全なワークフロー', () => {
  let testDir: string;
  let projectDir: string;

  beforeAll(() => {
    testDir = join(tmpdir(), `michi-e2e-${Date.now()}`);
    projectDir = join(testDir, 'my-project');

    mkdirSync(projectDir, { recursive: true });
    process.chdir(projectDir);

    // Git リポジトリを初期化
    execSync('git init', { cwd: projectDir });
    execSync('git config user.name "Test User"', { cwd: projectDir });
    execSync('git config user.email "test@example.com"', { cwd: projectDir });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('新規プロジェクト作成 → 設定 → Confluence同期', async () => {
    // ステップ1: プロジェクト初期化
    execSync('michi init --yes --project-id my-project', {
      cwd: projectDir,
      encoding: 'utf-8'
    });

    // ステップ2: グローバル設定を作成
    execSync('npm run config:global', {
      cwd: projectDir,
      input: 'n\nn\nn\n', // すべての設定をスキップ
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    // ステップ3: Confluence同期（ドライラン）
    const output = execSync(
      'michi confluence:sync test-feature requirements --dry-run',
      {
        cwd: projectDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: testDir }
      }
    );

    expect(output).toContain('ドライランモード');
  }, 30000); // 30秒タイムアウト

  it('既存プロジェクト → 移行 → 検証', async () => {
    // ステップ1: 旧形式の設定を作成
    mkdirSync(join(projectDir, '.michi'), { recursive: true });
    writeFileSync(join(projectDir, '.env'), `
CONFLUENCE_URL=https://example.atlassian.net
GITHUB_REPO=myorg/myrepo
    `.trim());

    // ステップ2: 移行実行
    execSync('michi migrate --force', {
      cwd: projectDir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    // ステップ3: 設定検証
    const output = execSync('michi config:validate', {
      cwd: projectDir,
      encoding: 'utf-8',
      env: { ...process.env, HOME: testDir }
    });

    expect(output).toContain('設定ファイルは有効です');
  }, 30000);
});
```

### 8.5 カバレッジ目標

#### 8.5.1 目標値

| カテゴリ | 目標カバレッジ | 現在値 | 期限 |
|---------|-------------|--------|------|
| **全体** | 95% | TBD | リリース前 |
| **ConfigLoader** | 100% | TBD | Week 1 |
| **バリデーション** | 100% | TBD | Week 1 |
| **CLIコマンド** | 90% | TBD | Week 2 |
| **マイグレーション** | 95% | TBD | Week 2 |
| **外部API** | 80% | TBD | Week 3 |

#### 8.5.2 カバレッジ計測

```bash
# カバレッジレポートの生成
npm run test:coverage

# HTMLレポートの確認
open coverage/index.html

# 最小カバレッジのチェック（CI用）
npm run test:coverage -- --min-coverage=95
```

#### 8.5.3 除外項目

以下のファイルはカバレッジ計測から除外します：

- テストファイル: `**/*.test.ts`, `**/*.spec.ts`
- 型定義ファイル: `**/*.d.ts`
- 設定ファイル: `**/config/**/*.ts` (一部)
- CLIエントリポイント: `src/cli.ts` (メイン関数のみ)

### 8.6 テスト実行

#### 8.6.1 ローカルでのテスト実行

```bash
# すべてのテストを実行
npm run test

# 単体テストのみ
npm run test src/config/__tests__

# 統合テストのみ
npm run test src/__tests__/integration

# E2Eテストのみ
npm run test src/__tests__/e2e

# ウォッチモード（開発時）
npm run test -- --watch

# 特定のファイルのみ
npm run test src/config/__tests__/config-loader.test.ts
```

#### 8.6.2 CI/CDでのテスト実行

**GitHub Actions**: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run integration tests
        run: npm run test:run src/__tests__/integration
        env:
          RUN_INTEGRATION_TESTS: 'false'  # CI環境では外部APIテストをスキップ

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage threshold
        run: npm run test:coverage -- --min-coverage=95
```

#### 8.6.3 テスト実行のベストプラクティス

1. **開発時**
   - ウォッチモードで関連するテストのみを実行
   - 変更したファイルに対応するテストを優先

2. **コミット前**
   - すべての単体テストを実行
   - 関連する統合テストを実行

3. **PR作成時**
   - すべてのテストを実行
   - カバレッジレポートを確認

4. **リリース前**
   - すべてのテストを実行（E2E含む）
   - 外部APIテストを手動で実行
   - カバレッジが目標値を満たしているか確認

---

