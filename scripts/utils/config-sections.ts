/**
 * 設定セクションの対話的取得関数
 */

import type * as readline from 'readline';
import { select, confirm, question, multiSelect } from './interactive-helpers.js';
import type { ProjectMetadata } from './project-meta.js';

/**
 * Confluence階層設定
 */
export interface ConfluenceHierarchyConfig {
  mode?: 'simple' | 'nested';
  parentPageTitle?: string;
  structure?: unknown;
}

/**
 * Confluence設定結果
 */
export interface ConfluenceConfigResult {
  pageCreationGranularity: string;
  pageTitleFormat?: string;
  hierarchy?: ConfluenceHierarchyConfig;
}

/**
 * JIRA設定結果
 */
export interface JiraConfigResult {
  createEpic: boolean;
  storyCreationGranularity: string;
  selectedPhases?: string[];
  storyPoints: string;
}

/**
 * ワークフロー設定結果
 */
export interface WorkflowConfigResult {
  enabledPhases: string[];
  approvalGates?: {
    requirements?: string[];
    design?: string[];
    release?: string[];
  };
}

/**
 * Confluence設定を対話的に取得
 */
export async function getConfluenceConfig(
  rl: readline.Interface,
  _projectMeta?: ProjectMetadata,
): Promise<ConfluenceConfigResult> {
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

  const config: ConfluenceConfigResult = {
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

      config.hierarchy.mode = mode as 'simple' | 'nested';
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
export async function getJiraConfig(rl: readline.Interface): Promise<JiraConfigResult> {
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

  const config: JiraConfigResult = {
    createEpic,
    storyCreationGranularity: granularity,
    storyPoints: 'auto',  // デフォルト値（後で上書きされる）
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
export async function getWorkflowConfig(rl: readline.Interface): Promise<WorkflowConfigResult> {
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

  const config: WorkflowConfigResult = {
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
