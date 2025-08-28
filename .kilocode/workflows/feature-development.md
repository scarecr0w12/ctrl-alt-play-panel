# Feature Development Workflow

**Description:** Complete automation workflow for developing new features in the Panel+Agent architecture, from branch creation to initial implementation setup.

**Usage:** `/feature-development.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Create Feature Branch
Create a new git branch following the project's naming convention and switch to it.

```
execute_command("git checkout -b feature/$(date +%Y%m%d)-new-feature")
execute_command("git status")
```

**Expected Outcome:** New feature branch created and checked out, ready for development.

### 2. Verify Development Environment
Check that all necessary dependencies and services are available for development.

```
execute_command("node --version")
execute_command("npm --version")
execute_command("docker --version")
execute_command("npm ls --depth=0")
```

**Expected Outcome:** Confirmation that development environment is properly configured.

### 3. Install and Update Dependencies
Ensure all project dependencies are up to date for feature development.

```
execute_command("npm install")
execute_command("cd frontend && npm install")
execute_command("npm audit fix --audit-level moderate")
```

**Expected Outcome:** All dependencies installed and security vulnerabilities addressed.

### 4. Run Initial Test Suite
Execute baseline tests to ensure the starting point is stable before feature development.

```
execute_command("npm test")
execute_command("npm run test:integration")
execute_command("cd frontend && npm test")
```

**Expected Outcome:** All existing tests passing, confirming stable baseline for feature development.

### 5. Check Database Schema Status
Verify database schema is up to date and ready for potential new migrations.

```
execute_command("npx prisma generate")
execute_command("npx prisma db push --preview-feature")
read_file("prisma/schema.prisma")
```

**Expected Outcome:** Database schema synchronized and Prisma client updated.

### 6. Create Feature Template Files
Generate template files for the new feature based on Panel+Agent patterns.

```
execute_command("mkdir -p src/features/new-feature")
execute_command("mkdir -p frontend/components/features/new-feature")
execute_command("mkdir -p tests/features/new-feature")
```

**Expected Outcome:** Feature directory structure created following project conventions.

### 7. Generate API Route Template
Create template API route file following the project's routing patterns.

```
read_file("src/routes/agents.ts")
```

**Template Creation:** Generate new route file with:
- Express router setup
- Middleware configuration
- CRUD operation stubs
- Error handling
- TypeScript interfaces

### 8. Generate Frontend Component Template
Create React component template following the project's component patterns.

```
read_file("frontend/components/agents/AgentCard.tsx")
```

**Template Creation:** Generate new component with:
- TypeScript interface definitions
- React functional component structure
- Props validation
- Basic styling setup
- Test file stub

### 9. Generate Database Model Template
Create Prisma model template if the feature requires database changes.

```
read_file("src/types/plugin/PluginTypes.ts")
```

**Template Creation:** Generate:
- Prisma schema additions
- TypeScript type definitions
- Database service methods
- Migration preparation

### 10. Create Test Templates
Generate comprehensive test templates for the new feature.

```
read_file("tests/api/agents.test.ts")
read_file("frontend/tests/pages/agents.test.tsx")
```

**Template Creation:** Generate:
- Unit test templates
- Integration test templates
- Frontend component tests
- API endpoint tests

---

## Panel+Agent Specific Setup

### Agent Service Integration
Set up templates for agent-specific functionality integration.

```
read_file("src/services/AgentService.ts")
```

**Template Creation:** Generate agent service methods and interfaces.

### Plugin System Integration
Create templates for plugin system integration if needed.

```
read_file("src/types/plugin/PluginTypes.ts")
read_file("plugins/example-plugin/manifest.json")
```

**Template Creation:** Generate plugin interfaces and configuration templates.

### Console Component Integration
Set up console component templates for admin functionality.

```
read_file("frontend/components/Console/ConsolePanel.tsx")
```

**Template Creation:** Generate console integration components.

### File Manager Integration
Create templates for file manager functionality if needed.

```
read_file("frontend/components/files/FileManager.tsx")
```

**Template Creation:** Generate file management component templates.

---

## Development Environment Validation

### Docker Services Check
Verify all required Docker services are running.

```
execute_command("docker-compose ps")
execute_command("docker-compose logs --tail=10")
```

### Development Server Setup
Start development servers if not already running.

```
execute_command("npm run dev &")
execute_command("cd frontend && npm run dev &")
```

### Database Connection Test
Verify database connectivity and perform basic operations test.

```
execute_command("npx prisma db pull")
execute_command("npm run db:test-connection")
```

---

## Code Quality Setup

### ESLint Configuration
Verify ESLint is configured for the new feature files.

```
execute_command("npx eslint src/features/new-feature/ --init")
```

### TypeScript Configuration
Ensure TypeScript can compile the new feature files.

```
execute_command("npx tsc --noEmit --skipLibCheck")
```

### Prettier Setup
Format new template files according to project standards.

```
execute_command("npx prettier --write src/features/new-feature/")
```

---

## Feature Development Checklist

### Backend Development
- [ ] API routes created and configured
- [ ] Database models defined (if needed)
- [ ] Service layer methods implemented
- [ ] Middleware configured
- [ ] Error handling implemented
- [ ] TypeScript interfaces defined

### Frontend Development
- [ ] React components created
- [ ] State management configured
- [ ] Routing setup completed
- [ ] UI components styled
- [ ] Form validation implemented
- [ ] API integration completed

### Testing Setup
- [ ] Unit tests created
- [ ] Integration tests implemented
- [ ] Frontend component tests written
- [ ] API endpoint tests configured
- [ ] Mock data prepared
- [ ] Test coverage verified

### Documentation
- [ ] API documentation updated
- [ ] Component documentation written
- [ ] README updated with new feature
- [ ] Migration guide created (if needed)

---

## Success Criteria

- [ ] Feature branch created and checked out
- [ ] Development environment verified and ready
- [ ] All template files generated
- [ ] Database schema updated (if needed)
- [ ] Initial tests passing
- [ ] Development servers running
- [ ] Code quality tools configured
- [ ] Feature development checklist prepared

**Final Action:** Development environment fully configured and ready for feature implementation to begin.