import WebSocket from 'ws';
import express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

interface Message {
  id?: string;
  type: string;
  data?: any;
  messageId?: string;
  timestamp: Date | string;
  action?: string;
  serverId?: string;
  payload?: any;
}

interface SystemInfoData {
  nodeId: string;
  os: string;
  arch: string;
  memory: number;
  cpu: string;
  dockerVersion?: string;
  capabilities: string[];
  networks: Record<string, string>;
}

class TestAgent {
  private ws: WebSocket | null = null;
  private nodeId: string;
  private panelUrl: string;
  private agentSecret: string;
  private healthPort: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.nodeId = process.env.NODE_ID || 'test-node-1';
    this.panelUrl = process.env.PANEL_URL || 'ws://localhost:8080';
    this.agentSecret = process.env.AGENT_SECRET || 'agent-secret';
    this.healthPort = parseInt(process.env.HEALTH_PORT || '8081');

    this.setupHealthCheck();
    this.connect();
  }

  private setupHealthCheck() {
    const app = express();
    
    app.get('/health', (req, res) => {
      const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN;
      res.json({
        status: isConnected ? 'healthy' : 'disconnected',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    app.listen(this.healthPort, () => {
      console.log(`✅ Agent health check server running on port ${this.healthPort}`);
    });
  }

  private connect() {
    console.log(`🔄 Connecting to panel at ${this.panelUrl}...`);
    
    try {
      this.ws = new WebSocket(this.panelUrl, {
        headers: {
          'Authorization': `Bearer ${this.agentSecret}`,
          'X-Node-Id': this.nodeId
        }
      });

      this.ws.on('open', () => {
        console.log(`✅ Connected to panel as node: ${this.nodeId}`);
        this.startHeartbeat();
        this.sendSystemInfo();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.log(`❌ Connection closed. Code: ${code}, Reason: ${reason}`);
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

    } catch (error) {
      console.error('❌ Connection error:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    console.log('🔄 Scheduling reconnect in 5 seconds...');
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: 'heartbeat',
        data: {
          nodeId: this.nodeId,
          timestamp: new Date(),
          status: 'online'
        },
        timestamp: new Date()
      });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendSystemInfo() {
    const systemInfo: SystemInfoData = {
      nodeId: this.nodeId,
      os: process.platform,
      arch: process.arch,
      memory: Math.round(require('os').totalmem() / 1024 / 1024), // MB
      cpu: require('os').cpus()[0].model,
      dockerVersion: '24.0.0', // Mock version
      capabilities: ['docker', 'file_management', 'console_access'],
      networks: {
        eth0: '192.168.1.100',
        docker0: '172.17.0.1'
      }
    };

    this.sendMessage({
      type: 'system_info',
      data: systemInfo,
      timestamp: new Date()
    });
  }

  private handleMessage(message: Message) {
    console.log(`📥 Received message: ${message.type}`);
    
    // Handle new Panel→Agent command format
    if (message.type === 'command' && message.action) {
      this.handlePanelCommand(message);
      return;
    }
    
    // Legacy message handling for backwards compatibility
    switch (message.type) {
      case 'system_info_request':
        this.sendSystemInfo();
        break;

      case 'server_create':
        this.handleServerCreate(message.data);
        break;

      case 'server_start':
        this.handleServerStart(message.data);
        break;

      case 'server_stop':
        this.handleServerStop(message.data);
        break;

      case 'server_restart':
        this.handleServerRestart(message.data);
        break;

      case 'server_delete':
        this.handleServerDelete(message.data);
        break;

      case 'server_command':
        this.handleServerCommand(message.data);
        break;

      case 'file_read':
        this.handleFileRead(message.data);
        break;

      case 'file_write':
        this.handleFileWrite(message.data);
        break;

      default:
        console.log(`⚠️  Unknown message type: ${message.type}`);
    }
  }

  private handlePanelCommand(message: Message) {
    console.log(`🎮 Panel command: ${message.action} for server: ${message.serverId}`);
    
    // Send immediate acknowledgment
    this.sendResponse(message.id!, {
      success: true,
      message: `${message.action} command received`,
      data: {
        serverId: message.serverId,
        status: this.getActionStatus(message.action!)
      }
    });

    // Handle the actual command
    switch (message.action) {
      case 'start_server':
        this.handleServerStart({ serverId: message.serverId });
        break;

      case 'stop_server':
        this.handleServerStop({ 
          serverId: message.serverId, 
          ...message.payload 
        });
        break;

      case 'restart_server':
        this.handleServerRestart({ serverId: message.serverId });
        break;

      case 'get_status':
        this.handleGetServerStatus(message.serverId!);
        break;

      default:
        this.sendResponse(message.id!, {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${message.action}`
          }
        });
    }
  }

  private getActionStatus(action: string): string {
    switch (action) {
      case 'start_server':
        return 'starting';
      case 'stop_server':
        return 'stopping';
      case 'restart_server':
        return 'restarting';
      default:
        return 'processing';
    }
  }

  private sendResponse(messageId: string, response: any) {
    this.sendMessage({
      id: messageId,
      type: 'response',
      timestamp: new Date(),
      ...response
    });
  }

  private handleServerCreate(data: any) {
    console.log(`🎮 Creating server: ${data.serverId}`);
    
    // Simulate server creation
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'created',
          message: 'Server created successfully'
        },
        timestamp: new Date()
      });
    }, 2000);
  }

  private handleServerStart(data: any) {
    console.log(`▶️  Starting server: ${data.serverId}`);
    
    // Simulate server startup
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'running',
          stats: {
            cpu: 25.5,
            memory: 512 * 1024 * 1024, // 512MB
            disk: 1024 * 1024 * 1024, // 1GB
            network: { in: 1024, out: 2048 },
            players: 2,
            timestamp: new Date()
          }
        },
        timestamp: new Date()
      });
    }, 3000);
  }

  private handleServerStop(data: any) {
    console.log(`⏹️  Stopping server: ${data.serverId}`);
    
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'stopped'
        },
        timestamp: new Date()
      });
    }, 2000);
  }

  private handleServerRestart(data: any) {
    console.log(`🔄 Restarting server: ${data.serverId}`);
    
    // Simulate restart process
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'restarting'
        },
        timestamp: new Date()
      });
    }, 1000);

    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'running',
          stats: {
            cpu: 30.2,
            memory: 600 * 1024 * 1024,
            disk: 1200 * 1024 * 1024,
            network: { in: 2048, out: 4096 },
            players: 1,
            timestamp: new Date()
          }
        },
        timestamp: new Date()
      });
    }, 5000);
  }

  private handleServerDelete(data: any) {
    console.log(`🗑️  Deleting server: ${data.serverId}`);
    
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: data.serverId,
          status: 'deleted'
        },
        timestamp: new Date()
      });
    }, 2000);
  }

  private handleServerCommand(data: any) {
    console.log(`💻 Executing command on ${data.serverId}: ${data.command}`);
    
    // Simulate command execution
    setTimeout(() => {
      this.sendMessage({
        type: 'server_output',
        data: {
          serverId: data.serverId,
          output: `Command executed: ${data.command}\nResult: Success\n`,
          timestamp: new Date()
        },
        timestamp: new Date()
      });
    }, 1000);
  }

  private handleFileRead(data: any) {
    console.log(`📖 Reading file: ${data.path}`);
    
    setTimeout(() => {
      this.sendMessage({
        type: 'file_content',
        data: {
          path: data.path,
          content: `# Mock file content for ${data.path}\n# This is a test file\necho "Hello from test agent"\n`,
          timestamp: new Date()
        },
        timestamp: new Date()
      });
    }, 500);
  }

  private handleFileWrite(data: any) {
    console.log(`📝 Writing file: ${data.path}`);
    
    setTimeout(() => {
      this.sendMessage({
        type: 'file_content',
        data: {
          path: data.path,
          success: true,
          message: 'File written successfully',
          timestamp: new Date()
        },
        timestamp: new Date()
      });
    }, 500);
  }

  private handleGetServerStatus(serverId: string) {
    console.log(`📊 Getting status for server: ${serverId}`);
    
    // Simulate server status retrieval
    setTimeout(() => {
      this.sendMessage({
        type: 'server_status',
        data: {
          serverId: serverId,
          status: 'running',
          containerId: `container_${serverId}`,
          uptime: Math.floor(Math.random() * 3600),
          resources: {
            cpu: Math.random() * 80 + 10,
            memory: {
              used: `${Math.floor(Math.random() * 1024 + 512)}m`,
              available: '2048m'
            },
            network: {
              tx: Math.floor(Math.random() * 1000000),
              rx: Math.floor(Math.random() * 2000000)
            }
          },
          players: {
            online: Math.floor(Math.random() * 10),
            max: 20,
            list: ['TestPlayer1', 'TestPlayer2']
          }
        },
        timestamp: new Date()
      });
    }, 500);
  }

  private sendMessage(message: Message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ Cannot send message: WebSocket not connected');
    }
  }
}

// Start the test agent
console.log('🚀 Starting Ctrl-Alt-Play Test Agent...');
new TestAgent();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test agent...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down test agent...');
  process.exit(0);
});
