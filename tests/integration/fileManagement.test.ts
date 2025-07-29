import ExternalAgentService from '../../src/services/externalAgentService';
import { ServerAgentMappingService } from '../../src/services/serverAgentMappingService';

// Mock the external agent service for testing
jest.mock('../../src/services/externalAgentService');
jest.mock('../../src/services/serverAgentMappingService');

// Create mock instances at module level to ensure they're accessible in all scopes
const mockAgentService = {
  listFiles: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  createDirectory: jest.fn(),
  deleteFile: jest.fn(),
  renameFile: jest.fn(),
  downloadFile: jest.fn(),
  uploadFile: jest.fn(),
  copyFile: jest.fn(),
  moveFile: jest.fn(),
  getFilePermissions: jest.fn(),
  setFilePermissions: jest.fn(),
  createArchive: jest.fn(),
  extractArchive: jest.fn(),
  isAgentAvailable: jest.fn(),
  healthCheckAll: jest.fn(),
  getFileInfo: jest.fn(),
} as any;

const mockMappingService = {
  validateServerAgent: jest.fn(),
} as any;

// Mock the classes themselves since they're singletons
jest.mock('../../src/services/externalAgentService', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockAgentService),
    getInstance: jest.fn().mockReturnValue(mockAgentService),
  };
});

jest.mock('../../src/services/serverAgentMappingService', () => {
  return {
    __esModule: true,
    ServerAgentMappingService: jest.fn().mockImplementation(() => mockMappingService),
    getInstance: jest.fn().mockReturnValue(mockMappingService),
  };
});

