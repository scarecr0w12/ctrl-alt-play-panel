---
description: Comprehensive documentation maintenance workflow for the Panel+Agent architecture
---

# Documentation Update Workflow

This recipe provides a comprehensive documentation maintenance workflow for the Panel+Agent architecture, ensuring all documentation stays current with code changes, API updates, and system evolution.

## Prerequisites

- Git repository with documentation files
- Markdown linting tools installed
- Documentation generation tools installed
- Link validation tools installed

## Steps

1. **Documentation Inventory Assessment**
   - Survey all documentation files
   - Assess current documentation coverage

2. **API Documentation Analysis**
   - Review API documentation for accuracy
   - Identify outdated endpoint references

3. **Component Documentation Review**
   - Verify React component documentation
   - Validate against current implementations

4. **Database Documentation Validation**
   - Ensure database documentation reflects current schema
   - Synchronize with current relationships

5. **Panel+Agent Specific Documentation**
   - Update agent service documentation
   - Verify plugin system documentation
   - Update file manager documentation
   - Review console management documentation

6. **Technical Documentation Updates**
   - Validate coding patterns documentation
   - Review testing documentation
   - Update deployment guides

7. **Link Validation and Reference Checking**
   - Check internal documentation links
   - Verify external references
   - Synchronize code examples

8. **API Documentation Automation**
   - Generate API documentation
   - Document TypeScript interfaces
   - Generate database schema documentation

9. **Documentation Quality Assurance**
   - Run markdown linting and formatting
   - Check spelling and grammar
   - Analyze documentation coverage

10. **README and Guide Updates**
    - Update main README
    - Ensure contributing guidelines are current
    - Maintain changelog

11. **Deployment Guide Updates**
    - Verify installation instructions
    - Update Docker documentation
    - Update environment configuration guide

12. **Documentation Automation Setup**
    - Set up automated documentation generation
    - Implement validation pipeline

13. **Documentation Coverage Report**
    - Identify missing documentation
    - Analyze documentation quality metrics

## Commands

```bash
# Inventory assessment
find docs -name "*.md" | wc -l
find . -name "README.md" -o -name "readme.md"

# API documentation analysis
npm run docs:api:check

# Component documentation review
grep -r "export.*component" frontend/components/

# Database documentation validation
npx prisma generate
npx prisma validate

# Link validation
npm run docs:link-check

# Documentation generation
npm run docs:generate
npx typedoc --out docs/api src/types/

# Quality assurance
npx markdownlint docs/**/*.md
npx cspell "docs/**/*.md"

# Coverage analysis
npm run docs:coverage
```

## Success Criteria

- All documentation files reviewed and updated
- API documentation synchronized with implementation
- Code examples tested and functional
- Links validated and accessible
- Documentation coverage gaps identified
- Quality standards met (formatting, spelling, grammar)
- Panel+Agent specific documentation complete
- Automation tools configured for maintenance

## Troubleshooting

If documentation generation fails:
- Check tool versions and compatibility
- Verify file paths and permissions
- Review configuration files
- Check for syntax errors in documentation files

## Panel+Agent Specific Considerations

- Agent service documentation
- Plugin system documentation
- File manager usage documentation
- Console management procedures
- System patterns documentation
- Testing documentation review
- Deployment documentation validation
- Internal link verification
- External reference validation
- Code reference synchronization
- OpenAPI/Swagger documentation
- TypeScript interface documentation
- Database schema documentation
- Markdown linting and formatting
- Spell checking and grammar
- Documentation coverage analysis
- Main README synchronization
- Contributing guide updates
- Changelog maintenance
- Installation instructions
- Docker documentation
- Environment configuration guide
- Documentation generation scripts
- Documentation validation pipeline

This recipe should be run regularly to maintain documentation quality and ensure it stays current with code changes.
