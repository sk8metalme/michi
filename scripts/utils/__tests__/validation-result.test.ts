/**
 * ValidationResult 共通型のテスト
 */

import { describe, it, expect } from 'vitest';
import type { Result } from '../types/validation.js';

describe('Result<T, E> type', () => {
  describe('Success case', () => {
    it('should represent successful validation', () => {
      const result: Result<boolean, string> = {
        success: true,
        value: true,
        errors: [],
        warnings: []
      };

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should allow warnings in successful result', () => {
      const result: Result<boolean, string> = {
        success: true,
        value: true,
        errors: [],
        warnings: ['This is a warning']
      };

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBe(1);
    });
  });

  describe('Failure case', () => {
    it('should represent failed validation', () => {
      const result: Result<boolean, string> = {
        success: false,
        value: undefined,
        errors: ['Error message'],
        warnings: []
      };

      expect(result.success).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.errors.length).toBe(1);
    });

    it('should allow multiple errors', () => {
      const result: Result<boolean, string> = {
        success: false,
        value: undefined,
        errors: ['Error 1', 'Error 2', 'Error 3'],
        warnings: []
      };

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });

  describe('Type compatibility', () => {
    it('should work with different value types', () => {
      const stringResult: Result<string, string> = {
        success: true,
        value: 'test',
        errors: [],
        warnings: []
      };

      const numberResult: Result<number, string> = {
        success: true,
        value: 42,
        errors: [],
        warnings: []
      };

      const objectResult: Result<{ name: string }, string> = {
        success: true,
        value: { name: 'test' },
        errors: [],
        warnings: []
      };

      expect(stringResult.value).toBe('test');
      expect(numberResult.value).toBe(42);
      expect(objectResult.value).toEqual({ name: 'test' });
    });

    it('should work with different error types', () => {
      type ValidationError = {
        field: string;
        message: string;
      };

      const result: Result<boolean, ValidationError> = {
        success: false,
        value: undefined,
        errors: [
          { field: 'name', message: 'Required' },
          { field: 'email', message: 'Invalid format' }
        ],
        warnings: []
      };

      expect(result.errors.length).toBe(2);
      expect(result.errors[0].field).toBe('name');
    });
  });
});
