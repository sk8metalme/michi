/**
 * フェーズ完了バリデーションスクリプト
 * 各フェーズで必須項目が完了しているかチェック
 */

import { existsSync } from 'fs';
import { safeReadFileOrThrow, safeReadJsonFile } from './utils/safe-file-reader.js';
import { join } from 'path';
import { validateFeatureName } from './utils/feature-name-validator.js';
import { loadConfig } from './utils/config-loader.js';
import { type SpecJson } from './utils/spec-updater.js';

type Phase =
  | 'requirements'
  | 'design'
  | 'tasks'
  | 'environment-setup'
  | 'phase-a'
  | 'phase-b';

/**
 * Phase validation result type
 * Based on Result<T, E> pattern but specialized for phase validation
 */
interface ValidationResult {
  phase: Phase;
  success: boolean;
  value: void;
  errors: string[];
  warnings: string[];
}

/**
 * spec.jsonを読み込み
 */
function loadSpecJson(feature: string): SpecJson {
  const specPath = join(process.cwd(), '.michi', 'specs', feature, 'spec.json');

  if (!existsSync(specPath)) {
    throw new Error(`spec.json not found: ${specPath}`);
  }

  const result = safeReadJsonFile<SpecJson>(specPath);

  if (!result.success) {
    const errorType = result.errors[0].type;
    const errorMsg = errorType === 'InvalidJSON'
      ? `Invalid JSON: ${result.errors[0].cause}`
      : errorType;
    throw new Error(`spec.json読み込みエラー: ${errorMsg}`);
  }

  return result.value!;
}

/**
 * 要件定義フェーズのバリデーション
 */
