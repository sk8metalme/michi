# E2E Test Specification: {{TEST_NAME}}

**Author**: {{AUTHOR}}
**Date**: {{DATE}}
**Version**: 1.0

## 1. Overview

### 1.1 Purpose
{{PURPOSE}}

Example: To verify that end users can successfully complete critical user journeys in the {{APPLICATION_NAME}} from start to finish in a real browser environment.

### 1.2 Scope
{{SCOPE}}

Example: This test specification covers the complete user registration and login flow, including UI interactions, form validations, and successful authentication.

### 1.3 Testing Tool
- **Tool**: {{TOOL_NAME}}
- **Version**: {{VERSION}}

Example:
- **Tool**: Playwright / Selenium WebDriver / Cypress
- **Version**: 1.40.0 / 4.15.0 / 13.6.0

## 2. Test Environment

### 2.1 Software Requirements
- Browser Automation Tool: {{AUTOMATION_TOOL}} {{VERSION}}
- Browsers: {{BROWSER_LIST}}
- Application Environment: {{ENV_URL}}
- Backend API: {{API_URL}}
- Test Data Management: {{DATA_MANAGEMENT}}

Example:
- Browser Automation Tool: Playwright 1.40.0
- Browsers: Chrome 120, Firefox 121, Safari 17
- Application Environment: [https://staging.example.com](https://staging.example.com)
- Backend API: [https://api-staging.example.com](https://api-staging.example.com)
- Test Data Management: Test database with seeded data

### 2.2 Hardware Requirements
- Test Machine: {{MACHINE_SPEC}}
- Display Resolution: {{RESOLUTION_LIST}}
- Network: {{NETWORK_REQUIREMENTS}}

Example:
- Test Machine: macOS/Windows/Linux with 8GB RAM
- Display Resolution: 1920x1080 (Desktop), 768x1024 (Tablet), 375x667 (Mobile)
- Network: Stable internet connection (minimum 10 Mbps)

### 2.3 Test Data
- Test user accounts: `{{TEST_ACCOUNTS_FILE}}`
- Test data setup script: `{{SETUP_SCRIPT}}`
- Data cleanup script: `{{CLEANUP_SCRIPT}}`
- Environment variables: `{{ENV_FILE}}`

## 3. User Flows

### 3.1 User Journey Map

```text
{{STEP_1}} → {{STEP_2}} → {{STEP_3}} → {{STEP_4}} → {{STEP_5}}
```

Example:

```text
Landing Page → Sign Up Form → Email Verification → Profile Setup → Dashboard
```

### 3.2 User Flow Details

| Flow ID | Flow Name | Description | Priority | Steps |
|---------|-----------|-------------|----------|-------|
| {{FLOW_1}} | {{NAME}} | {{DESC}} | High/Medium/Low | {{COUNT}} |
| {{FLOW_2}} | {{NAME}} | {{DESC}} | High/Medium/Low | {{COUNT}} |

Example:

| Flow ID | Flow Name | Description | Priority | Steps |
|---------|-----------|-------------|----------|-------|
| UF-001 | User Registration | New user signs up and verifies email | High | 5 |
| UF-002 | Product Purchase | User browses, adds to cart, and completes checkout | High | 8 |
| UF-003 | Password Reset | User resets forgotten password | Medium | 4 |

### 3.3 Browser/Device Matrix (Optional)

**Note**: This matrix is optional. Include it if you need to test across multiple browsers and devices.

Test each user flow on the following combinations:

| Browser | Version | Desktop | Tablet | Mobile | Priority |
|---------|---------|---------|--------|--------|----------|
| Chrome | {{VER}} | ✓ | ✓ | ✓ | High |
| Firefox | {{VER}} | ✓ | - | - | Medium |
| Safari | {{VER}} | ✓ | ✓ | ✓ | High |
| Edge | {{VER}} | ✓ | - | - | Low |

Example:

| Browser | Version | Desktop | Tablet | Mobile | Priority |
|---------|---------|---------|--------|--------|----------|
| Chrome | 120+ | ✓ | ✓ | ✓ | High |
| Firefox | 121+ | ✓ | - | - | Medium |
| Safari | 17+ | ✓ | ✓ | ✓ | High |
| Edge | 120+ | ✓ | - | - | Low |

**Priority Guide**:
- High: Must test on all marked platforms
- Medium: Test on desktop only
- Low: Test if time permits

## 4. Test Cases

### Test Case E2E-001: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that a new user can complete the entire registration process from landing page to successful login.

**User Flow**: {{FLOW_ID}}
**Browser/Device**: {{BROWSER}} / {{DEVICE}}

Example:
**User Flow**: UF-001 (User Registration)
**Browser/Device**: Chrome / Desktop

**Preconditions**:
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

Example:
- Application is deployed to staging environment
- Test email account is accessible
- No existing user with test email address

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}
4. {{STEP_4}}
5. {{STEP_5}}

Example:
1. Navigate to `https://staging.example.com`
2. Click "Sign Up" button
3. Fill in registration form (name: "Test User", email: "test@example.com", password: "Test1234!")
4. Click "Create Account" button
5. Verify confirmation message appears
6. Check email inbox for verification link
7. Click verification link in email
8. Verify redirect to profile setup page
9. Complete profile setup
10. Verify redirect to dashboard with welcome message

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- User is successfully registered
- Verification email is received within 1 minute
- Profile setup page loads correctly
- Dashboard displays user name and welcome message
- User can logout and login again with credentials

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Screenshots/Videos**:
- [ ] Screenshot of each major step
- [ ] Video recording of entire flow

**Notes**:
{{NOTES}}

---

### Test Case E2E-002: {{TEST_CASE_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that a user can complete a product purchase from search to payment confirmation.

**User Flow**: {{FLOW_ID}}
**Browser/Device**: {{BROWSER}} / {{DEVICE}}

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

**Screenshots/Videos**:
- [ ] Screenshot of each major step
- [ ] Video recording of entire flow

**Notes**:
{{NOTES}}

---

### Test Case E2E-003: Error Handling - {{SCENARIO_NAME}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that user receives appropriate error messages when submitting invalid registration data.

**User Flow**: {{FLOW_ID}}
**Browser/Device**: {{BROWSER}} / {{DEVICE}}

**Preconditions**:
- {{PRECONDITION}}

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Navigate to registration page
2. Enter invalid email format: "notanemail"
3. Enter password less than minimum length: "123"
4. Click "Create Account"
5. Verify inline error messages appear for each field
6. Verify error messages are user-friendly and actionable

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Email field shows error: "Please enter a valid email address"
- Password field shows error: "Password must be at least 8 characters"
- Submit button remains disabled or form doesn't submit
- No server error occurs

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Screenshots/Videos**:
- [ ] Screenshot of error messages

**Notes**:
{{NOTES}}

---

### Test Case E2E-004: Responsive Design - {{DEVICE_TYPE}}

**Description**: {{TEST_CASE_DESCRIPTION}}

Example: Verify that the registration flow works correctly on mobile devices with proper responsive design.

**User Flow**: {{FLOW_ID}}
**Browser/Device**: {{BROWSER}} / {{DEVICE}}

Example:
**Browser/Device**: Chrome / Mobile (375x667)

**Preconditions**:
- {{PRECONDITION}}

**Test Steps**:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

Example:
1. Open browser with mobile viewport (375x667)
2. Navigate to registration page
3. Verify all form fields are visible and accessible
4. Verify buttons are appropriately sized for touch
5. Complete registration flow
6. Verify no horizontal scrolling required
7. Verify all interactive elements are easily tappable

**Expected Results**:
{{EXPECTED_RESULTS}}

Example:
- Layout adapts properly to mobile viewport
- All text is readable without zooming
- Form fields are properly sized
- Navigation is accessible via hamburger menu
- No UI elements are cut off or overlapping

**Actual Results**:
[To be filled during test execution]

**Status**: [ ] Pass / [ ] Fail / [ ] Blocked

**Screenshots/Videos**:
- [ ] Screenshots at different viewport sizes
- [ ] Video of mobile interaction

**Notes**:
{{NOTES}}

---

## 5. Test Execution Summary

| ID | Test Name | Flow | Browser | Device | Status | Date | Notes |
|----|-----------|------|---------|--------|--------|------|-------|
| E2E-001 | {{NAME}} | {{FLOW}} | Chrome | Desktop | | | |
| E2E-002 | {{NAME}} | {{FLOW}} | Chrome | Desktop | | | |
| E2E-003 | {{NAME}} | {{FLOW}} | Firefox | Desktop | | | |
| E2E-004 | {{NAME}} | {{FLOW}} | Chrome | Mobile | | | |

## 6. Defects Found

| Defect ID | Severity | Description | Browser/Device | Screenshot/Video | Status |
|-----------|----------|-------------|----------------|------------------|--------|
| | High/Medium/Low | | | | Open/In Progress/Fixed/Closed |

## 7. Sign-off

**Tested By**: _______________
**Date**: _______________
**Approved By**: _______________
**Date**: _______________

---

## Appendix A: Test Environment Setup

### Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

### Selenium WebDriver Setup

```bash
# Install Selenium (Node.js)
npm install selenium-webdriver

# Download browser drivers
# ChromeDriver, GeckoDriver, etc.

# Run tests
node e2e-tests/registration.test.js
```

### Cypress Setup

```bash
# Install Cypress
npm install -D cypress

# Open Cypress
npx cypress open

# Run tests headless
npx cypress run

# Run specific test
npx cypress run --spec "cypress/e2e/registration.cy.js"
```

## Appendix B: Code Examples

### Example E2E Test Code (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('User registration flow', async ({ page }) => {
  // Navigate to landing page
  await page.goto('https://staging.example.com');

  // Click sign up button
  await page.click('text=Sign Up');

  // Fill registration form
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Test1234!');

  // Submit form
  await page.click('button[type="submit"]');

  // Verify confirmation message
  await expect(page.locator('text=Account created successfully')).toBeVisible();

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Welcome, Test User')).toBeVisible();
});

