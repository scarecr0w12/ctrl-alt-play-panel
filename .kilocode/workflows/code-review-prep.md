# Code Review Preparation Workflow

**Description:** Automated workflow to prepare code for review by running quality checks, finding TODO items, and generating a comprehensive summary.

**Usage:** `/code-review-prep.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Search for TODO Comments and Technical Debt
Search for TODO, FIXME, and HACK comments that need attention before code review.

```
search_files(".", "TODO|FIXME|HACK|XXX", "*.js,*.ts,*.jsx,*.tsx,*.py,*.md")
```

**Expected Outcome:** List of all pending TODO items and technical debt markers that reviewers should be aware of.

### 2. Check Git Status and Staged Changes
Verify what changes are staged for review and get the current branch status.

```
execute_command("git status --porcelain")
execute_command("git diff --cached --name-only")
execute_command("git log --oneline -5")
```

**Expected Outcome:** Clear overview of staged changes and recent commits for context.

### 3. Run ESLint Code Quality Checks
Execute linting to catch code quality issues before review.

```
execute_command("npm run lint")
execute_command("npx eslint frontend/src/ src/ --ext .js,.ts,.jsx,.tsx --format stylish")
```

**Expected Outcome:** Clean linting report or list of issues to address before review.

### 4. Run TypeScript Type Checking
Verify TypeScript compilation and type safety.

```
execute_command("npx tsc --noEmit --skipLibCheck")
execute_command("cd frontend && npx tsc --noEmit --skipLibCheck")
```

**Expected Outcome:** Confirmation of type safety or list of type errors to fix.

### 5. Execute Test Suite
Run comprehensive test suite to ensure changes don't break existing functionality.

```
execute_command("npm test")
execute_command("npm run test:integration")
execute_command("cd frontend && npm test")
```

**Expected Outcome:** All tests passing or clear report of test failures that need attention.

### 6. Check for Security Vulnerabilities
Run security audit to identify potential vulnerabilities.

```
execute_command("npm audit --audit-level moderate")
execute_command("cd frontend && npm audit --audit-level moderate")
```

**Expected Outcome:** Security audit report highlighting any vulnerabilities to address.

### 7. Analyze Database Schema Changes
Check for any database migration files or schema changes that need review.

```
search_files("prisma/migrations", ".*", "*.sql")
read_file("prisma/schema.prisma")
```

**Expected Outcome:** Overview of any database changes that require special attention during review.

### 8. Check API Route Changes
Identify any new or modified API routes that may need additional review.

```
search_files("src/routes", "router\.|app\.", "*.js,*.ts")
search_files("src/middleware", ".*", "*.js,*.ts")
```

**Expected Outcome:** List of API changes that may impact other systems or require documentation updates.

### 9. Verify Documentation Updates
Check if code changes require corresponding documentation updates.

```
search_files("docs", ".*", "*.md")
search_files("frontend/docs", ".*", "*.md")
read_file("README.md")
```

**Expected Outcome:** Assessment of whether documentation needs updates to match code changes.

### 10. Generate Code Review Summary
Create a comprehensive summary of all findings for the reviewer.

```
execute_command("git diff --cached --stat")
execute_command("git log --oneline --since='1 week ago' --author=\"$(git config user.name)\"")
```

**Expected Outcome:** Complete summary including:
- List of files changed with line counts
- TODO items found
- Test results
- Linting issues (if any)
- Security concerns (if any)
- Documentation review needs
- Recent commit history for context

---

## Panel+Agent Specific Checks

### Agent Configuration Validation
Check for changes to agent configurations and validate they follow project patterns.

```
search_files("src/types/plugin", ".*", "*.ts")
read_file("src/services/AgentService.ts")
```

### Frontend Component Review
Validate React components follow established patterns and don't break UI consistency.

```
search_files("frontend/components", "export.*component|export.*Component", "*.tsx,*.jsx")
execute_command("cd frontend && npm run build")
```

### Database Integration Review
Ensure database changes are properly integrated with the API layer.

```
read_file("src/services/DatabaseService.ts")
search_files("src/routes", "prisma\\.", "*.ts,*.js")
```

---

## Success Criteria

- [ ] All tests passing
- [ ] No critical linting errors
- [ ] TypeScript compilation successful
- [ ] No high-severity security vulnerabilities
- [ ] All TODO items documented
- [ ] Documentation updated if needed
- [ ] API changes properly tested
- [ ] Database migrations validated

**Final Action:** Review summary generated and ready for pull request submission.