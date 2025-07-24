#!/bin/bash

# GitHub Projects Migration Script
# Creates all frontend migration issues using GitHub CLI

echo "🚀 Starting GitHub Projects Migration for Frontend Tasks"
echo "======================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI ready"

# Repository info
REPO="scarecr0w12/ctrl-alt-play-panel"

echo "📋 Creating frontend migration issues for $REPO"

# Create necessary labels first
echo ""
echo "🏷️ Creating project labels"
echo "========================="

# Function to create label (silently handles if label already exists)
create_label() {
    local name="$1"
    local description="$2"
    local color="$3"
    
    echo "Creating label: $name"
    gh label create "$name" --description "$description" --color "$color" --repo "$REPO" 2>/dev/null || true
}

# Phase labels
create_label "phase-1" "Phase 1: Critical Security Fixes" "d73a4a"
create_label "phase-2" "Phase 2: Admin Features" "fbca04"
create_label "phase-3" "Phase 3: Advanced Features" "0052cc"
create_label "phase-4" "Phase 4: Infrastructure & Polish" "5319e7"

# Priority labels
create_label "security-critical" "Critical security vulnerability - highest priority" "b60205"
create_label "high-priority" "High priority task" "d93f0b"
create_label "medium-priority" "Medium priority task" "fbca04"
create_label "low-priority" "Low priority task" "0e8a16"

# Component type labels
create_label "page-component" "React page component development" "1d76db"
create_label "ui-component" "Reusable UI component" "0052cc"
create_label "api-integration" "Frontend API integration" "5319e7"
create_label "security-enhancement" "Security feature or fix" "b60205"

# Functional area labels
create_label "frontend" "Frontend React/Next.js development" "1d76db"
create_label "admin" "Admin panel functionality" "d93f0b"
create_label "user-management" "User management features" "0052cc"
create_label "server-management" "Server management features" "0e8a16"
create_label "infrastructure" "Infrastructure and node management" "5319e7"
create_label "monitoring" "Monitoring and analytics" "fbca04"
create_label "workshop" "Steam Workshop integration" "ff6600"

# Complexity labels
create_label "complexity-simple" "Simple task (1-2 days)" "0e8a16"
create_label "complexity-medium" "Medium complexity (3-5 days)" "fbca04"
create_label "complexity-complex" "Complex task (1+ weeks)" "d93f0b"

# Status labels
create_label "blocked" "Task is blocked by dependencies" "cccccc"
create_label "in-progress" "Currently being worked on" "1d76db"
create_label "needs-review" "Completed and awaiting review" "fbca04"

echo "✅ Labels created successfully"

# Phase 1: Critical Security Issues
echo ""
echo "🚨 Creating Phase 1: Critical Security Issues"
echo "============================================="

# Issue #1: Console Interface
echo "Creating: Console Interface..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ Console Interface - Replace vulnerable HTML with React" \
  --label "frontend,security-critical,phase-1,page-component,complexity-complex,server-management" \
  --milestone "Phase 1 Complete" \
  --body "## 📋 **Overview**
Replace vulnerable HTML page with secure React component

