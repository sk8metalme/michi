# Michi CI/CD設定ガイド - PHP

**親ドキュメント**: [ci-setup.md](./ci-setup.md)

---

## PHP プロジェクトのCI/CD設定

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
        php-version: ['8.1', '8.2', '8.3']

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php-version }}
          coverage: xdebug
          tools: composer:v2

      - name: Cache Composer packages
        uses: actions/cache@v3
        with:
          path: vendor
          key: ${{ runner.os }}-php-${{ hashFiles('**/composer.lock') }}
          restore-keys: |
            ${{ runner.os }}-php-

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: Run PHPStan
        run: composer phpstan

      - name: Run tests
        run: composer test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.php-version == '8.3'
        with:
          files: ./coverage.xml
```

### Screwdriver設定例

**設定ファイル例**: `screwdriver.yaml`

```yaml
shared:
  image: php:8.3

jobs:
  main:
    requires: [~pr, ~commit]
    steps:
      - install-composer: |
          php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
          php composer-setup.php
          php -r "unlink('composer-setup.php');"
      - install: php composer.phar install --prefer-dist --no-progress
      - phpstan: php composer.phar phpstan
      - test: php composer.phar test
```

### composer.json設定

```json
{
  "scripts": {
    "test": "phpunit --coverage-clover coverage.xml",
    "test:unit": "phpunit --testsuite Unit",
    "phpstan": "phpstan analyse src tests --level=8",
    "cs-fix": "php-cs-fixer fix"
  },
  "require-dev": {
    "phpunit/phpunit": "^10.0",
    "phpstan/phpstan": "^1.10",
    "friendsofphp/php-cs-fixer": "^3.0"
  }
}
```

