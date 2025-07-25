#!/bin/bash

# Ctrl-Alt System Test Suite
echo "🧪 Running Ctrl-Alt System Tests..."

# Set environment variables for testing
export NODE_ENV=test
export JWT_SECRET=test-secret-key
export DATABASE_URL="postgresql://test:test@localhost:5432/ctrl_alt_test"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL before running tests."
    exit 1
fi

# Run database migrations for test database
echo "📊 Setting up test database..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Run the test suite
echo "🔍 Running integration tests..."
npm test -- tests/integration/ctrl-alt-system.test.ts

echo "🔍 Running API tests..."
npm test -- tests/api/ctrls.test.ts
npm test -- tests/api/alts.test.ts

# Generate coverage report
echo "📈 Generating coverage report..."
npm test -- --coverage --testPathPattern="tests/(integration|api)"

echo "✅ All Ctrl-Alt system tests completed!"
echo ""
echo "📋 Test Summary:"
echo "   - Database schema validation"
echo "   - Ctrl (category) CRUD operations"
echo "   - Alt (configuration) CRUD operations"
echo "   - Environment variable management"
echo "   - Pterodactyl egg import/export compatibility"
echo "   - Data integrity and cascade operations"
echo ""
echo "🔍 View detailed results in the coverage/ directory"
