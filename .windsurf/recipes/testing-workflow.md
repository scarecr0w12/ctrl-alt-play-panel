---
description: Comprehensive testing automation workflow for the Panel+Agent architecture
---

# Testing Workflow

This recipe provides a comprehensive testing automation workflow for the Panel+Agent architecture, covering unit tests, integration tests, coverage analysis, and debugging procedures.

## Prerequisites

- Node.js and npm installed
- Docker and Docker Compose for containerized services
- PostgreSQL database for testing
- Redis for caching testing

## Steps

1. **Environment Setup**
   - Ensure all required services are running
   - Set up test database
   - Install dependencies

2. **Run Unit Tests**
   - Execute backend unit tests
   - Execute frontend unit tests
   - Check for test failures

3. **Run Integration Tests**
   - Execute API integration tests
   - Execute database integration tests
   - Execute agent service integration tests

4. **Run End-to-End Tests**
   - Execute comprehensive E2E tests
   - Validate Panel-Agent communication
   - Check plugin system functionality

5. **Coverage Analysis**
   - Generate coverage reports
   - Analyze coverage thresholds
   - Identify uncovered code paths

6. **Performance Testing**
   - Run load tests
   - Analyze performance metrics
   - Identify bottlenecks

7. **Test Reporting**
   - Generate test reports
   - Update test documentation
   - Document any failures

## Commands

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:coverage

# Run performance tests
npm run test:performance

# Generate test reports
npm run test:report
```

## Success Criteria

- All test suites execute successfully
- Code coverage meets or exceeds 80% threshold
- No critical test failures or blockers
- Performance tests within acceptable ranges
- Test reports generated and reviewed

## Troubleshooting

If tests fail:
- Check service dependencies (PostgreSQL, Redis)
- Verify environment variables
- Review test logs for specific error messages
- Run tests with verbose output for detailed information

## Panel+Agent Specific Considerations

- Validate Agent service functionality
- Test Plugin system integration
- Verify File Manager operations
- Check Console component security
- Confirm WebSocket communication

This recipe should be run before any code changes are merged to ensure code quality and prevent regressions.
