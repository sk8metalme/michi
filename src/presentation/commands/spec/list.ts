/**
 * spec:list command implementation
 * 仕様書の一覧を表示する
 */

import { listSpecs } from '../../../../scripts/utils/spec-archiver.js';

export interface ListCommandOptions {
  all?: boolean;
}

/**
 * 仕様書一覧を表示するコマンド
 *
 * @param options オプション
 * @param projectRoot プロジェクトルート（デフォルト: process.cwd()）
 */
export async function specListCommand(
  options?: ListCommandOptions,
  projectRoot: string = process.cwd()
): Promise<void> {
  const specs = listSpecs(
    { includeArchived: options?.all },
    projectRoot
  );

  if (specs.length === 0) {
    console.log('\n📋 No specifications found.');
    return;
  }

  console.log(`\n📋 Specifications (${specs.length})`);
  console.log('');

  // アクティブな仕様書
  const activeSpecs = specs.filter(s => !s.archived);
  if (activeSpecs.length > 0) {
    console.log('## Active Specifications');
    console.log('');
    for (const spec of activeSpecs) {
      console.log(`- ${spec.feature}`);
      console.log(`  Phase: ${spec.phase}`);
      console.log(`  Release Notes: ${spec.hasReleaseNotes ? '✓' : '✗'}`);
      console.log('');
    }
  }

  // アーカイブ済みの仕様書
  if (options?.all) {
    const archivedSpecs = specs.filter(s => s.archived);
    if (archivedSpecs.length > 0) {
      console.log('## Archived Specifications');
      console.log('');
      for (const spec of archivedSpecs) {
        console.log(`- ${spec.feature} (archived)`);
        console.log(`  Phase: ${spec.phase}`);
        console.log(`  Archived At: ${spec.archivedAt || 'unknown'}`);
        console.log(`  Path: ${spec.archivePath}`);
        console.log('');
      }
    }
  }

  console.log(`Total: ${specs.length} specifications`);
  if (!options?.all) {
    const archivedCount = specs.filter(s => s.archived).length;
    if (archivedCount > 0) {
      console.log(`(${archivedCount} archived specifications hidden. Use --all to show them)`);
    }
  }
}
