# Contributing to Ctrl-Alt-Play Panel

Thank you for your interest in contributing to Ctrl-Alt-Play Panel! This guide will help you understand our development workflow and standards.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git with SSH keys configured
- PostgreSQL 14+ (for local development)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone git@github.com:YOUR_USERNAME/ctrl-alt-play-panel.git
   cd ctrl-alt-play-panel
   git remote add upstream git@github.com:scarecr0w12/ctrl-alt-play-panel.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd agent && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Environment**
   ```bash
   docker-compose up -d postgres redis
   npm run db:push
   npm run db:seed
   npm run dev
   ```

## 📋 Development Workflow

### Branch Strategy

- `main` - Production-ready code, protected branch
- `feature/feature-name` - New features
- `fix/issue-description` - Bug fixes
- `docs/documentation-update` - Documentation improvements
- `chore/maintenance-task` - Maintenance and refactoring

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(auth): add two-factor authentication
fix(api): resolve server status update race condition
docs(readme): update installation instructions
test(ctrl-alt): add integration tests for Alt import
chore(deps): update dependencies to latest versions
```

## 🏷️ Version Management

### Semantic Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (X.0.0): Breaking changes, major feature releases
- **MINOR** (X.Y.0): New features, significant additions
- **PATCH** (X.Y.Z): Bug fixes, documentation updates, small improvements

### Version Bump Process

**For Maintainers Only:**

```bash
# Bug fixes and documentation
./version.sh patch "Fix authentication timeout issue"

# New features
./version.sh minor "Add server backup functionality"

# Breaking changes
./version.sh major "Redesign Panel+Agent API protocol"
```

The version script automatically:
- Updates all package.json files
- Updates CHANGELOG.md with release notes
- Creates git commit and annotated tag
- Pushes changes to remote repository

### What Triggers Version Bumps

| Change Type | Version Bump | Examples |
|-------------|--------------|----------|
| Bug fixes | PATCH | Authentication fixes, UI corrections |
| Documentation | PATCH | README updates, API docs |
| New features | MINOR | New dashboard widgets, API endpoints |
| Major features | MINOR | Complete new modules, significant UI overhauls |
| Breaking changes | MAJOR | API structure changes, database schema changes |
| Security patches | PATCH | Dependency updates, security fixes |

## 🧪 Testing Requirements

### Before Submitting

1. **Run Tests**
   ```bash
   npm test
   npm run test:integration
   ```

2. **Type Checking**
   ```bash
   npm run type-check
   ```

3. **Linting**
   ```bash
   npm run lint
   ```

4. **Build Verification**
   ```bash
   npm run build
   ```

### Test Coverage

- Maintain or improve test coverage (currently 90%+)
- Add tests for new features and bug fixes
- Include integration tests for API changes

## 📝 Pull Request Process

### Before Opening a PR

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and test**
   ```bash
   # Make your changes
   npm test
   npm run lint
   ```

4. **Commit with conventional format**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

### PR Template

When opening a PR, please include:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (patch)
- [ ] New feature (minor)
- [ ] Breaking change (major)
- [ ] Documentation update (patch)

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Integration tests updated if needed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes without version discussion
```

### Review Process

1. **Automated Checks**: All tests and linting must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing of new features
4. **Documentation**: Ensure docs are updated appropriately

## 🎯 Code Standards

### TypeScript Guidelines

- Use strict type checking
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React/Frontend Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines (a11y)
- Use TypeScript for all components

### Backend Guidelines

- Use async/await over callbacks
- Implement proper error handling
- Use Prisma for database operations
- Add input validation for all endpoints

### Security Guidelines

- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries for database operations
- Implement proper authentication checks

## 🐛 Issue Reporting

### Bug Reports

Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any related issues or PRs

## 🏆 Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- GitHub contributors list
- Project documentation where appropriate

## 📞 Getting Help

- **Discord**: [Community Server](https://discord.gg/ctrl-alt-play)
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: maintainers@ctrl-alt-play.dev

## 📄 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Ctrl-Alt-Play Panel! 🎮
