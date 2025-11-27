/**
 * Integration tests for Claude Agent environment setup
 */

import { describe, it, beforeEach, afterEach, vi } from "vitest";
import { join } from "path";
import { setupExisting } from "../../../commands/setup-existing.js";
import { createTestProject, TestProject } from "./helpers/test-project.js";
import {
  assertDirectoryExists,
  assertFileExists,
  assertDirectoryStructure,
  assertFileContains,
} from "./helpers/fs-assertions.js";

// Mock readline to auto-confirm prompts
vi.mock("readline", () => ({
  createInterface: () => ({
    question: (question: string, callback: (answer: string) => void) => {
      callback("y"); // Auto-confirm
    },
    close: () => {},
  }),
}));

describe("Claude Agent Environment Setup", () => {
  let testProject: TestProject;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: "claude-agent-test" });
    process.chdir(testProject.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();
  });

  describe("Basic Setup", () => {
    it("should create .claude/agents directory", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      assertDirectoryExists(join(testProject.path, ".claude"));
      assertDirectoryExists(join(testProject.path, ".claude/agents"));
    });

    it("should create .kiro directory structure", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      assertDirectoryStructure(testProject.path, {
        ".kiro": "dir",
        ".kiro/settings": "dir",
        ".kiro/settings/templates": "dir",
        ".kiro/steering": "dir",
        ".kiro/specs": "dir",
      });
    });

    it("should create project.json with correct metadata", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Agent Test",
        jiraKey: "AGNT",
      });

      const projectJsonPath = join(testProject.path, ".kiro/project.json");
      assertFileExists(projectJsonPath);

      assertFileContains(projectJsonPath, '"projectName": "Agent Test"');
      assertFileContains(projectJsonPath, '"jiraProjectKey": "AGNT"');
    });

    it("should create .env template", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const envPath = join(testProject.path, ".env");
      assertFileExists(envPath);
      assertFileContains(envPath, "JIRA_PROJECT_KEYS=TEST");
    });
  });

  describe("Claude Agent-specific Structure", () => {
    it("should have agents directory structure", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const agentsDir = join(testProject.path, ".claude/agents");
      assertDirectoryExists(agentsDir);
    });

    it("should not create Cursor-specific directories", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const { existsSync } = await import("fs");
      const cursorDir = join(testProject.path, ".cursor");

      // .cursor directory should not exist for Claude Agent setup
      expect(existsSync(cursorDir)).toBe(false);
    });

    it("should not create basic Claude rules directory", async () => {
      await setupExisting({
        claudeAgent: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const { existsSync } = await import("fs");
      const claudeRulesDir = join(testProject.path, ".claude/rules");

      // Basic .claude/rules should not exist for agents setup
      expect(existsSync(claudeRulesDir)).toBe(false);
    });
  });

  describe("Language Support", () => {
    it("should support multiple languages", async () => {
      await setupExisting({
        claudeAgent: true,
        lang: "zh-TW",
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const projectJson = join(testProject.path, ".kiro/project.json");
      assertFileContains(projectJson, '"language": "zh-TW"');
    });
  });
});
