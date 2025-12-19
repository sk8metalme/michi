/**
 * Task 13.2: Phase 2 E2Eテスト（実際のGitHub API）
 * プロジェクト初期化 → リポジトリ登録 → CI結果集約（実GitHub API呼び出し）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  cpSync,
} from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { AppConfig } from '../../scripts/config/config-schema.js';

// GITHUB_TOKENが設定されているかチェック
const hasGitHubToken = !!process.env.GITHUB_TOKEN;

describe('Task 13.2: Phase 2 E2Eテスト（実際のGitHub API）', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let cliPath: string;
  let githubToken: string | undefined;

  beforeEach(() => {
    // GITHUB_TOKENの確認
    githubToken = process.env.GITHUB_TOKEN;

    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-e2e-github-test-${Date.now()}`);
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

  describe('GitHub API統合シナリオ', () => {
    it.skipIf(!hasGitHubToken)(
      'プロジェクト初期化 → リポジトリ登録 → CI結果集約（実GitHub API）',
      () => {
        const projectName = 'michi-test-github-api';
        const jiraKey = 'MICHI';
        const confluenceSpace = 'MICHI';

        // テスト対象リポジトリ: Michiリポジトリ自身
        const repoName = 'michi';
        const repoUrl = 'https://github.com/gotalab/michi';
        const repoBranch = 'main';

        // 1. プロジェクト初期化
        const initOutput = execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        expect(initOutput).toContain('Multi-Repoプロジェクトの初期化が完了しました');

        // 2. リポジトリ登録（Michiリポジトリ）
        const addRepoOutput = execSync(
          `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${repoBranch}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        expect(addRepoOutput).toContain('リポジトリの追加が完了しました');

        // 3. CI結果集約（実GitHub API呼び出し）
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: githubToken },
          }
        );

        // CI結果集約出力の検証
        expect(ciStatusOutput).toContain('CI結果集約が完了しました');
        expect(ciStatusOutput).toContain(repoName);

        // Markdownファイル出力の検証
        const ciStatusFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          'ci-status.md'
        );
        expect(existsSync(ciStatusFile)).toBe(true);

        const ciStatusContent = readFileSync(ciStatusFile, 'utf-8');
        expect(ciStatusContent).toContain('# CI結果集約');
        expect(ciStatusContent).toContain(repoName);
        expect(ciStatusContent).toContain(repoUrl);
        expect(ciStatusContent).toContain(repoBranch);

        // ステータスアイコンの検証（success/failure/running/unknownのいずれか）
        const hasStatusIcon =
        ciStatusContent.includes('✅') ||
        ciStatusContent.includes('❌') ||
        ciStatusContent.includes('🔄') ||
        ciStatusContent.includes('❓');
        expect(hasStatusIcon).toBe(true);

        // キャッシュファイルの検証
        const cacheFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          '.ci-cache.json'
        );
        expect(existsSync(cacheFile)).toBe(true);

        const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        expect(cache.timestamp).toBeDefined();
        expect(cache.repositories).toBeDefined();
        expect(cache.repositories.length).toBe(1);
        expect(cache.repositories[0].name).toBe(repoName);
        expect(cache.repositories[0].url).toBe(repoUrl);
        expect(cache.repositories[0].branch).toBe(repoBranch);
        expect(cache.repositories[0].status).toBeDefined();
      },
      60000
    ); // タイムアウト: 60秒（GitHub API呼び出しを考慮）

    it.skipIf(!hasGitHubToken)(
      '差分表示（--diffオプション）でキャッシュとの差分を表示',
      () => {
        const projectName = 'michi-test-github-api-diff';
        const jiraKey = 'MICHI';
        const confluenceSpace = 'MICHI';

        const repoName = 'michi';
        const repoUrl = 'https://github.com/gotalab/michi';
        const repoBranch = 'main';

        // プロジェクト初期化
        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // リポジトリ登録
        execSync(
          `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${repoBranch}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 1回目のCI結果集約（キャッシュ作成）
        execSync(`node "${cliPath}" multi-repo:ci-status ${projectName}`, {
          cwd: testRoot,
          encoding: 'utf-8',
          env: { ...process.env, GITHUB_TOKEN: githubToken },
        });

        // 2回目のCI結果集約（--diffオプション付き）
        const ciStatusDiffOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName} --diff`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: githubToken },
          }
        );

        // 差分表示の検証
        expect(ciStatusDiffOutput).toContain('CI結果集約が完了しました');

        // Markdownファイルに差分情報が含まれることを確認
        const ciStatusFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          'ci-status.md'
        );
        const ciStatusContent = readFileSync(ciStatusFile, 'utf-8');

        // 差分情報セクションの存在確認（新規成功/新規失敗/復旧/新規失敗のいずれか）
        const hasDiffSection =
        ciStatusContent.includes('## 差分情報') ||
        ciStatusContent.includes('新規成功') ||
        ciStatusContent.includes('新規失敗') ||
        ciStatusContent.includes('復旧') ||
        ciStatusContent.includes('変更なし');

        expect(hasDiffSection).toBe(true);

        // 差分がある場合（CI状態が変わった場合）は差分情報が表示される
        // 差分がない場合（CI状態が同じ場合）は差分情報が表示されない
        // どちらも正常動作なので、コマンドが成功することのみ確認
        expect(ciStatusDiffOutput).toBeDefined();
      },
      120000
    ); // タイムアウト: 120秒（2回のGitHub API呼び出しを考慮）
  });

  describe('レート制限対策', () => {
    it.skipIf(!hasGitHubToken)(
      'レート制限超過時のエラーメッセージ確認（モック不可のため手動確認推奨）',
      () => {
      // このテストは実際にレート制限に達した場合の動作を確認するため、
      // 通常のテスト実行ではスキップされることが望ましい
      // レート制限に達した場合のエラーメッセージの例：
      // "API rate limit exceeded. Retry after 60 seconds."

        // テストとしてはレート制限に達していない通常のケースを確認
        const projectName = 'michi-test-rate-limit';
        const jiraKey = 'MICHI';
        const confluenceSpace = 'MICHI';

        const repoName = 'michi';
        const repoUrl = 'https://github.com/gotalab/michi';
        const repoBranch = 'main';

        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        execSync(
          `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repoName} --url ${repoUrl} --branch ${repoBranch}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // レート制限に達していない場合は正常に完了
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: githubToken },
          }
        );

        expect(ciStatusOutput).toContain('CI結果集約が完了しました');

      // 注: レート制限に達した場合の動作は実際のレート制限発生時に手動で確認する必要があります
      // レート制限エラー時は、エラーメッセージに "rate limit" が含まれ、
      // リトライ時間（retryAfter）が表示されることを期待しています
      },
      60000
    );
  });

  describe('複数リポジトリのCI結果集約', () => {
    it.skipIf(!hasGitHubToken)(
      '複数リポジトリのCI結果を並列取得',
      () => {
        const projectName = 'michi-test-multiple-repos';
        const jiraKey = 'MICHI';
        const confluenceSpace = 'MICHI';

        // テスト対象リポジトリ: 複数のpublicリポジトリ
        const repos = [
          { name: 'michi', url: 'https://github.com/gotalab/michi', branch: 'main' },
          {
            name: 'cc-sdd',
            url: 'https://github.com/gotalab/cc-sdd',
            branch: 'main',
          },
        ];

        execSync(
          `node "${cliPath}" multi-repo:init ${projectName} --jira ${jiraKey} --confluence-space ${confluenceSpace}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
          }
        );

        // 複数リポジトリを登録
        for (const repo of repos) {
          execSync(
            `node "${cliPath}" multi-repo:add-repo ${projectName} --name ${repo.name} --url ${repo.url} --branch ${repo.branch}`,
            {
              cwd: testRoot,
              encoding: 'utf-8',
            }
          );
        }

        // CI結果集約（並列取得）
        const startTime = Date.now();
        const ciStatusOutput = execSync(
          `node "${cliPath}" multi-repo:ci-status ${projectName}`,
          {
            cwd: testRoot,
            encoding: 'utf-8',
            env: { ...process.env, GITHUB_TOKEN: githubToken },
          }
        );
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;

        expect(ciStatusOutput).toContain('CI結果集約が完了しました');

        // Markdownファイル検証
        const ciStatusFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          'ci-status.md'
        );
        const ciStatusContent = readFileSync(ciStatusFile, 'utf-8');

        // 全リポジトリが含まれていることを確認
        for (const repo of repos) {
          expect(ciStatusContent).toContain(repo.name);
          expect(ciStatusContent).toContain(repo.url);
        }

        // キャッシュファイル検証
        const cacheFile = join(
          testRoot,
          'docs',
          'michi',
          projectName,
          'docs',
          '.ci-cache.json'
        );
        const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        expect(cache.repositories.length).toBe(repos.length);

        // パフォーマンス検証（参考値）
        // 並列処理により、合計時間は個別取得時間の合計よりも短いはず
        console.log(`CI結果集約所要時間: ${elapsedTime}ms（${repos.length}リポジトリ）`);
      },
      120000
    ); // タイムアウト: 120秒（複数リポジトリのGitHub API呼び出しを考慮）
  });
});
