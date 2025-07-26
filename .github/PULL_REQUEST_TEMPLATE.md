# Pull Request Template

## 📋 Summary

<!-- Provide a brief description of the changes in this PR -->

## 🎯 Type of Change

<!-- Mark with an [x] all that apply -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🎨 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test coverage improvement
- [ ] 🔒 Security enhancement

## 🔗 Related Issues

<!-- Link to related issues using keywords: Fixes #123, Closes #456, Relates to #789 -->

- Fixes #
- Closes #
- Relates to #

## 🧪 Testing

<!-- Describe the tests you ran to verify your changes -->

### Test Environment

- [ ] Local development environment
- [ ] Docker containers
- [ ] Staging environment
- [ ] Production environment

### Test Categories

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Security testing completed
- [ ] Performance testing completed

### New Tests Added

<!-- List any new tests you added -->

- [ ] Unit tests for new functionality
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests
- [ ] Database migration tests

## 📝 Changes Made

<!-- Provide a detailed description of changes -->

### Backend Changes

<!-- List changes to backend/API -->

- TBD

### Frontend Changes

<!-- List changes to frontend/UI -->

- TBD

### Database Changes

<!-- List any database schema changes -->

- [ ] Migration scripts included
- [ ] Rollback procedures documented
- [ ] Data validation completed

### Configuration Changes

<!-- List any configuration changes -->

- TBD

## 🔍 Code Review Checklist

<!-- For reviewers and author -->

### General

- [ ] Code follows established coding standards
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No hardcoded secrets or credentials
- [ ] Error handling implemented appropriately

### Architecture

- [ ] Changes align with Panel+Agent architecture
- [ ] External agent communication patterns followed
- [ ] Permission system integration maintained
- [ ] TypeScript types properly defined

### Security

- [ ] Authentication/authorization checks implemented
- [ ] Input validation and sanitization included
- [ ] SQL injection prevention measures in place
- [ ] XSS prevention measures implemented
- [ ] CSRF protection maintained

### Performance

- [ ] Database queries optimized
- [ ] API response times considered
- [ ] Frontend bundle size impact minimal
- [ ] Memory usage optimized

## 📊 Impact Assessment

### Performance Impact

<!-- Describe any performance implications -->

- **Database**: TBD
- **API Response Time**: TBD
- **Frontend Bundle Size**: TBD
- **Memory Usage**: TBD

### Breaking Changes

<!-- List any breaking changes and migration steps -->

- [ ] No breaking changes
- [ ] Breaking changes documented below

<!-- If breaking changes, describe migration steps -->

### Deployment Considerations

<!-- Any special deployment requirements -->

- [ ] No special deployment requirements
- [ ] Requires database migration
- [ ] Requires configuration updates
- [ ] Requires external agent updates

## 📷 Screenshots/Recordings

<!-- Add screenshots or recordings of UI changes -->

### Before

<!-- Screenshots of current state -->

### After

<!-- Screenshots of new state -->

## 📚 Documentation Updates

- [ ] README updated
- [ ] API documentation updated
- [ ] Architecture documentation updated
- [ ] Deployment documentation updated
- [ ] User guide updated
- [ ] Developer guide updated

## ✅ Pre-submission Checklist

- [ ] Branch is up to date with main
- [ ] All CI/CD checks passing
- [ ] No merge conflicts
- [ ] Code has been self-reviewed
- [ ] Documentation updated where necessary
- [ ] Tests added for new functionality
- [ ] Security implications considered
- [ ] Performance impact assessed

## 🔮 Future Considerations

<!-- Any future work or considerations related to this PR -->

- TBD

## 📞 Additional Context

<!-- Add any other context about the pull request here -->

---

**For Reviewers:**

- Focus areas for review: TBD
- Specific concerns: TBD
- Testing recommendations: TBD

**Estimated Review Time:** <!-- e.g., 15 minutes, 1 hour, etc. -->
