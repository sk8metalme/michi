/**
 * multi-repo:confluence-sync command - Entry Point
 * The actual logic has been moved to src/presentation/commands/multi-repo/
 */

export {
  multiRepoConfluenceSync,
  type DocumentType,
  type SyncOptions,
  type SyncedDocument,
  type SyncResult,
} from '../presentation/commands/multi-repo/confluence-sync.js';
