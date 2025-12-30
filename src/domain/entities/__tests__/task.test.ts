import { describe, it, expect } from 'vitest';
import { Task, TaskStatus } from '../task.js';

describe('Domain Entity - Task', () => {
  describe('constructor', () => {
    it('should create a new Task with required properties', () => {
      const task = new Task('1.1', 'Implement feature', 'pending');

      expect(task.id).toBe('1.1');
      expect(task.title).toBe('Implement feature');
      expect(task.status).toBe('pending');
      expect(task.description).toBeUndefined();
    });

    it('should create a Task with description', () => {
      const task = new Task('1.1', 'Implement feature', 'pending', 'Detailed description');

      expect(task.description).toBe('Detailed description');
    });
  });

  describe('markAsInProgress', () => {
    it('should update status to in_progress', () => {
      const task = new Task('1.1', 'Implement feature', 'pending');
      task.markAsInProgress();

      expect(task.status).toBe('in_progress');
    });
  });

  describe('markAsCompleted', () => {
    it('should update status to completed', () => {
      const task = new Task('1.1', 'Implement feature', 'in_progress');
      task.markAsCompleted();

      expect(task.status).toBe('completed');
    });
  });

  describe('isPending', () => {
    it('should return true for pending tasks', () => {
      const task = new Task('1.1', 'Implement feature', 'pending');
      expect(task.isPending()).toBe(true);
    });

    it('should return false for non-pending tasks', () => {
      const task = new Task('1.1', 'Implement feature', 'completed');
      expect(task.isPending()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed tasks', () => {
      const task = new Task('1.1', 'Implement feature', 'completed');
      expect(task.isCompleted()).toBe(true);
    });

    it('should return false for non-completed tasks', () => {
      const task = new Task('1.1', 'Implement feature', 'pending');
      expect(task.isCompleted()).toBe(false);
    });
  });

  describe('updateDescription', () => {
    it('should update task description', () => {
      const task = new Task('1.1', 'Implement feature', 'pending');
      task.updateDescription('New description');

      expect(task.description).toBe('New description');
    });
  });
});
