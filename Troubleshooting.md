# Troubleshooting Guide

This guide provides solutions for common issues encountered when using the Ctrl-Alt-Play Panel. Issues are organized by category to help you quickly find relevant solutions.

## Installation Issues

### Database Connection Problems

**Symptom**: Error messages related to database connectivity during installation

**Solutions**:
1. Verify database credentials in `.env` file
2. Ensure the database server is running
3. Check firewall settings to allow database connections
4. Validate database user permissions
5. Confirm the database exists and is accessible

```bash
# Test database connection
npx prisma migrate status

# Validate database connectivity
npm run db:test-connection
```

### Dependency Installation Failures

**Symptom**: npm install fails with compilation errors

**Solutions**:
1. Ensure Node.js version 18 or higher is installed
2. Clear npm cache: `npm cache clean --force`
3. Remove node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Install build tools for your OS:
   - Ubuntu/Debian: `sudo apt-get install build-essential`
   - CentOS/RHEL: `sudo yum groupinstall "Development Tools"`
   - macOS: Install Xcode Command Line Tools

### Port Conflicts

**Symptom**: Error messages about ports already in use

**Solutions**:
1. Check which processes are using the ports:
   ```bash
   # Linux/macOS
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```
2. Kill conflicting processes or change port configuration in `.env`
3. Use the dynamic port allocation feature to automatically find available ports

## Agent Communication Issues

### Agent Not Appearing in Panel

**Symptom**: Agents not showing up in the Panel dashboard

**Solutions**:
1. Verify agent is running:
   ```bash
   # Check if agent process is running
   ps aux | grep agent
   ```
2. Check agent logs for errors:
   ```bash
   # View agent logs
   tail -f logs/agent.log
   ```
3. Verify agent configuration matches Panel settings
4. Ensure network connectivity between Panel and Agent
5. Check firewall settings to allow communication

### WebSocket Connection Failures

**Symptom**: Real-time updates not working, console streaming failing

**Solutions**:
1. Verify WebSocket endpoint configuration
2. Check reverse proxy settings if using one
3. Ensure WebSocket protocol is enabled
4. Validate SSL certificates if using HTTPS
5. Check browser console for WebSocket errors

## Database Issues

### Migration Errors

**Symptom**: Database migrations failing during setup or updates

