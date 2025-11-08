/**
 * feature-name-validator.ts のテスト
 */

import { describe, it, expect } from 'vitest';
import { validateFeatureName, suggestFeatureName } from '../feature-name-validator.js';

describe('validateFeatureName', () => {
  describe('有効なfeature名', () => {
    it('小文字の英数字とハイフンのみ', () => {
      const result = validateFeatureName('user-auth');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('単一単語', () => {
      const result = validateFeatureName('payment');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('複数単語（ハイフン区切り）', () => {
      const result = validateFeatureName('health-check-endpoint');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('数字を含む', () => {
      const result = validateFeatureName('api-v2');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('無効なfeature名', () => {
    it('大文字を含む', () => {
      const result = validateFeatureName('UserAuth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('大文字'))).toBe(true);
    });
    
    it('日本語を含む', () => {
      const result = validateFeatureName('ユーザー認証');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('日本語'))).toBe(true);
    });
    
    it('アンダースコアを含む', () => {
      const result = validateFeatureName('user_auth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('アンダースコア'))).toBe(true);
    });
    
    it('スペースを含む', () => {
      const result = validateFeatureName('user auth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('スペース'))).toBe(true);
    });
    
    it('先頭にハイフン', () => {
      const result = validateFeatureName('-user-auth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('先頭'))).toBe(true);
    });
    
    it('末尾にハイフン', () => {
      const result = validateFeatureName('user-auth-');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('末尾'))).toBe(true);
    });
    
    it('連続したハイフン', () => {
      const result = validateFeatureName('user--auth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('連続'))).toBe(true);
    });
    
    it('空文字', () => {
      const result = validateFeatureName('');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('空'))).toBe(true);
    });
    
    it('特殊文字を含む', () => {
      const result = validateFeatureName('user@auth');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('使用できない文字'))).toBe(true);
    });
  });
});

describe('suggestFeatureName', () => {
  it('大文字を小文字に変換', () => {
    expect(suggestFeatureName('UserAuth')).toBe('userauth');
  });
  
  it('アンダースコアをハイフンに変換', () => {
    expect(suggestFeatureName('user_auth')).toBe('user-auth');
  });
  
  it('スペースをハイフンに変換', () => {
    expect(suggestFeatureName('user auth')).toBe('user-auth');
  });
  
  it('日本語を削除', () => {
    expect(suggestFeatureName('ユーザーuser認証auth')).toBe('userauth');
  });
  
  it('複数のスペースを1つのハイフンに', () => {
    expect(suggestFeatureName('user   auth')).toBe('user-auth');
  });
  
  it('先頭・末尾のハイフンを削除', () => {
    expect(suggestFeatureName('-user-auth-')).toBe('user-auth');
  });
  
  it('連続ハイフンを1つに', () => {
    expect(suggestFeatureName('user--auth')).toBe('user-auth');
  });
  
  it('特殊文字を削除', () => {
    expect(suggestFeatureName('user@#$auth')).toBe('userauth');
  });
  
  it('複合的な変換', () => {
    expect(suggestFeatureName('User_Auth Feature!')).toBe('user-auth-feature');
  });
});

