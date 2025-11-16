/**
 * Integration tests for Claude environment setup
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { setupExisting } from '../../../commands/setup-existing.js';
import { createTestProject, TestProject } from './helpers/test-project.js';
import {
  assertDirectoryExists,
  assertFileExists,
  assertDirectoryStructure,
  assertFileContains
} from './helpers/fs-assertions.js';

// Mock readline to auto-confirm prompts
vi.mock('readline', () => ({
  createInterface: () => ({
    question: (question: string, callback: (answer: string) => void) => {
      callback('y'); // Auto-confirm
    },
    close: () => {},
  }),
}));

describe('Claude Environment Setup', () => {
  let testProject: TestProject;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: 'claude-test' });
    process.chdir(testProject.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();
  });

  describe('Basic Setup', () => {
    it('should create .claude/rules directory', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      assertDirectoryExists(join(testProject.path, '.claude'));
      assertDirectoryExists(join(testProject.path, '.claude/rules'));
    });

    it('should create .kiro directory structure', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
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
      await setupExisting({
        claude: true,
        projectName: 'Claude Test',
        jiraKey: 'CLAU'
      });

      const projectJsonPath = join(testProject.path, '.kiro/project.json');
      assertFileExists(projectJsonPath);

      assertFileContains(projectJsonPath, '"projectName": "Claude Test"');
      assertFileContains(projectJsonPath, '"jiraProjectKey": "CLAU"');
    });

    it('should create .env template', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const envPath = join(testProject.path, '.env');
      assertFileExists(envPath);
      assertFileContains(envPath, 'JIRA_PROJECT_KEYS=TEST');
    });
  });

  describe('Claude-specific Structure', () => {
    it('should have Claude-specific rules structure', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const rulesDir = join(testProject.path, '.claude/rules');
      assertDirectoryExists(rulesDir);
    });

    it('should not create Cursor-specific directories', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { existsSync } = await import('fs');
      const cursorDir = join(testProject.path, '.cursor');
      
      // .cursor directory should not exist for Claude setup
      expect(existsSync(cursorDir)).toBe(false);
    });
  });

  describe('Language Support', () => {
    it('should support multiple languages', async () => {
      await setupExisting({
        claude: true,
        lang: 'en',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const projectJson = join(testProject.path, '.kiro/project.json');
      assertFileContains(projectJson, '"language": "en"');
    });
  });
});

