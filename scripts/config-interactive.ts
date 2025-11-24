/**
 * 対話式設定ツール
 * .michi/config.json を対話的に作成・更新
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as readline from 'readline';
import { loadProjectMeta } from './utils/project-meta.js';
import { validateProjectConfig } from './utils/config-validator.js';

/**
 * readlineインターフェースを作成
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 質問を表示して回答を取得
 */
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 選択肢から選択
 */
async function select(
  rl: readline.Interface,
  prompt: string,
  choices: Array<{ value: string; label: string; description?: string }>,
  defaultValue?: string,
  maxRetries: number = 3,
): Promise<string> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const defaultMark = defaultValue === choice.value ? ' (デフォルト)' : '';
    const desc = choice.description ? ` - ${choice.description}` : '';
    console.log(`  ${index + 1}. ${choice.label}${desc}${defaultMark}`);
  });

  const answer = await question(
    rl,
    `\n選択してください [1-${choices.length}]: `,
  );

  if (!answer && defaultValue) {
    return defaultValue;
  }

  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < choices.length) {
    return choices[index].value;
  }

  if (defaultValue) {
    return defaultValue;
  }

  // 無効な入力の場合は再試行（最大試行回数まで）
  if (maxRetries > 0) {
    console.log(
      `⚠️  無効な選択です。もう一度入力してください（残り試行回数: ${maxRetries}）。`,
    );
    return select(rl, prompt, choices, defaultValue, maxRetries - 1);
  }

  // 最大試行回数に達した場合はデフォルト値または最初の選択肢を返す
  console.log(
    `⚠️  最大試行回数に達しました。デフォルト値を使用します: ${defaultValue || choices[0].value}`,
  );
  return defaultValue || choices[0].value;
}

/**
 * Yes/No質問
 */
async function confirm(
  rl: readline.Interface,
  prompt: string,
  defaultValue: boolean = true,
): Promise<boolean> {
  const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await question(rl, `${prompt} ${defaultText}: `);

  if (!answer) {
    return defaultValue;
  }

  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * 複数選択
 */
async function multiSelect(
  rl: readline.Interface,
  prompt: string,
  choices: Array<{ value: string; label: string }>,
  defaults: string[] = [],
): Promise<string[]> {
  console.log(`\n${prompt}`);
  choices.forEach((choice, index) => {
    const checked = defaults.includes(choice.value) ? '[x]' : '[ ]';
    console.log(`  ${checked} ${index + 1}. ${choice.label}`);
  });

  const answer = await question(
    rl,
    '\n選択してください（カンマ区切り、例: 1,2,3）: ',
  );

  if (!answer && defaults.length > 0) {
    return defaults;
  }

  if (!answer) {
    return [];
  }

  const indices = answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < choices.length);
  return indices.map((i) => choices[i].value);
}

/**
 * Confluence設定を対話的に取得
 */
async function getConfluenceConfig(
  rl: readline.Interface,
  _projectMeta: any,
): Promise<any> {
  console.log('\n📄 Confluence設定');
  console.log('='.repeat(60));

  const granularityChoices = [
    {
      value: 'single',
      label: 'single（1ドキュメント = 1ページ）',
      description: 'デフォルト・現在の動作',
    },
    {
      value: 'by-section',
      label: 'by-section（セクションごとにページ分割）',
      description: '## セクションごとにページを作成',
    },
    {
      value: 'by-hierarchy',
      label: 'by-hierarchy（階層構造）',
      description: '親ページ + 子ページの階層構造',
    },
    {
      value: 'manual',
      label: 'manual（手動指定）',
      description: '設定ファイルで明示的に指定',
    },
  ];

  const granularity = await select(
    rl,
    'ページ作成粒度を選択してください:',
    granularityChoices,
    'single',
  );

  const config: any = {
    pageCreationGranularity: granularity,
  };

  // タイトル形式のカスタマイズ
  const customTitle = await confirm(
    rl,
    'ページタイトル形式をカスタマイズしますか？',
    false,
  );

  if (customTitle) {
    const titleFormat = await question(
      rl,
      'タイトル形式を入力してください（例: {projectName} - {featureName}）: ',
    );
    if (titleFormat) {
      config.pageTitleFormat = titleFormat;
    }
  }

  // 階層構造設定
  if (granularity === 'by-hierarchy' || granularity === 'manual') {
    config.hierarchy = {};

    if (granularity === 'by-hierarchy') {
      const modeChoices = [
        {
          value: 'simple',
          label: 'simple（親ページ + ドキュメントタイプ子ページ）',
          description: '2階層構造',
        },
        {
          value: 'nested',
          label:
            'nested（親ページ → ドキュメントタイプ親 → セクション子ページ）',
          description: '3階層構造',
        },
      ];

      const mode = await select(
        rl,
        '階層構造のモードを選択してください:',
        modeChoices,
        'simple',
      );

      config.hierarchy.mode = mode;
    }

    const parentTitle = await question(
      rl,
      '親ページのタイトル形式を入力してください（例: [{projectName}] {featureName}）: ',
    );

    if (parentTitle) {
      config.hierarchy.parentPageTitle = parentTitle;
    } else {
      config.hierarchy.parentPageTitle = '[{projectName}] {featureName}';
    }

    if (granularity === 'manual') {
      console.log(
        '\n⚠️  manualモードでは、設定ファイルを手動で編集する必要があります。',
      );
      console.log(
        '   hierarchy.structure に各ドキュメントタイプのページ構造を定義してください。',
      );
    }
  }

  return config;
}

