#!/usr/bin/env node

/**
 * Health check script for Docker containers
 * Deployment-agnostic health verification
 */

const http = require('http');
const { execSync } = require('child_process');

// Get port from environment with fallback
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function healthCheck() {
  try {
    // Check if main application is responding
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://${HOST}:${PORT}/health`, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });

    if (response.status === 200) {
      console.log('✅ Health check passed - Application is healthy');
      
      // Additional checks for deployment readiness
      if (response.data && response.data.status === 'OK') {
        console.log(`✅ Application version: ${response.data.version || 'unknown'}`);
        console.log(`✅ Uptime: ${response.data.uptime || 'unknown'}`);
        
        // Check database connectivity if available
        if (response.data.database === true) {
          console.log('✅ Database connection healthy');
        } else if (response.data.database === false) {
          console.log('⚠️  Database connection issues detected');
        }
        
        // Check Redis connectivity if available
        if (response.data.redis === true) {
          console.log('✅ Redis connection healthy');
        } else if (response.data.redis === false) {
          console.log('⚠️  Redis connection issues detected');
        }
      }
      
      process.exit(0);
    } else {
      console.error(`❌ Health check failed - HTTP ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    
    // Try alternative health checks
    try {
      // Check if the process is at least running
      const processCheck = execSync(`ps aux | grep "node.*index" | grep -v grep`).toString();
      if (processCheck.trim()) {
        console.log('⚠️  Node process is running but not responding to health checks');
        process.exit(1);
      }
    } catch (processError) {
      console.error('❌ Node process appears to be dead');
    }
    
    process.exit(1);
  }
}

// Run health check
healthCheck();
