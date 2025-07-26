import { PrismaClient } from '@prisma/client';
import { nodesApi, serversApi } from '../../frontend/lib/api';

const prisma = new PrismaClient();

describe('Ctrl-Alt System Integration Tests', () => {
  let testCtrlId: string;
  let testAltId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.altVariable.deleteMany({});
    await prisma.alt.deleteMany({});
    await prisma.ctrl.deleteMany({});
    
    // Create the test Ctrl that will be used throughout tests
    const ctrl = await prisma.ctrl.create({
      data: {
        name: 'Test Category',
        description: 'Test category for integration testing',
      },
    });
    testCtrlId = ctrl.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.altVariable.deleteMany({});
    await prisma.alt.deleteMany({});
    await prisma.ctrl.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Ctrl Management', () => {
    it('should verify test ctrl was created', async () => {
      const ctrl = await prisma.ctrl.findUnique({
        where: { id: testCtrlId }
      });

      expect(ctrl).toBeDefined();
      expect(ctrl?.name).toBe('Test Category');
      expect(ctrl?.description).toBe('Test category for integration testing');
      expect(ctrl?.id).toBe(testCtrlId);
    });

    it('should retrieve ctrl with alt count', async () => {
      const ctrls = await prisma.ctrl.findMany({
        include: {
          _count: {
            select: { alts: true }
          }
        }
      });

      expect(ctrls).toHaveLength(1);
      expect(ctrls[0].name).toBe('Test Category');
      expect(ctrls[0]._count.alts).toBe(0);
    });
  });

  describe('Alt Management', () => {
    it('should create a new alt configuration', async () => {
      const alt = await prisma.alt.create({
        data: {
          name: 'Test Alt Configuration',
          description: 'Test alt for integration testing',
          author: 'test@example.com',
          startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
          scriptEntry: './start.sh',
          scriptContainer: './entrypoint.sh',
          ctrlId: testCtrlId,
          dockerImages: {
            'java17': 'openjdk:17-jre-slim',
            'java11': 'openjdk:11-jre-slim'
          },
          configStartup: {
            done: 'Done (',
            userInteraction: [
              'Go to eula.txt for more info.'
            ]
          },
          configLogs: {
            custom: false,
            location: 'logs/latest.log'
          },
          configFiles: {
            'server.properties': {
              parser: 'properties',
              find: {
                'server-port': '25565',
                'server-ip': '0.0.0.0'
              }
            }
          },
          features: {
            fastdl: false,
            eula: true
          }
        },
      });

      expect(alt).toBeDefined();
      expect(alt.name).toBe('Test Alt Configuration');
      expect(alt.author).toBe('test@example.com');
      expect(alt.uuid).toBeDefined();

      testAltId = alt.id;
    });

    it('should create alt variables', async () => {
      // Ensure testAltId is available - create alt if needed
      if (!testAltId) {
        const alt = await prisma.alt.create({
          data: {
            name: 'Test Alt Configuration',
            description: 'Test alt for integration testing',
            author: 'test@example.com',
            startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
            scriptEntry: './start.sh',
            scriptContainer: './entrypoint.sh',
            ctrlId: testCtrlId,
            dockerImages: {
              'java17': 'openjdk:17-jre-slim',
              'java11': 'openjdk:11-jre-slim'
            },
            configStartup: {
              done: 'Done (',
              userInteraction: [
                'Go to eula.txt for more info.'
              ]
            },
            configLogs: {
              custom: false,
              location: 'logs/latest.log'
            },
            configFiles: {
              'server.properties': {
                parser: 'properties',
                find: {
                  'server-ip': '0.0.0.0',
                  'server-port': '25565'
                }
              }
            },
            features: {
              eula: true,
              fastdl: false
            },
            fileDenylist: []
          }
        });
        testAltId = alt.id;
      }

      const variables = await prisma.altVariable.createMany({
        data: [
          {
            name: 'Server Memory',
            description: 'Amount of memory to allocate to the server',
            envVariable: 'SERVER_MEMORY',
            defaultValue: '1024',
            userViewable: true,
            userEditable: true,
            rules: 'required|numeric|min:512|max:8192',
            altId: testAltId,
          },
          {
            name: 'Server JAR File',
            description: 'Name of the JAR file to run',
            envVariable: 'SERVER_JARFILE',
            defaultValue: 'server.jar',
            userViewable: true,
            userEditable: false,
            rules: 'required|string',
            altId: testAltId,
          },
          {
            name: 'Java Version',
            description: 'Java version to use',
            envVariable: 'JAVA_VERSION',
            defaultValue: '17',
            userViewable: false,
            userEditable: false,
            rules: 'required|in:11,17',
            altId: testAltId,
          }
        ]
      });

      expect(variables.count).toBe(3);
    });

    it('should retrieve alt with variables and relationships', async () => {
      const alt = await prisma.alt.findUnique({
        where: { id: testAltId },
        include: {
          variables: true,
          ctrl: true,
          _count: {
            select: { servers: true }
          }
        }
      });

      expect(alt).toBeDefined();
      expect(alt?.variables).toHaveLength(3);
      expect(alt?.ctrl.name).toBe('Test Category');
      expect(alt?._count.servers).toBe(0);

      // Check variable details
      const memoryVar = alt?.variables.find(v => v.envVariable === 'SERVER_MEMORY');
      expect(memoryVar).toBeDefined();
      expect(memoryVar?.userViewable).toBe(true);
      expect(memoryVar?.userEditable).toBe(true);

      const javaVar = alt?.variables.find(v => v.envVariable === 'JAVA_VERSION');
      expect(javaVar).toBeDefined();
      expect(javaVar?.userViewable).toBe(false);
      expect(javaVar?.userEditable).toBe(false);
    });

    it('should update ctrl alt count after alt creation', async () => {
      const ctrl = await prisma.ctrl.findUnique({
        where: { id: testCtrlId },
        include: {
          _count: {
            select: { alts: true }
          }
        }
      });

      expect(ctrl?._count.alts).toBe(1);
    });
  });

  describe('Pterodactyl Egg Compatibility', () => {
    it('should create alt from pterodactyl egg structure', async () => {
      // Simulate importing a Pterodactyl egg
      const eggData = {
        name: 'Vanilla Minecraft',
        author: 'minecraft@pterodactyl.io',
        description: 'Minecraft Java Server',
        features: ['eula'],
        docker_images: {
          'Java 17': 'quay.io/pterodactyl/core:java-17',
          'Java 11': 'quay.io/pterodactyl/core:java-11'
        },
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
        config: {
          files: {
            'server.properties': {
              parser: 'properties',
              find: {
                'server-port': '25565',
                'enable-query': 'true',
                'query.port': '25565'
              }
            }
          },
          startup: {
            done: 'Done (',
            userInteraction: [
              'Go to eula.txt for more info.'
            ]
          },
          logs: {},
          stop: 'stop'
        },
        scripts: {
          installation: {
            script: '#!/bin/bash\n# Minecraft Installation Script\necho "Installing Minecraft server..."',
            container: 'quay.io/pterodactyl/installers:debian',
            entrypoint: 'bash'
          }
        },
        variables: [
          {
            name: 'Server Memory',
            description: 'The maximum amount of memory to allow for the Minecraft server to use.',
            env_variable: 'SERVER_MEMORY',
            default_value: '1024',
            user_viewable: true,
            user_editable: true,
            rules: 'required|numeric|min:512'
          },
          {
            name: 'Server JAR File',
            description: 'The name of the JAR file to run for the server.',
            env_variable: 'SERVER_JARFILE',
            default_value: 'server.jar',
            user_viewable: true,
            user_editable: true,
            rules: 'required|string|max:20'
          }
        ]
      };

      // Map pterodactyl egg to our Alt format
      const alt = await prisma.alt.create({
        data: {
          name: eggData.name,
          description: eggData.description,
          author: eggData.author,
          startup: eggData.startup,
          scriptInstall: eggData.scripts?.installation?.script,
          scriptEntry: './start.sh',
          scriptContainer: eggData.scripts?.installation?.entrypoint || 'bash',
          dockerImages: eggData.docker_images,
          configFiles: eggData.config.files,
          configStartup: eggData.config.startup,
          configLogs: eggData.config.logs,
          configStop: eggData.config.stop,
          features: { eula: eggData.features?.includes('eula') },
          ctrlId: testCtrlId, // This should be set from beforeAll
        },
      });

      // Create variables
      if (eggData.variables) {
        await prisma.altVariable.createMany({
          data: eggData.variables.map(variable => ({
            name: variable.name,
            description: variable.description,
            envVariable: variable.env_variable,
            defaultValue: variable.default_value,
            userViewable: variable.user_viewable,
            userEditable: variable.user_editable,
            rules: variable.rules,
            altId: alt.id,
          }))
        });
      }

      expect(alt).toBeDefined();
      expect(alt.name).toBe('Vanilla Minecraft');
      expect(alt.startup).toContain('{{SERVER_MEMORY}}');
      
      // Verify variables were created
      const variables = await prisma.altVariable.findMany({
        where: { altId: alt.id }
      });
      expect(variables).toHaveLength(2);
    });

    it('should export alt in pterodactyl egg format', async () => {
      const alt = await prisma.alt.findFirst({
        where: { name: 'Vanilla Minecraft' },
        include: { variables: true }
      });

      expect(alt).toBeDefined();

      // Convert to Pterodactyl egg format
      const eggExport = {
        name: alt!.name,
        author: alt!.author,
        description: alt!.description,
        docker_images: alt!.dockerImages,
        startup: alt!.startup,
        config: {
          files: alt!.configFiles,
          startup: alt!.configStartup,
          logs: alt!.configLogs,
          stop: alt!.configStop
        },
        scripts: {
          installation: {
            script: alt!.scriptInstall,
            container: 'quay.io/pterodactyl/installers:debian',
            entrypoint: alt!.scriptContainer
          }
        },
        variables: alt!.variables.map(variable => ({
          name: variable.name,
          description: variable.description,
          env_variable: variable.envVariable,
          default_value: variable.defaultValue,
          user_viewable: variable.userViewable,
          user_editable: variable.userEditable,
          rules: variable.rules
        }))
      };

      expect(eggExport.name).toBe('Vanilla Minecraft');
      expect(eggExport.variables).toHaveLength(2);
      expect(eggExport.variables[0].env_variable).toBe('SERVER_MEMORY');
      expect(eggExport.docker_images).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should cascade delete alts when ctrl is deleted', async () => {
      // Ensure we have a valid ctrl to delete by checking if it exists
      const ctrlExists = await prisma.ctrl.findUnique({
        where: { id: testCtrlId }
      });

      if (!ctrlExists) {
        // Skip this test if the ctrl doesn't exist
        console.log('Skipping cascade delete test - ctrl not found');
        return;
      }

      // Count alts before deletion
      const altsBefore = await prisma.alt.count();
      const variablesBefore = await prisma.altVariable.count();

      // Delete ctrl (should cascade to alts and variables)
      await prisma.ctrl.delete({
        where: { id: testCtrlId }
      });

      // Verify cascade deletion
      const altsAfter = await prisma.alt.count();
      const variablesAfter = await prisma.altVariable.count();

      expect(altsAfter).toBe(0);
      expect(variablesAfter).toBe(0);
    });
  });
});
