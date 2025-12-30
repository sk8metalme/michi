/**
 * GenerateDesignUseCase - Generate design for a specification
 *
 * Application layer use case for design generation
 */

import type { Result } from '../../../shared/types/result.js';
import type { UseCaseError } from '../../../shared/types/errors.js';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import type { FeatureName } from '../../../domain/value-objects/feature-name.js';
import { ok, err } from '../../../shared/types/result.js';

/**
 * GenerateDesignUseCase Result
 */
export interface GenerateDesignResult {
  featureName: FeatureName;
  designFile: string;
  nextCommand: string;
}

/**
 * GenerateDesignUseCase
 *
 * Generate design document for a specification
 */
export class GenerateDesignUseCase {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Execute use case
   *
   * @param featureName - Feature name to generate design for
   * @returns Success with GenerateDesignResult or failure with UseCaseError
   */
  async execute(
    featureName: FeatureName
  ): Promise<Result<GenerateDesignResult, UseCaseError>> {
    // Load spec from repository
    const specResult = await this.repository.findByFeatureName(featureName);
    if (!specResult.success) {
      return err({
        type: 'RepositoryError',
        cause: specResult.error,
      });
    }

    const spec = specResult.value;

    // Verify spec is in requirements-generated phase
    if (spec.phase !== 'requirements-generated') {
      return err({
        type: 'InvalidInput',
        message: `Spec must be in 'requirements-generated' phase to generate design, but is in '${spec.phase}' phase`,
      });
    }

    // Update spec phase to design-generated
    spec.updatePhase('design-generated');

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
      designFile: 'design.md',
      nextCommand: `/kiro:spec-tasks ${featureName.value}`,
    });
  }
}
