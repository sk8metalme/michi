/**
 * InitSpecUseCase - Initialize a new specification
 *
 * Application layer use case for spec initialization
 */

import type { Result } from '../../../shared/types/result.js';
import type { UseCaseError, RepositoryError } from '../../../shared/types/errors.js';
import type { SpecRepository } from '../../interfaces/spec-repository.js';
import { ok, err } from '../../../shared/types/result.js';
import { Spec } from '../../../domain/entities/spec.js';
import { FeatureName } from '../../../domain/value-objects/feature-name.js';

/**
 * InitSpecUseCase Result
 */
export interface InitSpecResult {
  featureName: FeatureName;
  createdFiles: string[];
  nextCommand: string;
}

/**
 * InitSpecUseCase
 *
 * Initialize a new specification with unique feature name
 */
export class InitSpecUseCase {
  constructor(private readonly repository: SpecRepository) {}

  /**
   * Execute use case
   *
   * @param projectDescription - Project description to generate feature name
   * @returns Success with InitSpecResult or failure with UseCaseError
   */
  async execute(
    projectDescription: string
  ): Promise<Result<InitSpecResult, UseCaseError>> {
    // Validate input
    if (!projectDescription || projectDescription.trim().length === 0) {
      return err({
        type: 'InvalidInput',
        message: 'Project description cannot be empty',
      });
    }

    // Generate feature name from project description
    const baseFeatureName = this.generateFeatureName(projectDescription);

    // Ensure uniqueness (auto-generate suffixes on collision)
    const uniqueFeatureName = await this.ensureUniqueness(baseFeatureName);
    if (!uniqueFeatureName.success) {
      return err({
        type: 'RepositoryError',
        cause: uniqueFeatureName.error,
      });
    }

    const featureName = uniqueFeatureName.value;

    // Create Spec entity
    const spec = new Spec(featureName.value, 'initialized', 'ja');

    // Save to repository
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
      createdFiles: ['spec.json', 'requirements.md'],
      nextCommand: `/michi:spec-requirements ${featureName.value}`,
    });
  }

  /**
   * Generate feature name from project description
   *
   * @param description - Project description
   * @returns Feature name in kebab-case
   */
  private generateFeatureName(description: string): string {
    // Convert to lowercase, remove special chars, replace spaces with hyphens
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Ensure feature name is unique
   *
   * @param baseFeatureName - Base feature name
   * @returns Unique FeatureName or error
   */
  private async ensureUniqueness(
    baseFeatureName: string
  ): Promise<Result<FeatureName, RepositoryError>> {
    let candidateName = baseFeatureName;
    let suffix = 1;

    while (true) {
      // Try to create FeatureName
      let featureName: FeatureName;
      try {
        featureName = new FeatureName(candidateName);
      } catch {
        // Invalid feature name, try next
        suffix++;
        candidateName = `${baseFeatureName}-${suffix}`;
        continue;
      }

      // Check if exists
      const existsResult = await this.repository.exists(featureName);
      if (!existsResult.success) {
        return err(existsResult.error);
      }

      if (!existsResult.value) {
        // Unique feature name found
        return ok(featureName);
      }

      // Collision, try next
      suffix++;
      candidateName = `${baseFeatureName}-${suffix}`;

      // Safety limit
      if (suffix > 100) {
        return err({
          type: 'WriteError',
          path: candidateName,
          cause: 'Too many collisions, cannot generate unique feature name',
        });
      }
    }
  }
}
