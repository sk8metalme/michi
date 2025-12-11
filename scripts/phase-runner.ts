/**
 * フェーズランナー
 * 各フェーズを実行し、Confluence/JIRA作成を確実に実行
 */

import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { syncToConfluence } from './confluence-sync.js';
import { syncTasksToJIRA } from './jira-sync.js';
import { validatePhase } from './validate-phase.js';
import { runPreFlightCheck } from './pre-flight-check.js';
import { validateFeatureNameOrThrow } from './utils/feature-name-validator.js';
import { getTestCommands } from './constants/test-commands.js';
import { loadSpecJson } from './utils/spec-updater.js';
import inquirer from 'inquirer';

type Phase =
  | 'requirements'
  | 'design'
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
  const requirementsPath = join(
    process.cwd(),
    '.kiro',
    'specs',
    feature,
    'requirements.md',
  );
  if (!existsSync(requirementsPath)) {
    errors.push(
      'requirements.mdが存在しません。先に/kiro:spec-requirements を実行してください',
    );
    return {
      phase: 'requirements',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors,
    };
  }

  console.log('✅ requirements.md 存在確認');

  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'requirements');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Confluenceページ作成失敗: ${message}`);
    console.error('❌ Confluenceページ作成失敗:', message);
  }

  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'requirements');
  errors.push(...validation.errors);

  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 要件定義フェーズ完了チェック:');
  console.log('  ✅ requirements.md: 作成済み');
  console.log(
    `  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`,
  );
  console.log(
    `  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`,
  );

  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 要件定義フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl =
        process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(
        `📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`,
      );
    }
  }

  return {
    phase: 'requirements',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors,
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
  const designPath = join(
    process.cwd(),
    '.kiro',
    'specs',
    feature,
    'design.md',
  );
  if (!existsSync(designPath)) {
    errors.push(
      'design.mdが存在しません。先に/kiro:spec-design を実行してください',
    );
    return {
      phase: 'design',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors,
    };
  }

  console.log('✅ design.md 存在確認');

  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'design');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Confluenceページ作成失敗: ${message}`);
    console.error('❌ Confluenceページ作成失敗:', message);
  }

  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'design');
  errors.push(...validation.errors);

  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 設計フェーズ完了チェック:');
  console.log('  ✅ design.md: 作成済み');
  console.log(
    `  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`,
  );
  console.log(
    `  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`,
  );

  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 設計フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl =
        process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(
        `📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`,
      );
    }
  }

  return {
    phase: 'design',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors,
  };
}

/**
 * タスク分割フェーズの前提条件をチェック
 */
async function checkTasksPrerequisites(
  feature: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // プリフライトチェック
  console.log('\n🔍 プリフライトチェック...');
  const preFlightResult = await runPreFlightCheck('jira');

  if (!preFlightResult.valid) {
    console.log('\n❌ プリフライトチェック失敗:');
    preFlightResult.errors.forEach((e) => console.log(`  ${e}`));
    return { valid: false, errors: preFlightResult.errors };
  }

  console.log('✅ プリフライトチェック成功');

  // tasks.md存在確認
  const tasksPath = join(process.cwd(), '.kiro', 'specs', feature, 'tasks.md');
  if (!existsSync(tasksPath)) {
    errors.push(
      'tasks.mdが存在しません。先に/kiro:spec-tasks を実行してください',
    );
    return { valid: false, errors };
  }

  console.log('✅ tasks.md 存在確認');
  return { valid: true, errors: [] };
}

/**
 * AI-DLC形式を検出して変換を提案
 */
