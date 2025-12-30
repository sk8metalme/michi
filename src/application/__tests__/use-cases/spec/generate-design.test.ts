/**
 * GenerateDesignUseCase Tests
 *
 * TDD: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateDesignUseCase } from '../../../use-cases/spec/generate-design.js';
import type { SpecRepository } from '../../../interfaces/spec-repository.js';
import { ok, err } from '../../../../shared/types/result.js';
import { Spec } from '../../../../domain/entities/spec.js';
import { FeatureName } from '../../../../domain/value-objects/feature-name.js';

describe('GenerateDesignUseCase', () => {
  // Mock SpecRepository
  let mockRepository: SpecRepository;
  let testSpec: Spec;

  beforeEach(() => {
    testSpec = new Spec('test-feature', 'requirements-generated', 'ja');

    mockRepository = {
      async findByFeatureName(_featureName: FeatureName) {
        return ok(testSpec);
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
        return ok(false);
      },
    };
  });

  describe('execute', () => {
    it('should load spec by feature name', async () => {
      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      let loadedFeatureName: FeatureName | undefined;
      mockRepository.findByFeatureName = async (fn: FeatureName) => {
        loadedFeatureName = fn;
        return ok(testSpec);
      };

      await useCase.execute(featureName);

      expect(loadedFeatureName).toBeDefined();
      expect(loadedFeatureName?.value).toBe('test-feature');
    });

    it('should return error if spec not found', async () => {
      mockRepository.findByFeatureName = async () => {
        return err({ type: 'NotFound', featureName: 'test-feature' } as const);
      };

      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RepositoryError');
      }
    });

    it('should return error if spec is not in requirements-generated phase', async () => {
      testSpec = new Spec('test-feature', 'initialized', 'ja');
      mockRepository.findByFeatureName = async () => ok(testSpec);

      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidInput');
        expect(result.error.message).toContain('requirements-generated');
      }
    });

    it('should update spec phase to design-generated', async () => {
      let savedSpec: Spec | undefined;
      mockRepository.save = async (spec: Spec) => {
        savedSpec = spec;
        return ok(undefined);
      };

      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      expect(savedSpec).toBeDefined();
      if (savedSpec) {
        expect(savedSpec.phase).toBe('design-generated');
      }
    });

    it('should return next command suggestion', async () => {
      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.nextCommand).toContain('spec-tasks');
        expect(result.value.nextCommand).toContain('test-feature');
      }
    });

    it('should return generated file path', async () => {
      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.designFile).toContain('design.md');
      }
    });

    it('should handle repository save errors', async () => {
      mockRepository.save = async () => {
        return err({
          type: 'WriteError',
          path: '.kiro/specs/test-feature/spec.json',
          cause: 'Permission denied',
        } as const);
      };

      const useCase = new GenerateDesignUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RepositoryError');
      }
    });
  });
});
