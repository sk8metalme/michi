/**
 * マルチプロジェクト見積もり集計
 */

import { Octokit } from '@octokit/rest';
import { loadEnv } from './utils/env-loader.js';
import ExcelJS from 'exceljs';
import { resolve, join, dirname } from 'path';
import { writeFileSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { mkdir } from 'fs/promises';

loadEnv();

// EstimateData型定義（estimate-generator.tsから統合）
export interface EstimateData {
  feature: string;
  tasks: TaskEstimate[];
  totalDays: number;
  totalPoints: number;
  risks: RiskEstimate[];
  optimistic: number;
  standard: number;
  pessimistic: number;
}

interface TaskEstimate {
  name: string;
  days: number;
  assignee: string;
  notes?: string;
}

interface RiskEstimate {
  risk: string;
  impact: number;
  mitigation: string;
}

/**
 * design.mdから見積もりを抽出（estimate-generator.tsから統合）
 */
function parseEstimateFromDesign(designPath: string): EstimateData {
  const content = readFileSync(designPath, 'utf-8');
  
  const tasks: TaskEstimate[] = [];
  let totalDays = 0;
  
  // 見積もりテーブルを正規表現で抽出
  const tableRegex = /\|\s*([^|]+)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const [, name, daysStr, assignee] = match;
    const days = parseFloat(daysStr);
    
    if (!isNaN(days) && name.trim() !== 'タスク' && name.trim() !== '**合計**') {
      tasks.push({
        name: name.trim(),
        days,
        assignee: assignee.trim()
      });
      totalDays += days;
    }
  }
  
  const risks: RiskEstimate[] = [
    { risk: '技術的課題', impact: 5, mitigation: 'プロトタイプ検証' },
    { risk: '要件変更', impact: 3, mitigation: 'バッファ確保' }
  ];
  
  const riskTotal = risks.reduce((sum, r) => sum + r.impact, 0);
  
  return {
    feature: 'Unknown',
    tasks,
    totalDays,
    totalPoints: Math.ceil(totalDays / 0.5),
    risks,
    optimistic: totalDays,
    standard: totalDays + riskTotal,
    pessimistic: Math.ceil(totalDays * 1.5)
  };
}

/**
 * Excel出力（excel-sync.tsから統合）
 */