**Replaces:** \`public/console.html\`
**Creates:** \`frontend/pages/console/[serverId].tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Real-time terminal with xterm.js integration
- [ ] WebSocket connection for live server output
- [ ] Server power controls (start/stop/restart/kill)
- [ ] Resource monitoring (CPU/Memory/Disk)
- [ ] Command input/execution interface
- [ ] JWT authentication implemented
- [ ] Input sanitization for commands
- [ ] Mobile responsive design
- [ ] Replace public/console.html completely

## 🛡️ **Security Requirements**
- [ ] JWT authentication for WebSocket connections
- [ ] Permission-based server access
- [ ] Input validation and sanitization
- [ ] Command injection prevention
- [ ] XSS prevention in output display

## 🔧 **Technical Requirements**
- xterm.js for terminal emulation
- WebSocket client for real-time communication
- React hooks for state management
- TypeScript interfaces for WebSocket messages
- Error handling for connection failures

## 📊 **Project Metadata**
**Priority:** 🚨 Critical Security
**Phase:** Phase 1: Security Fixes
**Complexity:** 🔴 Complex (1+ weeks)
**Component Type:** 🖥️ Page Component"

# Issue #2: File Manager
echo "Creating: File Manager..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ File Manager - Replace vulnerable HTML with React" \
  --label "frontend,security-critical,phase-1,page-component,complexity-complex,server-management" \
  --milestone "Phase 1 Complete" \
  --body "## 📋 **Overview**
Replace vulnerable HTML page with secure React component

**Replaces:** \`public/files.html\`
**Creates:** \`frontend/pages/files/[serverId].tsx\`

## 🎯 **Acceptance Criteria**
- [ ] File browser with tree navigation
- [ ] Monaco code editor integration
- [ ] File upload (drag & drop + file picker)
- [ ] File download functionality
- [ ] Create/delete/rename files and folders
- [ ] Context menu system
- [ ] Breadcrumb navigation
- [ ] Multiple file selection
- [ ] Replace public/files.html completely

## 🛡️ **Security Requirements**
- [ ] Path traversal protection
- [ ] File type restrictions
- [ ] Size limits and validation
- [ ] JWT authentication for all operations
- [ ] Permission-based file access

## 🔧 **Technical Requirements**
- Monaco Editor for code editing
- File system API integration
- Tree view component
- Context menu component
- File upload with progress tracking

## 📊 **Project Metadata**
**Priority:** 🚨 Critical Security
**Phase:** Phase 1: Security Fixes
**Complexity:** 🔴 Complex (1+ weeks)
**Component Type:** 🖥️ Page Component"

# Issue #3: User Registration
echo "Creating: User Registration..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ User Registration - Replace vulnerable HTML with React" \
  --label "frontend,security-critical,phase-1,page-component,complexity-medium,user-management" \
  --milestone "Phase 1 Complete" \
  --body "## 📋 **Overview**
Replace vulnerable HTML page with secure React component

**Replaces:** \`public/register.html\`
**Creates:** \`frontend/pages/register.tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Registration form with validation
- [ ] Real-time email/username availability checking
- [ ] Password strength indicator
- [ ] Form validation and error display
- [ ] Success/error notifications
- [ ] Redirect to login after registration
- [ ] Mobile responsive design
- [ ] Replace public/register.html completely

## 🛡️ **Security Requirements**
- [ ] Input validation and sanitization
- [ ] Password complexity requirements
- [ ] Rate limiting protection
- [ ] CSRF protection
- [ ] Email verification workflow

## 🔧 **Technical Requirements**
- Form validation with real-time feedback
- Password strength calculation
- API integration for registration
- Toast notifications for feedback
- Form state management

## 📊 **Project Metadata**
**Priority:** 🚨 Critical Security
**Phase:** Phase 1: Security Fixes
**Complexity:** 🟡 Medium (3-5 days)
**Component Type:** 🖥️ Page Component"

# Phase 2: Admin Features
echo ""
echo "⚠️ Creating Phase 2: Admin Features"
echo "=================================="

# Issue #4: Admin User Management
echo "Creating: Admin User Management..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ Admin User Management - Complete admin panel" \
  --label "frontend,admin,phase-2,page-component" \
  --milestone "Phase 2 Complete" \
  --body "## 📋 **Overview**
Create comprehensive admin panel for user management

**Creates:** \`frontend/pages/admin/users.tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Paginated user list with search/filtering
- [ ] Create new user modal
- [ ] Edit user details modal
- [ ] Delete user with confirmation
- [ ] Role assignment interface
- [ ] Bulk operations support
- [ ] User statistics display
- [ ] Activity monitoring

## 📊 **Project Metadata**
**Priority:** ⚠️ High Priority
**Phase:** Phase 2: Admin Features
**Complexity:** 🔴 Complex (1+ weeks)
**Component Type:** 🖥️ Page Component"

# Issue #5: Node Management
echo "Creating: Node Management..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ Node Management - Admin infrastructure panel" \
  --label "frontend,admin,infrastructure,phase-2,page-component" \
  --milestone "Phase 2 Complete" \
  --body "## 📋 **Overview**
Create admin panel for node/infrastructure management

**Creates:** \`frontend/pages/admin/nodes.tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Node list with status overview
- [ ] Add new node modal
- [ ] Edit node configuration
- [ ] Delete node with validation
- [ ] Real-time resource monitoring
- [ ] Server allocation tracking
- [ ] Health status indicators

## 📊 **Project Metadata**
**Priority:** ⚠️ High Priority
**Phase:** Phase 2: Admin Features
**Complexity:** 🔴 Complex (1+ weeks)
**Component Type:** 🖥️ Page Component"

# Issue #6: User Profile
echo "Creating: User Profile..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ User Profile - Personal settings and security" \
  --label "frontend,user-management,phase-2,page-component" \
  --milestone "Phase 2 Complete" \
  --body "## 📋 **Overview**
Create user profile management page

**Creates:** \`frontend/pages/profile.tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Profile editing form
- [ ] Password change functionality
- [ ] Avatar upload
- [ ] Two-factor authentication setup
- [ ] Active sessions management
- [ ] Activity history display

## 📊 **Project Metadata**
**Priority:** ⚠️ High Priority
**Phase:** Phase 2: Admin Features
**Complexity:** 🟡 Medium (3-5 days)
**Component Type:** 🖥️ Page Component"

# Issue #7: Detailed Server Pages
echo "Creating: Detailed Server Pages..."
gh issue create \
  --repo "$REPO" \
  --title "🖥️ Detailed Server Pages - Enhanced server management" \
  --label "frontend,server-management,phase-2,page-component" \
  --milestone "Phase 2 Complete" \
  --body "## 📋 **Overview**
Create detailed server management pages

**Creates:** \`frontend/pages/servers/[serverId].tsx\`

## 🎯 **Acceptance Criteria**
- [ ] Server overview tab
- [ ] Embedded console tab
- [ ] Embedded files tab
- [ ] Settings/configuration tab
- [ ] Resource monitoring
- [ ] Performance metrics

## 🔗 **Dependencies**
- Console Interface (#1)
- File Manager (#2)

## 📊 **Project Metadata**
**Priority:** ⚠️ High Priority
**Phase:** Phase 2: Admin Features
**Complexity:** 🟡 Medium (3-5 days)
**Component Type:** 🖥️ Page Component"

# API Integration Issues
echo ""
echo "🔌 Creating API Integration Issues"
echo "================================"

# Issue #8: Complete API Client
echo "Creating: Complete API Client..."
gh issue create \
  --repo "$REPO" \
  --title "🔌 Complete API Client - Frontend Integration" \
  --label "frontend,api-integration,phase-4" \
  --milestone "Phase 4 Complete" \
  --body "## 📋 **Overview**
Complete frontend integration for all backend API endpoints

**Enhances:** \`frontend/lib/api.ts\`

## 🎯 **Acceptance Criteria**
- [ ] Users API integration
- [ ] Nodes API integration
- [ ] Files API integration
- [ ] Workshop API integration
- [ ] Monitoring API integration
- [ ] WebSocket API integration

## 📊 **Project Metadata**
**Priority:** 📋 Medium Priority
**Phase:** Phase 4: Infrastructure
**Complexity:** 🔴 Complex (1+ weeks)
**Component Type:** 🔌 API Integration"

echo ""
echo "✅ All critical issues created successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to GitHub repository: https://github.com/$REPO"
echo "2. Navigate to Projects tab"
echo "3. Create new project using the migration guide"
echo "4. Add all created issues to the project"
echo "5. Configure project fields and automation"
echo ""
echo "📋 Issues created:"
echo "- Console Interface (Critical Security)"
echo "- File Manager (Critical Security)"
echo "- User Registration (Critical Security)"
echo "- Admin User Management (High Priority)"
echo "- Node Management (High Priority)"
echo "- User Profile (High Priority)"
echo "- Detailed Server Pages (High Priority)"
echo "- Complete API Client (Medium Priority)"
echo ""
echo "🚀 Ready to start frontend migration!"
