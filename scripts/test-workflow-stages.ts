/**
 * ワークフロー新規ステージのテスト
 * testとreleaseステージのみを実行
 */

import { loadEnv } from './utils/env-loader.js';
import { WorkflowOrchestrator, WorkflowConfig } from './workflow-orchestrator.js';

loadEnv();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run test:workflow -- --feature <feature_name>');
    process.exit(1);
  }

  const featureIndex = args.indexOf('--feature');
  const feature = featureIndex >= 0 ? args[featureIndex + 1] : undefined;

  if (featureIndex === -1 || !feature) {
    console.error('Usage: npm run test:workflow -- --feature <feature_name>');
    process.exit(1);
  }

  // testとreleaseステージのみを実行
  const workflowConfig: WorkflowConfig = {
    feature,
    stages: ['test', 'release'],
    // 承認ゲートなし
  };

  console.log('🧪 新規実装ステージのテスト');
  console.log(`Feature: ${feature}`);
  console.log(`Stages: ${workflowConfig.stages.join(' → ')}\n`);

  const orchestrator = new WorkflowOrchestrator(workflowConfig);

  await orchestrator.run();
}

main()
  .then(() => {
    console.log('\n✅ テスト完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ テスト失敗:', error.message);
    console.error('\nスタックトレース:');
    console.error(error.stack);
    process.exit(1);
  });
