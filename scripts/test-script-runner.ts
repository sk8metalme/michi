/**
 * テストスクリプトランナー
 * Multi-Repoプロジェクトのテストスクリプトを実行
 */

import { execSync } from 'child_process';
import { join } from 'path';

/**
 * テストタイプ
 */
export type TestType = 'e2e' | 'integration' | 'performance';

/**
 * テスト実行結果
 */
export interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  executionTime: number; // 秒単位
  outputPath: string;
  error?: string;
}

/**
 * テストスクリプトランナー
 */
export class TestScriptRunner {
  /**
   * テストスクリプトを実行
   *
   * @param projectName プロジェクト名
   * @param testType テストタイプ (e2e | integration | performance)
   * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
   * @returns テスト実行結果
   */
  async runTestScript(
    projectName: string,
    testType: TestType,
    projectRoot: string = process.cwd()
  ): Promise<TestExecutionResult> {
    // 1. テストスクリプトパスを生成
    const scriptPath = join(
      projectRoot,
      'docs',
      'michi',
      projectName,
      'tests',
      'scripts',
      `run-${testType}.sh`
    );

    // 2. テスト結果の出力先パスを生成（スクリプト側で使用）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = join(
      projectRoot,
      'docs',
      'michi',
      projectName,
      'tests',
      'results',
      `${testType}-${timestamp}.log`
    );

    // 3. 実行前のログ出力
    console.log('🚀 テストスクリプトを実行中...');
    console.log(`  テストタイプ: ${testType}`);
    console.log(`  スクリプトパス: ${scriptPath}`);
    console.log(`  実行開始時刻: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);

    // 4. テストスクリプトを実行
    const startTime = Date.now();
    let exitCode = 0;
    let error: string | undefined;

    try {
      execSync(scriptPath, {
        stdio: 'inherit', // リアルタイム出力
        encoding: 'utf-8',
      });
    } catch (execError: any) {
      // スクリプト実行エラー
      exitCode = execError.status !== undefined ? execError.status : 1;
      error = execError.message;

      // stderrがある場合は追加
      if (execError.stderr) {
        const stderrStr = execError.stderr.toString();
        error = stderrStr || error;
      }
    }

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // ミリ秒から秒に変換

    // 5. 実行後のログ出力
    console.log('\n📊 テスト実行結果:');
    console.log(`  終了コード: ${exitCode}`);
    console.log(`  実行時間: ${executionTime.toFixed(2)}秒`);
    console.log(`  テスト結果ファイル: ${outputPath}`);

    const success = exitCode === 0;

    if (success) {
      console.log('✅ テスト実行が成功しました');
    } else {
      console.log('❌ テスト実行が失敗しました');
      if (error) {
        console.log(`  エラー: ${error}`);
      }
    }

    return {
      success,
      exitCode,
      executionTime,
      outputPath,
      error,
    };
  }
}
