/**
 * multi-repo:ci-status command - Entry Point
 * The actual logic has been moved to src/presentation/commands/multi-repo/
 */

export {
  multiRepoCIStatus,
  type CIStatusOptions,
  type CIStatusDiff,
  type CIStatusResult,
} from '../presentation/commands/multi-repo/ci-status.js';
