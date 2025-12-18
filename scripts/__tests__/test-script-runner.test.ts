/**
 * Tests for TestScriptRunner
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestScriptRunner } from '../test-script-runner.js';
import * as child_process from 'child_process';

vi.mock('child_process');

// カスタムエラー型の定義
interface ExecError extends Error {
  status?: number;
  code?: string;
  stderr?: Buffer;
}

describe('TestScriptRunner', () => {
  let runner: TestScriptRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new TestScriptRunner();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('正常ケース', () => {
    it('テストスクリプト実行が成功（終了コード0）', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Test passed'));

      const startTime = Date.now();
      vi.setSystemTime(startTime);

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.outputPath).toContain('docs/michi/my-project/tests/results/e2e-');
      expect(result.error).toBeUndefined();
    });

    it('統合テスト実行が成功', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Integration test passed'));

      const result = await runner.runTestScript('my-project', 'integration');

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.outputPath).toContain('integration-');
    });

    it('パフォーマンステスト実行が成功', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Performance test passed'));

      const result = await runner.runTestScript('my-project', 'performance');

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.outputPath).toContain('performance-');
    });

    it('実行時間を正しく計測', async () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        // 5秒後に完了をシミュレート
        vi.setSystemTime(startTime + 5000);
        return Buffer.from('Test passed');
      });

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.executionTime).toBeCloseTo(5, 1);
    });
  });

  describe('テスト失敗ケース', () => {
    it('テストスクリプト実行が失敗（終了コード非0）', async () => {
      const error: ExecError = new Error('Command failed');
      error.status = 1;
      error.stderr = Buffer.from('Test failed: assertion error');

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.error).toContain('Test failed');
    });

    it('終了コード2のテスト失敗', async () => {
      const error: ExecError = new Error('Command failed');
      error.status = 2;

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await runner.runTestScript('my-project', 'integration');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(2);
    });
  });

  describe('エラーハンドリング', () => {
    it('スクリプト実行タイムアウトの場合はエラー', async () => {
      const error: ExecError = new Error('Timeout');
      error.code = 'ETIMEDOUT';

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('パーミッションエラーの場合はエラー', async () => {
      const error: ExecError = new Error('Permission denied');
      error.code = 'EACCES';

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('スクリプト未存在エラーの場合はエラー', async () => {
      const error: ExecError = new Error('Script not found');
      error.code = 'ENOENT';

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await runner.runTestScript('my-project', 'e2e');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Script not found');
    });
  });

  describe('カスタムプロジェクトルート', () => {
    it('カスタムプロジェクトルートを指定できる', async () => {
      const customRoot = '/custom/path';
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Test passed'));

      const result = await runner.runTestScript('my-project', 'e2e', customRoot);

      expect(result.success).toBe(true);
      expect(child_process.execSync).toHaveBeenCalledWith(
        expect.stringContaining(`${customRoot}/docs/michi/my-project/tests/scripts/run-e2e.sh`),
        expect.any(Object)
      );
    });
  });

  describe('ログ出力', () => {
    it('実行前にログを出力', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Test passed'));

      await runner.runTestScript('my-project', 'e2e');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀 テストスクリプトを実行中')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('テストタイプ: e2e')
      );
    });

    it('成功時に成功メッセージを表示', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      vi.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('Test passed'));

      await runner.runTestScript('my-project', 'e2e');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ テスト実行が成功しました')
      );
    });

    it('失敗時に失敗メッセージを表示', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const error: ExecError = new Error('Command failed');
      error.status = 1;

      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      await runner.runTestScript('my-project', 'e2e');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ テスト実行が失敗しました')
      );
    });
  });
});
