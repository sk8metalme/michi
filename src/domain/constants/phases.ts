/**
 * Domain Constants - Phases
 *
 * Defines the phases of a specification in the cc-sdd workflow.
 */

export type Phase =
  | 'initialized'
  | 'requirements-generated'
  | 'design-generated'
  | 'tasks-generated'
  | 'implementation-in-progress'
  | 'implementation-complete';

/**
 * All valid phases in order
 */
export const PHASES: readonly Phase[] = [
  'initialized',
  'requirements-generated',
  'design-generated',
  'tasks-generated',
  'implementation-in-progress',
  'implementation-complete',
] as const;

/**
 * Check if a string is a valid Phase
 *
 * @param value - String to check
 * @returns True if valid phase, false otherwise
 */
export function isValidPhase(value: string): value is Phase {
  return (PHASES as readonly string[]).includes(value);
}

/**
 * Get the next phase in the sequence
 *
 * @param currentPhase - Current phase
 * @returns Next phase or null if at end
 */
export function getNextPhase(currentPhase: Phase): Phase | null {
  const currentIndex = PHASES.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === PHASES.length - 1) {
    return null;
  }
  return PHASES[currentIndex + 1];
}

/**
 * Get the previous phase in the sequence
 *
 * @param currentPhase - Current phase
 * @returns Previous phase or null if at beginning
 */
export function getPreviousPhase(currentPhase: Phase): Phase | null {
  const currentIndex = PHASES.indexOf(currentPhase);
  if (currentIndex <= 0) {
    return null;
  }
  return PHASES[currentIndex - 1];
}
