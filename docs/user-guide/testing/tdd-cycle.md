# TDDサイクル

このドキュメントでは、michiを使用したプロジェクトでのテスト駆動開発（TDD）サイクルについて説明します。

## michiワークフローにおけるTDDの位置づけ

TDDは **Phase 2: TDD実装** フェーズで実践します。Phase 0.4で作成したテスト仕様書に基づき、テストコードと実装コードを同時進行で作成します。

詳細なワークフローは [ワークフローガイド](../guides/workflow.md#phase-2-tdd実装) を参照してください。

## TDDとは

**テスト駆動開発（Test-Driven Development, TDD）** は、コードを書く前にテストを書く開発手法です。テストファーストの考え方により、以下のメリットが得られます：

- **設計の改善**: テストを先に書くことで、使いやすいインターフェースを設計できる
- **バグの早期発見**: 実装直後にテストで検証するため、バグを早く見つけられる
- **リファクタリングの安心感**: テストがあることで、コード改善時の品質が保証される
- **ドキュメントとしての役割**: テストコードが仕様書の役割を果たす

## RED-GREEN-REFACTORサイクル

TDDは以下の3ステップを繰り返します：

```
RED → GREEN → REFACTOR → RED → GREEN → REFACTOR → ...
```

### 1. RED: 失敗するテストを書く

まず、**実装が存在しない状態で**テストを書きます。このテストは必ず失敗します（RED）。

#### 例（Node.js/Vitest）

```typescript
// tests/unit/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../src/calculator';

describe('calculateTotal', () => {
  it('should return sum of array elements', () => {
    const result = calculateTotal([10, 20, 30]);
    expect(result).toBe(60);  // このテストは失敗する（関数がまだ存在しない）
  });
});
```

**実行結果**:
```
❌ FAIL  tests/unit/calculator.test.ts
  calculateTotal
    ✗ should return sum of array elements
      Module not found: Cannot find module '../src/calculator'
```

**重要**: この段階でテストが失敗することを確認してください。もしテストが成功する場合、テストが正しく機能していない可能性があります。

### 2. GREEN: 最小限の実装でテストを通す

次に、テストを通すための**最小限の実装**を書きます。この段階では、コードの美しさやパフォーマンスは気にしません。

#### 例

```typescript
// src/calculator.ts
export function calculateTotal(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    sum += num;
  }
  return sum;
}
```

**実行結果**:
```
✅ PASS  tests/unit/calculator.test.ts
  calculateTotal
    ✓ should return sum of array elements (2ms)
```

**重要**: テストが成功したら、すぐに次のステップに進みます。

### 3. REFACTOR: コードを改善する

テストが通った状態で、コードを**リファクタリング**します。この段階で、コードの重複を排除したり、可読性を向上させたりします。

#### 例

```typescript
// src/calculator.ts (リファクタリング後)
export function calculateTotal(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}
```

**実行結果**:
```
✅ PASS  tests/unit/calculator.test.ts
  calculateTotal
    ✓ should return sum of array elements (2ms)
```

**重要**: リファクタリング後も、すべてのテストが成功することを確認してください。

### サイクルの繰り返し

上記の3ステップを繰り返して、機能を少しずつ追加していきます。

#### 次のテストケース（RED）

```typescript
it('should return 0 for empty array', () => {
  const result = calculateTotal([]);
  expect(result).toBe(0);  // 既存の実装でも成功するが、明示的にテスト
});

it('should throw error for non-numeric values', () => {
  expect(() => calculateTotal([10, 'invalid', 30])).toThrow(TypeError);  // 失敗
});
```

#### 実装の追加（GREEN）

```typescript
export function calculateTotal(numbers: number[]): number {
  // 型チェックを追加
  if (!numbers.every(num => typeof num === 'number')) {
    throw new TypeError('All elements must be numbers');
  }
  return numbers.reduce((sum, num) => sum + num, 0);
}
```

## 最も重要な原則: テストは仕様

TDDで最も重要な原則は、**テストは仕様を表す**ということです。

### ❌ 絶対にやってはいけないこと

**実装に合わせてテストを修正する**

```typescript
// 悪い例
it('should return sum of array elements', () => {
  const result = calculateTotal([10, 20, 30]);
  expect(result).toBe(70);  // ❌ 実装が70を返すからテストを変更
});
```

**理由**: これでは、テストが仕様ではなく、実装を追認しているだけになります。バグがあっても見逃してしまいます。

### ✅ 正しいアプローチ

**仕様が変更された場合のみテストを修正する**

```typescript
// 良い例
// 仕様変更: 「合計に消費税10%を加算する」
it('should return sum with 10% tax', () => {
  const result = calculateTotalWithTax([10, 20, 30]);
  expect(result).toBe(66);  // ✅ 60 + (60 * 0.1) = 66
});
```

### 判断フローチャート

```
テストが失敗した
    ↓
なぜ失敗したのか？
    ↓
    ├─ 仕様が変更された
    │  → ✅ テストを修正する
    │
    ├─ 実装にバグがある
    │  → ✅ 実装を修正する
    │
    └─ テストが間違っている
       → ✅ テストを修正する
```

**注意**: 「実装がこうなっているから」という理由でテストを変更してはいけません。

## TDDのベストプラクティス

### 1. 小さなステップで進む

一度に大きな機能を実装しようとせず、小さな単位で RED → GREEN → REFACTOR を繰り返します。

**悪い例**:
```typescript
// 一度に複数の機能をテスト
it('should calculate, filter, and format', () => {
  // 複雑なテスト...
});
```

**良い例**:
```typescript
it('should calculate total', () => { /* ... */ });
it('should filter negative numbers', () => { /* ... */ });
it('should format as currency', () => { /* ... */ });
```

### 2. テストが失敗することを確認する

新しいテストを書いたら、必ず一度は失敗することを確認します。

```bash
# テストを書く
# ↓
npm test  # 失敗することを確認
# ↓
# 実装を書く
# ↓
npm test  # 成功することを確認
```

### 3. 1つのテストで1つのことを検証する

テストは小さく、焦点を絞って書きます。

**悪い例**:
```typescript
it('should work correctly', () => {
  expect(calculateTotal([10, 20])).toBe(30);
  expect(calculateTotal([])).toBe(0);
  expect(() => calculateTotal([10, 'x'])).toThrow();
});
```

**良い例**:
```typescript
it('should return sum of array elements', () => {
  expect(calculateTotal([10, 20])).toBe(30);
});

it('should return 0 for empty array', () => {
  expect(calculateTotal([])).toBe(0);
});

it('should throw error for invalid input', () => {
  expect(() => calculateTotal([10, 'x'])).toThrow();
});
```

### 4. テストコードも保守する

テストコードもプロダクションコードと同じように、リファクタリングして保守します。

```typescript
// 共通のヘルパー関数を使う
function createTestData() {
  return [10, 20, 30];
}

it('should calculate total', () => {
  const data = createTestData();
  expect(calculateTotal(data)).toBe(60);
});
```

## 言語別のTDD例

### Node.js/TypeScript (Vitest)

```typescript
// RED
import { describe, it, expect } from 'vitest';
import { User } from '../src/user';

describe('User', () => {
  it('should create user with name', () => {
    const user = new User('Alice');
    expect(user.getName()).toBe('Alice');
  });
});

// GREEN
export class User {
  constructor(private name: string) {}
  getName() { return this.name; }
}

// REFACTOR（リファクタリングの余地がない場合はスキップ）
```

### Java (JUnit 5 + Gradle)

```java
// RED
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    @Test
    void shouldCreateUserWithName() {
        User user = new User("Alice");
        assertEquals("Alice", user.getName());
    }
}

// GREEN
public class User {
    private String name;
    public User(String name) { this.name = name; }
    public String getName() { return name; }
}
```

### PHP (PHPUnit)

```php
// RED
<?php
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testShouldCreateUserWithName()
    {
        $user = new User('Alice');
        $this->assertEquals('Alice', $user->getName());
    }
}

// GREEN
class User
{
    private $name;
    public function __construct($name) { $this->name = $name; }
    public function getName() { return $this->name; }
}
```

## まとめ

TDDの核心は以下の3つです：

1. **RED-GREEN-REFACTORサイクル**を繰り返す
2. **テストは仕様**であり、実装に合わせて変更してはいけない
3. **小さなステップ**で進む

TDDを実践することで、品質の高いコードを効率的に書けるようになります。

## 次のステップ

- [テスト実行フロー](./test-execution-flow.md): Phase A/Bでのテスト実行
- [テスト失敗時の対応](./test-failure-handling.md): テスト失敗時の対処方法
