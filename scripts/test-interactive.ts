/**
 * 対話式テスト設定ツール
 * Phase Bテスト（手動回帰、負荷、セキュリティ）を対話的に作成
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// テンプレートディレクトリ
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'testing');

/**
 * テストタイプの定義
 */
type TestType = 'manual-regression' | 'load-test' | 'security-test';

interface TestTypeConfig {
  value: TestType;
  label: string;
  description: string;
  templateFile: string;
}

const TEST_TYPES: TestTypeConfig[] = [
  {
    value: 'manual-regression',
    label: '手動回帰テスト',
    description: 'APIエンドポイントのcurlベース手動テスト',
    templateFile: 'manual-regression-template.md'
  },
  {
    value: 'load-test',
    label: '負荷テスト（Locust）',
    description: 'Locustを使用した負荷テスト',
    templateFile: 'load-test-template.md'
  },
  {
    value: 'security-test',
    label: 'セキュリティテスト（OWASP ZAP）',
    description: 'OWASP ZAPを使用したセキュリティテスト',
    templateFile: 'security-test-template.md'
  }
];

/**
 * 共通パラメータ
 */
interface CommonParams {
  projectName: string;
  projectRoot: string;
  baseUrl: string;
  endpoint: string;
  method: string;
}

/**
 * 手動回帰テスト用パラメータ
 */
interface ManualRegressionParams extends CommonParams {
  bodyFormat: string;
  successStatus: string;
  errorStatus: string;
  responseFormat: string;
  sampleRequest: string;
  sampleResponse: string;
  startCommand: string;
  port: string;
  logCommand: string;
  targetResponseTime: string;
}

/**
 * 負荷テスト用パラメータ
 */
interface LoadTestParams extends CommonParams {
  totalUsers: string;
  spawnRate: string;
  runTime: string;
  targetRps: string;
  targetResponseTime: string;
  maxErrorRate: string;
  maxP95: string;
  maxP99: string;
}

/**
 * セキュリティテスト用パラメータ
 */
interface SecurityTestParams extends CommonParams {
  authType: string;
  authHeader: string;
  excludePaths: string;
  scanPolicy: string;
  maxAlerts: string;
}

/**
 * readlineインターフェースを作成
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 質問を表示して回答を取得
 */
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * 選択肢を表示
 */
async function select<T extends { value: string; label: string }>(
  rl: readline.Interface,
  prompt: string,
  choices: T[],
  defaultIndex: number = 0
): Promise<T> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const marker = index === defaultIndex ? '*' : ' ';
    console.log(`  ${marker} ${index + 1}. ${choice.label}`);
  });

  const answer = await question(rl, `選択 [${defaultIndex + 1}]: `);
  const selectedIndex = answer ? parseInt(answer, 10) - 1 : defaultIndex;

  if (selectedIndex >= 0 && selectedIndex < choices.length) {
    return choices[selectedIndex];
  }
  return choices[defaultIndex];
}

/**
 * 共通パラメータの収集
 */
async function collectCommonParams(rl: readline.Interface): Promise<CommonParams> {
  console.log('\n📋 基本設定');
  console.log('='.repeat(50));

  const projectName = await question(rl, 'プロジェクト名: ') || 'My Project';
  const projectRoot = await question(rl, 'プロジェクトルート [.]: ') || '.';
  const baseUrl = await question(rl, 'ベースURL [http://localhost:8080]: ') || 'http://localhost:8080';
  const endpoint = await question(rl, 'テスト対象エンドポイント [/api/health]: ') || '/api/health';

  const methodChoices = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
  ];
  const methodChoice = await select(rl, 'HTTPメソッド:', methodChoices, 0);

  return {
    projectName,
    projectRoot,
    baseUrl,
    endpoint,
    method: methodChoice.value
  };
}

/**
 * 手動回帰テストパラメータの収集
 */
