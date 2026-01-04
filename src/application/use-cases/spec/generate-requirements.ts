/**
 * GenerateRequirementsUseCase - Generate requirements for a specification
 *
 * Application layer use case for requirements generation
 */

import type { Result } from '../../../shared/types/result.js';
import type { UseCaseError } from '../../../shared/types/errors.js';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import type { FeatureName } from '../../../domain/value-objects/feature-name.js';
import { ok, err } from '../../../shared/types/result.js';

/**
 * GenerateRequirementsUseCase Result
 */
export interface GenerateRequirementsResult {
  featureName: FeatureName;
  requirementsFile: string;
  nextCommand: string;
}

/**
 * GenerateRequirementsUseCase
 *
 * Generate requirements document for a specification
 */
export class GenerateRequirementsUseCase {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Execute use case
   *
   * @param featureName - Feature name to generate requirements for
   * @returns Success with GenerateRequirementsResult or failure with UseCaseError
   */
  async execute(
    featureName: FeatureName
  ): Promise<Result<GenerateRequirementsResult, UseCaseError>> {
    // Load spec from repository
    const specResult = await this.repository.findByFeatureName(featureName);
    if (!specResult.success) {
      return err({
        type: 'RepositoryError',
        cause: specResult.error,
      });
    }

    const spec = specResult.value;

    // Verify spec is in initialized phase
    if (spec.phase !== 'initialized') {
      return err({
        type: 'InvalidInput',
        message: `Spec must be in 'initialized' phase to generate requirements, but is in '${spec.phase}' phase`,
      });
    }

    // Update spec phase to requirements-generated
    spec.updatePhase('requirements-generated');

    // Save updated spec
    const saveResult = await this.repository.save(spec);
    if (!saveResult.success) {
      return err({
        type: 'RepositoryError',
        cause: saveResult.error,
      });
    }

    // Return result
    return ok({
      featureName,
      requirementsFile: 'requirements.md',
      nextCommand: `/michi:spec-design ${featureName.value}`,
    });
  }
}
