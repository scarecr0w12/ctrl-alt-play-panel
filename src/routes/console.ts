import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  authenticateToken, 
  requireAnyPermission,
  requireResourceOwnership 
} from '../middlewares/permissions';
import { ExternalAgentService } from '../services/externalAgentService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get console logs for a server
 * GET /api/console/:serverId/logs
 */
router.get('/:serverId/logs', authenticateToken, requireAnyPermission(['servers.view', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { lines = 100 } = req.query;

    // Get server details
    const server = await prisma.server.findFirst({
      where: { id: serverId },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get logs from external agent
    const externalAgentService = ExternalAgentService.getInstance();
    const result = await externalAgentService.getServerLogs(
      server.node.uuid, 
      server.uuid, 
      parseInt(lines as string)
    );

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to get server logs',
        details: result.error 
      });
    }

    return res.json({
      success: true,
      data: {
        serverId: server.id,
        serverUuid: server.uuid,
        serverName: server.name,
        logs: result.data?.logs || [],
        lines: parseInt(lines as string)
      }
    });

  } catch (error) {
    logger.error('Failed to get console logs:', error);
    return res.status(500).json({ error: 'Failed to get console logs' });
  }
});

/**
 * Send command to server console
 * POST /api/console/:serverId/command
 */
router.post('/:serverId/command', authenticateToken, requireAnyPermission(['servers.console', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Get server details
    const server = await prisma.server.findFirst({
      where: { id: serverId },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Send command to external agent
    const externalAgentService = ExternalAgentService.getInstance();
    const result = await externalAgentService.sendServerCommand(
      server.node.uuid, 
      server.uuid, 
      command
    );

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to send command',
        details: result.error 
      });
    }

    // Log the command execution
    logger.info(`Command executed on server ${server.name}`, {
      serverId: server.id,
      serverUuid: server.uuid,
      command,
      userId: (req as any).user.id
    });

    return res.json({
      success: true,
      message: 'Command sent successfully',
      data: {
        serverId: server.id,
        command,
        result: result.data
      }
    });

  } catch (error) {
    logger.error('Failed to send console command:', error);
    return res.status(500).json({ error: 'Failed to send console command' });
  }
});

/**
 * Get server console status
 * GET /api/console/:serverId/status
 */
router.get('/:serverId/status', authenticateToken, requireAnyPermission(['servers.view', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { serverId } = req.params;

    // Get server details
    const server = await prisma.server.findFirst({
      where: { id: serverId },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get server status from external agent
    const externalAgentService = ExternalAgentService.getInstance();
    const agentAvailable = externalAgentService.isAgentAvailable(server.node.uuid);
    
    let serverStatus = null;
    if (agentAvailable) {
      const statusResult = await externalAgentService.getServerStatus(server.node.uuid, server.uuid);
      if (statusResult.success) {
        serverStatus = statusResult.data;
      }
    }

    return res.json({
      success: true,
      data: {
        serverId: server.id,
        serverUuid: server.uuid,
        serverName: server.name,
        nodeOnline: agentAvailable,
        serverStatus: serverStatus,
        consoleAvailable: agentAvailable && server.status !== 'INSTALL_FAILED'
      }
    });

  } catch (error) {
    logger.error('Failed to get console status:', error);
    return res.status(500).json({ error: 'Failed to get console status' });
  }
});

/**
 * Get console history (stored locally)
 * GET /api/console/:serverId/history
 */
router.get('/:serverId/history', authenticateToken, requireAnyPermission(['servers.view', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Get server details
    const server = await prisma.server.findFirst({
      where: { id: serverId }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // For now, return empty history as we don't have a console history table yet
    // In a full implementation, you would query a console_history table here
    return res.json({
      success: true,
      data: {
        serverId: server.id,
        history: [],
        total: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    logger.error('Failed to get console history:', error);
    return res.status(500).json({ error: 'Failed to get console history' });
  }
});

export default router;