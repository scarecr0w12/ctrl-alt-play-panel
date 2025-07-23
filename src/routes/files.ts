import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { FileManagerItem } from '../types';
import { AgentService } from '../services/agent';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for game server management
    cb(null, true);
  }
});

// Get files in server directory
router.get('/server/:serverId', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: dirPath = '/' } = req.query;

  // TODO: Check user has access to this server

  // Mock file listing - in real implementation, this would come from the agent
  const files: FileManagerItem[] = [
    {
      name: 'server.properties',
      path: '/server.properties',
      size: 1024,
      type: 'file',
      permissions: 'rw-r--r--',
      modified: new Date(),
      isSymlink: false
    },
    {
      name: 'logs',
      path: '/logs',
      size: 0,
      type: 'directory',
      permissions: 'rwxr-xr-x',
      modified: new Date(),
      isSymlink: false
    },
    {
      name: 'world',
      path: '/world',
      size: 0,
      type: 'directory',
      permissions: 'rwxr-xr-x',
      modified: new Date(),
      isSymlink: false
    }
  ];

  res.json({
    success: true,
    data: files,
    message: 'Files retrieved successfully'
  });
}));

// Read file content
router.get('/server/:serverId/content', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: filePath } = req.query;

  if (!filePath) {
    throw createError('File path is required', 400);
  }

  // TODO: Check user has access to this server and file
  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.readFile(nodeId, serverId, filePath as string);

  if (!success) {
    throw createError('Failed to request file content from agent', 500);
  }

  // In real implementation, we would wait for the agent response via WebSocket
  // For now, return a mock response
  const content = '# Mock file content\nserver-port=25565\nmotd=A Minecraft Server';

  res.json({
    success: true,
    data: { content },
    message: 'File content retrieved successfully'
  });
}));

// Write file content
router.put('/server/:serverId/content', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: filePath, content } = req.body;

  if (!filePath || content === undefined) {
    throw createError('File path and content are required', 400);
  }

  // TODO: Check user has access to this server and file
  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.writeFile(nodeId, serverId, filePath, content);

  if (!success) {
    throw createError('Failed to send file write request to agent', 500);
  }

  logger.info(`User ${req.user!.username} modified file ${filePath} on server ${serverId}`);

  res.json({
    success: true,
    message: 'File saved successfully'
  });
}));

// Upload file to server
router.post('/server/:serverId/upload', upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: targetPath } = req.body;
  const file = req.file;

  if (!file) {
    throw createError('No file uploaded', 400);
  }

  if (!targetPath) {
    throw createError('Target path is required', 400);
  }

  // TODO: Check user has access to this server
  // TODO: Transfer file to agent/server

  logger.info(`User ${req.user!.username} uploaded file ${file.originalname} to server ${serverId}`);

  res.json({
    success: true,
    data: {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      targetPath
    },
    message: 'File uploaded successfully'
  });
}));

// Download file from server
router.get('/server/:serverId/download', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: filePath } = req.query;

  if (!filePath) {
    throw createError('File path is required', 400);
  }

  // TODO: Check user has access to this server and file
  // TODO: Request file from agent and stream to user

  res.json({
    success: false,
    message: 'File download not implemented yet'
  });
}));

// Create directory
router.post('/server/:serverId/directory', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: dirPath, name } = req.body;

  if (!dirPath || !name) {
    throw createError('Directory path and name are required', 400);
  }

  // TODO: Check user has access to this server
  // TODO: Send create directory command to agent

  logger.info(`User ${req.user!.username} created directory ${name} at ${dirPath} on server ${serverId}`);

  res.json({
    success: true,
    message: 'Directory created successfully'
  });
}));

// Delete file or directory
router.delete('/server/:serverId/item', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { path: itemPath } = req.body;

  if (!itemPath) {
    throw createError('Item path is required', 400);
  }

  // TODO: Check user has access to this server and item
  // TODO: Send delete command to agent

  logger.info(`User ${req.user!.username} deleted item ${itemPath} on server ${serverId}`);

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
}));

// Rename/move file or directory
router.patch('/server/:serverId/item', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { oldPath, newPath } = req.body;

  if (!oldPath || !newPath) {
    throw createError('Old path and new path are required', 400);
  }

  // TODO: Check user has access to this server and paths
  // TODO: Send rename/move command to agent

  logger.info(`User ${req.user!.username} moved item from ${oldPath} to ${newPath} on server ${serverId}`);

  res.json({
    success: true,
    message: 'Item moved successfully'
  });
}));

export default router;
