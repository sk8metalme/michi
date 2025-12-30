/**
 * Confluence同期スクリプト - Entry Point
 * The actual logic has been moved to src/presentation/commands/confluence/
 */

import { loadEnv } from './utils/env-loader.js';
import { confluenceSyncCommand } from '../src/presentation/commands/confluence/sync.js';
import { syncToConfluence, ConfluenceClient, getConfluenceConfig } from '../src/infrastructure/external-apis/atlassian/confluence/index.js';

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

  confluenceSyncCommand({ featureName, docType })
    .then((url) => {
      console.log(`\nConfluence URL: ${url}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Confluence sync failed:', error.message);
      process.exit(1);
    });
}

export { syncToConfluence, ConfluenceClient, getConfluenceConfig };
export type { ConfluencePage } from '../src/infrastructure/external-apis/atlassian/confluence/index.js';
