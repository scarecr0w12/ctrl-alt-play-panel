#!/bin/bash

# Ctrl-Alt-Play Panel - Project Automation Setup Script v1.2.0
echo "🎮 Setting up Project Automation for Ctrl-Alt-Play Panel"
echo "==========================================================="

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Navigate to project root
cd "$PROJECT_ROOT"

print_info "Setting up project automation tools..."

# Check if Git is initialized
if [ ! -d ".git" ]; then
    print_warning "Git repository not initialized"
    print_info "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
fi

# Setup Git hooks
print_info "Setting up Git hooks..."
mkdir -p .git/hooks

# Create pre-commit hook for linting and tests
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Check if there are staged changes
if git diff --cached --quiet; then
    echo "No staged changes to check"
    exit 0
fi

# Run linting
echo "📝 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues before committing."
    exit 1
fi

# Run type checking
echo "🔍 Running TypeScript type checking..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Please fix the issues before committing."
    exit 1
fi

# Run tests (only if test files exist)
if ls tests/*.test.* 1> /dev/null 2>&1; then
    echo "🧪 Running tests..."
    npm run test:ci
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Please fix the issues before committing."
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit
print_success "Pre-commit hook installed"

# Create pre-push hook for additional validation
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "🚀 Running pre-push validation..."

# Build check
echo "🏗️  Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the issues before pushing."
    exit 1
fi

echo "✅ Pre-push validation passed!"
EOF

chmod +x .git/hooks/pre-push
print_success "Pre-push hook installed"

# Setup package scripts verification
print_info "Verifying package.json scripts..."

REQUIRED_SCRIPTS=("dev" "build" "start" "test" "lint" "type-check" "db:generate" "db:push")

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run "$script" --silent 2>/dev/null | grep -q "Missing script"; then
        print_warning "Missing script: $script"
    else
        print_success "Script verified: $script"
    fi
done

# Setup version script executable
if [ -f "version.sh" ]; then
    chmod +x version.sh
    print_success "Version script made executable"
else
    print_warning "Version script not found"
fi

# Setup start script executable
if [ -f "start.sh" ]; then
    chmod +x start.sh
    print_success "Start script made executable"
else
    print_warning "Start script not found"
fi

# Make all setup scripts executable
print_info "Making setup scripts executable..."
chmod +x scripts/*.sh
print_success "Setup scripts made executable"

# Setup GitHub Actions workflow (if .github directory exists)
if [ ! -d ".github/workflows" ]; then
    print_info "Creating GitHub Actions workflow directory..."
    mkdir -p .github/workflows
fi

# Verify Docker setup
print_info "Verifying Docker configuration..."
if [ -f "docker-compose.yml" ]; then
    docker-compose config >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Docker Compose configuration valid"
    else
        print_warning "Docker Compose configuration has issues"
    fi
else
    print_warning "docker-compose.yml not found"
fi

# Setup monitoring scripts
if [ -f "scripts/monitor.sh" ]; then
    chmod +x scripts/monitor.sh
    print_success "Monitor script configured"
fi

print_success "🚀 Project automation setup complete!"
echo ""
print_info "Automation features enabled:"
echo "  ✅ Git pre-commit hooks (linting, type-checking, tests)"
echo "  ✅ Git pre-push hooks (build verification)"
echo "  ✅ Executable scripts configured"
echo "  ✅ Docker configuration verified"
echo ""
print_info "Available automation commands:"
echo "  ./version.sh [patch|minor|major] \"Description\""
echo "  ./start.sh [start|stop|status|logs]"
echo "  npm run lint:fix"
echo "  npm run test:watch"
echo ""
print_warning "Commit hooks will now run automatically!"
print_info "Use 'git commit --no-verify' to skip hooks if needed"