async function collectManualRegressionParams(
  rl: readline.Interface,
  common: CommonParams
): Promise<ManualRegressionParams> {
  console.log('\n🧪 手動回帰テスト設定');
  console.log('='.repeat(50));

  const bodyFormat = await question(rl, 'リクエストボディ形式 [JSON]: ') || 'JSON';
  const successStatus = await question(rl, '期待HTTPステータス（成功時） [200]: ') || '200';
  const errorStatus = await question(rl, '期待HTTPステータス（エラー時） [400]: ') || '400';
  const responseFormat = await question(rl, '期待レスポンス形式 [{"status": "ok"}]: ') || '{"status": "ok"}';
  const sampleRequest = await question(rl, 'サンプルリクエスト [{}]: ') || '{}';
  const sampleResponse = await question(rl, 'サンプルレスポンス [{"status": "ok"}]: ') || '{"status": "ok"}';
  const startCommand = await question(rl, 'アプリ起動コマンド [./gradlew bootRun]: ') || './gradlew bootRun';
  const port = await question(rl, 'ポート番号 [8080]: ') || '8080';
  const logCommand = await question(rl, 'ログ確認コマンド [tail -f logs/app.log]: ') || 'tail -f logs/app.log';
  const targetResponseTime = await question(rl, '目標応答時間(ms) [500]: ') || '500';

  return {
    ...common,
    bodyFormat,
    successStatus,
    errorStatus,
    responseFormat,
    sampleRequest,
    sampleResponse,
    startCommand,
    port,
    logCommand,
    targetResponseTime
  };
}

/**
 * 負荷テストパラメータの収集
 */
async function collectLoadTestParams(
  rl: readline.Interface,
  common: CommonParams
): Promise<LoadTestParams> {
  console.log('\n⚡ 負荷テスト設定');
  console.log('='.repeat(50));

  const totalUsers = await question(rl, '同時接続ユーザー数 [100]: ') || '100';
  const spawnRate = await question(rl, 'ユーザー増加率（/秒） [10]: ') || '10';
  const runTime = await question(rl, 'テスト実行時間 [5m]: ') || '5m';
  const targetRps = await question(rl, '目標RPS [100]: ') || '100';
  const targetResponseTime = await question(rl, '目標応答時間(ms) [500]: ') || '500';
  const maxErrorRate = await question(rl, '許容エラー率(%) [1]: ') || '1';
  const maxP95 = await question(rl, 'P95応答時間上限(ms) [1000]: ') || '1000';
  const maxP99 = await question(rl, 'P99応答時間上限(ms) [2000]: ') || '2000';

  return {
    ...common,
    totalUsers,
    spawnRate,
    runTime,
    targetRps,
    targetResponseTime,
    maxErrorRate,
    maxP95,
    maxP99
  };
}

/**
 * セキュリティテストパラメータの収集
 */
async function collectSecurityTestParams(
  rl: readline.Interface,
  common: CommonParams
): Promise<SecurityTestParams> {
  console.log('\n🔐 セキュリティテスト設定');
  console.log('='.repeat(50));

  const authTypeChoices = [
    { value: 'none', label: '認証なし' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'api-key', label: 'API Key' }
  ];
  const authTypeChoice = await select(rl, '認証タイプ:', authTypeChoices, 0);

  let authHeader = '';
  if (authTypeChoice.value !== 'none') {
    authHeader = await question(rl, '認証ヘッダー値: ') || '';
  }

  const excludePaths = await question(rl, '除外パス（カンマ区切り） [/health,/metrics]: ') || '/health,/metrics';

  const scanPolicyChoices = [
    { value: 'Default Policy', label: 'Default Policy（推奨）' },
    { value: 'API-Minimal', label: 'API-Minimal（軽量）' },
    { value: 'Full-Scan', label: 'Full-Scan（詳細）' }
  ];
  const scanPolicyChoice = await select(rl, 'スキャンポリシー:', scanPolicyChoices, 0);

  const maxAlerts = await question(rl, '許容アラート数 [0]: ') || '0';

  return {
    ...common,
    authType: authTypeChoice.value,
    authHeader,
    excludePaths,
    scanPolicy: scanPolicyChoice.value,
    maxAlerts
  };
}

/**
 * テンプレートを読み込んでパラメータを置換
 */
