/**
 * プロジェクト検出ユーティリティ
 * リポジトリルートを検出し、projects/配下のプロジェクトを検索
 * 複数プロジェクトが存在する場合、選択機能を提供
 */

import { existsSync } from 'fs';
import { resolve, join, dirname } from 'path';

export interface ProjectLocation {
  path: string;
  projectId: string;
  projectName: string;
  jiraProjectKey: string;
}

/**
 * リポジトリルートを検出
 * .gitディレクトリまたはprojects/ディレクトリの存在から判断
 */
export function findRepositoryRoot(startDir: string = process.cwd()): string {
  let currentDir = resolve(startDir);
  const root = resolve('/');
  
  while (currentDir !== root && currentDir !== dirname(currentDir)) {
    // .gitディレクトリまたはprojects/ディレクトリが存在する場合、リポジトリルートと判断
    if (existsSync(join(currentDir, '.git')) || existsSync(join(currentDir, 'projects'))) {
      return currentDir;
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  
  // リポジトリルートが見つからない場合、現在のディレクトリを返す
  return resolve(startDir);
}

/**
 * 複数プロジェクトから選択する（対話的）
 */
export async function selectProject(
  projects: ProjectLocation[],
  question: (prompt: string) => Promise<string>
): Promise<ProjectLocation | null> {
  if (projects.length === 0) {
    return null;
  }
  
  if (projects.length === 1) {
    return projects[0];
  }
  
  console.log('\n📋 複数のプロジェクトが見つかりました:');
  projects.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.projectName} (${project.projectId}) - ${project.path}`);
  });
  
  const answer = await question(`\n選択してください [1-${projects.length}]: `);
  const index = parseInt(answer.trim(), 10) - 1;
  
  if (index >= 0 && index < projects.length) {
    return projects[index];
  }
  
  // 無効な入力の場合は最初のプロジェクトを返す
  console.log('⚠️  無効な選択です。最初のプロジェクトを使用します。');
  return projects[0];
}

