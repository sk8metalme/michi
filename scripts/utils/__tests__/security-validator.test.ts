/**
 * security-validator.test.ts
 * セキュリティバリデーターのテスト
 */

import { describe, it, expect } from 'vitest';
import {
  validateAtlassianToken,
  validateGitHubToken,
  validateEmail,
  validateUrl,
  validateAtlassianUrl,
  validateGitHubRepositoryUrl,
  validateEnvironmentConfig,
} from '../security-validator.js';

describe('security-validator', () => {
  describe('validateAtlassianToken', () => {
    it('空のトークンはエラー', () => {
      const result = validateAtlassianToken('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Atlassian API token is empty');
    });

    it('スペースを含むトークンはエラー', () => {
      const result = validateAtlassianToken('token with spaces');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Atlassian API token contains spaces');
    });

    it('短すぎるトークンは警告', () => {
      const result = validateAtlassianToken('short');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Atlassian API token seems too short (expected >20 characters)',
      );
    });

    it('プレースホルダー値はエラー', () => {
      const result = validateAtlassianToken('your-token-here');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Atlassian API token is a placeholder value');
    });

    it('正しいトークンは成功', () => {
      const result = validateAtlassianToken('ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz1234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateGitHubToken', () => {
    it('空のトークンはエラー', () => {
      const result = validateGitHubToken('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub token is empty');
    });

    it('スペースを含むトークンはエラー', () => {
      const result = validateGitHubToken('token with spaces');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub token contains spaces');
    });

    it('プレフィックスなしのトークンは警告', () => {
      const result = validateGitHubToken('abcdefghijklmnopqrstuvwxyz1234567890');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'GitHub token does not start with expected prefix (ghp_ or github_pat_)',
      );
    });

    it('プレースホルダー値はエラー', () => {
      const result = validateGitHubToken('ghp_xxx');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub token is a placeholder value');
    });

    it('正しいトークン(ghp_)は成功', () => {
      const result = validateGitHubToken('ghp_abcdefghijklmnopqrstuvwxyz1234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正しいトークン(github_pat_)は成功', () => {
      const result = validateGitHubToken('github_pat_abcdefghijklmnopqrstuvwxyz1234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEmail', () => {
    it('空のメールアドレスはエラー', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is empty');
    });

    it('不正な形式のメールアドレスはエラー', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email format is invalid');
    });

    it('プレースホルダー値はエラー', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is a placeholder value');
    });

    it('正しいメールアドレスは成功', () => {
      const result = validateEmail('real.user@company.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUrl', () => {
    it('空のURLはエラー', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is empty');
    });

    it('不正な形式のURLはエラー', () => {
      const result = validateUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('httpプロトコルは警告', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'URL uses insecure http:// protocol (consider using https://)',
      );
    });

    it('プレースホルダー値はエラー', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is a placeholder value');
    });

    it('正しいURLは成功', () => {
      const result = validateUrl('https://real-domain.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('expectedDomainが一致しない場合はエラー', () => {
      const result = validateUrl('https://wrong.com', 'example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'URL hostname wrong.com does not contain expected domain: example.com',
      );
    });

    it('expectedDomainが一致する場合は成功', () => {
      const result = validateUrl('https://sub.example.com', 'example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAtlassianUrl', () => {
    it('atlassian.netドメインでない場合はエラー', () => {
      const result = validateAtlassianUrl('https://wrong-domain.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('atlassian.net'))).toBe(true);
    });

    it('正しいAtlassian URLは成功', () => {
      const result = validateAtlassianUrl('https://mycompany.atlassian.net');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateGitHubRepositoryUrl', () => {
    it('空のURLはエラー', () => {
      const result = validateGitHubRepositoryUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Repository URL is empty');
    });

    it('不正な形式はエラー', () => {
      const result = validateGitHubRepositoryUrl('https://example.com/repo');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('format'))).toBe(true);
    });

    it('プレースホルダー値はエラー', () => {
      const result = validateGitHubRepositoryUrl('https://github.com/your-org/your-repo.git');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Repository URL contains placeholder values');
    });

    it('正しいHTTPS URLは成功', () => {
      const result = validateGitHubRepositoryUrl('https://github.com/owner/repo.git');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正しいHTTPS URL(.gitなし)も成功', () => {
      const result = validateGitHubRepositoryUrl('https://github.com/owner/repo');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正しいSSH URLは成功', () => {
      const result = validateGitHubRepositoryUrl('git@github.com:owner/repo.git');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正しいSSH URL(.gitなし)も成功', () => {
      const result = validateGitHubRepositoryUrl('git@github.com:owner/repo');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEnvironmentConfig', () => {
    it('すべて正しい設定は成功', () => {
      const result = validateEnvironmentConfig({
        atlassianUrl: 'https://mycompany.atlassian.net',
        atlassianEmail: 'user@company.com',
        atlassianApiToken: 'ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz1234567890',
        githubOrg: 'myorg',
        githubToken: 'ghp_abcdefghijklmnopqrstuvwxyz1234567890',
        repositoryUrl: 'https://github.com/myorg/myrepo.git',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('複数のエラーをすべて報告', () => {
      const result = validateEnvironmentConfig({
        atlassianUrl: 'https://example.com', // プレースホルダー
        atlassianEmail: 'invalid-email', // 不正な形式
        atlassianApiToken: 'test-token', // プレースホルダー
        githubOrg: 'your-org', // プレースホルダー
        githubToken: 'ghp_xxx', // プレースホルダー
        repositoryUrl: '', // 空
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
      expect(result.errors.some((e) => e.startsWith('ATLASSIAN_URL:'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('ATLASSIAN_EMAIL:'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('ATLASSIAN_API_TOKEN:'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('GITHUB_ORG:'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('GITHUB_TOKEN:'))).toBe(true);
      expect(result.errors.some((e) => e.startsWith('repository:'))).toBe(true);
    });

    it('警告も正しく集約される', () => {
      const result = validateEnvironmentConfig({
        atlassianUrl: 'http://mycompany.atlassian.net', // http警告
        atlassianApiToken: 'shorttoken', // 短い警告
        githubToken: 'abcdefghijklmnopqrstuvwxyz1234567890', // プレフィックスなし警告
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('ATLASSIAN_URL:'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('ATLASSIAN_API_TOKEN:'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('GITHUB_TOKEN:'))).toBe(true);
    });
  });
});
