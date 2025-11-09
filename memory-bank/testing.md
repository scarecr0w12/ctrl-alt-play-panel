# Testing Documentation

## Overview

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
  $disconnect: jest.fn(),
};
```

### Test Database Pattern

**CRITICAL PATTERN**: Isolated test database with proper cleanup and foreign key handling ensures consistent test execution and prevents data corruption.

**Implementation Location**: `tests/setup.ts`

**Key Features:**
- **Foreign Key Aware Cleanup**: Proper deletion order respecting database constraints
- **Isolated Test Data**: Each test starts with clean state
- **Parallel Test Support**: Multiple test suites can run simultaneously
- **Automatic Cleanup**: Test data removed after each test

**Database Cleanup Implementation:**
```typescript
// tests/setup.ts - cleanupTestDatabase()
export async function cleanupTestDatabase() {
  // Delete in proper order respecting foreign keys
  await prisma.server.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.alt.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.node.deleteMany({});
  await prisma.ctrl.deleteMany({});
  await prisma.permission.deleteMany({});
}
```

### Cross-Platform Testing Pattern

**CRITICAL PATTERN**: Validation across Ubuntu, Windows, macOS environments ensures deployment reliability and developer productivity across different systems.

**Implementation Location**: `.github/workflows/ci.yml`

**Platform Matrix:**
- **Ubuntu Latest**: Primary Linux testing environment
- **Windows Latest**: Windows development environment
- **macOS Latest**: macOS development environment

**Platform-Specific Considerations:**
- Path separator handling (Windows vs Unix)
- Environment variable syntax
- File permission differences
- Docker availability variations

## Testing Infrastructure

### Jest Configuration

**Global Setup Pattern:**
```typescript
// tests/globalSetup.ts
export default async function globalSetup() {
  // Initialize test database
  // Set up test environment variables
  // Configure global test state
}
```

**Global Teardown Pattern:**
```typescript
// tests/globalTeardown.ts
export default async function globalTeardown() {
  // Clean up test database
  // Disconnect from services
  // Reset global state
}
```

**Test Lifecycle Management:**
```typescript
// tests/setup.ts
beforeEach(async () => {
  await cleanupTestDatabase();
  await seedTestData();
});

