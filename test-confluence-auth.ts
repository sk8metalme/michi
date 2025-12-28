#!/usr/bin/env node

/**
 * Confluence API認証テストスクリプト
 */

import axios from 'axios';
import { safeReadFileOrThrow } from './scripts/utils/safe-file-reader.js';
import { resolve } from 'path';
import { homedir } from 'os';

// .envファイルから環境変数を読み込む
function loadEnvFile(envPath: string): void {
  try {
    const envContent = safeReadFileOrThrow(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
    console.log(`✅ Loaded environment from: ${envPath}`);
  } catch (error) {
    console.log(`⚠️  Could not load ${envPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 環境変数を読み込み
loadEnvFile(resolve(homedir(), '.michi', '.env'));

const ATLASSIAN_URL = process.env.ATLASSIAN_URL;
const ATLASSIAN_EMAIL = process.env.ATLASSIAN_EMAIL;
const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

console.log('\n📋 認証情報確認:');
console.log(`  ATLASSIAN_URL: ${ATLASSIAN_URL ? '✅ 設定済み' : '❌ 未設定'}`);
console.log(`  ATLASSIAN_EMAIL: ${ATLASSIAN_EMAIL ? '✅ 設定済み' : '❌ 未設定'}`);
console.log(`  ATLASSIAN_API_TOKEN: ${ATLASSIAN_API_TOKEN ? '✅ 設定済み (長さ: ' + ATLASSIAN_API_TOKEN.length + ')' : '❌ 未設定'}`);

if (!ATLASSIAN_URL || !ATLASSIAN_EMAIL || !ATLASSIAN_API_TOKEN) {
  console.error('\n❌ 必要な環境変数が設定されていません');
  process.exit(1);
}

// Basic認証文字列を生成
const auth = Buffer.from(`${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}`).toString('base64');

console.log('\n🔍 Confluence API接続テスト...\n');

// テスト1: 現在のユーザー情報を取得
async function testCurrentUser(): Promise<boolean> {
  try {
    console.log('Test 1: 現在のユーザー情報取得');
    const response = await axios.get(`${ATLASSIAN_URL}/wiki/rest/api/user/current`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ ユーザー情報取得成功:');
    console.log(`   Name: ${response.data.displayName}`);
    console.log(`   Email: ${response.data.email || 'N/A'}`);
    console.log(`   Account ID: ${response.data.accountId}`);
    return true;
  } catch (error: unknown) {
    console.error('❌ ユーザー情報取得失敗:');
    if (axios.isAxiosError(error) && error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }
}

// テスト2: スペース一覧を取得
async function testListSpaces(): Promise<boolean> {
  try {
    console.log('\nTest 2: スペース一覧取得');
    const response = await axios.get(`${ATLASSIAN_URL}/wiki/rest/api/space`, {
      params: {
        limit: 5
      },
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ スペース一覧取得成功:');
    if (response.data.results && response.data.results.length > 0) {
      response.data.results.forEach((space: { key: string; name: string }) => {
        console.log(`   - ${space.key}: ${space.name}`);
      });
    } else {
      console.log('   (アクセス可能なスペースがありません)');
    }
    return true;
  } catch (error: unknown) {
    console.error('❌ スペース一覧取得失敗:');
    if (axios.isAxiosError(error) && error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }
}

// テストを実行
(async () => {
  const test1Result = await testCurrentUser();
  const test2Result = await testListSpaces();

  console.log('\n' + '='.repeat(60));
  console.log('テスト結果:');
  console.log(`  ユーザー情報取得: ${test1Result ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  スペース一覧取得: ${test2Result ? '✅ 成功' : '❌ 失敗'}`);

  if (test1Result && test2Result) {
    console.log('\n✅ すべてのテストが成功しました！');
    console.log('   Confluence APIへの接続は正常です。');
  } else {
    console.log('\n❌ 一部またはすべてのテストが失敗しました。');
    console.log('   認証情報またはアクセス権限を確認してください。');
    process.exit(1);
  }
})();
