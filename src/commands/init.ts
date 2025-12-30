/**
 * init command - Entry Point
 *
 * This file is now a thin wrapper that delegates to the Presentation layer.
 * The actual init logic has been moved to src/presentation/commands/init/ as part of
 * the Onion Architecture migration (Phase 5, Task 6.2).
 */

export { initProject } from '../presentation/commands/init/handler.js';
export type { InitOptions } from '../presentation/commands/init/prompts.js';
