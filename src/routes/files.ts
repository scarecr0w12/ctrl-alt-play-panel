import { Router, Request, Response } from 'express';
import { ExternalAgentService } from '../services/externalAgentService';
import { ServerAgentMappingService } from '../services/serverAgentMappingService';
import { logger } from '../utils/logger';

const router = Router();

// Get service instances
const agentService = ExternalAgentService.getInstance();
const mappingService = ServerAgentMappingService.getInstance();

/**
 * Helper function to validate server and get agent UUID
 */
async function validateServerAndGetAgent(serverId: string): Promise<{ valid: boolean; nodeUuid?: string; error?: string }> {
  if (!serverId) {
    return { valid: false, error: 'Server ID is required' };
  }

  const validation = mappingService.validateServerAgent(serverId);
  if (!validation.valid) {
    return validation;
  }

  // Check if agent is actually available
  if (!agentService.isAgentAvailable(validation.nodeUuid!)) {
    return {
      valid: false,
      error: `Agent for server ${serverId} is not available`
    };
  }

  return validation;
}

/**
 * List files in a server directory via external agent
 * GET /api/files/list?serverId=123&path=/config
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const userPath = (req.query.path as string) || '/';

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Listing files for server ${serverId} at path ${userPath}`);

    const result = await agentService.listFiles(validation.nodeUuid!, serverId, userPath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to list files' });
      return;
    }

    res.json({
      serverId,
      path: userPath,
      files: result.data?.files || [],
      success: true
    });
  } catch (error) {
    logger.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * Read file content via external agent
 * GET /api/files/read?serverId=123&path=/server.properties
 */
router.get('/read', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Reading file for server ${serverId}: ${filePath}`);

    const result = await agentService.readFile(validation.nodeUuid!, serverId, filePath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to read file' });
      return;
    }

    res.json({
      serverId,
      path: filePath,
      content: result.data?.content || '',
      size: result.data?.size,
      modified: result.data?.modified,
      success: true
    });
  } catch (error) {
    logger.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

/**
 * Write file content via external agent
 * POST /api/files/write
 * Body: { serverId: "123", path: "/server.properties", content: "..." }
 */
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { serverId, path: filePath, content } = req.body;

    if (!serverId || !filePath || content === undefined) {
      res.status(400).json({ error: 'Server ID, path, and content are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Writing file for server ${serverId}: ${filePath}`);

    const result = await agentService.writeFile(validation.nodeUuid!, serverId, filePath, content);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to write file' });
      return;
    }

    res.json({
      serverId,
      path: filePath,
      size: result.data?.size,
      modified: result.data?.modified,
      message: 'File saved successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

/**
 * Create directory via external agent
 * POST /api/files/mkdir
 * Body: { serverId: "123", path: "/new-folder" }
 */
router.post('/mkdir', async (req: Request, res: Response) => {
  try {
    const { serverId, path: dirPath } = req.body;

    if (!serverId || !dirPath) {
      res.status(400).json({ error: 'Server ID and path are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Creating directory for server ${serverId}: ${dirPath}`);

    const result = await agentService.createDirectory(validation.nodeUuid!, serverId, dirPath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to create directory' });
      return;
    }

    res.json({
      serverId,
      path: dirPath,
      message: 'Directory created successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error creating directory:', error);
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

/**
 * Delete file or directory via external agent
 * DELETE /api/files/delete?serverId=123&path=/file-to-delete
 */
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Deleting file for server ${serverId}: ${filePath}`);

    const result = await agentService.deleteFile(validation.nodeUuid!, serverId, filePath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to delete file' });
      return;
    }

    res.json({
      serverId,
      path: filePath,
      message: result.data?.message || 'File deleted successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * Rename/move file or directory via external agent
 * POST /api/files/rename
 * Body: { serverId: "123", oldPath: "/old-name", newPath: "/new-name" }
 */
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { serverId, oldPath, newPath } = req.body;

    if (!serverId || !oldPath || !newPath) {
      res.status(400).json({ error: 'Server ID, oldPath, and newPath are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Renaming file for server ${serverId}: ${oldPath} -> ${newPath}`);

    const result = await agentService.renameFile(validation.nodeUuid!, serverId, oldPath, newPath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to rename file' });
      return;
    }

    res.json({
      serverId,
      oldPath,
      newPath,
      message: 'File renamed successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

/**
 * Download file via external agent
 * GET /api/files/download?serverId=123&path=/file-to-download
 */
router.get('/download', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Downloading file for server ${serverId}: ${filePath}`);

    const result = await agentService.downloadFile(validation.nodeUuid!, serverId, filePath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to download file' });
      return;
    }

    // Extract filename from path
    const filename = filePath.split('/').pop() || 'download';
    
    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // If the agent returns file data, stream it
    if (result.data?.content) {
      // Handle base64 encoded files
      if (result.data.encoding === 'base64') {
        const buffer = Buffer.from(result.data.content, 'base64');
        res.send(buffer);
      } else {
        res.send(result.data.content);
      }
    } else {
      res.status(500).json({ error: 'No file data received from agent' });
    }
  } catch (error) {
    logger.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * Upload file via external agent
 * POST /api/files/upload
 * Body: FormData or { serverId: "123", path: "/uploaded-file", content: "...", encoding?: "base64" }
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { serverId, path: filePath, content, encoding } = req.body;

    if (!serverId || !filePath || !content) {
      res.status(400).json({ error: 'Server ID, path, and content are required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Uploading file for server ${serverId}: ${filePath}`);

    // Handle different content types
    let fileData: string | Buffer = content;
    if (encoding === 'base64' && typeof content === 'string') {
      fileData = Buffer.from(content, 'base64');
    }

    const result = await agentService.uploadFile(validation.nodeUuid!, serverId, filePath, fileData);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to upload file' });
      return;
    }

    res.json({
      serverId,
      path: filePath,
      size: result.data?.size,
      message: 'File uploaded successfully',
      success: true
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * Get file information via external agent
 * GET /api/files/info?serverId=123&path=/file-info
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const serverId = req.query.serverId as string;
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'File path is required' });
      return;
    }

    const validation = await validateServerAndGetAgent(serverId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    logger.info(`Getting file info for server ${serverId}: ${filePath}`);

    const result = await agentService.getFileInfo(validation.nodeUuid!, serverId, filePath);
    
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to get file info' });
      return;
    }

    res.json({
      serverId,
      path: filePath,
      info: result.data,
      success: true
    });
  } catch (error) {
    logger.error('Error getting file info:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

/**
 * Health check endpoint for file management system
 * GET /api/files/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
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
      fileManagement: {
        enabled: true,
        distributed: true,
        agentBased: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in file management health check:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to perform health check',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
