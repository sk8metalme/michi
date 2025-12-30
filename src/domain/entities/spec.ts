/**
 * Domain Entity - Spec
 *
 * Represents a specification in the cc-sdd workflow
 */

import type { Phase } from '../constants/phases.js';
import { getNextPhase } from '../constants/phases.js';

export interface ApprovalState {
  generated: boolean;
  approved: boolean;
}

export interface Approvals {
  requirements: ApprovalState;
  design: ApprovalState;
  tasks: ApprovalState;
}

export type ApprovalType = keyof Approvals;

/**
 * Spec Entity
 *
 * Core domain entity representing a feature specification
 */
export class Spec {
  private _featureName: string;
  private _phase: Phase;
  private _language: string;
  private _approvals: Approvals;

  constructor(
    featureName: string,
    phase: Phase,
    language: string,
    approvals?: Approvals
  ) {
    this._featureName = featureName;
    this._phase = phase;
    this._language = language;
    this._approvals = approvals || {
      requirements: { generated: false, approved: false },
      design: { generated: false, approved: false },
      tasks: { generated: false, approved: false },
    };
  }

  get featureName(): string {
    return this._featureName;
  }

  get phase(): Phase {
    return this._phase;
  }

  get language(): string {
    return this._language;
  }

  get approvals(): Approvals {
    return this._approvals;
  }

  /**
   * Update the phase of this specification
   *
   * @param newPhase - New phase to transition to
   * @throws Error if phase transition is invalid
   */
  updatePhase(newPhase: Phase): void {
    // Validate phase transition
    if (!this.canTransitionTo(newPhase)) {
      throw new Error(
        `Invalid phase transition from ${this._phase} to ${newPhase}`
      );
    }
    this._phase = newPhase;
  }

  /**
   * Approve a specific approval type
   *
   * @param type - Type of approval (requirements, design, tasks)
   * @throws Error if the item is not generated yet
   */
  approve(type: ApprovalType): void {
    if (!this._approvals[type].generated) {
      throw new Error(`Cannot approve: ${type} not generated yet`);
    }
    this._approvals[type].approved = true;
  }

  /**
   * Check if ready to transition to next phase
   *
   * @returns True if ready for next phase
   */
  isReadyForNextPhase(): boolean {
    switch (this._phase) {
    case 'initialized':
      return true; // Always ready to generate requirements

    case 'requirements-generated':
      return this._approvals.requirements.approved;

    case 'design-generated':
      return this._approvals.design.approved;

    case 'tasks-generated':
      return this._approvals.tasks.approved;

    case 'implementation-in-progress':
    case 'implementation-complete':
      return true; // Implementation phases don't block transitions

    default:
      return false;
    }
  }

  /**
   * Check if ready for implementation
   *
   * @returns True if all approvals are done
   */
  isReadyForImplementation(): boolean {
    return (
      this._approvals.requirements.approved &&
      this._approvals.design.approved &&
      this._approvals.tasks.approved
    );
  }

  /**
   * Check if can transition to a new phase
   *
   * @param newPhase - Target phase
   * @returns True if transition is valid
   */
  private canTransitionTo(newPhase: Phase): boolean {
    const nextPhase = getNextPhase(this._phase);

    // Can always stay in same phase
    if (newPhase === this._phase) {
      return true;
    }

    // Can only transition to next phase in sequence
    return newPhase === nextPhase;
  }
}
