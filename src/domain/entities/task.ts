/**
 * Domain Entity - Task
 *
 * Represents a task in the implementation workflow
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Task Entity
 *
 * Represents an individual implementation task
 */
export class Task {
  private _id: string;
  private _title: string;
  private _status: TaskStatus;
  private _description?: string;

  constructor(id: string, title: string, status: TaskStatus, description?: string) {
    this._id = id;
    this._title = title;
    this._status = status;
    this._description = description;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get description(): string | undefined {
    return this._description;
  }

  /**
   * Mark task as in progress
   */
  markAsInProgress(): void {
    this._status = 'in_progress';
  }

  /**
   * Mark task as completed
   */
  markAsCompleted(): void {
    this._status = 'completed';
  }

  /**
   * Check if task is pending
   */
  isPending(): boolean {
    return this._status === 'pending';
  }

  /**
   * Check if task is completed
   */
  isCompleted(): boolean {
    return this._status === 'completed';
  }

  /**
   * Update task description
   */
  updateDescription(description: string): void {
    this._description = description;
  }
}