function processTemplate(templateFile: string, params: Record<string, string>): string {
  const templatePath = join(TEMPLATES_DIR, templateFile);

  let content: string;

  if (!existsSync(templatePath)) {
    console.warn(`⚠️  テンプレートが見つかりません: ${templatePath}`);
    console.warn('   デフォルトのテンプレートを使用します');

    // デフォルトテンプレート（基本的なMarkdown構造）
    content = `# テスト計画書

## プロジェクト情報
- プロジェクト名: {{PROJECT_NAME}}
- プロジェクトルート: {{PROJECT_ROOT}}

## テスト対象
- ベースURL: {{BASE_URL}}
- エンドポイント: {{ENDPOINT}}

## テスト手順
1. テスト環境の準備
2. テストケースの実行
3. 結果の記録

## 注意事項
- このファイルは自動生成されたデフォルトテンプレートです
- 必要に応じて内容を編集してください
`;
  } else {
    content = readFileSync(templatePath, 'utf-8');
  }

  // パラメータを置換
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key.toUpperCase()}}}`;
    content = content.split(placeholder).join(value);
  }

  return content;
}

/**
 * 安全なPythonクラス名を生成
 * - 非英数字を削除
 * - 空の場合は "Project" をフォールバック
 * - 数字で始まる場合は "P" を前置
 * - 最後に "User" を追加
 */
function generateSafePythonClassName(projectName: string): string {
  // 非英数字を削除
  let safeName = projectName.replace(/[^a-zA-Z0-9]/g, '');

  // 空の場合はフォールバック
  if (safeName === '') {
    safeName = 'Project';
  }

  // 数字で始まる場合は "P" を前置
  if (/^[0-9]/.test(safeName)) {
    safeName = 'P' + safeName;
  }

  // "User" を追加してクラス名を完成
  return safeName + 'User';
}

/**
 * 手動回帰テストの出力ファイルを生成
 */
function generateManualRegressionFiles(params: ManualRegressionParams, outputDir: string): string[] {
  const files: string[] = [];

  // テンプレートパラメータを構築
  const templateParams: Record<string, string> = {
    project_name: params.projectName,
    project_root: params.projectRoot,
    base_url: params.baseUrl,
    endpoint: params.endpoint,
    method: params.method,
    body_format: params.bodyFormat,
    success_status: params.successStatus,
    error_status: params.errorStatus,
    response_format: params.responseFormat,
    sample_request: params.sampleRequest,
    sample_response: params.sampleResponse,
    start_command: params.startCommand,
    port: params.port,
    log_command: params.logCommand,
    target_response_time: params.targetResponseTime,
    // テストケース用のプレースホルダー（デフォルト値）
    normal_test_1_name: '基本リクエスト成功',
    normal_test_1_request: params.sampleRequest,
    normal_test_1_status: params.successStatus,
    normal_test_1_response: params.sampleResponse,
    normal_test_2_name: '別のリクエストパターン',
    normal_test_2_request: params.sampleRequest,
    normal_test_2_status: params.successStatus,
    normal_test_2_response: params.sampleResponse,
    error_test_1_name: '不正なリクエスト',
    error_test_1_request: '{"invalid": true}',
    error_test_1_status: params.errorStatus,
    error_test_1_response: '{"error": "Bad Request"}',
    error_test_2_name: '空のリクエスト',
    error_test_2_request: '{}',
    error_test_2_status: params.errorStatus,
    sql_injection_request: '{"input": "\' OR 1=1 --"}',
    xss_request: '{"input": "<script>alert(1)</script>"}',
    repeat_char: 'A',
    repeat_count: '10000',
    input_field: 'input'
  };

  const content = processTemplate('manual-regression-template.md', templateParams);
  const outputFile = join(outputDir, 'manual-regression-test.md');
  writeFileSync(outputFile, content, 'utf-8');
  files.push(outputFile);

  return files;
}

/**
 * 負荷テストの出力ファイルを生成
 */
function generateLoadTestFiles(params: LoadTestParams, outputDir: string): string[] {
  const files: string[] = [];

  // テンプレートパラメータを構築
  const templateParams: Record<string, string> = {
    project_name: params.projectName,
    base_url: params.baseUrl,
    endpoint: params.endpoint,
    method: params.method,
    total_users: params.totalUsers,
    spawn_rate: params.spawnRate,
    run_time: params.runTime,
    target_rps: params.targetRps,
    target_response_time: params.targetResponseTime,
    max_error_rate: params.maxErrorRate,
    max_p95: params.maxP95,
    max_p99: params.maxP99,
    request_body: '{}'
  };

  const content = processTemplate('load-test-template.md', templateParams);
  const outputFile = join(outputDir, 'load-test-plan.md');
  writeFileSync(outputFile, content, 'utf-8');
  files.push(outputFile);

  // locustfile.pyも生成
  const locustContent = generateLocustFile(params);
  const locustFile = join(outputDir, 'locustfile.py');
  writeFileSync(locustFile, locustContent, 'utf-8');
  files.push(locustFile);

  return files;
}

/**
 * Locustファイルを生成
 */
function generateLocustFile(params: LoadTestParams): string {
  const methodLower = params.method.toLowerCase();
  const hasBody = ['post', 'put', 'patch'].includes(methodLower);

  // 安全なPythonクラス名を生成
  const className = generateSafePythonClassName(params.projectName);

  let taskCode = '';
  if (hasBody) {
    taskCode = `        self.client.${methodLower}(
            "${params.endpoint}",
            json={},
            headers={"Content-Type": "application/json"}
        )`;
  } else {
    taskCode = `        self.client.${methodLower}("${params.endpoint}")`;
  }

  return `"""
${params.projectName} 負荷テスト
自動生成: michi test-interactive
"""

