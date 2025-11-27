/**
 * spec-loader.ts のテスト
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// spec-updater をモック
vi.mock("../utils/spec-updater.js", () => ({
  loadSpecJson: vi.fn(),
}));

import { loadSpecJson } from "../utils/spec-updater.js";
import {
  getJiraInfoFromSpec,
  checkJiraInfoStatus,
  canIntegrateWithJira,
  type JiraInfo,
  type JiraInfoStatus,
} from "../utils/spec-loader.js";

const mockLoadSpecJson = vi.mocked(loadSpecJson);

describe("spec-loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getJiraInfoFromSpec", () => {
    it("すべての JIRA 情報がある場合に正しく取得する", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: {
          epicKey: "PROJ-123",
          storyKeys: ["PROJ-124", "PROJ-125"],
          projectKey: "PROJ",
          epicUrl: "https://test.atlassian.net/browse/PROJ-123",
        },
      });

      const result = getJiraInfoFromSpec("user-auth");

      expect(mockLoadSpecJson).toHaveBeenCalledWith("user-auth", process.cwd());
      expect(result).toEqual<JiraInfo>({
        epicKey: "PROJ-123",
        storyKeys: ["PROJ-124", "PROJ-125"],
        firstStoryKey: "PROJ-124",
        projectKey: "PROJ",
        epicUrl: "https://test.atlassian.net/browse/PROJ-123",
      });
    });

    it("JIRA 情報がない場合は null を返す", () => {
      mockLoadSpecJson.mockReturnValue({});

      const result = getJiraInfoFromSpec("user-auth");

      expect(result).toEqual<JiraInfo>({
        epicKey: null,
        storyKeys: [],
        firstStoryKey: null,
        projectKey: null,
        epicUrl: null,
      });
    });

    it("Story のみの場合", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: {
          storyKeys: ["PROJ-124"],
        },
      });

      const result = getJiraInfoFromSpec("user-auth");

      expect(result).toEqual<JiraInfo>({
        epicKey: null,
        storyKeys: ["PROJ-124"],
        firstStoryKey: "PROJ-124",
        projectKey: null,
        epicUrl: null,
      });
    });

    it("Epic のみの場合", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: {
          epicKey: "PROJ-123",
        },
      });

      const result = getJiraInfoFromSpec("user-auth");

      expect(result).toEqual<JiraInfo>({
        epicKey: "PROJ-123",
        storyKeys: [],
        firstStoryKey: null,
        projectKey: null,
        epicUrl: null,
      });
    });

    it("カスタム projectRoot を指定できる", () => {
      mockLoadSpecJson.mockReturnValue({ jira: { epicKey: "PROJ-123" } });

      getJiraInfoFromSpec("user-auth", "/custom/path");

      expect(mockLoadSpecJson).toHaveBeenCalledWith(
        "user-auth",
        "/custom/path",
      );
    });
  });

  describe("checkJiraInfoStatus", () => {
    it("すべての JIRA 情報がある場合", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: {
          epicKey: "PROJ-123",
          storyKeys: ["PROJ-124"],
        },
      });

      const result = checkJiraInfoStatus("user-auth");

      expect(result).toEqual<JiraInfoStatus>({
        hasJiraInfo: true,
        hasEpic: true,
        hasStories: true,
        missing: [],
      });
    });

    it("JIRA 情報がまったくない場合", () => {
      mockLoadSpecJson.mockReturnValue({});

      const result = checkJiraInfoStatus("user-auth");

      expect(result).toEqual<JiraInfoStatus>({
        hasJiraInfo: false,
        hasEpic: false,
        hasStories: false,
        missing: ["Epic", "Story"],
      });
    });

    it("Epic のみがある場合", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: { epicKey: "PROJ-123" },
      });

      const result = checkJiraInfoStatus("user-auth");

      expect(result).toEqual<JiraInfoStatus>({
        hasJiraInfo: true,
        hasEpic: true,
        hasStories: false,
        missing: ["Story"],
      });
    });

    it("Story のみがある場合", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: { storyKeys: ["PROJ-124"] },
      });

      const result = checkJiraInfoStatus("user-auth");

      expect(result).toEqual<JiraInfoStatus>({
        hasJiraInfo: true,
        hasEpic: false,
        hasStories: true,
        missing: ["Epic"],
      });
    });
  });

  describe("canIntegrateWithJira", () => {
    it("Epic がある場合は連携可能", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: { epicKey: "PROJ-123" },
      });

      expect(canIntegrateWithJira("user-auth")).toBe(true);
    });

    it("Epic がない場合は連携不可", () => {
      mockLoadSpecJson.mockReturnValue({
        jira: { storyKeys: ["PROJ-124"] },
      });

      expect(canIntegrateWithJira("user-auth")).toBe(false);
    });

    it("JIRA 情報がない場合は連携不可", () => {
      mockLoadSpecJson.mockReturnValue({});

      expect(canIntegrateWithJira("user-auth")).toBe(false);
    });
  });
});
