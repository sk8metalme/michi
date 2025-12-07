/**
 * ワークフローオーケストレーター
 * AI開発フロー全体を統合実行
 */

import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';
import { syncToConfluence, getConfluenceConfig } from './confluence-sync.js';
import { syncTasksToJIRA } from './jira-sync.js';
import { analyzeLanguage } from './utils/language-detector.js';
import { executeTests, generateTestReport } from './utils/test-runner.js';
import { createReleaseNotes } from './utils/release-notes-generator.js';
import { pollForApproval, waitForManualApproval } from './utils/confluence-approval.js';

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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Stage failed: ${stage}`, message);
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
      await this.executeTestPhase();
      break;

    case 'release':
      console.log('  Release preparation');
      await this.executeReleasePhase();
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
   * テストフェーズを実行
   */
  private async executeTestPhase(): Promise<void> {
    // プロジェクトの言語を検出
    const languageInfo = analyzeLanguage(this.config.feature);
    console.log(`  Detected language: ${languageInfo.language} (${languageInfo.confidence} confidence)`);

    // テストを実行
    console.log('  Running tests...');
    const testResult = await executeTests(languageInfo.language);

    // レポートを生成
    const report = generateTestReport(testResult, this.config.feature);

    // Confluenceにレポートをアップロード
    try {
      // レポートをConfluenceに同期（テスト用のページとして）
      console.log('  Uploading test report to Confluence...');

      // テストレポートをファイルに保存
      const { writeFileSync, mkdirSync } = await import('fs');
      const { resolve } = await import('path');
      const reportDir = resolve(`.kiro/specs/${this.config.feature}`);
      mkdirSync(reportDir, { recursive: true });
      const reportPath = resolve(reportDir, 'test-report.md');
      writeFileSync(reportPath, report, 'utf-8');

      console.log(`  ✅ Test report saved: ${reportPath}`);

      if (!testResult.success) {
        throw new Error('Tests failed. Please fix the issues before proceeding.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('  ❌ Test execution failed:', message);
      throw error;
    }
  }

  /**
   * リリースフェーズを実行
   */
  private async executeReleasePhase(): Promise<void> {
    // リリースバージョンを決定（環境変数またはデフォルト）
    const version = process.env.RELEASE_VERSION || 'v1.0.0';

    console.log(`  Generating release notes for ${version}...`);

    // リリースノートを生成
    const releaseNotes = await createReleaseNotes(version);

    // リリースノートをファイルに保存
    const { writeFileSync, mkdirSync } = await import('fs');
    const { resolve } = await import('path');
    const releaseDir = resolve(`.kiro/specs/${this.config.feature}`);
    mkdirSync(releaseDir, { recursive: true });
    const releaseNotesPath = resolve(releaseDir, `release-notes-${version}.md`);
    writeFileSync(releaseNotesPath, releaseNotes, 'utf-8');

    console.log(`  ✅ Release notes saved: ${releaseNotesPath}`);

    // JIRA Releaseを作成
    try {
      console.log('  Creating JIRA Release...');

      // JIRA Release作成APIを呼び出し
      // Note: JIRAClientにcreateVersionメソッドを追加する必要があります
      console.log('  ℹ️  JIRA Release creation is pending JIRAClient enhancement');
      console.log(`  📋 Manual action required: Create release ${version} in JIRA`);
      console.log(`  📄 Release notes: ${releaseNotesPath}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('  ⚠️  Failed to create JIRA Release:', message);
      console.log('  📋 Please create the release manually in JIRA');
    }
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

    // Confluence自動ポーリングが有効な場合
    if (process.env.CONFLUENCE_AUTO_POLL === 'true') {
      try {
        const confluenceConfig = getConfluenceConfig();

        // TODO: ステージに応じたページIDを取得する必要があります
        // 現在は環境変数から取得
        const pageId = process.env.CONFLUENCE_APPROVAL_PAGE_ID;

        if (!pageId) {
          console.log('  ℹ️  CONFLUENCE_APPROVAL_PAGE_ID not set, falling back to manual approval');
          waitForManualApproval('', approvers || []);
          return;
        }

        console.log('  🔄 Polling for approval...');
        const status = await pollForApproval(pageId, confluenceConfig);

        console.log(`  ✅ Approved by: ${status.approvers.join(', ')}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('  ❌ Approval polling failed:', message);
        throw error;
      }
    } else {
      // 手動承認
      waitForManualApproval('', approvers || []);
      console.log('  （手動で承認を確認してください）');
    }
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
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Workflow failed:', message);
      process.exit(1);
    });
}
