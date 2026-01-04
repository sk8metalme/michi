# Version 0.22.0 - Multi-Language Support & Directory Migration

We're excited to announce Version 0.22.0 with significant improvements to quality infrastructure and command structure!

## 🚀 Highlights

### Multi-Language Quality Infrastructure Checks

Extended quality infrastructure checks to support **Java, Python, and PHP** projects in addition to Node.js:

- **Java**: NullAway, Spotless, ArchUnit
- **Python**: ruff/black, mypy strict, import-linter
- **PHP**: PHPStan, PHP-CS-Fixer, deptrac
- **Node.js**: husky, lint-staged, TypeScript strict, tsarch

With robust parsers (jq, Python TOML) and graceful grep fallbacks for maximum compatibility.

### New `/michi:*` Command Suite

8 new command wrappers providing a complete abstraction layer:

- `/michi:spec-init` - Initialize new specification
- `/michi:spec-requirements` - Generate requirements document
- `/michi:spec-design` - Create design document
- `/michi:spec-tasks` - Generate implementation tasks
- `/michi:spec-impl` - TDD implementation with 5-phase quality automation
- `/michi:validate-design` - Interactive design validation
- `/michi:validate-impl` - Validate implementation against requirements
- `/michi:validate-gap` - Analyze implementation gap

## 💥 Breaking Changes

### Directory Structure Migration

- `.kiro/` → `.michi/` directory structure
- `KIRO_DIR` → `SPEC_DIR` variable naming
- Path aliases `@kiro/*` → `@spec/*`

**Migration is automatic** - a warning message will appear if legacy `.kiro/config.json` is detected.

## 📖 Migration Guide

### For Existing Users

**1. Directory Migration**
```bash
# Automatic migration on first use
# Warning message will appear if .kiro/config.json detected
```

**2. Command Updates**
- Prefer `/michi:*` commands over `/kiro:*` for Michi-specific features
- `/kiro:*` base commands remain available for cc-sdd compatibility

**3. Path Aliases**
- Update custom code from `@kiro/*` to `@spec/*` if using TypeScript path aliases

## 🐛 Bug Fixes

### CodeRabbit Review Comments - Critical

- **Line 316-322**: Initialize variables before language blocks to prevent errors when language is unknown/unsupported
  - Ensures Step 4 (result display) never fails due to uninitialized variables

### CodeRabbit Review Comments - Major

- **Java quality tool detection**: Enhanced NullAway, Spotless, ArchUnit detection
  - Check multiple dependency declaration patterns (Maven groupId/artifactId, Gradle)
  - Handle both pom.xml and build.gradle/build.gradle.kts
  - Exclude comments and use case-insensitive matching

- **PHP quality tool detection**: Use jq parser for composer.json
  - Parse .require and .require-dev with jq
  - Graceful fallback to grep if jq unavailable

### Package Name Correction

- Fixed incorrect package name `ts-arch-kit` → `tsarch`

### Markdown & Documentation Fixes

- Added language specifiers to all code blocks (MD040)
- Fixed broken links to gitignored `.michi/` files
- Updated user-facing error messages from `/kiro:` to `/michi:`

## 📊 Quality Metrics

- **Tests**: 1,022/1,027 passing (99.5% pass rate)
- **Architecture**: Validated with tsarch
- **Type Safety**: 0 TypeScript errors
- **Lint**: 0 ESLint warnings

## 🔗 Related PRs

- #170 - Multi-language quality infrastructure checks
- #169 - Complete migration to /michi commands and .michi directory
- #167 - Part of /michi migration
- #164 - Part of /michi migration
- #171 - PR review comments addressing

## 📚 Full Changelog

See [CHANGELOG.md](https://github.com/sk8metalme/michi/blob/main/CHANGELOG.md) for complete details.

## 🙏 Contributors

This release includes contributions from automated code review by CodeRabbit and thorough testing.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
