/**
 * SpecService - Unified service for spec operations
 *
 * Application layer service that coordinates spec-related operations
 * Replaces scripts/utils/spec-loader.ts and spec-updater.ts
 */

import type { Result } from '../../shared/types/result.js';
import type { UseCaseError } from '../../shared/types/errors.js';
import type { SpecRepository } from '../interfaces/spec-repository.js';
import type { Spec } from '../../domain/entities/spec.js';
import type { FeatureName } from '../../domain/value-objects/feature-name.js';

/**
 * SpecService
 *
 * Central service for spec loading and updating operations
 * Delegates to repository for persistence
 */
export class SpecService {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Load a spec by feature name
   *
   * @param featureName - Feature name to load
   * @returns Spec or error
   */
  async loadSpec(
    featureName: FeatureName
  ): Promise<Result<Spec, UseCaseError>> {
    const result = await this.repository.findByFeatureName(featureName);
    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'RepositoryError',
          cause: result.error,
        },
      };
    }
    return result;
  }

  /**
   * Load all specs
   *
   * @returns Array of specs or error
   */
  async loadAllSpecs(): Promise<Result<Spec[], UseCaseError>> {
    const result = await this.repository.findAll();
    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'RepositoryError',
          cause: result.error,
        },
      };
    }
    return result;
  }

  /**
   * Update a spec
   *
   * @param spec - Spec to update
   * @returns Success or error
   */
  async updateSpec(spec: Spec): Promise<Result<void, UseCaseError>> {
    const result = await this.repository.save(spec);
    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'RepositoryError',
          cause: result.error,
        },
      };
    }
    return result;
  }

  /**
   * Check if a spec exists
   *
   * @param featureName - Feature name to check
   * @returns True if exists, false otherwise
   */
  async specExists(
    featureName: FeatureName
  ): Promise<Result<boolean, UseCaseError>> {
    const result = await this.repository.exists(featureName);
    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'RepositoryError',
          cause: result.error,
        },
      };
    }
    return result;
  }
}
