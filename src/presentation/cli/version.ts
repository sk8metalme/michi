/**
 * Michi version utility
 * Retrieves Michi's own package.json version
 */

import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { safeReadFileOrThrow } from '../../../scripts/utils/safe-file-reader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Michi自身のpackage.jsonからバージョンを取得
 * 利用者のプロジェクトがNode.jsでなくてもMichiを使えるようにする
 */
export function getMichiVersion(): string {
  // package.jsonの場所を探索
  // - ビルド後/npm実行時: __dirname/../../../package.json (dist/src/presentation/cli/version.js)
  // - 開発時: __dirname/../../../../package.json (src/presentation/cli/version.ts)
  const possiblePaths = [
    join(__dirname, '..', '..', '..', 'package.json'),
    join(__dirname, '..', '..', '..', '..', 'package.json'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        const packageJson = JSON.parse(safeReadFileOrThrow(path, 'utf-8'));
        // name フィールドで確実にMichiのpackage.jsonか確認
        if (packageJson.name === '@sk8metal/michi-cli') {
          return packageJson.version;
        }
      } catch {
        // 次のパスを試す
        continue;
      }
    }
  }

  // どこにも見つからない場合はデフォルト値（開発環境など）
  return '0.0.0-dev';
}
