/**
 * multi-repo:add-repo command implementation
 * マルチリポジトリプロジェクトにリポジトリを追加
 */

import {
  validateRepositoryUrl,
} from '../../scripts/utils/multi-repo-validator.js';
import {
  findProject,
  addRepositoryToProject,
} from '../../scripts/utils/config-loader.js';

/**
 * リポジトリ追加結果
 */
export interface AddRepoResult {
  success: boolean;
  projectName: string;
  repositoryName: string;
  url: string;
  branch: string;
}

/**
 * Multi-Repoプロジェクトにリポジトリを追加
 *
 * @param projectName プロジェクト名
 * @param repositoryName リポジトリ名
 * @param url リポジトリURL
 * @param branch ブランチ名（デフォルト: "main"）
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
 * @returns リポジトリ追加結果
 */
export async function multiRepoAddRepo(
  projectName: string,
  repositoryName: string,
  url: string,
  branch: string = 'main',
  projectRoot: string = process.cwd()
): Promise<AddRepoResult> {
  // 1. プロジェクト存在確認
  const project = await findProject(projectName, projectRoot);
  if (!project) {
    throw new Error('プロジェクト「' + projectName + '」が見つかりません');
  }

  // 2. リポジトリ名のバリデーション
  if (!repositoryName || repositoryName.trim() === '') {
    throw new Error('リポジトリ名が空です');
  }

  // 3. リポジトリURLのバリデーション
  const urlValidation = validateRepositoryUrl(url);
  if (!urlValidation.success) {
    throw new Error(
      'リポジトリURLが無効です: ' + urlValidation.errors.join(', ')
    );
  }

  // 4. ブランチ名のデフォルト値設定
  const branchName = branch && branch.trim() !== '' ? branch : 'main';

  // 5. 既存リポジトリ重複チェック
  const existingRepo = project.repositories.find(
    (r) => r.name === repositoryName
  );
  if (existingRepo) {
    throw new Error('リポジトリ「' + repositoryName + '」は既に存在します');
  }

  // 6. config.jsonへのリポジトリ情報追加
  const addResult = addRepositoryToProject(
    projectName,
    {
      name: repositoryName,
      url,
      branch: branchName,
    },
    projectRoot
  );

  if (!addResult.success) {
    throw new Error(
      '設定ファイルの更新に失敗しました: ' + (addResult.error || 'Unknown error')
    );
  }

  return {
    success: true,
    projectName,
    repositoryName,
    url,
    branch: branchName,
  };
}
