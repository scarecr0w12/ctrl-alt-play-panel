# Security Policy

## Supported Versions

We actively support the following versions of Ctrl-Alt-Play Panel with security updates:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.1.x   | :white_check_mark: | Active |
| 1.0.x   | :warning:          | Legacy |
| < 1.0   | :x:                | EOL    |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Ctrl-Alt-Play Panel, please report it responsibly.

### How to Report

**Please do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please:

1. **Email**: Send details to `security@ctrl-alt-play.dev`
2. **Subject Line**: `[SECURITY] Brief description of the vulnerability`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 24 hours
- **Initial Response**: We'll provide an initial response within 72 hours
- **Updates**: We'll keep you informed of our progress
- **Resolution**: We aim to resolve critical issues within 7 days
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)

### Security Measures

Ctrl-Alt-Play Panel implements several security measures:

#### Authentication & Authorization
- JWT-based authentication with secure httpOnly cookies
- Role-based access control (Admin/User/Root Admin)
- Session management with secure token rotation
- Rate limiting on authentication endpoints

#### Infrastructure Security
- HTTPS enforcement with SSL/TLS encryption
- CORS protection for cross-origin requests
- CSP (Content Security Policy) headers
- Helmet.js security headers implementation

#### Panel ↔ Agent Security
- WSS (WebSocket Secure) encrypted communication
- JWT token authentication for agent verification
- Command validation and input sanitization
- Encrypted configuration transmission

#### Data Protection
- Password hashing with bcrypt (minimum 12 rounds)
- Input validation and sanitization on all endpoints
- Parameterized database queries (SQL injection prevention)
- File upload restrictions and validation

#### Container Security
- Docker container isolation
- Non-root user execution
- Resource limits and constraints
- Network segmentation

### Security Best Practices for Users

#### Installation
- Use strong, unique passwords for all accounts
- Enable 2FA when available
- Keep the panel updated to the latest version
- Use HTTPS in production environments

#### Configuration
- Review and limit user permissions regularly
- Monitor logs for suspicious activity
- Use secure database credentials
- Implement proper firewall rules

#### Deployment
- Use official Docker images or build from source
- Keep host systems updated
- Use reverse proxy (nginx/traefik) for SSL termination
- Implement regular backup procedures

### Security Updates

Security updates are released as patch versions (e.g., 1.0.1, 1.0.2) and are:

- **Automatically** applied in Docker deployments (when using `latest` tag)
- **Documented** in the CHANGELOG.md with security advisory
- **Announced** in release notes and security channels
- **Prioritized** over other development work

### Responsible Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1**: Acknowledgment sent
3. **Day 3**: Initial assessment completed
4. **Day 7**: Fix developed and tested
5. **Day 14**: Security update released
6. **Day 21**: Public disclosure (if appropriate)

### Bug Bounty Program

Currently, we do not offer a formal bug bounty program. However, we deeply appreciate security researchers who help us improve the security of Ctrl-Alt-Play Panel.

### Security Advisories

Security advisories are published:
- In GitHub Security Advisories
- In release notes for security updates
- On our website security page
- Through relevant security mailing lists

### Contact Information

- **Security Email**: `security@ctrl-alt-play.dev`
- **General Support**: `support@ctrl-alt-play.dev`
- **GitHub Issues**: For non-security bugs only
- **Discord**: Community support (not for security issues)

### Legal

This security policy is subject to our [Terms of Service](./LICENSE) and applicable law. By reporting a vulnerability, you agree to:

- Work with us to resolve the issue responsibly
- Not publicly disclose the vulnerability until we've addressed it
- Not access, modify, or delete data without explicit permission
- Comply with all applicable laws and regulations

---

Thank you for helping keep Ctrl-Alt-Play Panel secure! 🛡️
