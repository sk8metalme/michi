/**
 * multi-repo:init command implementation
 * 新規マルチリポジトリプロジェクトを初期化
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  validateProjectName,
  validateJiraKey,
} from '../../scripts/utils/multi-repo-validator.js';
import {
  findProject,
  addMultiRepoProject,
} from '../../scripts/utils/config-loader.js';
import {
  createMultiRepoTemplateContext,
  renderMultiRepoTemplates,
  MULTI_REPO_TEMPLATES,
} from '../../scripts/template/multi-repo-renderer.js';

/**
 * 初期化結果
 */
export interface InitResult {
  success: boolean;
  projectName: string;
  jiraKey: string;
  confluenceSpace: string;
  createdDirectories: string[];
  createdFiles: string[];
}

/**
 * Multi-Repoプロジェクトを初期化
 *
 * @param projectName プロジェクト名
 * @param jiraKey JIRAキー
 * @param confluenceSpace Confluenceスペースキー
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
 * @returns 初期化結果
 */
export async function multiRepoInit(
  projectName: string,
  jiraKey: string,
  confluenceSpace: string,
  projectRoot: string = process.cwd()
): Promise<InitResult> {
  // 1. プロジェクト名のバリデーション
  const projectNameValidation = validateProjectName(projectName);
  if (!projectNameValidation.success) {
    throw new Error(
      `プロジェクト名が無効です: ${projectNameValidation.errors.join(', ')}`
    );
  }

  // 2. JIRAキーのバリデーション
  const jiraKeyValidation = validateJiraKey(jiraKey);
  if (!jiraKeyValidation.success) {
    throw new Error(
      `JIRAキーが無効です: ${jiraKeyValidation.errors.join(', ')}`
    );
  }

  // 3. Confluenceスペースキーの検証
  if (!confluenceSpace || confluenceSpace.trim() === '') {
    throw new Error('Confluenceスペースキーが空です');
  }

  // 4. 既存プロジェクト重複チェック
  const existingProject = await findProject(projectName, projectRoot);
  if (existingProject) {
    throw new Error(`プロジェクト「${projectName}」は既に存在します`);
  }

  // 5. ディレクトリ構造の生成
  const createdDirectories: string[] = [];
  const baseDir = join(projectRoot, 'docs', 'michi', projectName);

  const directories = [
    join(baseDir, 'overview'),
    join(baseDir, 'steering'),
    join(baseDir, 'tests'),
    join(baseDir, 'tests', 'scripts'),
    join(baseDir, 'tests', 'results'),
    join(baseDir, 'tests', 'unit'),
    join(baseDir, 'tests', 'integration'),
    join(baseDir, 'tests', 'e2e'),
    join(baseDir, 'tests', 'performance'),
    join(baseDir, 'docs'),
  ];

  try {
    for (const dir of directories) {
      mkdirSync(dir, { recursive: true });
      createdDirectories.push(dir);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`ディレクトリの作成に失敗しました: ${errorMessage}`);
  }

  // 6. テンプレートファイルの展開
  const createdFiles: string[] = [];
  const createdAt = new Date().toISOString();
  const templateContext = createMultiRepoTemplateContext(
    projectName,
    jiraKey,
    confluenceSpace,
    createdAt
  );

  try {
    const renderedTemplates = renderMultiRepoTemplates(
      [...MULTI_REPO_TEMPLATES],
      templateContext,
      projectRoot
    );

    // テンプレートファイルを書き込み
    for (const [templateName, content] of Object.entries(renderedTemplates)) {
      const filePath = join(baseDir, `${templateName}.md`);
      writeFileSync(filePath, content, 'utf-8');
      createdFiles.push(filePath);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`ファイルの作成に失敗しました: ${errorMessage}`);
  }

  // 7. config.jsonへのプロジェクト情報登録
  const addResult = addMultiRepoProject(
    {
      name: projectName,
      jiraKey,
      confluenceSpace,
      createdAt,
      repositories: [],
    },
    projectRoot
  );

  if (!addResult.success) {
    throw new Error(
      `設定ファイルの更新に失敗しました: ${addResult.error || 'Unknown error'}`
    );
  }

  return {
    success: true,
    projectName,
    jiraKey,
    confluenceSpace,
    createdDirectories,
    createdFiles,
  };
}
