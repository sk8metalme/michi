/**
 * Progress Formatter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProgressFormatter,
  formatProgressBar,
  formatSpinner,
  resetSpinner,
  formatTaskList,
  formatTaskItem,
  formatTaskSummary,
  formatStageProgress,
  formatDuration,
  formatTimestamp,
  type TaskInfo,
} from '../progress-formatter.js';

describe('ProgressFormatter', () => {
  describe('progressBar', () => {
    it('should format progress bar with percentage', () => {
      const formatter = new ProgressFormatter({ color: false });
      const result = formatter.progressBar(50, 100, { width: 20 });
      expect(result).toContain('50/100');
      expect(result).toContain('50%');
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('should handle 0% progress', () => {
      const formatter = new ProgressFormatter({ color: false });
      const result = formatter.progressBar(0, 100, { width: 20 });
      expect(result).toContain('0/100');
      expect(result).toContain('0%');
    });

    it('should handle 100% progress', () => {
      const formatter = new ProgressFormatter({ color: false });
      const result = formatter.progressBar(100, 100, { width: 20 });
      expect(result).toContain('100/100');
      expect(result).toContain('100%');
    });

    it('should hide percentage when showPercentage is false', () => {
      const formatter = new ProgressFormatter({ color: false });
      const result = formatter.progressBar(50, 100, { showPercentage: false });
      expect(result).not.toContain('%');
    });

    it('should hide count when showCount is false', () => {
      const formatter = new ProgressFormatter({ color: false });
      const result = formatter.progressBar(50, 100, { showCount: false });
      expect(result).not.toContain('50/100');
    });
  });

  describe('spinner', () => {
    let formatter: ProgressFormatter;

    beforeEach(() => {
      formatter = new ProgressFormatter({ color: false });
      formatter.resetSpinner();
    });

    it('should format spinner message', () => {
      const result = formatter.spinner('Loading...');
      expect(result).toContain('Loading...');
    });

    it('should cycle through spinner frames', () => {
      const results = new Set<string>();
      for (let i = 0; i < 15; i++) {
        const result = formatter.spinner('Loading...');
        results.add(result.charAt(0)); // 最初の文字（スピナーフレーム）を取得
      }
      // 複数の異なるフレームが使われていることを確認
      expect(results.size).toBeGreaterThan(1);
    });

    it('should reset spinner', () => {
      formatter.spinner('Loading...');
      formatter.spinner('Loading...');
      formatter.resetSpinner();
      const result1 = formatter.spinner('Loading...');
      formatter.resetSpinner();
      const result2 = formatter.spinner('Loading...');
      expect(result1).toBe(result2);
    });
  });

  describe('taskList', () => {
    it('should format multiple tasks', () => {
      const formatter = new ProgressFormatter({ color: false });
      const tasks: TaskInfo[] = [
        { name: 'Task 1', status: 'completed' },
        { name: 'Task 2', status: 'running' },
        { name: 'Task 3', status: 'pending' },
      ];

      const result = formatter.taskList(tasks);
      expect(result).toContain('Task 1');
      expect(result).toContain('Task 2');
      expect(result).toContain('Task 3');
      expect(result).toContain('✅'); // completed
      expect(result).toContain('🔄'); // running
      expect(result).toContain('⏸️'); // pending
    });
  });

  describe('taskItem', () => {
    it('should format pending task', () => {
      const formatter = new ProgressFormatter({ color: false });
      const task: TaskInfo = { name: 'Task 1', status: 'pending' };
      const result = formatter.taskItem(task);
      expect(result).toContain('⏸️');
      expect(result).toContain('Task 1');
    });

    it('should format running task', () => {
      const formatter = new ProgressFormatter({ color: false });
      const task: TaskInfo = { name: 'Task 2', status: 'running' };
      const result = formatter.taskItem(task);
      expect(result).toContain('🔄');
      expect(result).toContain('Task 2');
    });

    it('should format completed task with duration', () => {
      const formatter = new ProgressFormatter({ color: false });
      const task: TaskInfo = {
        name: 'Task 3',
        status: 'completed',
        duration: 1500,
      };
      const result = formatter.taskItem(task);
      expect(result).toContain('✅');
      expect(result).toContain('Task 3');
      expect(result).toContain('1s');
    });

    it('should format failed task with error', () => {
      const formatter = new ProgressFormatter({ color: false });
      const task: TaskInfo = {
        name: 'Task 4',
        status: 'failed',
        error: 'Connection failed',
      };
      const result = formatter.taskItem(task);
      expect(result).toContain('❌');
      expect(result).toContain('Task 4');
      expect(result).toContain('Connection failed');
    });

    it('should format skipped task', () => {
      const formatter = new ProgressFormatter({ color: false });
      const task: TaskInfo = { name: 'Task 5', status: 'skipped' };
      const result = formatter.taskItem(task);
      expect(result).toContain('⏭️');
      expect(result).toContain('Task 5');
    });
  });

  describe('taskSummary', () => {
    it('should format task summary', () => {
      const formatter = new ProgressFormatter({ color: false });
      const tasks: TaskInfo[] = [
        { name: 'Task 1', status: 'completed', duration: 1000 },
        { name: 'Task 2', status: 'completed', duration: 2000 },
        { name: 'Task 3', status: 'failed', error: 'Error' },
        { name: 'Task 4', status: 'pending' },
      ];

      const result = formatter.taskSummary(tasks);
      expect(result).toContain('Total: 4');
      expect(result).toContain('Completed: 2');
      expect(result).toContain('Failed: 1');
      expect(result).toContain('Pending: 1');
      expect(result).toContain('Total Duration');
      expect(result).toContain('3s');
    });
  });

  describe('stageProgress', () => {
    it('should format stage progress', () => {
      const formatter = new ProgressFormatter({ color: false });
      const stages = ['requirements', 'design', 'tasks', 'implement'];
      const result = formatter.stageProgress('design', stages);

      expect(result).toContain('requirements');
      expect(result).toContain('design');
      expect(result).toContain('tasks');
      expect(result).toContain('implement');
      expect(result).toContain('✅'); // completed
      expect(result).toContain('🔄'); // current
      expect(result).toContain('⏸️'); // pending
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(90000)).toBe('1m 30s');
    });

    it('should format minutes only', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(120000)).toBe('2m');
    });

    it('should format hours and minutes', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(3600000 + 1800000)).toBe('1h 30m');
    });

    it('should format hours only', () => {
      const formatter = new ProgressFormatter();
      expect(formatter.formatDuration(7200000)).toBe('2h');
    });
  });

  describe('timestamp', () => {
    it('should format timestamp', () => {
      const formatter = new ProgressFormatter({ color: false });
      const date = new Date('2025-01-01T12:34:56');
      const result = formatter.timestamp(date);
      expect(result).toContain('Time:');
      expect(result).toContain('12:34:56');
    });
  });
});

describe('Progress formatter functions', () => {
  it('formatProgressBar should work', () => {
    const result = formatProgressBar(50, 100, {
      width: 20,
      color: false,
    });
    expect(result).toContain('50/100');
    expect(result).toContain('50%');
  });

  it('formatSpinner should work', () => {
    resetSpinner();
    const result = formatSpinner('Loading', { color: false });
    expect(result).toContain('Loading');
  });

  it('formatTaskList should work', () => {
    const tasks: TaskInfo[] = [
      { name: 'Task', status: 'completed' },
    ];
    const result = formatTaskList(tasks, { color: false });
    expect(result).toContain('Task');
  });

  it('formatTaskItem should work', () => {
    const task: TaskInfo = { name: 'Task', status: 'completed' };
    const result = formatTaskItem(task, { color: false });
    expect(result).toContain('Task');
  });

  it('formatTaskSummary should work', () => {
    const tasks: TaskInfo[] = [
      { name: 'Task', status: 'completed' },
    ];
    const result = formatTaskSummary(tasks, { color: false });
    expect(result).toContain('Total: 1');
  });

  it('formatStageProgress should work', () => {
    const result = formatStageProgress('stage2', ['stage1', 'stage2', 'stage3'], {
      color: false,
    });
    expect(result).toContain('stage1');
    expect(result).toContain('stage2');
    expect(result).toContain('stage3');
  });

  it('formatDuration should work', () => {
    const result = formatDuration(5000);
    expect(result).toBe('5s');
  });

  it('formatTimestamp should work', () => {
    const date = new Date('2025-01-01T12:34:56');
    const result = formatTimestamp(date, { color: false });
    expect(result).toContain('Time:');
  });
});
