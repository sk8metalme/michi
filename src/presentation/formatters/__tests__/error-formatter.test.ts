/**
 * Error Formatter Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorFormatter,
  formatErrorDetails,
  formatErrorObject,
  formatValidationError,
  formatFileSystemError,
  formatNetworkError,
  formatCommandError,
  type ErrorDetails,
} from '../error-formatter.js';

describe('ErrorFormatter', () => {
  describe('format', () => {
    it('should format basic error details', () => {
      const formatter = new ErrorFormatter({ color: false });
      const details: ErrorDetails = {
        message: 'Something went wrong',
      };

      const result = formatter.format(details);
      expect(result).toContain('❌ Something went wrong');
    });

    it('should include error code', () => {
      const formatter = new ErrorFormatter({ color: false });
      const details: ErrorDetails = {
        message: 'Error occurred',
        code: 'ERR_001',
      };

      const result = formatter.format(details);
      expect(result).toContain('Error Code: ERR_001');
    });

    it('should include cause', () => {
      const formatter = new ErrorFormatter({ color: false });
      const details: ErrorDetails = {
        message: 'Error occurred',
        cause: 'Network timeout',
      };

      const result = formatter.format(details);
      expect(result).toContain('Cause: Network timeout');
    });

    it('should include suggestion', () => {
      const formatter = new ErrorFormatter({ color: false });
      const details: ErrorDetails = {
        message: 'Error occurred',
        suggestion: 'Try again later',
      };

      const result = formatter.format(details);
      expect(result).toContain('Suggestion: Try again later');
    });

    it('should include context', () => {
      const formatter = new ErrorFormatter({ color: false });
      const details: ErrorDetails = {
        message: 'Error occurred',
        context: {
          file: 'test.txt',
          line: 42,
        },
      };

      const result = formatter.format(details);
      expect(result).toContain('Context');
      expect(result).toContain('file: test.txt');
      expect(result).toContain('line: 42');
    });
  });

  describe('formatError', () => {
    it('should format Error object', () => {
      const formatter = new ErrorFormatter({ color: false });
      const error = new Error('Test error');

      const result = formatter.formatError(error);
      expect(result).toContain('❌ Test error');
    });

    it('should include suggestion in formatError', () => {
      const formatter = new ErrorFormatter({ color: false });
      const error = new Error('Test error');

      const result = formatter.formatError(error, 'Check the logs');
      expect(result).toContain('Suggestion: Check the logs');
    });

    it('should include context in formatError', () => {
      const formatter = new ErrorFormatter({ color: false });
      const error = new Error('Test error');

      const result = formatter.formatError(error, undefined, { user: 'test' });
      expect(result).toContain('user: test');
    });
  });

  describe('formatValidationError', () => {
    it('should format validation error', () => {
      const formatter = new ErrorFormatter({ color: false });
      const result = formatter.formatValidationError(
        'email',
        'Invalid email format',
        'invalid@'
      );

      expect(result).toContain('Validation failed: email');
      expect(result).toContain('Invalid email format');
      expect(result).toContain('email: invalid@');
    });
  });

  describe('formatFileSystemError', () => {
    it('should format file system error', () => {
      const formatter = new ErrorFormatter({ color: false });
      const error = new Error('ENOENT: no such file or directory');
      const result = formatter.formatFileSystemError(
        'read',
        '/path/to/file.txt',
        error
      );

      expect(result).toContain('File system error during read');
      expect(result).toContain('ENOENT: no such file or directory');
      expect(result).toContain('path: /path/to/file.txt');
    });
  });

  describe('formatNetworkError', () => {
    it('should format network error', () => {
      const formatter = new ErrorFormatter({ color: false });
      const error = new Error('Connection timeout');
      const result = formatter.formatNetworkError(
        'https://api.example.com',
        error
      );

      expect(result).toContain('Network request failed');
      expect(result).toContain('Connection timeout');
      expect(result).toContain('endpoint: https://api.example.com');
    });
  });

  describe('formatCommandError', () => {
    it('should format command error', () => {
      const formatter = new ErrorFormatter({ color: false });
      const result = formatter.formatCommandError(
        'npm install',
        1,
        'Module not found'
      );

      expect(result).toContain('Command execution failed: npm install');
      expect(result).toContain('EXIT_1');
      expect(result).toContain('Module not found');
    });
  });
});

describe('Error formatter functions', () => {
  it('formatErrorDetails should work', () => {
    const details: ErrorDetails = {
      message: 'Error',
    };
    const result = formatErrorDetails(details, { color: false });
    expect(result).toContain('❌ Error');
  });

  it('formatErrorObject should work', () => {
    const error = new Error('Test');
    const result = formatErrorObject(error, undefined, undefined, {
      color: false,
    });
    expect(result).toContain('❌ Test');
  });

  it('formatValidationError should work', () => {
    const result = formatValidationError('field', 'Invalid', 'value', {
      color: false,
    });
    expect(result).toContain('Validation failed: field');
  });

  it('formatFileSystemError should work', () => {
    const error = new Error('Error');
    const result = formatFileSystemError('read', '/path', error, {
      color: false,
    });
    expect(result).toContain('File system error during read');
  });

  it('formatNetworkError should work', () => {
    const error = new Error('Error');
    const result = formatNetworkError('http://example.com', error, {
      color: false,
    });
    expect(result).toContain('Network request failed');
  });

  it('formatCommandError should work', () => {
    const result = formatCommandError('cmd', 1, 'stderr', { color: false });
    expect(result).toContain('Command execution failed: cmd');
  });
});
