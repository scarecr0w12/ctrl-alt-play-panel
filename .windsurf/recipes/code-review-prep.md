---
description: Automated workflow to prepare code for review by running quality checks
---

# Code Review Preparation Workflow

This recipe provides an automated workflow to prepare code for review by running quality checks, finding TODO items, and generating a comprehensive summary.

## Prerequisites

- Git repository with staged changes
- ESLint and TypeScript installed
- Test suite configured
- Security audit tools available

## Steps

1. **Search for TODO Comments and Technical Debt**
   - Search for TODO, FIXME, and HACK comments
   - Document technical debt markers

2. **Check Git Status and Staged Changes**
   - Verify staged changes
   - Get current branch status
   - Review recent commits

3. **Run ESLint Code Quality Checks**
   - Execute linting on codebase
   - Catch code quality issues

4. **Run TypeScript Type Checking**
   - Verify TypeScript compilation
   - Check type safety

5. **Execute Test Suite**
   - Run comprehensive test suite
   - Ensure changes don't break functionality

6. **Check for Security Vulnerabilities**
   - Run security audit
   - Identify potential vulnerabilities

7. **Analyze Database Schema Changes**
   - Check for migration files
   - Review schema changes

8. **Check API Route Changes**
   - Identify new/modified API routes
   - Review impact on other systems

9. **Verify Documentation Updates**
   - Check if documentation needs updates
   - Review README and guides

10. **Generate Code Review Summary**
    - Create comprehensive summary
    - Include all findings
    - Document recent history

11. **Panel+Agent Specific Checks**
    - Validate agent configurations
    - Review frontend components
    - Check database integration

## Commands

```bash
# Search for TODO items
grep -r "TODO\|FIXME\|HACK\|XXX" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.py" --include="*.md"

# Check git status
git status --porcelain
git diff --cached --name-only
git log --oneline -5

# Run ESLint
npm run lint
npx eslint frontend/src/ src/ --ext .js,.ts,.jsx,.tsx --format stylish

# Run TypeScript type checking
npx tsc --noEmit --skipLibCheck
cd frontend && npx tsc --noEmit --skipLibCheck && cd ..

# Execute test suite
npm test
npm run test:integration
cd frontend && npm test && cd ..

# Check security vulnerabilities
npm audit --audit-level moderate
cd frontend && npm audit --audit-level moderate && cd ..

# Analyze database schema changes
ls -la prisma/migrations/
cat prisma/schema.prisma

# Check API route changes
find src/routes -name "*.js" -o -name "*.ts" | xargs grep -l "router\|app"

# Verify documentation updates
find docs -name "*.md" | xargs ls -la

# Generate code review summary
git diff --cached --stat
git log --oneline --since='1 week ago' --author="$(git config user.name)"
```

## Success Criteria

- All tests passing
- No critical linting errors
- TypeScript compilation successful
- No high-severity security vulnerabilities
- All TODO items documented
- Documentation updated if needed
- API changes properly tested
- Database migrations validated

## Troubleshooting

If any checks fail:
- Review error messages carefully
- Fix issues before submitting for review
- Run checks again after fixes
- Consult relevant documentation

## Panel+Agent Specific Considerations

- Agent configuration validation
- Frontend component review
- Database integration review
- Plugin system changes
- File manager operations
- Console component security
- WebSocket communication
- Authentication and authorization
- Service layer changes
- Middleware validation

This recipe should be run before submitting any pull request to ensure code quality and reduce review time.
