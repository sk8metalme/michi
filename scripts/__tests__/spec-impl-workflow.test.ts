/**
 * spec-impl-workflow.ts のテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// モジュールのモック
vi.mock('dotenv', () => ({ config: vi.fn() }));

// JIRAClientをモック
const mockTransitionIssue = vi.fn();
const mockAddComment = vi.fn();

class MockJIRAClient {
  transitionIssue = mockTransitionIssue;
  addComment = mockAddComment;
}

vi.mock('../jira-sync.js', () => ({
  JIRAClient: MockJIRAClient,
}));

// config-loaderをモック
vi.mock('../utils/config-loader.js', () => ({
  getConfig: vi.fn(() => ({
    jira: {
      statusMapping: {
        inProgress: 'In Progress',
        readyForReview: 'Ready for Review',
      },
    },
  })),
}));

// project-metaをモック
vi.mock('../utils/project-meta.js', () => ({
  getRepositoryInfo: vi.fn(() => 'owner/repo'),
}));

// spec-loaderをモック
const mockGetJiraInfoFromSpec = vi.fn();
const mockCheckJiraInfoStatus = vi.fn();

vi.mock('../utils/spec-loader.js', () => ({
  getJiraInfoFromSpec: (...args: unknown[]) => mockGetJiraInfoFromSpec(...args),
  checkJiraInfoStatus: (...args: unknown[]) => mockCheckJiraInfoStatus(...args),
}));

// Octokitをモック
const mockPullsCreate = vi.fn();

class MockOctokit {
  pulls = {
    create: mockPullsCreate,
  };
}

vi.mock('@octokit/rest', () => ({
  Octokit: MockOctokit,
}));

describe('spec-impl-workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数の設定
    process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
    process.env.ATLASSIAN_EMAIL = 'test@example.com';
    process.env.ATLASSIAN_API_TOKEN = 'test-token';
    process.env.GITHUB_TOKEN = 'github-token';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ATLASSIAN_URL;
    delete process.env.ATLASSIAN_EMAIL;
    delete process.env.ATLASSIAN_API_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  // ==========================================================================
  // 新 API (runSpecImplStart, runSpecImplComplete)
  // ==========================================================================

  describe('runSpecImplStart', () => {
    it('spec.json から JIRA 情報を取得して Epic と Story を進行中に移動', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: 'PROJ-123',
        storyKeys: ['PROJ-124'],
        firstStoryKey: 'PROJ-124',
        projectKey: 'PROJ',
        epicUrl: 'https://test.atlassian.net/browse/PROJ-123',
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: true,
        hasEpic: true,
        hasStories: true,
        missing: [],
      });
      mockTransitionIssue.mockResolvedValue(undefined);

      const { runSpecImplStart } = await import('../spec-impl-workflow.js');

      const result = await runSpecImplStart({
        featureName: 'user-auth',
      });

      expect(mockGetJiraInfoFromSpec).toHaveBeenCalledWith(
        'user-auth',
        process.cwd(),
      );
      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-123',
        'In Progress',
      );
      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-124',
        'In Progress',
      );
      expect(result.jiraInfo).toBeTruthy();
      expect(result.jiraInfo?.epicKey).toBe('PROJ-123');
    });

    it('skipJira=true の場合は JIRA 連携をスキップ', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: null,
        storyKeys: [],
        firstStoryKey: null,
        projectKey: null,
        epicUrl: null,
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: false,
        hasEpic: false,
        hasStories: false,
        missing: ['Epic', 'Story'],
      });

      const { runSpecImplStart } = await import('../spec-impl-workflow.js');

      const result = await runSpecImplStart({
        featureName: 'user-auth',
        skipJira: true,
      });

      expect(mockTransitionIssue).not.toHaveBeenCalled();
      expect(result.jiraInfo).toBeNull();
    });

    it('JIRA 情報がない場合は JiraInfoNotFoundError をスロー', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: null,
        storyKeys: [],
        firstStoryKey: null,
        projectKey: null,
        epicUrl: null,
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: false,
        hasEpic: false,
        hasStories: false,
        missing: ['Epic', 'Story'],
      });

      const { runSpecImplStart, JiraInfoNotFoundError } = await import(
        '../spec-impl-workflow.js'
      );

      await expect(
        runSpecImplStart({ featureName: 'user-auth' }),
      ).rejects.toThrow(JiraInfoNotFoundError);
    });
  });

  describe('runSpecImplComplete', () => {
    beforeEach(() => {
      mockPullsCreate.mockResolvedValue({
        data: {
          html_url: 'https://github.com/owner/repo/pull/42',
        },
      });
    });

    it('PR 作成、ステータス変更、コメント追加を実行', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: 'PROJ-123',
        storyKeys: ['PROJ-124'],
        firstStoryKey: 'PROJ-124',
        projectKey: 'PROJ',
        epicUrl: 'https://test.atlassian.net/browse/PROJ-123',
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: true,
        hasEpic: true,
        hasStories: true,
        missing: [],
      });
      mockTransitionIssue.mockResolvedValue(undefined);
      mockAddComment.mockResolvedValue(undefined);

      const { runSpecImplComplete } = await import('../spec-impl-workflow.js');

      const result = await runSpecImplComplete({
        featureName: 'user-auth',
      });

      // PR 作成
      expect(mockPullsCreate).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        title: 'feat: user-auth',
        body: expect.stringContaining('PROJ-123'),
        head: 'feature/user-auth',
        base: 'main',
      });

      // ステータス変更
      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-123',
        'Ready for Review',
      );
      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-124',
        'Ready for Review',
      );

      // コメント追加
      expect(mockAddComment).toHaveBeenCalledWith(
        'PROJ-123',
        expect.stringContaining('https://github.com/owner/repo/pull/42'),
      );

      expect(result.prUrl).toBe('https://github.com/owner/repo/pull/42');
    });

    it('skipJira=true の場合は JIRA 連携をスキップしつつ PR は作成', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: null,
        storyKeys: [],
        firstStoryKey: null,
        projectKey: null,
        epicUrl: null,
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: false,
        hasEpic: false,
        hasStories: false,
        missing: ['Epic', 'Story'],
      });

      const { runSpecImplComplete } = await import('../spec-impl-workflow.js');

      const result = await runSpecImplComplete({
        featureName: 'user-auth',
        skipJira: true,
      });

      expect(mockPullsCreate).toHaveBeenCalled();
      expect(mockTransitionIssue).not.toHaveBeenCalled();
      expect(mockAddComment).not.toHaveBeenCalled();
      expect(result.prUrl).toBe('https://github.com/owner/repo/pull/42');
    });

    it('カスタムブランチ名を使用できる', async () => {
      mockGetJiraInfoFromSpec.mockReturnValue({
        epicKey: 'PROJ-123',
        storyKeys: [],
        firstStoryKey: null,
        projectKey: 'PROJ',
        epicUrl: null,
      });
      mockCheckJiraInfoStatus.mockReturnValue({
        hasJiraInfo: true,
        hasEpic: true,
        hasStories: false,
        missing: ['Story'],
      });
      mockTransitionIssue.mockResolvedValue(undefined);

      const { runSpecImplComplete } = await import('../spec-impl-workflow.js');

      await runSpecImplComplete({
        featureName: 'user-auth',
        branchName: 'custom/branch-name',
      });

      expect(mockPullsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          head: 'custom/branch-name',
        }),
      );
    });
  });

  describe('JiraInfoNotFoundError', () => {
    it('正しいエラーメッセージを持つ', async () => {
      const { JiraInfoNotFoundError } = await import(
        '../spec-impl-workflow.js'
      );

      const error = new JiraInfoNotFoundError('user-auth', ['Epic', 'Story']);

      expect(error.name).toBe('JiraInfoNotFoundError');
      expect(error.featureName).toBe('user-auth');
      expect(error.missing).toEqual(['Epic', 'Story']);
      expect(error.message).toContain('user-auth');
      expect(error.message).toContain('Epic, Story');
      expect(error.message).toContain('michi jira:sync');
    });
  });

  // ==========================================================================
  // 旧 API（後方互換性のため維持、非推奨）
  // ==========================================================================

  describe('onSpecImplStart (deprecated)', () => {
    it('JIRAを進行中に移動する', async () => {
      mockTransitionIssue.mockResolvedValueOnce(undefined);

      const { onSpecImplStart } = await import('../spec-impl-workflow.js');

      await onSpecImplStart({
        featureName: 'user-auth',
        jiraKey: 'PROJ-123',
      });

      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-123',
        'In Progress',
      );
    });

    it('JIRA認証情報が不足している場合はエラー', async () => {
      delete process.env.ATLASSIAN_API_TOKEN;

      // モジュールを再インポート
      vi.resetModules();
      const { onSpecImplStart } = await import('../spec-impl-workflow.js');

      await expect(
        onSpecImplStart({
          featureName: 'user-auth',
          jiraKey: 'PROJ-123',
        }),
      ).rejects.toThrow(/Missing JIRA credentials/);
    });
  });

  describe('onSpecImplEnd', () => {
    beforeEach(() => {
      // PRの作成をモック
      mockPullsCreate.mockResolvedValue({
        data: {
          html_url: 'https://github.com/owner/repo/pull/42',
        },
      });
    });

    it('PR作成、ステータス変更、コメント追加を実行', async () => {
      mockTransitionIssue.mockResolvedValueOnce(undefined);
      mockAddComment.mockResolvedValueOnce(undefined);

      const { onSpecImplEnd } = await import('../spec-impl-workflow.js');

      const result = await onSpecImplEnd({
        featureName: 'user-auth',
        jiraKey: 'PROJ-123',
      });

      // PR URLが返される
      expect(result.prUrl).toBe('https://github.com/owner/repo/pull/42');

      // PR作成の検証
      expect(mockPullsCreate).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        title: 'feat: user-auth',
        body: expect.stringContaining('PROJ-123'),
        head: 'feature/user-auth',
        base: 'main',
      });

      // JIRAステータス変更の検証
      expect(mockTransitionIssue).toHaveBeenCalledWith(
        'PROJ-123',
        'Ready for Review',
      );

      // コメント追加の検証
      expect(mockAddComment).toHaveBeenCalledWith(
        'PROJ-123',
        expect.stringContaining('https://github.com/owner/repo/pull/42'),
      );
    });

    it('カスタムブランチ名を使用できる', async () => {
      mockTransitionIssue.mockResolvedValueOnce(undefined);
      mockAddComment.mockResolvedValueOnce(undefined);

      const { onSpecImplEnd } = await import('../spec-impl-workflow.js');

      await onSpecImplEnd({
        featureName: 'user-auth',
        jiraKey: 'PROJ-123',
        branchName: 'custom/branch-name',
      });

      expect(mockPullsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          head: 'custom/branch-name',
        }),
      );
    });

    it('GitHub認証情報が不足している場合はエラー', async () => {
      delete process.env.GITHUB_TOKEN;

      vi.resetModules();
      const { onSpecImplEnd } = await import('../spec-impl-workflow.js');

      await expect(
        onSpecImplEnd({
          featureName: 'user-auth',
          jiraKey: 'PROJ-123',
        }),
      ).rejects.toThrow(/Missing GitHub credentials/);
    });

    // 注意: 旧 API (onSpecImplEnd) は JIRA エラーをキャッチせずスローします。
    // 新 API (runSpecImplComplete) は JIRA エラーを警告として扱い、PR URL を返します。
    // 旧 API を使用する場合は、呼び出し側でエラーハンドリングが必要です。
  });
});