test('Registration with invalid email', async ({ page }) => {
  await page.goto('https://staging.example.com/signup');

  await page.fill('input[name="email"]', 'notanemail');
  await page.fill('input[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  // Verify error message
  await expect(page.locator('text=Please enter a valid email')).toBeVisible();
});
```

### Example E2E Test Code (Selenium WebDriver)

```javascript
const { Builder, By, until } = require('selenium-webdriver');

async function testUserRegistration() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    // Navigate to landing page
    await driver.get('https://staging.example.com');

    // Click sign up button
    await driver.findElement(By.linkText('Sign Up')).click();

    // Fill registration form
    await driver.findElement(By.name('name')).sendKeys('Test User');
    await driver.findElement(By.name('email')).sendKeys('test@example.com');
    await driver.findElement(By.name('password')).sendKeys('Test1234!');

    // Submit form
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for confirmation
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Account created")]')), 5000);

    // Verify redirect
    let currentUrl = await driver.getCurrentUrl();
    assert(currentUrl.includes('dashboard'));

  } finally {
    await driver.quit();
  }
}

testUserRegistration();
```

### Example E2E Test Code (Cypress)

```javascript
describe('User Registration Flow', () => {
  it('should complete registration successfully', () => {
    // Navigate to landing page
    cy.visit('https://staging.example.com');

    // Click sign up button
    cy.contains('Sign Up').click();

    // Fill registration form
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Test1234!');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify confirmation
    cy.contains('Account created successfully').should('be.visible');

    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, Test User').should('be.visible');
  });

  it('should show error for invalid email', () => {
    cy.visit('https://staging.example.com/signup');

    cy.get('input[name="email"]').type('notanemail');
    cy.get('input[name="password"]').type('Test1234!');
    cy.get('button[type="submit"]').click();

    // Verify error message
    cy.contains('Please enter a valid email').should('be.visible');
  });
});
```

## Appendix C: Screenshot and Video Configuration (Optional)

**Note**: This section is optional. Include it if you need to configure screenshot and video capture for your E2E tests.

### Playwright Configuration

```typescript
// playwright.config.ts
export default {
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
};
```

### Cypress Configuration

```javascript
// cypress.config.js
module.exports = {
  video: true,
  screenshotOnRunFailure: true,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
};
```

## Appendix D: Execution Timing (Optional)

**Note**: This section is optional. Include it if you need to specify when E2E tests should be executed.

## Phase B (Before Release) - Manual Execution

E2E tests are executed manually before creating a release tag:

1. After PR is merged to main branch
2. Before creating a release tag
3. Run all E2E tests in Phase B
4. Verify all critical user flows pass before proceeding to release

E2E tests are **NOT** executed automatically in CI/CD during PR phase (only unit tests run automatically).
