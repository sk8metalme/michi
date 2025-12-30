/**
 * Domain Constants - Approval Status
 *
 * Defines the approval statuses for specifications in the cc-sdd workflow.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * All valid approval statuses
 */
export const APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  'pending',
  'approved',
  'rejected',
] as const;

/**
 * Check if a string is a valid ApprovalStatus
 *
 * @param value - String to check
 * @returns True if valid approval status, false otherwise
 */
export function isValidApprovalStatus(value: string): value is ApprovalStatus {
  return (APPROVAL_STATUSES as readonly string[]).includes(value);
}
