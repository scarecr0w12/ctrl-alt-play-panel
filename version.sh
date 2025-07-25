#!/bin/bash

# Ctrl-Alt-Play Panel Version Management Script
# Usage: ./version.sh [major|minor|patch] [description]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE=""
DESCRIPTION=""
CURRENT_VERSION=""

# Function to print colored output
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

# Function to get current version from package.json
get_current_version() {
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    print_info "Current version: v$CURRENT_VERSION"
}

# Function to calculate new version
calculate_new_version() {
    local version_type=$1
    local current=$CURRENT_VERSION
    
    IFS='.' read -ra VERSION_PARTS <<< "$current"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $version_type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            print_error "Invalid version type: $version_type"
            print_info "Valid types: major, minor, patch"
            exit 1
            ;;
    esac
    
    NEW_VERSION="$major.$minor.$patch"
    print_info "New version will be: v$NEW_VERSION"
}

# Function to update package.json files
update_package_versions() {
    local new_version=$1
    
    print_info "Updating package.json files..."
    
    # Update root package.json
    npm version --no-git-tag-version $new_version
    print_success "Updated root package.json"
    
    # Update frontend package.json
    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm version --no-git-tag-version $new_version
        cd ..
        print_success "Updated frontend/package.json"
    fi
    
    # Update agent package.json
    if [ -f "agent/package.json" ]; then
        cd agent
        npm version --no-git-tag-version $new_version
        cd ..
        print_success "Updated agent/package.json"
    fi
}

# Function to update changelog
update_changelog() {
    local new_version=$1
    local description=$2
    local date=$(date +%Y-%m-%d)
    
    print_info "Updating CHANGELOG.md..."
    
    # Create temporary file with new entry
    cat > temp_changelog.md << EOF
# Changelog

All notable changes to the Ctrl-Alt-Play Panel project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [$new_version] - $date

### Changed
- $description

EOF
    
    # Append existing changelog content (skip the header)
    tail -n +8 CHANGELOG.md >> temp_changelog.md
    
    # Replace original changelog
    mv temp_changelog.md CHANGELOG.md
    
    print_success "Updated CHANGELOG.md"
}

# Function to create git tag
create_git_tag() {
    local new_version=$1
    local description=$2
    
    print_info "Creating git tag v$new_version..."
    
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "chore: bump version to v$new_version

$description

- Updated package.json versions across all modules
- Updated CHANGELOG.md with release notes
- Prepared release v$new_version"
    
    # Create annotated tag
    git tag -a "v$new_version" -m "Release v$new_version

$description

This release includes:
- Version bump to v$new_version
- Updated documentation
- All changes detailed in CHANGELOG.md"
    
    print_success "Created git tag v$new_version"
}

# Function to push changes
push_changes() {
    local new_version=$1
    
    print_info "Pushing changes to remote repository..."
    
    # Push commits
    git push origin main
    
    # Push tag
    git push origin "v$new_version"
    
    print_success "Pushed v$new_version to remote repository"
}

# Function to show usage
show_usage() {
    echo "Ctrl-Alt-Play Panel Version Management"
    echo ""
    echo "Usage: $0 [major|minor|patch] [description]"
    echo ""
    echo "Examples:"
    echo "  $0 patch \"Fix authentication bug\""
    echo "  $0 minor \"Add new monitoring features\""
    echo "  $0 major \"Breaking API changes\""
    echo ""
    echo "Version Types:"
    echo "  major: Breaking changes (X.0.0)"
    echo "  minor: New features (X.Y.0)"
    echo "  patch: Bug fixes (X.Y.Z)"
}

# Main execution
main() {
    print_info "Ctrl-Alt-Play Panel Version Management Script"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Run this script from the project root."
        exit 1
    fi
    
    # Check for git repository
    if [ ! -d ".git" ]; then
        print_error "Not a git repository. Initialize git first."
        exit 1
    fi
    
    # Parse arguments
    if [ $# -lt 2 ]; then
        print_error "Insufficient arguments provided."
        echo ""
        show_usage
        exit 1
    fi
    
    VERSION_TYPE=$1
    DESCRIPTION=$2
    
    # Validate version type
    if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
        print_error "Invalid version type: $VERSION_TYPE"
        echo ""
        show_usage
        exit 1
    fi
    
    # Get current version
    get_current_version
    
    # Calculate new version
    calculate_new_version $VERSION_TYPE
    
    # Confirm with user
    echo ""
    print_warning "This will:"
    echo "  - Bump version from v$CURRENT_VERSION to v$NEW_VERSION"
    echo "  - Update all package.json files"
    echo "  - Update CHANGELOG.md"
    echo "  - Create git commit and tag"
    echo "  - Push to remote repository"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Version bump cancelled."
        exit 0
    fi
    
    # Execute version bump
    echo ""
    print_info "Starting version bump process..."
    
    update_package_versions $NEW_VERSION
    update_changelog $NEW_VERSION "$DESCRIPTION"
    create_git_tag $NEW_VERSION "$DESCRIPTION"
    push_changes $NEW_VERSION
    
    echo ""
    print_success "Version bump completed successfully!"
    print_success "Released v$NEW_VERSION: $DESCRIPTION"
    echo ""
    print_info "View the release: https://github.com/scarecr0w12/ctrl-alt-play-panel/releases/tag/v$NEW_VERSION"
}

# Run main function with all arguments
main "$@"
