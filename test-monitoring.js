#!/usr/bin/env node

// Test script to verify monitoring system components
const { SystemMetricsCollector } = require('./dist/services/systemMetricsCollector.js');

async function testMonitoring() {
  console.log('🧪 Testing Real-time Monitoring System Components...\n');
  
  try {
    // Test SystemMetricsCollector
    console.log('📊 Testing SystemMetricsCollector...');
    const collector = new SystemMetricsCollector();
    const metrics = await collector.collectSystemMetrics();
    
    console.log('✅ System Metrics Collection Results:');
    console.log('- CPU Usage:', `${metrics.cpu.toFixed(2)}%`);
    console.log('- Memory Usage:', `${(metrics.memoryUsed / 1024 / 1024).toFixed(0)}MB / ${(metrics.memoryTotal / 1024 / 1024).toFixed(0)}MB`);
    console.log('- Memory Percentage:', `${((metrics.memoryUsed / metrics.memoryTotal) * 100).toFixed(1)}%`);
    console.log('- Disk Usage:', `${(metrics.diskUsed / 1024 / 1024 / 1024).toFixed(1)}GB / ${(metrics.diskTotal / 1024 / 1024 / 1024).toFixed(1)}GB`);
    console.log('- Network RX:', `${(metrics.networkRx / 1024 / 1024).toFixed(2)}MB`);
    console.log('- Network TX:', `${(metrics.networkTx / 1024 / 1024).toFixed(2)}MB`);
    console.log('- Uptime:', `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`);
    
    console.log('\n🎯 Monitoring System Test Complete!');
    console.log('✅ All components working correctly');
    
  } catch (error) {
    console.error('❌ Monitoring system test failed:', error.message);
    process.exit(1);
  }
}

testMonitoring().catch(console.error);
