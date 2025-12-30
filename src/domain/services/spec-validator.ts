/**
 * Domain Service - SpecValidator
 *
 * Validates specifications and phase transitions
 */

import type { Spec } from '../entities/spec.js';
import type { Phase } from '../constants/phases.js';
import { getNextPhase } from '../constants/phases.js';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * SpecValidator Domain Service
 *
 * Provides validation logic for spec-related operations
 */
export class SpecValidator {
  /**
   * Validate phase transition
   *
   * @param spec - Specification to validate
   * @param targetPhase - Target phase to transition to
   * @returns Validation result
   */
  static validatePhaseTransition(spec: Spec, targetPhase: Phase): ValidationResult {
    const currentPhase = spec.phase;
    const nextPhase = getNextPhase(currentPhase);

    // Can't skip phases
    if (targetPhase !== currentPhase && targetPhase !== nextPhase) {
      return {
        isValid: false,
        error: `Cannot skip phases. Current: ${currentPhase}, Target: ${targetPhase}, Expected: ${nextPhase}`,
      };
    }

    // Check if ready for next phase
    if (targetPhase === nextPhase && !spec.isReadyForNextPhase()) {
      return {
        isValid: false,
        error: this.getPhaseTransitionError(currentPhase),
      };
    }

    return { isValid: true };
  }

  /**
   * Validate all approvals are present
   *
   * @param spec - Specification to validate
   * @returns Validation result
   */
  static validateApprovals(spec: Spec): ValidationResult {
    const { approvals } = spec;

    if (!approvals.requirements.approved) {
      return {
        isValid: false,
        error: 'Requirements must be approved before implementation',
      };
    }

    if (!approvals.design.approved) {
      return {
        isValid: false,
        error: 'Design must be approved before implementation',
      };
    }

    if (!approvals.tasks.approved) {
      return {
        isValid: false,
        error: 'Tasks must be approved before implementation',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate feature name uniqueness
   *
   * @param featureName - Feature name to check
   * @param existingFeatures - List of existing feature names
   * @returns Validation result
   */
  static validateUniqueness(
    featureName: string,
    existingFeatures: string[]
  ): ValidationResult {
    if (existingFeatures.includes(featureName)) {
      return {
        isValid: false,
        error: `Feature '${featureName}' already exists`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get phase-specific transition error message
   */
  private static getPhaseTransitionError(currentPhase: Phase): string {
    switch (currentPhase) {
    case 'requirements-generated':
      return 'Requirements must be approved before proceeding to design';
    case 'design-generated':
      return 'Design must be approved before proceeding to tasks';
    case 'tasks-generated':
      return 'Tasks must be approved before proceeding to implementation';
    default:
      return 'Phase transition requirements not met';
    }
  }
}
