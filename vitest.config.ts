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
      ],
      thresholds: {
        // 段階的に引き上げる計画（Phase 1: 10% → Phase 2: 30% → Phase 3: 60% → Phase 4: 80%）
        // 主要機能のテスト追加により30%を目標
        lines: 30,
        functions: 25,
        branches: 20,
        statements: 30,
      },
    },
  },
});

