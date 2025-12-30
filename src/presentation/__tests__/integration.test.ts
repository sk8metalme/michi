/**
 * Presentation Layer Integration Tests
 *
 * Tests the integration between formatters, interactive UI, and command handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as readline from 'readline';
import {
  formatSuccess,
  formatError,
  formatWarning,
  formatProgressBar,
  formatTaskList,
  type TaskInfo,
} from '../formatters/index.js';
import {
  question,
  confirm,
  select,
  type Choice,
} from '../interactive/index.js';

describe('Presentation Layer Integration', () => {
  describe('Formatters Integration', () => {
    it('should format success messages consistently', () => {
      const result = formatSuccess('Operation completed');
      expect(result).toContain('✅');
      expect(result).toContain('Operation completed');
    });

    it('should format error messages consistently', () => {
      const result = formatError('Operation failed');
      expect(result).toContain('❌');
      expect(result).toContain('Operation failed');
    });

    it('should format warning messages consistently', () => {
      const result = formatWarning('Operation warning');
      expect(result).toContain('⚠️');
      expect(result).toContain('Operation warning');
    });

    it('should format progress bars consistently', () => {
      const result = formatProgressBar(50, 100);
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('50%');
    });

    it('should format task lists with status emojis', () => {
      const tasks: TaskInfo[] = [
        { name: 'Task 1', status: 'completed' },
        { name: 'Task 2', status: 'running' },
        { name: 'Task 3', status: 'failed' },
      ];
      const result = formatTaskList(tasks);
      expect(result).toContain('✅');
      expect(result).toContain('🔄');
      expect(result).toContain('❌');
    });
  });

  describe('Interactive UI Integration', () => {
    let mockRl: readline.Interface;

    beforeEach(() => {
      mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      } as unknown as readline.Interface;
    });

    it('should handle question prompts', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('test answer');
      });

      const result = await question(mockRl, 'Test question: ');
      expect(result).toBe('test answer');
    });

    it('should handle confirm with default true', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('');
      });

      const result = await confirm(mockRl, 'Confirm?', true);
      expect(result).toBe(true);
    });

    it('should handle confirm with yes response', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('y');
      });

      const result = await confirm(mockRl, 'Confirm?', false);
      expect(result).toBe(true);
    });

    it('should handle select with valid choice', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('1');
      });

      const choices: Choice[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      const result = await select(mockRl, 'Select an option', choices);
      expect(result).toBe('option1');
    });

    it('should handle select with default value', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('');
      });

      const choices: Choice[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      const result = await select(mockRl, 'Select an option', choices, 'option2');
      expect(result).toBe('option2');
    });
  });

  describe('Formatters + Interactive UI Integration', () => {
    let mockRl: readline.Interface;

    beforeEach(() => {
      mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      } as unknown as readline.Interface;
    });

    it('should combine formatted messages with interactive prompts', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('y');
      });

      // Format a success message
      const successMsg = formatSuccess('Setup completed');
      expect(successMsg).toContain('✅');

      // Confirm next action
      const shouldContinue = await confirm(mockRl, 'Continue to next step?', true);
      expect(shouldContinue).toBe(true);
    });

    it('should handle error formatting and user confirmation', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('n');
      });

      // Format an error message
      const errorMsg = formatError('Operation failed');
      expect(errorMsg).toContain('❌');

      // Ask user if they want to retry
      const shouldRetry = await confirm(mockRl, 'Retry?', false);
      expect(shouldRetry).toBe(false);
    });

    it('should handle progress display and selection', async () => {
      const mockQuestion = mockRl.question as unknown as ReturnType<typeof vi.fn>;
      mockQuestion.mockImplementation((query: string, callback: (answer: string) => void) => {
        callback('2');
      });

      // Display progress
      const progressMsg = formatProgressBar(75, 100);
      expect(progressMsg).toContain('75%');

      // Select next action
      const choices: Choice[] = [
        { value: 'continue', label: 'Continue' },
        { value: 'stop', label: 'Stop' },
      ];

      const action = await select(mockRl, 'What would you like to do?', choices);
      expect(action).toBe('stop');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain exports from scripts/utils/interactive-helpers', async () => {
      // This ensures the thin wrapper still exports correctly
      const helpers = await import('../../../scripts/utils/interactive-helpers.js');

      expect(helpers.createInterface).toBeDefined();
      expect(helpers.question).toBeDefined();
      expect(helpers.confirm).toBeDefined();
      expect(helpers.select).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should format and display validation errors consistently', () => {
      const error = formatError('Validation failed: Invalid input');
      expect(error).toContain('❌');
      expect(error).toContain('Validation failed');
    });

    it('should format and display system errors consistently', () => {
      const error = formatError('System error: File not found');
      expect(error).toContain('❌');
      expect(error).toContain('System error');
    });
  });
});