function validateRequirements(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 0. feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }
  
  // 1. requirements.md存在チェック
  const requirementsPath = join(process.cwd(), '.michi', 'specs', feature, 'requirements.md');
  if (!existsSync(requirementsPath)) {
    errors.push('❌ requirements.md が作成されていません');
  }
  
  // 2. spec.json読み込み
  let spec: SpecJson;
  try {
    spec = loadSpecJson(feature);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`❌ spec.json読み込みエラー: ${message}`);
    return { phase: 'requirements', success: false, value: undefined, errors, warnings };
  }
  
  // 3. Confluenceページ作成チェック（必須）
  if (!spec.confluence?.requirementsPageId) {
    errors.push('❌ Confluenceページ（要件定義）が作成されていません');
    errors.push('   → 実行: npm run confluence:sync <feature> requirements');
  }
  
  // 4. spec.jsonのconfluence情報チェック
  if (!spec.confluence?.spaceKey) {
    errors.push('❌ spec.jsonにconfluence.spaceKeyが記録されていません');
  }
  
  // 5. マイルストーン更新チェック
  if (!spec.milestones?.requirements?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.requirements.completedがfalseです');
  }
  
  return {
    phase: 'requirements',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * 設計フェーズのバリデーション
 */
function validateDesign(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 0. feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }
  
  // 1. design.md存在チェック
  const designPath = join(process.cwd(), '.michi', 'specs', feature, 'design.md');
  if (!existsSync(designPath)) {
    errors.push('❌ design.md が作成されていません');
  }
  
  // 2. spec.json読み込み
  let spec: SpecJson;
  try {
    spec = loadSpecJson(feature);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`❌ spec.json読み込みエラー: ${message}`);
    return { phase: 'design', success: false, value: undefined, errors, warnings };
  }
  
  // 3. 前提: 要件定義完了チェック
  if (!spec.milestones?.requirements?.completed) {
    errors.push('❌ 要件定義が完了していません（前提条件）');
  }
  
  // 4. Confluenceページ作成チェック（必須）
  if (!spec.confluence?.designPageId) {
    errors.push('❌ Confluenceページ（設計書）が作成されていません');
    errors.push('   → 実行: npm run confluence:sync <feature> design');
  }
  
  // 5. マイルストーン更新チェック
  if (!spec.milestones?.design?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.design.completedがfalseです');
  }
  
  return {
    phase: 'design',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * タスク分割フェーズのバリデーション
 */
function validateTasks(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 0. feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }
  
  // 1. tasks.md存在チェック
  const tasksPath = join(process.cwd(), '.michi', 'specs', feature, 'tasks.md');
  if (!existsSync(tasksPath)) {
    errors.push('❌ tasks.md が作成されていません');
  } else {
    // 設定読み込み（バリデーション設定）
    let config;
    try {
      config = loadConfig();
    } catch {
      // 設定ファイルの読み込みエラーは無視（デフォルト設定を使用）
      config = { validation: { weekdayNotation: true } };
    }

    // 営業日表記チェック（設定で無効化可能）
    let tasksContent: string;
    try {
      tasksContent = safeReadFileOrThrow(tasksPath);
    } catch (_error) {
      errors.push('❌ tasks.md の読み込みに失敗しました');
      return { phase: 'tasks', success: false, value: undefined, errors, warnings };
    }

    if (config.validation?.weekdayNotation !== false) {
      // 日本語または英語の曜日表記をチェック
      const hasJapaneseWeekday = ['（月）', '（火）'].some(p => tasksContent.includes(p));
      const hasEnglishWeekday = ['(Mon)', '(Tue)'].some(p => tasksContent.includes(p));

      if (!hasJapaneseWeekday && !hasEnglishWeekday) {
        warnings.push('⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません');
      }
    }

    if (!tasksContent.includes('Day 1') && !tasksContent.includes('Day1')) {
      warnings.push('⚠️  tasks.mdに営業日カウント（Day 1, Day 2...）が含まれていません');
    }
    if (!tasksContent.includes('土日')) {
      warnings.push('⚠️  tasks.mdに土日休みの明記がありません');
    }
  }
  
  // 2. spec.json読み込み
  let spec: SpecJson;
  try {
    spec = loadSpecJson(feature);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`❌ spec.json読み込みエラー: ${message}`);
    return { phase: 'tasks', success: false, value: undefined, errors, warnings };
  }
  
  // 3. 前提: 設計完了チェック
  if (!spec.milestones?.design?.completed) {
    errors.push('❌ 設計が完了していません（前提条件）');
  }
  
  // 4. JIRA Epic作成チェック（必須）
  if (!spec.jira?.epicKey) {
    errors.push('❌ JIRA Epicが作成されていません');
    errors.push('   → 実行: npm run jira:sync <feature>');
  }
  
  // 5. JIRA Story作成チェック（必須）
  // spec.jira.storyKeys 配列をチェック（新フォーマット）
  // または spec.jira.stories.created（旧フォーマット）をチェック
  const hasStories = spec.jira?.storyKeys && Array.isArray(spec.jira.storyKeys) && spec.jira.storyKeys.length > 0;
  const hasLegacyStories = spec.jira?.stories && spec.jira.stories.created !== undefined && spec.jira.stories.created > 0;
  
  if (!hasStories && !hasLegacyStories) {
    errors.push('❌ JIRA Storyが1つも作成されていません');
    errors.push('   → 実行: npm run jira:sync <feature>');
  } else if (spec.jira?.storyKeys && spec.jira.storyKeys.length > 0) {
    // 新フォーマット: storyKeys配列が存在する場合
    // 成功として扱う（警告なし）
  } else if (spec.jira?.stories && spec.jira.stories.created !== undefined && spec.jira.stories.total !== undefined && spec.jira.stories.created < spec.jira.stories.total) {
    // 旧フォーマット: 一部未作成の場合のみ警告
    warnings.push(`⚠️  JIRA Storyが一部未作成: ${spec.jira.stories.created}/${spec.jira.stories.total}`);
  }
  
  // 6. マイルストーン更新チェック
  if (!spec.milestones?.tasks?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.tasks.completedがfalseです');
  }
  
  return {
    phase: 'tasks',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}


