/**
 * Task 12.3: CI結果集約フロー全体の統合テスト
 * CIStatusCommand + GitHubActionsClient + ConfigManagement の統合テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { multiRepoCIStatus } from '../../src/commands/multi-repo-ci-status.js';
import type { AppConfig } from '../../scripts/config/config-schema.js';
import { GitHubActionsClient } from '../../scripts/github-actions-client.js';

describe('Task 12.3: CI結果集約フロー全体の統合テスト', () => {
  let testRoot: string;
  let originalCwd: string;
  let configPath: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // テスト用一時ディレクトリを作成
    originalCwd = process.cwd();
    testRoot = join('/tmp', `michi-integration-test-${Date.now()}`);
    mkdirSync(testRoot, { recursive: true });

    // 環境変数を保存
    originalEnv = { ...process.env };
    process.env.GITHUB_TOKEN = 'test-token';

    // .michiディレクトリとconfig.jsonを作成
    const michiDir = join(testRoot, '.michi');
    mkdirSync(michiDir, { recursive: true });
    configPath = join(michiDir, 'config.json');

    // テストプロジェクトとリポジトリを含むconfig.jsonを作成
    const initialConfig: AppConfig = {
      multiRepoProjects: [
        {
          name: 'test-multi-repo',
          jiraKey: 'PROJ',
          confluenceSpace: 'SPACE',
          createdAt: '2024-01-01T00:00:00.000Z',
          repositories: [
            {
              name: 'repo1',
              url: 'https://github.com/owner/repo1',
              branch: 'main',
            },
            {
              name: 'repo2',
              url: 'https://github.com/owner/repo2',
              branch: 'develop',
            },
          ],
        },
      ],
    };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2), 'utf-8');

    // カレントディレクトリを変更
    process.chdir(testRoot);
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;

    // カレントディレクトリを元に戻す
    process.chdir(originalCwd);

    // テスト用ディレクトリを削除（リトライ付き）
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }

    // モックをリセット
    vi.restoreAllMocks();
  });

  describe('正常ケース', () => {
    it('複数リポジトリのCI結果並列取得、Markdownファイル出力', async () => {
      const projectName = 'test-multi-repo';

      // GitHubActionsClientのモック
      const mockGetLatestWorkflowRun = vi.fn();
      mockGetLatestWorkflowRun
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 1,
            status: 'completed',
            conclusion: 'success',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:10:00Z',
            html_url: 'https://github.com/owner/repo1/actions/runs/1',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 2,
            status: 'completed',
            conclusion: 'failure',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:15:00Z',
            html_url: 'https://github.com/owner/repo2/actions/runs/2',
          },
        });

      vi.spyOn(
        GitHubActionsClient.prototype,
        'getLatestWorkflowRun'
      ).mockImplementation(mockGetLatestWorkflowRun);

      const result = await multiRepoCIStatus(projectName, {}, testRoot);

      // 結果検証
      expect(result.success).toBe(true);
      expect(result.projectName).toBe(projectName);
      expect(result.repositories.length).toBe(2);
      expect(result.repositories[0].status).toBe('success');
      expect(result.repositories[1].status).toBe('failure');

      // Markdownファイル出力の検証
      const outputPath = join(
        testRoot,
        'docs',
        'michi',
        projectName,
        'docs',
        'ci-status.md'
      );
      expect(existsSync(outputPath)).toBe(true);

      const markdown = readFileSync(outputPath, 'utf-8');
      expect(markdown).toContain('# CI結果集約');
      expect(markdown).toContain('repo1');
      expect(markdown).toContain('repo2');
      expect(markdown).toContain('✅'); // success icon
      expect(markdown).toContain('❌'); // failure icon

      // サマリー検証
      expect(result.summary.total).toBe(2);
      expect(result.summary.success).toBe(1);
      expect(result.summary.failure).toBe(1);
      expect(result.summary.running).toBe(0);
      expect(result.summary.unknown).toBe(0);

      // キャッシュ保存の検証
      const cachePath = join(
        testRoot,
        'docs',
        'michi',
        projectName,
        'docs',
        '.ci-cache.json'
      );
      expect(existsSync(cachePath)).toBe(true);

      const cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
      expect(cache.timestamp).toBeDefined();
      expect(cache.repositories.length).toBe(2);
    });

    it('差分表示（--diffオプション）', async () => {
      const projectName = 'test-multi-repo';

      // 前回のキャッシュを作成
      const baseDir = join(testRoot, 'docs', 'michi', projectName, 'docs');
      mkdirSync(baseDir, { recursive: true });
      const cachePath = join(baseDir, '.ci-cache.json');

      const previousCache = {
        timestamp: new Date().toISOString(),
        repositories: [
          {
            name: 'repo1',
            url: 'https://github.com/owner/repo1',
            branch: 'main',
            status: 'failure', // 前回は失敗
            testStatus: 'failed',
            lastExecutionTime: new Date().toISOString(),
          },
          {
            name: 'repo2',
            url: 'https://github.com/owner/repo2',
            branch: 'develop',
            status: 'success', // 前回は成功
            testStatus: 'passed',
            lastExecutionTime: new Date().toISOString(),
          },
        ],
      };
      writeFileSync(cachePath, JSON.stringify(previousCache, null, 2), 'utf-8');

      // GitHubActionsClientのモック（今回の結果）
      const mockGetLatestWorkflowRun = vi.fn();
      mockGetLatestWorkflowRun
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 1,
            status: 'completed',
            conclusion: 'success', // 今回は成功（新規成功）
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:10:00Z',
            html_url: 'https://github.com/owner/repo1/actions/runs/1',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 2,
            status: 'completed',
            conclusion: 'failure', // 今回は失敗（新規失敗）
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:15:00Z',
            html_url: 'https://github.com/owner/repo2/actions/runs/2',
          },
        });

      vi.spyOn(
        GitHubActionsClient.prototype,
        'getLatestWorkflowRun'
      ).mockImplementation(mockGetLatestWorkflowRun);

      const result = await multiRepoCIStatus(
        projectName,
        { diff: true },
        testRoot
      );

      // 差分検証
      expect(result.diff).toBeDefined();
      expect(result.diff!.newSuccesses).toContain('repo1');
      expect(result.diff!.newFailures).toContain('repo2');

      // Markdown差分情報の検証
      const outputPath = join(baseDir, 'ci-status.md');
      const markdown = readFileSync(outputPath, 'utf-8');
      expect(markdown).toContain('## 差分情報');
      expect(markdown).toContain('新規成功');
      expect(markdown).toContain('新規失敗');
    });
  });

  describe('GitHub APIエラー', () => {
    it('404エラー（Not Found）', async () => {
      const projectName = 'test-multi-repo';

      // GitHubActionsClientのモック（404エラー）
      const mockGetLatestWorkflowRun = vi.fn();
      mockGetLatestWorkflowRun.mockResolvedValue({
        success: false,
        error: {
          type: 'NOT_FOUND',
          statusCode: 404,
          message: 'Workflow not found',
        },
      });

      vi.spyOn(
        GitHubActionsClient.prototype,
        'getLatestWorkflowRun'
      ).mockImplementation(mockGetLatestWorkflowRun);

      const result = await multiRepoCIStatus(projectName, {}, testRoot);

      // エラーハンドリング検証（unknownステータスにフォールバック）
      expect(result.success).toBe(true);
      expect(result.repositories[0].status).toBe('unknown');
      expect(result.repositories[1].status).toBe('unknown');
      expect(result.summary.unknown).toBe(2);
    });

    it('403エラー（Rate Limit Exceeded）', async () => {
      const projectName = 'test-multi-repo';

      // GitHubActionsClientのモック（レート制限エラー）
      const mockGetLatestWorkflowRun = vi.fn();
      mockGetLatestWorkflowRun.mockResolvedValue({
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          statusCode: 403,
          message: 'API rate limit exceeded',
          retryAfter: 60,
        },
      });

      vi.spyOn(
        GitHubActionsClient.prototype,
        'getLatestWorkflowRun'
      ).mockImplementation(mockGetLatestWorkflowRun);

      const result = await multiRepoCIStatus(projectName, {}, testRoot);

      // レート制限エラーでもunknownにフォールバック
      expect(result.success).toBe(true);
      expect(result.repositories[0].status).toBe('unknown');
      expect(result.summary.unknown).toBe(2);
    });

    it('500エラー（Internal Server Error）', async () => {
      const projectName = 'test-multi-repo';

      // GitHubActionsClientのモック（サーバーエラー）
      const mockGetLatestWorkflowRun = vi.fn();
      mockGetLatestWorkflowRun.mockResolvedValue({
        success: false,
        error: {
          type: 'UNKNOWN',
          statusCode: 500,
          message: 'Internal Server Error',
        },
      });

      vi.spyOn(
        GitHubActionsClient.prototype,
        'getLatestWorkflowRun'
      ).mockImplementation(mockGetLatestWorkflowRun);

      const result = await multiRepoCIStatus(projectName, {}, testRoot);

      // サーバーエラーでもunknownにフォールバック
      expect(result.success).toBe(true);
      expect(result.repositories[0].status).toBe('unknown');
      expect(result.summary.unknown).toBe(2);
    });
  });

  describe('エラーケース', () => {
    it('GITHUB_TOKEN未設定', async () => {
      delete process.env.GITHUB_TOKEN;

      const projectName = 'test-multi-repo';

      await expect(
        multiRepoCIStatus(projectName, {}, testRoot)
      ).rejects.toThrow(/GITHUB_TOKENが設定されていません/);
    });

    it('プロジェクト未存在', async () => {
      const projectName = 'non-existent-project';

      await expect(
        multiRepoCIStatus(projectName, {}, testRoot)
      ).rejects.toThrow(/プロジェクト「non-existent-project」が見つかりません/);
    });

    it('リポジトリが登録されていない', async () => {
      // リポジトリなしのプロジェクトを作成
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as AppConfig;
      config.multiRepoProjects!.push({
        name: 'empty-project',
        jiraKey: 'EMPTY',
        confluenceSpace: 'SPACE',
        createdAt: '2024-01-01T00:00:00.000Z',
        repositories: [],
      });
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      await expect(
        multiRepoCIStatus('empty-project', {}, testRoot)
      ).rejects.toThrow(/プロジェクト「empty-project」にリポジトリが登録されていません/);
    });
  });
});
