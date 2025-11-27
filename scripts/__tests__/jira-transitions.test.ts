/**
 * JIRAClient transitionIssue() と addComment() のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// axiosをモック
vi.mock('axios');

// dotenvをモック
vi.mock('dotenv', () => ({ config: vi.fn() }));

describe('JIRAClient transitions', () => {
  const mockAxiosGet = vi.mocked(axios.get);
  const mockAxiosPost = vi.mocked(axios.post);
  const mockAxiosIsAxiosError = vi.mocked(axios.isAxiosError);

  beforeEach(() => {
    vi.clearAllMocks();
    // isAxiosError をデフォルトでtrueに
    mockAxiosIsAxiosError.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transitionIssue', () => {
    it('利用可能なトランジションを取得してステータスを変更できる', async () => {
      // トランジション一覧のモック
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          transitions: [
            { id: '21', name: 'In Progress' },
            { id: '31', name: 'Done' },
            { id: '41', name: 'Ready for Review' },
          ],
        },
      });

      // トランジション実行のモック
      mockAxiosPost.mockResolvedValueOnce({
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
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/transitions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );

      // POSTリクエストの検証
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/PROJ-123/transitions',
        { transition: { id: '21' } },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('部分一致でトランジションを検索できる', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          transitions: [
            { id: '21', name: 'Start Progress' },
            { id: '31', name: 'Complete' },
          ],
        },
      });

      mockAxiosPost.mockResolvedValueOnce({
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

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        { transition: { id: '21' } },
        expect.any(Object),
      );
    });

    it('トランジションが見つからない場合はエラーをスロー', async () => {
      mockAxiosGet.mockResolvedValueOnce({
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
      mockAxiosGet.mockResolvedValueOnce({
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
      mockAxiosPost.mockResolvedValueOnce({
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

      expect(mockAxiosPost).toHaveBeenCalledWith(
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
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('APIエラー時は適切なエラーメッセージを表示', async () => {
      mockAxiosPost.mockRejectedValueOnce({
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
