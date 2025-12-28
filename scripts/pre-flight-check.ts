/**
 * プリフライトチェック
 * スクリプト実行前に必要な設定が揃っているか確認
 */

import { existsSync } from 'fs';
import { safeReadJsonFile } from './utils/safe-file-reader.js';
import { join } from 'path';
import axios from 'axios';
import { loadEnv } from './utils/env-loader.js';

loadEnv();

interface PreFlightResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ProjectMeta {
  projectId?: string;
  projectName?: string;
  jiraProjectKey?: string;
  [key: string]: unknown;
}

/**
 * .env設定をチェック
 */
function checkEnvConfig(): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // .envファイル存在チェック
  if (!existsSync('.env')) {
    errors.push('❌ .envファイルが存在しません');
    errors.push('   → テンプレートからコピー: cp .env.example .env');
    errors.push('   → 編集: vim .env（認証情報を設定）');
    errors.push('   → API Token取得: https://id.atlassian.com/manage-profile/security/api-tokens');
    return { errors, warnings };
  }
  
  // 必須環境変数チェック
  const required = [
    'ATLASSIAN_URL',
    'ATLASSIAN_EMAIL',
    'ATLASSIAN_API_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    errors.push(`❌ .envに必須項目が設定されていません: ${missing.join(', ')}`);
    errors.push('   → 編集: vim .env');
    errors.push('   → API Token取得: https://id.atlassian.com/manage-profile/security/api-tokens');
    errors.push('');
    errors.push('   必須項目:');
    errors.push('     ATLASSIAN_URL=https://your-site.atlassian.net');
    errors.push('     ATLASSIAN_EMAIL=your-email@example.com');
    errors.push('     ATLASSIAN_API_TOKEN=your-api-token');
  }
  
  // オプション環境変数の警告
  if (!process.env.CONFLUENCE_PRD_SPACE) {
    warnings.push('⚠️  CONFLUENCE_PRD_SPACEが未設定（デフォルト: PRD）');
    warnings.push(`   → スペース一覧: ${process.env.ATLASSIAN_URL}/wiki/spaces`);
  }
  
  return { errors, warnings };
}

/**
 * project.jsonをチェック
 */
function checkProjectJson(): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const projectJsonPath = join(process.cwd(), '.kiro', 'project.json');
  
  if (!existsSync(projectJsonPath)) {
    errors.push('❌ .kiro/project.json が存在しません');
    errors.push('   → このディレクトリはMichiプロジェクトではありません');
    errors.push('   → セットアップ: npm run setup-existing（michi-practice1の場合）');
    errors.push('   → または、Michiプロジェクトのディレクトリに移動してください');
    return { errors, warnings };
  }
  
  const readResult = safeReadJsonFile(projectJsonPath);
  if (!readResult.success) {
    const error = readResult.errors[0];
    if (error.type === 'InvalidJSON') {
      errors.push(`❌ project.json のパースに失敗しました: ${error.cause}`);
    } else {
      errors.push('❌ project.json のパースに失敗しました');
    }
    return { errors, warnings };
  }

  const projectMeta: ProjectMeta = readResult.value;
  
  // 必須フィールドチェック
  const required = ['projectId', 'projectName', 'jiraProjectKey'];
  const missing = required.filter(key => !projectMeta[key]);
  
  if (missing.length > 0) {
    errors.push(`❌ project.jsonに必須項目がありません: ${missing.join(', ')}`);
  }
  
  return { errors, warnings };
}

/**
 * Confluenceスペース存在チェック（API呼び出し）
 */
async function checkConfluenceSpace(spaceKey: string): Promise<{ errors: string[], warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  
  if (!url || !email || !apiToken) {
    errors.push('❌ .env設定が不完全なため、Confluenceスペースチェックをスキップ');
    return { errors, warnings };
  }
  
  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const response = await axios.get(`${url}/wiki/rest/api/space/${spaceKey}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      console.log(`  ✅ Confluenceスペース確認: ${spaceKey} (${response.data.name})`);
    }
  } catch (error: unknown) {
    const isAxiosError = axios.isAxiosError(error);
    if (isAxiosError && error.response?.status === 404) {
      errors.push(`❌ Confluenceスペースが存在しません: ${spaceKey}`);
      errors.push(`   → Confluenceで新しいスペースを作成: ${url}/wiki/spaces`);
      errors.push('   → または、.envのCONFLUENCE_PRD_SPACEを修正してください');
    } else if (isAxiosError && error.response?.status === 401) {
      errors.push('❌ Confluence認証エラー（.envの認証情報を確認）');
      errors.push(`   → API Token管理: ${url.replace('atlassian.net', 'atlassian.net/manage/profile/security/api-tokens')}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`⚠️  Confluenceスペースチェック失敗: ${message}`);
    }
  }
  
  return { errors, warnings };
}

