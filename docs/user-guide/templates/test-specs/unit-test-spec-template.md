# Unit Test Specification: {{TEST_NAME}}

**Author**: {{AUTHOR}}
**Date**: {{DATE}}
**Version**: 1.0

## 1. Overview

### 1.1 Purpose
{{PURPOSE}}

Example: To verify that individual functions and classes in the {{MODULE_NAME}} module work correctly in isolation.

### 1.2 Scope
{{SCOPE}}

Example: This test specification covers all public methods of the {{CLASS_NAME}} class and their edge cases.

### 1.3 Testing Tool
- **Tool**: {{TOOL_NAME}}
- **Version**: {{VERSION}}

Example:
- **Tool**: Vitest (Node.js) / JUnit 5 (Java) / PHPUnit (PHP)
- **Version**: 1.0.0 / 5.10.0 / 10.5.0

## 2. Test Environment

### 2.1 Software Requirements
- Programming Language: {{LANGUAGE}} {{LANGUAGE_VERSION}}
- Testing Framework: {{FRAMEWORK}} {{FRAMEWORK_VERSION}}
- Mocking Library: {{MOCKING_LIBRARY}} (if applicable)
- Dependencies: {{DEPENDENCIES}}

### 2.2 Hardware Requirements
- Not applicable for unit tests (runs on developer's machine or CI/CD)

### 2.3 Test Data
- Mock data location: `{{MOCK_DATA_PATH}}`
- Test fixtures: `{{FIXTURES_PATH}}`
- Data setup: {{DATA_SETUP_DESCRIPTION}}

## 3. Functions/Classes to Test

### 3.1 Target Components
List all functions/classes to be tested:

| Component | Type | Description | Priority |
|-----------|------|-------------|----------|
| {{COMPONENT_1}} | Function/Class | {{DESCRIPTION_1}} | High/Medium/Low |
| {{COMPONENT_2}} | Function/Class | {{DESCRIPTION_2}} | High/Medium/Low |

### 3.2 Mocking Strategy
Describe what external dependencies will be mocked:

| Dependency | Mock Type | Reason |
|------------|-----------|--------|
| {{DEPENDENCY_1}} | {{MOCK_TYPE}} | {{REASON}} |
| {{DEPENDENCY_2}} | {{MOCK_TYPE}} | {{REASON}} |

Example:
| Dependency | Mock Type | Reason |
|------------|-----------|--------|
| Database | Mock object | Avoid external I/O, ensure test isolation |
| HTTP API | Stub | Control response for predictable testing |

## 4. Test Cases

### Test Case UT-001: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that `calculateTotal()` returns the correct sum when given an array of positive numbers.

**Preconditions**:
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

Example:
- Input array is not null
- All array elements are valid numbers

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Create an input array: `[10, 20, 30]`
2. Call `calculateTotal(input)`
3. Assert that the result equals `60`

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Function returns `60`
- No exceptions are thrown

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

### Test Case UT-002: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

**Preconditions**:
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

**Expected Results**:
{{EXPECTED_RESULTS}}

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

### Test Case UT-003: Edge Case - {{EDGE_CASE_NAME}}

**Description**: {{EDGE_CASE_DESCRIPTION}}

Example: Verify that `calculateTotal()` handles empty array correctly.

**Preconditions**:
- {{PRECONDITION}}

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}

Example:
1. Create an empty array: `[]`
2. Call `calculateTotal([])`
3. Assert that the result equals `0`

**Expected Results**:
{{EXPECTED_RESULTS}}

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

### Test Case UT-004: Error Case - {{ERROR_CASE_NAME}}

**Description**: {{ERROR_CASE_DESCRIPTION}}

Example: Verify that `calculateTotal()` throws an appropriate error when given invalid input.

**Preconditions**:
- {{PRECONDITION}}

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}

Example:
1. Create an array with non-numeric value: `[10, 'invalid', 30]`
2. Call `calculateTotal(input)`
3. Assert that a `TypeError` is thrown

**Expected Results**:
{{EXPECTED_RESULTS}}

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

## 5. Test Coverage

### 5.1 Coverage Goals
- **Target Coverage**: {{TARGET_COVERAGE}}%
- **Minimum Acceptable Coverage**: {{MIN_COVERAGE}}%

Example:
- **Target Coverage**: 95%
- **Minimum Acceptable Coverage**: 80%

### 5.2 Coverage Report Location
- Report Path: `{{COVERAGE_REPORT_PATH}}`
- HTML Report: `{{HTML_REPORT_PATH}}`

Example:
- Report Path: `coverage/lcov.info`
- HTML Report: `coverage/index.html`

## 6. Test Execution Summary

| ID | Test Name | Status | Executed By | Date | Notes |
|----|-----------|--------|-------------|------|-------|
| UT-001 | {{NAME}} | | | | |
| UT-002 | {{NAME}} | | | | |
| UT-003 | {{NAME}} | | | | |
| UT-004 | {{NAME}} | | | | |

## 7. Defects Found

| Defect ID | Severity | Description | Status |
|-----------|----------|-------------|--------|
| | High/Medium/Low | | Open/In Progress/Fixed/Closed |

## 8. Sign-off

**Tested By**: _______________
**Date**: _______________
**Approved By**: _______________
**Date**: _______________

---

## Appendix A: Code Examples

### Example Test Code (Node.js/Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateTotal } from './calculator';

describe('calculateTotal', () => {
  it('should return correct sum for positive numbers', () => {
    const input = [10, 20, 30];
    const result = calculateTotal(input);
    expect(result).toBe(60);
  });

  it('should handle empty array', () => {
    const result = calculateTotal([]);
    expect(result).toBe(0);
  });

  it('should throw error for invalid input', () => {
    expect(() => calculateTotal([10, 'invalid', 30])).toThrow(TypeError);
  });
});
```

### Example Test Code (Java/JUnit 5)

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    @Test
    void shouldReturnCorrectSumForPositiveNumbers() {
        Calculator calc = new Calculator();
        int[] input = {10, 20, 30};
        int result = calc.calculateTotal(input);
        assertEquals(60, result);
    }

    @Test
    void shouldHandleEmptyArray() {
        Calculator calc = new Calculator();
        int[] input = {};
        int result = calc.calculateTotal(input);
        assertEquals(0, result);
    }
}
```

### Example Test Code (PHP/PHPUnit)

```php
<?php
use PHPUnit\Framework\TestCase;

class CalculatorTest extends TestCase
{
    public function testShouldReturnCorrectSumForPositiveNumbers()
    {
        $calculator = new Calculator();
        $input = [10, 20, 30];
        $result = $calculator->calculateTotal($input);
        $this->assertEquals(60, $result);
    }

    public function testShouldHandleEmptyArray()
    {
        $calculator = new Calculator();
        $input = [];
        $result = $calculator->calculateTotal($input);
        $this->assertEquals(0, $result);
    }
}
```

## Appendix B: TDD Principles

### RED-GREEN-REFACTOR Cycle
1. **RED**: Write a failing test first
2. **GREEN**: Write minimum code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

### Important Rule
**Tests represent specifications. Do NOT modify tests to match implementation.**

- ❌ NG: Implementation doesn't match test, so modify the test
- ✅ OK: Specification changed, so update the test accordingly
