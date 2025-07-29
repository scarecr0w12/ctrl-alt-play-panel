# Testing Documentation

The Ctrl-Alt-Play Panel implements comprehensive testing strategies designed for environment-agnostic execution, external service mocking, and cross-platform compatibility. The testing architecture ensures reliable test execution across development, CI/CD, and production environments without external dependencies.

## Testing Architecture

### Environment-Agnostic Testing Strategy

**CRITICAL PATTERN**: Complete external service mocking enables tests to run in any environment without dependencies. Mock implementations for Prisma, Redis, Steam API, and all external services ensure consistent test execution across Ubuntu, Windows, macOS, and CI/CD environments.

**Key Principles:**
- **Zero External Dependencies**: All tests run without requiring external services
- **Cross-Platform Compatibility**: Identical test execution across all operating systems
- **Deterministic Results**: Consistent test outcomes regardless of environment
- **Fast Execution**: No network calls or database setup delays

### Testing Technology Stack

**Primary Framework**: Jest
**Location**: `/tests/` directory
**Configuration**:
- `jest.config.js` - Jest configuration with TypeScript support
- `tests/jest.setup.ts` - Comprehensive service mocking setup
- `tests/setup.ts` - Test database management with foreign key handling
- `.env.test` - Test environment configuration

## Core Testing Patterns

### Mock Service Pattern

**CRITICAL IMPLEMENTATION**: Complete external service mocking for environment-agnostic testing ensures tests run in any environment without dependencies.

**Implementation Location**: `tests/jest.setup.ts`

**Mocked Services:**
- **Prisma Client**: Database operations with in-memory data
- **Redis Client**: Caching and session storage
- **Steam Web API**: Workshop and user data
- **Docker API**: Container management operations
- **File System Operations**: Agent file management
- **External HTTP Requests**: All external API calls

**Mock Implementation Example:**
```typescript
// Prisma Mock Implementation
const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  server: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // ... other models
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));
```

### Test Database Pattern

**Implementation Location**: `tests/setup.ts`

**Key Features:**
- **Isolated Test Database**: Separate database for testing with foreign key handling
- **Automatic Setup/Cleanup**: Database reset between test runs
- **Consistent State**: Predictable data state for each test

### Cross-Platform Testing

**Implementation Approach:**
- **Environment Variables**: Consistent configuration across platforms
- **Path Handling**: Platform-agnostic file path operations
- **Service Mocking**: Eliminates platform-specific dependencies
- **Docker Integration**: Containerized testing for consistency

## Test Organization

### Test Types

1. **Unit Tests**: Individual function and component testing
2. **Integration Tests**: Multi-component interaction testing
3. **API Tests**: REST endpoint validation
4. **E2E Tests**: Full application workflow testing
5. **Security Tests**: Vulnerability and penetration testing
6. **Performance Tests**: Load and stress testing

### Directory Structure
```
tests/
├── unit/            # Unit tests
│   ├── services/    # Service layer tests
│   ├── utils/       # Utility function tests
│   └── helpers/     # Helper function tests
├── integration/     # Integration tests
│   ├── api/         # API endpoint tests
│   ├── database/    # Database integration tests
│   └── services/    # Service integration tests
├── e2e/             # End-to-end tests
├── security/        # Security tests
├── performance/     # Performance tests
├── fixtures/        # Test data fixtures
├── helpers/         # Test helper functions
├── jest.setup.ts    # Jest global setup
├── setup.ts         # Database test setup
└── globalSetup.ts   # Global test initialization
```

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/services/userService.test.ts
```

### Test Environment

The testing environment is configured through `.env.test`:

```
# Test Database
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
DATABASE_TYPE=postgresql

# Test Redis
REDIS_URL=redis://localhost:6379

# Test JWT
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=3600

# Test Environment
NODE_ENV=test
LOG_LEVEL=silent
```

## CI/CD Integration

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration:

**Workflow Location**: `.github/workflows/ci.yml`

**Key Features:**
- **Multi-Node Testing**: Node.js 18 and 20 compatibility
- **Cross-Platform**: Ubuntu, Windows, and macOS testing
- **Security Scanning**: Automated vulnerability detection
- **Docker Testing**: Container build and validation
- **Deployment Readiness**: Pre-deployment validation

### Quality Gates

The CI/CD pipeline enforces several quality gates:

1. **TypeScript Compilation**: All code must compile without errors
2. **Test Coverage**: Minimum 80% code coverage required
3. **Security Scanning**: No critical vulnerabilities allowed
4. **Code Quality**: ESLint and Prettier compliance
5. **Performance Benchmarks**: Response time requirements

## Test Data Management

### Fixtures

Test data fixtures are located in `/tests/fixtures/`:

- **User Data**: Sample user accounts and permissions
- **Server Data**: Sample server configurations
- **Node Data**: Sample infrastructure nodes
- **Alt Data**: Sample configuration templates

### Factory Pattern

The project uses a factory pattern for test data creation:

```typescript
// User Factory
const createUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'USER',
  ...overrides,
});

// Server Factory
const createServer = (overrides = {}) => ({
  name: 'Test Server',
  port: 25565,
  status: 'STOPPED',
  ...overrides,
});
```

## Best Practices

### Test Writing Guidelines

1. **Descriptive Test Names**: Clearly describe what is being tested
2. **Single Responsibility**: Each test should verify one behavior
3. **Isolation**: Tests should not depend on each other
4. **Setup/Teardown**: Properly initialize and clean up test data
5. **Assertions**: Use specific and meaningful assertions
6. **Mocking**: Mock external dependencies appropriately

### Performance Considerations

1. **Parallel Execution**: Run tests in parallel when possible
2. **Database Cleanup**: Efficiently reset test database state
3. **Mock Heavy Operations**: Avoid slow operations in tests
4. **Focused Testing**: Run only relevant tests during development

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with debugging
npm test -- --inspect-brk

# Run specific test suite
npm test -- --testNamePattern="User Service"
```

## Coverage Reporting

The project generates coverage reports in multiple formats:

- **HTML**: Interactive coverage report in `coverage/`
- **JSON**: Machine-readable coverage data
- **Text**: Console summary of coverage
- **Clover**: XML format for CI/CD integration

To view coverage:

```bash
# Generate and open coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```