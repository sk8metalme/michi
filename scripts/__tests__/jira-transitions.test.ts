/**
 * JIRAClient transitionIssue() と addComment() のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// axiosをモック
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      isAxiosError: vi.fn(),
    },
  };
});

// dotenvをモック
vi.mock('dotenv', () => ({ config: vi.fn() }));

describe('JIRAClient transitions', () => {
  let mockAxiosInstance: any;
  const mockAxiosGet = vi.mocked(axios.get);
  const mockAxiosPost = vi.mocked(axios.post);
  const mockAxiosIsAxiosError = vi.mocked(axios.isAxiosError);
  const mockAxiosCreate = vi.mocked(axios.create);

  beforeEach(() => {
    vi.clearAllMocks();

    // axios.createから返されるモックインスタンス
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    mockAxiosCreate.mockReturnValue(mockAxiosInstance);

    // isAxiosError をデフォルトでtrueに
    mockAxiosIsAxiosError.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transitionIssue', () => {
    it('利用可能なトランジションを取得してステータスを変更できる', async () => {
      // トランジション一覧のモック
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          transitions: [
            { id: '21', name: 'In Progress' },
            { id: '31', name: 'Done' },
            { id: '41', name: 'Ready for Review' },
          ],
        },
      });

      // トランジション実行のモック
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {},
      });

      // JIRAClientをインポート（モック設定後）
      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      await client.transitionIssue('PROJ-123', 'In Progress');

      // GETリクエストの検証
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/transitions',
      );

      // POSTリクエストの検証
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/transitions',
        { transition: { id: '21' } },
      );
    });

    it('部分一致でトランジションを検索できる', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          transitions: [
            { id: '21', name: 'Start Progress' },
            { id: '31', name: 'Complete' },
          ],
        },
      });

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {},
      });

      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      // "Progress" で部分一致
      await client.transitionIssue('PROJ-123', 'Progress');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/transitions',
        { transition: { id: '21' } },
      );
    });

    it('トランジションが見つからない場合はエラーをスロー', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          transitions: [
            { id: '21', name: 'In Progress' },
            { id: '31', name: 'Done' },
          ],
        },
      });

      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      await expect(
        client.transitionIssue('PROJ-123', 'NonExistent'),
      ).rejects.toThrow(/Transition "NonExistent" not found/);
    });

    it('利用可能なトランジションがない場合もエラーをスロー', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          transitions: [],
        },
      });

      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      await expect(
        client.transitionIssue('PROJ-123', 'In Progress'),
      ).rejects.toThrow(/Available transitions: none/);
    });
  });

  describe('addComment', () => {
    it('コメントを追加できる', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          id: 'comment-123',
        },
      });

      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      await client.addComment(
        'PROJ-123',
        'PRを作成しました: https://github.com/...',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/comment',
        {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'PRを作成しました: https://github.com/...',
                  },
                ],
              },
            ],
          },
        },
      );
    });

    it('APIエラー時は適切なエラーメッセージを表示', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            errorMessages: ['Issue Does Not Exist'],
          },
        },
      });

      const { JIRAClient } = await import('../jira-sync.js');
      const client = new JIRAClient({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
      });

      await expect(
        client.addComment('PROJ-999', 'test comment'),
      ).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });
});
