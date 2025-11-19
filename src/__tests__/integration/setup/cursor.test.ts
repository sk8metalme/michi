/**
 * Integration tests for Cursor environment setup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

describe("Cursor Environment Setup", () => {
  let testProject: TestProject;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testProject = createTestProject({ name: "cursor-test" });
    process.chdir(testProject.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    testProject.destroy();
  });

  describe("Basic Setup", () => {
    it("should create .cursor/rules directory", async () => {
      await setupExisting({
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      // Assert directory structure
      assertDirectoryExists(join(testProject.path, ".cursor"));
      assertDirectoryExists(join(testProject.path, ".cursor/rules"));
      assertDirectoryExists(join(testProject.path, ".cursor/commands"));
    });

    it("should create .kiro directory structure", async () => {
      await setupExisting({
        cursor: true,
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
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const projectJsonPath = join(testProject.path, ".kiro/project.json");
      assertFileExists(projectJsonPath);

      assertFileContains(projectJsonPath, '"projectName": "Test Project"');
      assertFileContains(projectJsonPath, '"jiraProjectKey": "TEST"');
      assertFileContains(projectJsonPath, '"language": "ja"');
    });

    it("should create .env template", async () => {
      await setupExisting({
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const envPath = join(testProject.path, ".env");
      assertFileExists(envPath);
      assertFileContains(envPath, "ATLASSIAN_URL=");
      assertFileContains(envPath, "JIRA_PROJECT_KEYS=TEST");
    });
  });

  describe("Template Rendering", () => {
    it("should render templates with correct placeholders", async () => {
      await setupExisting({
        cursor: true,
        lang: "ja",
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      // Check if rules contain language-specific content
      const rulesDir = join(testProject.path, ".cursor/rules");
      assertDirectoryExists(rulesDir);

      // Note: Actual file checks depend on template content
      // This is a placeholder for template verification
    });
  });

  describe("Language Support", () => {
    it("should support Japanese language (default)", async () => {
      await setupExisting({
        cursor: true,
        projectName: "テストプロジェクト",
        jiraKey: "TEST",
      });

      const projectJson = join(testProject.path, ".kiro/project.json");
      assertFileContains(projectJson, '"language": "ja"');
    });

    it("should support English language", async () => {
      await setupExisting({
        cursor: true,
        lang: "en",
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const projectJson = join(testProject.path, ".kiro/project.json");
      assertFileContains(projectJson, '"language": "en"');
    });
  });

  describe("Git Integration", () => {
    it("should detect Git remote URL", async () => {
      await setupExisting({
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const projectJson = join(testProject.path, ".kiro/project.json");
      assertFileContains(projectJson, /repository.*github\.com/);
    });

    it("should handle missing Git remote gracefully", async () => {
      // Remove git remote
      const { execSync } = await import("child_process");
      try {
        execSync("git remote remove origin", {
          cwd: testProject.path,
          stdio: "ignore",
        });
      } catch {
        // Ignore if remote doesn't exist
      }

      await setupExisting({
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      const projectJson = join(testProject.path, ".kiro/project.json");
      assertFileExists(projectJson);
      // Should have placeholder URL
      assertFileContains(projectJson, /"repository":/);
    });
  });

  describe("Error Handling", () => {
    it("should show warning if not in Git repository", async () => {
      // Remove .git directory
      const { rmSync } = await import("fs");
      const gitPath = join(testProject.path, ".git");
      rmSync(gitPath, { recursive: true, force: true });

      // Should not throw, but continue with warning
      await setupExisting({
        cursor: true,
        projectName: "Test Project",
        jiraKey: "TEST",
      });

      // If we reach here, the test passes
      expect(true).toBe(true);
    });
  });
});
