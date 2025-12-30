#!/usr/bin/env node
/**
 * Michi CLI Tool - Entry Point
 *
 * This file is now a thin wrapper that delegates to the Presentation layer.
 * The actual CLI logic has been moved to src/presentation/cli.ts as part of
 * the Onion Architecture migration (Phase 5, Task 6.1).
 */

export { createCLI } from './presentation/cli.js';
