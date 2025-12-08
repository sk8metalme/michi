/**
 * AI-DLC形式からMichiワークフロー形式への変換
 *
 * AI-DLC形式のtasks.mdをMichiが期待するPhase構造に変換
 */

import { writeFileSync, copyFileSync } from 'fs';
import type {
  AIDLCDocument,
  AIDLCCategory,
  AIDLCTask,
} from './aidlc-parser.js';
import {
  parseAIDLCFile,
  isAIDLCFormat,
  getAIDLCStats,
} from './aidlc-parser.js';
import { readFileSync } from 'fs';
import {
  getWeekdayNotation,
  getWeekdayRangeNotation,
  ensureBusinessDay,
} from './business-days.js';

/**
 * 変換オプション
 */
export interface ConversionOptions {
  /** 変換を実行せずに結果をプレビュー */
  dryRun?: boolean;
  /** 元ファイルをバックアップ */
  backup?: boolean;
  /** バックアップファイルのサフィックス */
  backupSuffix?: string;
  /** プロジェクト名（ヘッダーに使用） */
  projectName?: string;
  /** 開始日（YYYY-MM-DD形式、デフォルトは今日） */
  startDate?: string;
  /** 言語（ja/en） */
  language?: 'ja' | 'en';
}

/**
 * 変換結果
 */
export interface ConversionResult {
  /** 変換が成功したか */
  success: boolean;
  /** 変換後のコンテンツ */
  convertedContent: string;
  /** バックアップファイルのパス（作成された場合） */
  backupPath?: string;
  /** 変換の警告メッセージ */
  warnings: string[];
  /** 変換の統計情報 */
  stats: {
    originalCategories: number;
    originalTasks: number;
    convertedPhases: number;
    convertedStories: number;
  };
}

/**
 * カテゴリからPhaseへのマッピング
 */
interface PhaseMapping {
  phaseId: string;
  phaseName: string;
  phaseLabel: string;
}

/**
 * AI-DLCカテゴリをMichi Phaseにマッピング
 */
function mapCategoryToPhase(
  category: AIDLCCategory,
  _index: number,
  _totalCategories: number,
): PhaseMapping {
  const title = category.title.toLowerCase();

  // セットアップ系
  if (
    title.includes('セットアップ') ||
    title.includes('setup') ||
    title.includes('基盤') ||
    title.includes('環境')
  ) {
    return {
      phaseId: '1',
      phaseName: '環境構築',
      phaseLabel: 'Environment Setup',
    };
  }

  // ドメイン/実装系
  if (
    title.includes('domain') ||
    title.includes('実装') ||
    title.includes('implementation') ||
    title.includes('layer') ||
    title.includes('レイヤー')
  ) {
    return {
      phaseId: '2',
      phaseName: 'TDD実装',
      phaseLabel: 'TDD Implementation',
    };
  }

  // テスト系
  if (
    title.includes('test') ||
    title.includes('テスト') ||
    title.includes('検証') ||
    title.includes('qa')
  ) {
    return {
      phaseId: '3',
      phaseName: '追加QA',
      phaseLabel: 'Additional QA',
    };
  }

  // リリース系
  if (
    title.includes('release') ||
    title.includes('リリース') ||
    title.includes('deploy') ||
    title.includes('デプロイ')
  ) {
    return {
      phaseId: '5',
      phaseName: 'リリース',
      phaseLabel: 'Release',
    };
  }

  // デフォルト: 実装フェーズに分類
  return {
    phaseId: '2',
    phaseName: 'TDD実装',
    phaseLabel: 'TDD Implementation',
  };
}

/**
 * AI-DLCタスクをMichi Story形式に変換
 */
