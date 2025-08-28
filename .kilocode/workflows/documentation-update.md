# Documentation Update Workflow

**Description:** Comprehensive documentation maintenance workflow for the Panel+Agent architecture, ensuring all documentation stays current with code changes, API updates, and system evolution.

**Usage:** `/documentation-update.md`

**Target:** Panel+Agent Architecture project

---

## Workflow Steps

### 1. Documentation Inventory Assessment
Survey all documentation files and assess current documentation coverage.

```
search_files("docs", ".*", "*.md")
search_files("frontend/docs", ".*", "*.md")
search_files(".", "README|readme", "*.md")
list_files("docs", true)
```

**Expected Outcome:** Complete inventory of existing documentation files and structure understanding.

### 2. API Documentation Analysis
Review API documentation for accuracy and completeness against current implementation.

```
read_file("memory-bank/api.md")
search_files("src/routes", "router\\.|app\\.", "*.ts,*.js")
search_files("docs", "api|API", "*.md")
```

**Expected Outcome:** API documentation gaps identified and outdated endpoint references located.

### 3. Component Documentation Review
Verify React component documentation matches current implementations.

```
search_files("frontend/components", "export.*component|export.*Component", "*.tsx,*.jsx")
search_files("frontend/docs", "component|Component", "*.md")
read_file("frontend/components/README.md")
```

**Expected Outcome:** Component documentation validated against current component structure.

### 4. Database Documentation Validation
Ensure database documentation reflects current schema and relationships.

```
read_file("memory-bank/database.md")
read_file("prisma/schema.prisma")
search_files("docs", "database|Database|schema", "*.md")
```

**Expected Outcome:** Database documentation synchronized with current schema definitions.

---

## Panel+Agent Specific Documentation

### Agent Service Documentation
Update documentation for AI agent functionality and integration patterns.

```
read_file("src/services/AgentService.ts")
search_files("docs", "agent|Agent", "*.md")
search_files("src/types/plugin", ".*", "*.ts")
```

**Expected Outcome:** Agent service documentation updated with current API and integration patterns.

### Plugin System Documentation
Verify plugin system documentation matches current implementation and capabilities.

```
search_files("plugins", "README|readme", "*.md")
read_file("src/types/plugin/PluginTypes.ts")
search_files("docs", "plugin|Plugin", "*.md")
```

**Expected Outcome:** Plugin system documentation synchronized with current plugin architecture.

### File Manager Documentation
Update file management system documentation and usage guides.

```
read_file("frontend/components/files/FileManager.tsx")
search_files("docs", "file.*manager|File.*Manager", "*.md")
read_file("docs/ADVANCED_FILE_MANAGER.md")
```

**Expected Outcome:** File manager documentation updated with current functionality and security features.

### Console Management Documentation
Review and update admin console documentation and procedures.

```
read_file("frontend/components/Console/ConsolePanel.tsx")
read_file("docs/CONSOLE_MANAGEMENT.md")
search_files("docs", "console|Console|admin", "*.md")
```

**Expected Outcome:** Console management documentation reflects current admin capabilities and procedures.

---

## Technical Documentation Updates

### System Patterns Documentation
Validate coding patterns documentation against current implementation standards.

```
read_file("memory-bank/systemPatterns.md")
search_files("src", "pattern|Pattern|interface", "*.ts,*.js")
search_files("docs", "pattern|Pattern|architecture", "*.md")
```

**Expected Outcome:** System patterns documentation updated with current architectural decisions.

### Testing Documentation Review
Ensure testing documentation reflects current test coverage and procedures.

```
read_file("memory-bank/testing.md")
search_files("tests", ".*", "*.ts,*.js")
search_files("docs", "test|Test|testing", "*.md")
```

**Expected Outcome:** Testing documentation synchronized with current test suites and coverage requirements.

### Deployment Documentation Validation
Update deployment guides and procedures documentation.

```
read_file("memory-bank/deployment.md")
read_file("scripts/quick-deploy.sh")
search_files("docs/deployment", ".*", "*.md")
```

**Expected Outcome:** Deployment documentation updated with current infrastructure and procedures.

---

## Link Validation and Reference Checking

### Internal Link Verification
Check all internal documentation links for accuracy and accessibility.

```
search_files("docs", "\\[.*\\]\\(.*\\.md\\)", "*.md")
search_files(".", "\\[.*\\]\\(docs/.*\\)", "*.md")
```

**Expected Outcome:** All internal documentation links validated and broken links identified.

### External Reference Validation
Verify external links and references are still valid and accessible.

```
search_files("docs", "https?://", "*.md")
search_files(".", "http.*://.*", "*.md")
```

**Expected Outcome:** External references validated and outdated links identified for updating.

### Code Reference Synchronization
Ensure code examples and references in documentation match current implementation.