afterEach(async () => {
  await cleanupTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### CI/CD Pipeline Testing

**Implementation Location**: `.github/workflows/ci.yml`

**Pipeline Features:**
- **Multi-Platform Matrix**: Tests run on Ubuntu, Windows, macOS
- **Node.js Version Matrix**: Multiple Node.js versions tested
- **Docker Integration**: Container builds and testing
- **Security Scanning**: Trivy vulnerability detection
- **Deployment Validation**: End-to-end deployment testing

**Pipeline Stages:**
1. **Dependency Installation**: npm install across platforms
2. **Type Checking**: TypeScript compilation validation
3. **Unit Testing**: Jest test suite execution
4. **Integration Testing**: API endpoint testing
5. **Security Scanning**: Vulnerability assessment
6. **Docker Testing**: Container build and functionality
7. **Deployment Testing**: Full deployment validation

## Test Categories

### Unit Tests

**Scope**: Individual functions and components
**Pattern**: Isolated testing with comprehensive mocking
**Coverage**: Business logic, utilities, services

**Example Test Structure:**
```typescript
describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { username: 'test', email: 'test@example.com' };
      prismaMock.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: userData
      });
    });
  });
});
```

### Integration Tests

**Scope**: API endpoints and service interactions
**Pattern**: Full request/response cycle testing
**Coverage**: Route handlers, middleware, authentication

**Example Integration Test:**
```typescript
describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should authenticate valid user', async () => {
      // Arrange
      const credentials = { username: 'admin', password: 'password' };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });
});
```

### End-to-End Tests

**Scope**: Complete user workflows
**Pattern**: Browser automation with Puppeteer
**Coverage**: Critical user journeys, UI interactions

### Performance Tests

**Scope**: Load testing and performance validation
**Pattern**: Stress testing with realistic data volumes
**Coverage**: API response times, database query performance

## Quality Assurance Guidelines

### Test Coverage Requirements

**Minimum Coverage Targets:**
- **Unit Tests**: 90% line coverage
- **Integration Tests**: 80% endpoint coverage
- **Critical Paths**: 100% coverage for authentication, authorization, data persistence

**Coverage Exclusions:**
- Configuration files
- Type definitions
- Third-party integrations (mocked)

### Test Data Management

**Test Data Strategy:**
- **Fixtures**: Predefined test data sets
- **Factories**: Dynamic test data generation
- **Builders**: Flexible test object construction
- **Cleanup**: Automatic test data removal

**Test Data Patterns:**
```typescript
// Test data factory
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
  ...overrides
});

// Test data builder
export class ServerBuilder {
  private server = {
    id: 'test-server-id',
    name: 'Test Server',
    status: 'STOPPED'
  };

  withName(name: string) {
    this.server.name = name;
    return this;
  }

  withStatus(status: string) {
    this.server.status = status;
    return this;
  }

  build() {
    return { ...this.server };
  }
}
```

### Error Testing Patterns

**Error Scenario Coverage:**
- **Invalid Input**: Malformed requests, missing required fields
- **Authentication Failures**: Invalid tokens, expired sessions
- **Authorization Failures**: Insufficient permissions, resource access
- **Service Failures**: Database connectivity, external service errors
- **Network Failures**: Timeout scenarios, connection drops

**Error Test Implementation:**
```typescript
describe('Error Handling', () => {
  it('should handle database connection error', async () => {
    // Arrange
    prismaMock.user.findMany.mockRejectedValue(new Error('Connection failed'));

    // Act & Assert
    await expect(userService.getAllUsers()).rejects.toThrow('Connection failed');
  });
});
```

## Testing Best Practices

### Test Organization

**File Structure:**
```
tests/
├── unit/              # Unit tests
│   ├── services/     # Service layer tests
│   ├── utils/        # Utility function tests
│   └── middleware/   # Middleware tests
├── integration/      # Integration tests
│   ├── api/         # API endpoint tests
│   └── database/    # Database integration tests
├── e2e/             # End-to-end tests
├── fixtures/        # Test data fixtures
├── helpers/         # Test helper functions
├── jest.setup.ts    # Jest global setup
├── setup.ts         # Database test setup
└── globalSetup.ts   # Global test initialization
```

### Test Naming Conventions

**Describe Blocks**: Use component/function names
**Test Cases**: Use "should [expected behavior] when [condition]" pattern
**Variables**: Descriptive names indicating test scenario

**Example:**
```typescript
describe('AuthMiddleware', () => {
  describe('validateToken', () => {
    it('should return user data when token is valid', () => {});
    it('should throw error when token is expired', () => {});
    it('should throw error when token is malformed', () => {});
  });
});
```

### Assertion Patterns

**Specific Assertions**: Use precise matchers
**Custom Matchers**: Extend Jest for domain-specific assertions
**Async Testing**: Proper handling of promises and async operations

## Debugging and Troubleshooting

### Test Debugging Strategies

**Console Debugging**: Strategic console.log placement
**Jest Debug Mode**: --inspect and --inspect-brk flags
**VSCode Integration**: Debug configuration for tests
**Mock Inspection**: Verify mock call arguments and returns

### Common Testing Issues

**Foreign Key Constraints**: Ensure proper cleanup order
**Mock State Pollution**: Clear mocks between tests
**Async Race Conditions**: Proper async/await usage
**Environment Variables**: Consistent test environment setup

### Performance Optimization

**Test Execution Speed:**
- Parallel test execution with Jest workers
- Selective test running with --changed flag
- Mock optimization to reduce setup time
- Database connection pooling

## Implementation References

### Critical Testing Files

1. **Jest Configuration**
   - `jest.config.js` - Main Jest configuration
   - `tests/jest.setup.ts` - Global mocking setup
   - `.env.test` - Test environment variables

2. **Database Testing**
   - `tests/setup.ts` - Database cleanup and seeding
   - `tests/globalSetup.ts` - Global test database initialization
   - `tests/globalTeardown.ts` - Global test cleanup

3. **CI/CD Integration**
   - `.github/workflows/ci.yml` - Automated testing pipeline
   - Cross-platform test execution
   - Security scanning integration

### Testing Decision Log References

**Critical Decisions:**
- **2025-07-25**: Database foreign key constraint issues completely resolved with proper test cleanup
- **2025-07-27**: Environment-agnostic testing strategy implemented with complete external service mocking
- **2025-07-27**: Cross-platform CI/CD pipeline established for Ubuntu, Windows, macOS testing

This testing architecture ensures reliable, fast, and maintainable test execution across all environments while providing comprehensive coverage of the Panel+Agent distributed system functionality.