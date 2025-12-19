# Michi CI/CD設定ガイド - Java/Gradle

**親ドキュメント**: [ci-setup.md](./ci-setup.md)

---

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

