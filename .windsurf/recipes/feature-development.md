---
description: Complete automation workflow for developing new features in the Panel+Agent architecture
---

# Feature Development Workflow

This recipe provides a complete automation workflow for developing new features in the Panel+Agent architecture, from branch creation to initial implementation setup.

## Prerequisites

- Git repository properly configured
- Node.js and npm installed
- Docker and Docker Compose for containerized services
- PostgreSQL database for development
- All project dependencies installed

## Steps

1. **Create Feature Branch**
   - Create a new git branch following the project's naming convention
   - Switch to the new branch

2. **Verify Development Environment**
   - Check that all necessary dependencies and services are available
   - Confirm development environment is properly configured

3. **Install and Update Dependencies**
   - Ensure all project dependencies are up to date
   - Address security vulnerabilities

4. **Run Initial Test Suite**
   - Execute baseline tests to ensure stable starting point

5. **Check Database Schema Status**
   - Verify database schema is up to date
   - Synchronize Prisma client

6. **Create Feature Template Files**
   - Generate template files following project conventions

7. **Generate API Route Template**
   - Create template API route file following routing patterns

8. **Generate Frontend Component Template**
   - Create React component template following project patterns

9. **Generate Database Model Template**
   - Create Prisma model template if feature requires database changes

10. **Create Test Templates**
    - Generate comprehensive test templates for the new feature

11. **Panel+Agent Specific Setup**
    - Set up agent service integration templates
    - Create plugin system integration templates
    - Set up console component templates
    - Create file manager integration templates

12. **Development Environment Validation**
    - Verify all required Docker services are running
    - Start development servers
    - Verify database connectivity

13. **Code Quality Setup**
    - Verify ESLint configuration
    - Ensure TypeScript can compile new files
    - Format new template files according to standards

## Commands

```bash
# Create feature branch
git checkout -b feature/$(date +%Y%m%d)-new-feature
git status

# Verify development environment
node --version
npm --version
docker --version
npm ls --depth=0

# Install and update dependencies
npm install
cd frontend && npm install
npm audit fix --audit-level moderate

# Run initial test suite
npm test
npm run test:integration
cd frontend && npm test

# Check database schema status
npx prisma generate
npx prisma db push --preview-feature

# Create feature template files
mkdir -p src/features/new-feature
mkdir -p frontend/components/features/new-feature
mkdir -p tests/features/new-feature

# Development environment validation
docker-compose ps
docker-compose logs --tail=10
npm run dev &
cd frontend && npm run dev &
npx prisma db pull
npm run db:test-connection

# Code quality setup
npx eslint src/features/new-feature/ --init
npx tsc --noEmit --skipLibCheck
npx prettier --write src/features/new-feature/
```

## Success Criteria

- Feature branch created and checked out
- Development environment verified and ready
- All template files generated
- Database schema updated (if needed)
- Initial tests passing
- Development servers running
- Code quality tools configured
- Feature development checklist prepared

## Troubleshooting

If any setup steps fail:
- Verify all prerequisites are installed
- Check that Docker services are running
- Review error messages for specific issues
- Ensure database connectivity is working
- Validate that all dependencies are correctly installed

## Panel+Agent Specific Considerations

- Agent service integration templates
- Plugin system integration templates
- Console component integration templates
- File manager integration templates
- Database schema updates for new features
- API route configuration following project patterns
- Frontend component creation with TypeScript interfaces
- Test templates for all new functionality

This recipe should be used when starting development of new features in the Ctrl-Alt-Play Panel project.
