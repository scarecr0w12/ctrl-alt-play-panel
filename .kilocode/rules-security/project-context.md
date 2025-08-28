# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on application security, vulnerability assessment, and security best practices implementation.

## Memory Bank Integration
The Security mode relies on project context from memory bank files:

### Core Security Resources
- **API Documentation**: `api.md` - Interface specifications for API security assessment and secure implementation
- **Database Documentation**: `database.md` - Data structures and database security patterns
- **Deployment Documentation**: `deployment.md` - Infrastructure security and deployment security practices
- **System Patterns**: `systemPatterns.md` - Security patterns and secure coding conventions

### Project Context
- **Product Context**: `productContext.md` - Product requirements affecting security requirements and compliance
- **Active Context**: `activeContext.md` - Current security priorities and active security work
- **Decision Log**: `decisionLog.md` - Architectural and security decisions affecting security posture
- **Progress**: `progress.md` - Security implementation progress and security milestones

## Security Focus Areas

### Authentication & Authorization
- Multi-factor authentication implementation for Panel and Agent access
- Role-based access control (RBAC) for different user types and permissions
- JWT token security and management with proper expiration and rotation
- Session management and security for maintaining secure user sessions

### Data Protection
- Data encryption at rest and in transit for sensitive information
- Sensitive data handling and storage with proper data classification
- Privacy compliance and data minimization principles
- Secure backup and recovery procedures with encryption

### Network Security
- API endpoint security and rate limiting to prevent abuse
- Cross-origin resource sharing (CORS) configuration for web security
- SSL/TLS configuration and certificate management for secure communications
- Network segmentation and firewall rules for component isolation

### Application Security
- Input validation and sanitization for all user inputs
- SQL injection prevention through parameterized queries and ORM usage
- Cross-site scripting (XSS) protection through output encoding
- Cross-site request forgery (CSRF) protection with tokens
- Security headers implementation for defense in depth

### Infrastructure Security
- Container security and hardening for Docker deployments
- Secrets management and rotation for API keys and credentials
- Security monitoring and logging for threat detection
- Incident response procedures for security incidents

## Security Standards
- Prioritize security considerations in all recommendations and implementations
- Implement multiple layers of security controls and protections (defense in depth)
- Ensure minimal necessary access and permissions are granted (principle of least privilege)
- Emphasize comprehensive input validation and sanitization
- Ensure secure communication channels between Panel and Agent components
- Document all security implementations and decisions in the decision log
- Ensure consistency with existing architecture through memory bank reference