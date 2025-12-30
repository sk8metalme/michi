/**
 * WorkflowService - Orchestrates spec workflow phases
 *
 * Application layer service for coordinating workflow execution
 * Replaces scripts/workflow-orchestrator.ts and scripts/phase-runner.ts
 *
 * NOTE: This is a simplified version. Full workflow orchestration
 * will be implemented in Phase 5 (Presentation Layer)
 */

import type { Result } from '../../shared/types/result.js';
import type { UseCaseError } from '../../shared/types/errors.js';
import type { FeatureName } from '../../domain/value-objects/feature-name.js';
import type { Phase } from '../../domain/constants/phases.js';
import { InitSpecUseCase } from '../use-cases/spec/init-spec.js';
import { GenerateRequirementsUseCase } from '../use-cases/spec/generate-requirements.js';
import { GenerateDesignUseCase } from '../use-cases/spec/generate-design.js';
import { GenerateTasksUseCase } from '../use-cases/spec/generate-tasks.js';
import { ArchiveSpecUseCase } from '../use-cases/spec/archive-spec.js';
import type { SpecRepository } from '../interfaces/spec-repository.js';

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  featureName: FeatureName;
  currentPhase: Phase;
  nextCommand: string;
}

/**
 * WorkflowService
 *
 * Coordinates the execution of workflow phases
 */
export class WorkflowService {
  private readonly initSpecUseCase: InitSpecUseCase;
  private readonly generateRequirementsUseCase: GenerateRequirementsUseCase;
  private readonly generateDesignUseCase: GenerateDesignUseCase;
  private readonly generateTasksUseCase: GenerateTasksUseCase;
  private readonly archiveSpecUseCase: ArchiveSpecUseCase;

  constructor(repository: SpecRepository) {
    this.initSpecUseCase = new InitSpecUseCase(repository);
    this.generateRequirementsUseCase = new GenerateRequirementsUseCase(
      repository
    );
    this.generateDesignUseCase = new GenerateDesignUseCase(repository);
    this.generateTasksUseCase = new GenerateTasksUseCase(repository);
    this.archiveSpecUseCase = new ArchiveSpecUseCase(repository);
  }

  /**
   * Initialize a new spec workflow
   *
   * @param projectDescription - Project description
   * @returns Workflow execution result
   */
  async initializeWorkflow(
    projectDescription: string
  ): Promise<Result<WorkflowExecutionResult, UseCaseError>> {
    const result = await this.initSpecUseCase.execute(projectDescription);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: {
        featureName: result.value.featureName,
        currentPhase: 'initialized',
        nextCommand: result.value.nextCommand,
      },
    };
  }

  /**
   * Execute a workflow phase
   *
   * @param featureName - Feature name
   * @param phase - Phase to execute
   * @returns Workflow execution result
   */
  async executePhase(
    featureName: FeatureName,
    phase: Phase
  ): Promise<Result<WorkflowExecutionResult, UseCaseError>> {
    switch (phase) {
    case 'requirements-generated': {
      const result =
          await this.generateRequirementsUseCase.execute(featureName);
      if (!result.success) return result;
      return {
        success: true,
        value: {
          featureName,
          currentPhase: 'requirements-generated',
          nextCommand: result.value.nextCommand,
        },
      };
    }

    case 'design-generated': {
      const result = await this.generateDesignUseCase.execute(featureName);
      if (!result.success) return result;
      return {
        success: true,
        value: {
          featureName,
          currentPhase: 'design-generated',
          nextCommand: result.value.nextCommand,
        },
      };
    }

    case 'tasks-generated': {
      const result = await this.generateTasksUseCase.execute(featureName);
      if (!result.success) return result;
      return {
        success: true,
        value: {
          featureName,
          currentPhase: 'tasks-generated',
          nextCommand: result.value.nextCommand,
        },
      };
    }

    default:
      return {
        success: false,
        error: {
          type: 'InvalidInput',
          message: `Unsupported phase: ${phase}`,
        },
      };
    }
  }

  /**
   * Archive a completed spec
   *
   * @param featureName - Feature name to archive
   * @returns Archive result
   */
  async archiveSpec(featureName: FeatureName): Promise<Result<void, UseCaseError>> {
    const result = await this.archiveSpecUseCase.execute(featureName);

    if (!result.success) {
      return result;
    }

    return { success: true, value: undefined };
  }
}