async function detectAndConvertAIDLCFormat(
  feature: string,
  tasksPath: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  console.log('\n🔍 tasks.mdフォーマット検証中...');
  const { isAIDLCFormat } = await import('./utils/aidlc-parser.js');
  const tasksContent = readFileSync(tasksPath, 'utf-8');

  if (!isAIDLCFormat(tasksContent)) {
    return { success: true, errors: [] };
  }

  console.log('\n⚠️  AI-DLC形式が検出されました');
  console.log('   tasks.mdはMichiワークフロー形式ではなくAI-DLC形式です。');
  console.log('');
  console.log('🔄 変換オプション:');
  console.log(`   michi tasks:convert ${feature} --dry-run  # プレビュー`);
  console.log(
    `   michi tasks:convert ${feature} --backup   # バックアップ付きで変換`,
  );
  console.log(`   michi tasks:convert ${feature}            # 直接変換`);
  console.log('');

  // 対話的に変換を提案
  const shouldConvert = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'convert',
      message: 'AI-DLC形式をMichiワークフロー形式に変換しますか？',
      default: true,
    },
  ]);

  if (!shouldConvert.convert) {
    console.log('\n⏭️  変換をスキップしました');
    console.log(
      '   AI-DLC形式のままではJIRA連携が正常に動作しない可能性があります。',
    );
    errors.push(
      'tasks.mdがAI-DLC形式のため、フォーマット検証をスキップしました',
    );
    return { success: false, errors };
  }

  console.log('\n🔄 AI-DLC形式をMichiワークフロー形式に変換中...');
  const { convertTasksFile } = await import('./utils/tasks-converter.js');
  const result = convertTasksFile(tasksPath, undefined, {
    backup: true,
    language: 'ja',
    projectName: feature,
  });

  if (result.success) {
    console.log('✅ 変換成功！');
    console.log(`   元ファイル: ${result.backupPath}`);
    console.log(`   変換後: ${tasksPath}`);
    console.log(
      `   統計: ${result.stats.originalTasks}タスク → ${result.stats.convertedStories}ストーリー`,
    );
    return { success: true, errors: [] };
  }

  errors.push('AI-DLC形式の変換に失敗しました');
  result.warnings.forEach((w) => errors.push(w));
  console.error('❌ 変換失敗');
  return { success: false, errors };
}

/**
 * tasks.mdのフォーマット検証とJIRA同期
 */
async function validateTasksFormatAndSyncJIRA(
  feature: string,
  tasksPath: string
): Promise<{ jiraCreated: boolean; errors: string[] }> {
  const errors: string[] = [];
  let jiraCreated = false;

  // フォーマット検証
  const { validateTasksFormat } = await import(
    './utils/tasks-format-validator.js'
  );
  try {
    validateTasksFormat(tasksPath);
    console.log('✅ tasks.mdフォーマット検証成功');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`フォーマット検証失敗: ${message}`);
    console.error('❌ フォーマット検証失敗:', message);
    return { jiraCreated: false, errors };
  }

  // JIRA Epic/Story作成
  console.log('\n📤 JIRA Epic/Story作成中...');
  try {
    await syncTasksToJIRA(feature);
    jiraCreated = true;
    console.log('✅ JIRA Epic/Story作成成功');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`JIRA作成失敗: ${message}`);
    console.error('❌ JIRA作成失敗:', message);
  }

  return { jiraCreated, errors };
}

/**
 * タスク分割フェーズのサマリーを表示
 */
function displayTasksPhaseSummary(
  jiraCreated: boolean,
  validation: { valid: boolean; errors: string[] }
): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 タスク分割フェーズ完了チェック:');
  console.log('  ✅ tasks.md: 作成済み');
  console.log(
    `  ${jiraCreated ? '✅' : '❌'} JIRA Epic/Story: ${jiraCreated ? '作成済み' : '未作成'}`,
  );
  console.log(
    `  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`,
  );

  if (validation.valid && jiraCreated) {
    console.log('\n🎉 タスク分割フェーズが完了しました！');
    console.log('📢 開発チームに実装開始を通知してください');
    console.log('🚀 次のステップ: /kiro:spec-impl <feature>');
  }
}

/**
 * タスク分割フェーズを実行
 */
async function runTasksPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📝 Phase: Tasks（タスク分割）');
  console.log('='.repeat(60));

  const errors: string[] = [];
  let jiraCreated = false;
  const tasksPath = join(process.cwd(), '.kiro', 'specs', feature, 'tasks.md');

  // 前提条件チェック
  const prereqCheck = await checkTasksPrerequisites(feature);
  if (!prereqCheck.valid) {
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors: prereqCheck.errors,
    };
  }

  // AI-DLC形式検出と変換
  const convertResult = await detectAndConvertAIDLCFormat(feature, tasksPath);
  if (!convertResult.success) {
    errors.push(...convertResult.errors);
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors,
    };
  }

  // フォーマット検証とJIRA同期
  const syncResult = await validateTasksFormatAndSyncJIRA(feature, tasksPath);
  jiraCreated = syncResult.jiraCreated;
  errors.push(...syncResult.errors);

  // バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'tasks');
  errors.push(...validation.errors);

  // サマリー表示
  displayTasksPhaseSummary(jiraCreated, validation);

  return {
    phase: 'tasks',
    success: validation.valid && jiraCreated,
    confluenceCreated: false,
    jiraCreated,
    validationPassed: validation.valid,
    errors,
  };
}




