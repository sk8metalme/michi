/**
 * 実装言語検出ユーティリティ
 * design.md、requirements.mdから実装言語を自動推論
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { extractSection } from './markdown-parser.js';

export interface LanguageRecommendation {
  language: string; // 'Node.js/TypeScript', 'Java', etc.
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * 実装言語を分析
 */
export function analyzeLanguage(feature: string, projectRoot: string = process.cwd()): LanguageRecommendation {
  const reasons: string[] = [];
  const scores: Record<string, number> = {
    'Node.js/TypeScript': 0,
    'Java': 0,
    'PHP': 0,
    'Python': 0,
    'Go': 0,
    'Rust': 0
  };
  
  // design.mdを解析
  const designPath = join(projectRoot, '.kiro', 'specs', feature, 'design.md');
  if (existsSync(designPath)) {
    const design = readFileSync(designPath, 'utf-8');
    
    // Technology Stackセクションを確認
    const techStack = extractSection(design, 'Technology Stack');
    
    // Node.js/TypeScript
    if (techStack.match(/Node\.js|TypeScript|npm|pnpm|yarn/i)) {
      scores['Node.js/TypeScript'] += 5;
      reasons.push('Technology StackにNode.js/TypeScriptが含まれている');
    }
    
    if (techStack.match(/React|Next\.js|Express|NestJS/i)) {
      scores['Node.js/TypeScript'] += 3;
      reasons.push('Node.jsフレームワーク（React/Next.js/Express等）が含まれている');
    }
    
    // Java
    if (techStack.match(/Java|JDK|Spring|Gradle|Maven/i)) {
      scores['Java'] += 5;
      reasons.push('Technology StackにJavaが含まれている');
    }
    
    if (techStack.match(/Spring Boot|Spring Framework|Hibernate/i)) {
      scores['Java'] += 3;
      reasons.push('Javaフレームワーク（Spring等）が含まれている');
    }
    
    // PHP
    if (techStack.match(/PHP|Composer|Laravel|Symfony/i)) {
      scores['PHP'] += 5;
      reasons.push('Technology StackにPHPが含まれている');
    }
    
    // Python
    if (techStack.match(/Python|Django|Flask|FastAPI|pip|poetry/i)) {
      scores['Python'] += 5;
      reasons.push('Technology StackにPythonが含まれている');
    }
    
    // Go
    if (techStack.match(/\bGo\b|Golang|go mod/i)) {
      scores['Go'] += 5;
      reasons.push('Technology StackにGoが含まれている');
    }
    
    // Rust
    if (techStack.match(/Rust|Cargo|Actix|Rocket/i)) {
      scores['Rust'] += 5;
      reasons.push('Technology StackにRustが含まれている');
    }
    
    // Runtimeセクションも確認
    const runtime = design.toLowerCase();
    if (runtime.includes('node.js')) {
      scores['Node.js/TypeScript'] += 2;
    }
    if (runtime.includes('jvm') || runtime.includes('java')) {
      scores['Java'] += 2;
    }
  }
  
  // requirements.mdを解析
  const requirementsPath = join(projectRoot, '.kiro', 'specs', feature, 'requirements.md');
  if (existsSync(requirementsPath)) {
    const requirements = readFileSync(requirementsPath, 'utf-8');
    
    // APIやWebアプリケーションの言及
    if (requirements.match(/REST API|GraphQL API/i)) {
      // API系はNode.js、Java、Go、Pythonが一般的
      if (scores['Node.js/TypeScript'] > 0) scores['Node.js/TypeScript'] += 1;
      if (scores['Java'] > 0) scores['Java'] += 1;
      if (scores['Go'] > 0) scores['Go'] += 1;
      if (scores['Python'] > 0) scores['Python'] += 1;
    }
    
    if (requirements.match(/Web.*アプリケーション|UI|フロントエンド/i)) {
      // Webアプリケーションは主にNode.js、PHP、Python
      if (scores['Node.js/TypeScript'] > 0) scores['Node.js/TypeScript'] += 1;
      if (scores['PHP'] > 0) scores['PHP'] += 1;
      if (scores['Python'] > 0) scores['Python'] += 1;
    }
  }
  
  // 最高スコアの言語を選択
  let maxScore = 0;
  let recommendedLanguage = 'その他';
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      recommendedLanguage = lang;
    }
  }
  
  // 信頼度を判定
  const confidence: 'high' | 'medium' | 'low' = 
    maxScore >= 5 ? 'high' : 
      maxScore >= 3 ? 'medium' : 
        'low';
  
  return {
    language: recommendedLanguage,
    confidence,
    reasons
  };
}

