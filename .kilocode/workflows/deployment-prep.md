# Deployment Preparation Workflow

**Description:** Comprehensive deployment preparation automation for the Panel+Agent architecture, covering production readiness validation, security checks, Docker optimization, and deployment environment setup.

**Usage:** `/deployment-prep.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Pre-Deployment Environment Validation
Verify the deployment environment meets all requirements for Panel+Agent architecture.

```
execute_command("node --version")
execute_command("docker --version")
execute_command("docker-compose --version")
execute_command("git --version")
```

**Expected Outcome:** All required tools confirmed available and compatible versions verified.

### 2. Production Configuration Validation
Verify all production configuration files are properly configured and secure.

```
read_file(".env.production.template")
read_file("docker-compose.prod.yml")
read_file("Dockerfile")
execute_command("test -f .env.production && echo 'Production env exists' || echo 'Production env missing'")
```

**Expected Outcome:** Production configuration files validated and environment variables checked.

### 3. Security Configuration Check
Perform comprehensive security validation for production deployment.

```
search_files(".", "JWT_SECRET.*default|password.*123|secret.*test", "*.env,*.yml,*.yaml,*.js,*.ts")
execute_command("npm audit --audit-level high")
execute_command("docker run --rm -v $(pwd):/src -w /src aquasec/trivy fs .")
```

**Expected Outcome:** No default passwords, secure secrets configured, and no high-severity vulnerabilities.

### 4. Database Migration Readiness
Ensure database schema is production-ready and migrations are prepared.

```
execute_command("npx prisma generate")
execute_command("npx prisma validate")
execute_command("npx prisma db push --preview-feature --dry-run")
read_file("prisma/schema.prisma")
```

**Expected Outcome:** Database schema validated and migration path confirmed.

### 5. Port Management Validation
Test dynamic port management system for deployment-agnostic deployment.

```
read_file("src/utils/portManager.ts")
execute_command("node test-port-management.js")
execute_command("netstat -tlnp | grep ':3000\\|:5432\\|:6379'")
```

**Expected Outcome:** Port manager functioning properly and no port conflicts detected.

### 6. Docker Image Build and Optimization
Build and optimize Docker images for production deployment.

```
execute_command("docker build -t ctrl-alt-play-panel:latest .")
execute_command("docker images ctrl-alt-play-panel:latest")
execute_command("docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ctrl-alt-play-panel:latest")
```

**Expected Outcome:** Docker image built successfully with security scan passing.

### 7. Multi-Platform Docker Support
Validate multi-platform Docker support for linux/amd64 and linux/arm64.

```
execute_command("docker buildx create --name multiarch --use")
execute_command("docker buildx build --platform linux/amd64,linux/arm64 -t ctrl-alt-play-panel:multiarch .")
execute_command("docker buildx ls")
```

**Expected Outcome:** Multi-platform Docker images built and ready for deployment.

### 8. Production Dependencies Check
Verify all production dependencies are installed and compatible.

```
execute_command("npm ci --only=production")
execute_command("cd frontend && npm ci --only=production")
execute_command("npm ls --depth=0 --only=production")
```

**Expected Outcome:** Production dependencies installed without vulnerabilities or conflicts.

---

## Panel+Agent Specific Deployment Checks

### Agent Service Deployment Validation
Verify agent services are configured for production deployment.

```
read_file("src/services/AgentService.ts")
read_file("src/services/agentDiscoveryService.ts")
execute_command("npm test -- --testPathPattern=AgentService")
```

**Expected Outcome:** Agent services tested and ready for production deployment.

### Plugin System Deployment Check
Validate plugin system configuration for production environment.

```
search_files("plugins", "manifest.json", "*.json")
read_file("src/types/plugin/PluginTypes.ts")
execute_command("npm run validate:plugins")
```

**Expected Outcome:** Plugin system validated and all plugins properly configured.

### File Manager Security Validation
Ensure file manager component has proper security configurations for production.

```
read_file("frontend/components/files/FileManager.tsx")
search_files("src", "file.*upload|upload.*file", "*.ts,*.js")
execute_command("npm run security:file-uploads")
```

**Expected Outcome:** File upload security measures validated and access controls confirmed.

### Console Component Production Readiness
Verify admin console components are secure and production-ready.

```
read_file("frontend/components/Console/ConsolePanel.tsx")
search_files("frontend/components/Console", "auth|permission", "*.tsx,*.ts")
```

**Expected Outcome:** Console components have proper authentication and authorization.

---

## Infrastructure Deployment Preparation

### Health Check System Validation
Test comprehensive health monitoring system for production deployment.

```
read_file("src/health-check.js")
execute_command("curl -f http://localhost:3000/health || echo 'Health check failed'")
execute_command("curl -f http://localhost:3000/health/detailed || echo 'Detailed health check failed'")
```

**Expected Outcome:** Health check endpoints responding properly with system status.

### Service Discovery Configuration
Validate service discovery and agent registration systems.

```
read_file("src/services/agentDiscoveryService.ts")
execute_command("npm test -- --testPathPattern=agentDiscovery")
```

**Expected Outcome:** Service discovery system tested and ready for production agents.

### Load Balancing Preparation
Configure Nginx for static file serving and load balancing.

```
read_file("nginx/nginx.conf")
execute_command("nginx -t -c nginx/nginx.conf")
execute_command("docker run --rm -v $(pwd)/nginx:/etc/nginx nginx:alpine nginx -t")
```

**Expected Outcome:** Nginx configuration validated and ready for production traffic.

---

## Security Hardening

### Container Security Validation
Verify Docker containers follow security best practices.

```
execute_command("docker run --rm -v $(pwd):/src aquasec/trivy config /src/Dockerfile")
execute_command("docker inspect ctrl-alt-play-panel:latest | jq '.[].Config.User'")
```

**Expected Outcome:** Containers running as non-root user with secure configuration.

### Network Security Configuration
Validate network security settings and firewall configurations.

```
read_file("docker-compose.prod.yml")
execute_command("docker network ls")
execute_command("iptables -L -n | grep -E '3000|5432|6379'")
```

**Expected Outcome:** Network isolation configured and appropriate ports secured.

### SSL/TLS Certificate Preparation
Ensure SSL/TLS certificates are configured for production deployment.

```
execute_command("openssl version")
execute_command("test -f ssl/cert.pem && test -f ssl/key.pem && echo 'SSL certs found' || echo 'SSL certs missing'")
```

**Expected Outcome:** SSL certificates validated or process for obtaining them documented.

### Access Control Validation
Verify RBAC system is properly configured with 36 granular permissions.

```
search_files("src", "permission|rbac|role", "*.ts,*.js")
execute_command("npm test -- --testPathPattern=auth")
```

**Expected Outcome:** Authentication and authorization systems tested and secure.

---

## Performance Optimization

### Static Asset Optimization
Optimize frontend assets for production deployment.

```
execute_command("cd frontend && npm run build")
execute_command("cd frontend && npm run analyze")
execute_command("du -sh frontend/build/")
```

**Expected Outcome:** Frontend assets optimized and build size within acceptable limits.

### Database Connection Pooling
Verify database connection pooling is configured for production load.

```
read_file("src/services/DatabaseService.ts")
search_files("src", "pool|connection", "*.ts,*.js")
```

**Expected Outcome:** Database connection pooling configured for production scalability.

### Caching Strategy Validation
Ensure Redis caching is configured for production performance.

```
execute_command("redis-cli ping")
read_file("src/services/CacheService.ts")
execute_command("npm test -- --testPathPattern=cache")
```

**Expected Outcome:** Caching system validated and ready for production load.

---

## Automated Deployment Script Validation

### Quick Deploy Script Testing
Test the one-command deployment script functionality.

```
read_file("scripts/quick-deploy.sh")
execute_command("bash -n scripts/quick-deploy.sh")
execute_command("shellcheck scripts/quick-deploy.sh")
```

**Expected Outcome:** Deployment script validated for syntax and shell compatibility.

### Environment Detection Testing
Verify cross-distribution compatibility and environment detection.

```
execute_command("lsb_release -a || cat /etc/os-release")
execute_command("which apt || which yum || which dnf || which pacman")
```

**Expected Outcome:** Environment detection working for target deployment platform.

### Docker Compose Orchestration
Test container orchestration and service dependencies.

```
execute_command("docker-compose -f docker-compose.prod.yml config")
execute_command("docker-compose -f docker-compose.prod.yml up --dry-run")
```

**Expected Outcome:** Container orchestration configuration validated.

---

## Backup and Recovery Preparation

### Backup System Validation
Ensure backup systems are configured and tested.

```
execute_command("pg_dump --version")
execute_command("test -f scripts/backup.sh && echo 'Backup script exists' || echo 'Backup script missing'")
```

**Expected Outcome:** Backup tools available and backup procedures documented.

### Recovery Testing
Test database recovery procedures.

```
execute_command("npm run db:backup:test")
execute_command("npm run db:restore:test")
```

**Expected Outcome:** Backup and recovery procedures validated and functional.

---

## Deployment Readiness Checklist

### Infrastructure Requirements
- [ ] Docker and Docker Compose installed
- [ ] Node.js and npm compatible versions
- [ ] PostgreSQL database configured
- [ ] Redis cache configured (optional)
- [ ] Nginx proxy configured

### Security Configuration
- [ ] Environment variables secured
- [ ] SSL/TLS certificates configured
- [ ] Default passwords changed
- [ ] Security scanning passed
- [ ] RBAC system validated

### Application Readiness
- [ ] Production build successful
- [ ] Database migrations prepared
- [ ] All tests passing
- [ ] Performance optimization complete
- [ ] Health checks functional

### Deployment Scripts
- [ ] Quick deploy script validated
- [ ] Docker images built and scanned
- [ ] Environment detection working
- [ ] Service orchestration tested

### Monitoring and Backup
- [ ] Health monitoring configured
- [ ] Log aggregation setup
- [ ] Backup procedures tested
- [ ] Recovery procedures validated

---

## Success Criteria

- [ ] All security scans passing
- [ ] Docker images optimized and secure
- [ ] Production configuration validated
- [ ] Database migrations ready
- [ ] Performance benchmarks met
- [ ] Backup systems functional
- [ ] Deployment scripts tested
- [ ] Health monitoring active
- [ ] Cross-platform compatibility confirmed

**Final Action:** Production deployment environment fully prepared and validated for Panel+Agent architecture deployment across any Linux distribution with zero external dependencies.