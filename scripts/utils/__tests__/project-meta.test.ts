/**
 * project-meta.test.ts
 * プロジェクトメタデータユーティリティのテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { loadProjectMeta, getRepositoryInfo } from '../project-meta.js';

describe('project-meta', () => {
  const testRoot = join(process.cwd(), '.test-tmp-project-meta');

  beforeEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
    mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  describe('loadProjectMeta', () => {
    it('正しいproject.jsonを読み込める', () => {
      const kiroDir = join(testRoot, '.kiro');
      mkdirSync(kiroDir, { recursive: true });

      const projectMeta = {
        projectId: 'test-project',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['label1', 'label2'],
        status: 'active' as const,
        team: ['member1'],
        stakeholders: ['stakeholder1'],
        repository: 'https://github.com/owner/repo.git',
      };

      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectMeta, null, 2));

      const result = loadProjectMeta(testRoot);

      expect(result).toEqual(projectMeta);
    });

    it('project.jsonが存在しない場合はエラー', () => {
      expect(() => loadProjectMeta(testRoot)).toThrow('Project metadata not found');
    });

    it('.kiroディレクトリが存在しない場合はエラー', () => {
      expect(() => loadProjectMeta(testRoot)).toThrow('Project metadata not found');
    });

    it('不正なJSON形式の場合はエラー', () => {
      const kiroDir = join(testRoot, '.kiro');
      mkdirSync(kiroDir, { recursive: true });
      writeFileSync(join(kiroDir, 'project.json'), 'invalid json');

      expect(() => loadProjectMeta(testRoot)).toThrow('Invalid JSON');
    });

    it('必須フィールド projectName が欠けている場合はエラー', () => {
      const kiroDir = join(testRoot, '.kiro');
      mkdirSync(kiroDir, { recursive: true });

      const invalidMeta = {
        projectId: 'test-project',
        // projectName missing
        jiraProjectKey: 'TEST',
        confluenceLabels: ['label1'],
        status: 'active',
        team: [],
        stakeholders: [],
        repository: 'https://github.com/owner/repo.git',
      };

      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(invalidMeta));

      expect(() => loadProjectMeta(testRoot)).toThrow('Required field missing');
    });

    it('必須フィールド confluenceLabels が欠けている場合はエラー', () => {
      const kiroDir = join(testRoot, '.kiro');
      mkdirSync(kiroDir, { recursive: true });

      const invalidMeta = {
        projectId: 'test-project',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        // confluenceLabels missing
        status: 'active',
        team: [],
        stakeholders: [],
        repository: 'https://github.com/owner/repo.git',
      };

      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(invalidMeta));

      expect(() => loadProjectMeta(testRoot)).toThrow('Required field missing');
    });
  });

  describe('getRepositoryInfo', () => {
    const createValidProjectMeta = (repository: string) => ({
      projectId: 'test-project',
      projectName: 'Test Project',
      jiraProjectKey: 'TEST',
      confluenceLabels: ['label1'],
      status: 'active' as const,
      team: [],
      stakeholders: [],
      repository,
    });

    beforeEach(() => {
      const kiroDir = join(testRoot, '.kiro');
      mkdirSync(kiroDir, { recursive: true });
    });

    it('HTTPS URL (.git付き) から owner/repo を抽出できる', () => {
      const projectMeta = createValidProjectMeta('https://github.com/owner/repo.git');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      const result = getRepositoryInfo(testRoot);
      expect(result).toBe('owner/repo');
    });

    it('HTTPS URL (.gitなし) から owner/repo を抽出できる', () => {
      const projectMeta = createValidProjectMeta('https://github.com/owner/repo');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      const result = getRepositoryInfo(testRoot);
      expect(result).toBe('owner/repo');
    });

    it('SSH URL (.git付き) から owner/repo を抽出できる', () => {
      const projectMeta = createValidProjectMeta('git@github.com:owner/repo.git');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      const result = getRepositoryInfo(testRoot);
      expect(result).toBe('owner/repo');
    });

    it('SSH URL (.gitなし) から owner/repo を抽出できる', () => {
      const projectMeta = createValidProjectMeta('git@github.com:owner/repo');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      const result = getRepositoryInfo(testRoot);
      expect(result).toBe('owner/repo');
    });

    it('repository フィールドが存在しない場合はエラー', () => {
      const projectMeta = {
        projectId: 'test-project',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['label1'],
        status: 'active' as const,
        team: [],
        stakeholders: [],
        repository: '',
      };

      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      expect(() => getRepositoryInfo(testRoot)).toThrow('Repository information not found');
    });

    it('不正な repository 形式の場合はエラー', () => {
      const projectMeta = createValidProjectMeta('https://example.com/not-github/repo.git');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      expect(() => getRepositoryInfo(testRoot)).toThrow('Invalid GitHub repository format');
    });

    it('owner/repo にハイフンが含まれる場合も正しく抽出できる', () => {
      const projectMeta = createValidProjectMeta('https://github.com/my-org/my-repo.git');
      writeFileSync(join(testRoot, '.kiro/project.json'), JSON.stringify(projectMeta));

      const result = getRepositoryInfo(testRoot);
      expect(result).toBe('my-org/my-repo');
    });

    it('project.jsonが存在しない場合はエラー', () => {
      expect(() => getRepositoryInfo(testRoot)).toThrow('Project metadata not found');
    });
  });
});
