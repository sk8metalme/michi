/**
 * ProjectAnalyzer クラスのテスト
 * project-finder, project-detector, language-detector の統合
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ProjectAnalyzer } from '../project-analyzer.js';

describe('ProjectAnalyzer', () => {
  let testDir: string;
  let analyzer: ProjectAnalyzer;

  beforeEach(() => {
    testDir = join(process.cwd(), 'tmp-test-project-analyzer');
    mkdirSync(testDir, { recursive: true });
    analyzer = new ProjectAnalyzer();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('findProjectRoot', () => {
    it('should find repository root with .git directory', () => {
      // Setup: create .git directory
      const gitDir = join(testDir, '.git');
      mkdirSync(gitDir);

      // Execute
      const result = analyzer.findProjectRoot(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(testDir);
      }
    });

    it('should find repository root with projects/ directory', () => {
      // Setup: create projects/ directory
      const projectsDir = join(testDir, 'projects');
      mkdirSync(projectsDir);

      // Execute
      const result = analyzer.findProjectRoot(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(testDir);
      }
    });

    it('should find .git in parent and return that root', () => {
      // Note: testDir is inside the actual git repository
      // So findProjectRoot will traverse up and find the actual .git
      // Execute
      const result = analyzer.findProjectRoot(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        // Should find the actual project root (with .git)
        expect(result.value).toContain('/michi');
      }
    });
  });

  describe('detectLanguage', () => {
    it('should detect Node.js project from package.json', () => {
      // Setup: create package.json
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        devDependencies: { vitest: '^1.0.0' }
      }));

      // Execute
      const result = analyzer.detectLanguage(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('nodejs');
      }
    });

    it('should detect Java project from build.gradle', () => {
      // Setup: create build.gradle
      writeFileSync(join(testDir, 'build.gradle'), 'plugins { id "java" }');

      // Execute
      const result = analyzer.detectLanguage(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('java');
      }
    });

    it('should detect Python project from pyproject.toml', () => {
      // Setup: create pyproject.toml
      writeFileSync(join(testDir, 'pyproject.toml'), '[tool.poetry]');

      // Execute
      const result = analyzer.detectLanguage(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('python');
      }
    });

    it('should return unknown for unrecognized project', () => {
      // Execute
      const result = analyzer.detectLanguage(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('unknown');
      }
    });
  });

  describe('getProjectMetadata', () => {
    it('should load project metadata from .kiro/project.json', () => {
      // Setup: create .kiro/project.json
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: 'test-project',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['test'],
        status: 'active',
        team: ['dev1'],
        stakeholders: ['pm1'],
        repository: 'https://github.com/test/repo'
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.projectId).toBe('test-project');
        expect(result.value.projectName).toBe('Test Project');
        expect(result.value.jiraProjectKey).toBe('TEST');
      }
    });

    it('should return error if .kiro/project.json does not exist', () => {
      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('FileNotFound');
      }
    });

    it('should return error if project.json has invalid JSON', () => {
      // Setup: create .kiro/project.json with invalid JSON
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      writeFileSync(join(kiroDir, 'project.json'), '{ invalid json }');

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('InvalidJSON');
      }
    });
  });

  describe('getProjectInfo (統合)', () => {
    it('should return comprehensive project information', () => {
      // Setup: create package.json and .github/workflows
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        devDependencies: { vitest: '^1.0.0' }
      }));
      const workflowsDir = join(testDir, '.github', 'workflows');
      mkdirSync(workflowsDir, { recursive: true });

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('nodejs');
        expect(result.value.buildTool).toBe('npm');
        expect(result.value.testFramework).toBe('vitest');
        expect(result.value.hasCI).toBe(true);
      }
    });
  });
});
