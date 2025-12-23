/**
 * Multi-Repo設定スキーマのテスト
 * Task 1.1: Multi-Repo設定のZodスキーマを定義
 */

import { describe, it, expect } from 'vitest';
import {
  RepositorySchema,
  MultiRepoProjectSchema,
} from '../config/config-schema';

describe('RepositorySchema', () => {
  describe('正常ケース', () => {
    it('有効なリポジトリ情報を受け入れる', () => {
      const validRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
      };

      const result = RepositorySchema.safeParse(validRepo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRepo);
      }
    });

    it('branchのデフォルト値は"main"', () => {
      const repoWithoutBranch = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
      };

      const result = RepositorySchema.safeParse(repoWithoutBranch);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('main');
      }
    });

    it('localPathが未指定の場合も受け入れる（オプショナル）', () => {
      const repoWithoutLocalPath = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
      };

      const result = RepositorySchema.safeParse(repoWithoutLocalPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.localPath).toBeUndefined();
      }
    });

    it('Unix絶対パス（/path/to/repo）を受け入れる', () => {
      const repoWithUnixPath = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: '/Users/user/repos/my-repo',
      };

      const result = RepositorySchema.safeParse(repoWithUnixPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.localPath).toBe('/Users/user/repos/my-repo');
      }
    });

    it('Windows絶対パス（C:\\path\\to\\repo）を受け入れる', () => {
      const repoWithWindowsPath = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: 'C:\\Users\\user\\repos\\my-repo',
      };

      const result = RepositorySchema.safeParse(repoWithWindowsPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.localPath).toBe('C:\\Users\\user\\repos\\my-repo');
      }
    });
  });

  describe('異常ケース', () => {
    it('リポジトリ名が空文字列の場合はエラー', () => {
      const invalidRepo = {
        name: '',
        url: 'https://github.com/owner/repo',
        branch: 'main',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('無効なGitHub URL形式の場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://gitlab.com/owner/repo', // GitLabは非対応
        branch: 'main',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('URLにhttps以外のプロトコルが含まれる場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'http://github.com/owner/repo', // httpは非対応
        branch: 'main',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });
  });

  describe('localPathバリデーション', () => {
    it('相対パス（./repo）を含む場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: './repos/my-repo',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('相対パス（../repo）を含む場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: '../repos/my-repo',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('Windowsの相対パス（.\\repo）を含む場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: '.\\repos\\my-repo',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('空文字列の場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: '',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });

    it('相対パス（repo/subdir）を含む場合はエラー', () => {
      const invalidRepo = {
        name: 'my-repo',
        url: 'https://github.com/owner/repo',
        branch: 'main',
        localPath: 'repos/my-repo',
      };

      const result = RepositorySchema.safeParse(invalidRepo);
      expect(result.success).toBe(false);
    });
  });
});

describe('MultiRepoProjectSchema', () => {
  describe('正常ケース', () => {
    it('有効なプロジェクト情報を受け入れる', () => {
      const validProject = {
        name: 'my-project',
        jiraKey: 'PROJ',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [
          {
            name: 'repo1',
            url: 'https://github.com/owner/repo1',
            branch: 'main',
          },
        ],
      };

      const result = MultiRepoProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProject);
      }
    });

    it('repositories配列が空の場合も受け入れる', () => {
      const projectWithoutRepos = {
        name: 'my-project',
        jiraKey: 'PROJ',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = MultiRepoProjectSchema.safeParse(projectWithoutRepos);
      expect(result.success).toBe(true);
    });

    it('日本語のプロジェクト名を受け入れる', () => {
      const validProject = {
        name: 'プロジェクト名',
        jiraKey: 'PROJ',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = MultiRepoProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('ハイフン、アンダースコアを含むプロジェクト名を受け入れる', () => {
      const validProject = {
        name: 'my-project_v2',
        jiraKey: 'PROJ',
        confluenceSpace: 'SPACE',
        createdAt: '2025-12-14T10:00:00Z',
        repositories: [],
      };

      const result = MultiRepoProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });
  });

  describe('プロジェクト名バリデーション', () => {
    const createProject = (name: string) => ({
      name,
      jiraKey: 'PROJ',
      confluenceSpace: 'SPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [],
    });

    it('パストラバーサル（../）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('../etc/passwd'),
      );
      expect(result.success).toBe(false);
    });

    it('パストラバーサル（/）を含む場合はエラー', () => {
      const result =
        MultiRepoProjectSchema.safeParse(createProject('/etc/passwd'));
      expect(result.success).toBe(false);
    });

    it('Windowsパス区切り（\\）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('..\\windows\\system32'),
      );
      expect(result.success).toBe(false);
    });

    it('相対パス（.）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('.'));
      expect(result.success).toBe(false);
    });

    it('相対パス（..）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('..'));
      expect(result.success).toBe(false);
    });

    it('制御文字（\\x00）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\x00name'),
      );
      expect(result.success).toBe(false);
    });

    it('制御文字（\\t）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\tname'),
      );
      expect(result.success).toBe(false);
    });

    it('制御文字（\\n）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\nname'),
      );
      expect(result.success).toBe(false);
    });

    it('制御文字（\\r）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\rname'),
      );
      expect(result.success).toBe(false);
    });

    it('制御文字（\\x1B）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\x1Bname'),
      );
      expect(result.success).toBe(false);
    });

    it('制御文字（\\x7F）を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(
        createProject('project\x7Fname'),
      );
      expect(result.success).toBe(false);
    });

    it('101文字以上のプロジェクト名はエラー', () => {
      const longName = 'a'.repeat(101);
      const result = MultiRepoProjectSchema.safeParse(createProject(longName));
      expect(result.success).toBe(false);
    });

    it('空文字列のプロジェクト名はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject(''));
      expect(result.success).toBe(false);
    });
  });

  describe('JIRAキーバリデーション', () => {
    const createProject = (jiraKey: string) => ({
      name: 'my-project',
      jiraKey,
      confluenceSpace: 'SPACE',
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [],
    });

    it('2-10文字の大文字英字を受け入れる', () => {
      const validKeys = ['AB', 'PROJ', 'TICKET', 'ABCDEFGHIJ'];
      validKeys.forEach((key) => {
        const result = MultiRepoProjectSchema.safeParse(createProject(key));
        expect(result.success).toBe(true);
      });
    });

    it('小文字を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('abc'));
      expect(result.success).toBe(false);
    });

    it('1文字の場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('A'));
      expect(result.success).toBe(false);
    });

    it('11文字以上の場合はエラー', () => {
      const result =
        MultiRepoProjectSchema.safeParse(createProject('ABCDEFGHIJK'));
      expect(result.success).toBe(false);
    });

    it('数字を含む場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('ABC123'));
      expect(result.success).toBe(false);
    });

    it('空文字列の場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject(''));
      expect(result.success).toBe(false);
    });
  });

  describe('Confluenceスペースキーバリデーション', () => {
    const createProject = (confluenceSpace: string) => ({
      name: 'my-project',
      jiraKey: 'PROJ',
      confluenceSpace,
      createdAt: '2025-12-14T10:00:00Z',
      repositories: [],
    });

    it('非空文字列を受け入れる', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject('SPACE'));
      expect(result.success).toBe(true);
    });

    it('空文字列の場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject(''));
      expect(result.success).toBe(false);
    });
  });

  describe('createdAtバリデーション', () => {
    const createProject = (createdAt: string) => ({
      name: 'my-project',
      jiraKey: 'PROJ',
      confluenceSpace: 'SPACE',
      createdAt,
      repositories: [],
    });

    it('ISO 8601形式を受け入れる', () => {
      const validDates = [
        '2025-12-14T10:00:00Z',
        '2025-12-14T10:00:00.000Z',
        '2025-12-14T10:00:00+09:00',
      ];
      validDates.forEach((date) => {
        const result = MultiRepoProjectSchema.safeParse(createProject(date));
        if (!result.success) {
          console.log(`Failed for date: ${date}`);
          console.log('Error:', result.error.issues);
        }
        expect(result.success).toBe(true);
      });
    });

    it('無効な日付形式の場合はエラー', () => {
      const result =
        MultiRepoProjectSchema.safeParse(createProject('2025/12/14 10:00:00'));
      expect(result.success).toBe(false);
    });

    it('空文字列の場合はエラー', () => {
      const result = MultiRepoProjectSchema.safeParse(createProject(''));
      expect(result.success).toBe(false);
    });
  });
});
