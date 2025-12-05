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

  describe('Agent Skills Installation', () => {
    let originalHome: string | undefined;
    let tempHome: string;

    beforeEach(() => {
      // Mock HOME environment variable to use a temp directory
      originalHome = process.env.HOME;
      tempHome = join(testProject.path, '.test-home');
      process.env.HOME = tempHome;
    });

    afterEach(() => {
      // Restore original HOME
      if (originalHome !== undefined) {
        process.env.HOME = originalHome;
      } else {
        delete process.env.HOME;
      }
    });

    it('should install skills and agents when --with-agent-skills is specified', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST',
        withAgentSkills: true
      });

      // Verify skills directory
      const skillsDir = join(tempHome, '.claude/skills');
      assertDirectoryExists(skillsDir);
      assertDirectoryExists(join(skillsDir, 'design-review'));
      assertDirectoryExists(join(skillsDir, 'e2e-first-planning'));
      assertDirectoryExists(join(skillsDir, 'oss-license'));
      assertDirectoryExists(join(skillsDir, 'stable-version'));

      // Verify skill files
      assertFileExists(join(skillsDir, 'design-review/SKILL.md'));
      assertFileExists(join(skillsDir, 'e2e-first-planning/SKILL.md'));
      assertFileExists(join(skillsDir, 'oss-license/SKILL.md'));
      assertFileExists(join(skillsDir, 'stable-version/SKILL.md'));

      // Verify agents directory
      const agentsDir = join(tempHome, '.claude/agents');
      assertDirectoryExists(agentsDir);
      assertDirectoryExists(join(agentsDir, 'design-reviewer'));
      assertDirectoryExists(join(agentsDir, 'e2e-first-planner'));
      assertDirectoryExists(join(agentsDir, 'oss-license-checker'));
      assertDirectoryExists(join(agentsDir, 'pr-resolver'));
      assertDirectoryExists(join(agentsDir, 'stable-version-auditor'));

      // Verify agent files
      assertFileExists(join(agentsDir, 'design-reviewer/AGENT.md'));
      assertFileExists(join(agentsDir, 'e2e-first-planner/AGENT.md'));
      assertFileExists(join(agentsDir, 'oss-license-checker/AGENT.md'));
      assertFileExists(join(agentsDir, 'pr-resolver/AGENT.md'));
      assertFileExists(join(agentsDir, 'stable-version-auditor/AGENT.md'));
    });

    it('should not install skills and agents when --with-agent-skills is not specified', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST'
        // withAgentSkills: false (default)
      });

      const { existsSync } = await import('fs');
      const skillsDir = join(tempHome, '.claude/skills');
      const agentsDir = join(tempHome, '.claude/agents');

      // Skills and agents should not be installed
      expect(existsSync(skillsDir)).toBe(false);
      expect(existsSync(agentsDir)).toBe(false);
    });

    it('should verify PROACTIVELY keyword in agent descriptions', async () => {
      await setupExisting({
        claude: true,
        projectName: 'Test Project',
        jiraKey: 'TEST',
        withAgentSkills: true
      });

      const agentsDir = join(tempHome, '.claude/agents');

      // Check each agent has PROACTIVELY in description
      assertFileContains(join(agentsDir, 'design-reviewer/AGENT.md'), 'PROACTIVELY');
      assertFileContains(join(agentsDir, 'e2e-first-planner/AGENT.md'), 'PROACTIVELY');
      assertFileContains(join(agentsDir, 'oss-license-checker/AGENT.md'), 'PROACTIVELY');
      assertFileContains(join(agentsDir, 'pr-resolver/AGENT.md'), 'PROACTIVELY');
      assertFileContains(join(agentsDir, 'stable-version-auditor/AGENT.md'), 'PROACTIVELY');
    });
  });
});

