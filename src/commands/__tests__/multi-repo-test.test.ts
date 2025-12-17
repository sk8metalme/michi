/**
 * Tests for multi-repo:test command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiRepoTest } from '../multi-repo-test.js';
import * as configLoader from '../../../scripts/utils/config-loader.js';
import * as fs from 'fs';

// HealthCheckServiceとTestScriptRunnerのモックをhoistで定義
const { mockHealthCheckService, mockTestScriptRunner } = vi.hoisted(() => {
  return {
    mockHealthCheckService: {
      runHealthCheck: vi.fn(),
    },
    mockTestScriptRunner: {
      runTestScript: vi.fn(),
    },
  };
});

vi.mock('fs');
vi.mock('../../../scripts/utils/config-loader.js');
vi.mock('../../../scripts/health-check-service.js', () => {
  return {
    HealthCheckService: function () {
      return mockHealthCheckService;
    },
  };
});
vi.mock('../../../scripts/test-script-runner.js', () => {
  return {
    TestScriptRunner: function () {
      return mockTestScriptRunner;
    },
  };
});

describe('multiRepoTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('バリデーション', () => {
    it('プロジェクトが存在しない場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(null);

      await expect(
        multiRepoTest('non-existent-project', 'e2e')
      ).rejects.toThrow('プロジェクト「non-existent-project」が見つかりません');
    });

    it('テストスクリプトが存在しない場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'my-project',
        jiraKey: 'MYPROJ',
        confluenceSpace: 'MYSPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(
        multiRepoTest('my-project', 'e2e')
      ).rejects.toThrow('テストスクリプトが見つかりません');
    });

    it('無効なテストタイプの場合はエラー', async () => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue({
        name: 'my-project',
        jiraKey: 'MYPROJ',
        confluenceSpace: 'MYSPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      });

      await expect(
        multiRepoTest('my-project', 'invalid-type' as unknown as import('../multi-repo-test.js').TestType)
      ).rejects.toThrow('無効なテストタイプです');
    });
  });

  describe('正常ケース', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [
        {
          name: 'repo1',
          url: 'https://github.com/owner/repo1',
          branch: 'main',
        },
      ],
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('E2Eテスト実行が成功', async () => {
      mockHealthCheckService.runHealthCheck.mockResolvedValue({
        success: true,
        servicesStatus: [],
      });

      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        executionTime: 10.5,
        outputPath: 'docs/michi/my-project/tests/results/e2e-2025-12-15.log',
      });

      const result = await multiRepoTest('my-project', 'e2e');

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('my-project');
      expect(result.testType).toBe('e2e');
      expect(result.executionResult.exitCode).toBe(0);
    });

    it('統合テスト実行が成功', async () => {
      mockHealthCheckService.runHealthCheck.mockResolvedValue({
        success: true,
        servicesStatus: [],
      });

      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        executionTime: 15.3,
        outputPath: 'docs/michi/my-project/tests/results/integration-2025-12-15.log',
      });

      const result = await multiRepoTest('my-project', 'integration');

      expect(result.success).toBe(true);
      expect(result.testType).toBe('integration');
      expect(result.executionResult.exitCode).toBe(0);
    });

    it('パフォーマンステスト実行が成功', async () => {
      mockHealthCheckService.runHealthCheck.mockResolvedValue({
        success: true,
        servicesStatus: [],
      });

      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        executionTime: 30.7,
        outputPath: 'docs/michi/my-project/tests/results/performance-2025-12-15.log',
      });

      const result = await multiRepoTest('my-project', 'performance');

      expect(result.success).toBe(true);
      expect(result.testType).toBe('performance');
      expect(result.executionResult.exitCode).toBe(0);
    });
  });

  describe('ヘルスチェック', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [],
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('ヘルスチェック失敗時は警告を表示してテスト実行を継続', async () => {
      mockHealthCheckService.runHealthCheck.mockResolvedValue({
        success: false,
        servicesStatus: [
          { serviceName: 'database', status: 'unhealthy', message: 'Connection failed' },
        ],
      });

      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        executionTime: 10.5,
        outputPath: 'docs/michi/my-project/tests/results/e2e-2025-12-15.log',
      });

      const result = await multiRepoTest('my-project', 'e2e', { skipHealthCheck: false });

      expect(result.success).toBe(true);
      expect(result.healthCheckWarning).toBeDefined();
    });

    it('ヘルスチェックをスキップできる', async () => {
      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        executionTime: 10.5,
        outputPath: 'docs/michi/my-project/tests/results/e2e-2025-12-15.log',
      });

      const result = await multiRepoTest('my-project', 'e2e', { skipHealthCheck: true });

      expect(result.success).toBe(true);
      expect(mockHealthCheckService.runHealthCheck).not.toHaveBeenCalled();
    });
  });

  describe('テスト実行失敗', () => {
    const mockProject = {
      name: 'my-project',
      jiraKey: 'MYPROJ',
      confluenceSpace: 'MYSPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [],
    };

    beforeEach(() => {
      vi.spyOn(configLoader, 'findProject').mockResolvedValue(mockProject);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('テストスクリプト実行失敗時はエラー', async () => {
      mockHealthCheckService.runHealthCheck.mockResolvedValue({
        success: true,
        servicesStatus: [],
      });

      mockTestScriptRunner.runTestScript.mockResolvedValue({
        success: false,
        exitCode: 1,
        executionTime: 5.2,
        outputPath: 'docs/michi/my-project/tests/results/e2e-2025-12-15.log',
        error: 'Test failed',
      });

      const result = await multiRepoTest('my-project', 'e2e');

      expect(result.success).toBe(false);
      expect(result.executionResult.exitCode).toBe(1);
      expect(result.executionResult.error).toBe('Test failed');
    });
  });
});
