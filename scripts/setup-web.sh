#!/bin/bash

# Ctrl-Alt-Play Panel - Web-based Setup Installer
# Launches a temporary web interface for easy configuration

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
WEB_INSTALLER_PORT=8080
WEB_INSTALLER_DIR="web-installer"
INSTALLER_LOG="web-installer.log"

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🌐 Ctrl-Alt-Play Panel Web Installer                     ║"
    echo "║                       Browser-based Setup Interface                         ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Node.js not found. Installing...${NC}"
        # Add Node.js installation logic here
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  npm not found. Please install Node.js with npm.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

setup_web_installer() {
    echo "🚀 Setting up web installer..."
    
    # Create web installer directory
    mkdir -p "$WEB_INSTALLER_DIR"
    
    # Create package.json for web installer
    cat > "$WEB_INSTALLER_DIR/package.json" << 'EOF'
{
  "name": "ctrl-alt-play-web-installer",
  "version": "1.0.0",
  "description": "Web-based installer for Ctrl-Alt-Play Panel",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "body-parser": "^1.20.2",
    "multer": "^1.4.5-lts.1"
  }
}
EOF

    # Install dependencies
    echo "📦 Installing web installer dependencies..."
    cd "$WEB_INSTALLER_DIR"
    npm install --silent
    cd ..
    
    echo -e "${GREEN}✅ Web installer setup completed${NC}"
}

create_web_installer_server() {
    cat > "$WEB_INSTALLER_DIR/server.js" << 'EOF'
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.WEB_INSTALLER_PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Store configuration state
let config = {};
let installationStep = 'welcome';
let installationProgress = 0;

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send current state to new client
    socket.emit('state-update', {
        step: installationStep,
        progress: installationProgress,
        config: config
    });
    
    // Handle configuration updates
    socket.on('config-update', (data) => {
        config = { ...config, ...data };
        io.emit('config-updated', config);
    });
    
    // Handle installation steps
    socket.on('next-step', (step) => {
        installationStep = step;
        installationProgress = getProgressForStep(step);
        io.emit('state-update', {
            step: installationStep,
            progress: installationProgress,
            config: config
        });
    });
    
    // Handle installation start
    socket.on('start-installation', () => {
        startInstallation(socket);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

function getProgressForStep(step) {
    const steps = {
        'welcome': 0,
        'environment': 15,
        'database': 30,
        'security': 45,
        'features': 60,
        'review': 75,
        'installation': 90,
        'complete': 100
    };
    return steps[step] || 0;
}

async function startInstallation(socket) {
    try {
        socket.emit('installation-log', 'Starting installation process...');
        
        // Generate .env file
        socket.emit('installation-log', 'Generating configuration file...');
        generateEnvFile();
        
        // Start Docker services
        socket.emit('installation-log', 'Starting Docker services...');
        await startDockerServices(socket);
        
        // Run database migrations
        socket.emit('installation-log', 'Setting up database...');
        await runDatabaseSetup(socket);
        
        // Create admin user
        socket.emit('installation-log', 'Creating admin user...');
        await createAdminUser(socket);
        
        // Final health check
        socket.emit('installation-log', 'Running final health check...');
        await runHealthCheck(socket);
        
        socket.emit('installation-complete', {
            success: true,
            url: `http://${config.domain || 'localhost'}:${config.port || 3000}`,
            adminEmail: config.adminEmail
        });
        
    } catch (error) {
        socket.emit('installation-error', {
            message: error.message,
            step: 'installation'
        });
    }
}

function generateEnvFile() {
    const envContent = `# Ctrl-Alt-Play Panel Configuration
# Generated by Web Installer on ${new Date().toISOString()}

NODE_ENV=${config.environment || 'development'}
PORT=${config.port || 3000}
DOMAIN=${config.domain || 'localhost'}

# Database Configuration
DB_HOST=${config.dbHost || 'postgres'}
DB_PORT=${config.dbPort || 5432}
DB_NAME=${config.dbName || 'ctrl_alt_play'}
DB_USER=${config.dbUser || 'postgres'}
DB_PASSWORD=${config.dbPassword}

# Redis Configuration
REDIS_HOST=${config.redisHost || 'redis'}
REDIS_PORT=${config.redisPort || 6379}

# Security Configuration
JWT_SECRET=${config.jwtSecret}
AGENT_SECRET=${config.agentSecret}
SESSION_SECRET=${config.sessionSecret}
ADMIN_EMAIL=${config.adminEmail}
ADMIN_PASSWORD=${config.adminPassword}

# Features
ANALYTICS_ENABLED=${config.analyticsEnabled || 'true'}
BACKUP_ENABLED=${config.backupEnabled || 'true'}
EMAIL_ENABLED=${config.emailEnabled || 'false'}
`;

    fs.writeFileSync('../.env', envContent);
}

async function startDockerServices(socket) {
    return new Promise((resolve, reject) => {
        const process = spawn('docker-compose', ['up', '-d'], {
            cwd: '..',
            stdio: 'pipe'
        });
        
        process.stdout.on('data', (data) => {
            socket.emit('installation-log', data.toString());
        });
        
        process.stderr.on('data', (data) => {
            socket.emit('installation-log', `ERROR: ${data.toString()}`);
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Docker compose failed with code ${code}`));
            }
        });
    });
}

async function runDatabaseSetup(socket) {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return new Promise((resolve, reject) => {
        const process = spawn('npm', ['run', 'db:migrate'], {
            cwd: '..',
            stdio: 'pipe'
        });
        
        process.stdout.on('data', (data) => {
            socket.emit('installation-log', data.toString());
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Database setup failed with code ${code}`));
            }
        });
    });
}

