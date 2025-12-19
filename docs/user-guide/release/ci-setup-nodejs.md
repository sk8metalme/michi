# Michi CI/CD設定ガイド - Node.js/TypeScript

**親ドキュメント**: [ci-setup.md](./ci-setup.md)

---

## Node.js/TypeScript プロジェクトのCI/CD設定

### GitHub Actions設定例

**設定ファイル例**: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v5.5.1
        if: matrix.node-version == '20.x'
        with:
          files: ./coverage/coverage-final.json
```

### Screwdriver設定例

**設定ファイル例**: `screwdriver.yaml`

```yaml
shared:
  image: node:20

jobs:
  main:
    requires: [~pr, ~commit]
    steps:
      - install: npm ci
      - lint: npm run lint
      - test: npm test
      - build: npm run build
      - coverage: |
          if [ -d "coverage" ]; then
            echo "Coverage report generated"
          fi
```

### package.jsonスクリプト設定

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "build": "tsc",
    "type-check": "tsc --noEmit"
  }
}
```

