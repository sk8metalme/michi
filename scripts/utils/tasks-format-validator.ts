/**
 * tasks.mdフォーマットバリデーター
 *
 * Michi Workflow構造に準拠しているかを検証
 * - 新ワークフロー構造（Phase 0.1-0.2, 1, 2, A, 3, B, 4-5）を推奨
 * - 旧6-Phase構造（Phase 0-5）も互換性のためサポート
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
  // AI-DLCは "- [ ] 1." のようなフォーマットで、Phase構造がない
  const hasCheckboxPattern = /^- \[ \] \d+\./m.test(content);
  const hasPhaseStructure = content.includes('Phase 0:') || content.includes('Phase 0.1:');

  if (hasCheckboxPattern && !hasPhaseStructure) {
    throw new Error(
      'tasks.md appears to be in AI-DLC format instead of Michi workflow format.\n' +
        'Detected "- [ ] 1." pattern without Phase structure.\n' +
        'Please regenerate tasks.md using /michi:spec-tasks command with correct template.',
    );
  }

  // 2. フェーズ構造の検証（新旧両方をサポート）

  // 旧6-Phase構造（互換性のためサポート）
  const legacyPhases = [
    'Phase 0: 要件定義（Requirements）',
    'Phase 1: 設計（Design）',
    'Phase 2: 実装（Implementation）',
    'Phase 3: 試験（Testing）',
    'Phase 4: リリース準備（Release Preparation）',
    'Phase 5: リリース（Release）',
  ];

  // 新ワークフロー構造の必須フェーズ
  const newRequiredPhases = ['Phase 0.1:', 'Phase 0.2:', 'Phase 2:', 'Phase 4:', 'Phase 5:'];

  // 旧構造の検証
  const hasLegacyStructure = legacyPhases.every((phase) => content.includes(phase));

  // 新構造の検証（必須フェーズのみ）
  const hasNewStructure = newRequiredPhases.every((phase) => content.includes(phase));

  if (!hasLegacyStructure && !hasNewStructure) {
    const missingNewPhases = newRequiredPhases.filter(
      (phase) => !content.includes(phase),
    );
    const missingLegacyPhases = legacyPhases.filter(
      (phase) => !content.includes(phase),
    );

    throw new Error(
      'tasks.md does not match either workflow structure.\n\n' +
        `Missing required phases (new workflow):\n${missingNewPhases.map((p) => `  - ${p}`).join('\n')}\n\n` +
        `Missing phases (legacy workflow):\n${missingLegacyPhases.map((p) => `  - ${p}`).join('\n')}\n\n` +
        'Please regenerate tasks.md using /michi:spec-tasks command with the latest template.',
    );
  }

  // 旧構造の場合は警告
  if (hasLegacyStructure && !hasNewStructure) {
    console.warn(
      '⚠️  Warning: tasks.md uses legacy 6-phase structure (Phase 0-5).\n' +
        '   Consider migrating to the new workflow structure:\n' +
        '   - Phase 0.1: 要件定義\n' +
        '   - Phase 0.2: 設計\n' +
        '   - Phase 1: 環境構築（任意）\n' +
        '   - Phase 2: TDD実装\n' +
        '   - Phase A: PR前自動テスト（任意）\n' +
        '   - Phase 3: 追加QA（任意）\n' +
        '   - Phase B: リリース準備テスト（任意）\n' +
        '   - Phase 4: リリース準備\n' +
        '   - Phase 5: リリース\n' +
        '   See: docs/user-guide/guides/workflow.md',
    );
  }

  // 3. Storyヘッダーのフォーマットチェック
  const storyPattern = /### Story \d+\.\d+:/;
  if (!storyPattern.test(content)) {
    throw new Error(
      'tasks.md does not contain valid Story headers.\n' +
        'Expected format: "### Story X.Y: Title"\n' +
        'Please regenerate tasks.md using /michi:spec-tasks command.',
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