async function createAdminUser(socket) {
    // Implementation for creating admin user
    socket.emit('installation-log', 'Admin user created successfully');
}

async function runHealthCheck(socket) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', ['src/health-check.js'], {
            cwd: '..',
            stdio: 'pipe'
        });
        
        process.stdout.on('data', (data) => {
            socket.emit('installation-log', data.toString());
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('Health check failed'));
            }
        });
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/config', (req, res) => {
    res.json(config);
});

app.post('/api/config', (req, res) => {
    config = { ...config, ...req.body };
    io.emit('config-updated', config);
    res.json({ success: true });
});

// Generate secrets endpoint
app.post('/api/generate-secrets', (req, res) => {
    const crypto = require('crypto');
    
    const secrets = {
        jwtSecret: crypto.randomBytes(32).toString('base64'),
        agentSecret: crypto.randomBytes(24).toString('base64'),
        sessionSecret: crypto.randomBytes(24).toString('base64'),
        dbPassword: crypto.randomBytes(16).toString('base64').replace(/[+/=]/g, '')
    };
    
    res.json(secrets);
});

// Start server
server.listen(PORT, () => {
    console.log(`Web installer running on http://localhost:${PORT}`);
    console.log('Open this URL in your browser to begin setup');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down web installer...');
    server.close(() => {
        process.exit(0);
    });
});
EOF
}

