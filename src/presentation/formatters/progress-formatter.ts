/**
 * Progress Formatter
 * 進捗表示の標準フォーマットを提供
 */

import { OutputFormatter, OutputOptions } from './output-formatter.js';

/**
 * タスクステータス
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * タスク情報
 */
export interface TaskInfo {
  /**
   * タスク名
   */
  name: string;

  /**
   * タスクステータス
   */
  status: TaskStatus;

  /**
   * 所要時間（ミリ秒）
   */
  duration?: number;

  /**
   * エラーメッセージ（失敗時）
   */
  error?: string;
}

/**
 * プログレスバーのオプション
 */
export interface ProgressBarOptions extends OutputOptions {
  /**
   * プログレスバーの幅
   * @default 40
   */
  width?: number;

  /**
   * 完了文字
   * @default '█'
   */
  completeChar?: string;

  /**
   * 未完了文字
   * @default '░'
   */
  incompleteChar?: string;

  /**
   * パーセンテージ表示
   * @default true
   */
  showPercentage?: boolean;

  /**
   * カウント表示
   * @default true
   */
  showCount?: boolean;
}

/**
 * タスクステータスに対応する絵文字
 */
const STATUS_EMOJIS = {
  pending: '⏸️',
  running: '🔄',
  completed: '✅',
  failed: '❌',
  skipped: '⏭️',
} as const;

/**
 * スピナーフレーム
 */
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * ProgressFormatter クラス
 */
export class ProgressFormatter {
  private formatter: OutputFormatter;
  private spinnerIndex: number = 0;

  constructor(options?: OutputOptions) {
    this.formatter = new OutputFormatter(options);
  }

  /**
   * プログレスバーを表示
   */
  progressBar(
    current: number,
    total: number,
    options?: ProgressBarOptions
  ): string {
    const opts: Required<ProgressBarOptions> = {
      width: options?.width ?? 40,
      completeChar: options?.completeChar ?? '█',
      incompleteChar: options?.incompleteChar ?? '░',
      showPercentage: options?.showPercentage ?? true,
      showCount: options?.showCount ?? true,
      color: options?.color ?? true,
      markdown: options?.markdown ?? false,
      indent: options?.indent ?? 0,
    };

    const percentage = total > 0 ? Math.floor((current / total) * 100) : 0;
    const completed = total > 0 ? Math.floor((current / total) * opts.width) : 0;
    const incomplete = opts.width - completed;

    const bar =
      opts.completeChar.repeat(completed) +
      opts.incompleteChar.repeat(incomplete);

    const parts: string[] = [];

    if (opts.showCount) {
      parts.push(`${current}/${total}`);
    }

    parts.push(`[${bar}]`);

    if (opts.showPercentage) {
      parts.push(`${percentage}%`);
    }

    const indent = '  '.repeat(opts.indent);
    return `${indent}${parts.join(' ')}`;
  }

  /**
   * スピナーを表示（アニメーション用）
   */
  spinner(message: string, options?: OutputOptions): string {
    const frame = SPINNER_FRAMES[this.spinnerIndex];
    this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;

    const opts = { ...options };
    const indent = '  '.repeat(opts.indent ?? 0);

    return `${indent}${frame} ${message}`;
  }

  /**
   * スピナーをリセット
   */
  resetSpinner(): void {
    this.spinnerIndex = 0;
  }

  /**
   * タスクリストを表示
   */
  taskList(tasks: TaskInfo[], options?: OutputOptions): string {
    const lines: string[] = [];

    for (const task of tasks) {
      lines.push(this.taskItem(task, options));
    }

    return lines.join('\n');
  }

  /**
   * タスクアイテムを表示
   */
  taskItem(task: TaskInfo, options?: OutputOptions): string {
    const emoji = STATUS_EMOJIS[task.status];
    const opts = { ...options };
    const indent = '  '.repeat(opts.indent ?? 0);

    const parts: string[] = [emoji, task.name];

    if (task.duration !== undefined) {
      parts.push(`(${this.formatDuration(task.duration)})`);
    }

    if (task.error) {
      parts.push(`- ${task.error}`);
    }

    return `${indent}${parts.join(' ')}`;
  }

