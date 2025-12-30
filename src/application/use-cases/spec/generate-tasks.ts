/**
 * GenerateTasksUseCase - Generate tasks for a specification
 *
 * Application layer use case for tasks generation
 */

import type { Result } from '../../../shared/types/result.js';
import type { UseCaseError } from '../../../shared/types/errors.js';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import type { FeatureName } from '../../../domain/value-objects/feature-name.js';
import { ok, err } from '../../../shared/types/result.js';

/**
 * GenerateTasksUseCase Result
 */
export interface GenerateTasksResult {
  featureName: FeatureName;
  tasksFile: string;
  nextCommand: string;
}

/**
 * GenerateTasksUseCase
 *
 * Generate tasks document for a specification
 */
export class GenerateTasksUseCase {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Execute use case
   *
   * @param featureName - Feature name to generate tasks for
   * @returns Success with GenerateTasksResult or failure with UseCaseError
   */
  async execute(
    featureName: FeatureName
  ): Promise<Result<GenerateTasksResult, UseCaseError>> {
    // Load spec from repository
    const specResult = await this.repository.findByFeatureName(featureName);
    if (!specResult.success) {
      return err({
        type: 'RepositoryError',
        cause: specResult.error,
      });
    }

    const spec = specResult.value;

    // Verify spec is in design-generated phase
    if (spec.phase !== 'design-generated') {
      return err({
        type: 'InvalidInput',
        message: `Spec must be in 'design-generated' phase to generate tasks, but is in '${spec.phase}' phase`,
      });
    }

    // Update spec phase to tasks-generated
    spec.updatePhase('tasks-generated');

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
      tasksFile: 'tasks.md',
      nextCommand: `/kiro:spec-impl ${featureName.value}`,
    });
  }
}
