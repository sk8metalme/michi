/**
 * テスト実行ファイル生成エンジン
 * Phase Bで選択されたテストタイプに基づいて実行ファイルを生成
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';

/**
 * テスト実行ファイルの生成オプション
 */
export interface TestExecutionOptions {
  feature: string;
  testType: string;
  projectRoot?: string;
  baseUrl?: string;
  endpoint?: string;
  method?: string;
  language?: string;
}

/**
 * 生成結果
 */
export interface GenerationResult {
  testType: string;
  files: string[];
  success: boolean;
  error?: string;
}

/**
 * design.mdからエンドポイント情報を抽出
 */
function extractEndpointsFromDesign(designPath: string): { endpoint: string; method: string; baseUrl: string }[] {
  if (!existsSync(designPath)) {
    return [{ endpoint: '/api/health', method: 'GET', baseUrl: 'http://localhost:8080' }];
  }

  const content = readFileSync(designPath, 'utf-8');
  const endpoints: { endpoint: string; method: string; baseUrl: string }[] = [];

  // APIエンドポイントのパターンを検索
  const apiPattern = /(?:GET|POST|PUT|DELETE|PATCH)\s+([\w\-/{}]+)/gi;
  let match;

  while ((match = apiPattern.exec(content)) !== null) {
    const method = match[0].split(/\s+/)[0].toUpperCase();
    const endpoint = match[1];
    endpoints.push({
      endpoint,
      method,
      baseUrl: 'http://localhost:8080'
    });
  }

  // デフォルト値
  if (endpoints.length === 0) {
    endpoints.push({ endpoint: '/api/health', method: 'GET', baseUrl: 'http://localhost:8080' });
  }

  return endpoints;
}

/**
 * requirements.mdからパフォーマンス要件を抽出
 */
function extractPerformanceRequirements(requirementsPath: string): {
  targetRps: string;
  targetResponseTime: string;
  maxErrorRate: string;
} {
  const defaults = {
    targetRps: '100',
    targetResponseTime: '500',
    maxErrorRate: '1'
  };

  if (!existsSync(requirementsPath)) {
    return defaults;
  }

  const content = readFileSync(requirementsPath, 'utf-8');

  // レスポンスタイム要件を検索
  const responseTimeMatch = content.match(/(\d+)\s*(?:ms|ミリ秒)以内/);
  if (responseTimeMatch) {
    defaults.targetResponseTime = responseTimeMatch[1];
  }

  // RPS要件を検索
  const rpsMatch = content.match(/(\d+)\s*(?:RPS|リクエスト\/秒|req\/s)/i);
  if (rpsMatch) {
    defaults.targetRps = rpsMatch[1];
  }

  return defaults;
}

/**
 * 負荷テスト（Locust）実行ファイルを生成
 */