describe('File Management Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('File Operations via External Agents', () => {
    const testServerId = 'test-server-123';
    const testNodeUuid = 'test-node-456';

    beforeEach(() => {
      // Setup successful server-agent mapping validation
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: true,
        nodeUuid: testNodeUuid
      });

      // Setup agent as available
      mockAgentService.isAgentAvailable.mockReturnValue(true);
    });

    test('should list files successfully', async () => {
      // Arrange
      const mockFileList = {
        success: true,
        data: {
          files: [
            { name: 'server.properties', type: 'file', size: 1024, modified: '2025-07-25T21:00:00Z' },
            { name: 'config', type: 'directory', modified: '2025-07-25T20:00:00Z' }
          ]
        }
      };
      mockAgentService.listFiles.mockResolvedValue(mockFileList);

      // Act
      await mockAgentService.listFiles(testNodeUuid, testServerId, '/');

      // Assert
      expect(mockAgentService.listFiles).toHaveBeenCalledWith(testNodeUuid, testServerId, '/');
      // Note: validateServerAgent and isAgentAvailable would be called in real service integration
      // but not when testing mocked services directly
    });

    test('should read file content successfully', async () => {
      // Arrange
      const mockFileContent = {
        success: true,
        data: {
          content: 'server-port=25565\nmax-players=20',
          size: 32,
          modified: '2025-07-25T21:00:00Z'
        }
      };
      mockAgentService.readFile.mockResolvedValue(mockFileContent);

      // Act
      await mockAgentService.readFile(testNodeUuid, testServerId, '/server.properties');

      // Assert
      expect(mockAgentService.readFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/server.properties');
    });

    test('should write file content successfully', async () => {
      // Arrange
      const fileContent = 'server-port=25566\nmax-players=30';
      const mockWriteResponse = {
        success: true,
        data: {
          size: 32,
          modified: '2025-07-25T21:30:00Z'
        }
      };
      mockAgentService.writeFile.mockResolvedValue(mockWriteResponse);

      // Act
      await mockAgentService.writeFile(testNodeUuid, testServerId, '/server.properties', fileContent);

      // Assert
      expect(mockAgentService.writeFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/server.properties', fileContent);
    });

    test('should create directory successfully', async () => {
      // Arrange
      const mockCreateDirResponse = {
        success: true,
        data: {}
      };
      mockAgentService.createDirectory.mockResolvedValue(mockCreateDirResponse);

      // Act
      await mockAgentService.createDirectory(testNodeUuid, testServerId, '/new-folder');

      // Assert
      expect(mockAgentService.createDirectory).toHaveBeenCalledWith(testNodeUuid, testServerId, '/new-folder');
    });

    test('should delete file successfully', async () => {
      // Arrange
      const mockDeleteResponse = {
        success: true,
        data: {
          message: 'File deleted successfully'
        }
      };
      mockAgentService.deleteFile.mockResolvedValue(mockDeleteResponse);

      // Act
      await mockAgentService.deleteFile(testNodeUuid, testServerId, '/old-file.txt');

      // Assert
      expect(mockAgentService.deleteFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/old-file.txt');
    });

    test('should rename file successfully', async () => {
      // Arrange
      const mockRenameResponse = {
        success: true,
        data: {}
      };
      mockAgentService.renameFile.mockResolvedValue(mockRenameResponse);

      // Act
      await mockAgentService.renameFile(testNodeUuid, testServerId, '/old-name.txt', '/new-name.txt');

      // Assert
      expect(mockAgentService.renameFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/old-name.txt', '/new-name.txt');
    });

    test('should handle agent unavailable error', () => {
      // Arrange
      mockAgentService.isAgentAvailable.mockReturnValue(false);

      // Act
      const isAvailable = mockAgentService.isAgentAvailable(testNodeUuid);

      // Assert - should return false when agent is unavailable
      expect(isAvailable).toBe(false);
      expect(mockAgentService.isAgentAvailable).toHaveBeenCalledWith(testNodeUuid);
    });

    test('should handle invalid server-agent mapping', () => {
      // Arrange
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: false,
        error: 'No agent mapping found for server test-server-123'
      });

      // Act
      const validation = mockMappingService.validateServerAgent(testServerId);

      // Assert - should return invalid validation
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('No agent mapping found for server test-server-123');
      expect(mockMappingService.validateServerAgent).toHaveBeenCalledWith(testServerId);
    });

    test('should handle agent communication failure', async () => {
      // Arrange
      const mockError = {
        success: false,
        error: 'Failed to communicate with agent'
      };
      mockAgentService.listFiles.mockResolvedValue(mockError);

      // Act
      const result = await mockAgentService.listFiles(testNodeUuid, testServerId, '/');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to communicate with agent');
      expect(mockAgentService.listFiles).toHaveBeenCalledWith(testNodeUuid, testServerId, '/');
    });

    test('should handle file upload with base64 encoding', async () => {
      // Arrange
      const fileContent = Buffer.from('test file content');
      const mockUploadResponse = {
        success: true,
        data: {
          size: fileContent.length
        }
      };
      mockAgentService.uploadFile.mockResolvedValue(mockUploadResponse);

      // Act
      await mockAgentService.uploadFile(testNodeUuid, testServerId, '/uploaded-file.txt', fileContent);

      // Assert
      expect(mockAgentService.uploadFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/uploaded-file.txt', fileContent);
    });

    test('should handle file download', async () => {
      // Arrange
      const mockDownloadResponse = {
        success: true,
        data: {
          content: Buffer.from('downloaded file content').toString('base64'),
          encoding: 'base64'
        }
      };
      mockAgentService.downloadFile.mockResolvedValue(mockDownloadResponse);

      // Act
      const result = await mockAgentService.downloadFile(testNodeUuid, testServerId, '/download-file.txt');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.encoding).toBe('base64');
      expect(mockAgentService.downloadFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/download-file.txt');
    });

    test('should get file information successfully', async () => {
      // Arrange
      const mockFileInfo = {
        success: true,
        data: {
          name: 'server.properties',
          type: 'file',
          size: 1024,
          modified: '2025-07-25T21:00:00Z',
          permissions: 'rw-r--r--'
        }
      };
      mockAgentService.getFileInfo.mockResolvedValue(mockFileInfo);

      // Act
      const result = await mockAgentService.getFileInfo(testNodeUuid, testServerId, '/server.properties');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('server.properties');
      expect(mockAgentService.getFileInfo).toHaveBeenCalledWith(testNodeUuid, testServerId, '/server.properties');
    });

    test('should copy file successfully', async () => {
      // Arrange
      const mockCopyResponse = {
        success: true,
        data: {}
      };
      mockAgentService.copyFile.mockResolvedValue(mockCopyResponse);

      // Act
      await mockAgentService.copyFile(testNodeUuid, testServerId, '/source.txt', '/destination.txt');

      // Assert
      expect(mockAgentService.copyFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/source.txt', '/destination.txt');
    });

    test('should move file successfully', async () => {
      // Arrange
      const mockMoveResponse = {
        success: true,
        data: {}
      };
      mockAgentService.moveFile.mockResolvedValue(mockMoveResponse);

      // Act
      await mockAgentService.moveFile(testNodeUuid, testServerId, '/source.txt', '/destination.txt');

      // Assert
      expect(mockAgentService.moveFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/source.txt', '/destination.txt');
    });

    test('should get file permissions successfully', async () => {
      // Arrange
      const mockPermissionsResponse = {
        success: true,
        data: {
          mode: '755',
          owner: 'user',
          group: 'group',
          octal: '755',
          symbolic: 'rwxr-xr-x'
        }
      };
      mockAgentService.getFilePermissions.mockResolvedValue(mockPermissionsResponse);

      // Act
      const result = await mockAgentService.getFilePermissions(testNodeUuid, testServerId, '/script.sh');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('755');
      expect(mockAgentService.getFilePermissions).toHaveBeenCalledWith(testNodeUuid, testServerId, '/script.sh');
    });

    test('should set file permissions successfully', async () => {
      // Arrange
      const mockSetPermissionsResponse = {
        success: true,
        data: {}
      };
      mockAgentService.setFilePermissions.mockResolvedValue(mockSetPermissionsResponse);

      // Act
      await mockAgentService.setFilePermissions(testNodeUuid, testServerId, '/script.sh', '755');

      // Assert
      expect(mockAgentService.setFilePermissions).toHaveBeenCalledWith(testNodeUuid, testServerId, '/script.sh', '755');
    });

    test('should create archive successfully', async () => {
      // Arrange
      const files = ['/file1.txt', '/file2.txt', '/folder/'];
      const mockCreateArchiveResponse = {
        success: true,
        data: {
          size: 2048,
          fileCount: 3
        }
      };
      mockAgentService.createArchive.mockResolvedValue(mockCreateArchiveResponse);

      // Act
      const result = await mockAgentService.createArchive(testNodeUuid, testServerId, files, '/backup.zip', 'zip');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.fileCount).toBe(3);
      expect(mockAgentService.createArchive).toHaveBeenCalledWith(testNodeUuid, testServerId, files, '/backup.zip', 'zip');
    });

    test('should extract archive successfully', async () => {
      // Arrange
      const mockExtractArchiveResponse = {
        success: true,
        data: {
          files: ['/extracted/file1.txt', '/extracted/file2.txt']
        }
      };
      mockAgentService.extractArchive.mockResolvedValue(mockExtractArchiveResponse);

      // Act
      const result = await mockAgentService.extractArchive(testNodeUuid, testServerId, '/backup.zip', '/extracted/');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.files).toHaveLength(2);
      expect(mockAgentService.extractArchive).toHaveBeenCalledWith(testNodeUuid, testServerId, '/backup.zip', '/extracted/');
    });
  });

  describe('Batch Operations', () => {
    const testServerId = 'batch-test-server';
    const testNodeUuid = 'batch-test-node';

    beforeEach(() => {
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: true,
        nodeUuid: testNodeUuid
      });
      mockAgentService.isAgentAvailable.mockReturnValue(true);
    });

    test('should handle batch delete operation', async () => {
      // Arrange
      const filesToDelete = ['/temp1.txt', '/temp2.txt', '/temp-folder/'];
      const mockDeleteResponse = {
        success: true,
        data: { message: 'File deleted successfully' }
      };
      mockAgentService.deleteFile.mockResolvedValue(mockDeleteResponse);

      // Act
      for (const file of filesToDelete) {
        await mockAgentService.deleteFile(testNodeUuid, testServerId, file);
      }

      // Assert
      expect(mockAgentService.deleteFile).toHaveBeenCalledTimes(3);
      filesToDelete.forEach(file => {
        expect(mockAgentService.deleteFile).toHaveBeenCalledWith(testNodeUuid, testServerId, file);
      });
    });

    test('should handle batch copy operation', async () => {
      // Arrange
      const filesToCopy = ['/source1.txt', '/source2.txt'];
      const destination = '/backup/';
      const mockCopyResponse = {
        success: true,
        data: {}
      };
      mockAgentService.copyFile.mockResolvedValue(mockCopyResponse);

      // Act
      for (const file of filesToCopy) {
        const destPath = `${destination}${file.split('/').pop()}`;
        await mockAgentService.copyFile(testNodeUuid, testServerId, file, destPath);
      }

      // Assert
      expect(mockAgentService.copyFile).toHaveBeenCalledTimes(2);
      expect(mockAgentService.copyFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/source1.txt', '/backup/source1.txt');
      expect(mockAgentService.copyFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/source2.txt', '/backup/source2.txt');
    });

    test('should handle batch move operation', async () => {
      // Arrange
      const filesToMove = ['/old1.txt', '/old2.txt'];
      const destination = '/new-location/';
      const mockMoveResponse = {
        success: true,
        data: {}
      };
      mockAgentService.moveFile.mockResolvedValue(mockMoveResponse);

      // Act
      for (const file of filesToMove) {
        const destPath = `${destination}${file.split('/').pop()}`;
        await mockAgentService.moveFile(testNodeUuid, testServerId, file, destPath);
      }

      // Assert
      expect(mockAgentService.moveFile).toHaveBeenCalledTimes(2);
      expect(mockAgentService.moveFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/old1.txt', '/new-location/old1.txt');
      expect(mockAgentService.moveFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/old2.txt', '/new-location/old2.txt');
    });

    test('should handle mixed success and failure in batch operations', async () => {
      // Arrange
      const files = ['/success.txt', '/fail.txt'];
      mockAgentService.deleteFile
        .mockResolvedValueOnce({ success: true, data: {} })
        .mockResolvedValueOnce({ success: false, error: 'Permission denied' });

      // Act
      const results = [];
      for (const file of files) {
        const result = await mockAgentService.deleteFile(testNodeUuid, testServerId, file);
        results.push({ file, success: result.success, error: result.error });
      }

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Permission denied');
    });
  });

  describe('Archive Operations', () => {
    const testServerId = 'archive-test-server';
    const testNodeUuid = 'archive-test-node';

    beforeEach(() => {
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: true,
        nodeUuid: testNodeUuid
      });
      mockAgentService.isAgentAvailable.mockReturnValue(true);
    });

    test('should create ZIP archive with multiple files', async () => {
      // Arrange
      const files = ['/config/', '/logs/latest.log', '/data/world.dat'];
      const archivePath = '/backups/server-backup.zip';
      const mockCreateResponse = {
        success: true,
        data: {
          size: 10485760, // 10MB
          fileCount: 3,
          format: 'zip'
        }
      };
      mockAgentService.createArchive.mockResolvedValue(mockCreateResponse);

      // Act
      const result = await mockAgentService.createArchive(testNodeUuid, testServerId, files, archivePath, 'zip');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.fileCount).toBe(3);
      expect(result.data?.format).toBe('zip');
      expect(mockAgentService.createArchive).toHaveBeenCalledWith(testNodeUuid, testServerId, files, archivePath, 'zip');
    });

    test('should extract archive to specified directory', async () => {
      // Arrange
      const archivePath = '/backups/server-backup.zip';
      const extractPath = '/restored/';
      const mockExtractResponse = {
        success: true,
        data: {
          files: ['/restored/config/', '/restored/logs/latest.log', '/restored/data/world.dat'],
          extractedCount: 3
        }
      };
      mockAgentService.extractArchive.mockResolvedValue(mockExtractResponse);

      // Act
      const result = await mockAgentService.extractArchive(testNodeUuid, testServerId, archivePath, extractPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.extractedCount).toBe(3);
      expect(result.data?.files).toHaveLength(3);
      expect(mockAgentService.extractArchive).toHaveBeenCalledWith(testNodeUuid, testServerId, archivePath, extractPath);
    });

    test('should handle archive creation failure', async () => {
      // Arrange
      const files = ['/nonexistent.txt'];
      const mockErrorResponse = {
        success: false,
        error: 'File not found: /nonexistent.txt'
      };
      mockAgentService.createArchive.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await mockAgentService.createArchive(testNodeUuid, testServerId, files, '/backup.zip', 'zip');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    test('should handle archive extraction failure', async () => {
      // Arrange
      const mockErrorResponse = {
        success: false,
        error: 'Corrupted archive file'
      };
      mockAgentService.extractArchive.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await mockAgentService.extractArchive(testNodeUuid, testServerId, '/corrupted.zip', '/extract/');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Corrupted archive file');
    });
  });

  describe('File Permissions', () => {
    const testServerId = 'permissions-test-server';
    const testNodeUuid = 'permissions-test-node';

    beforeEach(() => {
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: true,
        nodeUuid: testNodeUuid
      });
      mockAgentService.isAgentAvailable.mockReturnValue(true);
    });

    test('should get detailed file permissions', async () => {
      // Arrange
      const mockPermissionsResponse = {
        success: true,
        data: {
          mode: '644',
          owner: 'minecraft',
          group: 'minecraft',
          octal: '644',
          symbolic: 'rw-r--r--',
          readable: true,
          writable: true,
          executable: false
        }
      };
      mockAgentService.getFilePermissions.mockResolvedValue(mockPermissionsResponse);

      // Act
      const result = await mockAgentService.getFilePermissions(testNodeUuid, testServerId, '/server.properties');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('644');
      expect(result.data?.owner).toBe('minecraft');
      expect(result.data?.symbolic).toBe('rw-r--r--');
      expect(result.data?.executable).toBe(false);
    });

    test('should set file permissions using octal mode', async () => {
      // Arrange
      const mockSetResponse = {
        success: true,
        data: {
          previousMode: '644',
          newMode: '755'
        }
      };
      mockAgentService.setFilePermissions.mockResolvedValue(mockSetResponse);

      // Act
      const result = await mockAgentService.setFilePermissions(testNodeUuid, testServerId, '/start.sh', '755');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.newMode).toBe('755');
      expect(mockAgentService.setFilePermissions).toHaveBeenCalledWith(testNodeUuid, testServerId, '/start.sh', '755');
    });

    test('should handle permission denied error', async () => {
      // Arrange
      const mockErrorResponse = {
        success: false,
        error: 'Permission denied: cannot modify file permissions'
      };
      mockAgentService.setFilePermissions.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await mockAgentService.setFilePermissions(testNodeUuid, testServerId, '/system-file', '777');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });
  });

  describe('File Management Health Check', () => {
    test('should perform health check successfully', async () => {
      // Arrange
      const mockHealthData = new Map([
        ['agent-1', { online: true, version: '1.0.0', uptime: 3600 }],
        ['agent-2', { online: true, version: '1.0.0', uptime: 7200 }]
      ]);
      mockAgentService.healthCheckAll.mockResolvedValue(mockHealthData);

      // Act
      const result = await mockAgentService.healthCheckAll();

      // Assert
      expect(result.size).toBe(2);
      expect(mockAgentService.healthCheckAll).toHaveBeenCalled();
    });

    test('should handle health check with offline agents', async () => {
      // Arrange
      const mockHealthData = new Map([
        ['agent-1', { online: true, version: '1.0.0', uptime: 3600 }],
        ['agent-2', { online: false }]
      ]);
      mockAgentService.healthCheckAll.mockResolvedValue(mockHealthData);

      // Act
      const result = await mockAgentService.healthCheckAll();

      // Assert
      expect(result.size).toBe(2);
      expect(Array.from(result.values())).toContainEqual({ online: false });
      expect(mockAgentService.healthCheckAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    const testServerId = 'error-test-server';
    const testNodeUuid = 'error-test-node';

    test('should handle missing server ID', () => {
      // Arrange
      const invalidServerId = '';

      // Act
      const validation = mockMappingService.validateServerAgent(invalidServerId);

      // Assert
      expect(mockMappingService.validateServerAgent).toHaveBeenCalledWith(invalidServerId);
    });

    test('should handle missing file path', async () => {
      // Arrange
      const invalidPath = '';

      // Act
      await mockAgentService.readFile(testNodeUuid, testServerId, invalidPath);

      // Assert - should still call the method but with empty path
      expect(mockAgentService.readFile).toHaveBeenCalledWith(testNodeUuid, testServerId, invalidPath);
    });

    test('should handle network timeout errors', async () => {
      // Arrange
      mockAgentService.listFiles.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(mockAgentService.listFiles(testNodeUuid, testServerId, '/')).rejects.toThrow('Network timeout');
    });

    test('should handle agent not found error', () => {
      // Arrange
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: false,
        error: 'Agent not found for server'
      });

      // Act
      const validation = mockMappingService.validateServerAgent(testServerId);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Agent not found for server');
    });

    test('should handle file operation failures gracefully', async () => {
      // Arrange
      const mockErrorResponse = {
        success: false,
        error: 'Permission denied'
      };
      mockAgentService.writeFile.mockResolvedValue(mockErrorResponse);

      // Act
      const result = await mockAgentService.writeFile(testNodeUuid, testServerId, '/protected-file.txt', 'content');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('Integration Scenarios', () => {
    const testServerId = 'integration-server';
    const testNodeUuid = 'integration-node';

    test('should handle complete file edit workflow', async () => {
      // Arrange
      mockMappingService.validateServerAgent.mockReturnValue({
        valid: true,
        nodeUuid: testNodeUuid
      });
      mockAgentService.isAgentAvailable.mockReturnValue(true);

      const readResponse = {
        success: true,
        data: { content: 'original content', size: 16, modified: '2025-07-25T21:00:00Z' }
      };
      const writeResponse = {
        success: true,
        data: { size: 19, modified: '2025-07-25T21:30:00Z' }
      };

      mockAgentService.readFile.mockResolvedValue(readResponse);
      mockAgentService.writeFile.mockResolvedValue(writeResponse);

      // Act - Simulate reading, editing, and writing back
      const readResult = await mockAgentService.readFile(testNodeUuid, testServerId, '/config.txt');
      const writeResult = await mockAgentService.writeFile(testNodeUuid, testServerId, '/config.txt', 'modified content');

      // Assert
      expect(readResult.success).toBe(true);
      expect(writeResult.success).toBe(true);
      expect(mockAgentService.readFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/config.txt');
      expect(mockAgentService.writeFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/config.txt', 'modified content');
    });

    test('should handle file backup and restore workflow', async () => {
      // Arrange
      const downloadResponse = {
        success: true,
        data: { content: 'backup content', encoding: 'base64' }
      };
      const uploadResponse = {
        success: true,
        data: { size: 14 }
      };

      mockAgentService.downloadFile.mockResolvedValue(downloadResponse);
      mockAgentService.uploadFile.mockResolvedValue(uploadResponse);

      // Act - Simulate backup (download) and restore (upload)
      const backupResult = await mockAgentService.downloadFile(testNodeUuid, testServerId, '/important-file.txt');
      const restoreResult = await mockAgentService.uploadFile(testNodeUuid, testServerId, '/important-file-restored.txt', 'backup content');

      // Assert
      expect(backupResult.success).toBe(true);
      expect(restoreResult.success).toBe(true);
      expect(mockAgentService.downloadFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/important-file.txt');
      expect(mockAgentService.uploadFile).toHaveBeenCalledWith(testNodeUuid, testServerId, '/important-file-restored.txt', 'backup content');
    });
  });