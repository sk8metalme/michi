/**
 * テスト仕様書生成エンジン
 * requirements.mdとdesign.mdからテスト仕様書を自動生成
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  extractComponents,
  extractFlows,
  extractRequirements,
  type Component,
  type Flow,
  type Requirement
} from './utils/markdown-parser.js';
import {
  loadTestSpecTemplate,
  applyTemplate,
  type TestCase,
  type TemplateData
} from './utils/template-applier.js';

/**
 * 単体テスト仕様書を生成
 */
export async function generateUnitTestSpec(feature: string, projectRoot: string = process.cwd()): Promise<string> {
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
  
  if (!existsSync(designPath)) {
    throw new Error(`design.mdが見つかりません: ${designPath}`);
  }
  
  const designMd = readFileSync(designPath, 'utf-8');
  const components = extractComponents(designMd);
  
  // 各コンポーネントのメソッドから単体テストケースを生成
  const testCases: TestCase[] = [];
  let tcCounter = 1;
  
  for (const component of components) {
    for (const method of component.methods) {
      // 正常系テストケース
      testCases.push({
        id: `UT-${String(tcCounter++).padStart(3, '0')}`,
        name: `${component.name}.${method.name} - 正常系`,
        description: `${component.name}の${method.name}メソッドが正常に動作することを確認`,
        preconditions: [
          `${component.name}が初期化されている`,
          '有効な入力パラメータが準備されている'
        ],
        steps: [
          `有効なパラメータで${method.name}()を呼び出す`,
          '戻り値を確認する',
          'エラーが発生しないことを確認する'
        ],
        expectedResults: [
          `期待される${method.returnType}型の値が返される`,
          '例外が発生しない'
        ],
        type: 'normal'
      });
      
      // 異常系テストケース: null/undefined
      if (method.parameters.length > 0) {
        testCases.push({
          id: `UT-${String(tcCounter++).padStart(3, '0')}`,
          name: `${component.name}.${method.name} - 異常系（null入力）`,
          description: `null入力時に適切なエラーハンドリングが行われることを確認`,
          preconditions: [
            `${component.name}が初期化されている`
          ],
          steps: [
            `${method.parameters[0].name}にnullを渡して${method.name}()を呼び出す`,
            'エラーが発生することを確認する'
          ],
          expectedResults: [
            '適切なエラーメッセージが表示される',
            'システムがクラッシュしない'
          ],
          type: 'error'
        });
      }
      
      // エッジケーステストケース
      if (method.parameters.some(p => p.type.includes('string'))) {
        testCases.push({
          id: `UT-${String(tcCounter++).padStart(3, '0')}`,
          name: `${component.name}.${method.name} - エッジケース（空文字列）`,
          description: `空文字列入力時の動作を確認`,
          preconditions: [
            `${component.name}が初期化されている`
          ],
          steps: [
            '空文字列を渡して${method.name}()を呼び出す',
            '戻り値またはエラーを確認する'
          ],
          expectedResults: [
            'バリデーションエラーが発生する、または適切なデフォルト値が返される'
          ],
          type: 'edge'
        });
      }
    }
  }
  
  const templateData: TemplateData = {
    feature,
    testType: 'unit',
    date: new Date().toISOString().split('T')[0],
    purpose: `${feature}の各コンポーネントが独立して正常に動作することを確認する`,
    scope: `${feature}の全コンポーネント（${components.map(c => c.name).join(', ')}）`,
    testCases,
    components
  };
  
  const template = loadTestSpecTemplate('unit', projectRoot);
  return applyTemplate(template, templateData);
}

/**
 * 統合テスト仕様書を生成
 */
