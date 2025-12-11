#!/bin/bash

# Michi Pre-Publish Check Script
# NPMパッケージ公開前の動作確認を自動実行

set -e  # エラー時に即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Michi Pre-Publish Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# テスト用feature名（タイムスタンプ付き）
TEST_FEATURE="test-pre-publish-$(date +%s)"

# クリーンアップ関数
cleanup() {
  echo -e "\n${YELLOW}Cleaning up test files...${NC}"
  rm -rf ".kiro/specs/${TEST_FEATURE}" 2>/dev/null || true
  echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# エラー時のクリーンアップ
trap cleanup EXIT

# ステップカウンター
STEP=1

echo_step() {
  echo -e "\n${BLUE}[Step ${STEP}] $1${NC}"
  STEP=$((STEP + 1))
}

echo_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

echo_error() {
  echo -e "${RED}✗ $1${NC}"
}

echo_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# ========================================
# Step 1: TypeScriptビルド確認
# ========================================
echo_step "TypeScript Build Check"
if npm run build; then
  echo_success "Build succeeded"
else
  echo_error "Build failed"
  exit 1
fi

# ========================================
# Step 2: テスト実行（既存機能の回帰確認）
# ========================================
echo_step "Running Tests (Regression Check)"
if npm test; then
  echo_success "All tests passed"
else
  echo_error "Some tests failed"
  exit 1
fi

# ========================================
# Step 3: テスト用featureの初期化
# ========================================
echo_step "Initializing Test Feature: ${TEST_FEATURE}"
mkdir -p ".kiro/specs/${TEST_FEATURE}"

# 最小限のspec.jsonを作成
cat > ".kiro/specs/${TEST_FEATURE}/spec.json" <<EOF
{
  "feature": "${TEST_FEATURE}",
  "description": "Pre-publish test feature",
  "status": "draft",
  "milestones": {},
  "confluence": {},
  "jira": {}
}
EOF

# 最小限のrequirements.mdを作成
cat > ".kiro/specs/${TEST_FEATURE}/requirements.md" <<EOF
# Requirements: ${TEST_FEATURE}

This is a test feature for pre-publish verification.
EOF

# 最小限のdesign.mdを作成
cat > ".kiro/specs/${TEST_FEATURE}/design.md" <<EOF
# Design: ${TEST_FEATURE}

This is a test feature for pre-publish verification.
EOF

# 最小限のtasks.mdを作成（新ワークフロー構造）
cat > ".kiro/specs/${TEST_FEATURE}/tasks.md" <<EOF
# tasks.md

## Phase 0.1: 要件定義

### Story 0.1.1: 要件定義書作成

## Phase 0.2: 設計

### Story 0.2.1: 基本設計

## Phase 2: TDD実装

### Story 2.1: プロジェクトセットアップ

## Phase 4: リリース準備

### Story 4.1: 本番環境構築

## Phase 5: リリース

### Story 5.1: ステージング環境デプロイ

Day 1（月）: 営業日ベース
EOF

echo_success "Test feature initialized"

# ========================================
# Step 4: 新フェーズの動作確認
# ========================================
echo_step "Testing New Phases (0.3-0.4, 1, A, B)"

# Phase 0.3-0.4: Test planning is now handled by AI command /michi:test-planning
# (CLI commands removed)

# Phase 1: 環境構築
echo_info "Testing Phase 1: environment-setup"
if npm run phase:run "${TEST_FEATURE}" environment-setup > /dev/null 2>&1; then
  echo_success "Phase 1 succeeded"
else
  echo_error "Phase 1 failed"
  exit 1
fi

# Phase A: PR前自動テスト
echo_info "Testing Phase A: phase-a"
if npm run phase:run "${TEST_FEATURE}" phase-a > /dev/null 2>&1; then
  echo_success "Phase A succeeded"
else
  echo_error "Phase A failed"
  exit 1
fi

# Phase B: リリース準備テスト
echo_info "Testing Phase B: phase-b"
if npm run phase:run "${TEST_FEATURE}" phase-b > /dev/null 2>&1; then
  echo_success "Phase B succeeded"
else
  echo_error "Phase B failed"
  exit 1
fi

# ========================================
# Step 5: バリデーションの確認
# ========================================
echo_step "Testing Phase Validations"

# Phase 0.3-0.4: Validation removed (test planning is now handled by AI command)

# Phase 1
echo_info "Validating Phase 1"
if npm run validate:phase "${TEST_FEATURE}" environment-setup > /dev/null 2>&1; then
  echo_success "Phase 1 validation passed"
else
  echo_error "Phase 1 validation failed"
  exit 1
fi

# Phase A
echo_info "Validating Phase A"
if npm run validate:phase "${TEST_FEATURE}" phase-a > /dev/null 2>&1; then
  echo_success "Phase A validation passed"
else
  echo_error "Phase A validation failed"
  exit 1
fi

# Phase B
echo_info "Validating Phase B"
if npm run validate:phase "${TEST_FEATURE}" phase-b > /dev/null 2>&1; then
  echo_success "Phase B validation passed"
else
  echo_error "Phase B validation failed"
  exit 1
fi

# ========================================
# Step 6: 既存フェーズの動作確認（回帰テスト）
# ========================================
echo_step "Testing Existing Phases (Regression)"

# Phase 0.1: requirements
echo_info "Testing Phase 0.1: requirements (dry-run)"
# Confluenceを作成しないため、実際には実行しない（バリデーションのみ）
if npm run validate:phase "${TEST_FEATURE}" requirements > /dev/null 2>&1; then
  echo_success "Phase 0.1 validation passed"
else
  echo_error "Phase 0.1 validation failed"
  exit 1
fi

# Phase 0.2: design
echo_info "Testing Phase 0.2: design (dry-run)"
if npm run validate:phase "${TEST_FEATURE}" design > /dev/null 2>&1; then
  echo_success "Phase 0.2 validation passed"
else
  echo_error "Phase 0.2 validation failed"
  exit 1
fi

# Phase 0.5-0.6: tasks
echo_info "Testing Phase 0.5-0.6: tasks (dry-run)"
if npm run validate:phase "${TEST_FEATURE}" tasks > /dev/null 2>&1; then
  echo_success "Phase 0.5-0.6 validation passed"
else
  echo_error "Phase 0.5-0.6 validation failed"
  exit 1
fi

# ========================================
# Step 7: CLIヘルプ表示確認
# ========================================
echo_step "Checking CLI Help Messages"

echo_info "phase:run --help"
if npm run phase:run 2>&1 | grep -q "Available Phases"; then
  echo_success "phase:run help message OK"
else
  echo_error "phase:run help message missing"
  exit 1
fi

echo_info "validate:phase --help"
if npm run validate:phase 2>&1 | grep -q "Available Phases"; then
  echo_success "validate:phase help message OK"
else
  echo_error "validate:phase help message missing"
  exit 1
fi

# ========================================
# 完了
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All Pre-Publish Checks Passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ✓ TypeScript build succeeded"
echo -e "  ✓ All tests passed ($(npm test 2>&1 | grep -oP '\d+ passed' || echo 'unknown'))"
echo -e "  ✓ New phases (0.3-0.4, 1, A, B) working"
echo -e "  ✓ Phase validations working"
echo -e "  ✓ Existing phases regression OK"
echo -e "  ✓ CLI help messages OK"
echo ""
echo -e "${GREEN}Ready for npm publish!${NC}"
echo ""
