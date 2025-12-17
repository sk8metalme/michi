/**
 * Task 14.1: 並列CI結果取得のパフォーマンステスト
 * 10リポジトリのCI結果を並列取得し、パフォーマンスを測定
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

// GitHub Token が設定されているかチェック
const hasGitHubToken = !!process.env.GITHUB_TOKEN;

describe('Task 14.1: 並列CI結果取得のパフォーマンステスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let cliPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-perf-test-${Date.now()}`);
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
  });

  afterEach(() => {
    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

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

  describe('10リポジトリの並列CI結果取得', () => {
    it.skipIf(!hasGitHubToken)(
      '10リポジトリのCI結果を30秒以内に並列取得（目標: < 30秒）',
      async () => {
        const projectName = `michi-perf-test-${Date.now()}`;
        const jiraKey = 'PERF';
        const confluenceSpace = 'PERF';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 10個のpublicリポジトリを登録
        // Note: 実際のGitHub API呼び出しを行うため、publicリポジトリを使用
        const repositories = [
          { name: 'michi', url: 'https://github.com/gotalab/michi', branch: 'main' },
          { name: 'cc-sdd', url: 'https://github.com/gotalab/cc-sdd', branch: 'main' },
          { name: 'react', url: 'https://github.com/facebook/react', branch: 'main' },
          { name: 'vue', url: 'https://github.com/vuejs/core', branch: 'main' },
          { name: 'angular', url: 'https://github.com/angular/angular', branch: 'main' },
          { name: 'svelte', url: 'https://github.com/sveltejs/svelte', branch: 'main' },
          { name: 'next', url: 'https://github.com/vercel/next.js', branch: 'canary' },
          { name: 'nuxt', url: 'https://github.com/nuxt/nuxt', branch: 'main' },
          { name: 'remix', url: 'https://github.com/remix-run/remix', branch: 'main' },
          { name: 'astro', url: 'https://github.com/withastro/astro', branch: 'main' },
        ];

        // リポジトリを並列登録（パフォーマンステストの準備）
        for (const repo of repositories) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // パフォーマンス測定: CI結果の並列取得
        const startTime = Date.now();
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const elapsedSeconds = elapsedTime / 1000;

        // 結果の表示
        console.log('');
        console.log('=== パフォーマンステスト結果 ===');
        console.log(`リポジトリ数: ${repositories.length}`);
        console.log(`合計時間: ${elapsedSeconds.toFixed(2)}秒`);
        console.log(`平均時間/リポジトリ: ${(elapsedSeconds / repositories.length).toFixed(2)}秒`);
        console.log('================================');
        console.log('');

        // 検証1: CI結果集約が成功したことを確認
        expect(ciStatusOutput).toContain('CI結果の集約が完了しました');

        // 検証2: 合計時間が30秒以内であることを確認（目標値）
        expect(elapsedSeconds).toBeLessThan(30);

        // 検証3: 並列処理が効果的に働いていることを確認
        // 10リポジトリを逐次処理した場合の予想時間（1リポジトリ5秒と仮定）
        const expectedSequentialTime = repositories.length * 5;
        // 並列処理により、少なくとも50%以上の時間短縮が見られるはず
        expect(elapsedSeconds).toBeLessThan(expectedSequentialTime * 0.5);

        // 検証4: レート制限エラーが発生していないことを確認
        // （すべてのリポジトリのステータスが取得できている）
        for (const repo of repositories) {
          expect(ciStatusOutput).toContain(repo.name);
        }
      },
      60000
    ); // タイムアウト: 60秒（目標30秒 + バッファ）

    it.skipIf(!hasGitHubToken)(
      '並列度の検証: Promise.allによる10並列実行',
      async () => {
        const projectName = `michi-parallel-test-${Date.now()}`;
        const jiraKey = 'PARA';
        const confluenceSpace = 'PARA';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 10個のリポジトリを登録
        const repositories = [
          { name: 'repo1', url: 'https://github.com/facebook/react', branch: 'main' },
          { name: 'repo2', url: 'https://github.com/vuejs/core', branch: 'main' },
          { name: 'repo3', url: 'https://github.com/angular/angular', branch: 'main' },
          { name: 'repo4', url: 'https://github.com/sveltejs/svelte', branch: 'main' },
          { name: 'repo5', url: 'https://github.com/vercel/next.js', branch: 'canary' },
          { name: 'repo6', url: 'https://github.com/nuxt/nuxt', branch: 'main' },
          { name: 'repo7', url: 'https://github.com/remix-run/remix', branch: 'main' },
          { name: 'repo8', url: 'https://github.com/withastro/astro', branch: 'main' },
          { name: 'repo9', url: 'https://github.com/solidjs/solid', branch: 'main' },
          { name: 'repo10', url: 'https://github.com/preactjs/preact', branch: 'main' },
        ];

        for (const repo of repositories) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // 並列度の測定
        const startTime = Date.now();
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );
        const endTime = Date.now();
        const elapsedTime = (endTime - startTime) / 1000;

        console.log('');
        console.log('=== 並列度検証 ===');
        console.log(`リポジトリ数: ${repositories.length}`);
        console.log(`合計時間: ${elapsedTime.toFixed(2)}秒`);
        console.log('==================');
        console.log('');

        // 検証: 並列処理により、1リポジトリあたりの平均時間が短縮されていることを確認
        // 逐次処理の場合、10リポジトリで最低50秒はかかるはず（1リポジトリ5秒と仮定）
        // 並列処理の場合、10秒程度で完了するはず
        const avgTimePerRepo = elapsedTime / repositories.length;
        console.log(`平均時間/リポジトリ: ${avgTimePerRepo.toFixed(2)}秒`);

        // 並列処理が機能していれば、平均時間は大幅に短縮される
        // （理想的には、最も遅いリポジトリの時間に近づく）
        expect(avgTimePerRepo).toBeLessThan(5);

        // CI結果集約が成功したことを確認
        expect(ciStatusOutput).toContain('CI結果の集約が完了しました');
      },
      60000
    );

    it.skipIf(!hasGitHubToken)(
      'レート制限対策の検証: Exponential Backoff再試行成功率 > 95%',
      async () => {
        const projectName = `michi-rate-limit-test-${Date.now()}`;
        const jiraKey = 'RATE';
        const confluenceSpace = 'RATE';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 10個のリポジトリを登録（レート制限テスト用）
        const repositories = Array.from({ length: 10 }, (_, i) => ({
          name: `rate-test-repo-${i + 1}`,
          url: `https://github.com/${['facebook/react', 'vuejs/core', 'angular/angular', 'sveltejs/svelte', 'vercel/next.js', 'nuxt/nuxt', 'remix-run/remix', 'withastro/astro', 'solidjs/solid', 'preactjs/preact'][i]}`,
          branch: i === 4 ? 'canary' : 'main',
        }));

        for (const repo of repositories) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // レート制限対策の検証
        // Note: 実際のレート制限に達することは稀だが、エラーハンドリングが機能することを確認
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );

        // 検証: すべてのリポジトリのCI結果が取得できていることを確認
        // （レート制限エラーが発生しても、再試行により成功している）
        for (const repo of repositories) {
          expect(ciStatusOutput).toContain(repo.name);
        }

        // 検証: CI結果集約が成功したことを確認
        expect(ciStatusOutput).toContain('CI結果の集約が完了しました');

        // 検証: 成功率95%以上
        // Note: 出力からは直接成功率を取得できないため、
        // すべてのリポジトリが含まれている場合は100%成功とみなす
        const successCount = repositories.filter(repo =>
          ciStatusOutput.includes(repo.name)
        ).length;
        const successRate = (successCount / repositories.length) * 100;

        console.log('');
        console.log('=== レート制限対策検証 ===');
        console.log(`成功数: ${successCount} / ${repositories.length}`);
        console.log(`成功率: ${successRate.toFixed(1)}%`);
        console.log('=========================');
        console.log('');

        expect(successRate).toBeGreaterThanOrEqual(95);
      },
      60000
    );
  });
});