/**
 * プロジェクト検出と言語/Docker要件を分析
 */
async function detectAndAnalyzeProject(feature: string) {
  // Step 1: プロジェクト検出
  const { detectProject } = await import('./utils/project-detector.js');
  const detected = detectProject();

  console.log(`\n🔍 検出されたプロジェクト: ${detected.language}`);
  console.log(`   ビルドツール: ${detected.buildTool}`);
  if (detected.testFramework) {
    console.log(`   テストフレームワーク: ${detected.testFramework}`);
  }
  if (detected.hasCI) {
    console.log('   CI/CD: 既存の設定あり');
  }

  // Step 2: 実装言語を分析
  const { analyzeLanguage } = await import('./utils/language-detector.js');
  const languageAnalysis = analyzeLanguage(feature);

  if (languageAnalysis.confidence !== 'low') {
    console.log(
      `\n💡 実装言語を推奨します: ${languageAnalysis.language}（信頼度: ${languageAnalysis.confidence}）`,
    );
    console.log('   理由:');
    languageAnalysis.reasons.forEach((reason) => console.log(`   - ${reason}`));
  }

  // Step 3: Docker Compose要件を分析
  const { analyzeDockerRequirement } = await import(
    './utils/docker-requirement-detector.js'
  );
  const dockerAnalysis = analyzeDockerRequirement(feature);

  if (dockerAnalysis.recommended) {
    console.log(
      `\n💡 Docker Composeを推奨します（信頼度: ${dockerAnalysis.confidence}）`,
    );
    console.log('   理由:');
    dockerAnalysis.reasons.forEach((reason) => console.log(`   - ${reason}`));
    if (dockerAnalysis.suggestedServices.length > 0) {
      console.log(
        `   推奨サービス: ${dockerAnalysis.suggestedServices.join(', ')}`,
      );
    }
  }

  return { detected, languageAnalysis, dockerAnalysis };
}

/**
 * 環境構築の対話的質問を収集
 */
async function collectEnvironmentAnswers(
  detected: ReturnType<typeof import('./utils/project-detector.js').detectProject>,
  languageAnalysis: ReturnType<typeof import('./utils/language-detector.js').analyzeLanguage>,
  dockerAnalysis: ReturnType<typeof import('./utils/docker-requirement-detector.js').analyzeDockerRequirement>
) {
  console.log('\n📚 環境構築を対話的に設定します\n');

  const languageMap: Record<string, string> = {
    nodejs: 'Node.js/TypeScript',
    java: 'Java',
    php: 'PHP',
    python: 'Python',
    go: 'Go',
    rust: 'Rust',
    other: 'その他',
  };

  // 言語のデフォルト値を決定（分析結果 > プロジェクト検出）
  const defaultLanguage =
    languageAnalysis.confidence !== 'low'
      ? languageAnalysis.language
      : languageMap[detected.language] || 'その他';

  // 型定義: promptの回答 + 追加プロパティ
  interface EnvironmentAnswers {
    language: string;
    ciTool: string;
    needsDocker: boolean;
    installDeps?: boolean;
    suggestedServices?: string[];
  }

  const answers = await inquirer.prompt<EnvironmentAnswers>([
    {
      type: 'select',
      name: 'language',
      message:
        languageAnalysis.confidence !== 'low'
          ? `プロジェクトの言語を選択してください（推奨: ${languageAnalysis.language}）:`
          : 'プロジェクトの言語を選択してください:',
      choices: [
        'Node.js/TypeScript',
        'Java',
        'PHP',
        'Python',
        'Go',
        'Rust',
        'その他',
      ],
      default: defaultLanguage,
    },
    {
      type: 'select',
      name: 'ciTool',
      message: 'CI/CDツールを選択してください:',
      choices: ['GitHub Actions', 'Screwdriver', 'GitLab CI', 'なし'],
      default: detected.hasCI ? 'GitHub Actions' : 'GitHub Actions',
    },
    {
      type: 'confirm',
      name: 'needsDocker',
      message: dockerAnalysis.recommended
        ? `Docker Composeを使用しますか？（推奨: ${dockerAnalysis.confidence}）`
        : 'Docker Composeが必要ですか？（データベース・モックサーバー用）',
      default: dockerAnalysis.recommended,
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: '依存関係を自動インストールしますか？',
      default: true,
      when: () => detected.hasDependencies,
    },
  ]);

  // Docker Composeの推奨サービスを保存
  answers.suggestedServices = dockerAnalysis.suggestedServices;

  return answers;
}

