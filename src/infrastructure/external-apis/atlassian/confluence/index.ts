/**
 * Confluence Integration Module
 */

// Client
export { ConfluenceClient } from './client.js';

// Types
export type {
  ConfluencePage,
  ConfluenceError,
  ConfluenceCreatePagePayload,
  ConfluenceConfig,
  ConfluencePageOptions,
} from './types.js';

// Approval
export { convertMarkdownToConfluence, createConfluencePage } from './approval.js';

// Hierarchy
export {
  createPagesByGranularity,
  createSinglePage,
  createBySectionPages,
  createByHierarchySimplePages,
  createByHierarchyNestedPages,
  createManualPages,
} from './hierarchy.js';
export type { PageCreationResult, HierarchyCreationResult } from './hierarchy.js';

// Sync Service
export { syncToConfluence, getConfluenceConfig } from './sync-service.js';
