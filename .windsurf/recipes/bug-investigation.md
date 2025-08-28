---
description: Systematic bug investigation and diagnosis workflow for the Panel+Agent architecture
---

# Bug Investigation Workflow

This recipe provides a systematic bug investigation and diagnosis workflow for the Panel+Agent architecture, providing structured approaches to identify, analyze, and resolve issues across all system components.

## Prerequisites

- Git repository with recent changes
- Application logs accessible
- Development environment set up
- Test suite available

## Steps

1. **Initial Issue Assessment**
   - Gather basic information about the bug
   - Establish investigation scope
   - Capture current system state

2. **Error Pattern Analysis**
   - Search for error patterns and stack traces
   - Locate potential problem areas

3. **Log File Analysis**
   - Examine application logs
   - Analyze system logs for diagnostic information

4. **Recent Code Changes Investigation**
   - Analyze recent commits
   - Identify potentially problematic modifications

5. **Panel+Agent Specific Bug Investigation**
   - Investigate agent service functionality
   - Debug plugin-related issues
   - Investigate database connectivity problems
   - Debug file management issues

6. **Frontend Bug Investigation**
   - Debug React component rendering issues
   - Investigate console component problems
   - Debug API integration issues

7. **Backend Bug Investigation**
   - Debug API endpoint issues
   - Investigate authentication problems
   - Debug service layer issues

8. **Infrastructure Bug Investigation**
   - Investigate containerization problems
   - Debug port conflict issues
   - Investigate database performance issues

9. **Performance Bug Investigation**
   - Detect memory leaks
   - Analyze performance bottlenecks

10. **Systematic Debugging Process**
    - Validate environment configuration
    - Check for dependency conflicts
    - Investigate test failures

11. **Bug Reproduction and Isolation**
    - Create minimal reproduction cases
    - Test across different environments
    - Investigate data-related issues

12. **Investigation Documentation**
    - Generate bug reports
    - Perform root cause analysis

## Commands

```bash
# Gather system information
git log --oneline -10
git status
node --version && npm --version

# Search for error patterns
npm run logs:search "error"

# Examine recent logs
docker-compose logs --tail=50
npm run logs:debug

# Analyze recent changes
git log --since='1 week ago' --oneline --stat
git diff HEAD~5..HEAD --name-only

# Run tests with verbose output
npm test -- --verbose
npm test -- --detectOpenHandles

# Check for memory leaks
npm run profile

docker stats --no-stream

# Test in isolated environment
npm run test:isolated
```

## Success Criteria

- Bug reproduced consistently
- Root cause identified
- Affected components documented
- Fix strategy developed
- Investigation findings documented
- Prevention measures identified

## Troubleshooting

If unable to reproduce the bug:
- Check environment differences
- Verify data dependencies
- Test with different input values
- Review recent configuration changes

## Panel+Agent Specific Considerations

- Agent service debugging
- Plugin system investigation
- Database connectivity issues
- File manager debugging
- Console component investigation
- API integration debugging
- Authentication and authorization issues
- Service layer investigation
- Docker container issues
- Port conflict investigation
- Database performance issues
- Memory leak detection
- Performance bottleneck analysis

This recipe should be used whenever a bug is reported or discovered to ensure systematic investigation and resolution.