from locust import HttpUser, task, between


class ${className}(HttpUser):
    """テスト対象ユーザーシミュレーション"""

    wait_time = between(1, 3)
    host = "${params.baseUrl}"

    @task
    def test_endpoint(self):
        """${params.endpoint}への${params.method}リクエスト"""
${taskCode}


# 実行方法:
# locust -f locustfile.py --users ${params.totalUsers} --spawn-rate ${params.spawnRate} --run-time ${params.runTime}
`;
}

/**
 * セキュリティテストの出力ファイルを生成
 */
function generateSecurityTestFiles(params: SecurityTestParams, outputDir: string): string[] {
  const files: string[] = [];

  // テンプレートパラメータを構築
  const templateParams: Record<string, string> = {
    project_name: params.projectName,
    base_url: params.baseUrl,
    endpoint: params.endpoint,
    method: params.method,
    auth_type: params.authType,
    auth_header: params.authHeader,
    exclude_paths: params.excludePaths,
    scan_policy: params.scanPolicy,
    max_alerts: params.maxAlerts
  };

  const content = processTemplate('security-test-template.md', templateParams);
  const outputFile = join(outputDir, 'security-test-plan.md');
  writeFileSync(outputFile, content, 'utf-8');
  files.push(outputFile);

  // ZAP設定ファイルも生成
  const zapConfig = generateZapConfig(params);
  const zapConfigFile = join(outputDir, 'zap-config.yaml');
  writeFileSync(zapConfigFile, zapConfig, 'utf-8');
  files.push(zapConfigFile);

  // 実行スクリプトも生成
  const zapScript = generateZapScript(params);
  const zapScriptFile = join(outputDir, 'run-zap-scan.sh');
  writeFileSync(zapScriptFile, zapScript, 'utf-8');
  files.push(zapScriptFile);

  return files;
}

/**
 * ZAP設定ファイルを生成
 */
function generateZapConfig(params: SecurityTestParams): string {
  // excludePathsのリスト項目は8スペースでインデント（excludePathsの子要素）
  const excludeList = params.excludePaths.split(',').map(p => `        - "${p.trim()}.*"`).join('\n');

  let authConfig = '';
  if (params.authType !== 'none' && params.authHeader) {
    // authenticationブロックは6スペースでインデント（contextの子要素）
    authConfig = `
      authentication:
        method: "script"
        parameters:
          authHeader: "${params.authHeader}"`;
  }

  return `# OWASP ZAP設定
# 自動生成: michi test-interactive

env:
  contexts:
    - name: "${params.projectName}"
      urls:
        - "${params.baseUrl}"
      excludePaths:
${excludeList}${authConfig}

jobs:
  - type: spider
    parameters:
      context: "${params.projectName}"
      maxDuration: 5
      maxDepth: 5

  - type: activeScan
    parameters:
      context: "${params.projectName}"
      policy: "${params.scanPolicy}"
      maxRuleDurationInMins: 5
      maxScanDurationInMins: 30

  - type: report
    parameters:
      template: "traditional-json"
      reportDir: "./reports"
      reportFile: "zap-report"
  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "./reports"
      reportFile: "zap-report-html"
`;
}

/**
 * ZAP実行スクリプトを生成
 */
function generateZapScript(params: SecurityTestParams): string {
  return `#!/bin/bash
# OWASP ZAPセキュリティスキャン実行スクリプト
# 自動生成: michi test-interactive

set -e

# 変数定義
TARGET_URL="${params.baseUrl}"
CONFIG_FILE="zap-config.yaml"
REPORT_DIR="./reports"

# レポートディレクトリ作成
mkdir -p "\${REPORT_DIR}"

echo "🔐 OWASP ZAPセキュリティスキャン開始"
echo "対象: \${TARGET_URL}"
echo "設定: \${CONFIG_FILE}"

# Docker経由でZAPを実行
docker run --rm -v "$(pwd):/zap/wrk:rw" \\
  -t ghcr.io/zaproxy/zaproxy:stable \\
  zap.sh -cmd \\
  -autorun /zap/wrk/\${CONFIG_FILE}

echo "✅ スキャン完了"
echo "レポート: \${REPORT_DIR}/zap-report.json"
echo "HTML版: \${REPORT_DIR}/zap-report-html.html"

