/**
 * Tests for multi-repo:sync command
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { multiRepoConfluenceSync } from '../multi-repo-confluence-sync.js';
import * as fs from 'fs';
import * as configLoader from '../../../scripts/utils/config-loader.js';

vi.mock('fs');
vi.mock('../../../scripts/utils/config-loader.js');

// ConfluenceClientのモックインスタンス
const mockClientInstance = {
  searchPage: vi.fn(),
  createPage: vi.fn(),
  createPageUnderParent: vi.fn(),
  updatePage: vi.fn(),
};

vi.mock('../../../scripts/confluence-sync.js', () => ({
  ConfluenceClient: class {
    constructor() {
      return mockClientInstance as any;
    }
  },
  getConfluenceConfig: vi.fn(() => ({
    url: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
    space: 'TEST',
  })),
}));

describe('multiRepoConfluenceSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトの環境変数モック
    process.env.ATLASSIAN_URL = 'https://test.atlassian.net';
    process.env.ATLASSIAN_EMAIL = 'test@example.com';
    process.env.ATLASSIAN_API_TOKEN = 'test-token';

    // ConfluenceClientのメソッドのデフォルト動作を設定
    mockClientInstance.searchPage.mockResolvedValue(null);
    mockClientInstance.createPage.mockResolvedValue({
      id: 'parent-page-id',
      title: 'test-project',
      type: 'page',
      version: { number: 1 },
    });
    mockClientInstance.createPageUnderParent.mockResolvedValue({
      id: 'doc-page-id',
      title: 'test-project - Requirements',
      type: 'page',
      version: { number: 1 },
    });
    mockClientInstance.updatePage.mockResolvedValue({
      id: 'doc-page-id',
      title: 'test-project - Requirements',
      type: 'page',
      version: { number: 2 },
    });
  });

  describe('引数バリデーション', () => {
    it('プロジェクトが存在しない場合はエラー', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: []
      } as any);

      await expect(
        multiRepoConfluenceSync('non-existent-project')
      ).rejects.toThrow('Project not found: non-existent-project');
    });

    it('Confluence認証情報が設定されていない場合はエラー', async () => {
      delete process.env.ATLASSIAN_URL;
      delete process.env.ATLASSIAN_EMAIL;
      delete process.env.ATLASSIAN_API_TOKEN;

      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{ name: 'test-project', jiraKey: 'TEST', confluenceSpace: 'TEST' }]
      } as any);

      await expect(
        multiRepoConfluenceSync('test-project')
      ).rejects.toThrow('Confluence credentials not configured');
    });

    it('無効なドキュメントタイプの場合はエラー', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{ name: 'test-project', jiraKey: 'TEST', confluenceSpace: 'TEST' }]
      } as any);

      await expect(
        multiRepoConfluenceSync('test-project', { docType: 'invalid-doc' as any })
      ).rejects.toThrow('Invalid document type: invalid-doc');
    });
  });

  describe('単一ドキュメント同期', () => {
    it('指定されたドキュメントのみを同期', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Requirements\n\nTest content');

      const result = await multiRepoConfluenceSync('test-project', { docType: 'requirements' });

      expect(result.syncedDocs).toHaveLength(1);
      expect(result.syncedDocs[0].docType).toBe('requirements');
      expect(result.syncedDocs[0].success).toBe(true);
    });

    it('ドキュメントファイルが存在しない場合はスキップ', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await multiRepoConfluenceSync('test-project', { docType: 'requirements' });

      expect(result.syncedDocs).toHaveLength(1);
      expect(result.syncedDocs[0].success).toBe(false);
      expect(result.syncedDocs[0].error).toContain('not found');
    });
  });

  describe('全ドキュメント同期', () => {
    it('全ドキュメントタイプを同期', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Test\n\nContent');

      const result = await multiRepoConfluenceSync('test-project');

      expect(result.syncedDocs.length).toBeGreaterThan(1);
      expect(result.syncedDocs.some(d => d.docType === 'requirements')).toBe(true);
      expect(result.syncedDocs.some(d => d.docType === 'architecture')).toBe(true);
    });

    it('存在するドキュメントのみ同期（存在しないものはスキップ）', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      // requirements.md のみ存在
      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        return (path as string).includes('requirements.md');
      });

      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Requirements\n\nContent');

      const result = await multiRepoConfluenceSync('test-project');

      const successDocs = result.syncedDocs.filter(d => d.success);
      const failedDocs = result.syncedDocs.filter(d => !d.success);

      expect(successDocs.length).toBe(1);
      expect(successDocs[0].docType).toBe('requirements');
      expect(failedDocs.length).toBeGreaterThan(0);
    });
  });

  describe('Mermaid変換', () => {
    it('Mermaidブロックが変換される', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(`
# Architecture

\`\`\`mermaid
graph TD
  A --> B
\`\`\`
      `);

      const result = await multiRepoConfluenceSync('test-project', { docType: 'architecture' });

      expect(result.syncedDocs[0].success).toBe(true);
      // Mermaid変換が行われたことを確認（実際のConfluenceマクロ形式になっている）
      expect(result.syncedDocs[0].confluenceContent).toContain('<ac:structured-macro ac:name="mermaid">');
    });
  });

  describe('エラーハンドリング', () => {
    it('Confluence API エラー時はエラー情報を返す', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Test\n\nContent');

      // Confluence API エラーをシミュレート
      mockClientInstance.createPage.mockRejectedValue(
        new Error('Confluence API error: 403 Forbidden')
      );

      const result = await multiRepoConfluenceSync('test-project', { docType: 'requirements' });

      expect(result.syncedDocs[0].success).toBe(false);
      expect(result.syncedDocs[0].error).toContain('Confluence API error');
    });

    it('複数ドキュメント同期時、一部失敗しても処理継続', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      // requirements.md と architecture.md のみ存在
      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        return (path as string).includes('requirements.md') ||
               (path as string).includes('architecture.md');
      });

      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Test\n\nContent');

      // Confluence API エラーをシミュレート（一部失敗）
      let callCount = 0;
      mockClientInstance.createPage.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 最初の呼び出し（親ページ作成）は成功
          return Promise.resolve({
            id: 'parent-page-id',
            title: 'test-project',
            type: 'page',
            version: { number: 1 },
          });
        }
        // 2回目以降はエラー
        return Promise.reject(new Error('Confluence API error: 403 Forbidden'));
      });

      const result = await multiRepoConfluenceSync('test-project');

      const successDocs = result.syncedDocs.filter(d => d.success);
      const failedDocs = result.syncedDocs.filter(d => !d.success);

      expect(successDocs.length).toBeGreaterThanOrEqual(1);
      expect(failedDocs.length).toBeGreaterThan(0);
    });
  });

  describe('Confluenceページ階層構造', () => {
    it('ページ階層が {SPACE}/{project-name}/{doc-type} となる', async () => {
      vi.spyOn(configLoader, 'getConfig').mockReturnValue({
        multiRepoProjects: [{
          name: 'test-project',
          jiraKey: 'TEST',
          confluenceSpace: 'TEST',
          repositories: []
        }]
      } as any);

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('# Requirements\n\nContent');

      const result = await multiRepoConfluenceSync('test-project', { docType: 'requirements' });

      expect(result.syncedDocs[0].pageTitle).toContain('test-project');
      expect(result.syncedDocs[0].pageTitle).toContain('Requirements');
    });
  });
});
