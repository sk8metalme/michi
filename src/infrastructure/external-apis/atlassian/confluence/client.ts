/**
 * Confluence API Client
 */

import axios, { type AxiosInstance } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import type {
  ConfluenceConfig,
  ConfluencePage,
  ConfluenceCreatePagePayload,
  ConfluenceError,
} from './types.js';

/**
 * リクエスト間のスリープ処理（レートリミット対策）
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リクエスト間の待機時間（ミリ秒）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * CQLクエリ文字列のエスケープ
 */
function escapeCQL(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, '\\\'');
}

/**
 * Confluence API クライアント
 */
export class ConfluenceClient {
  private baseUrl: string;
  private auth: string;
  private requestDelay: number;
  private axiosInstance: AxiosInstance;
  private httpAgent: HttpAgent | HttpsAgent;

  constructor(config: ConfluenceConfig) {
    this.baseUrl = `${config.url}/wiki/rest/api`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.requestDelay = getRequestDelay();

    const isHttps = config.url.startsWith('https');
    this.httpAgent = isHttps
      ? new HttpsAgent({ keepAlive: true, maxSockets: 10 })
      : new HttpAgent({ keepAlive: true, maxSockets: 10 });

    this.axiosInstance = axios.create({
      httpAgent: isHttps ? undefined : this.httpAgent,
      httpsAgent: isHttps ? this.httpAgent : undefined,
      timeout: 30000,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
    });
  }

  dispose(): void {
    this.auth = '';
    this.httpAgent.destroy();
  }

  async searchPage(spaceKey: string, title: string, parentId?: string): Promise<ConfluencePage | null> {
    await sleep(this.requestDelay);

    try {
      if (parentId) {
        const escapedTitle = escapeCQL(title);
        const cql = `space = ${spaceKey} AND title = "${escapedTitle}" AND parent = ${parentId}`;
        console.log(`  CQL Query: ${cql}`);

        const response = await this.axiosInstance.get(`${this.baseUrl}/content/search`, {
          params: { cql, expand: 'version' },
        });

        console.log(`  CQL Search results: ${response.data.results?.length || 0} pages found`);

        if (response.data.results && response.data.results.length > 0) {
          return response.data.results[0];
        }

        console.log('  Falling back to standard search (may find pages in different parent)');
        return null;
      }

      const response = await this.axiosInstance.get(`${this.baseUrl}/content`, {
        params: { spaceKey, title, expand: 'version' },
      });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
      }

      return null;
    } catch (error: unknown) {
      const isAxiosError = axios.isAxiosError(error);

      if (isAxiosError && error.response?.status === 404) {
        return null;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.error('Error searching page:', message);

      if (isAxiosError && error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', JSON.stringify(error.response.data, null, 2));
      }

      if (isAxiosError && error.response) {
        const enhancedError: ConfluenceError = new Error(
          `Confluence API error: ${message} (status: ${error.response.status})`
        );
        enhancedError.response = {
          status: error.response.status,
          data: error.response.data
        };
        throw enhancedError;
      } else {
        throw error;
      }
    }
  }

  async createPage(spaceKey: string, title: string, content: string, labels: string[] = [], parentId?: string): Promise<ConfluencePage> {
    await sleep(this.requestDelay);

    const payload: ConfluenceCreatePagePayload = {
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

    if (parentId) {
      payload.ancestors = [{ id: parentId }];
    }

    const response = await this.axiosInstance.post(`${this.baseUrl}/content`, payload);

    return response.data;
  }

  async createPageUnderParent(
    spaceKey: string,
    title: string,
    content: string,
    labels: string[] = [],
    parentId: string
  ): Promise<ConfluencePage> {
    return this.createPage(spaceKey, title, content, labels, parentId);
  }

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
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

    const response = await this.axiosInstance.put(`${this.baseUrl}/content/${pageId}`, payload);

    return response.data;
  }

  async getPageParentId(pageId: string): Promise<string | null> {
    await sleep(this.requestDelay);

    try {
      const response = await this.axiosInstance.get(`${this.baseUrl}/content/${pageId}`, {
        params: { expand: 'ancestors' },
      });

      const ancestors = response.data.ancestors;
      if (ancestors && ancestors.length > 0) {
        return ancestors[ancestors.length - 1].id;
      }

      return null;
    } catch (error: unknown) {
      const isAxiosError = axios.isAxiosError(error);

      if (isAxiosError && error.response?.status === 404) {
        return null;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.error('Error getting page parent:', message);

      if (isAxiosError && error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', JSON.stringify(error.response.data, null, 2));
      }

      if (isAxiosError && error.response) {
        const enhancedError: ConfluenceError = new Error(
          `Confluence API error: ${message} (status: ${error.response.status})`
        );
        enhancedError.response = {
          status: error.response.status,
          data: error.response.data
        };
        throw enhancedError;
      } else {
        throw error;
      }
    }
  }

  async addLabels(pageId: string, labels: string[]): Promise<void> {
    for (const label of labels) {
      await sleep(this.requestDelay);
      await this.axiosInstance.post(
        `${this.baseUrl}/content/${pageId}/label`,
        [{ name: label }],
      );
    }
  }
}
