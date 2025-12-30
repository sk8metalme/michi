/**
 * ConfigProvider Interface (Port)
 *
 * Application layer interface for configuration management
 * Infrastructure layer provides the implementation (Adapter)
 */

import type { Result } from '../../shared/types/result.js';
import type { ConfigError } from '../../shared/types/errors.js';

/**
 * JIRA Configuration
 */
export interface JIRAConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

/**
 * Confluence Configuration
 */
export interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

/**
 * GitHub Configuration
 */
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

/**
 * Project Configuration
 */
export interface ProjectConfig {
  name: string;
  language: 'ja' | 'en';
  rootPath: string;
}

/**
 * Michi Configuration
 */
export interface MichiConfig {
  jira?: JIRAConfig;
  confluence?: ConfluenceConfig;
  github?: GitHubConfig;
  project: ProjectConfig;
}

/**
 * Configuration Provider Interface
 *
 * Defines operations for loading and validating configuration
 */
export interface ConfigProvider {
  /**
   * Load configuration from file and environment
   *
   * @returns Success with MichiConfig or failure with ConfigError
   */
  loadConfig(): Promise<Result<MichiConfig, ConfigError>>;

  /**
   * Get JIRA configuration if available
   *
   * @returns Success with JIRAConfig or failure with ConfigError
   */
  getJIRAConfig(): Promise<Result<JIRAConfig, ConfigError>>;

  /**
   * Get Confluence configuration if available
   *
   * @returns Success with ConfluenceConfig or failure with ConfigError
   */
  getConfluenceConfig(): Promise<Result<ConfluenceConfig, ConfigError>>;

  /**
   * Get GitHub configuration if available
   *
   * @returns Success with GitHubConfig or failure with ConfigError
   */
  getGitHubConfig(): Promise<Result<GitHubConfig, ConfigError>>;

  /**
   * Get project configuration
   *
   * @returns Success with ProjectConfig or failure with ConfigError
   */
  getProjectConfig(): Promise<Result<ProjectConfig, ConfigError>>;
}
