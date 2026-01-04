/**
 * ArchiveSpecUseCase Tests
 *
 * TDD: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveSpecUseCase } from '../../../use-cases/spec/archive-spec.js';
import type { SpecRepository } from '../../../interfaces/spec-repository.js';
import { ok, err } from '../../../../shared/types/result.js';
import { Spec } from '../../../../domain/entities/spec.js';
import { FeatureName } from '../../../../domain/value-objects/feature-name.js';

describe('ArchiveSpecUseCase', () => {
  // Mock SpecRepository
  let mockRepository: SpecRepository;
  let testSpec: Spec;

  beforeEach(() => {
    testSpec = new Spec('test-feature', 'implementation-complete', 'ja');

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
        return ok(true);
      },
    };
  });

  describe('execute', () => {
    it('should load spec by feature name', async () => {
      const useCase = new ArchiveSpecUseCase(mockRepository);
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

      const useCase = new ArchiveSpecUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RepositoryError');
      }
    });

    it('should allow archiving spec in any phase', async () => {
      // Test multiple phases to ensure flexibility
      const phases = [
        'initialized',
        'requirements-generated',
        'design-generated',
        'tasks-generated',
        'implementation-in-progress',
        'implementation-complete',
      ] as const;

      for (const phase of phases) {
        testSpec = new Spec('test-feature', phase, 'ja');
        mockRepository.findByFeatureName = async () => ok(testSpec);

        const useCase = new ArchiveSpecUseCase(mockRepository);
        const featureName = new FeatureName('test-feature');

        const result = await useCase.execute(featureName);

        expect(result.success).toBe(true);
      }
    });

    it('should delete spec from repository', async () => {
      let deletedFeatureName: FeatureName | undefined;
      mockRepository.delete = async (fn: FeatureName) => {
        deletedFeatureName = fn;
        return ok(undefined);
      };

      const useCase = new ArchiveSpecUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      expect(deletedFeatureName).toBeDefined();
      expect(deletedFeatureName?.value).toBe('test-feature');
    });

    it('should return archived file paths', async () => {
      const useCase = new ArchiveSpecUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.archivedFiles).toBeDefined();
        expect(result.value.archivedFiles.length).toBeGreaterThan(0);
      }
    });

    it('should return archive location', async () => {
      const useCase = new ArchiveSpecUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.archiveLocation).toContain('test-feature');
        expect(result.value.archiveLocation).toContain('archive');
      }
    });

    it('should handle repository delete errors', async () => {
      mockRepository.delete = async () => {
        return err({
          type: 'WriteError',
          path: '.michi/specs/test-feature',
          cause: 'Permission denied',
        } as const);
      };

      const useCase = new ArchiveSpecUseCase(mockRepository);
      const featureName = new FeatureName('test-feature');

      const result = await useCase.execute(featureName);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RepositoryError');
      }
    });
  });
});
