/**
 * Workflow Command Registration
 *
 * Registers all workflow-related CLI commands
 */

import { Command } from 'commander';
import { WorkflowOrchestrator } from './orchestrator.js';
import { getApprovalGates } from '../../cli/config.js';

/**
 * Register workflow-related commands
 */
export function registerWorkflowCommands(program: Command): void {
  program
    .command('workflow:run')
    .description('Run complete workflow')
    .requiredOption('--feature <name>', 'Feature name')
    .action(async (options: { feature: string }) => {
      try {
        const workflowConfig = {
          feature: options.feature,
          stages: [
            'requirements',
            'design',
            'tasks',
            'implement',
            'test',
            'release',
          ] as (
            | 'requirements'
            | 'design'
            | 'tasks'
            | 'implement'
            | 'test'
            | 'release'
          )[],
          approvalGates: {
            requirements: getApprovalGates('APPROVAL_GATES_REQUIREMENTS', [
              'pm',
              'director',
            ]),
            design: getApprovalGates('APPROVAL_GATES_DESIGN', [
              'architect',
              'director',
            ]),
            release: getApprovalGates('APPROVAL_GATES_RELEASE', [
              'sm',
              'director',
            ]),
          },
        };

        const orchestrator = new WorkflowOrchestrator(workflowConfig);
        await orchestrator.run();
      } catch (error) {
        handleError('Workflow failed', error);
      }
    });
}

/**
 * Handle command errors
 */
function handleError(message: string, error: unknown): never {
  console.error(
    `❌ ${message}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
