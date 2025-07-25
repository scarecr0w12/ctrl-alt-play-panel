#!/usr/bin/env node

/**
 * Mock Agent Server for Testing External Agent Integration
 * 
 * This simulates the Go agent's health endpoint and WebSocket communication
 * to demonstrate the panel's external agent discovery and integration.
 */

const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 8081;

// Health endpoint that matches what our panel expects
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0-mock',
        nodeId: 'test-node-1',
        uptime: '1h 30m',
        connected: true
    });
});

// Root endpoint redirects to health
app.get('/', (req, res) => {
    res.redirect('/health');
});

// Start HTTP server
app.listen(port, () => {
    console.log(`🤖 Mock Agent running on http://localhost:${port}`);
    console.log(`🏥 Health endpoint: http://localhost:${port}/health`);
    console.log(`📊 This simulates the Go agent's health check server`);
    console.log(`🔍 The panel should discover this agent automatically`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Mock agent shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Mock agent shutting down...');
    process.exit(0);
});
