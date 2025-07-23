import axios from 'axios';

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  players: number;
  timestamp: Date;
}

export interface PowerAction {
  signal: 'start' | 'stop' | 'restart' | 'kill';
}

export class AgentService {
  private getAgentUrl(nodeAddress: string): string {
    // In a real implementation, this would use the node's FQDN and daemon token
    return `http://${nodeAddress}:8080`;
  }

  /**
   * Get server metrics from agent
   */
  async getServerMetrics(nodeAddress: string, serverId: string): Promise<ServerMetrics> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/metrics`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer daemon_token_here', // Would use actual daemon token
          'Content-Type': 'application/json'
        }
      });

      return {
        cpu: response.data.cpu || 0,
        memory: response.data.memory || 0,
        disk: response.data.disk || 0,
        network: {
          in: response.data.network?.in || 0,
          out: response.data.network?.out || 0
        },
        players: response.data.players || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.warn(`Failed to get metrics from agent ${nodeAddress}:`, error);
      // Return default/mock metrics for development
      return {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: {
          in: Math.random() * 10,
          out: Math.random() * 10
        },
        players: Math.floor(Math.random() * 32),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send power action to server
   */
  async sendPowerAction(nodeAddress: string, serverId: string, action: PowerAction): Promise<boolean> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/power`;
      await axios.post(url, action, {
        timeout: 10000,
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to send power action to ${nodeAddress}:`, error);
      return false;
    }
  }

  /**
   * Get server console output
   */
  async getConsoleOutput(nodeAddress: string, serverId: string, lines: number = 100): Promise<string[]> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/console?lines=${lines}`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return response.data.lines || [];
    } catch (error) {
      console.error(`Failed to get console output from ${nodeAddress}:`, error);
      return ['Error: Could not connect to server'];
    }
  }

  /**
   * Send command to server console
   */
  async sendConsoleCommand(nodeAddress: string, serverId: string, command: string): Promise<boolean> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/console`;
      await axios.post(url, { command }, {
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to send console command to ${nodeAddress}:`, error);
      return false;
    }
  }

  /**
   * Install mod/workshop item on server
   */
  async installMod(nodeAddress: string, serverId: string, modData: any): Promise<boolean> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/mods`;
      await axios.post(url, modData, {
        timeout: 30000, // Longer timeout for installations
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to install mod on ${nodeAddress}:`, error);
      return false;
    }
  }

  /**
   * Update server files
   */
  async updateServer(nodeAddress: string, serverId: string): Promise<boolean> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/update`;
      await axios.post(url, {}, {
        timeout: 60000, // Very long timeout for updates
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to update server on ${nodeAddress}:`, error);
      return false;
    }
  }

  /**
   * Get server file system info
   */
  async getFileSystemInfo(nodeAddress: string, serverId: string, path: string = '/'): Promise<any> {
    try {
      const url = `${this.getAgentUrl(nodeAddress)}/api/servers/${serverId}/files?path=${encodeURIComponent(path)}`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer daemon_token_here',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to get file system info from ${nodeAddress}:`, error);
      return { files: [], directories: [] };
    }
  }
}
