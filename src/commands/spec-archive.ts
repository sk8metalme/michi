/**
 * spec:archive command implementation
 * 完了した仕様書をアーカイブする
 */

import { archiveSpec, canArchiveSpec } from '../../scripts/utils/spec-archiver.js';

export interface ArchiveCommandOptions {
  reason?: string;
}

/**
 * 仕様書をアーカイブするコマンド
 *
 * @param featureName 機能名
 * @param options オプション
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 */
export async function specArchiveCommand(
  featureName: string,
  options?: ArchiveCommandOptions,
  projectRoot: string = process.cwd()
): Promise<void> {
  console.log(`\n📦 Archiving specification: ${featureName}`);

  // アーカイブ可能かチェック
  const check = canArchiveSpec(featureName, projectRoot);

  if (!check.canArchive) {
    console.error(`❌ Cannot archive ${featureName}: ${check.reason}`);
    process.exit(1);
  }

  // アーカイブ実行
  const result = archiveSpec(featureName, options, projectRoot);

  if (result.success) {
    console.log(`✅ Successfully archived ${featureName}`);
    console.log(`📁 Archive path: ${result.archivePath}`);
    if (options?.reason) {
      console.log(`📝 Reason: ${options.reason}`);
    }
  } else {
    console.error(`❌ Failed to archive ${featureName}: ${result.error}`);
    process.exit(1);
  }
}
