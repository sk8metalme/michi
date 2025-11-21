# Integration Test Specification: {{TEST_NAME}}

**Author**: {{AUTHOR}}
**Date**: {{DATE}}
**Version**: 1.0

## 1. Overview

### 1.1 Purpose
{{PURPOSE}}

Example: To verify that multiple components in the {{SYSTEM_NAME}} system work correctly together and data flows properly between integrated modules.

### 1.2 Scope
{{SCOPE}}

Example: This test specification covers the integration between the API layer, service layer, and database layer for the user management feature.

### 1.3 Testing Tool
- **Tool**: {{TOOL_NAME}}
- **Version**: {{VERSION}}

Example:
- **Tool**: Vitest (Node.js) / JUnit 5 with Spring Test (Java) / PHPUnit with Laravel Testing (PHP)
- **Version**: 1.0.0 / 5.10.0 / 10.5.0

## 2. Test Environment

### 2.1 Software Requirements
- Programming Language: {{LANGUAGE}} {{LANGUAGE_VERSION}}
- Testing Framework: {{FRAMEWORK}} {{FRAMEWORK_VERSION}}
- Database: {{DATABASE}} {{DB_VERSION}} (test instance)
- External Services: {{EXTERNAL_SERVICES}}
- Dependencies: {{DEPENDENCIES}}

### 2.2 Hardware Requirements
- Test Database Server: {{DB_SERVER_SPEC}}
- External API Test Environment: {{API_TEST_ENV}}
- Network: {{NETWORK_REQUIREMENTS}}

Example:
- Test Database Server: PostgreSQL 15 on Docker container
- External API Test Environment: Staging API endpoint
- Network: Stable internet connection for external API calls

### 2.3 Test Data
- Test database setup script: `{{DB_SETUP_SCRIPT}}`
- Test data fixtures: `{{FIXTURES_PATH}}`
- Data cleanup script: `{{CLEANUP_SCRIPT}}`
- External API mock data: `{{MOCK_DATA_PATH}}` (if applicable)

## 3. Integration Points

### 3.1 Integration Architecture
Describe the components being integrated and their relationships:

```
{{COMPONENT_A}} → {{COMPONENT_B}} → {{COMPONENT_C}}
     ↓                  ↓                  ↓
{{DEPENDENCY_1}}    {{DEPENDENCY_2}}    {{DEPENDENCY_3}}
```

Example:
```
API Controller → Service Layer → Repository Layer
     ↓                ↓                ↓
Authentication   Business Logic    Database
```

### 3.2 Integration Points Table

| Integration Point | Component A | Component B | Data Flow | Protocol/Method |
|-------------------|-------------|-------------|-----------|-----------------|
| {{POINT_1}} | {{COMP_A}} | {{COMP_B}} | {{DIRECTION}} | {{PROTOCOL}} |
| {{POINT_2}} | {{COMP_C}} | {{COMP_D}} | {{DIRECTION}} | {{PROTOCOL}} |

Example:
| Integration Point | Component A | Component B | Data Flow | Protocol/Method |
|-------------------|-------------|-------------|-----------|-----------------|
| User Registration | API Controller | UserService | Request → | HTTP POST |
| Data Persistence | UserService | UserRepository | Save → | ORM Method |
| Database Access | UserRepository | PostgreSQL | Query → | SQL/JDBC |

### 3.3 External Dependencies

| Dependency | Type | Connection | Mock/Real | Notes |
|------------|------|------------|-----------|-------|
| {{DEP_1}} | {{TYPE}} | {{CONNECTION}} | {{STATUS}} | {{NOTES}} |
| {{DEP_2}} | {{TYPE}} | {{CONNECTION}} | {{STATUS}} | {{NOTES}} |

Example:
| Dependency | Type | Connection | Mock/Real | Notes |
|------------|------|------------|-----------|-------|
| Test Database | PostgreSQL | localhost:5432 | Real | Isolated test instance |
| Email Service | SMTP | smtp.example.com | Mock | Use MailHog for testing |
| Payment API | REST API | staging.payment.com | Real | Staging environment |

## 4. Test Cases

### Test Case IT-001: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that user registration API successfully saves user data to the database and returns correct response.

**Preconditions**:
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

Example:
- Test database is running and empty
- API server is started
- Test user data is prepared

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{STEP_4}}

