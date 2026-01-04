/**
 * Env Wizard Tests
 */

import { describe, it, expect } from 'vitest';
import { createEnvInteractively } from '../env-wizard.js';

describe('env-wizard', () => {
  describe('createEnvInteractively', () => {
    it('should export createEnvInteractively function', () => {
      expect(typeof createEnvInteractively).toBe('function');
    });

    it('should be an async function', () => {
      const result = createEnvInteractively('.env');
      expect(result).toBeInstanceOf(Promise);
      // Clean up the promise to avoid unhandled rejection
      result.catch(() => {});
    });
  });
});
