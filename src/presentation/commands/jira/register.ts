/**
 * JIRA Command Registration
 *
 * Registers all JIRA-related CLI commands
 */

import { Command } from 'commander';
import { syncTasksToJIRA, JIRAClient } from '../../../infrastructure/external-apis/atlassian/jira/index.js';

/**
 * Register JIRA-related commands
 */
export function registerJiraCommands(program: Command): void {
  program
    .command('jira:sync')
    .description('Sync tasks.md to JIRA Epic/Stories')
    .argument('<feature>', 'Feature name')
    .action(async (feature: string) => {
      try {
        await syncTasksToJIRA(feature);
      } catch (error) {
        handleError('JIRA sync failed', error);
      }
    });

  program
    .command('jira:transition')
    .description('Change JIRA ticket status')
    .argument('<issueKey>', 'JIRA issue key (e.g., PROJ-123)')
    .argument(
      '<status>',
      'Target status name (e.g., "In Progress", "Ready for Review")',
    )
    .action(async (issueKey: string, status: string) => {
      try {
        const { url, email, apiToken } = getJiraCredentials();
        const client = new JIRAClient({ url, email, apiToken });
        await client.transitionIssue(issueKey, status);
      } catch (error) {
        handleError('JIRA transition failed', error);
      }
    });

  program
    .command('jira:comment')
    .description('Add comment to JIRA ticket')
    .argument('<issueKey>', 'JIRA issue key (e.g., PROJ-123)')
    .argument('<comment>', 'Comment text')
    .action(async (issueKey: string, comment: string) => {
      try {
        const { url, email, apiToken } = getJiraCredentials();
        const client = new JIRAClient({ url, email, apiToken });
        await client.addComment(issueKey, comment);
      } catch (error) {
        handleError('JIRA comment failed', error);
      }
    });
}

/**
 * Get JIRA credentials from environment
 */
function getJiraCredentials(): { url: string; email: string; apiToken: string } {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!url || !email || !apiToken) {
    console.error('❌ Missing JIRA credentials in .env');
    console.error(
      '   Required: ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN',
    );
    process.exit(1);
  }

  return { url, email, apiToken };
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
