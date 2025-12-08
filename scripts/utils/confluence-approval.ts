/**
 * Confluence承認状態ポーリングユーティリティ
 * Confluence APIを使用してページの承認状態を確認
 */

import axios from 'axios';

/**
 * Confluence設定
 */
export interface ConfluenceConfig {
  url: string;
  email: string;
  apiToken: string;
}

/**
 * 承認状態
 */
export interface ApprovalStatus {
  approved: boolean;
  approvers: string[];
  pendingApprovers: string[];
  pageId: string;
  pageTitle: string;
}

/**
 * Confluenceページの承認状態を取得
 * @param pageId ページID
 * @param config Confluence設定
 * @returns 承認状態
 */
export async function getApprovalStatus(
  pageId: string,
  config: ConfluenceConfig
): Promise<ApprovalStatus> {
  const baseUrl = `${config.url}/wiki/rest/api`;
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

  try {
    // ページ情報を取得
    const pageResponse = await axios.get(`${baseUrl}/content/${pageId}`, {
      params: {
        expand: 'metadata.labels'
      },
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const pageTitle = pageResponse.data.title;
    const labels = pageResponse.data.metadata?.labels?.results || [];

    // 承認ラベルをチェック
    // Confluenceでは通常、承認はカスタムラベルやメタデータで管理される
    // ここでは "approved" ラベルの存在で判定
    const hasApprovedLabel = labels.some((label: { name: string }) =>
      label.name === 'approved' || label.name === '承認済み'
    );

    // ページのコメントから承認者を取得
    const commentsResponse = await axios.get(`${baseUrl}/content/${pageId}/child/comment`, {
      params: {
        expand: 'body.view'
      },
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const comments = commentsResponse.data.results || [];
    const approvers: string[] = [];

    // "承認" または "Approved" を含むコメントから承認者を抽出
    for (const comment of comments) {
      const body = comment.body?.view?.value || '';
      const author = comment.version?.by?.displayName || 'Unknown';

      if (
        body.includes('承認') ||
        body.toLowerCase().includes('approved') ||
        body.toLowerCase().includes('lgtm')
      ) {
        if (!approvers.includes(author)) {
          approvers.push(author);
        }
      }
    }

    return {
      approved: hasApprovedLabel && approvers.length > 0,
      approvers,
      pendingApprovers: [],
      pageId,
      pageTitle
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to get approval status:', message);
    throw error;
  }
}

/**
 * 承認状態をポーリング
 * @param pageId ページID
 * @param config Confluence設定
 * @param interval チェック間隔 (ミリ秒)
 * @param timeout タイムアウト (ミリ秒)
 * @returns 承認状態
 */
export async function pollForApproval(
  pageId: string,
  config: ConfluenceConfig,
  interval: number = 30000, // 30秒
  timeout: number = 1800000 // 30分
): Promise<ApprovalStatus> {
  const startTime = Date.now();

  while (true) {
    try {
      const status = await getApprovalStatus(pageId, config);

      if (status.approved) {
        return status;
      }

      // タイムアウトチェック
      if (Date.now() - startTime > timeout) {
        throw new Error('Approval timeout: No approval received within the specified time');
      }

      // 次のチェックまで待機
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error: unknown) {
      // エラーがタイムアウト以外の場合はリトライ
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('timeout')) {
        throw error;
      }

      console.warn('Error checking approval status, will retry:', message);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

/**
 * 手動承認を待つ (コンソール出力のみ)
 * @param pageUrl ページURL
 * @param requiredApprovers 必要な承認者リスト
 */
export function waitForManualApproval(
  pageUrl: string,
  requiredApprovers: string[] = []
): void {
  console.log('\n⏸️  承認待ち\n');
  console.log(`📄 ページURL: ${pageUrl}`);

  if (requiredApprovers.length > 0) {
    console.log(`👥 承認者: ${requiredApprovers.join(', ')}`);
  }

  console.log('\n承認が完了したら、このプロセスを再開してください。');
  console.log('（自動ポーリングを有効にするには、環境変数 CONFLUENCE_AUTO_POLL=true を設定してください）');
}
