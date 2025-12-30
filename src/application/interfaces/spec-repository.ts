/**
 * SpecRepository Interface (Port)
 *
 * Application layer interface for Spec persistence
 * Infrastructure layer provides the implementation (Adapter)
 */

import type { Result } from '../../shared/types/result.js';
import type { RepositoryError } from '../../shared/types/errors.js';
import type { Spec } from '../../domain/entities/spec.js';
import type { FeatureName } from '../../domain/value-objects/feature-name.js';

/**
 * Specification Repository Interface
 *
 * Defines persistence operations for Spec entity
 */
export interface SpecRepository {
  /**
   * Find specification by feature name
   *
   * @param featureName - Feature name to search
   * @returns Success with Spec or failure with RepositoryError
   */
  findByFeatureName(
    featureName: FeatureName
  ): Promise<Result<Spec, RepositoryError>>;

  /**
   * Find all specifications
   *
   * @returns Success with array of Specs or failure with RepositoryError
   */
  findAll(): Promise<Result<Spec[], RepositoryError>>;

  /**
   * Save specification
   *
   * @param spec - Specification to save
   * @returns Success with void or failure with RepositoryError
   */
  save(spec: Spec): Promise<Result<void, RepositoryError>>;

  /**
   * Delete specification by feature name
   *
   * @param featureName - Feature name to delete
   * @returns Success with void or failure with RepositoryError
   */
  delete(featureName: FeatureName): Promise<Result<void, RepositoryError>>;

  /**
   * Check if specification exists
   *
   * @param featureName - Feature name to check
   * @returns Success with boolean or failure with RepositoryError
   */
  exists(featureName: FeatureName): Promise<Result<boolean, RepositoryError>>;
}
