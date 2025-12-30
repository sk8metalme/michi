/**
 * init command - Validation functions
 * プロジェクト初期化の入力値バリデーション
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * プロジェクトIDのバリデーション
 */
export function validateProjectId(projectId: string): boolean {
  if (!projectId.trim() || /^\s+$/.test(projectId)) {
    return false;
  }
  if (projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(projectId);
}

/**
 * プロジェクト名のバリデーション
 */
export function validateProjectName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed || trimmed.length === 0) {
    throw new Error('プロジェクト名が空です');
  }
  if (trimmed.length > 100) {
    throw new Error('プロジェクト名が長すぎます（最大100文字）');
  }

  if (/[/\\]/.test(trimmed)) {
    throw new Error('プロジェクト名にパス区切り文字（/ または \\）は使用できません');
  }

  if (/^\.\.?$|^\.\.?\//.test(trimmed)) {
    throw new Error('プロジェクト名に相対パス（. または ..）は使用できません');
  }

  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new Error('プロジェクト名に制御文字は使用できません');
  }

  return trimmed;
}

/**
 * JIRAキーのバリデーション
 */
export function validateJiraKey(key: string): string {
  const trimmed = key.trim().toUpperCase();

  if (!/^[A-Z]{2,10}$/.test(trimmed)) {
    throw new Error(
      'JIRAキーの形式が不正です（2-10文字の大文字英字のみ、例: PRJA）',
    );
  }

  return trimmed;
}

/**
 * 既存プロジェクトかどうかを検出
 */
export function detectExistingProject(currentDir: string): boolean {
  const indicators = [
    'package.json',    // Node.js
    'pom.xml',         // Java/Maven
    'build.gradle',    // Java/Gradle
    'composer.json',   // PHP
  ];

  return indicators.some((file) => existsSync(join(currentDir, file)));
}
