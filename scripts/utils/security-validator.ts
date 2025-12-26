/**
 * security-validator.ts
 * セキュリティ検証ユーティリティ
 *
 * 環境変数やAPIトークンなど機密情報のバリデーションとセキュリティチェックを行います。
 */

import type { Result } from './types/validation.js';
import { success, failure } from './types/validation.js';

/**
 * バリデーション結果
 * @deprecated Use Result<boolean, string> from ./types/validation.js
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * APIトークン形式の検証
 */
export function validateAtlassianToken(token: string): Result<boolean, string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token || token.trim() === '') {
    errors.push('Atlassian API token is empty');
    return failure(errors, warnings);
  }

  if (token.includes(' ')) {
    errors.push('Atlassian API token contains spaces');
  }

  if (token === 'your-token-here' || token === 'test-token' || token === 'token123') {
    errors.push('Atlassian API token is a placeholder value');
  }

  if (token.length < 20) {
    warnings.push('Atlassian API token seems too short (expected >20 characters)');
  }

  if (errors.length > 0) {
    return failure(errors, warnings);
  }

  return success(true, warnings);
}

/**
 * GitHub Personal Access Token の検証
 */
export function validateGitHubToken(token: string): Result<boolean, string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token || token.trim() === '') {
    errors.push('GitHub token is empty');
  } else if (token.includes(' ')) {
    errors.push('GitHub token contains spaces');
  } else if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    warnings.push('GitHub token does not start with expected prefix (ghp_ or github_pat_)');
  } else if (token === 'ghp_xxx' || token === 'your-github-token' || token === 'github-token') {
    errors.push('GitHub token is a placeholder value');
  } else if (token.length < 30) {
    warnings.push('GitHub token seems too short');
  }

  if (errors.length > 0) {
    return failure(errors, warnings);
  }

  return success(true, warnings);
}

/**
 * メールアドレス形式の検証
 */
export function validateEmail(email: string): Result<boolean, string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email || email.trim() === '') {
    errors.push('Email is empty');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Email format is invalid');
    } else if (
      email === 'user@example.com' ||
      email.includes('your-email') ||
      email === 'test@example.com'
    ) {
      errors.push('Email is a placeholder value');
    }
  }

  if (errors.length > 0) {
    return failure(errors, warnings);
  }

  return success(true, warnings);
}

/**
 * URL形式の検証
 */
export function validateUrl(url: string, expectedDomain?: string): Result<boolean, string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url || url.trim() === '') {
    errors.push('URL is empty');
  } else {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        errors.push(`Invalid URL protocol: ${parsedUrl.protocol} (expected https: or http:)`);
      }

      if (parsedUrl.protocol === 'http:') {
        warnings.push('URL uses insecure http:// protocol (consider using https://)');
      }

      if (expectedDomain && !parsedUrl.hostname.includes(expectedDomain)) {
        errors.push(`URL hostname ${parsedUrl.hostname} does not contain expected domain: ${expectedDomain}`);
      }

      if (url === 'https://example.com' || url === 'https://your-domain.atlassian.net') {
        errors.push('URL is a placeholder value');
      }
    } catch (error) {
      errors.push(`URL parsing failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (errors.length > 0) {
    return failure(errors, warnings);
  }

  return success(true, warnings);
}

/**
 * Atlassian URL の検証
 */
export function validateAtlassianUrl(url: string): Result<boolean, string> {
  const result = validateUrl(url, 'atlassian.net');

  if (result.success) {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.endsWith('.atlassian.net')) {
        const errors = [...result.errors, 'Atlassian URL must end with .atlassian.net'];
        return failure(errors, result.warnings);
      }
    } catch {
      // Already handled in validateUrl
    }
  }

  return result;
}

/**
 * GitHub リポジトリ URL の検証
 */
export function validateGitHubRepositoryUrl(url: string): Result<boolean, string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url || url.trim() === '') {
    errors.push('Repository URL is empty');
  } else {
    // GitHub URL 形式のパターン
    const httpsPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+(\.git)?$/;
    const sshPattern = /^git@github\.com:[\w-]+\/[\w-]+(\.git)?$/;

    if (!httpsPattern.test(url) && !sshPattern.test(url)) {
      errors.push(
        'Repository URL must be in format: https://github.com/owner/repo.git or git@github.com:owner/repo.git',
      );
    }

    if (url.includes('your-org') || url.includes('your-repo')) {
      errors.push('Repository URL contains placeholder values');
    }
  }

  if (errors.length > 0) {
    return failure(errors, warnings);
  }

  return success(true, warnings);
}

/**
 * 環境変数の包括的検証
 */
export interface EnvValidationConfig {
  atlassianUrl?: string;
  atlassianEmail?: string;
  atlassianApiToken?: string;
  githubOrg?: string;
  githubToken?: string;
  repositoryUrl?: string;
}

export function validateEnvironmentConfig(config: EnvValidationConfig): Result<boolean, string> {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (config.atlassianUrl !== undefined) {
    const result = validateAtlassianUrl(config.atlassianUrl);
    allErrors.push(...result.errors.map((e) => `ATLASSIAN_URL: ${e}`));
    allWarnings.push(...result.warnings.map((w) => `ATLASSIAN_URL: ${w}`));
  }

  if (config.atlassianEmail !== undefined) {
    const result = validateEmail(config.atlassianEmail);
    allErrors.push(...result.errors.map((e) => `ATLASSIAN_EMAIL: ${e}`));
    allWarnings.push(...result.warnings.map((w) => `ATLASSIAN_EMAIL: ${w}`));
  }

  if (config.atlassianApiToken !== undefined) {
    const result = validateAtlassianToken(config.atlassianApiToken);
    allErrors.push(...result.errors.map((e) => `ATLASSIAN_API_TOKEN: ${e}`));
    allWarnings.push(...result.warnings.map((w) => `ATLASSIAN_API_TOKEN: ${w}`));
  }

  if (config.githubOrg !== undefined) {
    if (!config.githubOrg || config.githubOrg.trim() === '') {
      allErrors.push('GITHUB_ORG: GitHub organization is empty');
    } else if (config.githubOrg.includes('your-org')) {
      allErrors.push('GITHUB_ORG: GitHub organization is a placeholder value');
    }
  }

  if (config.githubToken !== undefined) {
    const result = validateGitHubToken(config.githubToken);
    allErrors.push(...result.errors.map((e) => `GITHUB_TOKEN: ${e}`));
    allWarnings.push(...result.warnings.map((w) => `GITHUB_TOKEN: ${w}`));
  }

  if (config.repositoryUrl !== undefined) {
    const result = validateGitHubRepositoryUrl(config.repositoryUrl);
    allErrors.push(...result.errors.map((e) => `repository: ${e}`));
    allWarnings.push(...result.warnings.map((w) => `repository: ${w}`));
  }

  if (allErrors.length > 0) {
    return failure(allErrors, allWarnings);
  }

  return success(true, allWarnings);
}

