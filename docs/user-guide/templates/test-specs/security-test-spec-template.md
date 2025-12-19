# Security Test Specification: {{TEST_NAME}}

**Author**: {{AUTHOR}}
**Date**: {{DATE}}
**Version**: 1.0

## 1. Overview

### 1.1 Purpose
{{PURPOSE}}

Example: To identify security vulnerabilities in the {{SYSTEM_NAME}} system and verify that data protection and access control are properly implemented.

### 1.2 Scope
{{SCOPE}}

Example: This test specification covers security testing for user authentication, authorization, data encryption, and input validation.

### 1.3 Testing Tool
- **Tool**: {{TOOL_NAME}}
- **Version**: {{VERSION}}

Example:
- **Tool**: OWASP ZAP / Burp Suite / Snyk / SonarQube
- **Version**: 2.14.0 / Professional 2023.11 / 1.1000.0 / 10.3.0

## 2. Test Environment

### 2.1 Software Requirements
- Programming Language: {{LANGUAGE}} {{VERSION}}
- Web Server: {{SERVER}} {{VERSION}}
- Database: {{DATABASE}} {{VERSION}}
- Authentication System: {{AUTH_SYSTEM}}

### 2.2 Test Accounts
- Admin Account: {{ADMIN_ACCOUNT}}
- Regular User Account: {{USER_ACCOUNT}}
- Guest Account: {{GUEST_ACCOUNT}} (if applicable)

### 2.3 Test Scope
- Target URL: {{TARGET_URL}}
- Target APIs: {{API_ENDPOINTS}}
- Excluded Scope: {{EXCLUDED_SCOPE}} (production environment, external services, etc.)

## 3. Security Test Categories

### 3.1 OWASP Top 10 (2021) Coverage

| OWASP Category | Vulnerability Name | Testing Coverage |
|----------------|-------------------|------------------|
| A01:2021 | Broken Access Control | ✅ Included |
| A02:2021 | Cryptographic Failures | ✅ Included |
| A03:2021 | Injection | ✅ Included |
| A04:2021 | Insecure Design | ✅ Included |
| A05:2021 | Security Misconfiguration | ✅ Included |
| A06:2021 | Vulnerable and Outdated Components | ✅ Included |
| A07:2021 | Identification and Authentication Failures | ✅ Included |
| A08:2021 | Software and Data Integrity Failures | ✅ Included |
| A09:2021 | Security Logging and Monitoring Failures | ✅ Included |
| A10:2021 | Server-Side Request Forgery (SSRF) | ✅ Included |

## 4. Test Cases

### Test Case ST-001: SQL Injection

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that the application properly sanitizes user input to prevent SQL injection attacks.

**Preconditions**:
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

Example:
- Application is running
- Database contains test data
- Test user account is available

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Navigate to login page
2. Enter malicious SQL in username field: `' OR '1'='1' --`
3. Enter any password
4. Click login button
5. Observe response

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Login should fail
- No database error messages exposed
- Application logs the suspicious attempt
- No unauthorized access granted

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

### Test Case ST-002: Cross-Site Scripting (XSS)

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that user input is properly sanitized to prevent XSS attacks.

**Test Type**: Reflected XSS / Stored XSS / DOM-based XSS

**Preconditions**:
- {{PRECONDITION}}

Example:
- Application is running
- User can submit content to the application

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Navigate to user profile page
2. Enter malicious script in "Bio" field: `<script>alert('XSS')</script>`
3. Save profile
4. Reload page and check if script executes

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Script does not execute
- Input is properly escaped or sanitized
- Page displays the literal text instead of executing code

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

### Test Case ST-003: Authentication and Session Management

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify secure authentication and session handling.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Test user account is available
- Browser with developer tools

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Log in with valid credentials
2. Capture session token
3. Log out
4. Attempt to reuse captured session token
5. Verify session is invalidated

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Session token is invalidated after logout
- Reused token returns 401 Unauthorized
- Session has appropriate timeout
- Tokens are not exposed in URL

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

### Test Case ST-004: Authorization and Access Control

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that users can only access resources they are authorized to access.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Regular user account is available
- Admin-only endpoints are identified

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Log in as regular user
2. Attempt to access admin endpoint: `GET /api/admin/users`
3. Verify access is denied
4. Attempt to modify another user's data: `PUT /api/users/999`
5. Verify access is denied

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Regular user receives 403 Forbidden
- Cannot access admin resources
- Cannot modify other users' data
- Proper role-based access control (RBAC) enforcement

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: Critical

**Notes**:
{{NOTES}}

---

### Test Case ST-005: Data Encryption in Transit

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that all sensitive data is transmitted over encrypted channels.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Application is accessible over HTTPS

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Inspect HTTP headers for HTTPS enforcement
2. Check for Strict-Transport-Security (HSTS) header
3. Verify TLS version (TLS 1.2 or higher)
4. Check SSL/TLS certificate validity
5. Attempt to access site over HTTP and verify redirect to HTTPS

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- All traffic uses HTTPS
- HSTS header is present
- TLS 1.2+ is enforced
- Valid SSL certificate
- HTTP requests redirect to HTTPS

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: Critical

**Notes**:
{{NOTES}}

---

