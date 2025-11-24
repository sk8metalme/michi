/**
 * フェーズランナー
 * 各フェーズを実行し、Confluence/JIRA作成を確実に実行
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { syncToConfluence } from './confluence-sync.js';
import { syncTasksToJIRA } from './jira-sync.js';
import { validatePhase } from './validate-phase.js';
import { runPreFlightCheck } from './pre-flight-check.js';
import { validateFeatureNameOrThrow } from './utils/feature-name-validator.js';
import inquirer from 'inquirer';

type Phase =
  | 'requirements'
  | 'design'
  | 'test-type-selection'
  | 'test-spec'
  | 'tasks'
  | 'environment-setup'
  | 'phase-a'
  | 'phase-b';

interface PhaseRunResult {
  phase: Phase;
  success: boolean;
  confluenceCreated: boolean;
  jiraCreated: boolean;
  validationPassed: boolean;
  errors: string[];
}

/**
 * 要件定義フェーズを実行
 */
async function runRequirementsPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📋 Phase: Requirements（要件定義）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let confluenceCreated = false;
  let confluenceUrl: string | null = null;
  
  // Step 1: requirements.md存在確認
  const requirementsPath = join(process.cwd(), '.kiro', 'specs', feature, 'requirements.md');
  if (!existsSync(requirementsPath)) {
    errors.push('requirements.mdが存在しません。先に/kiro:spec-requirements を実行してください');
    return {
      phase: 'requirements',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ requirements.md 存在確認');
  
  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'requirements');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: any) {
    errors.push(`Confluenceページ作成失敗: ${error.message}`);
    console.error('❌ Confluenceページ作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'requirements');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 要件定義フェーズ完了チェック:');
  console.log('  ✅ requirements.md: 作成済み');
  console.log(`  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 要件定義フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl = process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(`📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`);
    }
  }
  
  return {
    phase: 'requirements',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * 設計フェーズを実行
 */
async function runDesignPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🏗️  Phase: Design（設計）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let confluenceCreated = false;
  let confluenceUrl: string | null = null;
  
  // Step 1: design.md存在確認
  const designPath = join(process.cwd(), '.kiro', 'specs', feature, 'design.md');
  if (!existsSync(designPath)) {
    errors.push('design.mdが存在しません。先に/kiro:spec-design を実行してください');
    return {
      phase: 'design',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ design.md 存在確認');
  
  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'design');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: any) {
    errors.push(`Confluenceページ作成失敗: ${error.message}`);
    console.error('❌ Confluenceページ作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'design');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 設計フェーズ完了チェック:');
  console.log('  ✅ design.md: 作成済み');
  console.log(`  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 設計フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl = process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(`📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`);
    }
  }
  
  return {
    phase: 'design',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * タスク分割フェーズを実行
 */
async function runTasksPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📝 Phase: Tasks（タスク分割）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let jiraCreated = false;
  
  // Step 0: プリフライトチェック
  console.log('\n🔍 プリフライトチェック...');
  const preFlightResult = await runPreFlightCheck('jira');
  
  if (!preFlightResult.valid) {
    console.log('\n❌ プリフライトチェック失敗:');
    preFlightResult.errors.forEach(e => console.log(`  ${e}`));
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors: preFlightResult.errors
    };
  }
  
  console.log('✅ プリフライトチェック成功');
  
  // Step 1: tasks.md存在確認
  const tasksPath = join(process.cwd(), '.kiro', 'specs', feature, 'tasks.md');
  if (!existsSync(tasksPath)) {
    errors.push('tasks.mdが存在しません。先に/kiro:spec-tasks を実行してください');
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ tasks.md 存在確認');
  
  // Step 1.5: tasks.mdフォーマット検証
  console.log('\n🔍 tasks.mdフォーマット検証中...');
  const { validateTasksFormat } = await import('./utils/tasks-format-validator.js');
  try {
    validateTasksFormat(tasksPath);
    console.log('✅ tasks.mdフォーマット検証成功');
  } catch (error: any) {
    errors.push(`フォーマット検証失敗: ${error.message}`);
    console.error('❌ フォーマット検証失敗:', error.message);
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  // Step 2: JIRA Epic/Story作成
  console.log('\n📤 JIRA Epic/Story作成中...');
  try {
    await syncTasksToJIRA(feature);
    jiraCreated = true;
    console.log('✅ JIRA Epic/Story作成成功');
  } catch (error: any) {
    errors.push(`JIRA作成失敗: ${error.message}`);
    console.error('❌ JIRA作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'tasks');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 タスク分割フェーズ完了チェック:');
  console.log('  ✅ tasks.md: 作成済み');
  console.log(`  ${jiraCreated ? '✅' : '❌'} JIRA Epic/Story: ${jiraCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && jiraCreated) {
    console.log('\n🎉 タスク分割フェーズが完了しました！');
    console.log('📢 開発チームに実装開始を通知してください');
    console.log('🚀 次のステップ: /kiro:spec-impl <feature>');
  }
  
  return {
    phase: 'tasks',
    success: validation.valid && jiraCreated,
    confluenceCreated: false,
    jiraCreated,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * テストタイプ選択フェーズを実行（Phase 0.3）
 * 対話的にテストタイプを選択
 */
async function runTestTypeSelectionPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🧪 Phase 0.3: Test Type Selection（テストタイプ選択）');
  console.log('='.repeat(60));

  const errors: string[] = [];
  const specDir = join(process.cwd(), '.kiro', 'specs', feature);
  const selectionPath = join(specDir, 'test-type-selection.json');

  // 既存の選択を読み込む（存在する場合）
  let existingSelection: any = null;
  if (existsSync(selectionPath)) {
    try {
      existingSelection = JSON.parse(readFileSync(selectionPath, 'utf-8'));
      console.log('\n📋 既存の選択が見つかりました:');
      console.log(`   選択済みテストタイプ: ${existingSelection.selectedTypes?.join(', ') || 'なし'}`);
    } catch (error) {
      console.warn('⚠️  既存の選択ファイルの読み込みに失敗しました');
    }
  }

  console.log('\n📚 プロジェクト要件に応じてテストタイプを選択してください\n');

  // 対話的な質問
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'testTypes',
      message: '実施するテストタイプを選択してください（スペースキーで選択/解除、Enterで確定）:',
      choices: [
        {
          name: '単体テスト (Unit Tests) - 必須 [Phase A]',
          value: 'unit',
          checked: true, // 必須のためデフォルトで選択
          disabled: true // 必須のため変更不可
        },
        {
          name: 'Lint実行 - 必須 [Phase A]',
          value: 'lint',
          checked: true,
          disabled: true
        },
        {
          name: 'ビルド実行 - 必須 [Phase A]',
          value: 'build',
          checked: true,
          disabled: true
        },
        new inquirer.Separator('--- 推奨テスト ---'),
        {
          name: '統合テスト (Integration Tests) - 推奨 [Phase 3/B]',
          value: 'integration',
          checked: existingSelection?.selectedTypes?.includes('integration') || false
        },
        {
          name: 'E2Eテスト (End-to-End Tests) - 推奨 [Phase 3/B]',
          value: 'e2e',
          checked: existingSelection?.selectedTypes?.includes('e2e') || false
        },
        new inquirer.Separator('--- 任意テスト ---'),
        {
          name: '性能テスト (Performance Tests) - 任意 [Phase B]',
          value: 'performance',
          checked: existingSelection?.selectedTypes?.includes('performance') || false
        },
        {
          name: 'セキュリティテスト (Security Tests) - 任意 [Phase B]',
          value: 'security',
          checked: existingSelection?.selectedTypes?.includes('security') || false
        }
      ],
      validate: () => {
        // disabled項目は自動的に含まれるため、バリデーションは常に成功
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: (answers: any) => {
        // 必須テストを自動的に追加
        const required = ['unit', 'lint', 'build'];
        const selected = [...new Set([...required, ...answers.testTypes])];
        const optional = selected.filter((t: string) => !required.includes(t));
        if (optional.length === 0) {
          return '必須テストのみが選択されています。この選択で進めますか？';
        }
        return `選択したテストタイプ: ${selected.join(', ')}\nこの選択で進めますか？`;
      },
      default: true
    }
  ]);

  // 必須テストを自動的に追加（disabled項目はanswers.testTypesに含まれないため）
  const requiredTests = ['unit', 'lint', 'build'];
  answers.testTypes = [...new Set([...requiredTests, ...answers.testTypes])];

  if (!answers.confirm) {
    console.log('\n❌ 選択がキャンセルされました');
    return {
      phase: 'test-type-selection' as Phase,
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors: ['ユーザーが選択をキャンセルしました']
    };
  }

  // 選択結果を保存
  const selection = {
    feature,
    selectedTypes: answers.testTypes,
    selectedAt: new Date().toISOString(),
    testTypes: {
      unit: {
        enabled: true,
        required: true,
        phase: 'A',
        description: '単体テスト'
      },
      lint: {
        enabled: true,
        required: true,
        phase: 'A',
        description: 'Lint実行'
      },
      build: {
        enabled: true,
        required: true,
        phase: 'A',
        description: 'ビルド実行'
      },
      integration: {
        enabled: answers.testTypes.includes('integration'),
        required: false,
        phase: 'B',
        description: '統合テスト'
      },
      e2e: {
        enabled: answers.testTypes.includes('e2e'),
        required: false,
        phase: 'B',
        description: 'E2Eテスト'
      },
      performance: {
        enabled: answers.testTypes.includes('performance'),
        required: false,
        phase: 'B',
        description: '性能テスト'
      },
      security: {
        enabled: answers.testTypes.includes('security'),
        required: false,
        phase: 'B',
        description: 'セキュリティテスト'
      }
    }
  };

  // ディレクトリが存在しない場合は作成
  if (!existsSync(specDir)) {
    mkdirSync(specDir, { recursive: true });
  }

  // 選択結果を保存
  writeFileSync(selectionPath, JSON.stringify(selection, null, 2), 'utf-8');
  console.log(`\n✅ テストタイプ選択を保存しました: ${selectionPath}`);

  // spec.jsonを更新
  try {
    const specPath = join(specDir, 'spec.json');
    if (existsSync(specPath)) {
      const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
      spec.testTypeSelection = {
        completed: true,
        selectedTypes: answers.testTypes,
        selectedAt: selection.selectedAt
      };
      spec.lastUpdated = new Date().toISOString();
      writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
      console.log('✅ spec.jsonを更新しました');
    }
  } catch (error: any) {
    errors.push(`spec.json更新失敗: ${error.message}`);
    console.warn(`⚠️  spec.json更新失敗: ${error.message}`);
  }

  // 選択結果のサマリーを表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 選択結果サマリー:');
  console.log(`   必須テスト: ${['unit', 'lint', 'build'].join(', ')}`);
  const optional = answers.testTypes.filter((t: string) => !['unit', 'lint', 'build'].includes(t));
  if (optional.length > 0) {
    console.log(`   追加テスト: ${optional.join(', ')}`);
  } else {
    console.log('   追加テスト: なし');
  }

  console.log('\n📖 次のステップ:');
  console.log('   1. Phase 0.4: テスト仕様書作成へ進む');
  console.log('      michi phase:run ' + feature + ' test-spec');
  console.log('   2. 詳細ガイド: docs/user-guide/testing/test-planning-flow.md');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 0.3: テストタイプ選択が完了しました');

  return {
    phase: 'test-type-selection' as Phase,
    success: true,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors
  };
}

/**
 * テスト仕様書作成フェーズを実行（Phase 0.4）
 * 自動生成: test-type-selectionから選択されたテストタイプの仕様書を生成
 */
async function runTestSpecPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📝 Phase 0.4: Test Specification（テスト仕様書作成）');
  console.log('='.repeat(60));

  const errors: string[] = [];

  // Step 1: テストタイプ選択の読み込み
  const selectionPath = join(process.cwd(), '.kiro', 'specs', feature, 'test-type-selection.json');
  if (!existsSync(selectionPath)) {
    errors.push('test-type-selection.jsonが存在しません。先にtest-type-selectionフェーズを実行してください');
    return {
      phase: 'test-spec' as Phase,
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }

  const selection = JSON.parse(readFileSync(selectionPath, 'utf-8'));
  const testTypes: string[] = selection.selectedTypes || [];

  console.log(`\n✅ 選択されたテストタイプ: ${testTypes.join(', ')}`);

  // Step 2: 各テストタイプのテスト仕様書を生成
  console.log('\n🤖 テスト仕様書を自動生成中...');

  const specDir = join(process.cwd(), '.kiro', 'specs', feature, 'test-specs');
  mkdirSync(specDir, { recursive: true });

  const { generateTestSpec } = await import('./test-spec-generator.js');
  const generatedSpecs: string[] = [];

  for (const testType of testTypes) {
    // lint/buildはテスト仕様書不要（CI設定で対応）
    if (testType === 'lint' || testType === 'build') {
      console.log(`   ⏭️  ${testType}: スキップ（CI設定で対応）`);
      continue;
    }

    try {
      await generateTestSpec(feature, testType);
      console.log(`   ✅ ${testType}テスト仕様書: ${testType}-test-spec.md`);
      generatedSpecs.push(testType);
    } catch (error: any) {
      errors.push(`${testType}テスト仕様書生成失敗: ${error.message}`);
      console.error(`   ❌ ${testType}テスト仕様書生成失敗: ${error.message}`);
    }
  }

  // Step 3: spec.json更新
  const specPath = join(process.cwd(), '.kiro', 'specs', feature, 'spec.json');
  if (existsSync(specPath)) {
    try {
      const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
      spec.testSpecification = {
        completed: true,
        generatedAt: new Date().toISOString(),
        testTypes: testTypes,
        generatedSpecs: generatedSpecs
      };
      spec.lastUpdated = new Date().toISOString();
      writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
      console.log('\n✅ spec.jsonを更新しました');
    } catch (error: any) {
      errors.push(`spec.json更新失敗: ${error.message}`);
      console.warn(`⚠️  spec.json更新失敗: ${error.message}`);
    }
  }

  // Step 4: サマリー表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 テスト仕様書作成完了:');
  console.log(`   生成されたファイル: ${generatedSpecs.length}件`);
  console.log(`   保存先: .kiro/specs/${feature}/test-specs/`);
  
  if (generatedSpecs.length > 0) {
    console.log('\n📄 生成されたファイル:');
    generatedSpecs.forEach(type => {
      console.log(`   - ${type}-test-spec.md`);
    });
  }

  console.log('\n📖 次のステップ:');
  console.log(`   1. Phase 0.5: タスク分割へ進む`);
  console.log(`      michi phase:run ${feature} tasks`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 0.4: テスト仕様書作成が完了しました');

  return {
    phase: 'test-spec' as Phase,
    success: errors.length === 0 && generatedSpecs.length > 0,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors
  };
}

/**
 * 環境構築フェーズを実行（Phase 1）
 * 対話的に環境を構築し、必要な設定ファイルを生成
 */
async function runEnvironmentSetupPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n⚙️  Phase 1: Environment Setup（環境構築）');
  console.log('='.repeat(60));

  const errors: string[] = [];

  // Step 1: プロジェクト検出
  const { detectProject } = await import('./utils/project-detector.js');
  const detected = detectProject();
  
  console.log(`\n🔍 検出されたプロジェクト: ${detected.language}`);
  console.log(`   ビルドツール: ${detected.buildTool}`);
  if (detected.testFramework) {
    console.log(`   テストフレームワーク: ${detected.testFramework}`);
  }
  if (detected.hasCI) {
    console.log(`   CI/CD: 既存の設定あり`);
  }

  // Step 2: 実装言語を分析
  const { analyzeLanguage } = await import('./utils/language-detector.js');
  const languageAnalysis = analyzeLanguage(feature);
  
  if (languageAnalysis.confidence !== 'low') {
    console.log(`\n💡 実装言語を推奨します: ${languageAnalysis.language}（信頼度: ${languageAnalysis.confidence}）`);
    console.log('   理由:');
    languageAnalysis.reasons.forEach(reason => console.log(`   - ${reason}`));
  }
  
  // Step 3: Docker Compose要件を分析
  const { analyzeDockerRequirement } = await import('./utils/docker-requirement-detector.js');
  const dockerAnalysis = analyzeDockerRequirement(feature);
  
  if (dockerAnalysis.recommended) {
    console.log(`\n💡 Docker Composeを推奨します（信頼度: ${dockerAnalysis.confidence}）`);
    console.log('   理由:');
    dockerAnalysis.reasons.forEach(reason => console.log(`   - ${reason}`));
    if (dockerAnalysis.suggestedServices.length > 0) {
      console.log(`   推奨サービス: ${dockerAnalysis.suggestedServices.join(', ')}`);
    }
  }

  // Step 4: 対話的質問
  console.log('\n📚 環境構築を対話的に設定します\n');

  const languageMap: Record<string, string> = {
    'nodejs': 'Node.js/TypeScript',
    'java': 'Java',
    'php': 'PHP',
    'python': 'Python',
    'go': 'Go',
    'rust': 'Rust',
    'other': 'その他'
  };

  // 言語のデフォルト値を決定（分析結果 > プロジェクト検出）
  const defaultLanguage = languageAnalysis.confidence !== 'low' 
    ? languageAnalysis.language 
    : (languageMap[detected.language] || 'その他');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: languageAnalysis.confidence !== 'low'
        ? `プロジェクトの言語を選択してください（推奨: ${languageAnalysis.language}）:`
        : 'プロジェクトの言語を選択してください:',
      choices: ['Node.js/TypeScript', 'Java', 'PHP', 'Python', 'Go', 'Rust', 'その他'],
      default: defaultLanguage
    },
    {
      type: 'list',
      name: 'ciTool',
      message: 'CI/CDツールを選択してください:',
      choices: ['GitHub Actions', 'Screwdriver', 'GitLab CI', 'なし'],
      default: detected.hasCI ? 'GitHub Actions' : 'GitHub Actions'
    },
    {
      type: 'confirm',
      name: 'needsDocker',
      message: dockerAnalysis.recommended
        ? `Docker Composeを使用しますか？（推奨: ${dockerAnalysis.confidence}）`
        : 'Docker Composeが必要ですか？（データベース・モックサーバー用）',
      default: dockerAnalysis.recommended
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: '依存関係を自動インストールしますか？',
      default: true,
      when: () => detected.hasDependencies
    }
  ]);
  
  // Docker Composeの推奨サービスを保存
  answers.suggestedServices = dockerAnalysis.suggestedServices;

  // Step 3: 設定ファイル生成
  console.log('\n🤖 設定ファイルを生成中...');

  try {
    const { generateCIConfig } = await import('./utils/ci-generator.js');
    await generateCIConfig(feature, answers);
  } catch (error: any) {
    errors.push(`CI/CD設定生成失敗: ${error.message}`);
    console.error(`   ❌ CI/CD設定生成失敗: ${error.message}`);
  }

  try {
    const { generateTestConfig } = await import('./utils/test-config-generator.js');
    await generateTestConfig(feature, answers);
  } catch (error: any) {
    errors.push(`テスト設定生成失敗: ${error.message}`);
    console.error(`   ❌ テスト設定生成失敗: ${error.message}`);
  }

  if (answers.needsDocker) {
    try {
      const { generateDockerCompose } = await import('./utils/docker-generator.js');
      await generateDockerCompose(feature, answers.suggestedServices || []);
    } catch (error: any) {
      errors.push(`Docker Compose生成失敗: ${error.message}`);
      console.error(`   ❌ Docker Compose生成失敗: ${error.message}`);
    }
  }

  // Step 4: 依存関係インストール（オプション）
  if (answers.installDeps) {
    console.log('\n📦 依存関係をインストール中...');
    
    const { execSync } = await import('child_process');
    
    // 言語別のビルドファイル存在確認
    const buildFileChecks: Record<string, string> = {
      'Node.js/TypeScript': 'package.json',
      'Java': 'build.gradle',
      'PHP': 'composer.json',
      'Python': 'requirements.txt',
      'Go': 'go.mod',
      'Rust': 'Cargo.toml'
    };
    
    const buildFile = buildFileChecks[answers.language];
    if (!buildFile || !existsSync(buildFile)) {
      console.log(`   ℹ️  ${buildFile || 'ビルドファイル'}が見つかりません（スキップ）`);
      console.log('   💡 実際のプロジェクトでは、先にプロジェクトを初期化してください');
    } else {
      const commands: Record<string, string> = {
        'Node.js/TypeScript': detected.packageManager === 'pnpm' ? 'pnpm install' : 
                              detected.packageManager === 'yarn' ? 'yarn install' : 
                              'npm install',
        'Java': existsSync('./gradlew') ? './gradlew build --no-daemon' : 'gradle build',
        'PHP': 'composer install',
        'Python': 'pip install -r requirements.txt',
        'Go': 'go mod download',
        'Rust': 'cargo fetch'
      };

      const command = commands[answers.language];
      if (command) {
        try {
          execSync(command, { stdio: 'inherit', cwd: process.cwd() });
          console.log('   ✅ 依存関係のインストール完了');
        } catch (error: any) {
          console.warn(`   ⚠️  依存関係インストール失敗: ${error.message}`);
          console.warn('   💡 プロジェクト初期化後に手動でインストールしてください');
        }
      }
    }
  }

  // Step 5: spec.json更新
  const specPath = join(process.cwd(), '.kiro', 'specs', feature, 'spec.json');
  if (existsSync(specPath)) {
    try {
      const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
      spec.environmentSetup = {
        completed: true,
        language: answers.language,
        ciTool: answers.ciTool,
        dockerCompose: answers.needsDocker,
        completedAt: new Date().toISOString()
      };
      spec.lastUpdated = new Date().toISOString();
      writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
      console.log('\n✅ spec.jsonを更新しました');
    } catch (error: any) {
      errors.push(`spec.json更新失敗: ${error.message}`);
      console.warn(`⚠️  spec.json更新失敗: ${error.message}`);
    }
  }

  // Step 6: サマリー表示
  console.log('\n' + '='.repeat(60));
  console.log('📊 環境構築完了:');
  console.log(`   言語: ${answers.language}`);
  console.log(`   CI/CD: ${answers.ciTool}`);
  console.log(`   Docker Compose: ${answers.needsDocker ? 'あり' : 'なし'}`);

  console.log('\n📖 次のステップ:');
  console.log(`   1. Phase 2: TDD実装へ進む`);
  console.log(`      /kiro:spec-impl ${feature}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 1: 環境構築が完了しました');

  return {
    phase: 'environment-setup' as Phase,
    success: errors.length === 0,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors
  };
}

/**
 * PR前自動テストフェーズを実行（Phase A）
 * マニュアル対応：CI/CD案内を表示
 */
async function runPhaseAPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🤖 Phase A: PR前自動テスト（PR Tests）');
  console.log('='.repeat(60));

  const errors: string[] = [];

  console.log('\n📚 このフェーズはCI/CD自動実行です');
  console.log('PR作成時に以下のテストが自動実行されます:\n');

  console.log('自動実行テスト:');
  console.log('  - 単体テスト (npm test)');
  console.log('  - Lint実行 (npm run lint)');
  console.log('  - ビルド実行 (npm run build)\n');

  console.log('CI/CD設定ファイル:');
  console.log('  - .github/workflows/ci.yml');
  console.log('  - .github/workflows/test.yml\n');

  console.log('📖 詳細ガイド:');
  console.log('  docs/user-guide/testing/test-execution-flow.md\n');

  console.log('確認事項:');
  console.log('  [ ] CI/CDパイプラインが正常に動作している');
  console.log('  [ ] すべての自動テストが成功している');
  console.log('  [ ] テストカバレッジが95%以上');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase A: PR前自動テスト案内を表示しました');
  console.log('📢 CI/CDが自動実行します。Phase 3に進んでください');

  return {
    phase: 'phase-a' as Phase,
    success: true,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors
  };
}

/**
 * リリース準備テストフェーズを実行（Phase B）
 * マニュアル対応：手動テストチェックリストを表示
 */
async function runPhaseBPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🔍 Phase B: リリース準備テスト（Release Tests）');
  console.log('='.repeat(60));

  const errors: string[] = [];

  console.log('\n📚 このフェーズはマニュアル対応です');
  console.log('以下のテストを実施してください:\n');

  console.log('リリース準備テストチェックリスト:');
  console.log('  [ ] 性能テスト実行');
  console.log('      - 負荷テスト');
  console.log('      - レスポンスタイム測定');
  console.log('      - ボトルネック特定');
  console.log('  [ ] セキュリティテスト実行');
  console.log('      - 脆弱性スキャン');
  console.log('      - セキュリティチェックリスト');
  console.log('      - アクセス制御確認');
  console.log('  [ ] 手動回帰テスト');
  console.log('      - 回帰テストチェックリスト');
  console.log('      - クリティカルパス確認');
  console.log('      - 既知のバグ文書化\n');

  console.log('参考ドキュメント:');
  console.log('  - docs/testing/specs/ (テスト仕様書)');
  console.log('  - docs/user-guide/testing/test-execution-flow.md\n');

  console.log('次のステップ:');
  console.log('  1. 上記チェックリストを完了');
  console.log('  2. テスト結果をドキュメント化');
  console.log('  3. Phase 4: リリース準備へ進む');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase B: リリース準備テストチェックリストを表示しました');
  console.log('📢 テストを完了してPhase 4に進んでください');

  return {
    phase: 'phase-b' as Phase,
    success: true,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors
  };
}

/**
 * フェーズを実行
 */
export async function runPhase(feature: string, phase: Phase): Promise<PhaseRunResult> {
  // feature名のバリデーション（必須）
  validateFeatureNameOrThrow(feature);
  
  switch (phase) {
  case 'requirements':
    return await runRequirementsPhase(feature);
  case 'design':
    return await runDesignPhase(feature);
  case 'test-type-selection':
    return await runTestTypeSelectionPhase(feature);
  case 'test-spec':
    return await runTestSpecPhase(feature);
  case 'tasks':
    return await runTasksPhase(feature);
  case 'environment-setup':
    return await runEnvironmentSetupPhase(feature);
  case 'phase-a':
    return await runPhaseAPhase(feature);
  case 'phase-b':
    return await runPhaseBPhase(feature);
  default:
    throw new Error(`Unknown phase: ${phase}`);
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run phase:run <feature> <phase>');
    console.error('Example: npm run phase:run calculator-app requirements');
    console.error('\nAvailable Phases:');
    console.error('  requirements       - Phase 0.1: 要件定義');
    console.error('  design             - Phase 0.2: 設計');
    console.error('  test-type-selection- Phase 0.3: テストタイプ選択（任意）');
    console.error('  test-spec          - Phase 0.4: テスト仕様書作成（任意）');
    console.error('  tasks              - Phase 0.5-0.6: タスク分割・JIRA同期');
    console.error('  environment-setup  - Phase 1: 環境構築（任意）');
    console.error('  phase-a            - Phase A: PR前自動テスト（任意）');
    console.error('  phase-b            - Phase B: リリース準備テスト（任意）');
    process.exit(1);
  }

  const [feature, phase] = args;

  const validPhases = [
    'requirements',
    'design',
    'test-type-selection',
    'test-spec',
    'tasks',
    'environment-setup',
    'phase-a',
    'phase-b'
  ];

  if (!validPhases.includes(phase)) {
    console.error(`Invalid phase: ${phase}`);
    console.error('Must be one of: requirements, design, test-type-selection, test-spec, tasks, environment-setup, phase-a, phase-b');
    process.exit(1);
  }
  
  runPhase(feature, phase as Phase)
    .then((result) => {
      if (result.success) {
        console.log('\n✅ フェーズ完了');
        process.exit(0);
      } else {
        console.log('\n❌ フェーズ未完了（エラーを確認してください）');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`\n❌ フェーズ実行エラー: ${error.message}`);
      process.exit(1);
    });
}

