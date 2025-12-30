import { describe, it, expect } from 'vitest';
import { FeatureName } from '../feature-name.js';

describe('Value Object - FeatureName', () => {
  describe('constructor', () => {
    it('should create FeatureName with valid kebab-case name', () => {
      const featureName = new FeatureName('my-feature');
      expect(featureName.value).toBe('my-feature');
    });

    it('should throw error for invalid format', () => {
      expect(() => new FeatureName('MyFeature')).toThrow('must be in kebab-case format');
      expect(() => new FeatureName('my_feature')).toThrow('must be in kebab-case format');
      expect(() => new FeatureName('my feature')).toThrow('must be in kebab-case format');
    });

    it('should throw error for too short name', () => {
      expect(() => new FeatureName('ab')).toThrow('at least 3 characters');
    });

    it('should throw error for too long name', () => {
      const longName = 'a'.repeat(51);
      expect(() => new FeatureName(longName)).toThrow('not exceed 50 characters');
    });

    it('should throw error for empty name', () => {
      expect(() => new FeatureName('')).toThrow('required');
    });
  });

  describe('equals', () => {
    it('should return true for equal feature names', () => {
      const name1 = new FeatureName('my-feature');
      const name2 = new FeatureName('my-feature');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different feature names', () => {
      const name1 = new FeatureName('my-feature');
      const name2 = new FeatureName('other-feature');
      expect(name1.equals(name2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const featureName = new FeatureName('my-feature');
      expect(featureName.toString()).toBe('my-feature');
    });
  });
});
