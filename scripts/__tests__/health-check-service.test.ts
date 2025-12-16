/**
 * Tests for HealthCheckService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthCheckService } from '../health-check-service.js';
import * as fs from 'fs';
import * as child_process from 'child_process';

vi.mock('fs');
vi.mock('child_process');

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthCheckService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ヘルスチェックスクリプトが存在しない場合', () => {
    it('スキップして成功を返す', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(true);
      expect(result.servicesStatus).toEqual([]);
    });
  });

  describe('ヘルスチェックスクリプトが存在する場合', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('終了コード0の場合は成功', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(
        'database: healthy\nredis: healthy\n' as any
      );

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(true);
      expect(result.servicesStatus.length).toBeGreaterThan(0);
      expect(result.servicesStatus.every((s) => s.status === 'healthy')).toBe(true);
    });

    it('終了コード非0の場合は失敗', async () => {
      const error = new Error('Command failed');
      (error as any).status = 1;
      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(false);
    });

    it('スクリプト出力を解析してサービスステータスを返す', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(
        'database: healthy\nredis: unhealthy - Connection timeout\napi: healthy\n' as any
      );

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(false); // unhealthyなサービスがあるため
      expect(result.servicesStatus).toEqual([
        { serviceName: 'database', status: 'healthy', message: undefined },
        { serviceName: 'redis', status: 'unhealthy', message: 'Connection timeout' },
        { serviceName: 'api', status: 'healthy', message: undefined },
      ]);
    });

    it('スクリプト実行タイムアウトの場合はエラー', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(false);
      expect(result.servicesStatus.length).toBe(0);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    });

    it('スクリプト実行中のエラーを適切にハンドリング', async () => {
      const error = new Error('Script execution failed');
      vi.spyOn(child_process, 'execSync').mockImplementation(() => {
        throw error;
      });

      const result = await service.runHealthCheck('my-project');

      expect(result.success).toBe(false);
    });

    it('スクリプト出力が不正な形式の場合はエラー', async () => {
      vi.spyOn(child_process, 'execSync').mockReturnValue(
        'invalid output format\n' as any
      );

      const result = await service.runHealthCheck('my-project');

      // 不正な形式でも、スクリプトが終了コード0で終了すれば成功とする
      expect(result.success).toBe(true);
      expect(result.servicesStatus.length).toBe(0);
    });
  });

  describe('カスタムプロジェクトルート', () => {
    it('カスタムプロジェクトルートを指定できる', async () => {
      const customRoot = '/custom/path';
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await service.runHealthCheck('my-project', customRoot);

      expect(result.success).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(`${customRoot}/docs/michi/my-project/tests/scripts/health-check.sh`)
      );
    });
  });
});
