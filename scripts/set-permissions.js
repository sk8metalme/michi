#!/usr/bin/env node
/**
 * Set executable permissions on CLI entry point
 * Cross-platform script to ensure dist/src/cli.js has execute permissions
 */

import { chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, '..', 'dist', 'src', 'cli.js');

// Skip on Windows where chmod is not needed
if (process.platform === 'win32') {
  console.log('Skipping chmod on Windows (not required)');
  process.exit(0);
}

try {
  chmodSync(cliPath, 0o755);
  console.log(`✓ Set executable permissions on ${cliPath}`);
} catch (error) {
  console.error(`Failed to set permissions on ${cliPath}:`, error.message);
  // Don't fail the build if this fails
  process.exit(0);
}
