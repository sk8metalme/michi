/**
 * 新規実装機能の動作確認スクリプト
 */

import { executeTests, generateTestReport } from './utils/test-runner.js';
import { getCommits, generateReleaseNotes, formatReleaseNotes } from './utils/release-notes-generator.js';
import { getApprovalStatus } from './utils/confluence-approval.js';

async function testTestRunner() {
  console.log('\n📋 Test 1: テスト実行とレポート生成');
  console.log('='.repeat(60));

  try {
    // 言語検出のテスト（このプロジェクト自体がNode.js/TypeScript）
    console.log('\n✅ このプロジェクトでテストを実行します...');
    const result = await executeTests('Node.js/TypeScript', process.cwd());

    console.log('\n📊 テスト結果:');
    console.log(`  ステータス: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`  言語: ${result.language}`);
    console.log(`  コマンド: ${result.command}`);
    console.log(`  実行時間: ${result.duration.toFixed(2)}秒`);

    if (!result.success && result.error) {
      console.log(`  エラー: ${result.error}`);
    }

    // レポート生成
    console.log('\n📝 レポート生成中...');
    const report = generateTestReport(result, 'test-feature');
    console.log('\n--- レポートプレビュー ---');
    console.log(report.substring(0, 500) + '...');

    return true;
  } catch (error: any) {
    console.error('❌ テストランナーエラー:', error.message);
    return false;
  }
}

async function testReleaseNotesGenerator() {
  console.log('\n📋 Test 2: リリースノート生成');
  console.log('='.repeat(60));

  try {
    // コミット履歴を取得
    console.log('\n✅ 最新10コミットを取得します...');
    // HEAD~10からHEADまでのコミットを取得（範囲指定を修正）
    const commits = await getCommits('HEAD~10', 'HEAD', process.cwd());

    console.log(`\n📊 取得したコミット数: ${commits.length}`);

    if (commits.length > 0) {
      console.log('\n最初の3コミット:');
      commits.slice(0, 3).forEach((commit, index) => {
        console.log(`  ${index + 1}. [${commit.type}] ${commit.subject}`);
        if (commit.scope) console.log(`     scope: ${commit.scope}`);
        if (commit.breaking) console.log('     ⚠️  BREAKING CHANGE');
      });

      // リリースノート生成
      console.log('\n📝 リリースノート生成中...');
      const notes = generateReleaseNotes(commits, 'v1.0.0-test');
      const markdown = formatReleaseNotes(notes);

      console.log('\n--- リリースノートプレビュー ---');
      console.log(markdown.substring(0, 800));
      if (markdown.length > 800) {
        console.log('...');
      }

      return true;
    } else {
      console.log('⚠️  コミットが見つかりませんでした');
      return false;
    }
  } catch (error: any) {
    console.error('❌ リリースノート生成エラー:', error.message);
    return false;
  }
}

async function testConfluenceApproval() {
  console.log('\n📋 Test 3: Confluence承認状態確認');
  console.log('='.repeat(60));

  try {
    // 環境変数チェック
    const hasConfig = process.env.ATLASSIAN_URL &&
                      process.env.ATLASSIAN_EMAIL &&
                      process.env.ATLASSIAN_API_TOKEN;

    if (!hasConfig) {
      console.log('⚠️  Confluence認証情報が設定されていません');
      console.log('   以下の環境変数を設定すると、実際のAPIテストが可能です:');
      console.log('   - ATLASSIAN_URL');
      console.log('   - ATLASSIAN_EMAIL');
      console.log('   - ATLASSIAN_API_TOKEN');
      console.log('   - CONFLUENCE_TEST_PAGE_ID (テスト用ページID)');
      return false;
    }

    const testPageId = process.env.CONFLUENCE_TEST_PAGE_ID;
    if (!testPageId) {
      console.log('⚠️  CONFLUENCE_TEST_PAGE_ID が設定されていません');
      console.log('   実際のページIDを設定すると、承認状態の確認テストが可能です');
      return false;
    }

    console.log('\n✅ Confluence承認状態を確認します...');
    const config = {
      url: process.env.ATLASSIAN_URL!,
      email: process.env.ATLASSIAN_EMAIL!,
      apiToken: process.env.ATLASSIAN_API_TOKEN!
    };

    const status = await getApprovalStatus(testPageId, config);

    console.log('\n📊 承認状態:');
    console.log(`  ページID: ${status.pageId}`);
    console.log(`  ページタイトル: ${status.pageTitle}`);
    console.log(`  承認済み: ${status.approved ? '✅ はい' : '❌ いいえ'}`);
    console.log(`  承認者: ${status.approvers.join(', ') || 'なし'}`);

    return true;
  } catch (error: any) {
    console.error('❌ Confluence承認状態確認エラー:', error.message);
    return false;
  }
}

// メイン実行
async function main() {
  console.log('\n🚀 新規実装機能の動作確認');
  console.log('='.repeat(60));

  const results = {
    testRunner: false,
    releaseNotes: false,
    confluenceApproval: false
  };

  // Test 1: テストランナー
  results.testRunner = await testTestRunner();

  // Test 2: リリースノート生成
  results.releaseNotes = await testReleaseNotesGenerator();

  // Test 3: Confluence承認状態確認
  results.confluenceApproval = await testConfluenceApproval();

  // サマリー
  console.log('\n\n📊 動作確認サマリー');
  console.log('='.repeat(60));
  console.log(`1. テスト実行とレポート生成: ${results.testRunner ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`2. リリースノート生成: ${results.releaseNotes ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`3. Confluence承認状態確認: ${results.confluenceApproval ? '✅ 成功' : '⚠️  スキップ（環境変数未設定）'}`);

  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n合計: ${successCount}/3 テスト成功`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ 動作確認エラー:', error.message);
    process.exit(1);
  });
