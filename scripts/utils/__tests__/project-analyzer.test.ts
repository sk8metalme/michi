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

    it('should reject path traversal attacks in projectId (..)', () => {
      // Setup: malicious projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: '../tmp/evil',
        projectName: 'Evil Project',
        jiraProjectKey: 'EVIL',
        confluenceLabels: ['test']
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('Invalid projectId');
      }
    });

    it('should reject path traversal attacks in projectId (/)', () => {
      // Setup: malicious projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: 'foo/bar',
        projectName: 'Evil Project',
        jiraProjectKey: 'EVIL',
        confluenceLabels: ['test']
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('Invalid projectId');
      }
    });

    it('should reject path traversal attacks in projectId (\\)', () => {
      // Setup: malicious projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: 'foo\\bar',
        projectName: 'Evil Project',
        jiraProjectKey: 'EVIL',
        confluenceLabels: ['test']
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('Invalid projectId');
      }
    });

    it('should reject empty projectId', () => {
      // Setup: empty projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: '   ',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['test']
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('Invalid projectId');
      }
    });

    it('should reject projectId with invalid characters', () => {
      // Setup: invalid characters in projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: 'test@project!',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['test']
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('Invalid projectId');
      }
    });

    it('should accept valid projectId with alphanumeric, hyphens, and underscores', () => {
      // Setup: valid projectId
      const kiroDir = join(testDir, '.kiro');
      mkdirSync(kiroDir);
      const projectJson = {
        projectId: 'Valid-Project_123',
        projectName: 'Test Project',
        jiraProjectKey: 'TEST',
        confluenceLabels: ['test'],
        status: 'active',
        team: [],
        stakeholders: [],
        repository: ''
      };
      writeFileSync(join(kiroDir, 'project.json'), JSON.stringify(projectJson));

      // Execute
      const result = analyzer.getProjectMetadata(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.projectId).toBe('Valid-Project_123');
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

    it('should detect pnpm as package manager', () => {
      // Setup: create package.json with pnpm-lock.yaml
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        devDependencies: { jest: '^29.0.0' }
      }));
      writeFileSync(join(testDir, 'pnpm-lock.yaml'), '');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.packageManager).toBe('pnpm');
        expect(result.value.testFramework).toBe('jest');
      }
    });

    it('should detect yarn as package manager', () => {
      // Setup: create package.json with yarn.lock
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        devDependencies: { mocha: '^10.0.0' }
      }));
      writeFileSync(join(testDir, 'yarn.lock'), '');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.packageManager).toBe('yarn');
        expect(result.value.testFramework).toBe('mocha');
      }
    });

    it('should handle invalid package.json', () => {
      // Setup: create invalid package.json
      writeFileSync(join(testDir, 'package.json'), '{ invalid json }');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('InvalidJSON');
      }
    });

    it('should detect Gradle project', () => {
      // Setup: create build.gradle
      writeFileSync(join(testDir, 'build.gradle'), 'plugins { id "java" }');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('java');
        expect(result.value.buildTool).toBe('gradle');
        expect(result.value.testFramework).toBe('junit');
      }
    });

    it('should detect Maven project', () => {
      // Setup: create pom.xml
      writeFileSync(join(testDir, 'pom.xml'), '<project></project>');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('java');
        expect(result.value.buildTool).toBe('maven');
        expect(result.value.testFramework).toBe('junit');
      }
    });

    it('should detect PHP project with PHPUnit', () => {
      // Setup: create composer.json
      writeFileSync(join(testDir, 'composer.json'), JSON.stringify({
        name: 'test/project',
        'require-dev': { 'phpunit/phpunit': '^9.0' }
      }));

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('php');
        expect(result.value.buildTool).toBe('composer');
        expect(result.value.testFramework).toBe('phpunit');
      }
    });

    it('should handle invalid composer.json', () => {
      // Setup: create invalid composer.json
      writeFileSync(join(testDir, 'composer.json'), '{ invalid json }');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].type).toBe('InvalidJSON');
      }
    });

    it('should detect Python project with pytest', () => {
      // Setup: create pyproject.toml
      writeFileSync(join(testDir, 'pyproject.toml'), '[tool.poetry]\nname = "test"\n\n[tool.poetry.dev-dependencies]\npytest = "^7.0"');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('python');
        expect(result.value.buildTool).toBe('poetry or uv');
        expect(result.value.testFramework).toBe('pytest');
      }
    });

    it('should detect Python project with requirements.txt', () => {
      // Setup: create requirements.txt
      writeFileSync(join(testDir, 'requirements.txt'), 'pytest==7.0.0');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('python');
        expect(result.value.buildTool).toBe('pip');
        expect(result.value.testFramework).toBe('pytest');
      }
    });

    it('should detect Go project', () => {
      // Setup: create go.mod
      writeFileSync(join(testDir, 'go.mod'), 'module example.com/test');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('go');
        expect(result.value.buildTool).toBe('go');
        expect(result.value.testFramework).toBe('testing');
      }
    });

    it('should detect Rust project', () => {
      // Setup: create Cargo.toml
      writeFileSync(join(testDir, 'Cargo.toml'), '[package]\nname = "test"');

      // Execute
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('rust');
        expect(result.value.buildTool).toBe('cargo');
        expect(result.value.testFramework).toBe('cargo-test');
      }
    });

    it('should detect unknown project without CI', () => {
      // Execute (no files created)
      const result = analyzer.getProjectInfo(testDir);

      // Verify
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.language).toBe('unknown');
        expect(result.value.buildTool).toBe('unknown');
        expect(result.value.hasCI).toBe(false);
        expect(result.value.hasDependencies).toBe(false);
      }
    });
  });
});
