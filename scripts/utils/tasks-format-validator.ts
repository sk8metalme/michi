/**
 * tasks.mdフォーマットバリデーター
 *
 * Michi 6-Phase構造に準拠しているかを検証
 */

import { readFileSync } from 'fs';

/**
 * tasks.mdのフォーマットを検証
 *
 * @param tasksPath - tasks.mdファイルのパス
 * @throws {Error} フォーマットが不正な場合
 */
export function validateTasksFormat(tasksPath: string): void {
  let content: string;

  try {
    content = readFileSync(tasksPath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read tasks.md: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // 1. AI-DLCフォーマット検出（誤ったフォーマット）を最初にチェック
  // より具体的なエラーメッセージを優先的に表示
  // AI-DLCは "- [ ] 1." のようなフォーマットで、Phase 0:がない
  const hasCheckboxPattern = /^- \[ \] \d+\./m.test(content);
  const hasPhase0 = content.includes('Phase 0:');

  if (hasCheckboxPattern && !hasPhase0) {
    throw new Error(
      'tasks.md appears to be in AI-DLC format instead of Michi 6-phase format.\n' +
        'Detected "- [ ] 1." pattern without "Phase 0:" header.\n' +
        'Please regenerate tasks.md using /kiro:spec-tasks command with correct template.',
    );
  }

  // 2. 全6フェーズが存在するかチェック
  const requiredPhases = [
    'Phase 0: 要件定義（Requirements）',
    'Phase 1: 設計（Design）',
    'Phase 2: 実装（Implementation）',
    'Phase 3: 試験（Testing）',
    'Phase 4: リリース準備（Release Preparation）',
    'Phase 5: リリース（Release）',
  ];

  const missingPhases = requiredPhases.filter(
    (phase) => !content.includes(phase),
  );
  if (missingPhases.length > 0) {
    throw new Error(
      `tasks.md is missing required phases:\n${missingPhases.map((p) => `  - ${p}`).join('\n')}\n\n` +
        'Expected all 6 phases (Phase 0 through Phase 5).\n' +
        'Please regenerate tasks.md using /kiro:spec-tasks command.',
    );
  }

  // 3. Storyヘッダーのフォーマットチェック
  const storyPattern = /### Story \d+\.\d+:/;
  if (!storyPattern.test(content)) {
    throw new Error(
      'tasks.md does not contain valid Story headers.\n' +
        'Expected format: "### Story X.Y: Title"\n' +
        'Please regenerate tasks.md using /kiro:spec-tasks command.',
    );
  }

  // 4. 営業日スケジュールのチェック（警告のみ）
  const hasBusinessDayMention =
    content.includes('営業日') ||
    content.includes('business day') ||
    content.includes('Day 1') ||
    content.includes('Day 2');

  if (!hasBusinessDayMention) {
    console.warn(
      '⚠️  Warning: tasks.md does not mention business days or day numbering.\n' +
        '   Michi expects tasks to include business day schedule (Day 1, Day 2, etc.).\n' +
        '   This may cause validation warnings during JIRA sync.',
    );
  }

  // 5. フェーズヘッダーのフォーマットチェック（ラベル括弧付き）
  const phaseHeaderPattern = /## Phase \d+: .+（.+）/;
  if (!phaseHeaderPattern.test(content)) {
    console.warn(
      '⚠️  Warning: Phase headers may not have correct format.\n' +
        '   Expected format: "## Phase X: Name（Label）"\n' +
        '   Labels in parentheses are required for JIRA label detection.',
    );
  }
}

/**
 * tasks.mdが存在し、かつ有効なフォーマットかをチェック
 *
 * @param tasksPath - tasks.mdファイルのパス
 * @returns {boolean} 有効な場合true
 */
export function isValidTasksFormat(tasksPath: string): boolean {
  try {
    validateTasksFormat(tasksPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * tasks.mdに含まれるフェーズ数を取得
 *
 * @param tasksPath - tasks.mdファイルのパス
 * @returns {number} 検出されたフェーズ数
 */
export function countPhases(tasksPath: string): number {
  try {
    const content = readFileSync(tasksPath, 'utf-8');
    const phasePattern = /## Phase \d+:/g;
    const matches = content.match(phasePattern);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

/**
 * tasks.mdに含まれるStory数を取得
 *
 * @param tasksPath - tasks.mdファイルのパス
 * @returns {number} 検出されたStory数
 */
export function countStories(tasksPath: string): number {
  try {
    const content = readFileSync(tasksPath, 'utf-8');
    const storyPattern = /### Story \d+\.\d+:/g;
    const matches = content.match(storyPattern);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
