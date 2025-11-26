/**
 * Docker Compose要件検出ユーティリティ
 * design.md、requirements.md、test-type-selectionからDocker Composeの必要性を自動判断
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { extractSection } from './markdown-parser.js';

export interface DockerRecommendation {
  recommended: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  suggestedServices: string[];
}

/**
 * Docker Composeの必要性を分析
 */
export function analyzeDockerRequirement(feature: string, projectRoot: string = process.cwd()): DockerRecommendation {
  const reasons: string[] = [];
  const services: string[] = [];
  let score = 0;
  
  // design.mdを解析
  const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
  if (existsSync(designPath)) {
    const design = readFileSync(designPath, 'utf-8');
    
    // Technology Stackセクションを確認
    const techStack = extractSection(design, 'Technology Stack');
    const dataModels = extractSection(design, 'Data Models');
    
    // データベースの検出
    if (techStack.match(/PostgreSQL|Postgres/i) || dataModels.match(/PostgreSQL|Postgres/i)) {
      score += 3;
      services.push('postgres');
      reasons.push('PostgreSQLがTechnology Stackに含まれている');
    }
    
    if (techStack.match(/MySQL/i) || dataModels.match(/MySQL/i)) {
      score += 3;
      services.push('mysql');
      reasons.push('MySQLがTechnology Stackに含まれている');
    }
    
    if (techStack.match(/MongoDB|Mongo/i) || dataModels.match(/MongoDB|Mongo/i)) {
      score += 3;
      services.push('mongodb');
      reasons.push('MongoDBがTechnology Stackに含まれている');
    }
    
    // ミドルウェアの検出
    if (techStack.match(/Redis/i)) {
      score += 2;
      services.push('redis');
      reasons.push('RedisがTechnology Stackに含まれている');
    }
    
    if (techStack.match(/Elasticsearch/i)) {
      score += 2;
      reasons.push('ElasticsearchがTechnology Stackに含まれている');
    }
    
    if (techStack.match(/RabbitMQ|Kafka/i)) {
      score += 2;
      reasons.push('メッセージキュー（RabbitMQ/Kafka）がTechnology Stackに含まれている');
    }
    
    // Data Modelsセクションの分析
    if (dataModels.match(/Relational Database|RDBMS/i)) {
      score += 2;
      reasons.push('リレーショナルデータベースがData Modelsに定義されている');
    }
    
    if (dataModels.match(/Document Store|NoSQL/i)) {
      score += 2;
      reasons.push('NoSQLデータベースがData Modelsに定義されている');
    }
    
    // File Storageのみの場合は減点
    if (techStack.match(/File System|File Storage/i) && 
        !techStack.match(/PostgreSQL|MySQL|MongoDB|Redis/i)) {
      score -= 1;
      reasons.push('File Storageのみ（データベース不要の可能性）');
    }
  }
  
  // test-type-selection.jsonを解析
  const testSelectionPath = join(projectRoot, '.kiro', 'specs', feature, 'test-type-selection.json');
  if (existsSync(testSelectionPath)) {
    try {
      const testSelection = JSON.parse(readFileSync(testSelectionPath, 'utf-8'));
      const testTypes = testSelection.selectedTypes || [];
      
      // 統合テストが選択されている
      if (testTypes.includes('integration')) {
        score += 2;
        reasons.push('統合テストが選択されている（データベースやミドルウェアのテストに有用）');
      }
      
      // E2Eテストが選択されている
      if (testTypes.includes('e2e')) {
        score += 2;
        reasons.push('E2Eテストが選択されている（実環境に近い状態でのテストに有用）');
      }
      
      // パフォーマンステストが選択されている
      if (testTypes.includes('performance')) {
        score += 1;
        reasons.push('パフォーマンステストが選択されている（負荷テストにデータベースが有用）');
      }
    } catch {
      // test-type-selection.jsonの読み込みエラーは無視
    }
  }
  
  // requirements.mdを解析
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  if (existsSync(requirementsPath)) {
    const requirements = readFileSync(requirementsPath, 'utf-8');
    
    // データ永続化の要件
    if (requirements.match(/データベース|database|永続化|persist/i)) {
      score += 1;
      reasons.push('データ永続化の要件が含まれている');
    }
    
    // 外部サービス連携の要件
    if (requirements.match(/外部.*API|external.*API|mock.*server/i)) {
      score += 1;
      if (!services.includes('mockapi')) {
        services.push('mockapi');
      }
      reasons.push('外部API連携の要件が含まれている（Mock API Serverが有用）');
    }
  }
  
  // 判定
  const recommended = score >= 3;
  const confidence: 'high' | 'medium' | 'low' = 
    score >= 5 ? 'high' : 
      score >= 3 ? 'medium' : 
        'low';
  
  return {
    recommended,
    confidence,
    reasons,
    suggestedServices: [...new Set(services)] // 重複削除
  };
}

