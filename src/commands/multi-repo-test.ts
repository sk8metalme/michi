/**
 * multi-repo:test command implementation
 * Multi-Repoプロジェクトのテスト実行
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { findProject } from '../../scripts/utils/config-loader.js';
import { HealthCheckService } from '../../scripts/health-check-service.js';
import { TestScriptRunner } from '../../scripts/test-script-runner.js';

/**
 * テストタイプ
 */
export type TestType = 'e2e' | 'integration' | 'performance';

/**
 * テスト実行オプション
 */
export interface TestOptions {
  skipHealthCheck?: boolean; // ヘルスチェックをスキップ
}

/**
 * テスト実行結果
 */
export interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  executionTime: number;
  outputPath: string;
  error?: string;
}

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  success: boolean;
  servicesStatus: Array<{
    serviceName: string;
    status: 'healthy' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Multi-Repoテスト実行結果
 */
export interface MultiRepoTestResult {
  success: boolean;
  projectName: string;
  testType: TestType;
  executionResult: TestExecutionResult;
  healthCheckWarning?: string;
}

/**
 * テストタイプのバリデーション
 * @param testType テストタイプ
 * @returns 有効な場合はtrue
 */
function validateTestType(testType: string): testType is TestType {
  return ['e2e', 'integration', 'performance'].includes(testType);
}

/**
 * Multi-Repoプロジェクトのテストを実行
 *
 * @param projectName プロジェクト名
 * @param testType テストタイプ (e2e | integration | performance)
 * @param options オプション
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
 * @returns テスト実行結果
 */
export async function multiRepoTest(
  projectName: string,
  testType: string,
  options: TestOptions = {},
  projectRoot: string = process.cwd()
): Promise<MultiRepoTestResult> {
  // 1. テストタイプのバリデーション
  if (!validateTestType(testType)) {
    throw new Error(
      `無効なテストタイプです: ${testType}。指定可能なテストタイプ: e2e, integration, performance`
    );
  }

  // 2. プロジェクト存在確認
  const project = await findProject(projectName);
  if (!project) {
    throw new Error(`プロジェクト「${projectName}」が見つかりません`);
  }

  // 3. テストスクリプト存在確認
  const scriptPath = join(
    projectRoot,
    'docs',
    'michi',
    projectName,
    'tests',
    'scripts',
    `run-${testType}.sh`
  );

  if (!existsSync(scriptPath)) {
    throw new Error(
      `テストスクリプトが見つかりません: ${scriptPath}。テストスクリプトを作成してください。`
    );
  }

  // 4. ヘルスチェック実行（オプション）
  let healthCheckWarning: string | undefined;
  if (!options.skipHealthCheck) {
    const healthCheckService = new HealthCheckService();
    const healthCheckResult = await healthCheckService.runHealthCheck(
      projectName,
      projectRoot
    );

    if (!healthCheckResult.success) {
      // ヘルスチェック失敗時は警告を表示
      const failedServices = healthCheckResult.servicesStatus
        .filter((s) => s.status === 'unhealthy')
        .map((s) => `${s.serviceName}: ${s.message || 'N/A'}`)
        .join(', ');

      healthCheckWarning = `ヘルスチェックが失敗しました: ${failedServices}`;
      console.warn(`⚠️ ${healthCheckWarning}`);
      console.warn('テスト実行を継続しますが、結果が不安定になる可能性があります。');
    }
  }

  // 5. テストスクリプト実行
  const testScriptRunner = new TestScriptRunner();
  const executionResult = await testScriptRunner.runTestScript(
    projectName,
    testType,
    projectRoot
  );

  // 6. 結果を返す
  return {
    success: executionResult.success,
    projectName,
    testType,
    executionResult,
    healthCheckWarning,
  };
}
