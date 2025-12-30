/**
 * Multi-Repo Command Registration
 *
 * Registers all Multi-Repo related commands
 * TODO: Migrate handler logic to use cases in Phase 5, Task 6.4
 */

import { Command } from 'commander';

/**
 * Register multi-repo commands
 */
export function registerMultiRepoCommands(program: Command): void {
  program
    .command('multi-repo:init')
    .description('Initialize new Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption('--jira <KEY>', 'JIRA project key (2-10 uppercase letters)')
    .requiredOption('--confluence-space <SPACE>', 'Confluence space key')
    .action(
      async (
        projectName: string,
        options: { jira: string; confluenceSpace: string },
      ) => {
        try {
          const { multiRepoInit } = await import(
            '../../../commands/multi-repo-init.js'
          );
          const result = await multiRepoInit(
            projectName,
            options.jira,
            options.confluenceSpace,
          );

          console.log('');
          console.log('✅ Multi-Repoプロジェクトの初期化が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   JIRAキー: ${result.jiraKey}`);
          console.log(`   Confluenceスペース: ${result.confluenceSpace}`);
          console.log(
            `   作成されたディレクトリ数: ${result.createdDirectories.length}`,
          );
          console.log(`   作成されたファイル数: ${result.createdFiles.length}`);
          console.log('');
          console.log(
            `📁 プロジェクトディレクトリ: docs/michi/${result.projectName}/`,
          );
          console.log('');
        } catch (error) {
          handleError('Multi-Repoプロジェクトの初期化に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:add-repo')
    .description('Add repository to Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption('--name <repo-name>', 'Repository name')
    .requiredOption('--url <URL>', 'Repository URL (GitHub HTTPS format)')
    .option('--branch <branch>', 'Branch name (default: main)', 'main')
    .action(
      async (
        projectName: string,
        options: { name: string; url: string; branch: string },
      ) => {
        try {
          const { multiRepoAddRepo } = await import(
            '../../../commands/multi-repo-add-repo.js'
          );
          const result = await multiRepoAddRepo(
            projectName,
            options.name,
            options.url,
            options.branch,
          );

          console.log('');
          console.log('✅ リポジトリの追加が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   リポジトリ名: ${result.repositoryName}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   ブランチ: ${result.branch}`);
          console.log('');
        } catch (error) {
          handleError('リポジトリの追加に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:list')
    .description('List Multi-Repo projects')
    .action(async () => {
      try {
        const { multiRepoList } = await import(
          '../../../commands/multi-repo-list.js'
        );
        const result = await multiRepoList();

        console.log('');
        if (result.totalCount === 0) {
          console.log('Multi-Repoプロジェクトは登録されていません');
          console.log('');
          return;
        }

        console.log(`Multi-Repoプロジェクト一覧 (${result.totalCount}件)`);
        console.log('');

        result.projects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   JIRA Key: ${project.jiraKey}`);
          console.log(`   リポジトリ数: ${project.repositoryCount}`);
          console.log(`   作成日時: ${project.createdAt}`);
          console.log('');
        });
      } catch (error) {
        handleError('プロジェクト一覧の取得に失敗しました', error);
      }
    });

  program
    .command('multi-repo:ci-status')
    .description('Aggregate CI results for Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .option('--diff', 'Show diff with previous results')
    .action(
      async (projectName: string, options: { diff?: boolean }) => {
        try {
          const { multiRepoCIStatus } = await import(
            '../../../commands/multi-repo-ci-status.js'
          );
          const result = await multiRepoCIStatus(projectName, {
            diff: options.diff,
          });

          console.log('');
          console.log('✅ CI結果の集約が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   リポジトリ数: ${result.summary.total}`);
          console.log(`   成功: ${result.summary.success}`);
          console.log(`   失敗: ${result.summary.failure}`);
          console.log(`   実行中: ${result.summary.running}`);
          console.log(`   不明: ${result.summary.unknown}`);
          console.log('');
          console.log(`📄 出力ファイル: ${result.outputPath}`);
          console.log('');

          if (result.diff) {
            console.log('📊 差分情報:');
            if (result.diff.newFailures.length > 0) {
              console.log(
                `   🆕 新規失敗: ${result.diff.newFailures.join(', ')}`,
              );
            }
            if (result.diff.newSuccesses.length > 0) {
              console.log(
                `   ✨ 新規成功: ${result.diff.newSuccesses.join(', ')}`,
              );
            }
            if (result.diff.unchanged.length > 0) {
              console.log(
                `   ➖ 変化なし: ${result.diff.unchanged.length}件`,
              );
            }
            console.log('');
          }
        } catch (error) {
          handleError('CI結果の集約に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:confluence-sync')
    .description('Sync Multi-Repo project documents to Confluence')
    .argument('<project-name>', 'Project name')
    .option(
      '--doc-type <type>',
      'Document type to sync (requirements, architecture, sequence, strategy, ci-status, release-notes)',
    )
    .action(
      async (
        projectName: string,
        options: { docType?: string },
      ) => {
        try {
          const { multiRepoConfluenceSync } = await import(
            '../../../commands/multi-repo-confluence-sync.js'
          );
          const result = await multiRepoConfluenceSync(projectName, {
            docType: options.docType as
              | 'requirements'
              | 'architecture'
              | 'sequence'
              | 'strategy'
              | 'ci-status'
              | 'release-notes'
              | undefined,
          });

          console.log('');
          console.log('✅ Confluence同期が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   成功: ${result.totalSuccess}件`);
          console.log(`   失敗: ${result.totalFailed}件`);
          console.log('');

          result.syncedDocs.forEach((doc) => {
            if (doc.success) {
              console.log(`✅ ${doc.docType}: ${doc.pageUrl}`);
            } else {
              console.log(`❌ ${doc.docType}: ${doc.error}`);
            }
          });
          console.log('');
        } catch (error) {
          handleError('Confluence同期に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:test')
    .description('Run tests for Multi-Repo project')
    .argument('<project-name>', 'Project name')
    .requiredOption(
      '--type <type>',
      'Test type (e2e, integration, performance)',
    )
    .option('--skip-health-check', 'Skip health check before test execution')
    .action(
      async (
        projectName: string,
        options: { type: string; skipHealthCheck?: boolean },
      ) => {
        try {
          const { multiRepoTest } = await import(
            '../../../commands/multi-repo-test.js'
          );
          const result = await multiRepoTest(projectName, options.type, {
            skipHealthCheck: options.skipHealthCheck,
          });

          console.log('');
          if (result.success) {
            console.log('✅ テスト実行が完了しました');
          } else {
            console.log('❌ テスト実行が失敗しました');
          }
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   テストタイプ: ${result.testType}`);
          console.log(`   終了コード: ${result.executionResult.exitCode}`);
          console.log(
            `   実行時間: ${result.executionResult.executionTime.toFixed(2)}秒`,
          );
          console.log('');
          console.log(`📄 出力ファイル: ${result.executionResult.outputPath}`);
          console.log('');

          if (result.healthCheckWarning) {
            console.log('⚠️  ヘルスチェック警告:');
            console.log(`   ${result.healthCheckWarning}`);
            console.log('');
          }

          process.exit(result.success ? 0 : 1);
        } catch (error) {
          handleError('テスト実行に失敗しました', error);
        }
      },
    );

  program
    .command('multi-repo:sync')
    .description('Sync Multi-Repo project documentation to Confluence')
    .argument('<project-name>', 'Project name')
    .option(
      '--doc-type <type>',
      'Document type (requirements, architecture, sequence, strategy, ci-status, release-notes)',
    )
    .action(
      async (projectName: string, options: { docType?: string }) => {
        try {
          const { multiRepoConfluenceSync } = await import(
            '../../../commands/multi-repo-confluence-sync.js'
          );
          const result = await multiRepoConfluenceSync(projectName, {
            docType: options.docType as
              | 'requirements'
              | 'architecture'
              | 'sequence'
              | 'strategy'
              | 'ci-status'
              | 'release-notes'
              | undefined,
          });

          console.log('');
          console.log('✅ Confluence同期が完了しました');
          console.log('');
          console.log(`   プロジェクト名: ${result.projectName}`);
          console.log(`   成功: ${result.totalSuccess}`);
          console.log(`   失敗: ${result.totalFailed}`);
          console.log('');

          if (result.totalSuccess > 0) {
            console.log('📄 同期されたドキュメント:');
            result.syncedDocs
              .filter((d) => d.success)
              .forEach((doc) => {
                console.log(`   ✅ ${doc.docType}: ${doc.pageUrl}`);
              });
            console.log('');
          }

          if (result.totalFailed > 0) {
            console.log('❌ 同期に失敗したドキュメント:');
            result.syncedDocs
              .filter((d) => !d.success)
              .forEach((doc) => {
                console.log(`   ❌ ${doc.docType}: ${doc.error}`);
              });
            console.log('');
          }

          process.exit(result.totalFailed > 0 ? 1 : 0);
        } catch (error) {
          handleError('Confluence同期に失敗しました', error);
        }
      },
    );
}

/**
 * Handle command errors
 */
function handleError(message: string, error: unknown): never {
  console.error(
    `❌ ${message}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
