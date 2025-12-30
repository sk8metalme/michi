/**
 * ワークフローオーケストレーター - Entry Point
 * The actual logic has been moved to src/presentation/commands/workflow/
 */

import { loadEnv } from './utils/env-loader.js';
import {
  WorkflowOrchestrator,
  workflowRunCommand,
  type WorkflowConfig,
  type WorkflowStage,
} from '../src/presentation/commands/workflow/orchestrator.js';

loadEnv();

export { WorkflowOrchestrator, workflowRunCommand, type WorkflowConfig, type WorkflowStage };

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run workflow:run -- --feature <feature_name>');
    process.exit(1);
  }

  const featureIndex = args.indexOf('--feature');
  const feature = featureIndex >= 0 ? args[featureIndex + 1] : undefined;

  if (featureIndex === -1 || !feature) {
    console.error('Usage: npm run workflow:run -- --feature <feature_name>');
    process.exit(1);
  }

  const workflowConfig: WorkflowConfig = {
    feature,
    stages: ['requirements', 'design', 'tasks', 'implement', 'test', 'release'],
    approvalGates: {
      requirements: ['企画', '部長'],
      design: ['アーキテクト', '部長'],
      release: ['SM', '部長'],
    },
  };

  workflowRunCommand(workflowConfig)
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Workflow failed:', message);
      process.exit(1);
    });
}