/**
 * 環境構築の設定ファイルを生成
 */
async function generateEnvironmentConfigs(
  feature: string,
  answers: { language: string; ciTool: string; needsDocker: boolean; suggestedServices?: string[] },
  errors: string[]
) {
  console.log('\n🤖 設定ファイルを生成中...');

  try {
    const { generateCIConfig } = await import('./utils/ci-generator.js');
    await generateCIConfig(feature, answers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`CI/CD設定生成失敗: ${message}`);
    console.error(`   ❌ CI/CD設定生成失敗: ${message}`);
  }

  try {
    const { generateTestConfig } = await import(
      './utils/test-config-generator.js'
    );
    await generateTestConfig(feature, answers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`テスト設定生成失敗: ${message}`);
    console.error(`   ❌ テスト設定生成失敗: ${message}`);
  }

  if (answers.needsDocker) {
    try {
      const { generateDockerCompose } = await import(
        './utils/docker-generator.js'
      );
      await generateDockerCompose(feature, answers.suggestedServices || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Docker Compose生成失敗: ${message}`);
      console.error(`   ❌ Docker Compose生成失敗: ${message}`);
    }
  }
}

/**
 * 依存関係を自動インストール
 */
async function installDependencies(
  answers: { language: string; installDeps?: boolean },
  detected: { packageManager?: string }
) {
  if (!answers.installDeps) {
    return;
  }

  console.log('\n📦 依存関係をインストール中...');

  const { execSync } = await import('child_process');

  // 言語別のビルドファイル存在確認
  const buildFileChecks: Record<string, string> = {
    'Node.js/TypeScript': 'package.json',
    Java: 'build.gradle',
    PHP: 'composer.json',
    Python: 'requirements.txt',
    Go: 'go.mod',
    Rust: 'Cargo.toml',
  };

  const buildFile = buildFileChecks[answers.language];
  if (!buildFile || !existsSync(buildFile)) {
    console.log(
      `   ℹ️  ${buildFile || 'ビルドファイル'}が見つかりません（スキップ）`,
    );
    console.log(
      '   💡 実際のプロジェクトでは、先にプロジェクトを初期化してください',
    );
    return;
  }

  const commands: Record<string, string> = {
    'Node.js/TypeScript':
      detected.packageManager === 'pnpm'
        ? 'pnpm install'
        : detected.packageManager === 'yarn'
          ? 'yarn install'
          : 'npm install',
    Java: existsSync('./gradlew')
      ? './gradlew build --no-daemon'
      : 'gradle build',
    PHP: 'composer install',
    Python: 'pip install -r requirements.txt',
    Go: 'go mod download',
    Rust: 'cargo fetch',
  };

  const command = commands[answers.language];
  if (command) {
    try {
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      console.log('   ✅ 依存関係のインストール完了');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  依存関係インストール失敗: ${message}`);
      console.warn(
        '   💡 プロジェクト初期化後に手動でインストールしてください',
      );
    }
  }
}

/**
 * spec.jsonを更新
 */
async function updateEnvironmentSpecJson(
  feature: string,
  answers: { language: string; ciTool: string; needsDocker: boolean },
  errors: string[]
) {
  const specPath = join(process.cwd(), '.kiro', 'specs', feature, 'spec.json');
  if (!existsSync(specPath)) {
    return;
  }

  try {
    const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
    spec.environmentSetup = {
      completed: true,
      language: answers.language,
      ciTool: answers.ciTool,
      dockerCompose: answers.needsDocker,
      completedAt: new Date().toISOString(),
    };
    spec.lastUpdated = new Date().toISOString();
    writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log('\n✅ spec.jsonを更新しました');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`spec.json更新失敗: ${message}`);
    console.warn(`⚠️  spec.json更新失敗: ${message}`);
  }
}

/**
 * 環境構築のサマリーを表示
 */