**Solutions**:
1. Check database connectivity and permissions
2. Ensure the database user has CREATE/ALTER permissions
3. Reset migrations if needed:
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   ```
4. Check for conflicting database schema changes
5. Review migration logs for specific error details

### Performance Problems

**Symptom**: Slow database queries, high latency

**Solutions**:
1. Check database indexing:
   ```bash
   # Analyze query performance
   npx prisma studio
   ```
2. Optimize frequently used queries
3. Increase database connection pool size
4. Add appropriate database indexes
5. Monitor database resource usage

## Docker Issues

### Container Startup Failures

**Symptom**: Docker containers failing to start or crashing

**Solutions**:
1. Check container logs:
   ```bash
   docker-compose logs
   docker logs <container_name>
   ```
2. Verify Docker Compose configuration
3. Ensure sufficient system resources (RAM, CPU, disk space)
4. Check file permissions for mounted volumes
5. Validate environment variables in docker-compose.yml

### Volume Mounting Problems

**Symptom**: Files not accessible in containers, permission errors

**Solutions**:
1. Check file permissions on host system
2. Ensure directories exist before mounting
3. Use appropriate user IDs in container configuration
4. Validate volume paths in docker-compose.yml
5. Check SELinux/AppArmor policies on Linux systems

## Authentication Issues

### Login Failures

**Symptom**: Unable to log in to the Panel

**Solutions**:
1. Verify username and password
2. Check if account is locked or disabled
3. Reset password if needed:
   ```bash
   npm run reset-password -- --username <username>
   ```
4. Check authentication service logs
5. Verify JWT configuration in environment variables

### Session Problems

**Symptom**: Frequent logouts, session expiration issues

**Solutions**:
1. Check session timeout configuration
2. Verify cookie settings (secure, sameSite, etc.)
3. Ensure consistent time settings between client and server
4. Check reverse proxy configuration for cookie handling
5. Review browser security settings

## Plugin Issues

### Plugin Installation Failures

**Symptom**: Plugins failing to install or activate

**Solutions**:
1. Check plugin compatibility with current version
2. Verify plugin file integrity
3. Ensure sufficient disk space
4. Check plugin installation logs
5. Validate plugin manifest file format

### Plugin Performance Problems

**Symptom**: Slow plugin execution, high resource usage

**Solutions**:
1. Review plugin code for optimization opportunities
2. Check plugin configuration settings
3. Monitor resource usage during plugin execution
4. Implement proper caching in plugins
5. Consider plugin alternatives for resource-intensive tasks

## Network Issues

### API Access Problems

**Symptom**: API endpoints returning errors or timeouts

**Solutions**:
1. Check API service status
2. Verify API endpoint URLs
3. Ensure proper authentication headers
4. Check rate limiting configuration
5. Review API service logs

### SSL/TLS Certificate Issues

**Symptom**: Browser warnings about invalid certificates

**Solutions**:
1. Verify certificate validity dates
2. Check certificate chain完整性
3. Ensure certificate matches domain name
4. Update expired certificates
5. Configure proper certificate paths

## Performance Issues

### High Resource Usage

**Symptom**: High CPU, memory, or disk usage

**Solutions**:
1. Monitor resource usage:
   ```bash
   # Linux
   top
   htop
   
   # Docker
   docker stats
   ```
2. Check for memory leaks in applications
3. Optimize database queries
4. Implement caching strategies
5. Scale infrastructure resources

### Slow Page Loading

**Symptom**: Web interface loading slowly

**Solutions**:
1. Check network connectivity
2. Optimize frontend assets
3. Implement CDN for static files
4. Enable compression (gzip/brotli)
5. Review database query performance

## Backup and Recovery Issues

### Backup Failures

**Symptom**: Backup process failing or incomplete

**Solutions**:
1. Check available disk space
2. Verify backup destination permissions
3. Review backup configuration settings
4. Check database connectivity
5. Examine backup logs for errors

### Restore Problems

**Symptom**: Unable to restore from backup

**Solutions**:
1. Verify backup file integrity
2. Check backup compatibility with current version
3. Ensure sufficient disk space for restore
4. Review restore procedure documentation
5. Check database schema compatibility

## Monitoring and Logging Issues

### Missing Logs

**Symptom**: Expected log entries not appearing

**Solutions**:
1. Check log level configuration
2. Verify log file permissions
3. Ensure sufficient disk space for logs
4. Check log rotation settings
5. Review application logging configuration

### Alert Fatigue

**Symptom**: Too many false positive alerts

**Solutions**:
1. Tune alert thresholds
2. Implement alert deduplication
3. Review monitoring rules
4. Add contextual filtering
5. Optimize alert routing

## Environment-Specific Issues

### Development Environment

**Common Issues**:
- Inconsistent test results
- Missing environment variables
- Port conflicts with other services

**Solutions**:
1. Use consistent environment configuration
2. Isolate development databases
3. Implement proper service mocking
4. Use development-specific settings

### Production Environment

**Common Issues**:
- Performance bottlenecks
- Security vulnerabilities
- Scaling limitations

**Solutions**:
1. Implement proper load balancing
2. Optimize database queries
3. Configure appropriate caching
4. Monitor resource usage
5. Regular security audits

## Deployment Troubleshooting

### PostgreSQL Connection Issues

**Symptom**: Application cannot reach PostgreSQL at postgres:5432

**Solutions**:
1. Ensure PostgreSQL container is running and properly linked
2. Check Docker network configuration to ensure containers can communicate
3. Verify database credentials in environment configuration
4. Check firewall settings between containers

### Database Compatibility Issues

**Symptom**: Previous PostgreSQL version data incompatible with current version

**Solutions**:
1. Update docker-compose.yml to use postgres:16-alpine (or matching versions)
2. Export data from old database before upgrading
3. Perform migration with compatible versions
4. Validate data integrity after migration

### Container Restarting Issues

**Symptom**: Main application container restarting due to database connection failure

**Solutions**:
1. Fix database connectivity before application starts
2. Implement proper container dependency management
3. Add health checks with appropriate retry logic
4. Check database initialization timing

### Environment Configuration Issues

**Symptom**: Incorrect database connection or service configuration

**Solutions**:
1. Check .env file for correct DATABASE_URL configuration
2. Verify all required environment variables are set
3. Ensure configuration matches deployment environment
4. Validate service endpoint URLs

### Docker Network Issues

**Symptom**: Containers cannot communicate with each other

**Solutions**:
1. Ensure containers are on same Docker network for service discovery
2. Check network configuration in docker-compose.yml
3. Verify service names match container names
4. Test network connectivity between containers

## Getting Additional Help

If you're unable to resolve an issue using this guide:

1. Check the GitHub Issues for similar problems
2. Review the project documentation
3. Join the community Discord/Slack (if available)
4. Contact support with detailed information:
   - Error messages
   - System configuration
   - Steps to reproduce
   - Relevant log files

For critical issues, consider:
- Rolling back to a previous stable version
- Contacting professional support services
- Engaging consulting services for complex problems