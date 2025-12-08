/**
 * テスト実行ユーティリティ
 * プロジェクトの言語に応じてテストを実行し、レポートを生成
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * テスト実行結果
 */
export interface TestResult {
  success: boolean;
  language: string;
  command: string;
  output: string;
  error?: string;
  duration: number;
  timestamp: string;
}

/**
 * テストを実行
 * @param language プロジェクトの言語
 * @param projectRoot プロジェクトルートディレクトリ
 * @returns テスト実行結果
 */
export async function executeTests(
  language: string,
  projectRoot: string = process.cwd()
): Promise<TestResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 言語に応じてテストコマンドを決定
  const command = getTestCommand(language);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      env: { ...process.env, CI: 'true' }
    });

    const duration = (Date.now() - startTime) / 1000;

    return {
      success: true,
      language,
      command,
      output: stdout + stderr,
      duration,
      timestamp
    };
  } catch (error: unknown) {
    const duration = (Date.now() - startTime) / 1000;

    return {
      success: false,
      language,
      command,
      output: error.stdout || '',
      error: error.message || String(error),
      duration,
      timestamp
    };
  }
}

/**
 * 言語に応じたテストコマンドを取得
 */
function getTestCommand(language: string): string {
  switch (language) {
  case 'Node.js/TypeScript':
    return 'npm test';
  case 'Java':
    return 'gradle test';
  case 'PHP':
    return 'composer test';
  case 'Python':
    return 'pytest';
  case 'Go':
    return 'go test ./...';
  case 'Rust':
    return 'cargo test';
  default:
    throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * テスト結果からMarkdownレポートを生成
 * @param result テスト実行結果
 * @param featureName 機能名
 * @returns Markdownレポート
 */
export function generateTestReport(
  result: TestResult,
  featureName: string
): string {
  const status = result.success ? '✅ 成功' : '❌ 失敗';

  let report = `# テスト実行レポート: ${featureName}\n\n`;
  report += '## 実行結果\n\n';
  report += `- **ステータス**: ${status}\n`;
  report += `- **言語**: ${result.language}\n`;
  report += `- **コマンド**: \`${result.command}\`\n`;
  report += `- **実行時間**: ${result.duration.toFixed(2)}秒\n`;
  report += `- **タイムスタンプ**: ${result.timestamp}\n\n`;

  if (result.success) {
    report += '## テスト出力\n\n';
    report += '```\n';
    report += result.output;
    report += '\n```\n\n';
  } else {
    report += '## エラー情報\n\n';
    report += '```\n';
    report += result.error || 'Unknown error';
    report += '\n```\n\n';

    if (result.output) {
      report += '## テスト出力\n\n';
      report += '```\n';
      report += result.output;
      report += '\n```\n\n';
    }
  }

  return report;
}
