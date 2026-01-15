# コードサイズルール

## 閾値

| 指標 | 値 |
|------|-----|
| 最大差分行数 | 500行 |
| 警告閾値 | 400行 |

## 対象パス
- src/
- scripts/
- test/
- tests/

## 除外パターン（ロックファイル）
- package-lock.json, yarn.lock, pnpm-lock.yaml
- composer.lock, Gemfile.lock, poetry.lock, Pipfile.lock
- Cargo.lock, go.sum

## 除外パターン（生成ファイル）
- *.min.js, *.min.css, *.map
- dist/*, build/*, coverage/*, .next/*
- *.d.ts, *.generated.ts, `__snapshots__/*`

## ステータス表示

| ステータス | 条件 |
|-----------|------|
| ✅ OK | 差分 < 400行 |
| ⚠️ 警告 | 400 <= 差分 < 500行 |
| ❌ 超過 | 差分 >= 500行 |
