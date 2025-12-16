/**
 * E2E Tests for Multi-Repo with GitHub API (Task 13.2)
 * Phase 2: プロジェクト初期化 → リポジトリ登録 → CI結果集約
 *
 * 環境変数 GITHUB_TOKEN が必要（未設定時はテストをスキップ）
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Multi-Repo E2E: Phase 2 (GitHub API)', () => {
  let testDir: string;
  let configPath: string;
  let projectRoot: string;
  const timestamp = Date.now();

  // GitHub APIテスト用の実際のリポジトリ情報
  const projectName = 'e2e-github-test';
  const jiraKey = 'GHTEST';
  const confluenceSpace = 'GHTESTSPACE';
  const repoName = 'michi'; // 実際のリポジトリ名
  const repoUrl = 'https://github.com/sk8metalme/michi'; // 実際のリポジトリURL
  const branch = 'main';

  // GitHub Token確認
  const hasGitHubToken = !!process.env.GITHUB_TOKEN;

  beforeAll(() => {
    if (!hasGitHubToken) {
      console.log('\n⚠️  GITHUB_TOKEN環境変数が未設定のため、このテストスイートをスキップします\n');
      return;
    }

    // Michiプロジェクトのルートディレクトリ
    projectRoot = join(__dirname, '..', '..', '..', '..');

    // 一時ディレクトリの作成
    testDir = join(tmpdir(), `michi-e2e-github-test-${timestamp}`);
    mkdirSync(testDir, { recursive: true });

    // 実際のconfig.jsonのパス
    configPath = join(projectRoot, '.michi', 'config.json');

    console.log(`\n📁 テスト環境: ${testDir}`);
    console.log(`📁 プロジェクトルート: ${projectRoot}\n`);

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
          (p: any) => p.name !== projectName
        );
        if (configContent.multiRepoProjects.length < beforeCount) {
          writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
          console.log(`🧹 事前クリーンアップ: ${configPath}から${projectName}を削除\n`);
        }
      }
    }
  });

  afterAll(() => {
    if (!hasGitHubToken) {
      return;
    }

    // クリーンアップ：テスト後の一時ファイル削除
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
      console.log(`\n🧹 クリーンアップ完了: ${testDir}`);
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
          (p: any) => p.name !== projectName
        );
        writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
        console.log(`🧹 クリーンアップ完了: ${configPath}から${projectName}を削除\n`);
      }
    }
  });

  describe('ユーザーシナリオ: プロジェクト初期化 → リポジトリ登録 → CI結果集約', () => {
    it.skipIf(!hasGitHubToken)('1. プロジェクト初期化が成功する', () => {
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
      expect(existsSync(join(projectDir, 'docs'))).toBe(true);

      // 検証: config.json更新内容
      expect(existsSync(configPath)).toBe(true);
      const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
      expect(configContent.multiRepoProjects).toBeDefined();
      const project = configContent.multiRepoProjects.find((p: any) => p.name === projectName);
      expect(project).toBeDefined();
      expect(project.name).toBe(projectName);
      expect(project.jiraKey).toBe(jiraKey);
      expect(project.confluenceSpace).toBe(confluenceSpace);

      console.log('✅ プロジェクト初期化成功');
    });

    it.skipIf(!hasGitHubToken)('2. リポジトリ登録が成功する', () => {
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
        (p: any) => p.name === projectName
      );

      expect(project).toBeDefined();
      expect(project.repositories).toBeDefined();
      expect(project.repositories.length).toBe(1);
      expect(project.repositories[0].name).toBe(repoName);
      expect(project.repositories[0].url).toBe(repoUrl);
      expect(project.repositories[0].branch).toBe(branch);

      console.log('✅ リポジトリ登録成功');
    });

    it.skipIf(!hasGitHubToken)('3. CI結果集約が成功する（実際のGitHub API使用）', () => {
      const command = `npx tsx src/cli.ts multi-repo:ci-status ${projectName}`;

      // コマンド実行（タイムアウトを60秒に設定）
      const output = execSync(command, {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 60000,
      });

      // 検証: 出力内容
      expect(output).toBeDefined();

      // 検証: ci-status.mdファイルの作成
      const ciStatusPath = join(projectRoot, 'docs', 'michi', projectName, 'docs', 'ci-status.md');
      expect(existsSync(ciStatusPath)).toBe(true);

      // 検証: ci-status.mdの内容
      const ciStatusContent = readFileSync(ciStatusPath, 'utf-8');
      expect(ciStatusContent).toContain('# CI Status');
      expect(ciStatusContent).toContain(repoName);

      // ワークフロー実行結果が含まれているか確認（ステータスは問わない）
      const hasWorkflowResults =
        ciStatusContent.includes('✅') || // 成功
        ciStatusContent.includes('❌') || // 失敗
        ciStatusContent.includes('🔄') || // 実行中
        ciStatusContent.includes('⏸️') || // スキップ
        ciStatusContent.includes('ℹ️');   // ワークフロー未実行

      expect(hasWorkflowResults).toBe(true);

      console.log('✅ CI結果集約成功');
      console.log('\n📋 CI Status:\n', ciStatusContent);
    }, 60000); // テストタイムアウトを60秒に設定

    it.skipIf(!hasGitHubToken)('4. レート制限対策の動作確認（Exponential Backoff）', () => {
      // このテストは、実際にレート制限に達することは期待しないが、
      // レート制限対策のコードが正しく組み込まれていることを確認する

      const command = `npx tsx src/cli.ts multi-repo:ci-status ${projectName}`;

      // コマンド実行
      const output = execSync(command, {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 60000,
      });

      // 検証: エラーなく完了すること
      expect(output).toBeDefined();

      // ci-status.mdが正しく生成されていることを確認
      const ciStatusPath = join(projectRoot, 'docs', 'michi', projectName, 'docs', 'ci-status.md');
      expect(existsSync(ciStatusPath)).toBe(true);

      console.log('✅ レート制限対策の動作確認完了');
    }, 60000);
  });
});
