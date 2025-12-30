import { describe, it, expect } from 'vitest';
import { Spec } from '../spec.js';
import type { Phase } from '../../constants/phases.js';

describe('Domain Entity - Spec', () => {
  describe('constructor', () => {
    it('should create a new Spec with valid properties', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');

      expect(spec.featureName).toBe('my-feature');
      expect(spec.phase).toBe('initialized');
      expect(spec.language).toBe('ja');
      expect(spec.approvals).toEqual({
        requirements: { generated: false, approved: false },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });
      expect(spec.isReadyForImplementation()).toBe(false);
    });

    it('should create Spec with custom approvals', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });

      expect(spec.approvals.requirements.generated).toBe(true);
      expect(spec.approvals.requirements.approved).toBe(true);
    });
  });

  describe('updatePhase', () => {
    it('should update phase to a valid next phase', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');
      spec.updatePhase('requirements-generated');

      expect(spec.phase).toBe('requirements-generated');
    });

    it('should throw error for invalid phase transition', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');

      expect(() => spec.updatePhase('implementation-complete' as Phase))
        .toThrow('Invalid phase transition');
    });
  });

  describe('approve', () => {
    it('should approve requirements when generated', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: false },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });

      spec.approve('requirements');

      expect(spec.approvals.requirements.approved).toBe(true);
    });

    it('should throw error when approving non-generated item', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');

      expect(() => spec.approve('requirements'))
        .toThrow('Cannot approve: requirements not generated yet');
    });
  });

  describe('isReadyForNextPhase', () => {
    it('should return true when ready for requirements generation', () => {
      const spec = new Spec('my-feature', 'initialized', 'ja');
      expect(spec.isReadyForNextPhase()).toBe(true);
    });

    it('should return true when requirements approved', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });

      expect(spec.isReadyForNextPhase()).toBe(true);
    });

    it('should return false when requirements not approved', () => {
      const spec = new Spec('my-feature', 'requirements-generated', 'ja', {
        requirements: { generated: true, approved: false },
        design: { generated: false, approved: false },
        tasks: { generated: false, approved: false },
      });

      expect(spec.isReadyForNextPhase()).toBe(false);
    });
  });

  describe('isReadyForImplementation', () => {
    it('should return true when all approvals are done', () => {
      const spec = new Spec('my-feature', 'tasks-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: true, approved: true },
        tasks: { generated: true, approved: true },
      });

      expect(spec.isReadyForImplementation()).toBe(true);
    });

    it('should return false when not all approved', () => {
      const spec = new Spec('my-feature', 'tasks-generated', 'ja', {
        requirements: { generated: true, approved: true },
        design: { generated: true, approved: false },
        tasks: { generated: true, approved: true },
      });

      expect(spec.isReadyForImplementation()).toBe(false);
    });
  });
});
