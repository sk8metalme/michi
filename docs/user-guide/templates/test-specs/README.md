# Test Specification Templates

This directory contains test specification templates for different types of tests.

## Available Templates

| Template | Purpose | When to Use |
|----------|---------|-------------|
| [Unit Test](./unit-test-spec-template.md) | Unit test specifications | Testing individual functions/classes in isolation |
| [Integration Test](./integration-test-spec-template.md) | Integration test specifications | Testing interactions between components/modules |
| [E2E Test](./e2e-test-spec-template.md) | End-to-end test specifications | Testing complete user workflows |
| [Performance Test](./performance-test-spec-template.md) | Performance test specifications | Testing response time, throughput, resource usage |
| [Security Test](./security-test-spec-template.md) | Security test specifications | Testing vulnerabilities, authentication, authorization |

## How to Use

### Step 1: Choose the Right Template

Select the template based on the type of testing you need:

- **Unit Test**: For testing pure functions, business logic, utilities
- **Integration Test**: For testing API integrations, database operations, external services
- **E2E Test**: For testing user flows like login, checkout, data submission
- **Performance Test**: For testing API response times, load capacity, memory usage
- **Security Test**: For testing authentication flows, input validation, access control

### Step 2: Copy the Template

```bash
# Example: Creating a unit test specification for authentication module
cp docs/user-guide/templates/test-specs/unit-test-spec-template.md \
   docs/testing/specs/auth-unit-test-spec.md
```

### Step 3: Fill in the Template

Replace all placeholder text (`{{...}}`) with your project-specific information:

- `{{TEST_NAME}}`: Descriptive name for your test
- `{{AUTHOR}}`: Your name or team name
- `{{DATE}}`: Creation date
- `{{TOOL_NAME}}`: Testing tool/framework (e.g., Vitest, PHPUnit, JUnit)
- `{{FEATURE_NAME}}`: Feature being tested

### Step 4: Define Test Cases

For each test case, specify:

1. **ID**: Unique identifier (e.g., `UT-001`, `IT-001`)
2. **Test Name**: Clear, descriptive name
3. **Description**: What is being tested
4. **Preconditions**: Required setup
5. **Test Steps**: Detailed steps to execute
6. **Expected Results**: Expected behavior
7. **Actual Results**: (Fill during execution)
8. **Status**: Pass/Fail/Blocked

## Test Specification Workflow

```text
Phase 0-3: Create Test Specification
    ↓
Phase 0-4: Review Test Specification
    ↓
Phase 0-5: Approve and Create Task
    ↓
Implementation Phase
    ↓
Test Execution (Phase A or Phase B)
```

## Best Practices

### 1. Write Specifications Before Implementation

Test specifications should be created **before** writing test code. This ensures:
- Clear understanding of requirements
- Comprehensive test coverage
- Reviewable test plans

### 2. Be Specific and Measurable

- ❌ Bad: "System should be fast"
- ✅ Good: "API response time should be < 200ms for 95% of requests"

### 3. Include Edge Cases

Don't just test happy paths:
- Boundary conditions
- Invalid inputs
- Error scenarios
- Concurrent access

### 4. Keep Specifications Updated

When requirements change:
1. Update the test specification first
2. Review the changes
3. Update the test implementation

### 5. Use Clear Identifiers

Test IDs should follow a consistent pattern:
- Unit Tests: `UT-001`, `UT-002`
- Integration Tests: `IT-001`, `IT-002`
- E2E Tests: `E2E-001`, `E2E-002`
- Performance Tests: `PT-001`, `PT-002`
- Security Tests: `ST-001`, `ST-002`

## Example Directory Structure

```text
docs/testing/specs/
├── auth/
│   ├── auth-unit-test-spec.md
│   ├── auth-integration-test-spec.md
│   └── auth-security-test-spec.md
├── payment/
│   ├── payment-unit-test-spec.md
│   ├── payment-integration-test-spec.md
│   ├── payment-e2e-test-spec.md
│   └── payment-security-test-spec.md
└── reporting/
    ├── reporting-unit-test-spec.md
    └── reporting-performance-test-spec.md
```

## Test Tool References

### Node.js / TypeScript
- **Unit/Integration/E2E**: [Vitest](https://vitest.dev/)
- **E2E**: [Playwright](https://playwright.dev/)
- **Performance**: [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html), [k6](https://k6.io/)

### Java
- **Unit**: [JUnit 5](https://junit.org/junit5/)
- **Integration**: [Spring Boot Test](https://spring.io/guides/gs/testing-web/)
- **Performance**: [JMeter](https://jmeter.apache.org/)

### PHP
- **Unit/Integration**: [PHPUnit](https://phpunit.de/)
- **E2E**: [Behat](https://behat.org/)
- **Performance**: [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html)

## Related Documentation

- [Test Planning Flow](../../testing/test-planning-flow.md)
- [TDD Cycle](../../testing/tdd-cycle.md)
- [Test Execution Flow](../../testing/test-execution-flow.md)
- [Test Failure Handling](../../testing/test-failure-handling.md)

## Questions?

If you have questions about which template to use or how to fill it out, consult the [Testing Strategy](../../testing-strategy.md) document.
