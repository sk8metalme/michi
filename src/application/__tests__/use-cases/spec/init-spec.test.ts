/**
 * InitSpecUseCase Tests
 *
 * TDD: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InitSpecUseCase } from '../../../use-cases/spec/init-spec.js';
import type { SpecRepository } from '../../../interfaces/spec-repository.js';
import { ok, err } from '../../../../shared/types/result.js';
import { Spec } from '../../../../domain/entities/spec.js';
import { FeatureName } from '../../../../domain/value-objects/feature-name.js';

describe('InitSpecUseCase', () => {
  // Mock SpecRepository
  let mockRepository: SpecRepository;

  beforeEach(() => {
    mockRepository = {
      async findByFeatureName(_featureName: FeatureName) {
        return err({ type: 'NotFound', featureName: 'test' } as const);
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
    it('should generate feature name from project description', async () => {
      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Create a new authentication system';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.featureName.value).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    });

    it('should create spec with initialized phase', async () => {
      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Test feature';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.featureName).toBeDefined();
      }
    });

    it('should auto-generate unique name if feature name already exists', async () => {
      // Mock repository to return existing spec for base name, but not for suffixed name
      let callCount = 0;
      mockRepository.exists = async () => {
        callCount++;
        return ok(callCount === 1); // First call (base name) exists, second doesn't
      };

      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Existing feature';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.featureName.value).toMatch(/-2$/);
      }
    });

    it('should generate unique feature name on collision', async () => {
      let existsCallCount = 0;
      mockRepository.exists = async () => {
        existsCallCount++;
        // First call returns true (collision), second returns false (unique)
        return ok(existsCallCount === 1);
      };

      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Test feature';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.featureName.value).toMatch(/-2$/);
      }
    });

    it('should handle empty project description', async () => {
      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = '';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidInput');
      }
    });

    it('should save spec to repository', async () => {
      let savedSpec: Spec | undefined;
      mockRepository.save = async (spec: Spec) => {
        savedSpec = spec;
        return ok(undefined);
      };

      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Test feature';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      expect(savedSpec).toBeDefined();
      if (savedSpec) {
        expect(savedSpec.phase).toBe('initialized');
      }
    });

    it('should return next command suggestion', async () => {
      const useCase = new InitSpecUseCase(mockRepository);
      const projectDescription = 'Test feature';

      const result = await useCase.execute(projectDescription);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.nextCommand).toContain('spec-requirements');
      }
    });
  });
});
