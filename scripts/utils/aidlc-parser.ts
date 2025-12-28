/**
 * AI-DLC形式のtasks.mdパーサー
 *
 * AI-DLC形式:
 * - `## 1. Category Name` のようなカテゴリヘッダー
 * - `- [ ] 1.1 Task description` のようなタスク形式
 * - 任意の `_Requirements: X.X, Y.Y_` タグ
 * - 任意の `(P)` 並列実行マーカー
 */

import { safeReadFileOrThrow } from './safe-file-reader.js';

/**
 * AI-DLC形式のタスク
 */
export interface AIDLCTask {
  id: string; // "1.1", "2.3" など
  title: string; // タスクのタイトル
  description: string[]; // インデントされた詳細行
  requirements: string[]; // 関連する要件ID
  isParallel: boolean; // (P)マーカーがあるか
  completed: boolean; // チェックボックスの状態
}

/**
 * AI-DLC形式のカテゴリ
 */
export interface AIDLCCategory {
  id: string; // "1", "2" など
  title: string; // カテゴリ名
  tasks: AIDLCTask[];
}

/**
 * AI-DLC形式のドキュメント
 */
export interface AIDLCDocument {
  title: string; // ドキュメントタイトル
  categories: AIDLCCategory[];
  summary?: AIDLCSummary; // オプショナルなサマリーセクション
  rawContent: string; // 元のコンテンツ
}

/**
 * AI-DLC形式のサマリー情報
 */
export interface AIDLCSummary {
  majorTasks?: number;
  subTasks?: number;
  estimatedHours?: string;
  requirementsCoverage?: Map<string, string[]>; // 要件ID -> タスクID[]
}

/**
 * AI-DLC形式かどうかを判定
 *
 * 判定基準:
 * 1. `- [ ] X.Y` 形式のチェックボックスパターンが存在
 * 2. Phase構造（Phase 0.1:, Phase 2: など）が存在しない
 *
 * @param content - 検証するコンテンツ
 * @returns AI-DLC形式の場合true
 */
export function isAIDLCFormat(content: string): boolean {
  // AI-DLCパターン: "- [ ] 1." or "- [x] 1." (数字.で始まるタスク)
  const hasAIDLCPattern = /^- \[[ x]\] \d+\./m.test(content);

  // Michiワークフロー形式のPhase構造
  const hasPhaseStructure =
    content.includes('Phase 0:') ||
    content.includes('Phase 0.1:') ||
    content.includes('Phase 2:') ||
    content.includes('## Phase');

  // Story構造もチェック
  const hasStoryStructure = /### Story \d+\.\d+:/.test(content);

  return hasAIDLCPattern && !hasPhaseStructure && !hasStoryStructure;
}

/**
 * AI-DLC形式のコンテンツをパース
 *
 * @param content - パースするコンテンツ
 * @returns パースされたドキュメント
 */
