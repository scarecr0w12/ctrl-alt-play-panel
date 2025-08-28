# Testing Workflow

**Description:** Comprehensive testing automation workflow for the Panel+Agent architecture, covering unit tests, integration tests, coverage analysis, and debugging procedures.

**Usage:** `/testing-workflow.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Pre-Test Environment Setup
Verify testing environment is properly configured and dependencies are installed.

```
execute_command("node --version")
execute_command("npm --version")
execute_command("npm ls jest")
execute_command("npm ls @testing-library/react")
```

**Expected Outcome:** Testing dependencies confirmed and environment ready for test execution.

### 2. Database Test Setup
Prepare test database and ensure clean test environment.

```
execute_command("npm run db:test:reset")
execute_command("npx prisma db push --preview-feature")
execute_command("npx prisma generate")
```

**Expected Outcome:** Test database initialized with clean schema and test data prepared.

### 3. Run Unit Tests - Backend
Execute comprehensive unit tests for all backend services and utilities.

```
execute_command("npm run test:unit")
execute_command("npm test -- --testPathPattern=src/services")
execute_command("npm test -- --testPathPattern=src/utils")
execute_command("npm test -- --testPathPattern=src/middleware")
```

**Expected Outcome:** All backend unit tests passing with detailed output for any failures.

### 4. Run Unit Tests - Frontend
Execute React component and utility unit tests.

```
execute_command("cd frontend && npm test -- --watchAll=false")
execute_command("cd frontend && npm test -- --testPathPattern=components")
execute_command("cd frontend && npm test -- --testPathPattern=hooks")
execute_command("cd frontend && npm test -- --testPathPattern=utils")
```

**Expected Outcome:** All frontend unit tests passing with component rendering and logic validation.

### 5. Run Integration Tests
Execute API endpoint and database integration tests.

```
execute_command("npm run test:integration")
execute_command("npm test -- --testPathPattern=tests/api")
execute_command("npm test -- --testPathPattern=tests/integration")
```

**Expected Outcome:** All integration tests passing, confirming proper system component interaction.

### 6. Run End-to-End Tests
Execute full application workflow tests if configured.

```
execute_command("npm run test:e2e")
execute_command("cd frontend && npm run test:e2e")
```

**Expected Outcome:** Complete user workflow validation through automated browser testing.

### 7. Generate Test Coverage Report
Create comprehensive test coverage analysis for both backend and frontend.

```
execute_command("npm run test:coverage")
execute_command("cd frontend && npm test -- --coverage --watchAll=false")
execute_command("npx nyc report --reporter=html")
```

**Expected Outcome:** Detailed coverage reports identifying untested code areas.

### 8. Analyze Coverage Metrics
Review coverage thresholds and identify areas needing additional tests.

```
read_file("coverage/lcov-report/index.html")
execute_command("npx nyc check-coverage --statements 80 --branches 80 --functions 80 --lines 80")
```

**Expected Outcome:** Coverage metrics analysis with recommendations for improvement.

---

## Panel+Agent Specific Testing

### Agent Service Testing
Execute comprehensive tests for AI agent functionality and plugin system.

```
execute_command("npm test -- --testPathPattern=src/services/AgentService")
execute_command("npm test -- --testPathPattern=src/types/plugin")
execute_command("npm test -- --testPathPattern=plugins")
```

**Expected Outcome:** Agent service functionality validated including plugin integration.

### Database Model Testing
Test Prisma models and database operations.

```
execute_command("npm test -- --testPathPattern=tests/database")
execute_command("npm test -- --testPathPattern=prisma")
```

**Expected Outcome:** Database operations and model relationships properly tested.

### API Route Testing
Comprehensive testing of all API endpoints with authentication and authorization.

```
execute_command("npm test -- --testPathPattern=tests/api/agents")
execute_command("npm test -- --testPathPattern=tests/api/auth")
execute_command("npm test -- --testPathPattern=tests/api/files")
```

**Expected Outcome:** All API endpoints tested for proper responses, error handling, and security.

### Frontend Component Testing
Test React components specific to Panel+Agent functionality.

```
execute_command("cd frontend && npm test -- --testPathPattern=components/agents")
execute_command("cd frontend && npm test -- --testPathPattern=components/Console")
execute_command("cd frontend && npm test -- --testPathPattern=components/files")
```

**Expected Outcome:** UI components tested for rendering, interaction, and state management.

---

## Test Failure Investigation

### Analyze Test Output
When tests fail, perform systematic analysis of failure patterns.

```
execute_command("npm test -- --verbose")
execute_command("npm test -- --detectOpenHandles")
```

**Expected Outcome:** Detailed failure information for debugging and resolution.

### Check Test Isolation
Verify tests don't have interdependencies causing cascading failures.

```
execute_command("npm test -- --runInBand")
execute_command("npm test -- --forceExit")
```

**Expected Outcome:** Identification of test isolation issues and async operation problems.

### Database State Investigation
Check if test failures are related to database state or transaction issues.

```
execute_command("npm run db:test:inspect")
execute_command("npx prisma studio --port 5556")
```

**Expected Outcome:** Database state analysis to identify data-related test failures.

### Memory and Performance Analysis
Investigate test performance and memory usage issues.

```
execute_command("npm test -- --logHeapUsage")
execute_command("npm test -- --maxWorkers=1")
```

**Expected Outcome:** Performance metrics identifying resource-intensive tests.

---

## Test Quality Assurance

### Lint Test Files
Ensure test files follow code quality standards.

```
execute_command("npx eslint tests/ --ext .js,.ts")
execute_command("npx eslint frontend/tests/ --ext .js,.ts,.tsx")
```

**Expected Outcome:** Test files conforming to project coding standards.

### Check Test Documentation
Verify tests have proper descriptions and are well-documented.

```
search_files("tests", "describe|it|test", "*.js,*.ts")
search_files("frontend/tests", "describe|it|test", "*.js,*.ts,*.tsx")
```

**Expected Outcome:** All tests properly documented with clear descriptions.

### Validate Test Data
Ensure test data and mocks are realistic and comprehensive.

```
search_files("tests", "mock|stub|fixture", "*.js,*.ts")
read_file("tests/fixtures/testData.json")
```

**Expected Outcome:** Test data validated for completeness and realism.

---

## Performance Testing

### Load Testing (if configured)
Execute performance tests for API endpoints and critical functionality.

```
execute_command("npm run test:load")
execute_command("npm run test:stress")
```

**Expected Outcome:** Performance benchmarks and bottleneck identification.

### Memory Leak Detection
Check for memory leaks in long-running operations.

```
execute_command("npm test -- --detectLeaks")
execute_command("npm run test:memory")
```

**Expected Outcome:** Memory usage analysis and leak detection results.

---

## Test Reporting and Documentation

### Generate Test Reports
Create comprehensive test result reports for team review.

```
execute_command("npm test -- --reporters=default --reporters=jest-junit")
execute_command("npx jest-html-reporter")
```

**Expected Outcome:** Formatted test reports for stakeholder review and CI/CD integration.

### Update Test Documentation
Ensure testing documentation reflects current test suite capabilities.

```
read_file("docs/testing.md")
search_files("docs", "test|testing", "*.md")
```

**Expected Outcome:** Testing documentation updated with current procedures and coverage.

---

## Testing Checklist

### Pre-Testing Validation
- [ ] Test environment configured
- [ ] Test database initialized
- [ ] Dependencies installed and verified
- [ ] Test data prepared

### Test Execution
- [ ] Unit tests - Backend (passing)
- [ ] Unit tests - Frontend (passing)
- [ ] Integration tests (passing)
- [ ] End-to-end tests (passing)
- [ ] Agent service tests (passing)
- [ ] API endpoint tests (passing)

### Coverage Analysis
- [ ] Coverage reports generated
- [ ] Coverage thresholds met (80%+)
- [ ] Uncovered code identified
- [ ] Critical paths tested

### Quality Assurance
- [ ] Test files linted and formatted
- [ ] Test documentation updated
- [ ] Performance benchmarks met
- [ ] Memory leaks investigated

### Failure Investigation (if needed)
- [ ] Test failures analyzed
- [ ] Root causes identified
- [ ] Database state verified
- [ ] Test isolation confirmed

---

## Success Criteria

- [ ] All test suites executing successfully
- [ ] Code coverage meets or exceeds 80% threshold
- [ ] No critical test failures or blockers
- [ ] Performance tests within acceptable ranges
- [ ] Test reports generated and reviewed
- [ ] Documentation updated with test results

**Final Action:** Comprehensive test validation complete with detailed reporting and recommendations for any identified issues.