function displayEnvironmentSummary(
  feature: string,
  answers: { language: string; ciTool: string; needsDocker: boolean }
) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 環境構築完了:');
  console.log(`   言語: ${answers.language}`);
  console.log(`   CI/CD: ${answers.ciTool}`);
  console.log(`   Docker Compose: ${answers.needsDocker ? 'あり' : 'なし'}`);

  console.log('\n📖 次のステップ:');
  console.log('   1. Phase 2: TDD実装へ進む');
  console.log(`      /kiro:spec-impl ${feature}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Phase 1: 環境構築が完了しました');
}

/**
 * 環境構築フェーズを実行（Phase 1）
 * 対話的に環境を構築し、必要な設定ファイルを生成
 */
async function runEnvironmentSetupPhase(
  feature: string,
): Promise<PhaseRunResult> {
  console.log('\n⚙️  Phase 1: Environment Setup（環境構築）');
  console.log('='.repeat(60));

  const errors: string[] = [];

  // プロジェクト検出と分析
  const { detected, languageAnalysis, dockerAnalysis } = await detectAndAnalyzeProject(feature);

  // 対話的質問の収集
  const answers = await collectEnvironmentAnswers(detected, languageAnalysis, dockerAnalysis);

  // 設定ファイル生成
  await generateEnvironmentConfigs(feature, answers, errors);

  // 依存関係インストール
  await installDependencies(answers, detected);

  // spec.json更新
  await updateEnvironmentSpecJson(feature, answers, errors);

  // サマリー表示
  displayEnvironmentSummary(feature, answers);

  return {
    phase: 'environment-setup' as Phase,
    success: errors.length === 0,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors,
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

  // spec.jsonから言語を読み取る
  const spec = loadSpecJson(feature);
  const language = spec.environmentSetup?.language || 'Node.js/TypeScript';
  const commands = getTestCommands(language);

  console.log('\n📚 このフェーズはCI/CD自動実行です');
  console.log('PR作成時に以下のテストが自動実行されます:\n');

  console.log('自動実行テスト:');
  console.log(`  - 単体テスト (${commands.test})`);
  console.log(`  - Lint実行 (${commands.lint})`);
  console.log(`  - ビルド実行 (${commands.build})\n`);

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
    errors,
  };
}

/**
 * Phase B対象のテストタイプを読み込み
 */
function loadPhaseBTestTypes(feature: string): string[] {
  const selectionPath = join(
    process.cwd(),
    '.kiro',
    'specs',
    feature,
    'test-type-selection.json',
  );

  let selectedTypes: string[] = [];
  if (existsSync(selectionPath)) {
    try {
      const selection = JSON.parse(readFileSync(selectionPath, 'utf-8'));
      selectedTypes = selection.selectedTypes || [];
      console.log(`\n✅ 選択されたテストタイプ: ${selectedTypes.join(', ')}`);
    } catch {
      console.warn('⚠️  test-type-selection.jsonの読み込みに失敗しました');
    }
  } else {
    console.log('\n⚠️  test-type-selection.jsonが存在しません');
    console.log('   デフォルトのテストタイプを使用します');
    selectedTypes = [
      'unit',
      'lint',
      'build',
      'integration',
      'performance',
      'security',
    ];
  }

  // Phase B対象のテストタイプを抽出（Phase Aのテストを除外）
  const phaseBTypes = selectedTypes.filter(
    (t) => !['unit', 'lint', 'build'].includes(t),
  );

  if (phaseBTypes.length > 0) {
    console.log(`\n📝 Phase B対象テスト: ${phaseBTypes.join(', ')}`);
  }

  return phaseBTypes;
}

/**
 * Phase Bのテスト実行ファイルを生成
 */
async function generatePhaseBTestFiles(
  feature: string,
  phaseBTypes: string[]
): Promise<{ generatedFiles: string[]; errors: string[] }> {
  const generatedFiles: string[] = [];
  const errors: string[] = [];

  if (phaseBTypes.length === 0) {
    return { generatedFiles, errors };
  }

  console.log('\n🤖 テスト実行ファイルを自動生成中...');

  const { generateTestExecution } = await import(
    './test-execution-generator.js'
  );

  for (const testType of phaseBTypes) {
    try {
      const result = await generateTestExecution(feature, testType);

      if (result.success) {
        console.log(
          `   ✅ ${result.testType}: ${result.files.length}ファイル生成`,
        );
        generatedFiles.push(...result.files);
      } else {
        console.error(`   ❌ ${result.testType}: ${result.error}`);
        errors.push(`${result.testType}テスト生成失敗: ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${testType}テスト生成失敗: ${message}`);
      console.error(`❌ ${testType}テスト生成失敗:`, message);
    }
  }

  return { generatedFiles, errors };
}

/**
 * Phase Bのチェックリストとサマリーを表示
 */
function displayPhaseBChecklist(
  feature: string,
  phaseBTypes: string[],
  generatedFiles: string[],
  errors: string[]
): void {
  // 生成されたファイルのサマリー
  const testExecutionDir = join(
    process.cwd(),
    '.kiro',
    'specs',
    feature,
    'test-execution',
  );
  if (generatedFiles.length > 0) {
    console.log('\n📄 生成されたファイル:');
    generatedFiles.forEach((file) => {
      const relativePath = relative(testExecutionDir, file);
      console.log(`   - ${relativePath}`);
    });
  }

  // チェックリスト表示
  console.log('\n' + '='.repeat(60));
  console.log('📋 リリース準備テストチェックリスト:\n');

  if (phaseBTypes.includes('performance')) {
    console.log('  [ ] 性能テスト実行');
    console.log(`      📁 .kiro/specs/${feature}/test-execution/performance/`);
    console.log('      📖 詳細はディレクトリ内のREADME/計画書を参照');
  }

  if (phaseBTypes.includes('security')) {
    console.log('  [ ] セキュリティテスト実行');
    console.log(`      📁 .kiro/specs/${feature}/test-execution/security/`);
    console.log('      📖 詳細はディレクトリ内のREADME/計画書を参照');
  }

  if (phaseBTypes.includes('integration')) {
    console.log('  [ ] 統合テスト実行');
    console.log(`      📁 .kiro/specs/${feature}/test-execution/integration/`);
  }

  if (phaseBTypes.includes('e2e')) {
    console.log('  [ ] E2Eテスト実行');
    console.log(`      📁 .kiro/specs/${feature}/test-execution/e2e/`);
  }

  console.log('\n参考ドキュメント:');
  console.log(`  - .kiro/specs/${feature}/test-specs/ (テスト仕様書)`);
  console.log('  - docs/user-guide/testing/test-execution-flow.md');

  console.log('\n次のステップ:');
  console.log('  1. 生成されたテストファイルを確認・編集');
  console.log('  2. 各テストを実行');
  console.log('  3. テスト結果をドキュメント化');
  console.log('  4. Phase 4: リリース準備へ進む');

  console.log('\n' + '='.repeat(60));
  const success = errors.length === 0;
  if (success) {
    console.log('✅ Phase B: テスト実行ファイル生成が完了しました');
    console.log('📢 テストを実行してPhase 4に進んでください');
  } else {
    console.log('⚠️  Phase B: テスト実行ファイル生成が部分的に完了しました');
    console.log(`❌ ${errors.length}件のエラーが発生しています`);
    errors.forEach((err) => console.log(`   - ${err}`));
    console.log('📢 エラーを修正してから再実行してください');
  }
}

/**
 * リリース準備テストフェーズを実行（Phase B）
 * テスト実行ファイルを自動生成し、手動テストチェックリストを表示
 */
async function runPhaseBPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🔍 Phase B: リリース準備テスト（Release Tests）');
  console.log('='.repeat(60));

  // Phase B対象のテストタイプを読み込み
  const phaseBTypes = loadPhaseBTestTypes(feature);

  // テスト実行ファイルを生成
  const { generatedFiles, errors } = await generatePhaseBTestFiles(
    feature,
    phaseBTypes,
  );

  // チェックリストとサマリーを表示
  displayPhaseBChecklist(feature, phaseBTypes, generatedFiles, errors);

  return {
    phase: 'phase-b' as Phase,
    success: errors.length === 0,
    confluenceCreated: false,
    jiraCreated: false,
    validationPassed: true,
    errors,
  };
}

/**
 * フェーズを実行
 */
export async function runPhase(
  feature: string,
  phase: Phase,
): Promise<PhaseRunResult> {
  // feature名のバリデーション（必須）
  validateFeatureNameOrThrow(feature);

  switch (phase) {
  case 'requirements':
    return await runRequirementsPhase(feature);
  case 'design':
    return await runDesignPhase(feature);
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
    'phase-b',
  ];

  if (!validPhases.includes(phase)) {
    console.error(`Invalid phase: ${phase}`);
    console.error(
      'Must be one of: requirements, design, tasks, environment-setup, phase-a, phase-b',
    );
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
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ フェーズ実行エラー: ${message}`);
      process.exit(1);
    });
}
