# CI/CD設定

このドキュメントでは、michiを使用したプロジェクトでのCI/CD（継続的インテグレーション/継続的デリバリー）設定について説明します。

## michiのCI/CD方針

michiでは、**Phase Aのテスト（単体テスト、Lint、ビルド）のみをCI/CDで自動実行**します。

### CI/CDで実行されるもの

| テストタイプ | 実行タイミング | CI/CDで自動実行 |
|------------|--------------|---------------|
| 単体テスト | Phase A（PR前） | ✅ はい |
| Lint | Phase A（PR前） | ✅ はい |
| ビルド | Phase A（PR前） | ✅ はい |
| 統合テスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| E2Eテスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| パフォーマンステスト | Phase B（リリース準備時） | ❌ いいえ（手動） |
| セキュリティテスト | Phase B（リリース準備時） | ❌ いいえ（手動） |

**理由**:
- Phase Aは高速実行が必要（数分以内）
- Phase Bは時間がかかる（数十分〜数時間）
- Phase Bは本番環境に近い状態での検証が必要

## 対応CI/CDツール

michiは以下のCI/CDツールをサポートしています：

### 1. GitHub Actions（推奨）

- **対象**: GitHubホストのリポジトリ
- **メリット**: GitHubとの統合が容易、無料枠が充実
- **設定ファイル**: `.github/workflows/`

### 2. Screwdriver

- **対象**: オープンソースのCI/CDツールを使用したいプロジェクト
- **メリット**: 高いカスタマイズ性、柔軟なパイプライン設定
- **設定ファイル**: `screwdriver.yaml`

## Node.js/TypeScript プロジェクトのCI/CD設定

### GitHub Actions設定例

**.github/workflows/test.yml**

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
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '20.x'
        with:
          files: ./coverage/coverage-final.json
```

### Screwdriver設定例

**screwdriver.yaml**

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

## Java（Gradle）プロジェクトのCI/CD設定

### GitHub Actions設定例

**.github/workflows/test.yml**

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
        java-version: [17, 21]

    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ matrix.java-version }}
          cache: 'gradle'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run checkstyle
        run: ./gradlew checkstyleMain checkstyleTest

      - name: Run tests
        run: ./gradlew test

      - name: Build
        run: ./gradlew build

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: build/reports/tests/test/
```

### Screwdriver設定例

**screwdriver.yaml**

```yaml
shared:
  image: openjdk:17

jobs:
  main:
    requires: [~pr, ~commit]
    steps:
      - setup: chmod +x gradlew
      - checkstyle: ./gradlew checkstyleMain checkstyleTest
      - test: ./gradlew test
      - build: ./gradlew build
      - report: |
          if [ -d "build/reports" ]; then
            echo "Test reports generated"
          fi
```

### build.gradle設定

```gradle
plugins {
    id 'java'
    id 'checkstyle'
    id 'jacoco'
}

test {
    useJUnitPlatform()
    testLogging {
        events "passed", "skipped", "failed"
    }
}

jacoco {
    toolVersion = "0.8.10"
}

jacocoTestReport {
    reports {
        xml.required = true
        html.required = true
    }
}

checkstyle {
    toolVersion = '10.12.0'
    configFile = file("${rootDir}/config/checkstyle/checkstyle.xml")
}
```

## PHP プロジェクトのCI/CD設定

### GitHub Actions設定例

**.github/workflows/test.yml**

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

**screwdriver.yaml**

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

## CI/CDのベストプラクティス

### 1. キャッシュの活用

**Node.js（npm）:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Java（Gradle）:**
```yaml
- uses: actions/setup-java@v4
  with:
    cache: 'gradle'
```

**PHP（Composer）:**
```yaml
- uses: actions/cache@v3
  with:
    path: vendor
    key: ${{ runner.os }}-php-${{ hashFiles('**/composer.lock') }}
```

### 2. 並列実行（マトリックス戦略）

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

### 3. タイムアウト設定

```yaml
jobs:
  test:
    timeout-minutes: 10  # 10分でタイムアウト
```

### 4. エラー時の通知

**GitHub Actions（Slack通知）:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 5. アーティファクトの保存

```yaml
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: test-results
    path: build/reports/
```

## トラブルシューティング

### Node.js関連

#### 問題: `npm ci` が失敗する

**原因**: package-lock.jsonが古い

**解決方法**:
```bash
# ローカルで再生成
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

#### 問題: テストがローカルでは成功するがCI/CDで失敗

**原因**: 環境依存の問題（タイムゾーン、ファイルパス等）

**解決方法**:
```javascript
// タイムゾーンを固定
process.env.TZ = 'UTC';

// ファイルパスは絶対パスではなく相対パス
const configPath = path.join(__dirname, '../config.json');
```

### Java（Gradle）関連

#### 問題: Gradleビルドが遅い

**原因**: キャッシュが効いていない

**解決方法**:
```yaml
# GitHub Actionsでキャッシュを有効化
- uses: actions/setup-java@v4
  with:
    cache: 'gradle'

# または手動でキャッシュ
- uses: actions/cache@v3
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
```

#### 問題: `./gradlew: Permission denied`

**原因**: 実行権限がない

**解決方法**:
```yaml
- name: Grant execute permission
  run: chmod +x gradlew
```

### PHP関連

#### 問題: Composer installが失敗

**原因**: メモリ不足

**解決方法**:
```yaml
- name: Install dependencies
  run: composer install --prefer-dist --no-progress
  env:
    COMPOSER_MEMORY_LIMIT: -1
```

#### 問題: PHPStanがCI/CDで異なる結果を返す

**原因**: PHPバージョンの違い

**解決方法**:
```yaml
# 特定のPHPバージョンを指定
- uses: shivammathur/setup-php@v2
  with:
    php-version: '8.3'  # プロジェクトと同じバージョン
```

## CI/CD設定のチェックリスト

### 初回設定時

- [ ] CI/CD設定ファイルを作成（GitHub Actions or Screwdriver）
- [ ] 単体テストが自動実行される
- [ ] Lintが自動実行される
- [ ] ビルドが自動実行される
- [ ] キャッシュが有効化されている
- [ ] マトリックス戦略で複数バージョンをテスト
- [ ] タイムアウト設定を追加
- [ ] エラー時の通知設定（任意）

### 運用時の定期確認

- [ ] CI/CDの実行時間が長くなっていないか（目標: 5分以内）
- [ ] キャッシュが効いているか
- [ ] 失敗率が高くなっていないか
- [ ] 依存パッケージが古くなっていないか

## リリースタグ作成時のCI/CD

リリースタグを作成すると、CI/CDが自動的に実行されます：

```yaml
# タグプッシュ時にも実行
on:
  push:
    tags:
      - 'v*'
```

**実行内容**:
1. 単体テスト
2. Lint
3. ビルド

**すべて成功したら、GitHub Releaseを作成**します（手動）。

詳細は [リリースフロー](./release-flow.md) を参照してください。

## 次のステップ

- [リリースフロー](./release-flow.md): リリースタグ作成からGitHub Releaseまで
- [テスト実行フロー](../testing/test-execution-flow.md): Phase A/Bの詳細

## CI/CD設定テンプレート

実際のCI/CD設定ファイルテンプレートは、以下のディレクトリに用意されています：

- GitHub Actions: `templates/ci/github-actions/`
- Screwdriver: `templates/ci/screwdriver/`

詳細は各テンプレートファイルを参照してください。
