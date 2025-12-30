/**
 * JIRA連携スクリプト - Entry Point
 * The actual logic has been moved to src/presentation/commands/jira/
 */

import { loadEnv } from './utils/env-loader.js';
import { jiraSyncCommand } from '../src/presentation/commands/jira/sync.js';
import { syncTasksToJIRA, JIRAClient } from '../src/infrastructure/external-apis/atlassian/jira/index.js';

loadEnv();

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run jira:sync <feature-name>');
    process.exit(1);
  }

  jiraSyncCommand({ featureName: args[0] })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ JIRA sync failed:', error.message);
      process.exit(1);
    });
}

export { syncTasksToJIRA, JIRAClient };