export function parseAIDLCFormat(content: string): AIDLCDocument {
  const lines = content.split('\n');
  const document: AIDLCDocument = {
    title: '',
    categories: [],
    rawContent: content,
  };

  // タイトル抽出（最初の # で始まる行）
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch) {
    document.title = titleMatch[1].trim();
  }

  let currentCategory: AIDLCCategory | null = null;
  let currentTask: AIDLCTask | null = null;
  let inSummarySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // サマリーセクションの検出
    if (
      trimmedLine.startsWith('## 要件カバレッジ') ||
      trimmedLine.startsWith('## Requirements Coverage') ||
      trimmedLine.startsWith('## 並列実行可能') ||
      trimmedLine.startsWith('## Parallel') ||
      trimmedLine.startsWith('## タスク見積') ||
      trimmedLine.startsWith('## Task Estimate') ||
      trimmedLine === '---'
    ) {
      inSummarySection = true;
      // 現在のタスクを保存
      if (currentTask && currentCategory) {
        currentCategory.tasks.push(currentTask);
        currentTask = null;
      }
      continue;
    }

    if (inSummarySection) {
      // サマリーセクションの解析（オプション）
      parseSummaryLine(document, trimmedLine);
      continue;
    }

    // カテゴリヘッダー: ## 1. Category Name
    const categoryMatch = trimmedLine.match(/^## (\d+)\. (.+)$/);
    if (categoryMatch) {
      // 前のタスクを保存
      if (currentTask && currentCategory) {
        currentCategory.tasks.push(currentTask);
        currentTask = null;
      }
      // 前のカテゴリを保存
      if (currentCategory) {
        document.categories.push(currentCategory);
      }

      currentCategory = {
        id: categoryMatch[1],
        title: categoryMatch[2].trim(),
        tasks: [],
      };
      continue;
    }

    // タスク行: - [ ] 1.1 Task description または - [x] 1.1 Task description
    const taskMatch = trimmedLine.match(
      /^- \[([ x])\] (\d+\.\d+\*?) (?:\(P\) )?(.+)$/,
    );
    if (taskMatch && currentCategory) {
      // 前のタスクを保存
      if (currentTask) {
        currentCategory.tasks.push(currentTask);
      }

      const isParallel =
        trimmedLine.includes('(P)') || taskMatch[2].endsWith('*');
      const taskId = taskMatch[2].replace('*', '');

      currentTask = {
        id: taskId,
        title: taskMatch[3].trim(),
        description: [],
        requirements: [],
        isParallel,
        completed: taskMatch[1] === 'x',
      };
      continue;
    }

    // タスクの詳細行（インデントされた行）
    if (currentTask && line.startsWith('  ') && trimmedLine) {
      // Requirements タグの抽出
      const reqMatch = trimmedLine.match(/_Requirements?: (.+)_|_要件: (.+)_/i);
      if (reqMatch) {
        const reqString = reqMatch[1] || reqMatch[2];
        const requirements = reqString.split(',').map((r) => r.trim());
        currentTask.requirements.push(...requirements);
      } else {
        // 通常の詳細行
        currentTask.description.push(trimmedLine.replace(/^- /, ''));
      }
    }
  }

  // 最後のタスクとカテゴリを保存
  if (currentTask && currentCategory) {
    currentCategory.tasks.push(currentTask);
  }
  if (currentCategory) {
    document.categories.push(currentCategory);
  }

  return document;
}

/**
 * サマリー行を解析
 */
function parseSummaryLine(document: AIDLCDocument, line: string): void {
  if (!document.summary) {
    document.summary = {};
  }

  // Major Tasks
  const majorMatch = line.match(/Major Tasks.*?(\d+)/i);
  if (majorMatch) {
    document.summary.majorTasks = parseInt(majorMatch[1], 10);
  }

  // Sub-Tasks
  const subMatch = line.match(/Sub-?Tasks.*?(\d+)/i);
  if (subMatch) {
    document.summary.subTasks = parseInt(subMatch[1], 10);
  }

  // Estimated hours
  const hoursMatch = line.match(
    /総工数見積.*?[:：]?\s*(.+)|Estimated.*?[:：]?\s*(.+)/i,
  );
  if (hoursMatch) {
    document.summary.estimatedHours = (hoursMatch[1] || hoursMatch[2]).trim();
  }
}

/**
 * ファイルからAI-DLC形式をパース
 *
 * @param filePath - ファイルパス
 * @returns パースされたドキュメント
 * @throws ファイルが存在しない、またはAI-DLC形式でない場合
 */
export function parseAIDLCFile(filePath: string): AIDLCDocument {
  const content = safeReadFileOrThrow(filePath);

  if (!isAIDLCFormat(content)) {
    throw new Error(
      `File is not in AI-DLC format: ${filePath}\n` +
        'Expected format: "- [ ] X.Y Task description" without Phase structure',
    );
  }

  return parseAIDLCFormat(content);
}

/**
 * AI-DLCドキュメントの統計情報を取得
 *
 * @param doc - AI-DLCドキュメント
 * @returns 統計情報
 */
export function getAIDLCStats(doc: AIDLCDocument): {
  totalCategories: number;
  totalTasks: number;
  completedTasks: number;
  parallelTasks: number;
  tasksWithRequirements: number;
} {
  let totalTasks = 0;
  let completedTasks = 0;
  let parallelTasks = 0;
  let tasksWithRequirements = 0;

  for (const category of doc.categories) {
    for (const task of category.tasks) {
      totalTasks++;
      if (task.completed) completedTasks++;
      if (task.isParallel) parallelTasks++;
      if (task.requirements.length > 0) tasksWithRequirements++;
    }
  }

  return {
    totalCategories: doc.categories.length,
    totalTasks,
    completedTasks,
    parallelTasks,
    tasksWithRequirements,
  };
}
