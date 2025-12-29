/**
 * プロジェクトメタデータ読み込みユーティリティ
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { safeReadFileOrThrow } from '../../../scripts/utils/safe-file-reader.js';

export interface ProjectMetadata {
  projectId: string;
  projectName: string;
  jiraProjectKey: string;
  confluenceLabels: string[];
  status: 'active' | 'inactive' | 'completed';
  team: string[];
  stakeholders: string[];
  repository: string;
  description?: string;
}

/**
 * .kiro/project.json を読み込む
 */
export function loadProjectMeta(projectRoot: string = process.cwd()): ProjectMetadata {
  const projectJsonPath = resolve(projectRoot, '.kiro/project.json');

  if (!existsSync(projectJsonPath)) {
    throw new Error(`Project metadata not found: ${projectJsonPath}`);
  }

  try {
    const content = safeReadFileOrThrow(projectJsonPath);
    const meta = JSON.parse(content) as ProjectMetadata;

    // 必須フィールドのバリデーション
    const requiredFields: (keyof ProjectMetadata)[] = [
      'projectId',
      'projectName',
      'jiraProjectKey',
      'confluenceLabels'
    ];

    for (const field of requiredFields) {
      if (!meta[field]) {
        throw new Error(`Required field missing in project.json: ${field}`);
      }
    }

    return meta;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${projectJsonPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * プロジェクトメタデータを表示用にフォーマット
 */
export function formatProjectInfo(meta: ProjectMetadata): string {
  return `
Project: ${meta.projectName} (${meta.projectId})
JIRA: ${meta.jiraProjectKey}
Labels: ${meta.confluenceLabels.join(', ')}
Status: ${meta.status}
Team: ${meta.team.join(', ')}
`.trim();
}

/**
 * GitHub リポジトリ情報を取得
 * repository フィールドから owner/repo 形式を抽出
 *
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: カレントディレクトリ）
 * @returns owner/repo 形式のリポジトリ情報
 * @throws リポジトリ情報が見つからない、または無効な形式の場合
 */
export function getRepositoryInfo(projectRoot: string = process.cwd()): string {
  const meta = loadProjectMeta(projectRoot);

  if (!meta.repository) {
    throw new Error('Repository information not found in project.json');
  }

  // URL形式から owner/repo を抽出
  // 例: https://github.com/owner/repo.git -> owner/repo
  // 例: git@github.com:owner/repo.git -> owner/repo
  const match = meta.repository.match(/github\.com[:/]([\w-]+\/[\w-]+)(\.git)?/);

  if (!match) {
    throw new Error(`Invalid GitHub repository format: ${meta.repository}`);
  }

  return match[1];
}
