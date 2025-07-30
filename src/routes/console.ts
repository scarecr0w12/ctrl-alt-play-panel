import { Router, Request, Response } from 'express';
import { ExternalAgentService } from '../services/externalAgentService';
import { ServerAgentMappingService } from '../services/serverAgentMappingService';
import { SocketService } from '../services/socket';
import { logger } from '../utils/logger';
import DatabaseService from '../services/database';

const router = Router();

// Get service instances
let agentService: ExternalAgentService | undefined;
try {
  agentService = ExternalAgentService.getInstance();
} catch (error) {
  // Handle case where ExternalAgentService is not available
  console.warn('ExternalAgentService not available in test environment');
}
const mappingService = ServerAgentMappingService.getInstance();

/**
 * Helper function to validate server and get agent UUID
 */
async function validateServerAndGetAgent(serverId: string): Promise<{ valid: boolean; nodeUuid?: string; error?: string }> {
  if (!serverId) {
    return { valid: false, error: 'Server ID is required' };
  }

  const validation = await mappingService.validateServerAgent(serverId);
  if (!validation.valid) {
    return validation;
  }

  // Check if agent is actually available
  if (!agentService || !agentService.isAgentAvailable(validation.nodeUuid!)) {
    return {
      valid: false,
      error: `Agent for server ${serverId} is not available`
    };
  }

  return validation;
}

