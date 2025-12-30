/**
 * spec:list command - Entry Point
 *
 * This file is now a thin wrapper that delegates to the Presentation layer.
 * The actual logic has been moved to src/presentation/commands/spec/list.ts as part of
 * the Onion Architecture migration (Phase 5, Task 6.3).
 */

export { specListCommand } from '../presentation/commands/spec/list.js';
export type { ListCommandOptions } from '../presentation/commands/spec/list.js';
