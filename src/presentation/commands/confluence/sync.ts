/**
 * confluence:sync command implementation
 * GitHub の Markdown ファイルを Confluence に同期
 */

import { syncToConfluence } from '../../../infrastructure/external-apis/atlassian/confluence/index.js';

export interface ConfluenceSyncOptions {
  featureName: string;
  docType: 'requirements' | 'design' | 'tasks';
}

/**
 * MarkdownファイルをConfluenceに同期するコマンド
 *
 * @param options コマンドオプション
 * @returns Confluence URL
 * @throws Error 同期に失敗した場合
 */
export async function confluenceSyncCommand(
  options: ConfluenceSyncOptions
): Promise<string> {
  console.log(`\n🔄 Syncing ${options.docType} to Confluence: ${options.featureName}`);

  try {
    const url = await syncToConfluence(options.featureName, options.docType);
    console.log('✅ Confluence sync completed successfully');
    return url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Confluence sync failed: ${errorMessage}`);
  }
}
