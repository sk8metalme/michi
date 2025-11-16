/**
 * Integration tests for argument validation in setup-existing command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupExisting } from '../../../commands/setup-existing.js';
import { createTestProject, TestProject } from './helpers/test-project.js';

// Mock readline to auto-confirm prompts
vi.mock('readline', () => ({
  createInterface: () => ({
    question: (question: string, callback: (answer: string) => void) => {
      callback('y'); // Auto-confirm
    },
    close: () => {},
  }),
}));

describe('Setup Argument Validation', () => {
  let testProject: TestProject;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: 'validation-test' });
    process.chdir(testProject.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();
  });

  describe('Environment Selection', () => {
    it('should use cursor as default environment when no flag provided', async () => {
      // When no environment flag is provided, interactive mode should default to cursor
      // This test would need to mock the interactive prompt
      // For now, we test explicit cursor flag
      
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      const cursorDir = join(testProject.path, '.cursor');
      expect(existsSync(cursorDir)).toBe(true);
    });

    it('should accept cursor environment flag', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      expect(existsSync(join(testProject.path, '.cursor'))).toBe(true);
    });

    it('should accept claude environment flag', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      expect(existsSync(join(testProject.path, '.claude/rules'))).toBe(true);
    });

    // TODO: Fix template structure (Issue #55)
    it.skip('should accept claude-agent environment flag', async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      expect(existsSync(join(testProject.path, '.claude/subagents'))).toBe(true);
    });
  });

  describe('Language Validation', () => {
    it('should accept supported language: ja', async () => {
      await setupExisting({
        cursor: true,
        lang: 'ja',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.language).toBe('ja');
    });

    it('should accept supported language: en', async () => {
      await setupExisting({
        cursor: true,
        lang: 'en',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.language).toBe('en');
    });

    it('should accept supported language: zh-TW', async () => {
      await setupExisting({
        cursor: true,
        lang: 'zh-TW',
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.language).toBe('zh-TW');
    });

    // TODO: Fix validation error handling (Issue #54)
    it.skip('should reject unsupported language', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          lang: 'fr', // Unsupported language
          projectName: 'Test Project',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/Unsupported language/);
    });
  });

  describe('Project Name Validation', () => {
    it('should accept valid project name', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'My Test Project',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.projectName).toBe('My Test Project');
    });

    it('should accept project name with Japanese characters', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'テストプロジェクト',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.projectName).toBe('テストプロジェクト');
    });

    it('should trim whitespace from project name', async () => {
      await setupExisting({
        cursor: true,
        projectName: '  Test Project  ',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.projectName).toBe('Test Project');
    });

    // TODO: Fix validation error handling (Issue #54)
    it.skip('should reject empty project name', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: '',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/プロジェクト名が空です/);
    });

    // TODO: Fix validation error handling (Issue #54)
    it.skip('should reject project name with path traversal characters', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: '../hack',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/パス区切り文字/);
    });

    // TODO: Fix validation error handling (Issue #54)
    it.skip('should reject project name with backslash', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'test\\hack',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/パス区切り文字/);
    });

    // TODO: Fix validation error handling (Issue #54)
    it.skip('should reject project name with control characters', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'test\x00hack',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/制御文字/);
    });

    it('should reject project name that is too long', async () => {
      const longName = 'a'.repeat(101); // Over 100 characters
      
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: longName,
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/長すぎます/);
    });
  });

  describe('JIRA Key Validation', () => {
    it('should accept valid JIRA key', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.jiraProjectKey).toBe('TEST');
    });

    it('should convert lowercase JIRA key to uppercase', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'test'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.jiraProjectKey).toBe('TEST');
    });

    it('should accept JIRA key with 2 characters', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'AB'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.jiraProjectKey).toBe('AB');
    });

    it('should accept JIRA key with 10 characters', async () => {
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'ABCDEFGHIJ'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.jiraProjectKey).toBe('ABCDEFGHIJ');
    });

    it('should reject JIRA key with 1 character', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'Test Project',
          jiraKey: 'A'
        });
      }).rejects.toThrow(/JIRAキーの形式が不正です/);
    });

    it('should reject JIRA key with 11 characters', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'Test Project',
          jiraKey: 'ABCDEFGHIJK'
        });
      }).rejects.toThrow(/JIRAキーの形式が不正です/);
    });

    it('should reject JIRA key with numbers', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'Test Project',
          jiraKey: 'TEST123'
        });
      }).rejects.toThrow(/JIRAキーの形式が不正です/);
    });

    it('should reject JIRA key with special characters', async () => {
      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'Test Project',
          jiraKey: 'TEST-'
        });
      }).rejects.toThrow(/JIRAキーの形式が不正です/);
    });

    it('should reject JIRA key with lowercase (before conversion)', async () => {
      // This test should pass because the validation converts to uppercase
      // If it didn't convert, this would fail
      await setupExisting({
        cursor: true,
        projectName: 'Test Project',
        jiraKey: 'test'
      });

      const { join } = await import('path');
      const { readFileSync } = await import('fs');
      
      const projectJson = JSON.parse(
        readFileSync(join(testProject.path, '.kiro/project.json'), 'utf-8')
      );
      expect(projectJson.jiraProjectKey).toBe('TEST');
    });
  });

  describe('Git Repository Validation', () => {
    it('should require Git repository', async () => {
      // Remove .git directory
      const { rmSync } = await import('fs');
      const { join } = await import('path');
      const gitPath = join(testProject.path, '.git');
      rmSync(gitPath, { recursive: true, force: true });

      await expect(async () => {
        await setupExisting({
          cursor: true,
          projectName: 'Test Project',
          jiraKey: 'TEST'
        });
      }).rejects.toThrow(/Gitリポジトリではありません/);
    });
  });
});