```
search_files("docs", "```.*\\n.*src/", "*.md")
search_files("docs", "import.*from.*src/", "*.md")
```

**Expected Outcome:** Code references in documentation synchronized with current file structure.

---

## API Documentation Automation

### OpenAPI/Swagger Documentation
Generate and update API documentation from current route definitions.

```
search_files("src/routes", "swagger|openapi", "*.ts,*.js")
execute_command("npm run docs:api:generate")
```

**Expected Outcome:** API documentation automatically generated from current endpoint implementations.

### TypeScript Interface Documentation
Extract and document TypeScript interfaces and type definitions.

```
search_files("src/types", "interface|type", "*.ts")
execute_command("npx typedoc --out docs/api src/types/")
```

**Expected Outcome:** TypeScript interface documentation generated and updated.

### Database Schema Documentation
Generate database schema documentation from Prisma definitions.

```
execute_command("npx prisma generate")
execute_command("npx prisma-docs-generator")
```

**Expected Outcome:** Database schema documentation automatically generated from current schema.

---

## Documentation Quality Assurance

### Markdown Linting and Formatting
Ensure all documentation follows consistent formatting standards.

```
execute_command("npx markdownlint docs/**/*.md")
execute_command("npx prettier --check docs/**/*.md")
```

**Expected Outcome:** Documentation formatted consistently and markdown syntax validated.

### Spell Checking and Grammar
Run spell checking and grammar validation on documentation content.

```
execute_command("npx cspell 'docs/**/*.md'")
execute_command("npx alex docs/")
```

**Expected Outcome:** Spelling errors and grammar issues identified and corrected.

### Documentation Coverage Analysis
Analyze documentation coverage for code components and features.

```
search_files("src", "export.*class|export.*function", "*.ts,*.js")
search_files("docs", ".*", "*.md")
```

**Expected Outcome:** Documentation coverage gaps identified and prioritized for creation.

---

## README and Guide Updates

### Main README Synchronization
Update the main README with current project status and instructions.

```
read_file("README.md")
read_file("package.json")
execute_command("npm run version")
```

**Expected Outcome:** Main README updated with current version, features, and installation instructions.

### Contributing Guide Updates
Ensure contributing guidelines reflect current development processes.

```
read_file("CONTRIBUTING.md")
read_file(".github/pull_request_template.md")
search_files(".github", ".*", "*.md")
```

**Expected Outcome:** Contributing guidelines updated with current development workflow and requirements.

### Changelog Maintenance
Update changelog with recent changes and version information.

```
read_file("CHANGELOG.md")
execute_command("git log --oneline --since='1 month ago'")
```

**Expected Outcome:** Changelog updated with recent changes and properly formatted version entries.

---

## Deployment Guide Updates

### Installation Instructions
Verify installation instructions work with current dependencies and requirements.

```
read_file("docs/deployment/deploy-to-vps.sh")
execute_command("npm ls --depth=0")
execute_command("node --version && npm --version")
```

**Expected Outcome:** Installation instructions validated and updated for current environment requirements.

### Docker Documentation
Update Docker-related documentation and deployment guides.

```
read_file("Dockerfile")
read_file("docker-compose.yml")
search_files("docs", "docker|Docker", "*.md")
```

**Expected Outcome:** Docker documentation synchronized with current container configuration.

### Environment Configuration Guide
Update environment variable documentation and configuration examples.

```
read_file(".env.development")
read_file(".env.production.template")
search_files("docs", "environment|config", "*.md")
```

**Expected Outcome:** Environment configuration documentation updated with current variables and examples.

---

## Documentation Automation Setup

### Documentation Generation Scripts
Set up automated documentation generation from code comments and definitions.

```
execute_command("npm run docs:generate")
execute_command("npx jsdoc src/ -d docs/api/")
```

**Expected Outcome:** Automated documentation generation configured and functioning.

### Documentation Validation Pipeline
Implement automated validation of documentation accuracy and completeness.

```
execute_command("npm run docs:validate")
execute_command("npm run docs:link-check")
```

**Expected Outcome:** Documentation validation pipeline configured for continuous integration.

---

## Documentation Coverage Report

### Missing Documentation Identification
Generate report of code components lacking documentation.

```
search_files("src", "export.*class|export.*function|export.*interface", "*.ts,*.js")
search_files("docs", ".*", "*.md")
```

**Coverage Analysis:**
- **API Endpoints**: Document all routes and middleware
- **React Components**: Document props, state, and usage
- **Services**: Document public methods and interfaces  
- **Types**: Document complex interfaces and enums
- **Utilities**: Document helper functions and modules

### Documentation Quality Metrics
Analyze documentation quality and completeness metrics.

```
execute_command("wc -l docs/**/*.md")
execute_command("grep -r 'TODO\\|FIXME' docs/")
```

**Quality Metrics:**
- **Completeness**: Percentage of code components documented
- **Accuracy**: Alignment between documentation and implementation
- **Freshness**: Last update dates and change tracking
- **Accessibility**: Link validity and navigation structure

---

## Documentation Update Checklist

### Content Validation
- [ ] API documentation matches current endpoints
- [ ] Component documentation reflects current implementations
- [ ] Database schema documentation synchronized
- [ ] Code examples tested and functional
- [ ] Installation instructions validated

### Structure and Navigation
- [ ] Documentation structure logical and navigable
- [ ] Table of contents updated
- [ ] Cross-references and links validated
- [ ] Search functionality working

### Quality Assurance
- [ ] Markdown syntax validated
- [ ] Spelling and grammar checked
- [ ] Formatting consistent across files
- [ ] Images and diagrams current

### Panel+Agent Specific
- [ ] Agent service documentation complete
- [ ] Plugin system documentation updated
- [ ] File manager usage documented
- [ ] Console management procedures current
- [ ] Deployment guides tested

### Automation and Maintenance
- [ ] Documentation generation scripts working
- [ ] Validation pipeline configured
- [ ] Update procedures documented
- [ ] Maintenance schedule established

---

## Success Criteria

- [ ] All documentation files reviewed and updated
- [ ] API documentation synchronized with implementation
- [ ] Code examples tested and functional
- [ ] Links validated and accessible
- [ ] Documentation coverage gaps identified
- [ ] Quality standards met (formatting, spelling, grammar)
- [ ] Panel+Agent specific documentation complete
- [ ] Automation tools configured for maintenance

**Final Action:** Comprehensive documentation update complete with all content synchronized to current Panel+Agent architecture implementation, quality validated, and maintenance procedures established.