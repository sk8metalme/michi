/**
 * Multi-Repo Performance Tests (Task 14)
 *
 * 環境変数 GITHUB_TOKEN が必要（未設定時はテストをスキップ）
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AppConfig } from '../../../../scripts/config/config-schema.js';

describe('Multi-Repo Performance Tests', () => {
  let projectRoot: string;
  let configPath: string;
  const timestamp = Date.now();

  // GitHub Token確認
  const hasGitHubToken = !!process.env.GITHUB_TOKEN;

  beforeAll(() => {
    if (!hasGitHubToken) {
      console.log('\n⚠️  GITHUB_TOKEN環境変数が未設定のため、このテストスイートをスキップします\n');
      return;
    }

    // Michiプロジェクトのルートディレクトリ
    projectRoot = join(__dirname, '..', '..', '..', '..', '..');
    configPath = join(projectRoot, '.michi', 'config.json');

    console.log(`\n📁 プロジェクトルート: ${projectRoot}\n`);
  });

  describe('Task 14.1: 並行CI結果取得のパフォーマンステスト', () => {
    const testProjectName = `perf-test-concurrent-${timestamp}`;

    beforeAll(() => {
      if (!hasGitHubToken) return;

      // テストプロジェクトを作成
      const command = `npx tsx src/cli.ts multi-repo:init ${testProjectName} --jira PERF --confluence-space PERFTEST`;
      execSync(command, { cwd: projectRoot, encoding: 'utf-8' });

      // 10個の実際のリポジトリを登録（michiリポジトリを異なるブランチで登録）
      const repos = [
        { name: 'michi-main', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-develop', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-1', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-2', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-3', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-4', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-5', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-6', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-7', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
        { name: 'michi-feature-8', url: 'https://github.com/sk8metalme/michi', branch: 'main' },
      ];

      repos.forEach((repo) => {
        const addRepoCommand = `npx tsx src/cli.ts multi-repo:add-repo ${testProjectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`;
        execSync(addRepoCommand, { cwd: projectRoot, encoding: 'utf-8' });
      });

      console.log(`✅ テストプロジェクト作成完了: ${testProjectName} (10リポジトリ登録)`);
    });

    afterAll(() => {
      if (!hasGitHubToken) return;

      // クリーンアップ
      const projectDir = join(projectRoot, 'docs', 'michi', testProjectName);
      if (existsSync(projectDir)) {
        rmSync(projectDir, { recursive: true, force: true });
      }

      // config.jsonから削除
      if (existsSync(configPath)) {
        const configContent = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
        if (configContent.multiRepoProjects) {
          configContent.multiRepoProjects = configContent.multiRepoProjects.filter(
            (p) => p.name !== testProjectName
          );
          writeFileSync(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
        }
      }

      console.log(`🧹 クリーンアップ完了: ${testProjectName}`);
    });

    it.skipIf(!hasGitHubToken)(
      '10リポジトリのCI結果を並列取得（目標: < 30秒）',
      async () => {
        const startTime = Date.now();

        const command = `npx tsx src/cli.ts multi-repo:ci-status ${testProjectName}`;
        execSync(command, {
          cwd: projectRoot,
          encoding: 'utf-8',
          timeout: 60000, // 60秒タイムアウト
        });

        const endTime = Date.now();
        const elapsedSeconds = (endTime - startTime) / 1000;

        console.log(`\n⏱️  実行時間: ${elapsedSeconds.toFixed(2)}秒`);
        console.log('📊 目標時間: 30秒');

        // 検証: 30秒以内に完了
        expect(elapsedSeconds).toBeLessThan(30);

        // 検証: ci-status.mdが作成されている
        const ciStatusPath = join(
          projectRoot,
          'docs',
          'michi',
          testProjectName,
          'docs',
          'ci-status.md'
        );
        expect(existsSync(ciStatusPath)).toBe(true);

        // 検証: 10リポジトリすべての結果が含まれている
        const ciStatusContent = readFileSync(ciStatusPath, 'utf-8');
        expect(ciStatusContent).toContain('michi-main');
        expect(ciStatusContent).toContain('michi-develop');
        expect(ciStatusContent).toContain('michi-feature-8');

        console.log(`✅ パフォーマンステスト成功: ${elapsedSeconds.toFixed(2)}秒 < 30秒`);
      },
      60000 // テストタイムアウト: 60秒
    );
  });

  describe('Task 14.3: config.json読み込みパフォーマンステスト', () => {
    let tempConfigPath: string;

    beforeAll(() => {
      if (!hasGitHubToken) return;

      // 1000プロジェクトを含む大きなconfig.jsonを作成
      const tempDir = join(tmpdir(), `michi-perf-config-${timestamp}`);
      mkdirSync(tempDir, { recursive: true });
      mkdirSync(join(tempDir, '.michi'), { recursive: true });
      tempConfigPath = join(tempDir, '.michi', 'config.json');

      const largeConfig = {
        multiRepoProjects: Array.from({ length: 1000 }, (_, i) => ({
          name: `project-${i}`,
          jiraKey: `PROJ${i}`,
          confluenceSpace: `SPACE${i}`,
          repositories: [
            {
              name: `repo-${i}-1`,
              url: `https://github.com/org/repo-${i}-1`,
              branch: 'main',
            },
            {
              name: `repo-${i}-2`,
              url: `https://github.com/org/repo-${i}-2`,
              branch: 'develop',
            },
          ],
        })),
      };

      writeFileSync(tempConfigPath, JSON.stringify(largeConfig, null, 2), 'utf-8');
      console.log('✅ 大規模config.json作成完了: 1000プロジェクト');
    });

    afterAll(() => {
      if (!hasGitHubToken) return;

      // クリーンアップ
      const tempDir = join(tmpdir(), `michi-perf-config-${timestamp}`);
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it.skipIf(!hasGitHubToken)(
      '1000プロジェクトを含むconfig.jsonの読み込み（目標: メモリ使用量 < 100MB）',
      async () => {
        const { getConfig } = await import('../../../../scripts/utils/config-loader.js');
        const tempDir = join(tmpdir(), `michi-perf-config-${timestamp}`);

        // 1回目の読み込み
        const startTime1 = Date.now();
        const initialMemory = process.memoryUsage().heapUsed;

        const config1 = getConfig(tempDir);

        const endTime1 = Date.now();
        const afterMemory1 = process.memoryUsage().heapUsed;
        const elapsedMs1 = endTime1 - startTime1;
        const memoryUsedMB1 = (afterMemory1 - initialMemory) / 1024 / 1024;

        console.log(`\n⏱️  1回目の読み込み時間: ${elapsedMs1}ms`);
        console.log(`💾 メモリ使用量: ${memoryUsedMB1.toFixed(2)}MB`);

        // 検証: 1000プロジェクトが読み込まれている
        expect(config1.multiRepoProjects).toHaveLength(1000);

        // 検証: メモリ使用量が100MB未満
        expect(memoryUsedMB1).toBeLessThan(100);

        // 2回目の読み込み（キャッシング効果確認）
        const startTime2 = Date.now();
        const config2 = getConfig(tempDir);
        const endTime2 = Date.now();
        const elapsedMs2 = endTime2 - startTime2;

        console.log(`⏱️  2回目の読み込み時間: ${elapsedMs2}ms`);
        console.log(`📊 キャッシング効果: ${((1 - elapsedMs2 / elapsedMs1) * 100).toFixed(1)}% 高速化`);

        // 検証: 2回目の読み込みが1回目の10%以下
        expect(elapsedMs2).toBeLessThan(elapsedMs1 * 0.1);

        // 検証: キャッシュされた内容が同じ
        expect(config2.multiRepoProjects).toHaveLength(1000);
        expect(config2.multiRepoProjects[0].name).toBe('project-0');
        expect(config2.multiRepoProjects[999].name).toBe('project-999');

        console.log(`✅ パフォーマンステスト成功: メモリ ${memoryUsedMB1.toFixed(2)}MB < 100MB`);
      },
      30000 // テストタイムアウト: 30秒
    );
  });
});
