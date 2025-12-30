/**
 * SpecRepository Interface Tests
 *
 * Verify that the interface contract is correctly defined
 */

import { describe, it, expect } from 'vitest';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import { ok, err } from '../../../shared/types/result.js';
import { Spec } from '../../../domain/entities/spec.js';
import { FeatureName } from '../../../domain/value-objects/feature-name.js';

describe('SpecRepository Interface', () => {
  it('should define all required methods', () => {
    // Mock implementation to verify interface contract
    const mockRepository: SpecRepository = {
      async findByFeatureName(featureName: FeatureName) {
        const spec = new Spec(featureName.value, 'initialized', 'ja');
        return ok(spec);
      },

      async findAll() {
        return ok([]);
      },

      async save(_spec: Spec) {
        return ok(undefined);
      },

      async delete(_featureName: FeatureName) {
        return ok(undefined);
      },

      async exists(_featureName: FeatureName) {
        return ok(true);
      },
    };

    // Verify all methods exist
    expect(mockRepository.findByFeatureName).toBeDefined();
    expect(mockRepository.findAll).toBeDefined();
    expect(mockRepository.save).toBeDefined();
    expect(mockRepository.delete).toBeDefined();
    expect(mockRepository.exists).toBeDefined();
  });

  it('should return Result<Spec, RepositoryError> from findByFeatureName', async () => {
    const mockRepository: SpecRepository = {
      async findByFeatureName(featureName: FeatureName) {
        const spec = new Spec(featureName.value, 'initialized', 'ja');
        return ok(spec);
      },

      async findAll() {
        return ok([]);
      },

      async save() {
        return ok(undefined);
      },

      async delete() {
        return ok(undefined);
      },

      async exists() {
        return ok(true);
      },
    };

    const featureName = new FeatureName('test-feature');
    const result = await mockRepository.findByFeatureName(featureName);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeInstanceOf(Spec);
      expect(result.value.featureName).toBe('test-feature');
    }
  });

  it('should handle errors correctly', async () => {
    const mockRepository: SpecRepository = {
      async findByFeatureName(_featureName: FeatureName) {
        return err({ type: 'NotFound', featureName: 'test-feature' } as const);
      },

      async findAll() {
        return ok([]);
      },

      async save() {
        return ok(undefined);
      },

      async delete() {
        return ok(undefined);
      },

      async exists() {
        return ok(true);
      },
    };

    const featureName = new FeatureName('test-feature');
    const result = await mockRepository.findByFeatureName(featureName);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NotFound');
    }
  });
});