/**
 * 環境構築フェーズのバリデーション（Phase 1）
 * マニュアル対応フェーズ - バリデーション不要（常に成功）
 */
function validateEnvironmentSetup(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }

  warnings.push('⚠️  このフェーズはマニュアル対応です。環境構築チェックリストを完了してください');

  return {
    phase: 'environment-setup',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * PR前自動テストフェーズのバリデーション（Phase A）
 * CI/CD自動実行 - バリデーション不要（常に成功）
 */
function validatePhaseA(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }

  warnings.push('⚠️  このフェーズはCI/CD自動実行です。PR作成時に自動でテストが実行されます');

  return {
    phase: 'phase-a',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * リリース準備テストフェーズのバリデーション（Phase B）
 * マニュアル対応フェーズ - バリデーション不要（常に成功）
 */
function validatePhaseB(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // feature名のバリデーション
  const nameValidation = validateFeatureName(feature);
  if (!nameValidation.success) {
    errors.push(...nameValidation.errors);
  }

  warnings.push('⚠️  このフェーズはマニュアル対応です。リリース準備テストチェックリストを完了してください');

  return {
    phase: 'phase-b',
    success: errors.length === 0,
    value: undefined,
    errors,
    warnings
  };
}

/**
 * フェーズをバリデート
 */
export function validatePhase(feature: string, phase: Phase): ValidationResult {
  console.log(`\n🔍 Validating phase: ${phase} for feature: ${feature}`);
  
  let result: ValidationResult;
  
  switch (phase) {
  case 'requirements':
    result = validateRequirements(feature);
    break;
  case 'design':
    result = validateDesign(feature);
    break;
  case 'tasks':
    result = validateTasks(feature);
    break;
  case 'environment-setup':
    result = validateEnvironmentSetup(feature);
    break;
  case 'phase-a':
    result = validatePhaseA(feature);
    break;
  case 'phase-b':
    result = validatePhaseB(feature);
    break;
  default:
    throw new Error(`Unknown phase: ${phase}`);
  }
  
  // 結果表示
  console.log('\n📊 Validation Result:');
  
  if (result.errors.length > 0) {
    console.log('\n❌ エラー:');
    result.errors.forEach(err => console.log(`  ${err}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    result.warnings.forEach(warn => console.log(`  ${warn}`));
  }
  
  if (result.success) {
    console.log('\n✅ バリデーション成功: すべての必須項目が完了しています');
  } else {
    console.log('\n❌ バリデーション失敗: 上記のエラーを修正してください');
  }
  
  return result;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run validate:phase <feature> <phase>');
    console.error('Example: npm run validate:phase calculator-app requirements');
    console.error('\nAvailable Phases:');
    console.error('  requirements       - Phase 0.1: 要件定義');
    console.error('  design             - Phase 0.2: 設計');
    console.error('  tasks              - Phase 0.5-0.6: タスク分割・JIRA同期');
    console.error('  environment-setup  - Phase 1: 環境構築（任意）');
    console.error('  phase-a            - Phase A: PR前自動テスト（任意）');
    console.error('  phase-b            - Phase B: リリース準備テスト（任意）');
    console.error('\nNote: For test planning (Phase 0.3-0.4), use /michi:test-planning AI command');
    process.exit(1);
  }

  const [feature, phase] = args;

  const validPhases = [
    'requirements',
    'design',
    'tasks',
    'environment-setup',
    'phase-a',
    'phase-b'
  ];

  if (!validPhases.includes(phase)) {
    console.error(`Invalid phase: ${phase}`);
    console.error('Must be one of: requirements, design, tasks, environment-setup, phase-a, phase-b');
    process.exit(1);
  }
  
  try {
    const result = validatePhase(feature, phase as Phase);
    process.exit(result.success ? 0 : 1);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Validation error: ${message}`);
    process.exit(1);
  }
}

