/**
 * Task 13.3: Phase 3 E2Eテスト（実際のConfluence API）
 * プロジェクト初期化 → ドキュメント作成 → Confluence同期（実Confluence API呼び出し）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  rmSync,
  existsSync,
  writeFileSync,
  cpSync,
} from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { AppConfig } from '../../scripts/config/config-schema.js';
import { ConfluenceClient, getConfluenceConfig } from '../../scripts/confluence-sync.js';

// Confluence認証情報が設定されているかチェック
const hasConfluenceCredentials =
  !!process.env.ATLASSIAN_URL &&
  !!process.env.ATLASSIAN_EMAIL &&
  !!process.env.ATLASSIAN_API_TOKEN;

describe('Task 13.3: Phase 3 E2Eテスト（実際のConfluence API）', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let cliPath: string;
  let createdPageIds: string[] = [];

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-e2e-confluence-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // テンプレートディレクトリをコピー
    const sourceTemplateDir = join(originalCwd, 'templates');
    const destTemplateDir = join(testRoot, 'templates');
    cpSync(sourceTemplateDir, destTemplateDir, { recursive: true });

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    const initialConfig: AppConfig = {
      multiRepoProjects: [],
    };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

    // CLIパスを取得（ビルド後のdist/src/cli.js）
    cliPath = join(originalCwd, 'dist', 'src', 'cli.js');

    // カレントディレクトリを変更
    process.chdir(testRoot);

    // 作成されたページIDリストをリセット
    createdPageIds = [];
  });

  afterEach(async () => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // 注: Confluenceページの自動削除はConfluenceClientに deletePage メソッドがないため未実装
    // テストで作成されたページは手動で削除するか、テスト専用スペースを使用することを推奨
    if (hasConfluenceCredentials && createdPageIds.length > 0) {
      console.log(`⚠️  手動削除が必要なConfluenceページ: ${createdPageIds.join(', ')}`);
    }

    // テスト用ディレクトリを削除（リトライ付き）
    if (existsSync(testRoot)) {
      rmSync(testRoot, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  });

  describe('Confluence API統合シナリオ', () => {
    it.skipIf(!hasConfluenceCredentials)(
      'プロジェクト初期化 → ドキュメント作成 → Confluence同期（実Confluence API）',
      async () => {
        const projectName = `michi-test-confluence-${Date.now()}`;
        const jiraKey = 'TEST';
        const confluenceSpace = 'TEST';

        // 1. プロジェクト初期化
        const initOutput = execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        expect(initOutput).toContain('Multi-Repoプロジェクトの初期化が完了しました');

        // 2. テスト用ドキュメント内容を準備（Mermaidダイアグラムを含む）
        const requirementsPath = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'overview',
          'requirements.md'
        );

        const requirementsContent = `# ${projectName} - Requirements

## Test Requirements

This is a test requirements document for E2E testing.

### Mermaid Diagram Test

\`\`\`mermaid
graph LR
  A[User] --> B[System]
  B --> C[Database]
\`\`\`

### Requirements List

1. Requirement 1: Test confluence sync
2. Requirement 2: Test Mermaid diagram conversion
3. Requirement 3: Test page hierarchy
`;

        writeFileSync(requirementsPath, requirementsContent, 'utf-8');

        // 3. Confluence同期（requirements のみ）
        const syncOutput = execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName} --doc-type requirements`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: process.env.ATLASSIAN_URL,
              ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL,
              ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN,
            },
          }
        );

        // 同期成功の検証
        expect(syncOutput).toContain('Confluence同期が完了しました');
        expect(syncOutput).toContain('requirements');

        // ページURLが表示されることを確認
        expect(syncOutput).toMatch(/https?:\/\/.+\/wiki\/spaces\/.+\/pages\/.+/);

        // 4. ConfluenceClientを使ってページ存在確認
        const confluenceConfig = getConfluenceConfig();
        const client = new ConfluenceClient(confluenceConfig);

        // 親ページ（プロジェクト名）の検索
        const parentPage = await client.searchPage(confluenceSpace, projectName);
        expect(parentPage).toBeDefined();
        expect(parentPage!.title).toBe(projectName);

        // 作成されたページIDを記録（クリーンアップ用）
        if (parentPage) {
          createdPageIds.push(parentPage.id);
        }

        // ドキュメントページ（Requirements）の検索
        const pageTitle = `${projectName} - Requirements`;
        const requirementsPage = await client.searchPage(
          confluenceSpace,
          pageTitle,
          parentPage!.id
        );
        expect(requirementsPage).toBeDefined();
        expect(requirementsPage!.title).toBe(pageTitle);

        // 作成されたページIDを記録（クリーンアップ用）
        if (requirementsPage) {
          createdPageIds.push(requirementsPage.id);
        }

        // 5. ページ内容の検証
        // 注: ConfluencePageインターフェースにはbodyプロパティがないため、
        // ページタイトルと存在のみを確認する。
        // 実際のMermaid変換は、実際のConfluence上で手動確認が必要。

        // 6. ページURL生成の検証
        const expectedUrl = `${confluenceConfig.url}/wiki/spaces/${confluenceSpace}/pages/${requirementsPage!.id}`;
        expect(syncOutput).toContain(expectedUrl);
      },
      120000
    ); // タイムアウト: 120秒（Confluence API呼び出しを考慮）

    it.skipIf(!hasConfluenceCredentials)(
      '複数ドキュメントの同期（--doc-typeなし）',
      async () => {
        const projectName = `michi-test-multi-docs-${Date.now()}`;
        const jiraKey = 'TEST';
        const confluenceSpace = 'TEST';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 複数ドキュメント同期（全ドキュメントタイプ）
        const syncOutput = execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: process.env.ATLASSIAN_URL,
              ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL,
              ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN,
            },
          }
        );

        // 同期成功の検証
        expect(syncOutput).toContain('Confluence同期が完了しました');

        // テンプレートで作成されたドキュメントが同期されることを確認
        // （requirements, architecture, sequence, strategy は初期化時に作成される）
        expect(
          syncOutput.includes('requirements') ||
            syncOutput.includes('architecture') ||
            syncOutput.includes('sequence') ||
            syncOutput.includes('strategy')
        ).toBe(true);

        // ConfluenceClientを使ってページ存在確認
        const confluenceConfig = getConfluenceConfig();
        const client = new ConfluenceClient(confluenceConfig);

        const parentPage = await client.searchPage(confluenceSpace, projectName);
        expect(parentPage).toBeDefined();

        if (parentPage) {
          createdPageIds.push(parentPage.id);

          // 子ページを確認
          const docTypes = ['Requirements', 'Architecture', 'Sequence Diagrams', 'Test Strategy'];
          for (const docType of docTypes) {
            const pageTitle = `${projectName} - ${docType}`;
            const page = await client.searchPage(
              confluenceSpace,
              pageTitle,
              parentPage.id
            );
            if (page) {
              createdPageIds.push(page.id);
            }
          }
        }
      },
      180000
    ); // タイムアウト: 180秒（複数ドキュメントのConfluence API呼び出しを考慮）

    it.skipIf(!hasConfluenceCredentials)(
      'ページ更新（既存ページの上書き）',
      async () => {
        const projectName = `michi-test-update-${Date.now()}`;
        const jiraKey = 'TEST';
        const confluenceSpace = 'TEST';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 1回目の同期（ページ作成）
        execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName} --doc-type requirements`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: process.env.ATLASSIAN_URL,
              ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL,
              ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN,
            },
          }
        );

        // ドキュメント内容を更新
        const requirementsPath = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'overview',
          'requirements.md'
        );

        const updatedContent = `# ${projectName} - Requirements (Updated)

## Updated Requirements

This is an **updated** requirements document.

### New Section

- Updated requirement 1
- Updated requirement 2
`;

        writeFileSync(requirementsPath, updatedContent, 'utf-8');

        // 2回目の同期（ページ更新）
        const updateOutput = execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName} --doc-type requirements`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: process.env.ATLASSIAN_URL,
              ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL,
              ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN,
            },
          }
        );

        expect(updateOutput).toContain('Confluence同期が完了しました');

        // ページ内容が更新されたことを確認
        const confluenceConfig = getConfluenceConfig();
        const client = new ConfluenceClient(confluenceConfig);

        const parentPage = await client.searchPage(confluenceSpace, projectName);
        if (parentPage) {
          createdPageIds.push(parentPage.id);
        }

        const pageTitle = `${projectName} - Requirements`;
        const page = await client.searchPage(
          confluenceSpace,
          pageTitle,
          parentPage!.id
        );

        expect(page).toBeDefined();
        if (page) {
          createdPageIds.push(page.id);
        }

        // 注: ConfluencePageインターフェースにはbodyプロパティがないため、
        // ページ存在とタイトルのみを確認する。
        // 実際の内容更新は、実際のConfluence上で手動確認が必要。
        expect(page!.title).toBe(pageTitle);
      },
      120000
    ); // タイムアウト: 120秒
  });

  describe('エラーケース', () => {
    it('Confluence認証情報未設定でエラー', () => {
      const projectName = 'test-no-credentials';
      const jiraKey = 'TEST';
      const confluenceSpace = 'TEST';

      // プロジェクト初期化
      execSync(
        `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 環境変数を削除してConfluence同期を実行
      expect(() => {
        execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName} --doc-type requirements`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: undefined,
              ATLASSIAN_EMAIL: undefined,
              ATLASSIAN_API_TOKEN: undefined,
            },
          }
        );
      }).toThrow();
    });

    it('無効なドキュメントタイプでエラー', () => {
      const projectName = 'test-invalid-doctype';
      const jiraKey = 'TEST';
      const confluenceSpace = 'TEST';

      // プロジェクト初期化
      execSync(
        `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
        {
          cwd: testRoot,
          encoding: 'utf-8',
        }
      );

      // 無効なドキュメントタイプで同期
      expect(() => {
        execSync(
          `node "${cliPath}" multi-repo:confluence-sync ${projectName} --doc-type invalid-type`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: {
              ...process.env,
              ATLASSIAN_URL: process.env.ATLASSIAN_URL || 'https://example.com',
              ATLASSIAN_EMAIL: process.env.ATLASSIAN_EMAIL || 'test@example.com',
              ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN || 'test-token',
            },
          }
        );
      }).toThrow();
    });
  });
});