  /**
   * タスクサマリーを表示
   */
  taskSummary(tasks: TaskInfo[], options?: OutputOptions): string {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const skipped = tasks.filter((t) => t.status === 'skipped').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const running = tasks.filter((t) => t.status === 'running').length;

    const totalDuration = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);

    const lines: string[] = [];

    lines.push(this.formatter.section('Task Summary', options));

    lines.push(
      this.formatter.keyValue('Total', String(total), {
        ...options,
        indent: 1,
      })
    );

    if (completed > 0) {
      lines.push(
        this.formatter.keyValue('Completed', `${completed} ✅`, {
          ...options,
          indent: 1,
        })
      );
    }

    if (running > 0) {
      lines.push(
        this.formatter.keyValue('Running', `${running} 🔄`, {
          ...options,
          indent: 1,
        })
      );
    }

    if (failed > 0) {
      lines.push(
        this.formatter.keyValue('Failed', `${failed} ❌`, {
          ...options,
          indent: 1,
        })
      );
    }

    if (skipped > 0) {
      lines.push(
        this.formatter.keyValue('Skipped', `${skipped} ⏭️`, {
          ...options,
          indent: 1,
        })
      );
    }

    if (pending > 0) {
      lines.push(
        this.formatter.keyValue('Pending', `${pending} ⏸️`, {
          ...options,
          indent: 1,
        })
      );
    }

    if (totalDuration > 0) {
      lines.push(
        this.formatter.keyValue(
          'Total Duration',
          this.formatDuration(totalDuration),
          {
            ...options,
            indent: 1,
          }
        )
      );
    }

    return lines.join('\n');
  }

  /**
   * ステージ進捗を表示（ワークフロー用）
   */
  stageProgress(
    currentStage: string,
    stages: string[],
    options?: OutputOptions
  ): string {
    const lines: string[] = [];
    const currentIndex = stages.indexOf(currentStage);

    lines.push(this.formatter.section('Workflow Progress', options));

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      let emoji: string;

      if (i < currentIndex) {
        emoji = '✅'; // 完了
      } else if (i === currentIndex) {
        emoji = '🔄'; // 実行中
      } else {
        emoji = '⏸️'; // 未実行
      }

      const arrow = i < stages.length - 1 ? ' →' : '';
      lines.push(
        this.formatter.listItem(`${emoji} ${stage}${arrow}`, {
          ...options,
          indent: 1,
        })
      );
    }

    return lines.join('\n');
  }

  /**
   * 経過時間を人間が読みやすい形式にフォーマット
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  /**
   * タイムスタンプを表示
   */
  timestamp(date: Date = new Date(), options?: OutputOptions): string {
    const timeString = date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return this.formatter.keyValue('Time', timeString, options);
  }
}

/**
 * デフォルトプログレスフォーマッタインスタンス
 */
export const defaultProgressFormatter = new ProgressFormatter();

/**
 * 便利な関数（デフォルトプログレスフォーマッタを使用）
 */
export const formatProgressBar = (
  current: number,
  total: number,
  options?: ProgressBarOptions
): string => defaultProgressFormatter.progressBar(current, total, options);

export const formatSpinner = (message: string, options?: OutputOptions): string =>
  defaultProgressFormatter.spinner(message, options);

export const resetSpinner = (): void => defaultProgressFormatter.resetSpinner();

export const formatTaskList = (tasks: TaskInfo[], options?: OutputOptions): string =>
  defaultProgressFormatter.taskList(tasks, options);

export const formatTaskItem = (task: TaskInfo, options?: OutputOptions): string =>
  defaultProgressFormatter.taskItem(task, options);

export const formatTaskSummary = (tasks: TaskInfo[], options?: OutputOptions): string =>
  defaultProgressFormatter.taskSummary(tasks, options);

export const formatStageProgress = (
  currentStage: string,
  stages: string[],
  options?: OutputOptions
): string => defaultProgressFormatter.stageProgress(currentStage, stages, options);

export const formatDuration = (ms: number): string =>
  defaultProgressFormatter.formatDuration(ms);

export const formatTimestamp = (date?: Date, options?: OutputOptions): string =>
  defaultProgressFormatter.timestamp(date, options);
