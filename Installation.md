# Installation Guide

This guide provides detailed instructions for installing the Ctrl-Alt-Play Panel on your system.

## System Requirements

- **Linux**: Any distribution (Ubuntu, CentOS, RHEL, Debian, Alpine, etc.)
- **Node.js**: 18.0.0 or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 5GB free space minimum
- **Network**: Internet access for initial setup

## Quick Start Options

### One-Command Auto Setup (Fastest)

```bash
git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel
./quick-deploy.sh
```

### Interactive CLI Wizard (Guided)

```bash
./quick-deploy.sh --wizard
```

### Web-based Installer (Browser)

```bash
./quick-deploy.sh --web
# Opens http://localhost:8080 in your browser
```

## Manual Installation

For developers who prefer step-by-step control, see our [Manual Installation Guide](docs/MANUAL_INSTALLATION.md).

## Database Support

Ctrl-Alt-Play Panel supports multiple database systems out of the box:

- **PostgreSQL** (recommended for production)
- **MySQL** / **MariaDB** (great compatibility)
- **MongoDB** (document-based, flexible schema)
- **SQLite** (perfect for development and small deployments)

During setup, you can choose your preferred database or let the system detect and use existing databases. All setup methods handle database configuration automatically.

## Post-Installation

After installation, you can access your panel at: <http://localhost:3000>

## Configuration

The system uses environment variables for configuration. Copy the template file to create your configuration:

```bash
cp .env.production.template .env.production
```

Then edit the `.env.production` file to match your environment settings.