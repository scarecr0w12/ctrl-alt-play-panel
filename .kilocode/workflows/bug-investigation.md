# Bug Investigation Workflow

**Description:** Systematic bug investigation and diagnosis workflow for the Panel+Agent architecture, providing structured approaches to identify, analyze, and resolve issues across all system components.

**Usage:** `/bug-investigation.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Initial Issue Assessment
Gather basic information about the bug and establish investigation scope.

```
execute_command("git log --oneline -10")
execute_command("git status")
execute_command("npm --version && node --version")
```

**Expected Outcome:** Current system state captured and recent changes identified for context.

### 2. Error Pattern Analysis
Search for error patterns, stack traces, and related issues across the codebase.

```
search_files(".", "error|Error|ERROR|exception|Exception", "*.log,*.txt")
search_files("src", "throw.*Error|catch.*error", "*.ts,*.js")
search_files("frontend/src", "console\\.error|console\\.warn", "*.ts,*.tsx,*.js,*.jsx")
```

**Expected Outcome:** Error patterns identified and potential problem areas located.

### 3. Log File Analysis
Examine application logs and system logs for diagnostic information.

```
execute_command("tail -50 /var/log/application.log 2>/dev/null || echo 'No application log found'")
execute_command("docker-compose logs --tail=50")
execute_command("npm run logs:debug")
```

**Expected Outcome:** Recent log entries analyzed for error messages and warning indicators.

### 4. Recent Code Changes Investigation
Analyze recent commits and changes that might have introduced the bug.

```
execute_command("git log --since='1 week ago' --oneline --stat")
execute_command("git diff HEAD~5..HEAD --name-only")
execute_command("git blame --line-porcelain <problematic-file>")
```

**Expected Outcome:** Recent changes identified and potentially problematic modifications located.

---

## Panel+Agent Specific Bug Investigation

### Agent Service Debugging
Investigate issues related to AI agent functionality and service communication.

```
read_file("src/services/AgentService.ts")
search_files("src/services", "AgentService|agent.*error", "*.ts,*.js")
execute_command("npm test -- --testPathPattern=AgentService --verbose")
```

**Expected Outcome:** Agent service issues identified and service communication problems diagnosed.

### Plugin System Investigation
Debug plugin-related issues including loading, execution, and integration problems.

```
search_files("plugins", "error|Error|fail", "*.json,*.js,*.ts")
read_file("src/types/plugin/PluginTypes.ts")
execute_command("npm run plugin:validate")
```

**Expected Outcome:** Plugin system issues identified and configuration problems diagnosed.

### Database Connectivity Issues
Investigate database connection problems, query failures, and migration issues.

```
read_file("src/services/DatabaseService.ts")
execute_command("npx prisma db push --preview-feature --dry-run")
execute_command("pg_isready -h localhost -p 5432")
search_files("prisma", "error|Error", "*.prisma,*.ts")
```

**Expected Outcome:** Database connectivity and query issues identified and diagnosed.

### File Manager Debugging
Investigate file upload, download, and management functionality issues.

```
read_file("frontend/components/files/FileManager.tsx")
search_files("src", "file.*upload|upload.*error", "*.ts,*.js")
execute_command("ls -la uploads/ 2>/dev/null || echo 'Uploads directory not found'")
```

**Expected Outcome:** File management issues identified and permission problems diagnosed.

---

## Frontend Bug Investigation

### React Component Debugging
Investigate React component rendering issues, state problems, and prop validation errors.

```
search_files("frontend/components", "useEffect|useState|componentDidMount", "*.tsx,*.jsx")
search_files("frontend", "PropTypes|defaultProps", "*.tsx,*.jsx")
execute_command("cd frontend && npm run build 2>&1 | grep -i error")
```

**Expected Outcome:** Component lifecycle issues and state management problems identified.

### Console Component Investigation
Debug admin console functionality and authentication issues.

```
read_file("frontend/components/Console/ConsolePanel.tsx")
search_files("frontend/components/Console", "error|Error|auth", "*.tsx,*.ts")
execute_command("curl -f http://localhost:3000/api/auth/verify || echo 'Auth endpoint failed'")
```

**Expected Outcome:** Console functionality issues and authentication problems diagnosed.

### API Integration Debugging
Investigate frontend-backend communication issues and API call failures.

```
search_files("frontend/src", "fetch|axios|api", "*.ts,*.tsx,*.js,*.jsx")
search_files("src/routes", "router|middleware", "*.ts,*.js")
execute_command("curl -f http://localhost:3000/api/health || echo 'API health check failed'")
```

**Expected Outcome:** API communication issues identified and endpoint problems diagnosed.

---

## Backend Bug Investigation

### API Endpoint Debugging
Investigate REST API issues, middleware problems, and route handling errors.

```
read_file("src/routes/agents.ts")
search_files("src/routes", "error|Error|catch", "*.ts,*.js")
search_files("src/middleware", "error|Error|next", "*.ts,*.js")
```

**Expected Outcome:** API endpoint issues identified and middleware problems diagnosed.

### Authentication and Authorization Issues
Debug login, session management, and permission-related problems.

```
search_files("src", "auth|Auth|jwt|JWT", "*.ts,*.js")
search_files("src", "permission|role|rbac", "*.ts,*.js")
execute_command("npm test -- --testPathPattern=auth --verbose")
```

**Expected Outcome:** Authentication issues identified and authorization problems diagnosed.

### Service Layer Investigation
Debug business logic issues and service integration problems.

```
read_file("src/services/AgentService.ts")
read_file("src/services/DatabaseService.ts")
search_files("src/services", "error|Error|throw", "*.ts,*.js")
```

**Expected Outcome:** Service layer issues identified and business logic problems diagnosed.

---

## Infrastructure Bug Investigation

### Docker Container Issues
Investigate containerization problems, networking issues, and resource constraints.

```
execute_command("docker ps -a")
execute_command("docker logs ctrl-alt-play-panel 2>&1 | tail -50")
execute_command("docker inspect ctrl-alt-play-panel | jq '.[].State'")
```

**Expected Outcome:** Container health status and resource usage issues identified.

### Port Conflict Investigation
Debug port allocation problems and network connectivity issues.

```
read_file("src/utils/portManager.ts")
execute_command("netstat -tlnp | grep ':3000\\|:5432\\|:6379'")
execute_command("lsof -i :3000")
```

**Expected Outcome:** Port conflicts identified and network binding issues diagnosed.

### Database Performance Issues
Investigate slow queries, connection pool problems, and migration issues.

```
execute_command("pg_stat_activity") 
search_files("src", "query|Query", "*.ts,*.js")
execute_command("npx prisma db pull")
```

**Expected Outcome:** Database performance issues identified and query optimization needs diagnosed.

---

## Performance Bug Investigation

### Memory Leak Detection
Investigate memory usage patterns and potential memory leaks.

```
execute_command("node --version")
execute_command("ps aux | grep node")
execute_command("docker stats --no-stream")
```

**Expected Outcome:** Memory usage patterns analyzed and potential leaks identified.

### Performance Bottleneck Analysis
Identify slow operations and performance degradation issues.

```
search_files("src", "setTimeout|setInterval|Promise", "*.ts,*.js")
execute_command("npm run profile")
execute_command("curl -w '%{time_total}' http://localhost:3000/api/health")
```

**Expected Outcome:** Performance bottlenecks identified and slow operations diagnosed.

---

## Systematic Debugging Process

### Environment Validation
Verify the development/production environment is properly configured.

```
execute_command("env | grep -E 'NODE_ENV|DATABASE_URL|JWT_SECRET'")
read_file(".env.development")
read_file(".env.production")
```

**Expected Outcome:** Environment configuration validated and misconfigurations identified.

### Dependency Analysis
Check for dependency conflicts, version mismatches, and compatibility issues.

```
execute_command("npm ls --depth=0")
execute_command("npm outdated")
execute_command("npm audit")
```

**Expected Outcome:** Dependency issues identified and version conflicts diagnosed.

### Test Failure Investigation
Analyze test failures to understand the scope and nature of the bug.

```
execute_command("npm test -- --verbose --no-coverage")
execute_command("npm test -- --detectOpenHandles")
execute_command("cd frontend && npm test -- --verbose")
```

**Expected Outcome:** Test failures analyzed and specific problem areas identified.

---

## Bug Reproduction and Isolation

### Minimal Reproduction Case
Create minimal test cases to reproduce the bug consistently.

```
execute_command("npm run test:isolated")
execute_command("curl -X POST http://localhost:3000/api/test-endpoint")
```

**Expected Outcome:** Bug reproduction steps identified and isolated test cases created.

### Environment Isolation
Test the bug across different environments to determine scope.

```
execute_command("docker-compose -f docker-compose.test.yml up -d")
execute_command("NODE_ENV=test npm start")
```

**Expected Outcome:** Bug behavior confirmed across environments and scope determined.

### Data Isolation
Investigate if the bug is related to specific data or general functionality.

```
execute_command("npm run db:seed:test")
execute_command("npm run db:reset")
```

**Expected Outcome:** Data-related bug patterns identified and data dependencies confirmed.

---

## Investigation Documentation

### Bug Report Generation
Document findings and create comprehensive bug reports.

```
execute_command("git log --grep='bug\\|fix\\|error' --oneline -10")
```

**Bug Report Template:**
- **Summary**: Brief description of the issue
- **Environment**: System and software versions
- **Reproduction Steps**: Exact steps to reproduce
- **Expected vs Actual Behavior**: What should happen vs what happens
- **Error Messages**: Complete error messages and stack traces
- **Recent Changes**: Relevant code changes or deployments
- **Investigation Findings**: Analysis results and diagnostic information

### Root Cause Analysis
Perform systematic root cause analysis of identified issues.

**Analysis Framework:**
1. **Immediate Cause**: Direct trigger of the bug
2. **Contributing Factors**: Conditions that enabled the bug
3. **Root Cause**: Fundamental issue that needs addressing
4. **Prevention Measures**: Steps to prevent similar issues

---

## Bug Investigation Checklist

### Initial Assessment
- [ ] Bug report details gathered
- [ ] Reproduction steps confirmed
- [ ] Environment information collected
- [ ] Recent changes analyzed

### Technical Investigation
- [ ] Error patterns searched and analyzed
- [ ] Log files examined
- [ ] Code changes reviewed
- [ ] Test failures investigated

### Component-Specific Checks
- [ ] Agent services investigated
- [ ] Plugin system checked
- [ ] Database connectivity verified
- [ ] Frontend components tested
- [ ] API endpoints validated

### Infrastructure Analysis
- [ ] Docker containers inspected
- [ ] Port conflicts checked
- [ ] Performance metrics analyzed
- [ ] Resource usage validated

### Documentation and Resolution
- [ ] Findings documented
- [ ] Root cause identified
- [ ] Fix strategy developed
- [ ] Prevention measures planned

---

## Success Criteria

- [ ] Bug reproduced consistently
- [ ] Root cause identified
- [ ] Affected components documented
- [ ] Fix strategy developed
- [ ] Investigation findings documented
- [ ] Prevention measures identified

**Final Action:** Complete bug investigation with documented findings, identified root cause, and clear path to resolution for the Panel+Agent architecture issue.