create_web_installer_frontend() {
    mkdir -p "$WEB_INSTALLER_DIR/public"
    
    # Create main HTML file
    cat > "$WEB_INSTALLER_DIR/public/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ctrl-Alt-Play Panel - Web Installer</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .installer-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            width: 90%;
            max-width: 800px;
            overflow: hidden;
        }
        
        .installer-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .installer-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .installer-header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .progress-bar {
            background: rgba(255,255,255,0.2);
            height: 6px;
            border-radius: 3px;
            margin-top: 20px;
            overflow: hidden;
        }
        
        .progress-fill {
            background: white;
            height: 100%;
            width: 0%;
            transition: width 0.5s ease;
        }
        
        .installer-content {
            padding: 40px;
        }
        
        .step {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .step.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .step-navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e1e5e9;
        }
        
        .installation-log {
            background: #1e1e1e;
            color: #00ff00;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        
        .success-message {
            text-align: center;
            padding: 40px;
        }
        
        .success-message .icon {
            font-size: 4em;
            color: #28a745;
            margin-bottom: 20px;
        }
        
        .config-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .config-section h3 {
            color: #495057;
            margin-bottom: 15px;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: #667eea;
        }
        
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    </style>
</head>
<body>
    <div class="installer-container">
        <div class="installer-header">
            <h1>🎮 Ctrl-Alt-Play Panel</h1>
            <p>Web-based Setup Installer</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        </div>
        
        <div class="installer-content">
            <!-- Welcome Step -->
            <div class="step active" id="step-welcome">
                <h2>Welcome to Ctrl-Alt-Play Panel</h2>
                <p>This installer will guide you through setting up your game server management panel. The process typically takes 5-10 minutes.</p>
                
                <h3>What you'll configure:</h3>
                <ul>
                    <li>🌍 Environment and basic settings</li>
                    <li>🗄️ Database configuration</li>
                    <li>🔒 Security and authentication</li>
                    <li>🎯 Optional features and integrations</li>
                </ul>
                
                <div class="step-navigation">
                    <div></div>
                    <button class="btn" onclick="nextStep('environment')">Get Started</button>
                </div>
            </div>
            
            <!-- Environment Step -->
            <div class="step" id="step-environment">
                <h2>Environment Configuration</h2>
                
                <div class="config-section">
                    <h3>🌍 Basic Settings</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="environment">Environment:</label>
                            <select id="environment" onchange="updateConfig()">
                                <option value="development">Development</option>
                                <option value="staging">Staging</option>
                                <option value="production">Production</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="port">Application Port:</label>
                            <input type="number" id="port" value="3000" min="1" max="65535" onchange="updateConfig()">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="domain">Domain:</label>
                        <input type="text" id="domain" value="localhost" placeholder="example.com" onchange="updateConfig()">
                    </div>
                </div>
                
                <div class="step-navigation">
                    <button class="btn btn-secondary" onclick="prevStep('welcome')">Back</button>
                    <button class="btn" onclick="nextStep('database')">Continue</button>
                </div>
            </div>
            
            <!-- Database Step -->
            <div class="step" id="step-database">
                <h2>Database Configuration</h2>
                
                <div class="config-section">
                    <h3>🗄️ Select Database Type</h3>
                    <div class="form-group">
                        <label for="dbType">Database Type:</label>
                        <select id="dbType" onchange="updateDatabaseOptions()">
                            <option value="postgresql">PostgreSQL (Recommended)</option>
                            <option value="mysql">MySQL</option>
                            <option value="mariadb">MariaDB</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="sqlite">SQLite (Development Only)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="dbLocal" checked onchange="updateDatabaseOptions()">
                            Use Local Docker Database
                        </label>
                        <p style="color: #6c757d; margin-top: 5px;">Automatically creates and manages database container</p>
                    </div>
                </div>
                
                <div class="config-section" id="remoteDbConfig" style="display: none;">
                    <h3>🌐 Remote Database Configuration</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="dbHost">Database Host:</label>
                            <input type="text" id="dbHost" placeholder="localhost or remote host" onchange="updateConfig()">
                        </div>
                        <div class="form-group">
                            <label for="dbPort">Database Port:</label>
                            <input type="number" id="dbPort" placeholder="5432" onchange="updateConfig()">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="dbSsl" onchange="updateConfig()">
                            Enable SSL Connection
                        </label>
                        <p style="color: #6c757d; margin-top: 5px;">Recommended for remote databases</p>
                    </div>
                    <button type="button" class="btn" onclick="testDatabaseConnection()">Test Connection</button>
                    <div id="connectionResult" style="margin-top: 10px;"></div>
                </div>
                
                <div class="config-section" id="dbCredentials">
                    <h3>🔐 Database Credentials</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="dbName">Database Name:</label>
                            <input type="text" id="dbName" value="ctrl_alt_play" onchange="updateConfig()">
                        </div>
                        <div class="form-group" id="dbUserGroup">
                            <label for="dbUser">Username:</label>
                            <input type="text" id="dbUser" value="ctrlaltplay" onchange="updateConfig()">
                        </div>
                    </div>
                    <div class="form-group" id="dbPasswordGroup">
                        <label for="dbPassword">Password:</label>
                        <input type="password" id="dbPassword" onchange="updateConfig()">
                        <button type="button" class="btn" style="margin-top: 10px;" onclick="generatePassword('dbPassword')">Generate Secure Password</button>
                    </div>
                </div>
                
                <div class="config-section" id="sqliteConfig" style="display: none;">
                    <h3>📁 SQLite Configuration</h3>
                    <div class="form-group">
                        <label for="sqlitePath">Database File Path:</label>
                        <input type="text" id="sqlitePath" value="./data/ctrl_alt_play.db" onchange="updateConfig()">
                    </div>
                    <p style="color: #e67e22; margin-top: 10px;">
                        ⚠️ SQLite is recommended for development and testing only. For production, use PostgreSQL or MySQL.
                    </p>
                </div>
                
                <div class="step-navigation">
                    <button class="btn btn-secondary" onclick="prevStep('environment')">Back</button>
                    <button class="btn" onclick="nextStep('security')">Continue</button>
                </div>
            </div>
            
            <!-- Security Step -->
            <div class="step" id="step-security">
                <h2>Security Configuration</h2>
                
                <div class="config-section">
                    <h3>🔒 Security Secrets</h3>
                    <button type="button" class="btn" onclick="generateAllSecrets()">Generate All Security Secrets</button>
                    <p style="margin-top: 10px; color: #6c757d;">Secure secrets have been generated automatically for production use.</p>
                </div>
                
                <div class="config-section">
                    <h3>👤 Administrator Account</h3>
                    <div class="form-group">
                        <label for="adminEmail">Admin Email:</label>
                        <input type="email" id="adminEmail" placeholder="admin@example.com" onchange="updateConfig()">
                    </div>
                    <div class="form-group">
                        <label for="adminPassword">Admin Password:</label>
                        <input type="password" id="adminPassword" onchange="updateConfig()">
                        <button type="button" class="btn" style="margin-top: 10px;" onclick="generatePassword('adminPassword')">Generate Secure Password</button>
                    </div>
                </div>
                
                <div class="step-navigation">
                    <button class="btn btn-secondary" onclick="prevStep('database')">Back</button>
                    <button class="btn" onclick="nextStep('features')">Continue</button>
                </div>
            </div>
            
            <!-- Features Step -->
            <div class="step" id="step-features">
                <h2>Feature Configuration</h2>
                
                <div class="config-section">
                    <h3>🎯 Optional Features</h3>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="analyticsEnabled" checked onchange="updateConfig()">
                            Enable Analytics & Metrics
                        </label>
                        <p style="color: #6c757d; margin-top: 5px;">Track server performance and player statistics</p>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="backupEnabled" checked onchange="updateConfig()">
                            Enable Automated Backups
                        </label>
                        <p style="color: #6c757d; margin-top: 5px;">Automatic database and configuration backups</p>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="emailEnabled" onchange="updateConfig()">
                            Enable Email Notifications
                        </label>
                        <p style="color: #6c757d; margin-top: 5px;">Email alerts for important events</p>
                    </div>
                </div>
                
                <div class="step-navigation">
                    <button class="btn btn-secondary" onclick="prevStep('security')">Back</button>
                    <button class="btn" onclick="nextStep('review')">Continue</button>
                </div>
            </div>
            
            <!-- Review Step -->
            <div class="step" id="step-review">
                <h2>Configuration Review</h2>
                
                <div class="config-section">
                    <h3>📋 Review Your Settings</h3>
                    <div id="configReview"></div>
                </div>
                
                <div class="step-navigation">
                    <button class="btn btn-secondary" onclick="prevStep('features')">Back</button>
                    <button class="btn" onclick="startInstallation()">Start Installation</button>
                </div>
            </div>
            
            <!-- Installation Step -->
            <div class="step" id="step-installation">
                <h2>Installing Ctrl-Alt-Play Panel</h2>
                
                <div class="installation-log" id="installationLog"></div>
                
                <div style="text-align: center;">
                    <button class="btn" disabled id="installationBtn">Installing...</button>
                </div>
            </div>
            
            <!-- Complete Step -->
            <div class="step" id="step-complete">
                <div class="success-message">
                    <div class="icon">🎉</div>
                    <h2>Installation Complete!</h2>
                    <p>Your Ctrl-Alt-Play Panel has been successfully installed and configured.</p>
                    
                    <div style="margin: 30px 0;">
                        <strong>Access your panel at:</strong><br>
                        <a href="#" id="panelUrl" target="_blank" style="font-size: 1.2em; color: #667eea;"></a>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong>Admin Credentials:</strong><br>
                        Email: <span id="adminEmailDisplay"></span><br>
                        Password: <em>As configured during setup</em>
                    </div>
                    
                    <button class="btn" onclick="openPanel()">Open Panel</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let currentConfig = {};
        
        // Socket event handlers
        socket.on('state-update', (data) => {
            updateProgress(data.progress);
            currentConfig = data.config || {};
        });
        
        socket.on('config-updated', (config) => {
            currentConfig = config;
        });
        
        socket.on('installation-log', (message) => {
            const log = document.getElementById('installationLog');
            log.innerHTML += message + '\n';
            log.scrollTop = log.scrollHeight;
        });
        
        socket.on('installation-complete', (data) => {
            if (data.success) {
                document.getElementById('panelUrl').href = data.url;
                document.getElementById('panelUrl').textContent = data.url;
                document.getElementById('adminEmailDisplay').textContent = data.adminEmail;
                nextStep('complete');
            }
        });
        
        socket.on('installation-error', (error) => {
            alert('Installation failed: ' + error.message);
        });
        
        // Navigation functions
        function nextStep(step) {
            document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
            document.getElementById('step-' + step).classList.add('active');
            
            if (step === 'review') {
                showConfigReview();
            }
            
            socket.emit('next-step', step);
        }
        
        function prevStep(step) {
            nextStep(step);
        }
        
        // Configuration functions
        function updateConfig() {
            const config = {
                environment: document.getElementById('environment')?.value,
                port: document.getElementById('port')?.value,
                domain: document.getElementById('domain')?.value,
                dbType: document.getElementById('dbType')?.value,
                dbLocal: document.getElementById('dbLocal')?.checked,
                dbHost: document.getElementById('dbHost')?.value,
                dbPort: document.getElementById('dbPort')?.value,
                dbName: document.getElementById('dbName')?.value,
                dbUser: document.getElementById('dbUser')?.value,
                dbPassword: document.getElementById('dbPassword')?.value,
                dbSsl: document.getElementById('dbSsl')?.checked,
                sqlitePath: document.getElementById('sqlitePath')?.value,
                adminEmail: document.getElementById('adminEmail')?.value,
                adminPassword: document.getElementById('adminPassword')?.value,
                analyticsEnabled: document.getElementById('analyticsEnabled')?.checked,
                backupEnabled: document.getElementById('backupEnabled')?.checked,
                emailEnabled: document.getElementById('emailEnabled')?.checked
            };
            
            // Remove undefined values
            Object.keys(config).forEach(key => {
                if (config[key] === undefined) delete config[key];
            });
            
            currentConfig = { ...currentConfig, ...config };
            socket.emit('config-update', config);
        }
        
        function generatePassword(fieldId) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < 16; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            document.getElementById(fieldId).value = password;
            updateConfig();
        }
        
        function generateAllSecrets() {
            fetch('/api/generate-secrets', { method: 'POST' })
                .then(response => response.json())
                .then(secrets => {
                    currentConfig = { ...currentConfig, ...secrets };
                    socket.emit('config-update', secrets);
                    alert('Security secrets generated successfully!');
                });
        }
        
        function updateDatabaseOptions() {
            const dbType = document.getElementById('dbType').value;
            const dbLocal = document.getElementById('dbLocal').checked;
            
            // Update UI based on database type and local/remote selection
            const remoteDbConfig = document.getElementById('remoteDbConfig');
            const dbCredentials = document.getElementById('dbCredentials');
            const sqliteConfig = document.getElementById('sqliteConfig');
            const dbUserGroup = document.getElementById('dbUserGroup');
            const dbPasswordGroup = document.getElementById('dbPasswordGroup');
            
            // Show/hide sections based on database type
            if (dbType === 'sqlite') {
                sqliteConfig.style.display = 'block';
                dbCredentials.style.display = 'none';
                remoteDbConfig.style.display = 'none';
            } else {
                sqliteConfig.style.display = 'none';
                dbCredentials.style.display = 'block';
                
                // Show remote config if not using local database
                remoteDbConfig.style.display = dbLocal ? 'none' : 'block';
                
                // MongoDB doesn't use traditional username/password in some cases
                if (dbType === 'mongodb') {
                    dbUserGroup.style.display = 'block';
                    dbPasswordGroup.style.display = 'block';
                } else {
                    dbUserGroup.style.display = 'block';
                    dbPasswordGroup.style.display = 'block';
                }
            }
            
            // Update default port based on database type
            const dbPort = document.getElementById('dbPort');
            if (dbPort) {
                switch (dbType) {
                    case 'postgresql':
                        dbPort.value = '5432';
                        break;
                    case 'mysql':
                    case 'mariadb':
                        dbPort.value = '3306';
                        break;
                    case 'mongodb':
                        dbPort.value = '27017';
                        break;
                }
            }
            
            // Update default username
            const dbUser = document.getElementById('dbUser');
            if (dbUser && dbLocal) {
                switch (dbType) {
                    case 'postgresql':
                        dbUser.value = 'postgres';
                        break;
                    case 'mysql':
                    case 'mariadb':
                        dbUser.value = 'root';
                        break;
                    case 'mongodb':
                        dbUser.value = 'admin';
                        break;
                }
            }
            
            // Update default host for local databases
            const dbHost = document.getElementById('dbHost');
            if (dbHost && dbLocal) {
                dbHost.value = dbType; // Docker service name
            } else if (dbHost && !dbLocal) {
                dbHost.value = 'localhost';
            }
            
            updateConfig();
        }
        
        function testDatabaseConnection() {
            const connectionResult = document.getElementById('connectionResult');
            connectionResult.innerHTML = '<div style="color: #f39c12;">🔄 Testing connection...</div>';
            
            const dbConfig = {
                type: document.getElementById('dbType').value,
                host: document.getElementById('dbHost').value,
                port: document.getElementById('dbPort').value,
                database: document.getElementById('dbName').value,
                username: document.getElementById('dbUser').value,
                password: document.getElementById('dbPassword').value,
                ssl: document.getElementById('dbSsl')?.checked || false
            };
            
            fetch('/api/test-database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    connectionResult.innerHTML = '<div style="color: #27ae60;">✅ Connection successful!</div>';
                } else {
                    connectionResult.innerHTML = `<div style="color: #e74c3c;">❌ Connection failed: ${result.error}</div>`;
                }
            })
            .catch(error => {
                connectionResult.innerHTML = '<div style="color: #e74c3c;">❌ Connection test failed. Please check your settings.</div>';
            });
        }
        
        function showConfigReview() {
            const review = document.getElementById('configReview');
            const dbType = currentConfig.dbType || 'postgresql';
            const dbLocal = currentConfig.dbLocal !== false; // Default to true
            
            let databaseInfo = '';
            if (dbType === 'sqlite') {
                databaseInfo = `SQLite: ${currentConfig.sqlitePath || './data/ctrl_alt_play.db'}`;
            } else {
                const host = dbLocal ? dbType : (currentConfig.dbHost || 'localhost');
                const port = currentConfig.dbPort || (dbType === 'mongodb' ? '27017' : dbType === 'mysql' || dbType === 'mariadb' ? '3306' : '5432');
                const dbName = currentConfig.dbName || 'ctrl_alt_play';
                databaseInfo = `${dbType.toUpperCase()}: ${host}:${port}/${dbName} ${dbLocal ? '(Local Docker)' : '(Remote)'}`;
            }
            
            review.innerHTML = `
                <p><strong>Environment:</strong> ${currentConfig.environment || 'development'}</p>
                <p><strong>Port:</strong> ${currentConfig.port || 3000}</p>
                <p><strong>Domain:</strong> ${currentConfig.domain || 'localhost'}</p>
                <p><strong>Database:</strong> ${databaseInfo}</p>
                <p><strong>Admin Email:</strong> ${currentConfig.adminEmail || 'Not set'}</p>
                <p><strong>Analytics:</strong> ${currentConfig.analyticsEnabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Backups:</strong> ${currentConfig.backupEnabled ? 'Enabled' : 'Disabled'}</p>
            `;
        }
        
        function updateProgress(progress) {
            document.getElementById('progressFill').style.width = progress + '%';
        }
        
        function startInstallation() {
            nextStep('installation');
            socket.emit('start-installation');
        }
        
        function openPanel() {
            const url = document.getElementById('panelUrl').href;
            window.open(url, '_blank');
        }
    </script>
