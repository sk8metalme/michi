import { describe, it, expect } from 'vitest';
import {
  ApprovalStatus,
  APPROVAL_STATUSES,
  isValidApprovalStatus,
} from '../approval.js';

describe('Domain Constants - Approval', () => {
  describe('ApprovalStatus type', () => {
    it('should have all valid approval statuses', () => {
      const expectedStatuses: ApprovalStatus[] = [
        'pending',
        'approved',
        'rejected',
      ];

      expect(APPROVAL_STATUSES).toEqual(expectedStatuses);
    });
  });

  describe('isValidApprovalStatus', () => {
    it('should return true for valid approval statuses', () => {
      expect(isValidApprovalStatus('pending')).toBe(true);
      expect(isValidApprovalStatus('approved')).toBe(true);
      expect(isValidApprovalStatus('rejected')).toBe(true);
    });

    it('should return false for invalid approval statuses', () => {
      expect(isValidApprovalStatus('invalid-status')).toBe(false);
      expect(isValidApprovalStatus('')).toBe(false);
      expect(isValidApprovalStatus('APPROVED')).toBe(false);
    });
  });
});
