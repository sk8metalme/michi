/**
 * CI/CD設定生成ユーティリティ
 * プロジェクトの言語/ツールに応じてCI/CD設定を生成
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface CIConfig {
  language: string;
  ciTool: string;
  feature?: string;
}

/**
 * CI/CD設定ファイルを生成
 */
export async function generateCIConfig(
  feature: string,
  config: CIConfig,
  projectRoot: string = process.cwd()
): Promise<void> {
  const { language, ciTool } = config;
  
  if (ciTool === 'なし') {
    console.log('   ⏭️  CI/CD設定: スキップ');
    return;
  }
  
  const templateMap: Record<string, string> = {
    'Node.js/TypeScript': 'nodejs.yml',
    'Java': 'java.yml',
    'PHP': 'php.yml',
    'Python': 'nodejs.yml', // 暫定
    'Go': 'nodejs.yml', // 暫定
    'Rust': 'nodejs.yml', // 暫定
    'その他': 'nodejs.yml' // デフォルト
  };
  
  const templateFile = templateMap[language] || 'nodejs.yml';
  
  // テンプレートファイルのパスを解決
  const templatePath = join(__dirname, '..', '..', 'templates', 'ci', 'github-actions', templateFile);
  
  if (!existsSync(templatePath)) {
    console.warn(`⚠️  テンプレートが見つかりません: ${templatePath}`);
    return;
  }
  
  const template = readFileSync(templatePath, 'utf-8');
  
  // GitHub Actionsの場合
  if (ciTool === 'GitHub Actions') {
    const outputDir = join(projectRoot, '.github', 'workflows');
    mkdirSync(outputDir, { recursive: true });
    
    const outputPath = join(outputDir, 'test.yml');
    writeFileSync(outputPath, template, 'utf-8');
    
    console.log('   ✅ CI/CD設定: .github/workflows/test.yml');
  } else if (ciTool === 'Screwdriver') {
    const screwdriverMap: Record<string, string> = {
      'Node.js/TypeScript': 'nodejs.yaml',
      'Java': 'java.yaml',
      'PHP': 'php.yaml'
    };
    
    const screwdriverFile = screwdriverMap[language] || 'nodejs.yaml';
    const screwdriverTemplatePath = join(__dirname, '..', '..', 'templates', 'ci', 'screwdriver', screwdriverFile);
    
    if (existsSync(screwdriverTemplatePath)) {
      const screwdriverTemplate = readFileSync(screwdriverTemplatePath, 'utf-8');
      const outputPath = join(projectRoot, 'screwdriver.yaml');
      writeFileSync(outputPath, screwdriverTemplate, 'utf-8');
      console.log('   ✅ CI/CD設定: screwdriver.yaml');
    }
  }
}