function convertTaskToStory(
  task: AIDLCTask,
  phaseId: string,
  storyIndex: number,
  language: 'ja' | 'en',
): string {
  const storyId = `${phaseId}.${storyIndex}`;
  const lines: string[] = [];

  // Storyヘッダー
  lines.push(`### Story ${storyId}: ${task.title}`);

  // 担当者（デフォルト）
  const assignee = language === 'ja' ? '@Developer' : '@Developer';
  lines.push(`- **${language === 'ja' ? '担当' : 'Assignee'}**: ${assignee}`);

  // 工数（推定: 詳細行数に基づく）
  const effort = Math.max(0.5, Math.ceil(task.description.length / 3) * 0.5);
  lines.push(
    `- **${language === 'ja' ? '工数' : 'Effort'}**: ${effort}${language === 'ja' ? '人日' : ' person-days'}`,
  );

  // 説明
  if (task.description.length > 0) {
    lines.push(
      `- **${language === 'ja' ? '説明' : 'Description'}**: ${task.description[0]}`,
    );
  }

  // タスク
  if (task.description.length > 0) {
    lines.push(`- **${language === 'ja' ? 'タスク' : 'Tasks'}**:`);
    task.description.forEach((desc, i) => {
      const taskNum = `${storyId}.${i + 1}`;
      lines.push(`  - [ ] Task ${taskNum}: ${desc}`);
    });
  }

  // 受け入れ基準
  lines.push(
    `- **${language === 'ja' ? '受け入れ基準' : 'Acceptance Criteria'}**:`,
  );
  lines.push(
    `  - [ ] ${language === 'ja' ? '実装完了' : 'Implementation completed'}`,
  );
  lines.push(
    `  - [ ] ${language === 'ja' ? '単体テスト作成・通過' : 'Unit tests created and passing'}`,
  );
  if (task.requirements.length > 0) {
    lines.push(
      `  - [ ] ${language === 'ja' ? '要件充足' : 'Requirements satisfied'}: ${task.requirements.join(', ')}`,
    );
  }

  // 並列実行マーカー
  if (task.isParallel) {
    lines.push(
      `- **${language === 'ja' ? '並列実行' : 'Parallel Execution'}**: ${language === 'ja' ? '可能' : 'Yes'}`,
    );
  }

  return lines.join('\n');
}

/**
 * Phaseグループ
 */
interface PhaseGroup {
  phaseId: string;
  phaseName: string;
  phaseLabel: string;
  stories: string[];
}

/**
 * AI-DLCドキュメントをMichiワークフロー形式に変換
 */
