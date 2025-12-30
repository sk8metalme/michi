import { describe, it, expect } from 'vitest';
import {
  Phase,
  PHASES,
  isValidPhase,
  getNextPhase,
  getPreviousPhase,
} from '../phases.js';

describe('Domain Constants - Phases', () => {
  describe('Phase type', () => {
    it('should have all valid phase values', () => {
      const expectedPhases: Phase[] = [
        'initialized',
        'requirements-generated',
        'design-generated',
        'tasks-generated',
        'implementation-in-progress',
        'implementation-complete',
      ];

      expect(PHASES).toEqual(expectedPhases);
    });
  });

  describe('isValidPhase', () => {
    it('should return true for valid phases', () => {
      expect(isValidPhase('initialized')).toBe(true);
      expect(isValidPhase('requirements-generated')).toBe(true);
      expect(isValidPhase('design-generated')).toBe(true);
      expect(isValidPhase('tasks-generated')).toBe(true);
      expect(isValidPhase('implementation-in-progress')).toBe(true);
      expect(isValidPhase('implementation-complete')).toBe(true);
    });

    it('should return false for invalid phases', () => {
      expect(isValidPhase('invalid-phase')).toBe(false);
      expect(isValidPhase('')).toBe(false);
      expect(isValidPhase('INITIALIZED')).toBe(false);
    });
  });

  describe('getNextPhase', () => {
    it('should return the next phase in sequence', () => {
      expect(getNextPhase('initialized')).toBe('requirements-generated');
      expect(getNextPhase('requirements-generated')).toBe('design-generated');
      expect(getNextPhase('design-generated')).toBe('tasks-generated');
      expect(getNextPhase('tasks-generated')).toBe('implementation-in-progress');
      expect(getNextPhase('implementation-in-progress')).toBe('implementation-complete');
    });

    it('should return null for the final phase', () => {
      expect(getNextPhase('implementation-complete')).toBeNull();
    });

    it('should return null for invalid phases', () => {
      expect(getNextPhase('invalid-phase' as Phase)).toBeNull();
    });
  });

  describe('getPreviousPhase', () => {
    it('should return the previous phase in sequence', () => {
      expect(getPreviousPhase('requirements-generated')).toBe('initialized');
      expect(getPreviousPhase('design-generated')).toBe('requirements-generated');
      expect(getPreviousPhase('tasks-generated')).toBe('design-generated');
      expect(getPreviousPhase('implementation-in-progress')).toBe('tasks-generated');
      expect(getPreviousPhase('implementation-complete')).toBe('implementation-in-progress');
    });

    it('should return null for the initial phase', () => {
      expect(getPreviousPhase('initialized')).toBeNull();
    });

    it('should return null for invalid phases', () => {
      expect(getPreviousPhase('invalid-phase' as Phase)).toBeNull();
    });
  });
});
