/**
 * Confluence同期スクリプト
 * GitHub の Markdown ファイルを Confluence に同期
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';
import { validateFeatureNameOrThrow } from './utils/feature-name-validator.js';
import { getConfig, getConfigPath } from './utils/config-loader.js';
import { createPagesByGranularity } from './utils/confluence-hierarchy.js';
import { validateForConfluenceSync } from './utils/config-validator.js';
import { updateSpecJsonAfterConfluenceSync, loadSpecJson } from './utils/spec-updater.js';

// 環境変数読み込み
config();

/**
 * リクエスト間のスリープ処理（レートリミット対策）
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リクエスト間の待機時間（ミリ秒）
 * 環境変数 ATLASSIAN_REQUEST_DELAY で調整可能（デフォルト: 500ms）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

interface ConfluenceConfig {
  url: string;
  email: string;
  apiToken: string;
  space: string;
}

/**
 * Confluence設定を環境変数から取得
 */
export function getConfluenceConfig(): ConfluenceConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  const space = process.env.CONFLUENCE_PRD_SPACE || 'PRD';
  
  if (!url || !email || !apiToken) {
    throw new Error('Missing Confluence credentials in .env file');
  }
  
  return { url, email, apiToken, space };
}

/**
 * Confluence REST API クライアント
 */
class ConfluenceClient {
  private baseUrl: string;
  private auth: string;
  private requestDelay: number;
  
  constructor(config: ConfluenceConfig) {
    this.baseUrl = `${config.url}/wiki/rest/api`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.requestDelay = getRequestDelay();
  }
  
