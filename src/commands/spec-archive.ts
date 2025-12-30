/**
 * spec:archive command - Entry Point
 *
 * This file is now a thin wrapper that delegates to the Presentation layer.
 * The actual logic has been moved to src/presentation/commands/spec/archive.ts as part of
 * the Onion Architecture migration (Phase 5, Task 6.3).
 */

export { specArchiveCommand } from '../presentation/commands/spec/archive.js';
export type { ArchiveCommandOptions } from '../presentation/commands/spec/archive.js';
