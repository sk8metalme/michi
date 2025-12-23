/**
 * multi-repo-validator.ts
 * Multi-Repo機能のバリデーションユーティリティ
 *
 * プロジェクト名、JIRAキー、リポジトリURL、localPathのバリデーションとセキュリティチェックを行います。
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Repository } from '../config/config-schema.js';

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * LocalPathバリデーション結果（詳細情報付き）
 */
export interface LocalPathValidationResult extends ValidationResult {
  exists: boolean;
  isGitRepository: boolean;
  currentBranch: string | null;
  branchMatches: boolean;
  hasUncommittedChanges: boolean;
}

/**
 * プロジェクト名のバリデーション
 * セキュリティ対策: パストラバーサル、相対パス、制御文字をチェック
 */
export function validateProjectName(name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 長さチェック: 1-100文字
  if (name.length < 1 || name.length > 100) {
    errors.push('Project name must be between 1 and 100 characters');
  }

  // パストラバーサル対策: '/', '\' 禁止
  if (name.includes('/') || name.includes('\\')) {
    errors.push(
      'Project name must not contain path traversal characters (/, \\)',
    );
  }

  // 相対パス対策: '.', '..' 禁止
  if (name === '.' || name === '..') {
    errors.push(
      'Project name must not be relative path components (., ..)',
    );
  }

  // 制御文字対策: \x00-\x1F, \x7F 禁止
  // eslint-disable-next-line no-control-regex
  const controlCharRegex = /[\x00-\x1F\x7F]/;
  if (controlCharRegex.test(name)) {
    errors.push('Project name must not contain control characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * JIRAキーのバリデーション
 * 2-10文字の大文字英字のみ許可
 */
export function validateJiraKey(key: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 正規表現: 2-10文字の大文字英字
  const jiraKeyRegex = /^[A-Z]{2,10}$/;

  if (!jiraKeyRegex.test(key)) {
    errors.push('JIRA key must be 2-10 uppercase letters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * リポジトリURLのバリデーション
 * GitHub HTTPS URL形式のみ許可
 */
export function validateRepositoryUrl(url: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 空文字列チェック
  if (!url || url.trim() === '') {
    errors.push('Repository URL is empty');
    return { isValid: false, errors, warnings };
  }

  // SSH URL検出（git@github.com:形式）
  if (url.startsWith('git@')) {
    errors.push(
      'Repository URL must be in GitHub format: https://github.com/{owner}/{repo}',
    );
    return { isValid: false, errors, warnings };
  }

  // URL形式チェック
  try {
    const parsedUrl = new URL(url);

    // HTTPSプロトコルチェック
    if (parsedUrl.protocol !== 'https:') {
      errors.push('Repository URL must use HTTPS protocol');
    }

    // GitHub URL形式チェック: https://github.com/{owner}/{repo}
    const githubPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+$/;
    if (!githubPattern.test(url)) {
      errors.push(
        'Repository URL must be in GitHub format: https://github.com/{owner}/{repo}',
      );
    }

    // .git拡張子チェック
    if (url.endsWith('.git')) {
      errors.push('Repository URL must not include .git extension');
    }

    // プレースホルダー検出
    if (
      url.includes('your-org') ||
      url.includes('your-repo') ||
      url.includes('repo-name')
    ) {
      errors.push('Repository URL contains placeholder values');
    }
  } catch (_error) {
    errors.push('Repository URL format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * LocalPathのバリデーション
 * ディレクトリ存在、Gitリポジトリ、ブランチ、未コミット変更をチェック
 *
 * @param repository - リポジトリ設定
 * @returns バリデーション結果（詳細情報付き）
 */
export function validateLocalPath(
  repository: Repository,
): LocalPathValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 初期値
  let exists = false;
  let isGitRepository = false;
  let currentBranch: string | null = null;
  let branchMatches = false;
  let hasUncommittedChanges = false;

  // 1. localPath設定確認
  if (!repository.localPath) {
    warnings.push(
      `Repository '${repository.name}' does not have localPath configured`,
    );
    return {
      isValid: false,
      errors,
      warnings,
      exists,
      isGitRepository,
      currentBranch,
      branchMatches,
      hasUncommittedChanges,
    };
  }

  const localPath = repository.localPath;

  // 2. ディレクトリ存在確認
  try {
    const stats = fs.statSync(localPath);
    if (!stats.isDirectory()) {
      errors.push(
        `localPath '${localPath}' exists but is not a directory`,
      );
      return {
        isValid: false,
        errors,
        warnings,
        exists: true,
        isGitRepository,
        currentBranch,
        branchMatches,
        hasUncommittedChanges,
      };
    }
    exists = true;
  } catch (error) {
    errors.push(`localPath '${localPath}' does not exist`);
    return {
      isValid: false,
      errors,
      warnings,
      exists,
      isGitRepository,
      currentBranch,
      branchMatches,
      hasUncommittedChanges,
    };
  }

  // 3. Gitリポジトリ確認
  const gitDir = path.join(localPath, '.git');
  if (!fs.existsSync(gitDir)) {
    errors.push(
      `localPath '${localPath}' is not a Git repository (no .git directory)`,
    );
    return {
      isValid: false,
      errors,
      warnings,
      exists,
      isGitRepository,
      currentBranch,
      branchMatches,
      hasUncommittedChanges,
    };
  }
  isGitRepository = true;

  // 4. ブランチ確認
  try {
    currentBranch = execSync('git branch --show-current', {
      cwd: localPath,
      encoding: 'utf-8',
    }).trim();

    if (currentBranch !== repository.branch) {
      warnings.push(
        `Current branch '${currentBranch}' does not match configured branch '${repository.branch}'`,
      );
      branchMatches = false;
    } else {
      branchMatches = true;
    }
  } catch (error) {
    warnings.push(
      `Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 5. 未コミット変更確認
  try {
    const statusOutput = execSync('git status --porcelain', {
      cwd: localPath,
      encoding: 'utf-8',
    }).trim();

    if (statusOutput.length > 0) {
      warnings.push(
        `Repository '${repository.name}' has uncommitted changes`,
      );
      hasUncommittedChanges = true;
    }
  } catch (error) {
    warnings.push(
      `Failed to check uncommitted changes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    exists,
    isGitRepository,
    currentBranch,
    branchMatches,
    hasUncommittedChanges,
  };
}
