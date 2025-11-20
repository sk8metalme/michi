/**
 * プロジェクト検出ユーティリティ
 * リポジトリルートを検出し、projects/配下のプロジェクトを検索
 * 複数プロジェクトが存在する場合、選択機能を提供
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { readFileSync } from 'fs';
import type { ProjectMetadata } from './project-meta.js';

export interface ProjectLocation {
  path: string;
  projectId: string;
  projectName: string;
  jiraProjectKey: string;
}

/**
 * 指定されたディレクトリに.kiro/project.jsonが存在するか確認
 */
function hasProjectJson(dir: string): boolean {
  const projectJsonPath = join(dir, '.kiro', 'project.json');
  return existsSync(projectJsonPath);
}

/**
 * プロジェクトメタデータを読み込む
 */
function loadProjectMetadata(dir: string): ProjectMetadata | null {
  const projectJsonPath = join(dir, '.kiro', 'project.json');
  
  if (!existsSync(projectJsonPath)) {
    return null;
  }
  
  try {
    const content = readFileSync(projectJsonPath, 'utf-8');
    const meta = JSON.parse(content) as ProjectMetadata;
    return meta;
  } catch {
    // パースエラーなどは無視
    return null;
  }
}

/**
 * 現在のディレクトリから親ディレクトリを遡って.kiro/project.jsonを検索
 */
export function findCurrentProject(startDir: string = process.cwd()): ProjectLocation | null {
  let currentDir = resolve(startDir);
  const root = resolve('/');
  
  while (currentDir !== root && currentDir !== dirname(currentDir)) {
    if (hasProjectJson(currentDir)) {
      const meta = loadProjectMetadata(currentDir);
      if (meta) {
        return {
          path: currentDir,
          projectId: meta.projectId,
          projectName: meta.projectName,
          jiraProjectKey: meta.jiraProjectKey
        };
      }
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  
  return null;
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
 * リポジトリルートからprojects/配下の全プロジェクトを検索
 * 統一されたディレクトリ構成: すべてのプロジェクトはprojects/{project-id}/配下に配置
 */
export function findAllProjects(
  searchDir?: string
): ProjectLocation[] {
  const projects: ProjectLocation[] = [];
  
  // リポジトリルートを検出
  const repoRoot = searchDir ? findRepositoryRoot(searchDir) : findRepositoryRoot();
  const projectsDir = join(repoRoot, 'projects');
  
  // projects/ディレクトリが存在しない場合は空配列を返す
  if (!existsSync(projectsDir)) {
    return projects;
  }
  
  try {
    // projects/配下のディレクトリを取得
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      // 隠しディレクトリはスキップ
      if (entry.name.startsWith('.')) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const projectDir = join(projectsDir, entry.name);
        // プロジェクトディレクトリに.kiro/project.jsonがあるか確認
        if (hasProjectJson(projectDir)) {
          const meta = loadProjectMetadata(projectDir);
          if (meta) {
            projects.push({
              path: projectDir,
              projectId: meta.projectId,
              projectName: meta.projectName,
              jiraProjectKey: meta.jiraProjectKey
            });
          }
        }
      }
    }
  } catch {
    // アクセス権限エラーなどは無視
  }
  
  return projects;
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

