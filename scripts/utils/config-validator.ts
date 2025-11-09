/**
 * 設定ファイルのバリデーション
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { AppConfigSchema } from '../config/config-schema.js';
import type { AppConfig } from '../config/config-schema.js';

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * プロジェクト設定ファイルをバリデーション
 */
export function validateProjectConfig(projectRoot: string = process.cwd()): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  
  const configPath = resolve(projectRoot, '.kiro/config.json');
  
  if (!existsSync(configPath)) {
    // 設定ファイルが存在しない場合は情報メッセージ（デフォルト設定を使用）
    info.push('Project config file not found. Using default configuration.');
    return {
      valid: true,
      errors: [],
      warnings: [],
      info
    };
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    // スキーマでバリデーション
    const result = AppConfigSchema.safeParse(parsed);
    
    if (!result.success) {
      result.error.errors.forEach(error => {
        const path = error.path.join('.');
        errors.push(`${path}: ${error.message}`);
      });
      
      return {
        valid: false,
        errors,
        warnings: [],
        info: []
      };
    }
    
    // 追加のバリデーション
    const config = result.data;
    
    // Confluence設定のバリデーション
    if (config.confluence) {
      const confluence = config.confluence;
      
      // hierarchy設定の整合性チェック
      if (confluence.pageCreationGranularity === 'by-hierarchy' || confluence.pageCreationGranularity === 'manual') {
        if (!confluence.hierarchy) {
          errors.push('confluence.hierarchy is required when pageCreationGranularity is "by-hierarchy" or "manual"');
        } else {
          if (confluence.pageCreationGranularity === 'by-hierarchy' && !confluence.hierarchy.parentPageTitle) {
            warnings.push('confluence.hierarchy.parentPageTitle is recommended for "by-hierarchy" mode');
          }
          
          if (confluence.pageCreationGranularity === 'manual' && !confluence.hierarchy.structure) {
            errors.push('confluence.hierarchy.structure is required when pageCreationGranularity is "manual"');
          }
        }
      }
    }
    
    // JIRA設定のバリデーション
    if (config.jira) {
      const jira = config.jira;
      
      if (jira.storyCreationGranularity === 'selected-phases' && !jira.selectedPhases) {
        errors.push('jira.selectedPhases is required when storyCreationGranularity is "selected-phases"');
      }
      
      if (jira.selectedPhases && jira.selectedPhases.length === 0) {
        warnings.push('jira.selectedPhases is empty. No stories will be created.');
      }
    }
    
    // ワークフロー設定のバリデーション
    if (config.workflow) {
      const workflow = config.workflow;
      
      if (workflow.enabledPhases && workflow.enabledPhases.length === 0) {
        warnings.push('workflow.enabledPhases is empty. No phases will be executed.');
      }
      
      const validPhases = ['requirements', 'design', 'tasks'];
      const invalidPhases = workflow.enabledPhases?.filter(phase => !validPhases.includes(phase));
      if (invalidPhases && invalidPhases.length > 0) {
        warnings.push(`Unknown phases in workflow.enabledPhases: ${invalidPhases.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info: []
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${error.message}`);
    } else {
      errors.push(`Error reading config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      valid: false,
      errors,
      warnings: [],
      info: []
    };
  }
}

/**
 * 設定ファイルのバリデーションを実行して結果を表示
 */
export function validateAndReport(projectRoot: string = process.cwd()): boolean {
  const result = validateProjectConfig(projectRoot);
  
  if (result.info.length > 0) {
    console.log('ℹ️  Info:');
    result.info.forEach(message => {
      console.log(`   - ${message}`);
    });
  }
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  if (result.errors.length > 0) {
    console.error('❌ Validation errors:');
    result.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
    return false;
  }
  
  if (result.valid) {
    console.log('✅ Configuration is valid');
  }
  
  return result.valid;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const valid = validateAndReport();
  process.exit(valid ? 0 : 1);
}

