import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Base directory for file operations (in real implementation, this would be configurable)
const BASE_DIR = process.env.SERVER_FILES_DIR || '/tmp/server-files';

// Ensure base directory exists
async function ensureBaseDir() {
  try {
    await fs.access(BASE_DIR);
  } catch {
    await fs.mkdir(BASE_DIR, { recursive: true });
    
    // Create some mock directories and files for demonstration
    await createMockStructure();
  }
}

// Create mock file structure for demonstration
async function createMockStructure() {
  const mockStructure = {
    'server.properties': `# Minecraft server properties
server-port=25565
gamemode=survival
difficulty=normal
max-players=20
motd=A Minecraft Server
online-mode=true
white-list=false
enable-command-block=false
spawn-protection=16
max-world-size=29999984`,
    
    'config/bukkit.yml': `settings:
  allow-end: true
  warn-on-overload: true
  permissions-file: permissions.yml
  update-folder: update
  plugin-profiling: false
  connection-throttle: 4000
  query-plugins: true
  deprecated-verbose: default
  shutdown-message: Server closed`,
    
    'config/spigot.yml': `config-version: 12
settings:
  debug: false
  save-user-cache-on-stop-only: false
  sample-count: 12
  bungeecord: false
  player-shuffle: 0
  user-cache-size: 1000
  moved-wrongly-threshold: 0.0625
  moved-too-quickly-multiplier: 10.0
  log-villager-deaths: true
  log-named-deaths: true`,
    
    'banned-players.json': '[]',
    'whitelist.json': '[]',
    'ops.json': '[]',
    
    'logs/latest.log': `[12:00:00] [ServerMain/INFO]: Environment: authHost='https://authserver.mojang.com', accountsHost='https://api.mojang.com', sessionHost='https://sessionserver.mojang.com', servicesHost='https://api.minecraftservices.com', name='PROD'
[12:00:00] [ServerMain/INFO]: Loaded 7 recipes
[12:00:00] [Server thread/INFO]: Starting minecraft server version 1.20.4
[12:00:00] [Server thread/INFO]: Loading properties
[12:00:00] [Server thread/INFO]: Default game type: SURVIVAL
[12:00:00] [Server thread/INFO]: Generating keypair
[12:00:00] [Server thread/INFO]: Starting Minecraft server on *:25565
[12:00:00] [Server thread/INFO]: Using epoll channel type
[12:00:00] [Server thread/INFO]: Preparing level "world"
[12:00:00] [Server thread/INFO]: Done (2.345s)! For help, type "help"`
  };
  
  for (const [filePath, content] of Object.entries(mockStructure)) {
    const fullPath = path.join(BASE_DIR, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
  }
}

// Get file type and icon
function getFileInfo(filename: string, stats: any) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const isDirectory = stats.isDirectory();
  
  return {
    type: isDirectory ? 'directory' : 'file',
    extension: isDirectory ? null : ext,
    size: isDirectory ? null : stats.size,
    modified: stats.mtime.toISOString().slice(0, 19).replace('T', ' ')
  };
}

// Validate and sanitize path
function sanitizePath(userPath: string): string {
  // Remove any path traversal attempts
  const normalized = path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '');
  return normalized.startsWith('/') ? normalized : '/' + normalized;
}

// Get absolute path within base directory
function getAbsolutePath(userPath: string): string {
  const sanitized = sanitizePath(userPath);
  return path.join(BASE_DIR, sanitized);
}

// List files in directory
router.get('/list', async (req: Request, res: Response) => {
  try {
    const userPath = (req.query.path as string) || '/';
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const items = await fs.readdir(absolutePath);
    const files = [];
    
    for (const item of items) {
      try {
        const itemPath = path.join(absolutePath, item);
        const stats = await fs.stat(itemPath);
        const fileInfo = getFileInfo(item, stats);
        
        files.push({
          name: item,
          ...fileInfo
        });
      } catch (error) {
        console.error(`Error reading ${item}:`, error);
      }
    }
    
    // Sort directories first, then files
    files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      path: userPath,
      files
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Read file content
router.get('/read', async (req: Request, res: Response) => {
  try {
    const userPath = req.query.path as string;
    if (!userPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }
    
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      res.status(400).json({ error: 'Cannot read directory as file' });
      return;
    }
    
    // Check file size (limit to 10MB for text files)
    if (stats.size > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'File too large to read' });
      return;
    }
    
    const content = await fs.readFile(absolutePath, 'utf8');
    
    res.json({
      path: userPath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Write file content
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { path: userPath, content } = req.body;
    
    if (!userPath || content === undefined) {
      res.status(400).json({ error: 'Path and content are required' });
      return;
    }
    
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(absolutePath, content, 'utf8');
    
    const stats = await fs.stat(absolutePath);
    
    res.json({
      path: userPath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      message: 'File saved successfully'
    });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

// Create directory
router.post('/mkdir', async (req: Request, res: Response) => {
  try {
    const { path: userPath } = req.body;
    
    if (!userPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }
    
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    await fs.mkdir(absolutePath, { recursive: true });
    
    res.json({
      path: userPath,
      message: 'Directory created successfully'
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

// Delete file or directory
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const userPath = req.query.path as string;
    
    if (!userPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }
    
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Don't allow deleting the base directory
    if (absolutePath === BASE_DIR) {
      res.status(403).json({ error: 'Cannot delete base directory' });
      return;
    }
    
    const stats = await fs.stat(absolutePath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(absolutePath, { recursive: true });
    } else {
      await fs.unlink(absolutePath);
    }
    
    res.json({
      path: userPath,
      message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Rename/move file or directory
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      res.status(400).json({ error: 'Both oldPath and newPath are required' });
      return;
    }
    
    const absoluteOldPath = getAbsolutePath(oldPath);
    const absoluteNewPath = getAbsolutePath(newPath);
    
    // Ensure both paths are within the base directory
    if (!absoluteOldPath.startsWith(BASE_DIR) || !absoluteNewPath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Ensure new path directory exists
    const newDir = path.dirname(absoluteNewPath);
    await fs.mkdir(newDir, { recursive: true });
    
    await fs.rename(absoluteOldPath, absoluteNewPath);
    
    res.json({
      oldPath,
      newPath,
      message: 'Renamed successfully'
    });
  } catch (error) {
    console.error('Error renaming:', error);
    res.status(500).json({ error: 'Failed to rename' });
  }
});

// Download file
router.get('/download', async (req: Request, res: Response) => {
  try {
    const userPath = req.query.path as string;
    
    if (!userPath) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }
    
    const absolutePath = getAbsolutePath(userPath);
    
    // Ensure we're still within the base directory
    if (!absolutePath.startsWith(BASE_DIR)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      res.status(400).json({ error: 'Cannot download directory' });
      return;
    }
    
    const filename = path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    const fileStream = require('fs').createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Initialize base directory on module load
ensureBaseDir().catch(console.error);

export default router;
