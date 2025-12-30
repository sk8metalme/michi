/**
 * ArchiveSpecUseCase - Archive a specification
 *
 * Application layer use case for spec archiving
 */

import type { Result } from '../../../shared/types/result.js';
import type { UseCaseError } from '../../../shared/types/errors.js';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import type { FeatureName } from '../../../domain/value-objects/feature-name.js';
import { ok, err } from '../../../shared/types/result.js';

/**
 * ArchiveSpecUseCase Result
 */
export interface ArchiveSpecResult {
  featureName: FeatureName;
  archiveLocation: string;
  archivedFiles: string[];
}

/**
 * ArchiveSpecUseCase
 *
 * Archive a specification after implementation is complete
 */
export class ArchiveSpecUseCase {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Execute use case
   *
   * @param featureName - Feature name to archive
   * @returns Success with ArchiveSpecResult or failure with UseCaseError
   */
  async execute(
    featureName: FeatureName
  ): Promise<Result<ArchiveSpecResult, UseCaseError>> {
    // Load spec from repository
    const specResult = await this.repository.findByFeatureName(featureName);
    if (!specResult.success) {
      return err({
        type: 'RepositoryError',
        cause: specResult.error,
      });
    }

    // Note: No phase validation - specs can be archived in any phase
    // This allows for archiving abandoned or cancelled specs as well

    // Delete spec from active repository
    // (The repository implementation will handle moving to archive)
    const deleteResult = await this.repository.delete(featureName);
    if (!deleteResult.success) {
      return err({
        type: 'RepositoryError',
        cause: deleteResult.error,
      });
    }

    // Return result
    return ok({
      featureName,
      archiveLocation: `.kiro/specs/.archive/${featureName.value}`,
      archivedFiles: [
        'spec.json',
        'requirements.md',
        'design.md',
        'tasks.md',
      ],
    });
  }
}
