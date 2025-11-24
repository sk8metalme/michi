/**
 * テスト設定生成ユーティリティ
 * プロジェクトの言語に応じてテストフレームワーク設定を生成
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface TestConfig {
  language: string;
}

/**
 * テストフレームワーク設定ファイルを生成
 */
export async function generateTestConfig(
  feature: string,
  config: TestConfig,
  projectRoot: string = process.cwd()
): Promise<void> {
  const { language } = config;
  
  switch (language) {
  case 'Node.js/TypeScript':
    await generateVitestConfig(projectRoot);
    break;
  case 'Java':
    await generateJUnitConfig(projectRoot);
    break;
  case 'PHP':
    await generatePHPUnitConfig(projectRoot);
    break;
  case 'Python':
    await generatePytestConfig(projectRoot);
    break;
  case 'Go':
    console.log('   ℹ️  Goは標準のtestingパッケージを使用（設定不要）');
    break;
  case 'Rust':
    console.log('   ℹ️  Rustは標準のcargo testを使用（設定不要）');
    break;
  default:
    console.log('   ⏭️  テスト設定: スキップ（言語不明）');
  }
}

/**
 * Vitest設定を生成（Node.js/TypeScript）
 */
async function generateVitestConfig(projectRoot: string): Promise<void> {
  const outputPath = join(projectRoot, 'vitest.config.ts');
  
  // 既存の設定ファイルがある場合はスキップ
  if (existsSync(outputPath)) {
    console.log('   ℹ️  vitest.config.ts: 既存（スキップ）');
    return;
  }
  
  const config = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests/fixtures'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
`;
  
  writeFileSync(outputPath, config, 'utf-8');
  console.log('   ✅ テスト設定: vitest.config.ts');
}

/**
 * JUnit設定を生成（Java）
 */
async function generateJUnitConfig(projectRoot: string): Promise<void> {
  const outputPath = join(projectRoot, 'build.gradle');
  
  // 既存のbuild.gradleがある場合はスキップ
  if (!existsSync(outputPath)) {
    const config = `plugins {
    id 'java'
    id 'jacoco'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

test {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}

jacoco {
    toolVersion = "0.8.11"
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}
`;
    
    writeFileSync(outputPath, config, 'utf-8');
    console.log('   ✅ テスト設定: build.gradle');
  } else {
    console.log('   ℹ️  build.gradle: 既存（スキップ）');
  }
}

/**
 * PHPUnit設定を生成（PHP）
 */
async function generatePHPUnitConfig(projectRoot: string): Promise<void> {
  const outputPath = join(projectRoot, 'phpunit.xml');
  
  // 既存の設定ファイルがある場合はスキップ
  if (existsSync(outputPath)) {
    console.log('   ℹ️  phpunit.xml: 既存（スキップ）');
    return;
  }
  
  const config = `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <report>
            <html outputDirectory="coverage/html"/>
            <clover outputFile="coverage/clover.xml"/>
        </report>
    </coverage>
</phpunit>
`;
  
  writeFileSync(outputPath, config, 'utf-8');
  console.log('   ✅ テスト設定: phpunit.xml');
}

/**
 * Pytest設定を生成（Python）
 */
async function generatePytestConfig(projectRoot: string): Promise<void> {
  const outputPath = join(projectRoot, 'pytest.ini');
  
  // 既存の設定ファイルがある場合はスキップ
  if (existsSync(outputPath)) {
    console.log('   ℹ️  pytest.ini: 既存（スキップ）');
    return;
  }
  
  const config = `[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Coverage settings
addopts = 
    --cov=src
    --cov-report=html
    --cov-report=xml
    --cov-report=term-missing
    --cov-fail-under=80
`;
  
  writeFileSync(outputPath, config, 'utf-8');
  console.log('   ✅ テスト設定: pytest.ini');
}

