/**
 * multi-repo:list command implementation
 * マルチリポジトリプロジェクトの一覧を表示
 */

import { loadConfig } from '../../scripts/utils/config-loader.js';

/**
 * プロジェクトサマリー
 */
export interface ProjectSummary {
  name: string;
  jiraKey: string;
  repositoryCount: number;
  createdAt: string;
}

/**
 * リスト表示結果
 */
export interface ListResult {
  projects: ProjectSummary[];
  totalCount: number;
}

/**
 * Multi-Repoプロジェクトの一覧を取得
 *
 * @param projectRoot プロジェクトルートディレクトリ（デフォルト: process.cwd()）
 * @returns リスト表示結果
 */
export async function multiRepoList(
  projectRoot: string = process.cwd()
): Promise<ListResult> {
  try {
    // 1. config.jsonからプロジェクト一覧を読み込み
    const config = loadConfig(projectRoot);
    const multiRepoProjects = config.multiRepoProjects || [];

    // 2. プロジェクトサマリーを作成
    const projects: ProjectSummary[] = multiRepoProjects.map((project) => ({
      name: project.name,
      jiraKey: project.jiraKey,
      repositoryCount: project.repositories.length,
      createdAt: project.createdAt,
    }));

    // 3. 作成日時の降順（新しい順）でソート
    projects.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      projects,
      totalCount: projects.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error('設定ファイルの読み込みに失敗しました: ' + errorMessage);
  }
}
