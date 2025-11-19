/**
 * jira-issue-type-fetcher.ts のユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  getProjectIssueTypes,
  hasJiraCredentials,
  getJiraCredentials,
  findIssueTypeIdByName,
  hasIssueTypeId,
  filterStoryTypes,
  filterSubtaskTypes,
  type IssueTypeInfo
} from '../jira-issue-type-fetcher.js';

// axios のモック
vi.mock('axios');

describe('jira-issue-type-fetcher', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('hasJiraCredentials', () => {
    it('認証情報がすべて設定されている場合はtrueを返す', () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      expect(hasJiraCredentials()).toBe(true);
    });

    it('認証情報が一部欠けている場合はfalseを返す', () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      delete process.env.ATLASSIAN_API_TOKEN;

      expect(hasJiraCredentials()).toBe(false);
    });

    it('認証情報がすべて未設定の場合はfalseを返す', () => {
      delete process.env.ATLASSIAN_URL;
      delete process.env.ATLASSIAN_EMAIL;
      delete process.env.ATLASSIAN_API_TOKEN;

      expect(hasJiraCredentials()).toBe(false);
    });
  });

  describe('getJiraCredentials', () => {
    it('認証情報がすべて設定されている場合は認証情報オブジェクトを返す', () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      const creds = getJiraCredentials();
      expect(creds).toEqual({
        url: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token'
      });
    });

    it('認証情報が一部欠けている場合はnullを返す', () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      delete process.env.ATLASSIAN_EMAIL;

      expect(getJiraCredentials()).toBeNull();
    });
  });

  describe('getProjectIssueTypes', () => {
    const mockIssueTypes = [
      { id: '10071', name: 'タスク', description: 'さまざまな小規模作業。', subtask: false },
      { id: '10072', name: 'バグ', description: '問題またはエラー。', subtask: false },
      { id: '10073', name: 'ストーリー', description: '機能要件', subtask: false },
      { id: '10074', name: 'エピック', description: '大きな機能', subtask: false },
      { id: '10075', name: 'サブタスク', description: 'サブタスク', subtask: true }
    ];

    it('正常にIssue Typesを取得できる', async () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { issueTypes: mockIssueTypes }
      });

      const result = await getProjectIssueTypes('TEST');

      expect(result).toHaveLength(5);
      expect(result?.[0]).toEqual({
        id: '10071',
        name: 'タスク',
        description: 'さまざまな小規模作業。',
        subtask: false
      });
    });

    it('認証情報が未設定の場合はnullを返す', async () => {
      delete process.env.ATLASSIAN_URL;

      const result = await getProjectIssueTypes('TEST');

      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('APIエラー（401）の場合はnullを返す', async () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      vi.mocked(axios.get).mockRejectedValueOnce({
        response: { status: 401, statusText: 'Unauthorized' }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getProjectIssueTypes('TEST');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ JIRA認証に失敗しました。認証情報を確認してください。'
      );

      consoleErrorSpy.mockRestore();
    });

    it('APIエラー（404）の場合はnullを返す', async () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      vi.mocked(axios.get).mockRejectedValueOnce({
        response: { status: 404, statusText: 'Not Found' }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getProjectIssueTypes('TEST');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ JIRAプロジェクト "TEST" が見つかりません。'
      );

      consoleErrorSpy.mockRestore();
    });

    it('ネットワークエラーの場合はnullを返す', async () => {
      process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      vi.mocked(axios.get).mockRejectedValueOnce({
        request: {}
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getProjectIssueTypes('TEST');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ JIRA APIへの接続に失敗しました。ネットワークを確認してください。'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('findIssueTypeIdByName', () => {
    const issueTypes: IssueTypeInfo[] = [
      { id: '10071', name: 'タスク', subtask: false },
      { id: '10073', name: 'ストーリー', subtask: false },
      { id: '10075', name: 'サブタスク', subtask: true }
    ];

    it('名前でIssue Type IDを検索できる（完全一致）', () => {
      const result = findIssueTypeIdByName(issueTypes, 'ストーリー');
      expect(result).toBe('10073');
    });

    it('名前でIssue Type IDを検索できる（大文字小文字を無視）', () => {
      const result = findIssueTypeIdByName(issueTypes, 'ストーリー');
      expect(result).toBe('10073');
    });

    it('見つからない場合はnullを返す', () => {
      const result = findIssueTypeIdByName(issueTypes, '存在しないタイプ');
      expect(result).toBeNull();
    });
  });

  describe('hasIssueTypeId', () => {
    const issueTypes: IssueTypeInfo[] = [
      { id: '10071', name: 'タスク', subtask: false },
      { id: '10073', name: 'ストーリー', subtask: false }
    ];

    it('IDが存在する場合はtrueを返す', () => {
      expect(hasIssueTypeId(issueTypes, '10073')).toBe(true);
    });

    it('IDが存在しない場合はfalseを返す', () => {
      expect(hasIssueTypeId(issueTypes, '99999')).toBe(false);
    });
  });

  describe('filterStoryTypes', () => {
    const issueTypes: IssueTypeInfo[] = [
      { id: '10071', name: 'タスク', subtask: false },
      { id: '10072', name: 'バグ', subtask: false },
      { id: '10073', name: 'ストーリー', subtask: false },
      { id: '10074', name: 'エピック', subtask: false },
      { id: '10075', name: 'サブタスク', subtask: true }
    ];

    it('Storyタイプをフィルタリングできる', () => {
      const result = filterStoryTypes(issueTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('10073');
      expect(result[0].name).toBe('ストーリー');
    });

    it('Storyタイプがない場合は空配列を返す', () => {
      const types = [
        { id: '10071', name: 'タスク', subtask: false },
        { id: '10074', name: 'エピック', subtask: false }
      ];
      const result = filterStoryTypes(types);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterSubtaskTypes', () => {
    const issueTypes: IssueTypeInfo[] = [
      { id: '10071', name: 'タスク', subtask: false },
      { id: '10073', name: 'ストーリー', subtask: false },
      { id: '10075', name: 'サブタスク', subtask: true }
    ];

    it('Subtaskタイプをフィルタリングできる', () => {
      const result = filterSubtaskTypes(issueTypes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('10075');
      expect(result[0].name).toBe('サブタスク');
    });

    it('Subtaskタイプがない場合は空配列を返す', () => {
      const types = [
        { id: '10071', name: 'タスク', subtask: false },
        { id: '10073', name: 'ストーリー', subtask: false }
      ];
      const result = filterSubtaskTypes(types);
      expect(result).toHaveLength(0);
    });
  });
});