export async function generateIntegrationTestSpec(feature: string, projectRoot: string = process.cwd()): Promise<string> {
  const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
  
  if (!existsSync(designPath)) {
    throw new Error(`design.mdが見つかりません: ${designPath}`);
  }
  
  const designMd = readFileSync(designPath, 'utf-8');
  const flows = extractFlows(designMd);
  const components = extractComponents(designMd);
  
  // システムフローから統合テストケースを生成
  const testCases: TestCase[] = [];
  let tcCounter = 1;
  
  for (const flow of flows) {
    // 成功フローテストケース
    testCases.push({
      id: `IT-${String(tcCounter++).padStart(3, '0')}`,
      name: `${flow.name} - 成功フロー`,
      description: `${flow.name}が正常に完了することを確認`,
      preconditions: [
        'すべての依存コンポーネントが起動している',
        'テストデータが準備されている'
      ],
      steps: [
        'フローを開始する',
        '各ステップが順番に実行されることを確認する',
        '最終結果が正しく返されることを確認する'
      ],
      expectedResults: [
        'フローが正常に完了する',
        '中間データが各コンポーネント間で正しく渡される',
        '最終的な状態が期待通りになる'
      ],
      type: 'normal'
    });
    
    // 失敗フローテストケース
    testCases.push({
      id: `IT-${String(tcCounter++).padStart(3, '0')}`,
      name: `${flow.name} - 失敗フロー`,
      description: `エラー発生時に適切にハンドリングされることを確認`,
      preconditions: [
        'すべての依存コンポーネントが起動している'
      ],
      steps: [
        'エラーを発生させる条件でフローを開始する',
        'エラーハンドリングが実行されることを確認する',
        'システムが安全な状態に戻ることを確認する'
      ],
      expectedResults: [
        '適切なエラーメッセージが表示される',
        'データの整合性が保たれる',
        'リソースがクリーンアップされる'
      ],
      type: 'error'
    });
  }
  
  const templateData: TemplateData = {
    feature,
    testType: 'integration',
    date: new Date().toISOString().split('T')[0],
    purpose: `${feature}の複数コンポーネント間の連携が正常に動作することを確認する`,
    scope: `${feature}のシステムフロー（${flows.map(f => f.name).join(', ')}）`,
    testCases,
    flows,
    components
  };
  
  const template = loadTestSpecTemplate('integration', projectRoot);
  return applyTemplate(template, templateData);
}

/**
 * E2Eテスト仕様書を生成
 */
export async function generateE2ETestSpec(feature: string, projectRoot: string = process.cwd()): Promise<string> {
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  
  if (!existsSync(requirementsPath)) {
    throw new Error(`requirements.mdが見つかりません: ${requirementsPath}`);
  }
  
  const requirementsMd = readFileSync(requirementsPath, 'utf-8');
  const requirements = extractRequirements(requirementsMd);
  
  // 要件からE2Eテストケースを生成
  const testCases: TestCase[] = [];
  let tcCounter = 1;
  
  for (const req of requirements) {
    // 機能要件のみを対象（NFRはスキップ）
    if (req.id.startsWith('NFR')) {
      continue;
    }
    
    // ハッピーパステストケース
    testCases.push({
      id: `E2E-${String(tcCounter++).padStart(3, '0')}`,
      name: `${req.title} - ハッピーパス`,
      description: `${req.objective}が達成できることをエンドツーエンドで確認`,
      preconditions: [
        'アプリケーションが起動している',
        'テストユーザーが作成されている',
        'テストデータが準備されている'
      ],
      steps: req.acceptanceCriteria.slice(0, 3).map((ac, idx) => 
        `${ac.substring(0, 100)}...を実行`
      ),
      expectedResults: req.acceptanceCriteria.map(ac => 
        ac.replace(/^(When|If|While|Where|The)\s+/, '').substring(0, 100)
      ).slice(0, 3),
      type: 'normal'
    });
    
    // エラーフローテストケース
    if (req.acceptanceCriteria.some(ac => ac.includes('If') || ac.includes('error'))) {
      testCases.push({
        id: `E2E-${String(tcCounter++).padStart(3, '0')}`,
        name: `${req.title} - エラーフロー`,
        description: `エラー発生時に適切にハンドリングされることを確認`,
        preconditions: [
          'アプリケーションが起動している'
        ],
        steps: [
          '無効な入力でフローを開始する',
          'エラーメッセージが表示されることを確認する',
          'ユーザーが回復できることを確認する'
        ],
        expectedResults: [
          '適切なエラーメッセージが表示される',
          'ユーザーが操作を継続できる',
          'データの整合性が保たれる'
        ],
        type: 'error'
      });
    }
  }
  
  const templateData: TemplateData = {
    feature,
    testType: 'e2e',
    date: new Date().toISOString().split('T')[0],
    purpose: `${feature}のエンドユーザーシナリオが完全に動作することを確認する`,
    scope: `${feature}の全ユーザーフロー`,
    testCases,
    requirements
  };
  
  const template = loadTestSpecTemplate('e2e', projectRoot);
  return applyTemplate(template, templateData);
}

/**
 * パフォーマンステスト仕様書を生成
 */