/**
 * Get console status for a server
 * GET /api/console/status?serverId=123
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Getting console status for server ${serverId}`);

    // Check console connection status via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.getConsoleStatus(validation.nodeUuid!, serverId);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to get console status' });
      return;
    }

    res.json({
      serverId,
      connected: result.data?.connected || false,
      lastActivity: result.data?.lastActivity,
      bufferSize: result.data?.bufferSize || 0,
      success: true
    });
  } catch (error) {
    logger.error('Error getting console status:', error);
    res.status(500).json({ error: 'Failed to get console status' });
  }
});

/**
 * Connect to server console
 * POST /api/console/connect
 * Body: { serverId: "123" }
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.body;

    if (!serverId) {
      res.status(400).json({ error: 'Server ID is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Connecting to console for server ${serverId}`);

    // Connect to console via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.connectConsole(validation.nodeUuid!, serverId);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to connect to console' });
      return;
    }

    // Emit console connection event to WebSocket clients
    SocketService.emitToServer(serverId, 'console:connected', {
      serverId,
      message: 'Console connected successfully'
    });

    res.json({
      serverId,
      connected: true,
      message: 'Console connected successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error connecting to console:', error);
    res.status(500).json({ error: 'Failed to connect to console' });
  }
});

/**
 * Disconnect from server console
 * POST /api/console/disconnect
 * Body: { serverId: "123" }
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.body;

    if (!serverId) {
      res.status(400).json({ error: 'Server ID is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Disconnecting from console for server ${serverId}`);

    // Disconnect from console via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.disconnectConsole(validation.nodeUuid!, serverId);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to disconnect from console' });
      return;
    }

    // Emit console disconnection event to WebSocket clients
    SocketService.emitToServer(serverId, 'console:disconnected', {
      serverId,
      message: 'Console disconnected'
    });

    res.json({
      serverId,
      connected: false,
      message: 'Console disconnected successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error disconnecting from console:', error);
    res.status(500).json({ error: 'Failed to disconnect from console' });
  }
});

/**
 * Send command to server console
 * POST /api/console/command
 * Body: { serverId: "123", command: "list" }
 */
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { serverId, command } = req.body;

    if (!serverId || !command) {
      res.status(400).json({ error: 'Server ID and command are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Sending command to server ${serverId}: ${command}`);

    // Send command via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.sendConsoleCommand(validation.nodeUuid!, serverId, command);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to send command' });
      return;
    }

    // Emit command sent event to WebSocket clients
    SocketService.emitToServer(serverId, 'console:command:sent', {
      serverId,
      command,
      timestamp: new Date().toISOString()
    });

    res.json({
      serverId,
      command,
      sent: true,
      response: result.data?.response,
      success: true
    });
  } catch (error) {
    logger.error('Error sending console command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

/**
 * Get console history/logs
 * GET /api/console/history?serverId=123&lines=100
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const lines = parseInt(req.query.lines as string) || 100;

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Getting console history for server ${serverId} (${lines} lines)`);

    // Get console history via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.getConsoleHistory(validation.nodeUuid!, serverId, lines);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to get console history' });
      return;
    }

    res.json({
      serverId,
      history: result.data?.history || [],
      lines: result.data?.lines || 0,
      success: true
    });
  } catch (error) {
    logger.error('Error getting console history:', error);
    res.status(500).json({ error: 'Failed to get console history' });
  }
});

/**
 * Clear console buffer
 * POST /api/console/clear
 * Body: { serverId: "123" }
 */
router.post('/clear', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.body;

    if (!serverId) {
      res.status(400).json({ error: 'Server ID is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Clearing console buffer for server ${serverId}`);

    // Clear console buffer via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.clearConsoleBuffer(validation.nodeUuid!, serverId);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to clear console buffer' });
      return;
    }

    // Emit console cleared event to WebSocket clients
    SocketService.emitToServer(serverId, 'console:cleared', {
      serverId,
      message: 'Console buffer cleared',
      timestamp: new Date().toISOString()
    });

    res.json({
      serverId,
      cleared: true,
      message: 'Console buffer cleared successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error clearing console buffer:', error);
    res.status(500).json({ error: 'Failed to clear console buffer' });
  }
});

/**
 * Download console logs
 * GET /api/console/download?serverId=123&format=txt
 */
router.get('/download', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const format = (req.query.format as string) || 'txt';

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Downloading console logs for server ${serverId} (format: ${format})`);

    // Get console logs via agent
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const result = await agentService.downloadConsoleLogs(validation.nodeUuid!, serverId, format);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to download console logs' });
      return;
    }

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `server-${serverId}-console-${timestamp}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');

    // Send the log data
    if (result.data?.content) {
      res.send(result.data.content);
    } else {
      res.status(500).json({ error: 'No log data received from agent' });
    }
  } catch (error) {
    logger.error('Error downloading console logs:', error);
    res.status(500).json({ error: 'Failed to download console logs' });
  }
});

/**
 * Get console settings for a server
 * GET /api/console/settings?serverId=123
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Get console settings from database or return defaults
    const db = DatabaseService.getInstance();
    const settingId = `console_settings_${serverId}`;
    
    let settings = {
      bufferSize: 10000,
      autoScroll: true,
      showTimestamp: true,
      filterLevel: 'all',
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace'
    };

    try {
      const savedSetting = await db.setting.findUnique({
        where: { id: settingId }
      });

      if (savedSetting) {
        const parsedSettings = JSON.parse(savedSetting.value);
        settings = { ...settings, ...parsedSettings };
        logger.info(`Retrieved console settings from database for server ${serverId}`);
      }
    } catch (error) {
      logger.warn(`Failed to retrieve console settings for server ${serverId}, using defaults:`, error);
    }

    res.json({
      serverId,
      settings,
      success: true
    });
  } catch (error) {
    logger.error('Error getting console settings:', error);
    res.status(500).json({ error: 'Failed to get console settings' });
  }
});

/**
 * Update console settings for a server
 * POST /api/console/settings
 * Body: { serverId: "123", settings: {...} }
 */
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { serverId, settings } = req.body;

    if (!serverId || !settings) {
      res.status(400).json({ error: 'Server ID and settings are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Updating console settings for server ${serverId}`);

    // Save settings to database
    try {
      const db = DatabaseService.getInstance();
      const settingId = `console_settings_${serverId}`;
      
      await db.setting.upsert({
        where: { id: settingId },
        update: { value: JSON.stringify(settings) },
        create: { 
          id: settingId, 
          value: JSON.stringify(settings) 
        }
      });

      logger.info(`Console settings saved to database for server ${serverId}`);
    } catch (error) {
      logger.error(`Failed to save console settings for server ${serverId}:`, error);
      res.status(500).json({ error: 'Failed to save console settings' });
      return;
    }

    res.json({
      serverId,
      settings,
      updated: true,
      message: 'Console settings updated successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error updating console settings:', error);
    res.status(500).json({ error: 'Failed to update console settings' });
  }
});

/**
 * Health check endpoint for console system
 * GET /api/console/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    if (!agentService) {
      res.status(500).json({ error: 'External agent service not available' });
      return;
    }
    const agentStatuses = await agentService.healthCheckAll();
    const totalAgents = agentStatuses.size;
    const onlineAgents = Array.from(agentStatuses.values()).filter(status => status.online).length;

    res.json({
      status: 'operational',
      agents: {
        total: totalAgents,
        online: onlineAgents,
        offline: totalAgents - onlineAgents
      },
      console: {
        enabled: true,
        webSocketEnabled: true,
        agentBased: true,
        features: {
          realTimeOutput: true,
          commandExecution: true,
          consoleHistory: true,
          multipleConsoles: true,
          downloadLogs: true,
          settings: 'basic'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in console health check:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to perform health check',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;