/**
 * JIRA API Client
 *
 * JIRA REST API v3 との通信を担当するクライアントクラス
 */

import axios, { type AxiosInstance } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import type {
  JIRAConfig,
  JIRAIssue,
  JIRAIssuePayload,
  JIRAIssueCreateResponse,
  JIRAIssueType,
  ADFDocument,
} from './types.js';

/**
 * リクエスト間のスリープ処理（レートリミット対策）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リクエスト間の待機時間（ミリ秒）
 * 環境変数 ATLASSIAN_REQUEST_DELAY で調整可能（デフォルト: 500ms）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * JIRA API クライアント
 * HTTP通信、認証、レートリミット制御を担当
 */
export class JIRAClient {
  private baseUrl: string;
  private auth: string;
  private requestDelay: number;
  private axiosInstance: AxiosInstance;
  private httpAgent: HttpAgent | HttpsAgent;

  constructor(config: JIRAConfig) {
    this.baseUrl = `${config.url}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      'base64',
    );
    this.requestDelay = getRequestDelay();

    // HTTPエージェントを作成（Keep-Alive接続プーリング）
    const isHttps = config.url.startsWith('https');
    this.httpAgent = isHttps
      ? new HttpsAgent({ keepAlive: true, maxSockets: 10 })
      : new HttpAgent({ keepAlive: true, maxSockets: 10 });

    // 共有axiosインスタンスを作成
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

  /**
   * リソースをクリーンアップ
   */
  dispose(): void {
    this.auth = '';
    this.httpAgent.destroy();
  }

  /**
   * JQL検索でIssueを検索
   * @throws 検索エラー時は例外を再スロー（呼び出し元で処理）
   */
  async searchIssues(jql: string): Promise<JIRAIssue[]> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // JIRA API v3の検索エンドポイントを使用
      // GET /rest/api/3/search でJQL検索を実行（GETメソッドが推奨）
      const response = await this.axiosInstance.get(`${this.baseUrl}/search`, {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,issuetype,status,key',
        },
      });
      return response.data.issues || [];
    } catch (error) {
      // エラーハンドリング改善
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(`Error searching issues (HTTP ${status}): ${message}`);

        if (status === 410) {
          console.error(
            '💡 Hint: The search API endpoint returned 410 (Gone).',
          );
          console.error(
            '   This may indicate the endpoint has been deprecated or disabled.',
          );
          console.error(
            '   Check JIRA instance configuration or try alternative search methods.',
          );
        } else if (status === 401) {
          console.error(
            '💡 Hint: Authentication failed. Check ATLASSIAN_API_TOKEN in .env',
          );
        } else if (status === 403) {
          console.error(
            '💡 Hint: Permission denied. Check API token permissions in JIRA.',
          );
        }
      } else {
        console.error(
          'Error searching issues:',
          error instanceof Error ? error.message : error,
        );
      }
      throw error; // エラーを再スローして呼び出し元で処理
    }
  }

  async createIssue(
    payload: JIRAIssuePayload,
  ): Promise<JIRAIssueCreateResponse> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    const response = await this.axiosInstance.post<JIRAIssueCreateResponse>(
      `${this.baseUrl}/issue`,
      payload,
    );
    return response.data;
  }

  async updateIssue(
    issueKey: string,
    payload: Partial<JIRAIssuePayload>,
  ): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    await this.axiosInstance.put(`${this.baseUrl}/issue/${issueKey}`, payload);
  }

  /**
   * JIRAチケットのステータスを変更（トランジション実行）
   * @param issueKey JIRAチケットキー (例: "PROJ-123")
   * @param transitionName 遷移先ステータス名 (例: "In Progress", "Ready for Review")
   * @throws トランジションが見つからない場合はエラー
   */
  async transitionIssue(
    issueKey: string,
    transitionName: string,
  ): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // 1. 利用可能なトランジションを取得
      const transitionsResponse = await this.axiosInstance.get(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
      );

      const transitions = transitionsResponse.data.transitions || [];

      // 2. transitionNameに一致するトランジションIDを特定
      // 名前の完全一致または部分一致で検索
      const transition = transitions.find(
        (t: { id: string; name: string }) =>
          t.name.toLowerCase() === transitionName.toLowerCase() ||
          t.name.toLowerCase().includes(transitionName.toLowerCase()),
      );

      if (!transition) {
        const availableTransitions = transitions
          .map((t: { name: string }) => t.name)
          .join(', ');
        throw new Error(
          `Transition "${transitionName}" not found for issue ${issueKey}. ` +
            `Available transitions: ${availableTransitions || 'none'}`,
        );
      }

      // レートリミット対策: リクエスト前に待機
      await sleep(this.requestDelay);

      // 3. トランジションを実行
      await this.axiosInstance.post(
        `${this.baseUrl}/issue/${issueKey}/transitions`,
        {
          transition: { id: transition.id },
        },
      );

      console.log(
        `✅ ${issueKey} のステータスを「${transition.name}」に変更しました`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(
          `Error transitioning issue ${issueKey} (HTTP ${status}): ${message}`,
        );

        if (status === 404) {
          console.error(
            `💡 Hint: Issue ${issueKey} was not found. Check the issue key.`,
          );
        } else if (status === 400) {
          console.error(
            '💡 Hint: The transition may not be valid from the current status.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * JIRAチケットにコメントを追加
   * @param issueKey JIRAチケットキー
   * @param commentText コメント内容
   */
  async addComment(issueKey: string, commentText: string): Promise<void> {
    // レートリミット対策: リクエスト前に待機
    await sleep(this.requestDelay);

    try {
      // Atlassian Document Format (ADF) でコメントを作成
      const commentBody: ADFDocument = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: commentText,
              },
            ],
          },
        ],
      };

      await this.axiosInstance.post(
        `${this.baseUrl}/issue/${issueKey}/comment`,
        {
          body: commentBody,
        },
      );

      console.log(`✅ ${issueKey} にコメントを追加しました`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessages = error.response?.data?.errorMessages || [];
        const message = errorMessages.join(', ') || error.message;

        console.error(
          `Error adding comment to ${issueKey} (HTTP ${status}): ${message}`,
        );

        if (status === 404) {
          console.error(
            `💡 Hint: Issue ${issueKey} was not found. Check the issue key.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * プロジェクトのIssue Type IDを取得
   * @param projectKey プロジェクトキー
   * @param issueTypeName Issue Type名（例: "Epic", "Story"）
   * @returns Issue Type ID
   */
  async getIssueTypeId(
    projectKey: string,
    issueTypeName: string,
  ): Promise<string | null> {
    await sleep(this.requestDelay);

    try {
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/project/${projectKey}`,
      );

      const issueTypes = (response.data.issueTypes || []) as JIRAIssueType[];
      const issueType = issueTypes.find(
        (it: JIRAIssueType) =>
          it.name.toLowerCase() === issueTypeName.toLowerCase() ||
          it.name === issueTypeName,
      );

      return issueType ? issueType.id : null;
    } catch (error) {
      console.error(
        `Error getting issue type ID for ${issueTypeName}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}
