# Code Size Rules

## Threshold

| Metric | Value |
|--------|-------|
| Maximum Diff Lines | 500 lines |
| Warning Threshold | 400 lines |

## Target Paths
- src/
- scripts/
- test/
- tests/

## Exclusion Patterns (Lock Files)
- package-lock.json, yarn.lock, pnpm-lock.yaml
- composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock
- Cargo.lock, go.sum

## Exclusion Patterns (Generated Files)
- *.min.js, *.min.css, *.map
- dist/*, build/*, coverage/*, .next/*
- *.d.ts, *.generated.ts, `__snapshots__/*`

## Status Indicators

| Status | Condition |
|--------|-----------|
| ✅ OK | diff < 400 lines |
| ⚠️ Warning | 400 <= diff < 500 lines |
| ❌ Exceeded | diff >= 500 lines |
