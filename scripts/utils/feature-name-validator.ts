/**
 * 機能名（feature）のバリデーション
 * kebab-case形式を強制
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * kebab-case形式の正規表現
 * - 小文字の英数字で始まる
 * - 小文字の英数字とハイフンのみ
 * - 連続したハイフン不可
 * - 先頭・末尾のハイフン不可
 */
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * feature名がkebab-case形式か検証
 */
export function validateFeatureName(featureName: string): ValidationResult {
  const errors: string[] = [];
  
  // 空文字チェック
  if (!featureName || featureName.trim().length === 0) {
    errors.push('❌ feature名が空です');
    return { valid: false, errors };
  }
  
  const trimmed = featureName.trim();
  
  // kebab-case形式チェック
  if (!KEBAB_CASE_PATTERN.test(trimmed)) {
    errors.push(`❌ feature名が無効な形式です: "${trimmed}"`);
    errors.push('   必須形式: 英語、kebab-case（ハイフン区切り）、小文字のみ');
    
    // 具体的な問題を特定
    if (/[A-Z]/.test(trimmed)) {
      errors.push('   → 大文字が含まれています（小文字に変換してください）');
    }
    if (/[ぁ-んァ-ヶー一-龯]/.test(trimmed)) {
      errors.push('   → 日本語が含まれています（英語に変換してください）');
    }
    if (/_/.test(trimmed)) {
      errors.push('   → アンダースコア(_)が含まれています（ハイフン(-)を使用してください）');
    }
    if (/\s/.test(trimmed)) {
      errors.push('   → スペースが含まれています（ハイフン(-)を使用してください）');
    }
    if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
      errors.push('   → 先頭または末尾にハイフンがあります（削除してください）');
    }
    if (/--/.test(trimmed)) {
      errors.push('   → 連続したハイフンがあります（1つに減らしてください）');
    }
    if (/[^a-z0-9-]/.test(trimmed)) {
      const invalidChars = trimmed.match(/[^a-z0-9-]/g);
      errors.push(`   → 使用できない文字が含まれています: ${[...new Set(invalidChars)].join(', ')}`);
    }
    
    // 修正案を提示
    const suggestion = suggestFeatureName(trimmed);
    if (suggestion && suggestion !== trimmed) {
      errors.push(`   💡 修正案: "${suggestion}"`);
    }
  }
  
  // 長さチェック（推奨）
  if (trimmed.length > 50) {
    errors.push(`⚠️  feature名が長すぎます（${trimmed.length}文字）。50文字以内を推奨`);
  }
  
  // 単語数チェック（推奨）
  const wordCount = trimmed.split('-').length;
  if (wordCount > 5) {
    errors.push(`⚠️  単語数が多すぎます（${wordCount}単語）。2-4単語を推奨`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 不正なfeature名を修正案に変換
 */
export function suggestFeatureName(input: string): string {
  return input
    .toLowerCase()                    // 小文字に変換
    .replace(/[ぁ-んァ-ヶー一-龯]/g, '') // 日本語削除
    .replace(/\s+/g, '-')             // スペース→ハイフン
    .replace(/_+/g, '-')              // アンダースコア→ハイフン
    .replace(/[^a-z0-9-]/g, '')       // 無効文字削除
    .replace(/--+/g, '-')             // 連続ハイフン→1つ
    .replace(/^-+|-+$/g, '');         // 先頭・末尾ハイフン削除
}

/**
 * feature名をバリデートし、エラー時は例外をスロー
 */
export function validateFeatureNameOrThrow(featureName: string): void {
  const result = validateFeatureName(featureName);
  
  if (!result.valid) {
    const errorMessage = [
      `Invalid feature name: "${featureName}"`,
      '',
      ...result.errors,
      '',
      'ヘルプ: README.md#機能名（feature）の命名規則 を参照してください'
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * feature名をバリデートし、警告を表示（続行可能）
 */
export function validateFeatureNameWithWarning(featureName: string): boolean {
  const result = validateFeatureName(featureName);
  
  if (!result.valid) {
    console.error('\n⚠️  Feature name validation failed:');
    result.errors.forEach(err => console.error(err));
    console.error('\nヘルプ: README.md#機能名（feature）の命名規則 を参照してください\n');
    return false;
  }
  
  return true;
}