export function convertToMichiFormat(
  doc: AIDLCDocument,
  options: ConversionOptions = {},
): ConversionResult {
  const language = options.language || 'ja';
  const warnings: string[] = [];
  const lines: string[] = [];

  // プロジェクト名の取得
  const projectName =
    options.projectName ||
    doc.title.replace(/^Implementation Tasks:\s*/i, '').trim() ||
    'Feature';

  // 開始日（文字列から Date オブジェクトに変換）
  const startDateStr =
    options.startDate || new Date().toISOString().split('T')[0];
  const startDate = ensureBusinessDay(new Date(startDateStr));
  const startDateFormatted = startDate.toISOString().split('T')[0];
  const startWeekday = getWeekdayNotation(startDate, 1);

  // ヘッダー
  lines.push(
    `# ${language === 'ja' ? 'タスク分割' : 'Task Breakdown'}: ${projectName}`,
  );
  lines.push('');
  lines.push(
    `## ${language === 'ja' ? 'プロジェクト情報' : 'Project Information'}`,
  );
  lines.push('');
  lines.push(
    `- **${language === 'ja' ? '機能名' : 'Feature Name'}**: ${projectName}`,
  );
  lines.push(
    `- **${language === 'ja' ? '開始予定日' : 'Start Date'}**: ${startDateFormatted}${startWeekday} Day 1`,
  );
  lines.push(
    `- **${language === 'ja' ? '休日' : 'Holidays'}**: ${language === 'ja' ? '土日・祝日を除外した営業日ベース' : 'Business days only (excluding weekends and holidays)'}`,
  );
  lines.push(
    `- **${language === 'ja' ? '注意' : 'Note'}**: ${language === 'ja' ? 'このタスク分割はAI-DLC形式から自動変換されました' : 'This task breakdown was auto-converted from AI-DLC format'}`,
  );
  lines.push('');

  // Phase 0.1: 要件定義（プレースホルダー）
  const day1Weekday = getWeekdayNotation(startDate, 1);
  lines.push(
    `## Phase 0.1: ${language === 'ja' ? '要件定義' : 'Requirements'}（Requirements）`,
  );
  lines.push('');
  lines.push(
    `**${language === 'ja' ? '期間' : 'Period'}**: Day 1${day1Weekday}`,
  );
  lines.push(
    `**${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
  );
  lines.push(
    `**${language === 'ja' ? 'ステータス' : 'Status'}**: ${language === 'ja' ? '完了' : 'Completed'}`,
  );
  lines.push('');
  lines.push(
    `### Story 0.1.1: ${language === 'ja' ? '要件定義書作成' : 'Requirements Document Creation'}`,
  );
  lines.push(`- **${language === 'ja' ? '担当' : 'Assignee'}**: @PM`);
  lines.push(
    `- **${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
  );
  lines.push(
    `- **${language === 'ja' ? '説明' : 'Description'}**: ${language === 'ja' ? '機能の要件定義書を作成' : 'Create feature requirements document'}`,
  );
  lines.push(`- **${language === 'ja' ? '成果物' : 'Deliverables'}**:`);
  lines.push(
    `  - \`.kiro/specs/${projectName.toLowerCase().replace(/\s+/g, '-')}/requirements.md\``,
  );
  lines.push(
    `- **${language === 'ja' ? '受け入れ基準' : 'Acceptance Criteria'}**:`,
  );
  lines.push(
    `  - [x] ${language === 'ja' ? '要件定義完了' : 'Requirements defined'}`,
  );
  lines.push('');

  // Phase 0.2: 設計（プレースホルダー）
  const day12Weekday = getWeekdayRangeNotation(startDate, 1, 2);
  lines.push(
    `## Phase 0.2: ${language === 'ja' ? '設計' : 'Design'}（Design）`,
  );
  lines.push('');
  lines.push(
    `**${language === 'ja' ? '期間' : 'Period'}**: Day 1-2${day12Weekday}`,
  );
  lines.push(
    `**${language === 'ja' ? '工数' : 'Effort'}**: 0.5-1.0${language === 'ja' ? '人日' : ' person-days'}`,
  );
  lines.push(
    `**${language === 'ja' ? 'ステータス' : 'Status'}**: ${language === 'ja' ? '完了' : 'Completed'}`,
  );
  lines.push('');
  lines.push(
    `### Story 0.2.1: ${language === 'ja' ? '基本設計' : 'Basic Design'}`,
  );
  lines.push(`- **${language === 'ja' ? '担当' : 'Assignee'}**: @Architect`);
  lines.push(
    `- **${language === 'ja' ? '工数' : 'Effort'}**: 0.5-1.0${language === 'ja' ? '人日' : ' person-days'}`,
  );
  lines.push(
    `- **${language === 'ja' ? '説明' : 'Description'}**: ${language === 'ja' ? 'アーキテクチャ設計、API設計を実施' : 'Architecture and API design'}`,
  );
  lines.push(`- **${language === 'ja' ? '成果物' : 'Deliverables'}**:`);
  lines.push(
    `  - \`.kiro/specs/${projectName.toLowerCase().replace(/\s+/g, '-')}/design.md\``,
  );
  lines.push(
    `- **${language === 'ja' ? '受け入れ基準' : 'Acceptance Criteria'}**:`,
  );
  lines.push(`  - [x] ${language === 'ja' ? '設計完了' : 'Design completed'}`);
  lines.push('');

  // カテゴリをPhaseにグループ化
  const phaseGroups = new Map<string, PhaseGroup>();

  for (let i = 0; i < doc.categories.length; i++) {
    const category = doc.categories[i];
    const mapping = mapCategoryToPhase(category, i, doc.categories.length);

    if (!phaseGroups.has(mapping.phaseId)) {
      phaseGroups.set(mapping.phaseId, {
        phaseId: mapping.phaseId,
        phaseName: mapping.phaseName,
        phaseLabel: mapping.phaseLabel,
        stories: [],
      });
    }

    const group = phaseGroups.get(mapping.phaseId)!;

    // タスクをStoryに変換
    category.tasks.forEach(task => {
      const storyContent = convertTaskToStory(
        task,
        mapping.phaseId,
        group.stories.length + 1,
        language,
      );
      group.stories.push(storyContent);
    });
  }

  // Phaseを順番に出力
  const phaseOrder = ['1', '2', 'A', '3', 'B', '4', '5'];
  let dayCounter = 3; // Phase 0.1, 0.2 で2日使用

  for (const phaseId of phaseOrder) {
    const group = phaseGroups.get(phaseId);
    if (!group || group.stories.length === 0) continue;

    const endDay = dayCounter + Math.ceil(group.stories.length / 2);
    const periodWeekday = getWeekdayRangeNotation(
      startDate,
      dayCounter,
      endDay,
    );

    lines.push(
      `## Phase ${phaseId}: ${group.phaseName}（${group.phaseLabel}）`,
    );
    lines.push('');
    lines.push(
      `**${language === 'ja' ? '期間' : 'Period'}**: Day ${dayCounter}-${endDay}${periodWeekday}`,
    );
    lines.push(
      `**${language === 'ja' ? '工数' : 'Effort'}**: ${group.stories.length * 0.5}-${group.stories.length}${language === 'ja' ? '人日' : ' person-days'}`,
    );
    lines.push(
      `**${language === 'ja' ? 'ステータス' : 'Status'}**: ${language === 'ja' ? '未着手' : 'Not Started'}`,
    );
    lines.push('');

    for (const story of group.stories) {
      lines.push(story);
      lines.push('');
    }

    dayCounter = endDay + 1;
  }

  // Phase 4 と Phase 5 のプレースホルダー（存在しない場合）
  if (!phaseGroups.has('4')) {
    const phase4Weekday = getWeekdayNotation(startDate, dayCounter);
    lines.push(
      `## Phase 4: ${language === 'ja' ? 'リリース準備' : 'Release Preparation'}（Release Preparation）`,
    );
    lines.push('');
    lines.push(
      `**${language === 'ja' ? '期間' : 'Period'}**: Day ${dayCounter}${phase4Weekday}`,
    );
    lines.push(
      `**${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
    );
    lines.push(
      `**${language === 'ja' ? 'ステータス' : 'Status'}**: ${language === 'ja' ? '未着手' : 'Not Started'}`,
    );
    lines.push('');
    lines.push(
      `### Story 4.1: ${language === 'ja' ? 'リリースドキュメント作成' : 'Release Documentation'}`,
    );
    lines.push(`- **${language === 'ja' ? '担当' : 'Assignee'}**: @PM`);
    lines.push(
      `- **${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
    );
    lines.push(
      `- **${language === 'ja' ? '説明' : 'Description'}**: ${language === 'ja' ? 'リリースノートと手順書作成' : 'Create release notes and procedures'}`,
    );
    lines.push(
      `- **${language === 'ja' ? '受け入れ基準' : 'Acceptance Criteria'}**:`,
    );
    lines.push(
      `  - [ ] ${language === 'ja' ? 'リリースノート作成' : 'Release notes created'}`,
    );
    lines.push('');
    dayCounter++;
  }

  if (!phaseGroups.has('5')) {
    const phase5Weekday = getWeekdayNotation(startDate, dayCounter);
    lines.push(
      `## Phase 5: ${language === 'ja' ? 'リリース' : 'Release'}（Release）`,
    );
    lines.push('');
    lines.push(
      `**${language === 'ja' ? '期間' : 'Period'}**: Day ${dayCounter}${phase5Weekday}`,
    );
    lines.push(
      `**${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
    );
    lines.push(
      `**${language === 'ja' ? 'ステータス' : 'Status'}**: ${language === 'ja' ? '未着手' : 'Not Started'}`,
    );
    lines.push('');
    lines.push(
      `### Story 5.1: ${language === 'ja' ? '本番リリース' : 'Production Release'}`,
    );
    lines.push(
      `- **${language === 'ja' ? '担当' : 'Assignee'}**: @InfraEngineer`,
    );
    lines.push(
      `- **${language === 'ja' ? '工数' : 'Effort'}**: 0.5${language === 'ja' ? '人日' : ' person-days'}`,
    );
    lines.push(
      `- **${language === 'ja' ? '説明' : 'Description'}**: ${language === 'ja' ? '本番環境へのデプロイ' : 'Deploy to production'}`,
    );
    lines.push(
      `- **${language === 'ja' ? '受け入れ基準' : 'Acceptance Criteria'}**:`,
    );
    lines.push(
      `  - [ ] ${language === 'ja' ? 'デプロイ成功' : 'Deployment successful'}`,
    );
    lines.push(
      `  - [ ] ${language === 'ja' ? '動作確認完了' : 'Verification completed'}`,
    );
    lines.push('');
  }

  // サマリー
  const stats = getAIDLCStats(doc);
  let totalStories = 0;
  phaseGroups.forEach((g) => (totalStories += g.stories.length));

  lines.push(
    `## ${language === 'ja' ? '見積もりサマリー' : 'Estimate Summary'}`,
  );
  lines.push('');
  lines.push(
    `| ${language === 'ja' ? 'フェーズ' : 'Phase'} | ${language === 'ja' ? 'ストーリー数' : 'Stories'} | ${language === 'ja' ? '工数（人日）' : 'Effort (days)'} |`,
  );
  lines.push('|-------|-------------|---------------|');
  lines.push(
    `| Phase 0.1-0.2: ${language === 'ja' ? '仕様化' : 'Specification'} | 2 | 1-1.5 |`,
  );
  phaseGroups.forEach((group) => {
    lines.push(
      `| Phase ${group.phaseId}: ${group.phaseName} | ${group.stories.length} | ${group.stories.length * 0.5}-${group.stories.length} |`,
    );
  });
  lines.push(
    `| **${language === 'ja' ? '合計' : 'Total'}** | **${totalStories + 2}** | **${Math.ceil(totalStories * 0.5) + 1}-${totalStories + 2}** |`,
  );
  lines.push('');

  // 変換元情報
  lines.push('---');
  lines.push('');
  lines.push(
    `*${language === 'ja' ? 'AI-DLC形式から自動変換' : 'Auto-converted from AI-DLC format'}*`,
  );
  lines.push(
    `*${language === 'ja' ? '元のカテゴリ数' : 'Original categories'}: ${stats.totalCategories}, ${language === 'ja' ? '元のタスク数' : 'Original tasks'}: ${stats.totalTasks}*`,
  );

  return {
    success: true,
    convertedContent: lines.join('\n'),
    warnings,
    stats: {
      originalCategories: stats.totalCategories,
      originalTasks: stats.totalTasks,
      convertedPhases: phaseGroups.size + 2, // +2 for 0.1 and 0.2
      convertedStories: totalStories + 2,
    },
  };
}

