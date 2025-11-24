/**
 * テンプレート適用エンジン
 * テスト仕様書テンプレートにデータを適用
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Component, Flow, Requirement } from './markdown-parser.js';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TestCase {
  id: string;
  name: string;
  description: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  type: 'normal' | 'error' | 'edge';
}

export interface TemplateData {
  feature: string;
  testType: string;
  author?: string;
  date: string;
  purpose?: string;
  scope?: string;
  tool?: string;
  version?: string;
  testCases: TestCase[];
  components?: Component[];
  flows?: Flow[];
  requirements?: Requirement[];
}

/**
 * テスト仕様書テンプレートを読み込む
 */
export function loadTestSpecTemplate(testType: string, projectRoot: string = process.cwd()): string {
  const templatePath = join(
    projectRoot,
    '.kiro',
    'settings',
    'templates',
    'test-specs',
    `${testType}-test-spec-template.md`
  );
  
  // プロジェクトのテンプレートが存在しない場合、Michiのテンプレートを使用
  if (!existsSync(templatePath)) {
    const michiTemplatePath = join(
      __dirname,
      '..',
      '..',
      'docs',
      'user-guide',
      'templates',
      'test-specs',
      `${testType}-test-spec-template.md`
    );
    
    if (existsSync(michiTemplatePath)) {
      return readFileSync(michiTemplatePath, 'utf-8');
    }
    
    throw new Error(`テンプレートが見つかりません: ${testType}-test-spec-template.md`);
  }
  
  return readFileSync(templatePath, 'utf-8');
}

/**
 * テンプレートにデータを適用
 */
export function applyTemplate(template: string, data: TemplateData): string {
  let result = template;
  
  // 基本情報の置換
  result = result.replace(/\{\{TEST_NAME\}\}/g, `${data.feature} ${data.testType}テスト`);
  result = result.replace(/\{\{AUTHOR\}\}/g, data.author || 'Auto-generated');
  result = result.replace(/\{\{DATE\}\}/g, data.date);
  result = result.replace(/\{\{PURPOSE\}\}/g, data.purpose || `${data.feature}の${data.testType}テストを実施する`);
  result = result.replace(/\{\{SCOPE\}\}/g, data.scope || `${data.feature}の全コンポーネント`);
  result = result.replace(/\{\{TOOL_NAME\}\}/g, data.tool || 'Vitest');
  result = result.replace(/\{\{VERSION\}\}/g, data.version || '1.0.0');
  
  // 言語・フレームワーク情報
  result = result.replace(/\{\{LANGUAGE\}\}/g, 'TypeScript');
  result = result.replace(/\{\{LANGUAGE_VERSION\}\}/g, '5.x');
  result = result.replace(/\{\{FRAMEWORK\}\}/g, 'Vitest');
  result = result.replace(/\{\{FRAMEWORK_VERSION\}\}/g, '1.0.0');
  result = result.replace(/\{\{MOCKING_LIBRARY\}\}/g, 'Vitest (built-in)');
  result = result.replace(/\{\{DEPENDENCIES\}\}/g, 'Node.js 20+');
  
  // テストデータパス
  result = result.replace(/\{\{MOCK_DATA_PATH\}\}/g, `tests/__mocks__/${data.feature}`);
  result = result.replace(/\{\{FIXTURES_PATH\}\}/g, `tests/__fixtures__/${data.feature}`);
  result = result.replace(/\{\{DATA_SETUP_DESCRIPTION\}\}/g, 'モックデータはJSONファイルで管理');
  
  // カバレッジ目標
  result = result.replace(/\{\{TARGET_COVERAGE\}\}/g, '95');
  result = result.replace(/\{\{MIN_COVERAGE\}\}/g, '80');
  result = result.replace(/\{\{COVERAGE_REPORT_PATH\}\}/g, 'coverage/lcov.info');
  result = result.replace(/\{\{HTML_REPORT_PATH\}\}/g, 'coverage/index.html');
  
  // コンポーネント一覧テーブルの生成
  if (data.components && data.components.length > 0) {
    const componentTable = generateComponentTable(data.components);
    result = result.replace(/\|\s*\{\{COMPONENT_1\}\}\s*\|.*?\n/, componentTable);
  }
  
  // テストケースセクションの生成
  if (data.testCases && data.testCases.length > 0) {
    const testCasesSection = generateTestCasesSection(data.testCases);
    result = replaceTestCasesSection(result, testCasesSection);
  }
  
  // 残りのプレースホルダーをクリーンアップ
  result = cleanupPlaceholders(result);
  
  return result;
}

/**
 * コンポーネント一覧テーブルを生成
 */
function generateComponentTable(components: Component[]): string {
  let table = '';
  
  for (const component of components) {
    const priority = component.requirements.length > 3 ? 'High' : 'Medium';
    table += `| ${component.name} | Class | ${component.intent} | ${priority} |\n`;
  }
  
  return table;
}

/**
 * テストケースセクションを生成
 */
function generateTestCasesSection(testCases: TestCase[]): string {
  let section = '';
  
  for (const tc of testCases) {
    section += `\n### Test Case ${tc.id}: ${tc.name}\n\n`;
    section += `**Description**: ${tc.description}\n\n`;
    
    if (tc.preconditions.length > 0) {
      section += `**Preconditions**:\n`;
      tc.preconditions.forEach(p => section += `- ${p}\n`);
      section += '\n';
    }
    
    section += `**Test Steps**:\n`;
    tc.steps.forEach((step, idx) => section += `${idx + 1}. ${step}\n`);
    section += '\n';
    
    section += `**Expected Results**:\n`;
    tc.expectedResults.forEach(r => section += `- ${r}\n`);
    section += '\n';
    
    section += `**Actual Results**:\n`;
    section += `[To be filled during test execution]\n\n`;
    
    section += `**Status**: [ ] Pass / [ ] Fail / [ ] Blocked\n\n`;
    section += `**Notes**:\n\n`;
    section += `---\n\n`;
  }
  
  return section;
}

/**
 * テストケースセクションを置換
 */
function replaceTestCasesSection(template: string, testCasesSection: string): string {
  // "## 4. Test Cases"セクションを検索して置換
  const sectionMatch = template.match(/##\s+4\.\s+Test Cases[\s\S]*?(?=##\s+\d+\.|$)/);
  
  if (sectionMatch) {
    return template.replace(sectionMatch[0], `## 4. Test Cases\n${testCasesSection}`);
  }
  
  // セクションが見つからない場合は末尾に追加
  return template + `\n\n## 4. Test Cases\n${testCasesSection}`;
}

/**
 * プレースホルダーをクリーンアップ
 */
function cleanupPlaceholders(content: string): string {
  // 残っているプレースホルダーを削除または空文字に置換
  return content
    .replace(/\{\{[A-Z_0-9]+\}\}/g, '')
    .replace(/\|\s*\|\s*\|\s*\|/g, '') // 空のテーブル行を削除
    .replace(/\n{3,}/g, '\n\n'); // 連続する空行を2行に制限
}

