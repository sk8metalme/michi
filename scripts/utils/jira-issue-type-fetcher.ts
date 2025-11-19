/**
 * JIRA Issue Types取得ユーティリティ
 * 
 * JIRA APIからプロジェクトのIssue Typesを取得する機能を提供
 */

import axios from 'axios';

/**
 * Issue Type情報
 */
export interface IssueTypeInfo {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask?: boolean;
}

/**
 * JIRA認証情報
 */
export interface JIRACredentials {
  url: string;
  email: string;
  apiToken: string;
}

/**
 * 認証情報が設定されているかチェック
 */
export function hasJiraCredentials(): boolean {
  return !!(
    process.env.ATLASSIAN_URL &&
    process.env.ATLASSIAN_EMAIL &&
    process.env.ATLASSIAN_API_TOKEN
  );
}

/**
 * 環境変数からJIRA認証情報を取得
 */
export function getJiraCredentials(): JIRACredentials | null {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !email || !apiToken) {
    return null;
  }

  return { url, email, apiToken };
}

/**
 * リクエスト間の待機時間（ミリ秒）
 * 環境変数 ATLASSIAN_REQUEST_DELAY で調整可能（デフォルト: 500ms）
 */
function getRequestDelay(): number {
  return parseInt(process.env.ATLASSIAN_REQUEST_DELAY || '500', 10);
}

/**
 * リクエスト間のスリープ処理（レートリミット対策）
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * JIRA APIからプロジェクトのIssue Typesを取得
 * 
 * @param projectKey プロジェクトキー（例: "PC"）
 * @param credentials JIRA認証情報（省略時は環境変数から取得）
 * @returns Issue Typesのリスト、取得失敗時はnull
 */
export async function getProjectIssueTypes(
  projectKey: string,
  credentials?: JIRACredentials
): Promise<IssueTypeInfo[] | null> {
  const creds = credentials || getJiraCredentials();
  
  if (!creds) {
    return null;
  }

  const baseUrl = `${creds.url}/rest/api/3`;
  const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString('base64');
  
  // レートリミット対策: リクエスト前に待機
  await sleep(getRequestDelay());

  try {
    const response = await axios.get(`${baseUrl}/project/${projectKey}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒タイムアウト
    });

    const issueTypes = response.data.issueTypes || [];
    
    return issueTypes.map((it: any) => ({
      id: it.id,
      name: it.name,
      description: it.description || undefined,
      iconUrl: it.iconUrl || undefined,
      subtask: it.subtask || false
    }));
  } catch (error: any) {
    // エラーをログに記録（デバッグ用）
    if (error.response) {
      // HTTPエラー（4xx, 5xx）
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 401) {
        console.error('❌ JIRA認証に失敗しました。認証情報を確認してください。');
      } else if (status === 403) {
        console.error('❌ JIRAへのアクセス権限がありません。');
      } else if (status === 404) {
        console.error(`❌ JIRAプロジェクト "${projectKey}" が見つかりません。`);
      } else {
        console.error(`❌ JIRA APIエラー: ${status} ${statusText}`);
      }
    } else if (error.request) {
      // ネットワークエラー
      console.error('❌ JIRA APIへの接続に失敗しました。ネットワークを確認してください。');
    } else {
      // その他のエラー
      console.error(`❌ エラー: ${error.message}`);
    }
    
    return null;
  }
}

/**
 * Issue Type名からIDを取得
 * 
 * @param issueTypes Issue Typesのリスト
 * @param name Issue Type名（例: "Story", "ストーリー"）
 * @returns Issue Type ID、見つからない場合はnull
 */
export function findIssueTypeIdByName(
  issueTypes: IssueTypeInfo[],
  name: string
): string | null {
  const normalizedName = name.toLowerCase().trim();
  
  const found = issueTypes.find(it => 
    it.name.toLowerCase() === normalizedName ||
    it.name === name
  );
  
  return found ? found.id : null;
}

/**
 * Issue Type IDが存在するかチェック
 * 
 * @param issueTypes Issue Typesのリスト
 * @param id Issue Type ID
 * @returns 存在する場合はtrue
 */
export function hasIssueTypeId(
  issueTypes: IssueTypeInfo[],
  id: string
): boolean {
  return issueTypes.some(it => it.id === id);
}

/**
 * StoryタイプのIssue Typesをフィルタリング
 * 
 * @param issueTypes Issue Typesのリスト
 * @returns Storyタイプのリスト
 */
export function filterStoryTypes(issueTypes: IssueTypeInfo[]): IssueTypeInfo[] {
  return issueTypes.filter(it =>
    !it.subtask &&
    (it.name.toLowerCase().includes('story') || it.name.includes('ストーリー')) &&
    !it.name.toLowerCase().includes('epic') &&
    !it.name.includes('エピック')
  );
}

/**
 * SubtaskタイプのIssue Typesをフィルタリング
 * 
 * @param issueTypes Issue Typesのリスト
 * @returns Subtaskタイプのリスト
 */
export function filterSubtaskTypes(issueTypes: IssueTypeInfo[]): IssueTypeInfo[] {
  return issueTypes.filter(it => it.subtask === true);
}


