# Product Context

## Overview

**Ctrl-Alt-Play Panel** is a comprehensive web-based game server management system designed for hosting providers, game server administrators, and gaming communities. The platform provides centralized management of distributed game servers through a modern, secure, and scalable Panel+Agent architecture.

## Core Features

### Server Management
- **Multi-Game Support**: Support for various game types through configurable templates (Ctrls/Alts)
- **Distributed Architecture**: Panel+Agent system for scalable server deployment across multiple nodes
- **Real-Time Control**: Start, stop, restart, and configure game servers remotely
- **Console Access**: Live console streaming and command execution
- **File Management**: Advanced file operations with permissions and bulk operations

### User & Permission Management
- **Role-Based Access Control**: 36 granular permissions across 10 categories
- **Multi-User Support**: Support for administrators, moderators, and end users
- **Resource Ownership**: User-specific server and resource management
- **Secure Authentication**: JWT-based authentication with httpOnly cookies

### Advanced Features
- **Plugin System**: Extensible architecture with JavaScript/TypeScript plugin support
- **Marketplace Integration**: Plugin discovery, installation, and management
- **Steam Workshop Integration**: Native Steam Workshop content management
- **Analytics Dashboard**: Comprehensive server performance and usage analytics
- **Monitoring & Alerting**: Real-time system monitoring with alert capabilities

### Modern Infrastructure
- **Deployment Agnostic**: Deploy on any Linux distribution without dependencies
- **Docker Integration**: Containerized deployment with multi-platform support
- **Dynamic Port Management**: Automatic port conflict resolution
- **CI/CD Pipeline**: Automated testing and deployment across platforms
- **Security-First**: Comprehensive security scanning and vulnerability management

## Target Users

### Primary Users
- **Hosting Providers**: Companies offering game server hosting services
- **Gaming Communities**: Large gaming communities managing multiple servers
- **Server Administrators**: Technical users managing dedicated game servers

### Secondary Users
- **Game Server Operators**: Individual users running small-scale game servers
- **Developers**: Plugin developers and system integrators
- **System Administrators**: IT professionals managing gaming infrastructure

## Technical Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **Communication**: HTTP REST API + WebSocket for real-time features

### Frontend
- **Framework**: React with Next.js and static export
- **Styling**: TailwindCSS with Glass Morphism design system
- **State Management**: React Context API
- **Security**: XSS protection with secure authentication patterns

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Deployment**: Any Linux distribution with automatic configuration
- **Testing**: Jest with comprehensive mocking and cross-platform validation
- **CI/CD**: GitHub Actions with security scanning

### External Integration
- **Steam Workshop**: Real Steam Web API integration
- **Docker Engine**: Container lifecycle management
- **Agent Communication**: HTTP-based distributed agent protocol
- **Plugin Marketplace**: Extensible plugin ecosystem

## Market Position

**Ctrl-Alt-Play Panel** positions itself as the modern alternative to legacy game server management solutions, offering:

- **Ease of Deployment**: One-command deployment on any Linux system
- **Modern Architecture**: Built with current web technologies and security practices
- **Extensibility**: Plugin system for custom functionality
- **Scalability**: Distributed architecture supporting unlimited nodes
- **Security**: Enterprise-grade security with comprehensive vulnerability scanning
- **Community-Driven**: Open-source development with active community contribution

## Business Value

### For Hosting Providers
- Reduced operational overhead through automation
- Scalable infrastructure supporting business growth
- Modern UI improving customer satisfaction
- Comprehensive analytics for business insights

### For Gaming Communities
- Centralized management reducing administrative burden
- Advanced permission system for community governance
- Plugin ecosystem for custom functionality
- Real-time monitoring improving server reliability

### For Developers
- Modern plugin development environment
- Comprehensive API for integration
- TypeScript support for type-safe development
- Active community and documentation