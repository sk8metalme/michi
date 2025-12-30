/**
 * multi-repo:test command - Entry Point
 * The actual logic has been moved to src/presentation/commands/multi-repo/
 */

export {
  multiRepoTest,
  type TestType,
  type TestOptions,
  type TestExecutionResult,
  type HealthCheckResult,
  type MultiRepoTestResult,
} from '../presentation/commands/multi-repo/test.js';
