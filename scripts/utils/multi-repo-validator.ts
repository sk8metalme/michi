/**
 * multi-repo-validator.ts
 * Multi-Repo機能のバリデーションユーティリティ
 *
 * プロジェクト名、JIRAキー、リポジトリURLのバリデーションとセキュリティチェックを行います。
 */

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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
