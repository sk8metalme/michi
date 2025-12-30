/**
 * ConfigProvider Interface Tests
 *
 * Verify that the interface contract is correctly defined
 */

import { describe, it, expect } from 'vitest';
import type { ConfigProvider, MichiConfig } from '../../interfaces/config-provider.js';
import { ok } from '../../../shared/types/result.js';

describe('ConfigProvider Interface', () => {
  it('should define all required methods', () => {
    const mockConfig: MichiConfig = {
      project: {
        name: 'test-project',
        language: 'ja',
        rootPath: '/test',
      },
    };

    const mockProvider: ConfigProvider = {
      async loadConfig() {
        return ok(mockConfig);
      },

      async getJIRAConfig() {
        return ok({
          baseUrl: 'https://test.atlassian.net',
          email: 'test@example.com',
          apiToken: 'token',
          projectKey: 'TEST',
        });
      },

      async getConfluenceConfig() {
        return ok({
          baseUrl: 'https://test.atlassian.net/wiki',
          email: 'test@example.com',
          apiToken: 'token',
          spaceKey: 'TEST',
        });
      },

      async getGitHubConfig() {
        return ok({
          token: 'ghp_test',
          owner: 'test',
          repo: 'test-repo',
        });
      },

      async getProjectConfig() {
        return ok(mockConfig.project);
      },
    };

    expect(mockProvider.loadConfig).toBeDefined();
    expect(mockProvider.getJIRAConfig).toBeDefined();
    expect(mockProvider.getConfluenceConfig).toBeDefined();
    expect(mockProvider.getGitHubConfig).toBeDefined();
    expect(mockProvider.getProjectConfig).toBeDefined();
  });

  it('should return Result<MichiConfig, ConfigError> from loadConfig', async () => {
    const mockConfig: MichiConfig = {
      project: {
        name: 'test-project',
        language: 'ja',
        rootPath: '/test',
      },
    };

    const mockProvider: ConfigProvider = {
      async loadConfig() {
        return ok(mockConfig);
      },

      async getJIRAConfig() {
        return ok({
          baseUrl: 'https://test.atlassian.net',
          email: 'test@example.com',
          apiToken: 'token',
          projectKey: 'TEST',
        });
      },

      async getConfluenceConfig() {
        return ok({
          baseUrl: 'https://test.atlassian.net/wiki',
          email: 'test@example.com',
          apiToken: 'token',
          spaceKey: 'TEST',
        });
      },

      async getGitHubConfig() {
        return ok({
          token: 'ghp_test',
          owner: 'test',
          repo: 'test-repo',
        });
      },

      async getProjectConfig() {
        return ok(mockConfig.project);
      },
    };

    const result = await mockProvider.loadConfig();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.project.name).toBe('test-project');
      expect(result.value.project.language).toBe('ja');
    }
  });
});
