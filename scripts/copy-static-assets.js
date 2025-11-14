/**
 * ビルド時に静的アセット（JSON等）をdistディレクトリにコピー
 * tscはTypeScriptのトランスパイルのみで、JSONファイルは自動コピーされないため
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

/**
 * ファイルをコピーし、ディレクトリが存在しない場合は作成
 */
function copyFile(src, dest) {
  const srcPath = resolve(projectRoot, src);
  const destPath = resolve(projectRoot, dest);

  if (!existsSync(srcPath)) {
    console.error(`❌ Source file not found: ${srcPath}`);
    process.exit(1);
  }

  // コピー先のディレクトリを作成
  const destDir = dirname(destPath);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  try {
    copyFileSync(srcPath, destPath);
    console.log(`✅ Copied: ${src} → ${dest}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error.message);
    process.exit(1);
  }
}

// コピー対象のファイル一覧
const filesToCopy = [
  {
    src: 'scripts/config/default-config.json',
    dest: 'dist/scripts/config/default-config.json'
  }
];

console.log('📦 Copying static assets...');
filesToCopy.forEach(({ src, dest }) => copyFile(src, dest));
console.log('✅ All static assets copied successfully.');
