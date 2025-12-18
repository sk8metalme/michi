/**
 * E2E Tests for Multi-Repo MVP (Task 13.1)
 * Phase 1: プロジェクト初期化 → リポジトリ登録 → プロジェクト一覧表示
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Multi-Repo E2E: Phase 1 (MVP)', () => {
  let testDir: string;
  let configPath: string;
  let projectRoot: string;
  const timestamp = Date.now();

  beforeAll(() => {
    // Michiプロジェクトのルートディレクトリ
    projectRoot = join(__dirname, '..', '..', '..', '..');

    // 一時ディレクトリの作成（今は使用しないが、将来の拡張のために残す）
    testDir = join(tmpdir(), `michi-e2e-test-${timestamp}`);
    mkdirSync(testDir, { recursive: true });

    // 実際のconfig.jsonのパス（projectRoot/.michi/config.json）
    configPath = join(projectRoot, '.michi', 'config.json');

    console.log(`\n📁 テスト環境: ${testDir}`);
    console.log(`📁 プロジェクトルート: ${projectRoot}\n`);

    // クリーンアップ：テスト開始前に既存のテストプロジェクトを削除
    const projectDir = join(projectRoot, 'docs', 'michi', 'e2e-test-project');
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
          (p: { name: string }) => p.name !== 'e2e-test-project'
        );
        if (configContent.multiRepoProjects.length < beforeCount) {
          writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
          console.log(`🧹 事前クリーンアップ: ${configPath}からe2e-test-projectを削除\n`);
        }
      }
    }
  });

  afterAll(() => {
    // クリーンアップ：テスト後の一時ファイル削除
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
      console.log(`\n🧹 クリーンアップ完了: ${testDir}`);
    }

    // クリーンアップ：テストで作成されたプロジェクトディレクトリを削除
    const projectDir = join(projectRoot, 'docs', 'michi', 'e2e-test-project');
    if (existsSync(projectDir)) {
      rmSync(projectDir, { recursive: true, force: true });
      console.log(`🧹 クリーンアップ完了: ${projectDir}`);
    }

    // クリーンアップ：config.jsonからテストプロジェクトのエントリを削除
    if (existsSync(configPath)) {
      const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (configContent.multiRepoProjects) {
        configContent.multiRepoProjects = configContent.multiRepoProjects.filter(
          (p: { name: string }) => p.name !== 'e2e-test-project'
        );
        writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
        console.log(`🧹 クリーンアップ完了: ${configPath}からe2e-test-projectを削除\n`);
      }
    }
  });

  describe('ユーザーシナリオ: プロジェクト初期化 → リポジトリ登録 → 一覧表示', () => {
    const projectName = 'e2e-test-project';
    const jiraKey = 'ETEST';
    const confluenceSpace = 'ETESTSPACE';
    const repoName = 'test-repo';
    const repoUrl = 'https://github.com/test-org/test-repo';
    const branch = 'main';

    it(
      '1. プロジェクト初期化が成功する',
      () => {
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
        expect(existsSync(join(projectDir, 'steering'))).toBe(true);
        expect(existsSync(join(projectDir, 'tests'))).toBe(true);
        expect(existsSync(join(projectDir, 'docs'))).toBe(true);

        // 検証: テンプレートファイル内容
        const requirementsPath = join(projectDir, 'overview', 'requirements.md');
        expect(existsSync(requirementsPath)).toBe(true);

        const requirementsContent = readFileSync(requirementsPath, 'utf-8');
        // プレースホルダーが正しく置換されている
        expect(requirementsContent).toContain(projectName);
        expect(requirementsContent).not.toContain('{{PROJECT_NAME}}');

        // 検証: config.json更新内容
        expect(existsSync(configPath)).toBe(true);
        const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
        expect(configContent.multiRepoProjects).toBeDefined();
        expect(configContent.multiRepoProjects.length).toBe(1);
        expect(configContent.multiRepoProjects[0].name).toBe(projectName);
        expect(configContent.multiRepoProjects[0].jiraKey).toBe(jiraKey);
        expect(configContent.multiRepoProjects[0].confluenceSpace).toBe(confluenceSpace);

        console.log('✅ プロジェクト初期化成功');
      },
      30000
    );

    it(
      '2. リポジトリ登録が成功する',
      () => {
        const command = `npx tsx src/cli.ts multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${branch}`;

        // コマンド実行
        const output = execSync(command, {
          cwd: projectRoot,
          encoding: 'utf-8',
        });

        // 検証: 終了コード0
        expect(output).toBeDefined();

        // 検証: config.json更新内容
        const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
        const project = configContent.multiRepoProjects.find(
          (p: { name: string }) => p.name === projectName
        );

        expect(project).toBeDefined();
        expect(project.repositories).toBeDefined();
        expect(project.repositories.length).toBe(1);
        expect(project.repositories[0].name).toBe(repoName);
        expect(project.repositories[0].url).toBe(repoUrl);
        expect(project.repositories[0].branch).toBe(branch);

        console.log('✅ リポジトリ登録成功');
      },
      30000
    );

    it(
      '3. プロジェクト一覧表示が成功する',
      () => {
        const command = 'npx tsx src/cli.ts multi-repo:list';

        // コマンド実行
        const output = execSync(command, {
          cwd: projectRoot,
          encoding: 'utf-8',
        });

        // 検証: 出力内容
        expect(output).toContain(projectName);
        expect(output).toContain(jiraKey);
        expect(output).toContain('1'); // リポジトリ数

        console.log('✅ プロジェクト一覧表示成功');
        console.log('\n📋 出力:\n', output);
      },
      30000
    );
  });

  describe('エラーケース', () => {
    it(
      '無効なプロジェクト名でエラーが発生する',
      () => {
        const command = 'npx tsx src/cli.ts multi-repo:init ../etc/passwd --jira TEST --confluence-space SPACE';

        expect(() => {
          execSync(command, {
            cwd: projectRoot,
            encoding: 'utf-8',
          });
        }).toThrow();
      },
      30000
    );

    it(
      '存在しないプロジェクトへのリポジトリ登録でエラーが発生する',
      () => {
        const command = 'npx tsx src/cli.ts multi-repo:add-repo non-existent --name repo --url https://github.com/owner/repo --branch main';

        expect(() => {
          execSync(command, {
            cwd: projectRoot,
            encoding: 'utf-8',
          });
        }).toThrow();
      },
      30000
    );
  });
});