export async function generatePerformanceTestSpec(feature: string, projectRoot: string = process.cwd()): Promise<string> {
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  
  if (!existsSync(requirementsPath)) {
    throw new Error(`requirements.mdが見つかりません: ${requirementsPath}`);
  }
  
  const requirementsMd = readFileSync(requirementsPath, 'utf-8');
  const requirements = extractRequirements(requirementsMd);
  
  // NFR-1（パフォーマンス要件）からテストケースを生成
  const testCases: TestCase[] = [];
  let tcCounter = 1;
  
  const perfReq = requirements.find(r => r.title.includes('パフォーマンス') || r.id === 'NFR-1');
  
  if (perfReq) {
    // 応答時間テスト
    testCases.push({
      id: `PERF-${String(tcCounter++).padStart(3, '0')}`,
      name: '応答時間テスト - 通常負荷',
      description: '通常負荷時の応答時間が要件を満たすことを確認',
      preconditions: [
        'テスト環境が起動している',
        '通常のデータ量が準備されている'
      ],
      steps: [
        '主要な操作を実行する',
        '応答時間を測定する',
          '要件と比較する'
      ],
      expectedResults: perfReq.acceptanceCriteria.filter(ac => 
        ac.includes('秒以内') || ac.includes('以内に')
      ).slice(0, 2),
      type: 'normal'
    });
    
    // スループットテスト
    testCases.push({
      id: `PERF-${String(tcCounter++).padStart(3, '0')}`,
      name: 'スループットテスト - ピーク負荷',
      description: 'ピーク負荷時のスループットが要件を満たすことを確認',
      preconditions: [
        'テスト環境が起動している',
        '負荷生成ツールが準備されている'
      ],
      steps: [
        'ピーク負荷（想定の150%）を生成する',
        'スループットを測定する',
        'エラー率を確認する'
      ],
      expectedResults: [
        'システムがクラッシュしない',
        'エラー率が5%以下',
        '応答時間の劣化が許容範囲内'
      ],
      type: 'edge'
    });
    
    // 大量データテスト
    if (perfReq.acceptanceCriteria.some(ac => ac.includes('件') || ac.includes('以上'))) {
      testCases.push({
        id: `PERF-${String(tcCounter++).padStart(3, '0')}`,
        name: '大量データ処理テスト',
        description: '大量データ処理時のパフォーマンスを確認',
        preconditions: [
          'テスト環境が起動している',
          '大量のテストデータ（1000件以上）が準備されている'
        ],
        steps: [
          '大量データの読み込みを実行する',
          '処理時間を測定する',
          'メモリ使用量を確認する'
        ],
        expectedResults: perfReq.acceptanceCriteria.filter(ac => 
          ac.includes('件') || ac.includes('以上')
        ),
        type: 'edge'
      });
    }
  } else {
    // パフォーマンス要件がない場合のデフォルトテストケース
    testCases.push({
      id: `PERF-${String(tcCounter++).padStart(3, '0')}`,
      name: '基本的な応答時間テスト',
      description: '主要な操作の応答時間を測定',
      preconditions: ['テスト環境が起動している'],
      steps: [
        '主要な操作を実行する',
        '応答時間を測定する'
      ],
      expectedResults: [
        '応答時間が3秒以内（一般的な基準）'
      ],
      type: 'normal'
    });
  }
  
  const templateData: TemplateData = {
    feature,
    testType: 'performance',
    date: new Date().toISOString().split('T')[0],
    purpose: `${feature}のパフォーマンスが要件を満たすことを確認する`,
    scope: `${feature}の主要な処理のパフォーマンス`,
    testCases,
    requirements
  };
  
  const template = loadTestSpecTemplate('performance', projectRoot);
  return applyTemplate(template, templateData);
}

/**
 * セキュリティテスト仕様書を生成
 */