export async function generateLoadTestExecution(
  options: TestExecutionOptions
): Promise<GenerationResult> {
  const { feature, projectRoot = process.cwd() } = options;
  const files: string[] = [];

  try {
    const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
    const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
    const outputDir = join(projectRoot, '.kiro', 'specs', feature, 'test-execution', 'performance');

    mkdirSync(outputDir, { recursive: true });

    // 設計書からエンドポイント情報を抽出
    const endpoints = extractEndpointsFromDesign(designPath);
    const mainEndpoint = endpoints[0];

    // 要件からパフォーマンス要件を抽出
    const perfReqs = extractPerformanceRequirements(requirementsPath);

    // locustfile.py を生成
    const locustContent = generateLocustFile(feature, mainEndpoint, perfReqs);
    const locustPath = join(outputDir, 'locustfile.py');
    writeFileSync(locustPath, locustContent, 'utf-8');
    files.push(locustPath);

    // 負荷テスト計画書を生成
    const planContent = generateLoadTestPlan(feature, mainEndpoint, perfReqs);
    const planPath = join(outputDir, 'load-test-plan.md');
    writeFileSync(planPath, planContent, 'utf-8');
    files.push(planPath);

    return { testType: 'performance', files, success: true };
  } catch (error) {
    return {
      testType: 'performance',
      files,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Locustファイルを生成
 */
function generateLocustFile(
  feature: string,
  endpoint: { endpoint: string; method: string; baseUrl: string },
  perfReqs: { targetRps: string; targetResponseTime: string }
): string {
  const methodLower = endpoint.method.toLowerCase();
  const hasBody = ['post', 'put', 'patch'].includes(methodLower);
  const className = feature.replace(/[^a-zA-Z0-9]/g, '');

  let taskCode = '';
  if (hasBody) {
    taskCode = `        self.client.${methodLower}(
            "${endpoint.endpoint}",
            json={},
            headers={"Content-Type": "application/json"}
        )`;
  } else {
    taskCode = `        self.client.${methodLower}("${endpoint.endpoint}")`;
  }

  return `"""
${feature} 負荷テスト
自動生成: michi phase:run ${feature} phase-b

目標:
- RPS: ${perfReqs.targetRps}
- 応答時間: ${perfReqs.targetResponseTime}ms以内
"""

from locust import HttpUser, task, between


class ${className}User(HttpUser):
    """テスト対象ユーザーシミュレーション"""

    wait_time = between(1, 3)
    host = "${endpoint.baseUrl}"

    @task
    def test_endpoint(self):
        """${endpoint.endpoint}への${endpoint.method}リクエスト"""
${taskCode}


# 実行方法:
# locust -f locustfile.py --users 100 --spawn-rate 10 --run-time 5m
#
# Web UI: http://localhost:8089
`;
}

/**
 * 負荷テスト計画書を生成
 */
function generateLoadTestPlan(
  feature: string,
  endpoint: { endpoint: string; method: string; baseUrl: string },
  perfReqs: { targetRps: string; targetResponseTime: string; maxErrorRate: string }
): string {
  return `# ${feature} 負荷テスト計画

## 概要

- **対象**: ${endpoint.endpoint}
- **HTTPメソッド**: ${endpoint.method}
- **ベースURL**: ${endpoint.baseUrl}
- **生成日**: ${new Date().toISOString().split('T')[0]}

## 成功基準

| 指標 | 目標値 |
|------|--------|
| RPS | ${perfReqs.targetRps} |
| 平均応答時間 | ${perfReqs.targetResponseTime}ms以内 |
| P95応答時間 | ${parseInt(perfReqs.targetResponseTime) * 2}ms以内 |
| P99応答時間 | ${parseInt(perfReqs.targetResponseTime) * 4}ms以内 |
| エラー率 | ${perfReqs.maxErrorRate}%以下 |

## 実行手順

### 1. 環境準備

\`\`\`bash
# Locustインストール
pip install locust

# テスト対象アプリケーションを起動
# （別ターミナルで実行）
\`\`\`

### 2. 負荷テスト実行

\`\`\`bash
# このディレクトリに移動
cd .kiro/specs/${feature}/test-execution/performance

# Locust起動（Web UI）
locust -f locustfile.py

# またはヘッドレス実行
locust -f locustfile.py --headless \\
  --users 100 \\
  --spawn-rate 10 \\
  --run-time 5m \\
  --html report.html
\`\`\`

### 3. 結果確認

- **Web UI**: http://localhost:8089
- **HTMLレポート**: report.html

## テスト結果

| 項目 | 結果 | 判定 |
|------|------|------|
| 平均応答時間 | ___ms | [ ] Pass / [ ] Fail |
| P95応答時間 | ___ms | [ ] Pass / [ ] Fail |
| P99応答時間 | ___ms | [ ] Pass / [ ] Fail |
| エラー率 | __% | [ ] Pass / [ ] Fail |

## 備考

`;
}

/**
 * セキュリティテスト（OWASP ZAP）実行ファイルを生成
 */
export async function generateSecurityTestExecution(
  options: TestExecutionOptions
): Promise<GenerationResult> {
  const { feature, projectRoot = process.cwd() } = options;
  const files: string[] = [];

  try {
    const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
    const outputDir = join(projectRoot, '.kiro', 'specs', feature, 'test-execution', 'security');

    mkdirSync(outputDir, { recursive: true });

    // 設計書からエンドポイント情報を抽出
    const endpoints = extractEndpointsFromDesign(designPath);
    const mainEndpoint = endpoints[0];

    // zap-config.yaml を生成
    const zapConfigContent = generateZapConfig(feature, mainEndpoint);
    const zapConfigPath = join(outputDir, 'zap-config.yaml');
    writeFileSync(zapConfigPath, zapConfigContent, 'utf-8');
    files.push(zapConfigPath);

    // run-zap-scan.sh を生成
    const zapScriptContent = generateZapScript(feature, mainEndpoint);
    const zapScriptPath = join(outputDir, 'run-zap-scan.sh');
    writeFileSync(zapScriptPath, zapScriptContent, 'utf-8');
    chmodSync(zapScriptPath, '755');
    files.push(zapScriptPath);

    // セキュリティテスト計画書を生成
    const planContent = generateSecurityTestPlan(feature, mainEndpoint);
    const planPath = join(outputDir, 'security-test-plan.md');
    writeFileSync(planPath, planContent, 'utf-8');
    files.push(planPath);

    return { testType: 'security', files, success: true };
  } catch (error) {
    return {
      testType: 'security',
      files,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * ZAP設定ファイルを生成
 */
function generateZapConfig(
  feature: string,
  endpoint: { endpoint: string; baseUrl: string }
): string {
  return `# OWASP ZAP設定
# 自動生成: michi phase:run ${feature} phase-b

env:
  contexts:
    - name: "${feature}"
      urls:
        - "${endpoint.baseUrl}"
      excludePaths:
        - "/health.*"
        - "/metrics.*"

jobs:
  - type: spider
    parameters:
      context: "${feature}"
      maxDuration: 5
      maxDepth: 5

  - type: activeScan
    parameters:
      context: "${feature}"
      policy: "Default Policy"
      maxRuleDurationInMins: 5
      maxScanDurationInMins: 30

  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "./reports"
      reportFile: "zap-report"
`;
}

/**
 * ZAP実行スクリプトを生成
 */
function generateZapScript(
  feature: string,
  endpoint: { baseUrl: string }
): string {
  return `#!/bin/bash
# OWASP ZAPセキュリティスキャン実行スクリプト
# 自動生成: michi phase:run ${feature} phase-b

set -e

# 変数定義
TARGET_URL="${endpoint.baseUrl}"
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
echo "レポート: \${REPORT_DIR}/zap-report.html"
`;
}

/**
 * セキュリティテスト計画書を生成
 */
function generateSecurityTestPlan(
  feature: string,
  endpoint: { endpoint: string; baseUrl: string }
): string {
  return `# ${feature} セキュリティテスト計画

## 概要

- **対象**: ${endpoint.baseUrl}
- **ツール**: OWASP ZAP
- **生成日**: ${new Date().toISOString().split('T')[0]}

## 検出対象の脆弱性

- SQLインジェクション
- XSS（クロスサイトスクリプティング）
- CSRF（クロスサイトリクエストフォージェリ）
- 認証・認可の問題
- セキュリティヘッダーの不備

## 実行手順

### 1. 環境準備

\`\`\`bash
# Docker Desktopを起動

# テスト対象アプリケーションを起動
# （別ターミナルで実行）
\`\`\`

### 2. セキュリティスキャン実行

\`\`\`bash
# このディレクトリに移動
cd .kiro/specs/${feature}/test-execution/security

# スキャン実行
./run-zap-scan.sh
\`\`\`

### 3. 結果確認

- **HTMLレポート**: reports/zap-report.html

## テスト結果

| 重要度 | 検出数 | 対応状況 |
|--------|--------|----------|
| High | ___ | [ ] 対応済み |
| Medium | ___ | [ ] 対応済み |
| Low | ___ | [ ] 対応済み |
| Informational | ___ | - |

## 備考

`;
}

/**
 * 手動回帰テスト実行ファイルを生成
 */
export async function generateManualRegressionExecution(
  options: TestExecutionOptions
): Promise<GenerationResult> {
  const { feature, projectRoot = process.cwd() } = options;
  const files: string[] = [];

  try {
    const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
    const outputDir = join(projectRoot, '.kiro', 'specs', feature, 'test-execution', 'manual-regression');

    mkdirSync(outputDir, { recursive: true });

    // 設計書からエンドポイント情報を抽出
    const endpoints = extractEndpointsFromDesign(designPath);

    // 手動回帰テストガイドを生成
    const guideContent = generateManualRegressionGuide(feature, endpoints);
    const guidePath = join(outputDir, 'manual-regression-guide.md');
    writeFileSync(guidePath, guideContent, 'utf-8');
    files.push(guidePath);

    return { testType: 'manual-regression', files, success: true };
  } catch (error) {
    return {
      testType: 'manual-regression',
      files,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 手動回帰テストガイドを生成
 */
function generateManualRegressionGuide(
  feature: string,
  endpoints: { endpoint: string; method: string; baseUrl: string }[]
): string {
  let testCases = '';
  let tcCounter = 1;

  for (const ep of endpoints) {
    testCases += `
### TC-${String(tcCounter++).padStart(3, '0')}: ${ep.method} ${ep.endpoint}

\`\`\`bash
curl -X ${ep.method} ${ep.baseUrl}${ep.endpoint} \\
  -H "Content-Type: application/json"
\`\`\`

| 項目 | 値 |
|------|-----|
| 期待ステータス | 200 |
| 確認 | [ ] Pass / [ ] Fail |

`;
  }

  return `# ${feature} 手動回帰テストガイド

## 概要

- **対象**: ${feature}
- **生成日**: ${new Date().toISOString().split('T')[0]}

## 環境準備

\`\`\`bash
# テスト対象アプリケーションを起動
# 別ターミナルで実行
\`\`\`

## テストケース
${testCases}

## テスト結果サマリー

| 項目 | 結果 |
|------|------|
| 総テスト数 | ${endpoints.length} |
| 成功 | ___ |
| 失敗 | ___ |
| 実施日 | ____ |
| 実施者 | ____ |

## 備考

`;
}

/**
 * 統合テスト/E2Eテスト実行ファイルを生成
 */
export async function generateIntegrationE2EExecution(
  options: TestExecutionOptions & { testType: 'integration' | 'e2e' }
): Promise<GenerationResult> {
  const { feature, testType, projectRoot = process.cwd() } = options;
  const files: string[] = [];

  try {
    const outputDir = join(projectRoot, '.kiro', 'specs', feature, 'test-execution', testType);
    mkdirSync(outputDir, { recursive: true });

    // チェックリストを生成
    const checklistContent = generateIntegrationE2EChecklist(feature, testType);
    const checklistPath = join(outputDir, `${testType}-checklist.md`);
    writeFileSync(checklistPath, checklistContent, 'utf-8');
    files.push(checklistPath);

    return { testType, files, success: true };
  } catch (error) {
    return {
      testType,
      files,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 統合/E2Eテストチェックリストを生成
 */
function generateIntegrationE2EChecklist(
  feature: string,
  testType: 'integration' | 'e2e'
): string {
  const title = testType === 'integration' ? '統合テスト' : 'E2Eテスト';

  return `# ${feature} ${title}チェックリスト

## 概要

- **対象**: ${feature}
- **テストタイプ**: ${title}
- **生成日**: ${new Date().toISOString().split('T')[0]}

## 事前準備

- [ ] テスト環境が起動している
- [ ] テストデータが準備されている
- [ ] 依存サービスが正常に動作している

## テストシナリオ

### シナリオ1: 正常系フロー

- [ ] ステップ1: （具体的な操作を記載）
- [ ] ステップ2: （具体的な操作を記載）
- [ ] ステップ3: （具体的な操作を記載）
- [ ] 期待結果の確認

### シナリオ2: 異常系フロー

- [ ] エラー条件でのテスト
- [ ] エラーメッセージの確認
- [ ] リカバリー処理の確認

## テスト結果

| シナリオ | 結果 | 備考 |
|----------|------|------|
| シナリオ1 | [ ] Pass / [ ] Fail | |
| シナリオ2 | [ ] Pass / [ ] Fail | |

## 備考

`;
}

/**
 * メイン生成関数: テストタイプに応じた実行ファイルを生成
 */
export async function generateTestExecution(
  feature: string,
  testType: string,
  projectRoot: string = process.cwd()
): Promise<GenerationResult> {
  const options: TestExecutionOptions = { feature, projectRoot, testType };

  switch (testType) {
  case 'performance':
    return await generateLoadTestExecution(options);
  case 'security':
    return await generateSecurityTestExecution(options);
  case 'integration':
    return await generateIntegrationE2EExecution({ ...options, testType: 'integration' });
  case 'e2e':
    return await generateIntegrationE2EExecution({ ...options, testType: 'e2e' });
  case 'manual-regression':
    return await generateManualRegressionExecution(options);
  default:
    return {
      testType,
      files: [],
      success: false,
      error: `未対応のテストタイプ: ${testType}（unit, lint, buildはCI/CD設定で対応）`
    };
  }
}

/**
 * 選択されたすべてのテストタイプの実行ファイルを生成
 */
export async function generateAllTestExecutions(
  feature: string,
  projectRoot: string = process.cwd()
): Promise<GenerationResult[]> {
  const selectionPath = join(projectRoot, '.kiro', 'specs', feature, 'test-type-selection.json');

  if (!existsSync(selectionPath)) {
    throw new Error('test-type-selection.jsonが存在しません。先にtest-type-selectionフェーズを実行してください');
  }

  const selection = JSON.parse(readFileSync(selectionPath, 'utf-8'));
  const testTypes: string[] = selection.selectedTypes || [];

  const results: GenerationResult[] = [];

  // Phase B対象のテストタイプのみを処理（unit, lint, buildはスキップ）
  const phaseBTypes = testTypes.filter(t => !['unit', 'lint', 'build'].includes(t));

  for (const testType of phaseBTypes) {
    const result = await generateTestExecution(feature, testType, projectRoot);
    results.push(result);
  }

  return results;
}
