#!/usr/bin/env node

/**
 * Enhanced Health Check Script for Ctrl-Alt-Play Panel
 * Provides detailed health information and debugging guidance
 */

const http = require('http');
const { execSync } = require('child_process');

// Get port from environment with fallback
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printTroubleshootingHelp() {
  log('\n🔧 Troubleshooting Steps:', 'blue');
  log('1. Check if all services are running:', 'blue');
  log('   docker-compose ps', 'blue');
  log('2. View application logs:', 'blue');
  log('   docker-compose logs ctrl-alt-play', 'blue');
  log('3. Check database connectivity:', 'blue');
  log('   docker-compose logs postgres', 'blue');
  log('4. Restart services if needed:', 'blue');
  log('   docker-compose restart', 'blue');
  log('5. Check port availability:', 'blue');
  log(`   lsof -i :${PORT}`, 'blue');
}

async function healthCheck() {
  log('🏥 Starting health check...', 'blue');
  
  try {
    // Check if main application is responding
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://${HOST}:${PORT}/health`, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Ctrl-Alt-Play-Health-Check/1.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, raw: true });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout (10s) - service may be overloaded or stuck'));
      });
    });

    if (response.status === 200) {
      log('✅ Health check passed - Application is healthy', 'green');
      
      // Parse response data for additional information
      if (response.data && !response.raw) {
        const data = response.data;
        
        if (data.status === 'OK') {
          log(`✅ Service status: ${data.status}`, 'green');
        }
        
        if (data.version) {
          log(`✅ Application version: ${data.version}`, 'green');
        }
        
        if (data.uptime !== undefined) {
          const uptimeMinutes = Math.floor(data.uptime / 60);
          log(`✅ Uptime: ${uptimeMinutes} minutes`, 'green');
        }
        
        if (data.timestamp) {
          log(`✅ Last response: ${data.timestamp}`, 'green');
        }
        
        // Check feature availability
        if (data.features && Array.isArray(data.features)) {
          log(`✅ Features enabled: ${data.features.join(', ')}`, 'green');
        }
        
        // Check database connectivity
        if (data.database === true) {
          log('✅ Database connection healthy', 'green');
        } else if (data.database === false) {
          log('⚠️  Database connection issues detected', 'yellow');
        }
        
        // Check Redis connectivity
        if (data.redis === true) {
          log('✅ Redis connection healthy', 'green');
        } else if (data.redis === false) {
          log('⚠️  Redis connection issues detected', 'yellow');
        }
        
        // Memory usage check
        if (data.memory) {
          const memUsage = Math.round((data.memory.used / data.memory.total) * 100);
          if (memUsage < 80) {
            log(`✅ Memory usage: ${memUsage}%`, 'green');
          } else {
            log(`⚠️  High memory usage: ${memUsage}%`, 'yellow');
          }
        }
      }
      
      log('🎉 All systems operational!', 'green');
      process.exit(0);
      
    } else {
      log(`❌ Health check failed - HTTP ${response.status}`, 'red');
      
      if (response.data) {
        log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
      }
      
      printTroubleshootingHelp();
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    
    // Additional diagnostic information
    if (error.message.includes('ECONNREFUSED')) {
      log(`❌ Connection refused on port ${PORT}`, 'red');
      log('This usually means the application is not running or not listening on the expected port.', 'yellow');
    } else if (error.message.includes('timeout')) {
      log('❌ Health check timed out', 'red');
      log('The application may be running but unresponsive (high load, deadlock, etc.)', 'yellow');
    } else if (error.message.includes('EHOSTUNREACH')) {
      log('❌ Host unreachable', 'red');
      log('Network connectivity issues or wrong host configuration.', 'yellow');
    }
    
    // Try alternative health checks
    try {
      log('\n🔍 Performing additional diagnostics...', 'blue');
      
      // Check if Node.js process is running
      const processCheck = execSync(`ps aux | grep "node.*index\\|node.*dist" | grep -v grep`, { encoding: 'utf8' });
      if (processCheck.trim()) {
        log('⚠️  Node.js process is running but not responding to health checks', 'yellow');
        log('Process details:', 'blue');
        log(processCheck.trim(), 'blue');
      } else {
        log('❌ No Node.js process found', 'red');
      }
      
      // Check port usage
      try {
        const portCheck = execSync(`lsof -i :${PORT}`, { encoding: 'utf8' });
        log(`\n🔍 Port ${PORT} usage:`, 'blue');
        log(portCheck.trim(), 'blue');
      } catch (portError) {
        log(`❌ Nothing listening on port ${PORT}`, 'red');
      }
      
    } catch (diagnosticError) {
      log(`⚠️  Diagnostic commands failed: ${diagnosticError.message}`, 'yellow');
    }
    
    printTroubleshootingHelp();
    process.exit(1);
  }
}

// Show startup message
log('🎮 Ctrl-Alt-Play Panel Health Check v1.1', 'blue');
log(`📍 Checking: http://${HOST}:${PORT}/health`, 'blue');

// Run health check
healthCheck();
