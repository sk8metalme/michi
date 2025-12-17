/**
 * ヘルスチェックサービス
 * 依存サービスの状態を確認してテスト実行前の環境チェックを行う
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * サービスステータス
 */
export interface ServiceStatus {
  serviceName: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
}

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  success: boolean;
  servicesStatus: ServiceStatus[];
}

/**
 * execSync実行時のエラー型
 */
interface ExecError extends Error {
  status?: number;
  stdout?: Buffer | string;
  stderr?: Buffer | string;
}

/**
 * ヘルスチェックサービス
 */
export class HealthCheckService {
  /**
   * ヘルスチェックを実行
   *
   * @param projectName プロジェクト名
   * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
   * @returns ヘルスチェック結果
   */
  async runHealthCheck(
    projectName: string,
    projectRoot: string = process.cwd()
  ): Promise<HealthCheckResult> {
    // 1. ヘルスチェックスクリプトの存在確認
    const scriptPath = join(
      projectRoot,
      'docs',
      'michi',
      projectName,
      'tests',
      'scripts',
      'health-check.sh'
    );

    if (!existsSync(scriptPath)) {
      console.log(
        `ℹ️ ヘルスチェックスクリプトが見つかりません: ${scriptPath}。ヘルスチェックをスキップします。`
      );
      return {
        success: true,
        servicesStatus: [],
      };
    }

    // 2. ヘルスチェックスクリプトを実行
    try {
      console.log('🔍 ヘルスチェックを実行中...');
      const output = execSync(scriptPath, {
        encoding: 'utf-8',
        timeout: 30000, // 30秒タイムアウト
      }) as string;

      // 3. スクリプト出力を解析
      const servicesStatus = this.parseHealthCheckOutput(output);

      // 4. unhealthyなサービスがある場合は失敗
      const hasUnhealthyServices = servicesStatus.some(
        (s) => s.status === 'unhealthy'
      );

      if (hasUnhealthyServices) {
        console.log('❌ ヘルスチェックが失敗しました');
        servicesStatus.forEach((s) => {
          const icon = s.status === 'healthy' ? '✅' : '❌';
          const message = s.message ? ` - ${s.message}` : '';
          console.log(`  ${icon} ${s.serviceName}: ${s.status}${message}`);
        });

        return {
          success: false,
          servicesStatus,
        };
      }

      console.log('✅ ヘルスチェックが成功しました');
      servicesStatus.forEach((s) => {
        console.log(`  ✅ ${s.serviceName}: ${s.status}`);
      });

      return {
        success: true,
        servicesStatus,
      };
    } catch (error) {
      // スクリプト実行エラー
      const execError = error as ExecError;
      console.error('❌ ヘルスチェックスクリプトの実行に失敗しました:', execError.message);

      if (execError.status !== undefined && execError.status !== 0) {
        // 終了コードが非0の場合は失敗
        const output = execError.stdout || execError.stderr || '';
        const outputStr = Buffer.isBuffer(output) ? output.toString('utf-8') : String(output);
        const servicesStatus = this.parseHealthCheckOutput(outputStr);

        return {
          success: false,
          servicesStatus,
        };
      }

      // その他のエラー（タイムアウト、パーミッションエラーなど）
      return {
        success: false,
        servicesStatus: [],
      };
    }
  }

  /**
   * ヘルスチェックスクリプトの出力を解析
   *
   * 出力形式:
   * ```
   * service-name: healthy
   * service-name: unhealthy - error message
   * ```
   *
   * @param output スクリプト出力
   * @returns サービスステータス配列
   */
  private parseHealthCheckOutput(output: string): ServiceStatus[] {
    const servicesStatus: ServiceStatus[] = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      const match = line.match(/^(\S+):\s+(healthy|unhealthy)(?:\s+-\s+(.+))?$/);
      if (!match) {
        continue; // 不正な形式の行はスキップ
      }

      const serviceName = match[1];
      const status = match[2] as 'healthy' | 'unhealthy';
      const message = match[3];

      servicesStatus.push({
        serviceName,
        status,
        message,
      });
    }

    return servicesStatus;
  }
}