# アラート数チェック（JSON + jq使用）
JSON_REPORT="\${REPORT_DIR}/zap-report.json"
MAX_ALERTS=${params.maxAlerts}

if [ ! -f "\${JSON_REPORT}" ]; then
  echo "⚠️  JSONレポートが見つかりません: \${JSON_REPORT}"
  ALERT_COUNT=0
elif ! command -v jq &> /dev/null; then
  echo "⚠️  jqコマンドが見つかりません。アラート数を0として処理します"
  echo "   jqをインストールしてください: brew install jq"
  ALERT_COUNT=0
else
  # ZAP JSONレポートから全アラートをカウント
  ALERT_COUNT=$(jq '[.. | .alerts? | select(. != null) | .[]] | length' "\${JSON_REPORT}" 2>/dev/null || echo "0")

  # 数値でない場合は0にフォールバック
  if ! [[ "\${ALERT_COUNT}" =~ ^[0-9]+$ ]]; then
    echo "⚠️  アラート数の解析に失敗しました。0として処理します"
    ALERT_COUNT=0
  fi
fi

if [ "\${ALERT_COUNT}" -gt "\${MAX_ALERTS}" ]; then
  echo "❌ アラート数が閾値を超えています: \${ALERT_COUNT} > \${MAX_ALERTS}"
  exit 1
else
  echo "✅ アラート数: \${ALERT_COUNT} (許容: \${MAX_ALERTS})"
fi
`;
}

/**
 * メイン処理
 */
async function main(): Promise<number> {
  const rl = createInterface();

  try {
    console.log('🧪 Michi テスト設定ツール');
    console.log('='.repeat(60));
    console.log('Phase Bテスト（手動回帰、負荷、セキュリティ）を対話的に作成します。\n');

    // テストタイプを選択
    console.log('テストタイプを選択してください:');
    TEST_TYPES.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.label}`);
      console.log(`     ${t.description}`);
    });

    const typeAnswer = await question(rl, '\n選択 [1]: ');
    const typeIndex = typeAnswer ? parseInt(typeAnswer, 10) - 1 : 0;
    const selectedType = TEST_TYPES[typeIndex >= 0 && typeIndex < TEST_TYPES.length ? typeIndex : 0];

    console.log(`\n選択: ${selectedType.label}`);

    // 共通パラメータを収集
    const commonParams = await collectCommonParams(rl);

    // 出力ディレクトリを決定
    const defaultOutputDir = join(process.cwd(), 'tests', selectedType.value);
    const outputDir = await question(rl, `\n出力ディレクトリ [${defaultOutputDir}]: `) || defaultOutputDir;

    // ディレクトリ作成
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    let generatedFiles: string[] = [];

    // テストタイプ別のパラメータ収集と生成
    switch (selectedType.value) {
    case 'manual-regression': {
      const params = await collectManualRegressionParams(rl, commonParams);
      generatedFiles = generateManualRegressionFiles(params, outputDir);
      break;
    }
    case 'load-test': {
      const params = await collectLoadTestParams(rl, commonParams);
      generatedFiles = generateLoadTestFiles(params, outputDir);
      break;
    }
    case 'security-test': {
      const params = await collectSecurityTestParams(rl, commonParams);
      generatedFiles = generateSecurityTestFiles(params, outputDir);
      break;
    }
    }

    // 結果表示
    console.log('\n✅ テストファイルを生成しました:');
    console.log('='.repeat(50));
    generatedFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });

    // 次のステップを案内
    console.log('\n📋 次のステップ:');
    switch (selectedType.value) {
    case 'manual-regression':
      console.log('  1. 生成されたMarkdownファイルを確認・編集');
      console.log('  2. アプリケーションを起動');
      console.log('  3. curlコマンドを実行してテスト');
      break;
    case 'load-test':
      console.log('  1. pip install locust');
      console.log(`  2. cd ${outputDir}`);
      console.log('  3. locust -f locustfile.py --web-host localhost');
      console.log('  4. http://localhost:8089 でテスト開始');
      break;
    case 'security-test':
      console.log('  1. Docker Desktop を起動');
      console.log(`  2. cd ${outputDir}`);
      console.log('  3. chmod +x run-zap-scan.sh');
      console.log('  4. ./run-zap-scan.sh');
      break;
    }

    console.log('\n🎉 設定が完了しました！');
    return 0;

  } catch (error) {
    console.error('❌ エラーが発生しました:', error instanceof Error ? error.message : error);
    return 1;
  } finally {
    rl.close();
  }
}

// CLI実行
main()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });

export { main as testInteractive };
