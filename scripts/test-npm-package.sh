#!/bin/bash

# Michi NPM Package Test Script
# NPMパッケージとしてインストールした状態での動作確認を実施

set -e  # エラー時に即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/..)" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Michi NPM Package Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# テストディレクトリ名（デフォルト）
DEFAULT_TEST_DIR="/tmp/michi-test-$(date +%s)"
TEST_DIR="${1:-$DEFAULT_TEST_DIR}"

# パッケージファイル名（後で設定）
PACKAGE_FILE=""

# クリーンアップ関数
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"

  # パッケージファイルの削除
  if [ -n "$PACKAGE_FILE" ] && [ -f "$PROJECT_ROOT/$PACKAGE_FILE" ]; then
    rm -f "$PROJECT_ROOT/$PACKAGE_FILE"
    echo -e "${GREEN}✓ Package file removed: $PACKAGE_FILE${NC}"
  fi

  # テストディレクトリの削除
  if [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}✓ Test directory removed: $TEST_DIR${NC}"
  fi
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
# Step 1: パッケージのビルド
# ========================================
echo_step "Building Package"
if npm run build; then
  echo_success "Build succeeded"
else
  echo_error "Build failed"
  exit 1
fi

# ========================================
# Step 2: npm pack でパッケージを作成
# ========================================
echo_step "Creating NPM Package (npm pack)"

# npm pack を実行してパッケージファイル名を取得
PACKAGE_FILE=$(npm pack 2>&1 | tail -n 1)

if [ -f "$PROJECT_ROOT/$PACKAGE_FILE" ]; then
  echo_success "Package created: $PACKAGE_FILE"
  echo_info "Package size: $(du -h "$PROJECT_ROOT/$PACKAGE_FILE" | cut -f1)"
else
  echo_error "Package creation failed"
  exit 1
fi

# ========================================
# Step 3: テストディレクトリの作成
# ========================================
echo_step "Creating Test Directory: $TEST_DIR"

if mkdir -p "$TEST_DIR"; then
  echo_success "Test directory created"
  cd "$TEST_DIR"
else
  echo_error "Failed to create test directory"
  exit 1
fi

# ========================================
# Step 4: パッケージのインストール
# ========================================
echo_step "Installing Package in Test Directory"

# package.jsonを作成（npm installに必要）
cat > package.json <<EOF
{
  "name": "michi-test",
  "version": "1.0.0",
  "description": "Test environment for Michi package",
  "private": true
}
EOF

# ローカルパッケージをインストール
if npm install "$PROJECT_ROOT/$PACKAGE_FILE"; then
  echo_success "Package installed successfully"
else
  echo_error "Package installation failed"
  exit 1
fi

# ========================================
# Step 5: .kiro ディレクトリ構造の準備
# ========================================
echo_step "Setting up .kiro directory structure"

mkdir -p .kiro/specs/test-feature

# 最小限のspec.jsonを作成
cat > .kiro/specs/test-feature/spec.json <<EOF
{
  "feature": "test-feature",
  "description": "Test feature for package verification",
  "status": "draft",
  "milestones": {},
  "confluence": {},
  "jira": {}
}
EOF

# requirements.md
cat > .kiro/specs/test-feature/requirements.md <<EOF
# Requirements: test-feature

This is a test feature for package verification.
EOF

# design.md
cat > .kiro/specs/test-feature/design.md <<EOF
# Design: test-feature

This is a test feature for package verification.
EOF

# tasks.md（新ワークフロー構造）
cat > .kiro/specs/test-feature/tasks.md <<EOF
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

echo_success ".kiro directory structure created"

# ========================================
# Step 6: CLIコマンドの動作確認
# ========================================
echo_step "Testing CLI Commands"

# michi コマンドのパスを取得
MICHI_CMD="$TEST_DIR/node_modules/.bin/michi"

if [ ! -f "$MICHI_CMD" ]; then
  echo_error "michi command not found at $MICHI_CMD"
  exit 1
fi

echo_info "Testing phase:run commands..."

# Phase 0.3-0.4: test planning is now handled by AI command /michi:test-planning
# (CLI commands removed)

# Phase 1: environment-setup
echo_info "Testing phase:run environment-setup"
if "$MICHI_CMD" phase:run test-feature environment-setup > /dev/null 2>&1; then
  echo_success "phase:run environment-setup succeeded"
else
  echo_error "phase:run environment-setup failed"
  exit 1
fi

# Phase A: phase-a
echo_info "Testing phase:run phase-a"
if "$MICHI_CMD" phase:run test-feature phase-a > /dev/null 2>&1; then
  echo_success "phase:run phase-a succeeded"
else
  echo_error "phase:run phase-a failed"
  exit 1
fi

# Phase B: phase-b
echo_info "Testing phase:run phase-b"
if "$MICHI_CMD" phase:run test-feature phase-b > /dev/null 2>&1; then
  echo_success "phase:run phase-b succeeded"
else
  echo_error "phase:run phase-b failed"
  exit 1
fi

# ========================================
# Step 7: バリデーションの確認
# ========================================
echo_step "Testing Validation Commands"

echo_info "Testing validate:phase commands..."

# Phase 0.3-0.4: validation removed (test planning is now handled by AI command)

# Phase 1
echo_info "Validating environment-setup"
if "$MICHI_CMD" validate:phase test-feature environment-setup > /dev/null 2>&1; then
  echo_success "validate:phase environment-setup succeeded"
else
  echo_error "validate:phase environment-setup failed"
  exit 1
fi

# Phase A
echo_info "Validating phase-a"
if "$MICHI_CMD" validate:phase test-feature phase-a > /dev/null 2>&1; then
  echo_success "validate:phase phase-a succeeded"
else
  echo_error "validate:phase phase-a failed"
  exit 1
fi

# Phase B
echo_info "Validating phase-b"
if "$MICHI_CMD" validate:phase test-feature phase-b > /dev/null 2>&1; then
  echo_success "validate:phase phase-b succeeded"
else
  echo_error "validate:phase phase-b failed"
  exit 1
fi

# ========================================
# Step 8: CLIヘルプの確認
# ========================================
echo_step "Testing CLI Help Messages"

echo_info "Testing phase:run help"
if "$MICHI_CMD" phase:run 2>&1 | grep -q "Available Phases"; then
  echo_success "phase:run help message OK"
else
  echo_error "phase:run help message missing"
  exit 1
fi

echo_info "Testing validate:phase help"
if "$MICHI_CMD" validate:phase 2>&1 | grep -q "Available Phases"; then
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
echo -e "${GREEN}✓ All NPM Package Tests Passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ✓ Package built and created successfully"
echo -e "  ✓ Package installed in clean environment: $TEST_DIR"
echo -e "  ✓ All phase:run commands working"
echo -e "  ✓ All validate:phase commands working"
echo -e "  ✓ CLI help messages OK"
echo ""
echo -e "${GREEN}Package is ready for npm publish!${NC}"
echo ""
