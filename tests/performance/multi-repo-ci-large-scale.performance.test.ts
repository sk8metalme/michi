/**
 * Task 14.2: 大量リポジトリのCI結果集約テスト
 * 大量リポジトリ（100リポジトリ相当）のCI結果集約とキャッシング効果を測定
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  rmSync,
  existsSync,
  writeFileSync,
  cpSync,
  readFileSync,
} from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { AppConfig } from '../../scripts/config/config-schema.js';

// GitHub Token が設定されているかチェック
const hasGitHubToken = !!process.env.GITHUB_TOKEN;

describe('Task 14.2: 大量リポジトリのCI結果集約テスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let cliPath: string;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-large-scale-test-${Date.now()}`);
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

  describe('大量リポジトリのCI結果集約', () => {
    it.skipIf(!hasGitHubToken)(
      '30リポジトリのCI結果集約とキャッシング効果の検証（100リポジトリのシミュレーション）',
      async () => {
        const projectName = `michi-large-scale-${Date.now()}`;
        const jiraKey = 'LARGE';
        const confluenceSpace = 'LARGE';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 30個のpublicリポジトリを登録（100リポジトリの代表サンプル）
        // Note: 実際のGitHub API呼び出しを行うため、有名なOSSプロジェクトを使用
        const repositories = [
          // JavaScript/TypeScript frameworks
          { name: 'react', url: 'https://github.com/facebook/react', branch: 'main' },
          { name: 'vue', url: 'https://github.com/vuejs/core', branch: 'main' },
          { name: 'angular', url: 'https://github.com/angular/angular', branch: 'main' },
          { name: 'svelte', url: 'https://github.com/sveltejs/svelte', branch: 'main' },
          { name: 'next', url: 'https://github.com/vercel/next.js', branch: 'canary' },
          { name: 'nuxt', url: 'https://github.com/nuxt/nuxt', branch: 'main' },
          { name: 'remix', url: 'https://github.com/remix-run/remix', branch: 'main' },
          { name: 'astro', url: 'https://github.com/withastro/astro', branch: 'main' },
          { name: 'solid', url: 'https://github.com/solidjs/solid', branch: 'main' },
          { name: 'preact', url: 'https://github.com/preactjs/preact', branch: 'main' },
          // Build tools
          { name: 'vite', url: 'https://github.com/vitejs/vite', branch: 'main' },
          { name: 'webpack', url: 'https://github.com/webpack/webpack', branch: 'main' },
          { name: 'rollup', url: 'https://github.com/rollup/rollup', branch: 'master' },
          { name: 'esbuild', url: 'https://github.com/evanw/esbuild', branch: 'main' },
          { name: 'turbo', url: 'https://github.com/vercel/turbo', branch: 'main' },
          // Testing frameworks
          { name: 'vitest', url: 'https://github.com/vitest-dev/vitest', branch: 'main' },
          { name: 'jest', url: 'https://github.com/jestjs/jest', branch: 'main' },
          { name: 'playwright', url: 'https://github.com/microsoft/playwright', branch: 'main' },
          { name: 'cypress', url: 'https://github.com/cypress-io/cypress', branch: 'develop' },
          { name: 'testing-library', url: 'https://github.com/testing-library/react-testing-library', branch: 'main' },
          // Package managers
          { name: 'pnpm', url: 'https://github.com/pnpm/pnpm', branch: 'main' },
          { name: 'yarn', url: 'https://github.com/yarnpkg/berry', branch: 'master' },
          { name: 'npm', url: 'https://github.com/npm/cli', branch: 'latest' },
          // Popular libraries
          { name: 'lodash', url: 'https://github.com/lodash/lodash', branch: 'main' },
          { name: 'axios', url: 'https://github.com/axios/axios', branch: 'v1.x' },
          { name: 'date-fns', url: 'https://github.com/date-fns/date-fns', branch: 'main' },
          { name: 'zod', url: 'https://github.com/colinhacks/zod', branch: 'main' },
          { name: 'prisma', url: 'https://github.com/prisma/prisma', branch: 'main' },
          { name: 'drizzle', url: 'https://github.com/drizzle-team/drizzle-orm', branch: 'main' },
          { name: 'trpc', url: 'https://github.com/trpc/trpc', branch: 'main' },
        ];

        console.log('');
        console.log('=== リポジトリ登録中 ===');
        console.log(`登録数: ${repositories.length}リポジトリ`);
        console.log('=======================');
        console.log('');

        // リポジトリを登録（バッチ処理のシミュレーション）
        for (const repo of repositories) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // メモリ使用量の測定（初期値）
        const initialMemory = process.memoryUsage();

        // 1回目の実行: キャッシュなし（全リポジトリのCI結果を取得）
        console.log('');
        console.log('=== 1回目の実行（キャッシュなし）===');
        const firstRunStart = Date.now();
        const firstRunOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );
        const firstRunEnd = Date.now();
        const firstRunTime = (firstRunEnd - firstRunStart) / 1000;

        console.log(`1回目の実行時間: ${firstRunTime.toFixed(2)}秒`);
        console.log('=================================');
        console.log('');

        // キャッシュファイルの存在確認
        const cacheFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          '.ci-cache.json'
        );
        expect(existsSync(cacheFile)).toBe(true);

        // キャッシュ内容の検証
        const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        expect(cache.timestamp).toBeDefined();
        expect(cache.repositories).toBeDefined();
        expect(cache.repositories.length).toBe(repositories.length);

        // 2回目の実行: キャッシュあり（キャッシュから取得）
        console.log('');
        console.log('=== 2回目の実行（キャッシュあり）===');
        const secondRunStart = Date.now();
        const secondRunOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );
        const secondRunEnd = Date.now();
        const secondRunTime = (secondRunEnd - secondRunStart) / 1000;

        console.log(`2回目の実行時間: ${secondRunTime.toFixed(2)}秒`);
        console.log('===================================');
        console.log('');

        // メモリ使用量の測定（最終値）
        const finalMemory = process.memoryUsage();
        const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

        // 結果の表示
        console.log('');
        console.log('=== パフォーマンステスト結果 ===');
        console.log(`リポジトリ数: ${repositories.length}`);
        console.log(`1回目の実行時間: ${firstRunTime.toFixed(2)}秒`);
        console.log(`2回目の実行時間: ${secondRunTime.toFixed(2)}秒`);
        console.log(`キャッシング効果: ${((1 - secondRunTime / firstRunTime) * 100).toFixed(1)}%短縮`);
        console.log(`メモリ増加量: ${memoryIncreaseMB.toFixed(2)}MB`);
        console.log('================================');
        console.log('');

        // 検証1: CI結果集約が成功したことを確認
        expect(firstRunOutput).toContain('CI結果の集約が完了しました');
        expect(secondRunOutput).toContain('CI結果の集約が完了しました');

        // 検証2: キャッシング効果（2回目は1回目よりも高速）
        // キャッシュにより、少なくとも20%以上の時間短縮が期待される
        expect(secondRunTime).toBeLessThan(firstRunTime * 0.8);

        // 検証3: 100リポジトリ相当の予測時間（30リポジトリの結果から推定）
        const estimated100RepoTime = (firstRunTime / repositories.length) * 100;
        console.log(`100リポジトリの予測時間: ${estimated100RepoTime.toFixed(2)}秒`);

        // 100リポジトリの場合でも5分（300秒）以内に完了することを確認
        expect(estimated100RepoTime).toBeLessThan(300);

        // 検証4: メモリ使用量が200MB未満であることを確認
        expect(memoryIncreaseMB).toBeLessThan(200);

        // 検証5: 並列処理の効率
        // 30リポジトリを逐次処理した場合の予想時間（1リポジトリ5秒と仮定）
        const expectedSequentialTime = repositories.length * 5;
        // 並列処理により、大幅な時間短縮が見られるはず
        expect(firstRunTime).toBeLessThan(expectedSequentialTime * 0.3);
      },
      600000
    ); // タイムアウト: 600秒（10分）

    it.skipIf(!hasGitHubToken)(
      'キャッシュヒット率の検証（20リポジトリ、2回実行）',
      async () => {
        const projectName = `michi-cache-test-${Date.now()}`;
        const jiraKey = 'CACHE';
        const confluenceSpace = 'CACHE';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 20個のリポジトリを登録
        const repositories = [
          { name: 'react', url: 'https://github.com/facebook/react', branch: 'main' },
          { name: 'vue', url: 'https://github.com/vuejs/core', branch: 'main' },
          { name: 'angular', url: 'https://github.com/angular/angular', branch: 'main' },
          { name: 'svelte', url: 'https://github.com/sveltejs/svelte', branch: 'main' },
          { name: 'next', url: 'https://github.com/vercel/next.js', branch: 'canary' },
          { name: 'nuxt', url: 'https://github.com/nuxt/nuxt', branch: 'main' },
          { name: 'remix', url: 'https://github.com/remix-run/remix', branch: 'main' },
          { name: 'astro', url: 'https://github.com/withastro/astro', branch: 'main' },
          { name: 'solid', url: 'https://github.com/solidjs/solid', branch: 'main' },
          { name: 'preact', url: 'https://github.com/preactjs/preact', branch: 'main' },
          { name: 'vite', url: 'https://github.com/vitejs/vite', branch: 'main' },
          { name: 'webpack', url: 'https://github.com/webpack/webpack', branch: 'main' },
          { name: 'rollup', url: 'https://github.com/rollup/rollup', branch: 'master' },
          { name: 'esbuild', url: 'https://github.com/evanw/esbuild', branch: 'main' },
          { name: 'turbo', url: 'https://github.com/vercel/turbo', branch: 'main' },
          { name: 'vitest', url: 'https://github.com/vitest-dev/vitest', branch: 'main' },
          { name: 'jest', url: 'https://github.com/jestjs/jest', branch: 'main' },
          { name: 'playwright', url: 'https://github.com/microsoft/playwright', branch: 'main' },
          { name: 'cypress', url: 'https://github.com/cypress-io/cypress', branch: 'develop' },
          { name: 'pnpm', url: 'https://github.com/pnpm/pnpm', branch: 'main' },
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

        // 1回目の実行（キャッシュなし）
        const firstRunStart = Date.now();
        execSync(`node "${cliPath}" multi-repo:ci-status ${projectName}`, {
          cwd: testRoot,
          encoding: 'utf-8',
          env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
        });
        const firstRunTime = (Date.now() - firstRunStart) / 1000;

        // キャッシュファイルの確認
        const cacheFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          '.ci-cache.json'
        );
        const cache1 = JSON.parse(readFileSync(cacheFile, 'utf-8'));

        // 2回目の実行（キャッシュあり）
        const secondRunStart = Date.now();
        execSync(`node "${cliPath}" multi-repo:ci-status ${projectName}`, {
          cwd: testRoot,
          encoding: 'utf-8',
          env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
        });
        const secondRunTime = (Date.now() - secondRunStart) / 1000;

        // キャッシュ内容の確認
        const cache2 = JSON.parse(readFileSync(cacheFile, 'utf-8'));

        // キャッシュヒット率の計算
        // 注: 実装ではキャッシュが有効な場合、GitHub APIを呼び出さずにキャッシュから取得
        // 時間差からキャッシュヒット率を推定
        const cacheHitRate = ((firstRunTime - secondRunTime) / firstRunTime) * 100;

        console.log('');
        console.log('=== キャッシュヒット率検証 ===');
        console.log(`リポジトリ数: ${repositories.length}`);
        console.log(`1回目の実行時間: ${firstRunTime.toFixed(2)}秒`);
        console.log(`2回目の実行時間: ${secondRunTime.toFixed(2)}秒`);
        console.log(`推定キャッシュヒット率: ${cacheHitRate.toFixed(1)}%`);
        console.log(`キャッシュタイムスタンプ1: ${cache1.timestamp}`);
        console.log(`キャッシュタイムスタンプ2: ${cache2.timestamp}`);
        console.log('=============================');
        console.log('');

        // 検証: キャッシングにより80%以上の時間短縮（キャッシュヒット率 > 80%に相当）
        expect(cacheHitRate).toBeGreaterThanOrEqual(80);

        // 検証: 2回目の実行時間が1回目の20%以下
        expect(secondRunTime).toBeLessThan(firstRunTime * 0.2);
      },
      600000
    );

    it.skipIf(!hasGitHubToken)(
      'バッチ処理の効率検証（最大10並列）',
      async () => {
        const projectName = `michi-batch-test-${Date.now()}`;
        const jiraKey = 'BATCH';
        const confluenceSpace = 'BATCH';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 25個のリポジトリを登録（3バッチ: 10 + 10 + 5）
        const repositories = Array.from({ length: 25 }, (_, i) => {
          const repos = [
            'facebook/react',
            'vuejs/core',
            'angular/angular',
            'sveltejs/svelte',
            'vercel/next.js',
            'nuxt/nuxt',
            'remix-run/remix',
            'withastro/astro',
            'solidjs/solid',
            'preactjs/preact',
            'vitejs/vite',
            'webpack/webpack',
            'rollup/rollup',
            'evanw/esbuild',
            'vercel/turbo',
            'vitest-dev/vitest',
            'jestjs/jest',
            'microsoft/playwright',
            'cypress-io/cypress',
            'pnpm/pnpm',
            'yarnpkg/berry',
            'npm/cli',
            'lodash/lodash',
            'axios/axios',
            'date-fns/date-fns',
          ];
          const branch =
            i === 4 ? 'canary' : i === 12 ? 'master' : i === 18 ? 'develop' : i === 21 ? 'master' : i === 22 ? 'latest' : 'main';
          return {
            name: `batch-repo-${i + 1}`,
            url: `https://github.com/${repos[i]}`,
            branch,
          };
        });

        for (const repo of repositories) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // バッチ処理の実行
        const batchStart = Date.now();
        const batchOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
          }
        );
        const batchTime = (Date.now() - batchStart) / 1000;

        console.log('');
        console.log('=== バッチ処理効率検証 ===');
        console.log(`リポジトリ数: ${repositories.length}`);
        console.log(`実行時間: ${batchTime.toFixed(2)}秒`);
        console.log(`平均時間/リポジトリ: ${(batchTime / repositories.length).toFixed(2)}秒`);
        console.log('=========================');
        console.log('');

        // 検証1: CI結果集約が成功
        expect(batchOutput).toContain('CI結果の集約が完了しました');

        // 検証2: バッチ処理により効率的に処理
        // 逐次処理の場合: 25リポジトリ × 5秒 = 125秒
        // 10並列バッチ処理の場合: (10 + 10 + 5) / 10 × 5秒 ≈ 12.5秒
        // 実際にはAPIレイテンシがあるので、30秒程度を目標
        expect(batchTime).toBeLessThan(60);

        // 検証3: 平均時間が効率的
        const avgTime = batchTime / repositories.length;
        expect(avgTime).toBeLessThan(3);
      },
      600000
    );
  });
});