/**
 * ファイルを変換
 *
 * @param inputPath - 入力ファイルパス
 * @param outputPath - 出力ファイルパス（省略時は入力ファイルを上書き）
 * @param options - 変換オプション
 * @returns 変換結果
 */
export function convertTasksFile(
  inputPath: string,
  outputPath?: string,
  options: ConversionOptions = {},
): ConversionResult {
  // ファイル読み込み
  const content = readFileSync(inputPath, 'utf-8');

  // AI-DLC形式かチェック
  if (!isAIDLCFormat(content)) {
    return {
      success: false,
      convertedContent: '',
      warnings: [
        `File is not in AI-DLC format: ${inputPath}`,
        'The file may already be in Michi workflow format or is in an unknown format.',
      ],
      stats: {
        originalCategories: 0,
        originalTasks: 0,
        convertedPhases: 0,
        convertedStories: 0,
      },
    };
  }

  // パース
  const doc = parseAIDLCFile(inputPath);

  // 変換
  const result = convertToMichiFormat(doc, options);

  // dry-runの場合は書き込まない
  if (options.dryRun) {
    result.warnings.push('Dry run: No files were modified');
    return result;
  }

  // バックアップ
  if (options.backup) {
    const suffix = options.backupSuffix || '.aidlc-backup';
    const backupPath = inputPath + suffix;
    copyFileSync(inputPath, backupPath);
    result.backupPath = backupPath;
  }

  // 出力
  const targetPath = outputPath || inputPath;
  writeFileSync(targetPath, result.convertedContent, 'utf-8');

  return result;
}
