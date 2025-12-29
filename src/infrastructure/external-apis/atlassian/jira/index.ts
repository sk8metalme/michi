/**
 * JIRA Integration Module
 *
 * このモジュールはJIRA API統合のすべての機能をエクスポートします
 */

// Client
export { JIRAClient } from './client.js';

// Types
export type {
  ADFNode,
  ADFDocument,
  JiraIssue,
  JIRAIssue,
  JIRAIssuePayload,
  JIRAIssueCreateResponse,
  JIRAIssueType,
  JIRAConfig,
  StoryDetails,
} from './types.js';

// ADF Converter
export { textToADF, createRichADF } from './adf-converter.js';

// Issue Builder
export {
  extractRepoName,
  createTitlePrefix,
  extractStoryDetails,
  getStoryIssueTypeId,
  getOrCreateEpic,
} from './issue-builder.js';

// Status Mapper
export { detectPhaseLabel } from './status-mapper.js';

// Sync Service
export { syncTasksToJIRA, getJIRAConfig } from './sync-service.js';
