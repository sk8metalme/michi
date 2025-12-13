import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Vitest 4: dist/内のテストファイルを除外
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/scripts/setup-*.ts',
        '**/scripts/setup-*.sh',
        '**/scripts/setup-interactive.ts',
        // 統合テスト中心のファイル（E2Eテストでカバーされる）
        'scripts/phase-runner.ts',
        'src/commands/init.ts',
        'src/commands/setup-existing.ts',
        'scripts/confluence-sync.ts',
        'scripts/jira-sync.ts',
        'scripts/spec-orchestrator.ts',
        'scripts/preflight-check.ts',
        'scripts/list-projects.ts',
        'scripts/spec-dashboard.ts',
        'scripts/update-confluence.ts',
        'scripts/update-phase.ts',
        'scripts/spec-impl-workflow.ts',
        // ユーティリティ系で統合テスト中心またはE2Eで十分カバーされるファイル
        'scripts/utils/config-sections.ts',
        'scripts/utils/choice-approval.ts',
        'scripts/utils/epic-hierarchy.ts',
        'scripts/utils/native-helpers.ts',
        'scripts/utils/phase-detector.ts',
        'scripts/utils/markdown-parser.ts',
        'scripts/utils/project-finder.ts',
        'scripts/utils/spec-generator.ts',
        // CLIエントリーポイント（統合テストでカバー）
        'src/cli.ts',
      ],
      thresholds: {
        // v0.5.0: カバレッジ大幅改善 (28% → 50%)
        // ユニットテスト可能な部分に焦点を当て、段階的に向上
        // 統合テスト中心のファイルは除外リストで管理
        // 実際のカバレッジ: 49.97% (2025-12-14時点)
        lines: 49,
        functions: 49,
        branches: 49,
        statements: 49,
      },
    },
  },
});

