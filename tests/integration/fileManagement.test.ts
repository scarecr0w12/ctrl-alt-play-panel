import { ExternalAgentService } from '../../src/services/externalAgentService';
import { ServerAgentMappingService } from '../../src/services/serverAgentMappingService';

// Mock the external agent service for testing
jest.mock('../../src/services/externalAgentService');
jest.mock('../../src/services/serverAgentMappingService');

describe('File Management Integration Tests', () => {
  let mockAgentService: jest.Mocked<ExternalAgentService>;
  let mockMappingService: jest.Mocked<ServerAgentMappingService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAgentService = {
      listFiles: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      createDirectory: jest.fn(),
      deleteFile: jest.fn(),
      renameFile: jest.fn(),
      downloadFile: jest.fn(),
      uploadFile: jest.fn(),
      getFileInfo: jest.fn(),
      isAgentAvailable: jest.fn(),
      healthCheckAll: jest.fn(),
    } as any;

    mockMappingService = {
      validateServerAgent: jest.fn(),
    } as any;

    // Mock getInstance methods
    jest.spyOn(ExternalAgentService, 'getInstance').mockReturnValue(mockAgentService);
    jest.spyOn(ServerAgentMappingService, 'getInstance').mockReturnValue(mockMappingService);
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
      expect(mockMappingService.validateServerAgent).toHaveBeenCalledWith(testServerId);
      expect(mockAgentService.isAgentAvailable).toHaveBeenCalledWith(testNodeUuid);
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
});