/**
 * JIRAプロジェクト存在チェック（API呼び出し）
 */
async function checkJiraProject(projectKey: string): Promise<{ errors: string[], warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  
  if (!url || !email || !apiToken) {
    errors.push('❌ .env設定が不完全なため、JIRAプロジェクトチェックをスキップ');
    return { errors, warnings };
  }
  
  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const response = await axios.get(`${url}/rest/api/3/project/${projectKey}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      console.log(`  ✅ JIRAプロジェクト確認: ${projectKey} (${response.data.name})`);
    }
  } catch (error: unknown) {
    const isAxiosError = axios.isAxiosError(error);
    if (isAxiosError && error.response?.status === 404) {
      errors.push(`❌ JIRAプロジェクトが存在しません: ${projectKey}`);
      errors.push(`   → JIRAプロジェクト作成: ${url}/jira/projects/create`);
      errors.push(`   → プロジェクト一覧: ${url}/jira/settings/projects`);
      errors.push('   → または、.kiro/project.jsonのjiraProjectKeyを修正してください');
      errors.push(`      現在の設定: "${projectKey}" → 実際に存在するキーに変更`);
    } else if (isAxiosError && error.response?.status === 401) {
      errors.push('❌ JIRA認証エラー（.envの認証情報を確認）');
      errors.push('   → API Token管理: https://id.atlassian.com/manage-profile/security/api-tokens');
    } else {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`⚠️  JIRAプロジェクトチェック失敗: ${message}`);
    }
  }
  
  return { errors, warnings };
}

/**
 * プリフライトチェック実行
 */
export async function runPreFlightCheck(phase: 'confluence' | 'jira' | 'all'): Promise<PreFlightResult> {
  console.log('\n🔍 プリフライトチェック実行中...\n');
  
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  // 1. .env設定チェック
  console.log('📋 Step 1: .env設定チェック');
  const envCheck = checkEnvConfig();
  allErrors.push(...envCheck.errors);
  allWarnings.push(...envCheck.warnings);
  
  if (envCheck.errors.length === 0) {
    console.log('  ✅ .env設定OK');
  }
  
  // 2. project.jsonチェック
  console.log('\n📋 Step 2: project.json設定チェック');
  const projectCheck = checkProjectJson();
  allErrors.push(...projectCheck.errors);
  allWarnings.push(...projectCheck.warnings);
  
  if (projectCheck.errors.length === 0) {
    console.log('  ✅ project.json設定OK');
  }
  
  // .envまたはproject.jsonエラーがあれば、ここで中断
  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, warnings: allWarnings };
  }
  
  // 3. Confluenceスペースチェック（API呼び出し）
  if (phase === 'confluence' || phase === 'all') {
    console.log('\n📋 Step 3: Confluenceスペース存在チェック');
    const spaceKey = process.env.CONFLUENCE_PRD_SPACE || 'PRD';
    const spaceCheck = await checkConfluenceSpace(spaceKey);
    allErrors.push(...spaceCheck.errors);
    allWarnings.push(...spaceCheck.warnings);
  }
  
  // 4. JIRAプロジェクトチェック（API呼び出し）
  if (phase === 'jira' || phase === 'all') {
    console.log('\n📋 Step 4: JIRAプロジェクト存在チェック');
    const projectJsonPath = join(process.cwd(), '.kiro', 'project.json');

    const readResult = safeReadJsonFile(projectJsonPath);
    if (!readResult.success) {
      allErrors.push(`❌ project.json読み込み失敗: ${readResult.errors[0].type}`);
    } else {
      const projectMeta = readResult.value;
      const jiraCheck = await checkJiraProject(projectMeta.jiraProjectKey);
      allErrors.push(...jiraCheck.errors);
      allWarnings.push(...jiraCheck.warnings);
    }
  }
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const phase = (args[0] as 'confluence' | 'jira' | 'all') || 'all';
  
  if (!['confluence', 'jira', 'all'].includes(phase)) {
    console.error('Usage: npm run preflight [confluence|jira|all]');
    process.exit(1);
  }
  
  runPreFlightCheck(phase)
    .then((result) => {
      console.log('\n' + '='.repeat(60));
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  警告:');
        result.warnings.forEach(w => console.log(`  ${w}`));
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ エラー:');
        result.errors.forEach(e => console.log(`  ${e}`));
        console.log('\n❌ プリフライトチェック失敗');
        process.exit(1);
      } else {
        console.log('\n✅ プリフライトチェック成功');
        console.log('   すべての設定が正しく構成されています');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error(`\n❌ チェックエラー: ${error.message}`);
      process.exit(1);
    });
}

