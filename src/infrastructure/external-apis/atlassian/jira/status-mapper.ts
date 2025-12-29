/**
 * Status Mapper
 *
 * tasks.mdのフェーズ情報をJIRAラベルにマッピングする機能を提供
 */

/**
 * フェーズラベル検出
 * tasks.mdのPhase行からフェーズラベルを抽出
 *
 * @param line tasks.mdの行
 * @returns フェーズラベル（例: 'requirements', 'design', 'implementation'）
 */
export function detectPhaseLabel(line: string): string | null {
  const phasePattern = /## Phase [\d.A-Z]+:\s*(.+?)(?:（(.+?)）)?/;
  const phaseMatch = line.match(phasePattern);
  if (!phaseMatch) return null;

  const phaseTitle = phaseMatch[1]; // フェーズタイトル全体
  const phaseName = phaseMatch[2] || phaseTitle; // 括弧内のラベル（例: Requirements）または全体

  // Phase番号を抽出（例: "0.1", "2", "A"）
  const phaseNumberMatch = line.match(/## Phase ([\d.A-Z]+):/);
  const phaseNumber = phaseNumberMatch ? phaseNumberMatch[1] : '';

  // フェーズ番号またはフェーズ名からラベルを決定
  if (
    phaseNumber === '0.0' ||
    phaseName.includes('初期化') ||
    phaseName.toLowerCase().includes('init')
  ) {
    return 'spec-init';
  } else if (
    phaseNumber === '0.1' ||
    phaseName.includes('要件定義') ||
    phaseName.toLowerCase().includes('requirements')
  ) {
    return 'requirements';
  } else if (
    phaseNumber === '0.2' ||
    phaseName.includes('設計') ||
    phaseName.toLowerCase().includes('design')
  ) {
    return 'design';
  } else if (
    phaseNumber === '0.3' ||
    phaseName.includes('テストタイプ') ||
    phaseName.toLowerCase().includes('test-type') ||
    phaseName.toLowerCase().includes('test type')
  ) {
    return 'test-type-selection';
  } else if (
    phaseNumber === '0.4' ||
    phaseName.includes('テスト仕様') ||
    phaseName.toLowerCase().includes('test-spec') ||
    phaseName.toLowerCase().includes('test spec')
  ) {
    return 'test-spec';
  } else if (
    phaseNumber === '0.5' ||
    phaseName.includes('タスク分割') ||
    phaseName.toLowerCase().includes('tasks') ||
    phaseName.toLowerCase().includes('task breakdown')
  ) {
    return 'spec-tasks';
  } else if (
    phaseNumber === '0.6' ||
    phaseName.includes('JIRA') ||
    phaseName.toLowerCase().includes('jira')
  ) {
    return 'jira-sync';
  } else if (
    phaseNumber === '1' ||
    phaseName.includes('環境構築') ||
    phaseName.toLowerCase().includes('environment') ||
    phaseName.toLowerCase().includes('setup')
  ) {
    return 'environment-setup';
  } else if (
    phaseNumber === '2' ||
    phaseName.includes('実装') ||
    phaseName.includes('TDD') ||
    phaseName.toLowerCase().includes('implementation')
  ) {
    return 'implementation';
  } else if (
    phaseNumber === 'A' ||
    phaseNumber.toLowerCase() === 'a' ||
    phaseName.includes('PR前') ||
    phaseName.toLowerCase().includes('pr-test') ||
    phaseName.toLowerCase().includes('pr test')
  ) {
    return 'phase-a';
  } else if (
    phaseNumber === '3' ||
    phaseName.includes('追加QA') ||
    phaseName.includes('QA') ||
    phaseName.includes('試験') ||
    phaseName.toLowerCase().includes('testing') ||
    phaseName.toLowerCase().includes('additional qa')
  ) {
    return 'additional-qa';
  } else if (
    phaseNumber === 'B' ||
    phaseNumber.toLowerCase() === 'b' ||
    phaseName.includes('リリース準備テスト') ||
    phaseName.toLowerCase().includes('release-test') ||
    phaseName.toLowerCase().includes('release test')
  ) {
    return 'phase-b';
  } else if (
    phaseNumber === '4' ||
    phaseName.includes('リリース準備') ||
    phaseName.toLowerCase().includes('release-prep') ||
    phaseName.toLowerCase().includes('release preparation')
  ) {
    return 'release-prep';
  } else if (
    phaseNumber === '5' ||
    (phaseName.includes('リリース') && !phaseName.includes('準備')) ||
    (phaseName.toLowerCase().includes('release') &&
      !phaseName.toLowerCase().includes('prep'))
  ) {
    return 'release';
  }

  return null;
}
