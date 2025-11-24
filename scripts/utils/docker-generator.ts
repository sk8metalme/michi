/**
 * Docker Compose設定生成ユーティリティ
 * 選択されたサービスに応じてdocker-compose.ymlを生成
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';

/**
 * Docker Compose設定を生成
 */
export async function generateDockerCompose(
  feature: string,
  suggestedServices: string[] = [],
  projectRoot: string = process.cwd()
): Promise<void> {
  // サービスを選択（推奨サービスはデフォルトで選択）
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'services',
      message: '必要なサービスを選択してください:',
      choices: [
        { name: 'PostgreSQL', value: 'postgres', checked: suggestedServices.includes('postgres') },
        { name: 'MySQL', value: 'mysql', checked: suggestedServices.includes('mysql') },
        { name: 'Redis', value: 'redis', checked: suggestedServices.includes('redis') },
        { name: 'MongoDB', value: 'mongodb', checked: suggestedServices.includes('mongodb') },
        { name: 'Mock API Server', value: 'mockapi', checked: suggestedServices.includes('mockapi') }
      ]
    }
  ]);
  
  if (answers.services.length === 0) {
    console.log('   ⏭️  Docker Compose: スキップ（サービス未選択）');
    return;
  }
  
  // docker-compose.ymlを生成
  const compose = generateDockerComposeYaml(answers.services);
  const outputPath = join(projectRoot, 'docker-compose.yml');
  
  // 既存ファイルがある場合は確認
  if (existsSync(outputPath)) {
    console.log('   ⚠️  docker-compose.yml: 既存（上書きスキップ）');
    return;
  }
  
  writeFileSync(outputPath, compose, 'utf-8');
  console.log(`   ✅ Docker Compose: docker-compose.yml (${answers.services.join(', ')})`);
}

/**
 * Docker Compose YAMLを生成
 */
function generateDockerComposeYaml(services: string[]): string {
  let yaml = `version: '3.8'

services:
`;
  
  if (services.includes('postgres')) {
    yaml += `  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

`;
  }
  
  if (services.includes('mysql')) {
    yaml += `  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: testdb
      MYSQL_USER: testuser
      MYSQL_PASSWORD: testpass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

`;
  }
  
  if (services.includes('redis')) {
    yaml += `  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

`;
  }
  
  if (services.includes('mongodb')) {
    yaml += `  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: rootpass
      MONGO_INITDB_DATABASE: testdb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

`;
  }
  
  if (services.includes('mockapi')) {
    yaml += `  mockapi:
    image: mockserver/mockserver:latest
    ports:
      - "1080:1080"
    environment:
      MOCKSERVER_INITIALIZATION_JSON_PATH: /config/initializerJson.json
    volumes:
      - ./mock-config:/config

`;
  }
  
  // ボリューム定義
  yaml += `volumes:
`;
  
  if (services.includes('postgres')) {
    yaml += '  postgres_data:\n';
  }
  if (services.includes('mysql')) {
    yaml += '  mysql_data:\n';
  }
  if (services.includes('redis')) {
    yaml += '  redis_data:\n';
  }
  if (services.includes('mongodb')) {
    yaml += '  mongodb_data:\n';
  }
  
  return yaml;
}