### Test Case ST-006: Data Encryption at Rest

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that sensitive data is encrypted when stored in the database.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Database access is available for verification
- Test data with sensitive fields

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Create user with password
2. Directly query database for user record
3. Verify password is hashed (not plain text)
4. Verify sensitive fields (SSN, credit card) are encrypted
5. Check encryption algorithm strength

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Passwords are hashed with strong algorithm (bcrypt, Argon2)
- Sensitive data is encrypted
- Encryption keys are not stored in database
- No plain text sensitive data visible

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: Critical

**Notes**:
{{NOTES}}

---

### Test Case ST-007: Cross-Site Request Forgery (CSRF)

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify protection against CSRF attacks.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Application has state-changing operations
- User can perform actions via forms or APIs

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Log in as user
2. Inspect state-changing forms for CSRF token
3. Submit form without CSRF token
4. Verify request is rejected
5. Submit form with invalid CSRF token
6. Verify request is rejected

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- All state-changing operations require CSRF token
- Requests without valid token are rejected
- CSRF tokens are unique per session
- Tokens expire appropriately

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

### Test Case ST-008: Security Headers

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify presence of security-related HTTP headers.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Application is running and accessible

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}

Example:
1. Make HTTP request to application
2. Inspect response headers for security headers

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
The following headers should be present:
- `Content-Security-Policy`: Prevents XSS
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `Strict-Transport-Security`: Enforces HTTPS
- `Referrer-Policy: no-referrer`: Controls referrer information

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: Medium

**Notes**:
{{NOTES}}

---

### Test Case ST-009: Sensitive Data Exposure in Logs

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that sensitive information is not logged.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Access to application logs
- Ability to perform operations that generate logs

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Perform various operations (login, registration, transactions)
2. Review application logs
3. Search for sensitive data (passwords, tokens, SSN, credit cards)
4. Verify no sensitive data is logged

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- No passwords in logs
- No API tokens in logs
- No credit card numbers in logs
- No personal identifiable information (PII) in plain text
- Sensitive fields are masked or redacted

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

### Test Case ST-010: Dependency Vulnerability Scan

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Scan third-party dependencies for known vulnerabilities.

**Preconditions**:
- {{PRECONDITION}}

Example:
- Access to project source code
- Dependency scanning tool installed

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}

Example:
1. Run dependency scan tool (Snyk, npm audit, OWASP Dependency-Check)
2. Review scan results
3. Identify high/critical vulnerabilities
4. Verify no critical vulnerabilities exist

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Zero critical vulnerabilities
- Zero high vulnerabilities
- All dependencies are up-to-date
- No known CVEs in dependencies

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Severity**: High

**Notes**:
{{NOTES}}

---

## 5. Test Execution Summary

| ID | Test Name | Status | Executed By | Date | Severity | Notes |
|----|-----------|--------|-------------|------|----------|-------|
| ST-001 | SQL Injection | | | | High | |
| ST-002 | XSS | | | | High | |
| ST-003 | Authentication | | | | High | |
| ST-004 | Authorization | | | | Critical | |
| ST-005 | Encryption in Transit | | | | Critical | |
| ST-006 | Encryption at Rest | | | | Critical | |
| ST-007 | CSRF | | | | High | |
| ST-008 | Security Headers | | | | Medium | |
| ST-009 | Data Exposure in Logs | | | | High | |
| ST-010 | Dependency Vulnerabilities | | | | High | |

## 6. Vulnerabilities Found

| Vulnerability ID | CVE ID | Severity | Description | Affected Components | Remediation | Status |
|------------------|--------|----------|-------------|---------------------|-------------|--------|
| | | Critical/High/Medium/Low | | | | Open/In Progress/Fixed/Closed |

## 7. Sign-off

**Tested By**: _______________
**Date**: _______________
**Security Officer Approval**: _______________
**Date**: _______________

---

## Appendix A: Security Testing Tools Setup

### OWASP ZAP

```bash
# Download OWASP ZAP
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz
tar -xzf ZAP_2.14.0_Linux.tar.gz
cd ZAP_2.14.0

# Start ZAP
./zap.sh
```

### Snyk (Dependency Scanner)

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Scan project
snyk test

# Monitor project
snyk monitor
```

### OWASP Dependency-Check

```bash
# Download Dependency-Check
wget https://github.com/jeremylong/DependencyCheck/releases/download/v8.4.0/dependency-check-8.4.0-release.zip
unzip dependency-check-8.4.0-release.zip

# Run scan
./dependency-check/bin/dependency-check.sh --project "MyApp" --scan ./src
```

### SonarQube (Static Analysis)

```bash
# Run SonarQube scanner
sonar-scanner \
  -Dsonar.projectKey=myproject \
  -Dsonar.sources=./src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-token
```

---


## Appendix B: Common Attack Payloads

攻撃ペイロードの詳細なリストは、以下のリファレンスドキュメントを参照してください:

👉 **[一般的な攻撃ペイロード](../../reference/security-test-payloads.md)**

## Appendix C: Execution Timing

## Phase B (Before Release) - Manual Execution

Security tests are executed manually before creating a release tag:

1. After PR is merged to main branch
2. Before creating a release tag
3. Run all security tests in Phase B
4. All critical and high-severity vulnerabilities must be fixed before release
5. Medium/low vulnerabilities should be documented and scheduled for future fix

**Note**: All security tests, including static code analysis and dependency vulnerability scanning, are executed manually in Phase B. CI/CD during PR phase (Phase A) only runs unit tests, linting, and build checks.