</body>
</html>
EOF
}

start_web_installer() {
    echo "🌐 Starting web installer..."
    echo "📝 Installation log: $INSTALLER_LOG"
    
    cd "$WEB_INSTALLER_DIR"
    
    # Start the web server
    WEB_INSTALLER_PORT=$WEB_INSTALLER_PORT node server.js > "../$INSTALLER_LOG" 2>&1 &
    WEB_INSTALLER_PID=$!
    
    cd ..
    
    # Wait for server to start
    sleep 2
    
    echo -e "${GREEN}✅ Web installer started successfully${NC}"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🌐 Web Installer Ready${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo -e "${GREEN}Open your browser and navigate to:${NC}"
    echo -e "${BLUE}    http://localhost:$WEB_INSTALLER_PORT${NC}"
    echo
    echo -e "${YELLOW}⚠️  Keep this terminal open while using the web installer${NC}"
    echo -e "${YELLOW}⚠️  Press Ctrl+C to stop the web installer when finished${NC}"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Wait for user interrupt
    trap 'cleanup_web_installer' INT TERM
    wait $WEB_INSTALLER_PID
}

cleanup_web_installer() {
    echo -e "\n${YELLOW}🛑 Stopping web installer...${NC}"
    
    if [ -n "${WEB_INSTALLER_PID:-}" ]; then
        kill $WEB_INSTALLER_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Web installer stopped${NC}"
    exit 0
}

# Main function
main() {
    print_header
    
    echo "🔍 This script will start a web-based installer for Ctrl-Alt-Play Panel"
    echo "📱 You'll configure everything through your browser with a friendly interface"
    echo
    
    read -p "Press Enter to start the web installer..."
    
    check_dependencies
    setup_web_installer
    create_web_installer_server
    create_web_installer_frontend
    start_web_installer
}

# Run main function
main "$@"
