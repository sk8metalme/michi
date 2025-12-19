# Michi CI/CD - トラブルシューティング

**親ドキュメント**: [ci-setup.md](./ci-setup.md)

---

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

