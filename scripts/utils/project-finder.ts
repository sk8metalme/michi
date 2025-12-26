/**
 * プロジェクト検出ユーティリティ
 * リポジトリルートを検出
 */

import { existsSync } from 'fs';
import { resolve, join, dirname } from 'path';

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
