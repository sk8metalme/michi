#!/bin/bash
# Michi Global Settings Setup Script
# Usage: bash scripts/setup.sh [--force]

set -e

MICHI_GLOBAL_DIR="$HOME/.michi"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: bash scripts/setup.sh [--force]"
      exit 1
      ;;
  esac
done

echo "=== Michi Global Settings Setup ==="
echo "Plugin directory: $PLUGIN_DIR"
echo "Target directory: $MICHI_GLOBAL_DIR/settings/"
echo ""

# Check if settings already exist
if [ -d "$MICHI_GLOBAL_DIR/settings" ] && [ "$FORCE" = false ]; then
  echo "⚠️  Global settings already exist at $MICHI_GLOBAL_DIR/settings/"
  echo "   Use --force to overwrite"
  exit 0
fi

# Create global settings directory
echo "📁 Creating directory: $MICHI_GLOBAL_DIR/settings/"
mkdir -p "$MICHI_GLOBAL_DIR/settings"

# Copy settings from plugin
echo "📋 Copying settings files..."
cp -r "$PLUGIN_DIR/settings/"* "$MICHI_GLOBAL_DIR/settings/"

# Verify installation
if [ -f "$MICHI_GLOBAL_DIR/settings/version.json" ]; then
  VERSION=$(grep -o '"version": "[^"]*"' "$MICHI_GLOBAL_DIR/settings/version.json" | cut -d'"' -f4)
  echo ""
  echo "✅ Michi global settings installed successfully!"
  echo "   Version: $VERSION"
  echo "   Location: $MICHI_GLOBAL_DIR/settings/"
  echo ""
  echo "📚 Settings include:"
  echo "   - 9 rule files (EARS, design principles, etc.)"
  echo "   - 4 spec templates (requirements, design, research, tasks)"
  echo "   - Master document templates"
else
  echo ""
  echo "❌ Installation failed: version.json not found"
  exit 1
fi
