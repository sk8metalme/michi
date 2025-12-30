import { describe, it, expect } from 'vitest';
import { SpecValidator } from '../spec-validator.js';
import { Spec } from '../../entities/spec.js';
import type { Phase } from '../../constants/phases.js';

describe('Domain Service - SpecValidator', () => {
  describe('validatePhaseTransition', () => {
    it('should allow transition from initialized to requirements-generated', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');
      const result = SpecValidator.validatePhaseTransition(spec, 'requirements-generated');

      expect(result.isValid).toBe(true);
    });

    it('should reject skipping phases', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');
      const result = SpecValidator.validatePhaseTransition(spec, 'implementation-complete' as Phase);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot skip phases');
    });

    it('should reject transition when approvals not met', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: false },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });
      const result = SpecValidator.validatePhaseTransition(spec, 'design-generated');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Requirements must be approved');
    });

    it('should allow transition when approvals met', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });
      const result = SpecValidator.validatePhaseTransition(spec, 'design-generated');

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateApprovals', () => {
    it('should validate all approvals are present', () => {
      const spec = new Spec('my-feature', 'tasks-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: true, approved: true },
        tasks: { generated: true, approved: true },
      });
      const result = SpecValidator.validateApprovals(spec);

      expect(result.isValid).toBe(true);
    });

    it('should fail when approvals missing', () => {
      const spec = new Spec('my-feature', 'tasks-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: true, approved: false },
        tasks: { generated: true, approved: true },
      });
      const result = SpecValidator.validateApprovals(spec);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Design must be approved');
    });
  });

  describe('validateUniqueness', () => {
    it('should validate feature name uniqueness', () => {
      const existingFeatures = ['feature-a', 'feature-b'];
      const result = SpecValidator.validateUniqueness('feature-c', existingFeatures);

      expect(result.isValid).toBe(true);
    });

    it('should reject duplicate feature names', () => {
      const existingFeatures = ['feature-a', 'feature-b'];
      const result = SpecValidator.validateUniqueness('feature-a', existingFeatures);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });
});