Example:
1. Send POST request to `/api/users` with user data: `{name: "John", email: "john@example.com"}`
2. Verify API returns 201 status code
3. Query database to check if user record exists
4. Verify database record matches the input data

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- API returns status 201 with user ID
- Database contains exactly one record with matching data
- All fields (name, email, created_at) are correctly stored

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

### Test Case IT-002: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that authentication service correctly validates user credentials against the database.

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

### Test Case IT-003: Transaction Rollback - {{SCENARIO_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that database transaction is rolled back correctly when an error occurs during user registration.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Test database is running
- Trigger condition for rollback is prepared (e.g., duplicate email constraint)

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Create a user with email "test@example.com"
2. Attempt to create another user with the same email
3. Verify that the second operation fails
4. Verify that database contains only the first user (no partial data)

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- API returns 409 Conflict status
- Database contains only one user record
- No orphaned or partial records exist

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Notes**:
{{NOTES}}

---

### Test Case IT-004: External Service Integration - {{SERVICE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that the system correctly integrates with external payment API for order processing.

**Preconditions**:
- {{PRECONDITION}}

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

## 5. Test Execution Summary

| ID | Test Name | Status | Executed By | Date | Notes |
|----|-----------|--------|-------------|------|-------|
| IT-001 | {{NAME}} | | | | |
| IT-002 | {{NAME}} | | | | |
| IT-003 | {{NAME}} | | | | |
| IT-004 | {{NAME}} | | | | |

## 6. Defects Found

| Defect ID | Severity | Description | Affected Components | Status |
|-----------|----------|-------------|---------------------|--------|
| | High/Medium/Low | | | Open/In Progress/Fixed/Closed |

## 7. Sign-off

**Tested By**: _______________
**Date**: _______________
**Approved By**: _______________
**Date**: _______________

---

## Appendix A: Test Environment Setup

### Database Setup Script

```bash
# Start test database (Docker)
docker run -d \
  --name test-postgres \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  postgres:15

# Run migrations
npm run migrate:test
# or
./gradlew flywayMigrate -Pflyway.configFiles=test-flyway.conf
# or
php artisan migrate --env=testing
```

### Test Data Setup

```bash
# Seed test data
npm run seed:test
# or
./gradlew run --args="TestDataSeeder"
# or
php artisan db:seed --class=TestDataSeeder --env=testing
```

### Cleanup Script

```bash
# Clean up test database
docker stop test-postgres
docker rm test-postgres

# Or truncate tables
npm run db:truncate:test
```

## Appendix B: Code Examples

### Example Integration Test Code (Node.js/Vitest)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/database';

describe('User Registration Integration', () => {
  beforeAll(async () => {
    await db.connect();
    await db.migrate();
  });

  afterAll(async () => {
    await db.truncate('users');
    await db.disconnect();
  });

  it('should register user and save to database', async () => {
    const userData = { name: 'John', email: 'john@example.com' };

    // API call
    const response = await request(app)
      .post('/api/users')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    // Database verification
    const user = await db.query('SELECT * FROM users WHERE email = ?', [userData.email]);
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
  });
});
```

### Example Integration Test Code (Java/JUnit 5 + Spring Test)

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.jdbc.Sql;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Sql(scripts = "/cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class UserRegistrationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldRegisterUserAndSaveToDatabase() {
        UserRequest request = new UserRequest("John", "john@example.com");

        ResponseEntity<UserResponse> response = restTemplate
            .postForEntity("/api/users", request, UserResponse.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody().getId());

        // Database verification
        User user = userRepository.findByEmail("john@example.com").orElseThrow();
        assertEquals("John", user.getName());
    }
}
```

### Example Integration Test Code (PHP/PHPUnit + Laravel)

```php
<?php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserRegistrationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_should_register_user_and_save_to_database()
    {
        $userData = [
            'name' => 'John',
            'email' => 'john@example.com',
            'password' => 'password123'
        ];

        // API call
        $response = $this->postJson('/api/users', $userData);

        $response->assertStatus(201)
                 ->assertJsonStructure(['id', 'name', 'email']);

        // Database verification
        $this->assertDatabaseHas('users', [
            'name' => 'John',
            'email' => 'john@example.com'
        ]);
    }
}
```

## Appendix C: Execution Timing

## Phase B (Before Release) - Manual Execution

Integration tests are executed manually before creating a release tag:

1. After PR is merged to main branch
2. Before creating a release tag
3. Run all integration tests in Phase B
4. Verify all tests pass before proceeding to release

Integration tests are **NOT** executed automatically in CI/CD during PR phase (only unit tests run automatically).
