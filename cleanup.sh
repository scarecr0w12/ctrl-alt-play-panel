#!/bin/bash

# Ctrl-Alt-Play Panel Cleanup Script
# Cleans up development artifacts and prepares project for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${NC}                       Project Cleanup & Preparation                         ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}                           Ctrl-Alt-Play Panel                               ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to clean development artifacts
clean_development_artifacts() {
    print_info "Cleaning development artifacts..."
    
    # Remove log files
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "logs" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove temporary files
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name "temp_*" -type f -delete 2>/dev/null || true
    find . -name ".tmp*" -type f -delete 2>/dev/null || true
    
    # Remove node_modules and build artifacts
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove package-lock files for fresh install
    find . -name "package-lock.json" -type f -delete 2>/dev/null || true
    find . -name "yarn.lock" -type f -delete 2>/dev/null || true
    
    # Remove TypeScript build info
    find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
    
    # Remove coverage reports
    find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".nyc_output" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove development databases
    find . -name "*.db" -type f -delete 2>/dev/null || true
    find . -name "*.sqlite" -type f -delete 2>/dev/null || true
    
    print_success "Development artifacts cleaned"
}

# Function to clean documentation artifacts
clean_documentation_artifacts() {
    print_info "Cleaning documentation artifacts..."
    
    # Remove old documentation files
    rm -f docs/*_IMPLEMENTATION_*.md 2>/dev/null || true
    rm -f docs/*_COMPLETION_*.md 2>/dev/null || true
    rm -f docs/*_REPORT_*.md 2>/dev/null || true
    rm -f docs/archive/*.md 2>/dev/null || true
    
    # Remove development status files
    rm -f PROJECT_STATUS_*.md 2>/dev/null || true
    rm -f DEVELOPMENT_STATUS_*.md 2>/dev/null || true
    rm -f IMPLEMENTATION_STATUS_*.md 2>/dev/null || true
    
    # Remove old README files
    rm -f README-*.md 2>/dev/null || true
    rm -f *-old.md 2>/dev/null || true
    rm -f *-previous.md 2>/dev/null || true
    rm -f *-backup.md 2>/dev/null || true
    
    print_success "Documentation artifacts cleaned"
}

# Function to organize project structure
organize_project_structure() {
    print_info "Organizing project structure..."
    
    # Create necessary directories
    mkdir -p docs/{deployment,development,user-guides}
    mkdir -p scripts/{maintenance,deployment,development}
    mkdir -p logs/permissions
    mkdir -p logs/security
    mkdir -p uploads
    mkdir -p temp/packages
    
    # Set proper permissions
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x easy-setup.sh 2>/dev/null || true
    chmod +x version.sh 2>/dev/null || true
    
    # Create .gitkeep files for empty directories
    touch logs/.gitkeep
    touch uploads/.gitkeep
    touch temp/.gitkeep
    
    print_success "Project structure organized"
}

# Function to update .gitignore
update_gitignore() {
    print_info "Updating .gitignore..."
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Build outputs
dist/
build/
.next/
out/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/
*.tmp

# Database files
*.db
*.sqlite
*.sqlite3

# Upload directories
uploads/*
!uploads/.gitkeep

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.docker/

# SSL certificates
*.pem
*.crt
*.key

# Development artifacts
*-old.*
*-backup.*
*-previous.*
*_COMPLETION_*
*_IMPLEMENTATION_*
*_REPORT_*
PROJECT_STATUS_*
DEVELOPMENT_STATUS_*

# Memory bank temporary files
memory-bank/*copy*
memory-bank/PROJECT_STATUS.md
EOF

    print_success ".gitignore updated"
}

# Function to validate project files
validate_project_files() {
    print_info "Validating project files..."
    
    local errors=0
    
    # Check for required files
    local required_files=(
        "package.json"
        "README.md"
        "CHANGELOG.md"
        "LICENSE"
        "tsconfig.json"
        "src/index.ts"
        "src/app.ts"
        "easy-setup.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Missing required file: $file"
            ((errors++))
        fi
    done
    
    # Check TypeScript compilation
    print_info "Checking TypeScript compilation..."
    if npm run build > /dev/null 2>&1; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        ((errors++))
    fi
    
    # Check package.json structure
    if ! node -e "require('./package.json')" > /dev/null 2>&1; then
        print_error "Invalid package.json"
        ((errors++))
    else
        print_success "package.json is valid"
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "All project files validated successfully"
    else
        print_warning "$errors validation errors found"
    fi
    
    return $errors
}

# Function to generate project summary
generate_project_summary() {
    print_info "Generating project summary..."
    
    cat > PROJECT_SUMMARY.md << 'EOF'
# Ctrl-Alt-Play Panel - Project Summary

## Overview
Comprehensive game server management platform with advanced marketplace integration, plugin system, and production-ready infrastructure.

## Version Information
- **Current Version**: 1.5.0
- **Release Date**: January 27, 2025
- **Status**: Production Ready

## Key Features
- ✅ Complete game server management
- ✅ Advanced plugin system with CLI tools
- ✅ Marketplace integration with publishing workflow
- ✅ Real-time analytics and dashboard
- ✅ JWT authentication and authorization
- ✅ Docker and direct installation support

## Architecture
- **Backend**: Node.js with TypeScript, Express.js
- **Frontend**: React with Next.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Real-time**: WebSocket with Socket.IO

## Quick Start
```bash
# Easy setup with automated installer
chmod +x easy-setup.sh
./easy-setup.sh

# Manual setup
npm install
npm run build
npm run db:push
npm start
```

## Documentation
- [Installation Guide](./INSTALLATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Development Guide](./docs/NEXT_STEPS.md)
- [Changelog](./CHANGELOG.md)

## Support
- GitHub Issues: Bug reports and feature requests
- Documentation: Comprehensive guides and references
- Community: Discussions and support forums

## License
This project is licensed under the MIT License - see the LICENSE file for details.
EOF

    print_success "Project summary generated"
}

# Function to check git status
check_git_status() {
    print_info "Checking git status..."
    
    if [ ! -d ".git" ]; then
        print_warning "Not a git repository"
        return 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        print_warning "There are uncommitted changes"
        git status --porcelain
    else
        print_success "Working directory is clean"
    fi
    
    # Show current branch
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_info "Current branch: $branch"
    
    # Check for unpushed commits
    if git log --oneline @{upstream}.. 2>/dev/null | grep -q .; then
        print_warning "There are unpushed commits"
    else
        print_success "All commits are pushed"
    fi
}

# Function to prepare for push
prepare_for_push() {
    print_info "Preparing for git push..."
    
    # Add all changes
    git add .
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        print_info "No changes to commit"
        return 0
    fi
    
    # Show what will be committed
    print_info "Changes to be committed:"
    git diff --cached --name-status
    
    # Ask for confirmation
    echo ""
    read -p "Commit and push these changes? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # Commit changes
        git commit -m "chore: project cleanup and documentation update

- Clean up development artifacts and temporary files
- Update project documentation and status
- Organize project structure and permissions
- Prepare project for production deployment
- Update .gitignore with comprehensive patterns

Version: 1.5.0
Status: Ready for deployment"
        
        # Push to remote
        git push origin $(git branch --show-current)
        
        print_success "Changes committed and pushed successfully"
    else
        print_info "Push cancelled by user"
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    print_info "Starting project cleanup and preparation..."
    echo ""
    
    # Clean development artifacts
    clean_development_artifacts
    
    # Clean documentation artifacts
    clean_documentation_artifacts
    
    # Organize project structure
    organize_project_structure
    
    # Update .gitignore
    update_gitignore
    
    # Validate project files
    if ! validate_project_files; then
        print_error "Project validation failed. Please fix errors before continuing."
        exit 1
    fi
    
    # Generate project summary
    generate_project_summary
    
    # Check git status
    check_git_status
    
    echo ""
    print_success "Project cleanup completed successfully!"
    
    # Ask if user wants to commit and push
    echo ""
    print_info "Would you like to commit and push the changes now?"
    if prepare_for_push; then
        echo ""
        print_success "🎉 Project is now clean and ready for production!"
        print_info "You can now deploy using: ./easy-setup.sh"
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