async function exportToExcel(
  estimates: EstimateData[],
  outputPath: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('見積もりサマリー');
  
  worksheet.columns = [
    { header: 'プロジェクト/機能', key: 'feature', width: 30 },
    { header: '楽観的（人日）', key: 'optimistic', width: 15 },
    { header: '標準的（人日）', key: 'standard', width: 15 },
    { header: '悲観的（人日）', key: 'pessimistic', width: 15 },
    { header: 'ストーリーポイント', key: 'points', width: 18 },
    { header: 'タスク数', key: 'taskCount', width: 12 }
  ];
  
  for (const estimate of estimates) {
    worksheet.addRow({
      feature: estimate.feature,
      optimistic: estimate.optimistic,
      standard: estimate.standard,
      pessimistic: estimate.pessimistic,
      points: estimate.totalPoints,
      taskCount: estimate.tasks.length
    });
  }
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  const totalRow = worksheet.addRow({
    feature: '合計',
    optimistic: estimates.reduce((sum, e) => sum + e.optimistic, 0),
    standard: estimates.reduce((sum, e) => sum + e.standard, 0),
    pessimistic: estimates.reduce((sum, e) => sum + e.pessimistic, 0),
    points: estimates.reduce((sum, e) => sum + e.totalPoints, 0),
    taskCount: estimates.reduce((sum, e) => sum + e.tasks.length, 0)
  });
  totalRow.font = { bold: true };
  
  await mkdir(dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel file saved: ${outputPath}`);
}

/**
 * content文字列から見積もりを抽出（一時ファイル経由）
 */
function parseEstimateFromContent(content: string, featureName: string): EstimateData | null {
  let tempFile: string | null = null;
  
  try {
    // 一時ファイルに書き出してからパース
    const tempDir = join(tmpdir(), 'michi-estimate');
    mkdirSync(tempDir, { recursive: true });
    tempFile = join(tempDir, `design-${Date.now()}.md`);
    writeFileSync(tempFile, content);
    
    const estimate = parseEstimateFromDesign(tempFile);
    estimate.feature = featureName;
    
    return estimate;
  } catch (error) {
    console.warn('  ⚠️  Failed to parse estimate:', error instanceof Error ? error.message : error);
    return null;
  } finally {
    // 一時ファイルをクリーンアップ
    if (tempFile) {
      try {
        unlinkSync(tempFile);
      } catch {
        // 削除失敗は無視
      }
    }
  }
}

async function aggregateEstimates(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;
  
  if (!token || !org) {
    throw new Error('Missing GitHub credentials');
  }
  
  const octokit = new Octokit({ auth: token });
  const estimates: EstimateData[] = [];
  
  console.log('Aggregating estimates from all projects...');

  // pagination対応: 100リポジトリ以上でも全件取得
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    per_page: 100
  });

  console.log(`Found ${repos.length} repositories`);
  
  for (const repo of repos) {
    try {
      // projects/ディレクトリを取得（pagination対応）
      const projectsDir = await octokit.paginate('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: org,
        repo: repo.name,
        path: 'projects',
        per_page: 100
      });
      
      if (Array.isArray(projectsDir)) {
        // projects/配下の各プロジェクトディレクトリを処理
        for (const projectEntry of projectsDir) {
          // 型ガード: projectEntry が必要なプロパティを持つことを確認
          if (typeof projectEntry === 'object' && projectEntry !== null &&
              'type' in projectEntry && projectEntry.type === 'dir' &&
              'name' in projectEntry) {
            try {
              // projects/{project-id}/.kiro/specs/ ディレクトリを取得（pagination対応）
              const specs = await octokit.paginate('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: org,
                repo: repo.name,
                path: `projects/${(projectEntry as { name: string }).name}/.kiro/specs`,
                per_page: 100
              });
              
              if (Array.isArray(specs)) {
                for (const spec of specs) {
                  // 型ガード: spec が必要なプロパティを持つことを確認
                  if (typeof spec === 'object' && spec !== null &&
                      'type' in spec && spec.type === 'dir' &&
                      'name' in spec) {
                    // design.md を取得
                    try {
                      const projectName = (projectEntry as { name: string }).name;
                      const specName = (spec as { name: string }).name;
                      const { data: designFile } = await octokit.repos.getContent({
                        owner: org,
                        repo: repo.name,
                        path: `projects/${projectName}/.kiro/specs/${specName}/design.md`
                      });

                      if ('content' in designFile) {
                        const content = Buffer.from(designFile.content, 'base64').toString('utf-8');

                        // コンテンツから見積もりを抽出
                        try {
                          const estimateData = parseEstimateFromContent(content, `${repo.name}/${projectName}/${specName}`);
                          if (estimateData) {
                            estimates.push(estimateData);
                            console.log(`  ✅ Parsed: ${repo.name}/${projectName}/${specName} (${estimateData.totalDays}日)`);
                          }
                        } catch (error) {
                          console.warn(`  ⚠️  Failed to parse ${repo.name}/${projectName}/${specName}:`, error instanceof Error ? error.message : error);
                        }
                      }
                    } catch {
                      continue;
                    }
                  }
                }
              }
            } catch {
              // プロジェクトディレクトリに.kiro/specsがない場合はスキップ
              continue;
            }
          }
        }
      }
    } catch {
      // projects/ディレクトリが存在しない場合はスキップ
      continue;
    }
  }
  
  // Excel出力
  if (estimates.length > 0) {
    const outputDir = resolve('./estimates');
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, 'multi-project-estimates.xlsx');
    await exportToExcel(estimates, outputPath);
  } else {
    console.log('No estimates found');
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  aggregateEstimates()
    .then(() => {
      console.log('✅ Aggregation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

export { aggregateEstimates };

