/**
 * ワークフローオーケストレーター
 * AI開発フロー全体を統合実行
 */

import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';
import { syncToConfluence } from './confluence-sync.js';
import { syncTasksToJIRA } from './jira-sync.js';
import { createPR } from './pr-automation.js';

config();

export interface WorkflowConfig {
  feature: string;
  stages: WorkflowStage[];
  approvalGates?: {
    requirements?: string[];
    design?: string[];
    release?: string[];
  };
}

export type WorkflowStage =
  | 'requirements'
  | 'design'
  | 'tasks'
  | 'implement'
  | 'test'
  | 'release';

export class WorkflowOrchestrator {
  private config: WorkflowConfig;
  
  constructor(config: WorkflowConfig) {
    this.config = config;
  }
  
  /**
   * ワークフロー全体を実行
   */
  async run(): Promise<void> {
    console.log(`🚀 Starting workflow for: ${this.config.feature}`);
    console.log(`Stages: ${this.config.stages.join(' → ')}`);
    
    const projectMeta = loadProjectMeta();
    console.log(`Project: ${projectMeta.projectName}`);
    
    for (const stage of this.config.stages) {
      console.log(`\n📋 Stage: ${stage}`);
      
      try {
        await this.executeStage(stage);
        
        // 承認ゲートチェック
        if (this.hasApprovalGate(stage)) {
          await this.waitForApproval(stage);
        }
        
        console.log(`✅ Stage completed: ${stage}`);
      } catch (error: any) {
        console.error(`❌ Stage failed: ${stage}`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 Workflow completed successfully!');
  }
  
  /**
   * 各ステージを実行
   */
  private async executeStage(stage: WorkflowStage): Promise<void> {
    switch (stage) {
    case 'requirements':
      console.log('  Syncing requirements to Confluence...');
      await syncToConfluence(this.config.feature, 'requirements');
      break;
        
    case 'design':
      console.log('  Syncing design to Confluence...');
      await syncToConfluence(this.config.feature, 'design');
      break;
        
    case 'tasks':
      console.log('  Creating JIRA tasks...');
      await syncTasksToJIRA(this.config.feature);
      break;
        
    case 'implement':
      console.log('  Implementation phase - manual step');
      console.log('  Use: /kiro:spec-impl <feature> <tasks>');
      break;
        
    case 'test':
      console.log('  Test phase - execute tests');
      // TODO: テスト実行とレポート生成
      break;
        
    case 'release':
      console.log('  Release preparation');
      // TODO: リリースノート生成とJIRA Release作成
      break;
    }
  }
  
  /**
   * 承認ゲートがあるかチェック
   */
  private hasApprovalGate(stage: WorkflowStage): boolean {
    const gates = this.config.approvalGates;
    if (!gates) return false;
    
    const gateList =
      stage === 'requirements' ? gates.requirements :
        stage === 'design' ? gates.design :
          stage === 'release' ? gates.release :
            undefined;

    return Array.isArray(gateList) && gateList.length > 0;
  }
  
  /**
   * 承認を待つ
   */
  private async waitForApproval(stage: WorkflowStage): Promise<void> {
    console.log(`\n⏸️  Approval required for: ${stage}`);
    
    const approvers = this.config.approvalGates?.[stage as keyof typeof this.config.approvalGates];
    if (approvers) {
      console.log(`  Approvers: ${approvers.join(', ')}`);
    }
    
    console.log('  ✅ Confluence で承認してください');
    console.log('  ⏳ 承認完了後、次のステージに進みます');
    
    // TODO: Confluence APIで承認状態をポーリング
    // 現在は手動確認
    console.log('  （手動で承認を確認してください）');
  }
}

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
      release: ['SM', '部長']
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(workflowConfig);
  
  orchestrator.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Workflow failed:', error.message);
      process.exit(1);
    });
}