export async function generateSecurityTestSpec(feature: string, projectRoot: string = process.cwd()): Promise<string> {
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  
  if (!existsSync(requirementsPath)) {
    throw new Error(`requirements.mdが見つかりません: ${requirementsPath}`);
  }
  
  const requirementsMd = readFileSync(requirementsPath, 'utf-8');
  const requirements = extractRequirements(requirementsMd);
  
  // NFR-3（セキュリティ要件）からテストケースを生成
  const testCases: TestCase[] = [];
  let tcCounter = 1;
  
  const secReq = requirements.find(r => r.title.includes('セキュリティ') || r.id === 'NFR-3');
  
  if (secReq) {
    // 権限チェックテスト
    if (secReq.acceptanceCriteria.some(ac => ac.includes('権限') || ac.includes('アクセス'))) {
      testCases.push({
        id: `SEC-${String(tcCounter++).padStart(3, '0')}`,
        name: '権限チェックテスト',
        description: '適切な権限チェックが実施されることを確認',
        preconditions: [
          'テストユーザーが作成されている（権限あり/なし）'
        ],
        steps: [
          '権限のないユーザーでアクセスを試行する',
          'アクセスが拒否されることを確認する',
          '権限のあるユーザーでアクセスを試行する',
          'アクセスが許可されることを確認する'
        ],
        expectedResults: secReq.acceptanceCriteria.filter(ac => 
          ac.includes('権限') || ac.includes('アクセス')
        ),
        type: 'normal'
      });
    }
    
    // データ暗号化テスト
    if (secReq.acceptanceCriteria.some(ac => ac.includes('暗号化'))) {
      testCases.push({
        id: `SEC-${String(tcCounter++).padStart(3, '0')}`,
        name: 'データ暗号化テスト',
        description: 'データが適切に暗号化されることを確認',
        preconditions: [
          'テスト環境が起動している',
          '暗号化対象のデータが準備されている'
        ],
        steps: [
          'データを保存する',
          '保存されたデータを直接確認する',
          '暗号化されていることを確認する',
          'データを読み込む',
          '復号化されたデータが正しいことを確認する'
        ],
        expectedResults: secReq.acceptanceCriteria.filter(ac => 
          ac.includes('暗号化')
        ),
        type: 'normal'
      });
    }
    
    // 改ざん検出テスト
    if (secReq.acceptanceCriteria.some(ac => ac.includes('改ざん'))) {
      testCases.push({
        id: `SEC-${String(tcCounter++).padStart(3, '0')}`,
        name: 'データ改ざん検出テスト',
        description: 'データの改ざんが検出されることを確認',
        preconditions: [
          'テスト環境が起動している',
          'データが保存されている'
        ],
        steps: [
          'データを保存する',
          'データファイルを直接編集して改ざんする',
          'データを読み込む',
          '改ざん検出エラーが発生することを確認する'
        ],
        expectedResults: secReq.acceptanceCriteria.filter(ac => 
          ac.includes('改ざん')
        ),
        type: 'error'
      });
    }
    
    // 不正アクセステスト
    testCases.push({
      id: `SEC-${String(tcCounter++).padStart(3, '0')}`,
      name: '不正アクセステスト',
      description: '不正なアクセスが拒否されることを確認',
      preconditions: [
        'テスト環境が起動している'
      ],
      steps: [
        '無効な認証情報でアクセスを試行する',
        'アクセスが拒否されることを確認する',
        'エラーログが記録されることを確認する'
      ],
      expectedResults: [
        'アクセスが拒否される',
        '適切なエラーメッセージが表示される',
        'セキュリティログに記録される'
      ],
      type: 'error'
    });
  } else {
    // セキュリティ要件がない場合のデフォルトテストケース
    testCases.push({
      id: `SEC-${String(tcCounter++).padStart(3, '0')}`,
      name: '基本的な入力検証テスト',
      description: 'ユーザー入力が適切に検証されることを確認',
      preconditions: ['テスト環境が起動している'],
      steps: [
        'SQLインジェクションパターンを入力する',
        'XSSパターンを入力する',
        '入力が拒否またはエスケープされることを確認する'
      ],
      expectedResults: [
        '危険な入力が適切に処理される',
        'セキュリティエラーが発生しない'
      ],
      type: 'error'
    });
  }
  
  const templateData: TemplateData = {
    feature,
    testType: 'security',
    date: new Date().toISOString().split('T')[0],
    purpose: `${feature}のセキュリティが要件を満たすことを確認する`,
    scope: `${feature}の認証・認可・データ保護`,
    testCases,
    requirements
  };
  
  const template = loadTestSpecTemplate('security', projectRoot);
  return applyTemplate(template, templateData);
}

/**
 * メイン生成関数
 */
export async function generateTestSpec(
  feature: string,
  testType: string,
  projectRoot: string = process.cwd()
): Promise<void> {
  let specContent: string;
  
  switch (testType) {
  case 'unit':
    specContent = await generateUnitTestSpec(feature, projectRoot);
    break;
  case 'integration':
    specContent = await generateIntegrationTestSpec(feature, projectRoot);
    break;
  case 'e2e':
    specContent = await generateE2ETestSpec(feature, projectRoot);
    break;
  case 'performance':
    specContent = await generatePerformanceTestSpec(feature, projectRoot);
    break;
  case 'security':
    specContent = await generateSecurityTestSpec(feature, projectRoot);
    break;
  default:
    throw new Error(`未対応のテストタイプ: ${testType}`);
  }
  
  // ファイルに保存
  const specDir = join(projectRoot, '.kiro', 'specs', feature, 'test-specs');
  mkdirSync(specDir, { recursive: true });
  
  const outputPath = join(specDir, `${testType}-test-spec.md`);
  writeFileSync(outputPath, specContent, 'utf-8');
}