/**
 * JIRA設定を対話的に取得
 */
async function getJiraConfig(rl: readline.Interface): Promise<any> {
  console.log('\n📋 JIRA設定');
  console.log('='.repeat(60));

  const createEpic = await confirm(rl, 'Epicを作成しますか？', true);

  const granularityChoices = [
    {
      value: 'all',
      label: 'all（全Storyを作成）',
      description: 'デフォルト',
    },
    {
      value: 'by-phase',
      label: 'by-phase（フェーズごとに作成）',
      description: 'フェーズごとに個別に作成',
    },
    {
      value: 'selected-phases',
      label: 'selected-phases（指定フェーズのみ）',
      description: '選択したフェーズのみ作成',
    },
  ];

  const granularity = await select(
    rl,
    'Story作成粒度を選択してください:',
    granularityChoices,
    'all',
  );

  const config: any = {
    createEpic,
    storyCreationGranularity: granularity,
  };

  if (granularity === 'selected-phases') {
    const phaseChoices = [
      // 新ワークフロー構造
      { value: 'spec-init', label: 'Phase 0.0: プロジェクト初期化' },
      { value: 'requirements', label: 'Phase 0.1: 要件定義（Requirements）' },
      { value: 'design', label: 'Phase 0.2: 設計（Design）' },
      { value: 'test-type-selection', label: 'Phase 0.3: テストタイプ選択' },
      { value: 'test-spec', label: 'Phase 0.4: テスト仕様書作成' },
      { value: 'spec-tasks', label: 'Phase 0.5: タスク分割' },
      { value: 'environment-setup', label: 'Phase 1: 環境構築' },
      { value: 'implementation', label: 'Phase 2: TDD実装（Implementation）' },
      { value: 'phase-a', label: 'Phase A: PR前自動テスト' },
      { value: 'testing', label: 'Phase 3: 追加QA（Testing）' },
      { value: 'phase-b', label: 'Phase B: リリース準備テスト' },
      { value: 'release-prep', label: 'Phase 4: リリース準備（Release Preparation）' },
      { value: 'release', label: 'Phase 5: リリース（Release）' },
    ];

    const selectedPhases = await multiSelect(
      rl,
      '作成するフェーズを選択してください:',
      phaseChoices,
      ['implementation', 'testing'],
    );

    config.selectedPhases = selectedPhases;
  }

  const storyPointsChoices = [
    { value: 'auto', label: 'auto（自動抽出）', description: 'デフォルト' },
    { value: 'manual', label: 'manual（手動設定）' },
    { value: 'disabled', label: 'disabled（設定しない）' },
  ];

  const storyPoints = await select(
    rl,
    'Story Points設定を選択してください:',
    storyPointsChoices,
    'auto',
  );

  config.storyPoints = storyPoints;

  return config;
}

/**
 * ワークフロー設定を対話的に取得
 */