  /**
   * ページを検索
   * @param spaceKey スペースキー
   * @param title ページタイトル
   * @param parentId 親ページID（オプション）。指定された場合、その親ページの子ページのみを検索
   */
  async searchPage(spaceKey: string, title: string, parentId?: string): Promise<any | null> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);
    
    try {
      // 親ページIDが指定されている場合、CQLクエリを使用して親ページの子ページのみを検索
      if (parentId) {
        // CQLクエリ: スペース、タイトル、親ページIDで検索
        // タイトル内の特殊文字をエスケープ
        const escapedTitle = title.replace(/"/g, '\\"');
        // ancestorの代わりにparentを使用（Confluence CQLの正しい構文）
        const cql = `space = ${spaceKey} AND title = "${escapedTitle}" AND parent = ${parentId}`;
        console.log(`  CQL Query: ${cql}`);
        
        const response = await axios.get(`${this.baseUrl}/content/search`, {
          params: {
            cql,
            expand: 'version'
          },
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`  CQL Search results: ${response.data.results?.length || 0} pages found`);
        
        if (response.data.results && response.data.results.length > 0) {
          return response.data.results[0];
        }
        
        // CQLクエリで見つからない場合、従来の方法で検索（親ページIDでフィルタリング）
        console.log('  Falling back to standard search (may find pages in different parent)');
        return null;
      }
      
      // 親ページIDが指定されていない場合、従来の方法で検索
      const response = await axios.get(`${this.baseUrl}/content`, {
        params: {
          spaceKey,
          title,
          expand: 'version'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
      }
      
      return null;
    } catch (error: any) {
      // 404エラーは既存ページがないことを意味するので、nullを返す
      if (error.response?.status === 404) {
        return null;
      }
      
      // その他のエラーは詳細をログ出力
      console.error('Error searching page:', error.message);
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // 404以外のエラーは再スロー（認証、権限、ネットワーク、サーバーエラーなど）
      // エラーの詳細情報を含めて再スロー
      if (error.response) {
        // HTTPレスポンスがある場合（4xx/5xxエラー）
        const enhancedError = new Error(
          `Confluence API error: ${error.message} (status: ${error.response.status})`
        );
        (enhancedError as any).response = error.response;
        throw enhancedError;
      } else {
        // ネットワークエラーなど、レスポンスがない場合
        throw error;
      }
    }
  }
  
  /**
   * ページを作成
   */
  async createPage(spaceKey: string, title: string, content: string, labels: string[] = [], parentId?: string): Promise<any> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);
    
    const payload: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      },
      metadata: {
        labels: labels.map(label => ({ name: label }))
      }
    };
    
    // 親ページが指定されている場合、ancestorsを追加
    if (parentId) {
      payload.ancestors = [{ id: parentId }];
    }
    
    const response = await axios.post(`${this.baseUrl}/content`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  /**
   * 親ページの下に子ページを作成
   */
  async createPageUnderParent(
    spaceKey: string,
    title: string,
    content: string,
    labels: string[] = [],
    parentId: string
  ): Promise<any> {
    return this.createPage(spaceKey, title, content, labels, parentId);
  }
  
  /**
   * ページを更新
   */
  async updatePage(pageId: string, title: string, content: string, version: number): Promise<any> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);
    
    const payload = {
      version: { number: version + 1 },
      title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    const response = await axios.put(`${this.baseUrl}/content/${pageId}`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  /**
   * ページの親情報を取得
   * @param pageId ページID
   * @returns 親ページID（ルートページの場合はnull）
   */
  async getPageParentId(pageId: string): Promise<string | null> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);
    
    try {
      const response = await axios.get(`${this.baseUrl}/content/${pageId}`, {
        params: {
          expand: 'ancestors'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      // ancestors配列の最後の要素が直接の親ページ
      const ancestors = response.data.ancestors;
      if (ancestors && ancestors.length > 0) {
        return ancestors[ancestors.length - 1].id;
      }
      
      return null; // ルートページ
    } catch (error: any) {
      // 404エラーはページが存在しないことを意味する
      if (error.response?.status === 404) {
        return null;
      }
      
      // その他のエラーは詳細をログ出力
      console.error('Error getting page parent:', error.message);
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // 404以外のエラーは再スロー
      if (error.response) {
        const enhancedError = new Error(
          `Confluence API error: ${error.message} (status: ${error.response.status})`
        );
        (enhancedError as any).response = error.response;
        throw enhancedError;
      } else {
        throw error;
      }
    }
  }
  
  /**
   * ページのラベルを追加
   */
  async addLabels(pageId: string, labels: string[]): Promise<void> {
    for (const label of labels) {
      // レートリミット対策: リクエスト前に待機
      await sleep(this.requestDelay);
      
      await axios.post(
        `${this.baseUrl}/content/${pageId}/label`,
        [{ name: label }],
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
}


/**
 * Markdownファイルを Confluence に同期
 */
async function syncToConfluence(
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks' = 'requirements'
): Promise<string> {
  console.log(`Syncing ${docType} for feature: ${featureName}`);
  
  // feature名のバリデーション（必須）
  validateFeatureNameOrThrow(featureName);
  
  // 実行前の必須設定値チェック
  const validation = validateForConfluenceSync(docType);
  
  if (validation.info.length > 0) {
    validation.info.forEach(msg => console.log(`ℹ️  ${msg}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.warn(`   ${warning}`));
  }
  
  if (validation.errors.length > 0) {
    console.error('❌ Configuration errors:');
    validation.errors.forEach(error => console.error(`   ${error}`));
    const configPath = getConfigPath();
    console.error(`\n設定ファイル: ${configPath}`);
    throw new Error('Confluence同期に必要な設定値が不足しています。上記のエラーを確認して設定を修正してください。');
  }
  
  console.log(`⏳ Request delay: ${getRequestDelay()}ms (set ATLASSIAN_REQUEST_DELAY to adjust)`);
  
  // プロジェクトメタデータ読み込み
  const projectMeta = loadProjectMeta();
  console.log(`Project: ${projectMeta.projectName} (${projectMeta.projectId})`);
  
  // 設定を読み込み
  const appConfig = getConfig();
  const confluenceConfig = appConfig.confluence || {
    pageCreationGranularity: 'single',
    pageTitleFormat: '[{projectName}] {featureName} {docTypeLabel}',
    autoLabels: ['{projectLabel}', '{docType}', '{featureName}', 'github-sync']
  };
  
  console.log(`📋 Page creation granularity: ${confluenceConfig.pageCreationGranularity}`);
  
  // 設定ソースのログ出力
  if (confluenceConfig.spaces?.[docType]) {
    console.log(`📝 Config source: config.json (spaces.${docType} = ${confluenceConfig.spaces[docType]})`);
  } else if (process.env.CONFLUENCE_PRD_SPACE) {
    console.log(`📝 Config source: environment variable (CONFLUENCE_PRD_SPACE = ${process.env.CONFLUENCE_PRD_SPACE})`);
  } else {
    console.log('📝 Config source: default config');
  }
  
  // Markdownファイル読み込み
  const markdownPath = resolve(`.kiro/specs/${featureName}/${docType}.md`);
  const markdown = readFileSync(markdownPath, 'utf-8');
  
  // GitHub URL生成
  const githubUrl = `${projectMeta.repository}/blob/main/.kiro/specs/${featureName}/${docType}.md`;
  
  // Confluence設定を取得
  const confluenceApiConfig = getConfluenceConfig();
  
  // spec.jsonを読み込み
  const specJson = loadSpecJson(featureName);
  
  // スペースキーを決定（優先順位: spec.json → config.json → 環境変数/デフォルト）
  let spaceKey: string;
  let spaceKeySource: string;
  
  if (specJson.confluence?.spaceKey) {
    spaceKey = specJson.confluence.spaceKey;
    spaceKeySource = 'spec.json';
  } else if (confluenceConfig.spaces?.[docType]) {
    spaceKey = confluenceConfig.spaces[docType];
    spaceKeySource = 'config.json';
  } else {
    // confluenceApiConfig.space は常に存在（getConfluenceConfig()で 'PRD' がデフォルト）
    spaceKey = confluenceApiConfig.space;
    spaceKeySource = process.env.CONFLUENCE_PRD_SPACE ? 'environment variable' : 'default from config';
  }
  
  console.log(`📌 Using Confluence space: ${spaceKey} (source: ${spaceKeySource})`);
  
  // Confluenceクライアント初期化
  const client = new ConfluenceClient(confluenceApiConfig);
  
  // 階層構造に応じてページを作成
  const result = await createPagesByGranularity(
    client,
    spaceKey,
    markdown,
    confluenceConfig,
    projectMeta,
    featureName,
    docType,
    githubUrl
  );
  
  // 最初のページのURLを返す（後方互換性のため）
  if (result.pages.length === 0) {
    throw new Error('No pages were created');
  }
  
  const firstPageUrl = result.pages[0].url;
  console.log(`✅ Sync completed: ${result.pages.length} page(s) created/updated`);

  if (result.pages.length > 1) {
    console.log('📄 Created pages:');
    result.pages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.title} - ${page.url}`);
    });
  }

  // spec.json を更新
  const firstPage = result.pages[0];
  updateSpecJsonAfterConfluenceSync(featureName, docType, {
    pageId: firstPage.id,
    url: firstPage.url,
    title: firstPage.title,
    spaceKey: spaceKey
  });

  return firstPageUrl;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run confluence:sync <feature-name> [doc-type]');
    console.error('  doc-type: requirements (default) | design | tasks');
    process.exit(1);
  }
  
  const featureName = args[0];
  const docType = (args[1] as any) || 'requirements';
  
  syncToConfluence(featureName, docType)
    .then(() => {
      console.log('✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.config) {
        console.error('Request URL:', error.config.url);
        console.error('Request params:', JSON.stringify(error.config.params, null, 2));
      }
      process.exit(1);
    });
}

export { syncToConfluence, ConfluenceClient };

