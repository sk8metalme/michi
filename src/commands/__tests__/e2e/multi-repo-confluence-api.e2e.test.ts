/**
 * E2E Tests for Multi-Repo with Confluence API (Task 13.3)
 * Phase 3: プロジェクト初期化 → ドキュメント作成 → Confluence同期
 *
 * 環境変数 ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN が必要（未設定時はテストをスキップ）
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Multi-Repo E2E: Phase 3 (Confluence API)', () => {
  let testDir: string;
  let configPath: string;
  let projectRoot: string;
  const timestamp = Date.now();

  // Confluence APIテスト用の設定
  const projectName = 'e2e-confluence-test';
  const jiraKey = 'CFTEST';
  const confluenceSpace = 'TEST'; // 専用テストスペース

  // Confluence認証情報の確認
  const hasConfluenceCredentials =
    !!process.env.ATLASSIAN_URL &&
    !!process.env.ATLASSIAN_EMAIL &&
    !!process.env.ATLASSIAN_API_TOKEN;

  // 作成されたConfluenceページIDを追跡（クリーンアップ用）
  const createdPageIds: string[] = [];

  beforeAll(() => {
    if (!hasConfluenceCredentials) {
      console.log(
        '\n⚠️  ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN環境変数が未設定のため、このテストスイートをスキップします\n'
      );
      return;
    }

    // Michiプロジェクトのルートディレクトリ
    projectRoot = join(__dirname, '..', '..', '..', '..');

    // 一時ディレクトリの作成
    testDir = join(tmpdir(), `michi-e2e-confluence-test-${timestamp}`);
    mkdirSync(testDir, { recursive: true });

    // 実際のconfig.jsonのパス
    configPath = join(projectRoot, '.michi', 'config.json');

    console.log(`\n📁 テスト環境: ${testDir}`);
    console.log(`📁 プロジェクトルート: ${projectRoot}`);
    console.log(`📁 Confluenceスペース: ${confluenceSpace}\n`);

    // クリーンアップ：テスト開始前に既存のテストプロジェクトを削除
    const projectDir = join(projectRoot, 'docs', 'michi', projectName);
    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true });
      console.log(`🧹 事前クリーンアップ: ${projectDir}`);
    }

    // config.jsonからテストプロジェクトのエントリを削除
    if (existsSync(configPath)) {
      const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (configContent.multiRepoProjects) {
        const beforeCount = configContent.multiRepoProjects.length;
        configContent.multiRepoProjects = configContent.multiRepoProjects.filter(
          (p: { name: string }) => p.name !== projectName
        );
        if (configContent.multiRepoProjects.length < beforeCount) {
          writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
          console.log(`🧹 事前クリーンアップ: ${configPath}から${projectName}を削除\n`);
        }
      }
    }
  });

  afterAll(async () => {
    if (!hasConfluenceCredentials) {
      return;
    }

    // クリーンアップ：Confluenceページを削除
    if (createdPageIds.length > 0) {
      try {
        const { getConfluenceConfig } = await import(
          '../../../../scripts/confluence-sync.js'
        );
        const confluenceConfig = getConfluenceConfig();

        for (const pageId of createdPageIds) {
          try {
            await fetch(`${confluenceConfig.url}/wiki/rest/api/content/${pageId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Basic ${Buffer.from(`${confluenceConfig.email}:${confluenceConfig.apiToken}`).toString('base64')}`,
              },
            });
            console.log(`🧹 Confluenceページ削除: ${pageId}`);
          } catch (error) {
            console.warn(`⚠️  Confluenceページ削除失敗: ${pageId}`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️  Confluenceページのクリーンアップに失敗しました:', error);
      }
    }

    // クリーンアップ：テスト後の一時ファイル削除
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
      console.log(`🧹 クリーンアップ完了: ${testDir}`);
    }

    // クリーンアップ：テストで作成されたプロジェクトディレクトリを削除
    const projectDir = join(projectRoot, 'docs', 'michi', projectName);
    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true });
      console.log(`🧹 クリーンアップ完了: ${projectDir}`);
    }

    // クリーンアップ：config.jsonからテストプロジェクトのエントリを削除
    if (existsSync(configPath)) {
      const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (configContent.multiRepoProjects) {
        configContent.multiRepoProjects = configContent.multiRepoProjects.filter(
          (p: { name: string }) => p.name !== projectName
        );
        writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
        console.log(`🧹 クリーンアップ完了: ${configPath}から${projectName}を削除\n`);
      }
    }
  });

  describe('ユーザーシナリオ: プロジェクト初期化 → ドキュメント作成 → Confluence同期', () => {
    it.skipIf(!hasConfluenceCredentials)('1. プロジェクト初期化が成功する', () => {
      const command = `npx tsx src/cli.ts multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`;

      // コマンド実行
      const output = execSync(command, {
        cwd: projectRoot,
        encoding: 'utf-8',
      });

      // 検証: 終了コード0（エラーなし）
      expect(output).toBeDefined();

      // 検証: ディレクトリ構造
      const projectDir = join(projectRoot, 'docs', 'michi', projectName);
      expect(existsSync(join(projectDir, 'overview'))).toBe(true);
      expect(existsSync(join(projectDir, 'overview', 'requirements.md'))).toBe(true);
      expect(existsSync(join(projectDir, 'overview', 'architecture.md'))).toBe(true);

      console.log('✅ プロジェクト初期化成功');
    });

    it.skipIf(!hasConfluenceCredentials)('2. ドキュメント作成（Mermaidダイアグラムを含む）', () => {
      const projectDir = join(projectRoot, 'docs', 'michi', projectName);
      const architecturePath = join(projectDir, 'overview', 'architecture.md');

      // architecture.mdにMermaidダイアグラムを追加
      const mermaidContent = `
# Architecture

## System Overview

\`\`\`mermaid
graph TD
  A[User] --> B[CLI]
  B --> C[GitHub API]
  B --> D[Confluence API]
  C --> E[CI Results]
  D --> F[Documentation]
\`\`\`

## Component Description

- **CLI**: Command-line interface for multi-repo management
- **GitHub API**: Fetches CI/CD status
- **Confluence API**: Syncs documentation
`;

      writeFileSync(architecturePath, mermaidContent, 'utf-8');

      // 検証: ファイルが作成されたことを確認
      expect(existsSync(architecturePath)).toBe(true);

      const content = readFileSync(architecturePath, 'utf-8');
      expect(content).toContain('```mermaid');
      expect(content).toContain('graph TD');

      console.log('✅ ドキュメント作成成功');
    });

    it.skipIf(!hasConfluenceCredentials)(
      '3. Confluence同期が成功する（実際のConfluence API使用）',
      async () => {
        const command = `npx tsx src/cli.ts multi-repo:confluence-sync ${projectName}`;

        // コマンド実行（タイムアウトを120秒に設定）
        const output = execSync(command, {
          cwd: projectRoot,
          encoding: 'utf-8',
          timeout: 120000,
        });

        // 検証: 出力内容
        expect(output).toBeDefined();

        // 出力からページIDを抽出してクリーンアップ用に保存
        const pageIdMatches = output.matchAll(/pages\/(\d+)/g);
        for (const match of pageIdMatches) {
          createdPageIds.push(match[1]);
        }

        // 検証: Confluenceページが作成されたことを示すメッセージ
        expect(output).toMatch(/Created|Updated/);

        // 検証: プロジェクト名とドキュメントタイプが含まれている
        expect(output).toContain(projectName);

        console.log('✅ Confluence同期成功');
        console.log('\n📋 同期結果:\n', output);

        if (createdPageIds.length > 0) {
          console.log('\n📄 作成されたページID:', createdPageIds);
        }
      },
      120000
    ); // テストタイムアウトを120秒に設定

    it.skipIf(!hasConfluenceCredentials)(
      '4. Confluenceページ階層構造の検証',
      async () => {
        const { ConfluenceClient, getConfluenceConfig } = await import(
          '../../../../scripts/confluence-sync.js'
        );

        const confluenceConfig = getConfluenceConfig();
        const client = new ConfluenceClient(confluenceConfig);

        // 親ページ（プロジェクト名）が存在することを確認
        const parentPage = await client.searchPage(confluenceSpace, projectName);
        expect(parentPage).toBeDefined();
        expect(parentPage?.title).toBe(projectName);

        if (parentPage) {
          createdPageIds.push(parentPage.id);
        }

        // 子ページ（Architecture）が存在することを確認
        const archPage = await client.searchPage(
          confluenceSpace,
          `${projectName} - Architecture`,
          parentPage?.id
        );
        expect(archPage).toBeDefined();

        if (archPage) {
          createdPageIds.push(archPage.id);

          // ページURLを確認
          const pageUrl = `${confluenceConfig.url}/wiki/spaces/${confluenceSpace}/pages/${archPage.id}`;
          console.log(`\n📄 Confluenceページ: ${pageUrl}`);
        }

        console.log('✅ Confluenceページ階層構造の検証完了');
      },
      60000
    );

    it.skipIf(!hasConfluenceCredentials)(
      '5. Mermaidダイアグラム変換の検証',
      async () => {
        const { ConfluenceClient, getConfluenceConfig } = await import(
          '../../../../scripts/confluence-sync.js'
        );

        const confluenceConfig = getConfluenceConfig();
        const client = new ConfluenceClient(confluenceConfig);

        // Architectureページを取得
        const parentPage = await client.searchPage(confluenceSpace, projectName);
        const archPage = await client.searchPage(
          confluenceSpace,
          `${projectName} - Architecture`,
          parentPage?.id
        );

        expect(archPage).toBeDefined();

        if (archPage) {
          // ページコンテンツを取得
          const response = await fetch(
            `${confluenceConfig.url}/wiki/rest/api/content/${archPage.id}?expand=body.storage`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(`${confluenceConfig.email}:${confluenceConfig.apiToken}`).toString('base64')}`,
              },
            }
          );

          const pageData = (await response.json()) as {
            body: { storage: { value: string } };
          };
          const pageContent = pageData.body.storage.value;

          // Mermaidマクロが含まれていることを確認
          expect(pageContent).toContain('<ac:structured-macro ac:name="mermaid">');
          expect(pageContent).toContain('<![CDATA[');
          expect(pageContent).toContain('graph TD');

          console.log('✅ Mermaidダイアグラム変換の検証完了');
        }
      },
      60000
    );
  });
});
