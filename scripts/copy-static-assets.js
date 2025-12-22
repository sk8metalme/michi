/**
 * ビルド時に静的アセット（JSON等、テンプレート）をdistディレクトリにコピー
 * tscはTypeScriptのトランスパイルのみで、JSONやテンプレートファイルは自動コピーされないため
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { dirname, resolve, join } from 'path';
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

/**
 * ディレクトリを再帰的にコピー
 */
function copyDirectory(srcDir, destDir) {
  const srcPath = resolve(projectRoot, srcDir);
  const destPath = resolve(projectRoot, destDir);

  if (!existsSync(srcPath)) {
    console.error(`❌ Source directory not found: ${srcPath}`);
    process.exit(1);
  }

  if (!statSync(srcPath).isDirectory()) {
    console.error(`❌ Source is not a directory: ${srcPath}`);
    process.exit(1);
  }

  // コピー先のディレクトリを作成
  if (!existsSync(destPath)) {
    mkdirSync(destPath, { recursive: true });
  }

  try {
    const entries = readdirSync(srcPath, { withFileTypes: true });

    for (const entry of entries) {
      const srcEntryPath = join(srcPath, entry.name);
      const destEntryPath = join(destPath, entry.name);

      if (entry.isDirectory()) {
        // ディレクトリの場合は再帰的にコピー
        copyDirectory(srcEntryPath, destEntryPath);
      } else {
        // ファイルの場合はコピー
        copyFileSync(srcEntryPath, destEntryPath);
        console.log(`✅ Copied: ${entry.name}`);
      }
    }
    console.log(`📁 Directory copied: ${srcDir} → ${destDir}`);
  } catch (error) {
    console.error(`❌ Failed to copy directory ${srcDir}:`, error.message);
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

// コピー対象のディレクトリ一覧
const directoriesToCopy = [
  {
    src: 'templates/multi-repo',
    dest: 'dist/templates/multi-repo'
  }
];

console.log('📦 Copying static assets...');
filesToCopy.forEach(({ src, dest }) => copyFile(src, dest));

console.log('📁 Copying template directories...');
directoriesToCopy.forEach(({ src, dest }) => copyDirectory(src, dest));

console.log('✅ All static assets copied successfully.');
