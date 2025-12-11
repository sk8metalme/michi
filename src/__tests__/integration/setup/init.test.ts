/**
 * Integration tests for michi init command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';
import { homedir } from 'os';
import { initProject } from '../../../commands/init.js';
import { createTestProject, TestProject } from './helpers/test-project.js';
import {
  assertDirectoryExists,
  assertFileExists,
  assertDirectoryStructure,
  assertFileContains,
} from './helpers/fs-assertions.js';

// Mock readline to auto-confirm prompts
vi.mock('readline', () => ({
  createInterface: () => ({
    question: (question: string, callback: (answer: string) => void) => {
      // Auto-confirm with 'y' or provide default values
      if (question.includes('続行しますか')) {
        callback('y');
      } else if (question.includes('選択')) {
        callback('1'); // Cursor IDE
      } else {
        callback(''); // Use defaults
      }
    },
    close: () => {},
  }),
}));

describe('michi init command', () => {
  let testProject: TestProject;
  let originalCwd: string;
  let globalConfigPath: string;
  let globalConfigBackup: string | null = null;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: 'init-test' });
    process.chdir(testProject.path);

    // Setup global config path
    globalConfigPath = join(homedir(), '.michi', 'config.json');

    // Backup existing global config if it exists
    if (existsSync(globalConfigPath)) {
      globalConfigBackup = readFileSync(globalConfigPath, 'utf-8');
    }
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();

    // Restore global config if it was backed up
    if (globalConfigBackup !== null) {
      mkdirSync(join(homedir(), '.michi'), { recursive: true });
      writeFileSync(globalConfigPath, globalConfigBackup, 'utf-8');
      globalConfigBackup = null;
    } else if (existsSync(globalConfigPath)) {
      // Remove test global config
      rmSync(globalConfigPath, { force: true });
    }
  });

  describe('Basic Setup', () => {
    it('should create .kiro directory structure', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      assertDirectoryStructure(testProject.path, {
        '.kiro': 'dir',
        '.kiro/settings': 'dir',
        '.kiro/settings/templates': 'dir',
        '.kiro/steering': 'dir',
        '.kiro/specs': 'dir',
      });
    });

    it('should create project.json with correct metadata', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      assertFileExists(projectJsonPath);

      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      expect(projectJson.projectId).toBe('test-project');
      expect(projectJson.projectName).toBe('Test Project');
      expect(projectJson.jiraProjectKey).toBe('TEST');
      expect(projectJson.language).toBe('ja');
      expect(projectJson.status).toBe('active');
      expect(Array.isArray(projectJson.confluenceLabels)).toBe(true);
      expect(projectJson.confluenceLabels.length).toBeGreaterThan(0);
    });

    it('should create .env template with correct content', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const envPath = join(testProject.path, '.env');
      assertFileExists(envPath);
      assertFileContains(envPath, 'ATLASSIAN_URL=');
      assertFileContains(envPath, 'JIRA_PROJECT_KEYS=TEST');
      assertFileContains(envPath, 'GITHUB_ORG=');
      assertFileContains(envPath, 'CONFLUENCE_PRD_SPACE=');
    });

    it('should not overwrite existing .env file', async () => {
      // Create existing .env
      const existingEnvContent = 'EXISTING_VAR=value\n';
      writeFileSync(join(testProject.path, '.env'), existingEnvContent, 'utf-8');

      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const envPath = join(testProject.path, '.env');
      const content = readFileSync(envPath, 'utf-8');
      expect(content).toBe(existingEnvContent);
    });
  });

  describe('Workflow Configuration', () => {
    it('should copy global config if it exists', async () => {
      // Create temporary global config
      const globalConfigDir = join(homedir(), '.michi');
      mkdirSync(globalConfigDir, { recursive: true });

      const globalConfig = {
        confluence: { pageCreationGranularity: 'single' },
        jira: { createEpic: true, storyCreationGranularity: 'all' },
        workflow: { enabledPhases: ['requirements', 'design', 'tasks'] },
      };

      writeFileSync(
        globalConfigPath,
        JSON.stringify(globalConfig, null, 2),
        'utf-8'
      );

      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
      });

      const projectConfigPath = join(testProject.path, '.michi/config.json');
      assertFileExists(projectConfigPath);

      const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf-8'));
      expect(projectConfig).toEqual(globalConfig);
    });

    it('should create default config if no global config exists', async () => {
      // Ensure no global config exists
      if (existsSync(globalConfigPath)) {
        rmSync(globalConfigPath, { force: true });
      }

      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
      });

      const projectConfigPath = join(testProject.path, '.michi/config.json');
      assertFileExists(projectConfigPath);

      const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf-8'));
      expect(projectConfig.confluence).toBeDefined();
      expect(projectConfig.jira).toBeDefined();
      expect(projectConfig.workflow).toBeDefined();
    });

    it('should skip workflow config when --skip-config is specified', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectConfigPath = join(testProject.path, '.michi/config.json');
      expect(existsSync(projectConfigPath)).toBe(false);
    });
  });

  describe('Template Copying', () => {
    it('should skip template copying when --michi-path is not specified', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      // Without --michi-path, only basic structure should be created
      assertDirectoryExists(join(testProject.path, '.kiro'));

      // Templates should be empty
      const steeringFiles = ['product.md', 'tech.md', 'structure.md'];
      for (const file of steeringFiles) {
        expect(existsSync(join(testProject.path, '.kiro/steering', file))).toBe(false);
      }
    });
  });

  describe('Environment Selection', () => {
    it('should work with --cursor option', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      assertDirectoryExists(join(testProject.path, '.kiro'));
      assertFileExists(join(testProject.path, '.kiro/project.json'));
    });

    it('should work with --claude option', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        claude: true,
        skipConfig: true,
      });

      assertDirectoryExists(join(testProject.path, '.kiro'));
      assertFileExists(join(testProject.path, '.kiro/project.json'));
    });
  });

  describe('Validation', () => {
    it('should reject invalid project ID', async () => {
      await expect(
        initProject({
          name: 'invalid/project',
          projectName: 'Test Project',
          jiraKey: 'TEST',
          yes: true,
          cursor: true,
          skipConfig: true,
        })
      ).rejects.toThrow('無効なプロジェクトID');
    });

    it('should reject missing project name', async () => {
      await expect(
        initProject({
          name: 'test-project',
          projectName: '',
          jiraKey: 'TEST',
          yes: true,
          cursor: true,
          skipConfig: true,
        })
      ).rejects.toThrow('プロジェクト名');
    });

    it('should reject invalid JIRA key format', async () => {
      await expect(
        initProject({
          name: 'test-project',
          projectName: 'Test Project',
          jiraKey: 'invalid-key',
          yes: true,
          cursor: true,
          skipConfig: true,
        })
      ).rejects.toThrow('JIRAキーの形式が不正');
    });

    it('should normalize JIRA key to uppercase', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'test',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      expect(projectJson.jiraProjectKey).toBe('TEST');
    });
  });

  describe('Language Support', () => {
    it('should use default language (ja) when not specified', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      expect(projectJson.language).toBe('ja');
    });

    it('should use specified language', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
        lang: 'en',
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
      expect(projectJson.language).toBe('en');
    });
  });

  describe('GitHub URL Detection', () => {
    it('should detect GitHub URL from git remote', async () => {
      await initProject({
        name: 'test-project',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));

      // Should have a repository URL
      expect(projectJson.repository).toBeDefined();
      expect(typeof projectJson.repository).toBe('string');
      expect(projectJson.repository.length).toBeGreaterThan(0);
    });
  });

  describe('Confluence Labels', () => {
    it('should generate project label from project ID', async () => {
      await initProject({
        name: 'test-project-123',
        projectName: 'Test Project',
        jiraKey: 'TEST',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));

      expect(projectJson.confluenceLabels).toContain('project:test-project-123');
    });

    it('should generate service label for hyphenated project IDs', async () => {
      await initProject({
        name: 'project-api',
        projectName: 'Project API',
        jiraKey: 'PROJ',
        yes: true,
        cursor: true,
        skipConfig: true,
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));

      expect(projectJson.confluenceLabels).toContain('project:project-api');
      expect(projectJson.confluenceLabels).toContain('service:api');
    });
  });
});
