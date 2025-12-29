/**
 * Confluence同期スクリプト
 * GitHub の Markdown ファイルを Confluence に同期
 *
 * このファイルはCLIエントリーポイントとして機能します。
 * 実装は src/infrastructure/external-apis/atlassian/confluence/ に移行されました。
 */

import { loadEnv } from './utils/env-loader.js';
import { syncToConfluence, ConfluenceClient } from '../src/infrastructure/external-apis/atlassian/confluence/index.js';

loadEnv();

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const featureName = args[0];
  const docType = (args[1] as 'requirements' | 'design' | 'tasks') || 'requirements';

  if (!featureName) {
    console.error('Usage: npm run confluence:sync <feature-name> [docType]');
    console.error('  docType: requirements (default), design, or tasks');
    process.exit(1);
  }

  syncToConfluence(featureName, docType)
    .then((url) => {
      console.log(`\nConfluence URL: ${url}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Confluence sync failed:', error.message);
      process.exit(1);
    });
}

export { syncToConfluence, ConfluenceClient };
export { getConfluenceConfig } from '../src/infrastructure/external-apis/atlassian/confluence/index.js';
export type { ConfluencePage } from '../src/infrastructure/external-apis/atlassian/confluence/index.js';