async function getWorkflowConfig(rl: readline.Interface): Promise<any> {
  console.log('\n⚙️  ワークフロー設定');
  console.log('='.repeat(60));

  const phaseChoices = [
    { value: 'requirements', label: '要件定義（Requirements）' },
    { value: 'design', label: '設計（Design）' },
    { value: 'tasks', label: 'タスク分割（Tasks）' },
  ];

  const enabledPhases = await multiSelect(
    rl,
    '有効化するフェーズを選択してください:',
    phaseChoices,
    ['requirements', 'design', 'tasks'],
  );

  const config: any = {
    enabledPhases,
  };

  const customApprovalGates = await confirm(
    rl,
    '承認ゲートをカスタマイズしますか？',
    false,
  );

  if (customApprovalGates) {
    config.approvalGates = {};

    if (enabledPhases.includes('requirements')) {
      const approvers = await question(
        rl,
        '要件定義フェーズの承認者（カンマ区切り、例: pm,director）: ',
      );
      if (approvers) {
        config.approvalGates.requirements = approvers
          .split(',')
          .map((s) => s.trim());
      }
    }

    if (enabledPhases.includes('design')) {
      const approvers = await question(
        rl,
        '設計フェーズの承認者（カンマ区切り、例: architect,director）: ',
      );
      if (approvers) {
        config.approvalGates.design = approvers.split(',').map((s) => s.trim());
      }
    }

    const releaseApprovers = await question(
      rl,
      'リリースフェーズの承認者（カンマ区切り、例: sm,director）: ',
    );
    if (releaseApprovers) {
      config.approvalGates.release = releaseApprovers
        .split(',')
        .map((s) => s.trim());
    }
  }

  return config;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  const rl = createInterface();

  try {
    console.log('🎨 Michi カスタマイズ設定ツール');
    console.log('='.repeat(60));
    console.log('このツールで .michi/config.json を作成・更新できます。\n');

    // プロジェクトメタデータを読み込み
    let projectMeta;
    try {
      projectMeta = loadProjectMeta();
      console.log(
        `📦 プロジェクト: ${projectMeta.projectName} (${projectMeta.projectId})\n`,
      );
    } catch {
      console.error('❌ プロジェクトメタデータが見つかりません。');
      console.error('   .kiro/project.json が存在するか確認してください。');
      process.exit(1);
    }

    // 既存の設定ファイルを確認
    const { getConfigPath } = await import('./utils/config-loader.js');
    const configPath = getConfigPath();
    let existingConfig: any = null;

    if (existsSync(configPath)) {
      console.log('⚠️  既存の設定ファイルが見つかりました。');
      const overwrite = await confirm(rl, '上書きしますか？', false);

      if (!overwrite) {
        console.log('中止しました。');
        process.exit(0);
      }

      try {
        const content = readFileSync(configPath, 'utf-8');
        existingConfig = JSON.parse(content);
        console.log('既存の設定を読み込みました。\n');
      } catch {
        console.log(
          '既存の設定ファイルの読み込みに失敗しました。新規作成します。\n',
        );
      }
    }

    // 設定を対話的に取得
    const config: any = existingConfig || {};

    // Confluence設定
    const configureConfluence = await confirm(
      rl,
      'Confluence設定をカスタマイズしますか？',
      false,
    );
    if (configureConfluence) {
      config.confluence = await getConfluenceConfig(rl, projectMeta);
    }

    // JIRA設定
    const configureJira = await confirm(
      rl,
      'JIRA設定をカスタマイズしますか？',
      false,
    );
    if (configureJira) {
      config.jira = await getJiraConfig(rl);
    }

    // ワークフロー設定
    const configureWorkflow = await confirm(
      rl,
      'ワークフロー設定をカスタマイズしますか？',
      false,
    );
    if (configureWorkflow) {
      config.workflow = await getWorkflowConfig(rl);
    }

    // 設定の確認
    console.log('\n📋 設定内容の確認');
    console.log('='.repeat(60));
    console.log(JSON.stringify(config, null, 2));
    console.log('');

    const confirmSave = await confirm(rl, 'この設定を保存しますか？', true);

    if (!confirmSave) {
      console.log('保存をキャンセルしました。');
      process.exit(0);
    }

    // 設定ファイルを保存
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    console.log(`\n✅ 設定ファイルを保存しました: ${configPath}`);

    // バリデーション
    console.log('\n🔍 設定ファイルのバリデーション...');
    const validation = validateProjectConfig();

    if (validation.info.length > 0) {
      console.log('ℹ️  Info:');
      validation.info.forEach((msg) => console.log(`   - ${msg}`));
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (validation.errors.length > 0) {
      console.error('❌ Validation errors:');
      validation.errors.forEach((error) => console.error(`   - ${error}`));
      console.error(
        '\n設定ファイルにエラーがあります。手動で修正してください。',
      );
      process.exit(1);
    }

    if (validation.valid) {
      console.log('✅ 設定ファイルは有効です。');
    }

    console.log('\n🎉 設定が完了しました！');
    console.log('   次回のConfluence/JIRA同期時に、この設定が適用されます。');
  } catch (error) {
    console.error(
      '❌ エラーが発生しました:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    rl.close();
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { main as configInteractive };
