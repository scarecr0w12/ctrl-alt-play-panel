import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import altsRoutes from '../../src/routes/alts';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/alts', altsRoutes);

const prisma = new PrismaClient();

// Test user tokens
let adminToken: string;
let userToken: string;
let testUserId: string;
let testAdminId: string;
let testCtrlId: string;

describe('Alts API', () => {
  beforeAll(async () => {
    // Create test users
    const testAdmin = await prisma.user.create({
      data: {
        username: 'testadmin',
        email: 'admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        password: 'hashedpassword',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
      },
    });

    // Create test ctrl
    const testCtrl = await prisma.ctrl.create({
      data: {
        name: 'Test Category',
        description: 'Test category for alts',
      },
    });

    testAdminId = testAdmin.id;
    testUserId = testUser.id;
    testCtrlId = testCtrl.id;

    // Generate tokens
    adminToken = jwt.sign(
      { id: testAdmin.id, email: testAdmin.email, role: testAdmin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.altVariable.deleteMany({});
    await prisma.alt.deleteMany({});
    await prisma.ctrl.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: testUserId },
          { id: testAdminId }
        ]
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/alts', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.altVariable.deleteMany({});
      await prisma.alt.deleteMany({});
    });

    it('should return empty array when no alts exist', async () => {
      const response = await request(app)
        .get('/api/alts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return alts filtered by ctrlId', async () => {
      // Create test alt
      const alt = await prisma.alt.create({
        data: {
          name: 'Test Alt',
          author: 'Test Author',
          startup: 'java -jar server.jar',
          scriptEntry: './start.sh',
          scriptContainer: './entrypoint.sh',
          ctrlId: testCtrlId,
        },
      });

      const response = await request(app)
        .get(`/api/alts?ctrlId=${testCtrlId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        name: 'Test Alt',
        author: 'Test Author',
        startup: 'java -jar server.jar',
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/alts')
        .expect(401);
    });
  });

  describe('POST /api/alts', () => {
    beforeEach(async () => {
      await prisma.altVariable.deleteMany({});
      await prisma.alt.deleteMany({});
    });

    it('should create a new alt as admin', async () => {
      const altData = {
        name: 'New Alt',
        description: 'Test alt description',
        author: 'Test Author',
        startup: 'java -jar server.jar',
        scriptEntry: './start.sh',
        scriptContainer: './entrypoint.sh',
        ctrlId: testCtrlId,
        dockerImages: { java: 'openjdk:17-jre-slim' },
        configFiles: {},
        configStartup: {},
        configLogs: {},
      };

      const response = await request(app)
        .post('/api/alts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(altData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: altData.name,
        author: altData.author,
        startup: altData.startup,
      });
      expect(response.body.data.uuid).toBeDefined();
    });

    it('should reject creation by non-admin user', async () => {
      const altData = {
        name: 'New Alt',
        author: 'Test Author',
        startup: 'java -jar server.jar',
        scriptEntry: './start.sh',
        scriptContainer: './entrypoint.sh',
        ctrlId: testCtrlId,
      };

      await request(app)
        .post('/api/alts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(altData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/alts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/alts/import', () => {
    beforeEach(async () => {
      await prisma.altVariable.deleteMany({});
      await prisma.alt.deleteMany({});
    });

    it('should import pterodactyl egg as admin', async () => {
      const eggData = {
        name: 'Vanilla Minecraft',
        author: 'test@example.com',
        description: 'Minecraft Java Server',
        docker_images: {
          'Java 17': 'quay.io/pterodactyl/core:java-17'
        },
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
        config: {
          files: {},
          startup: {
            done: 'Done ('
          },
          logs: {},
          stop: 'stop'
        },
        scripts: {
          installation: {
            script: '#!/bin/bash\necho "Installation script"',
            container: 'debian:buster-slim',
            entrypoint: 'bash'
          }
        },
        variables: [
          {
            name: 'Server Memory',
            description: 'Amount of memory to allocate',
            env_variable: 'SERVER_MEMORY',
            default_value: '1024',
            user_viewable: true,
            user_editable: true,
            rules: 'required|numeric|min:512'
          }
        ]
      };

      const requestData = {
        ctrlId: testCtrlId,
        altData: eggData
      };

      const response = await request(app)
        .post('/api/alts/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Vanilla Minecraft',
        author: 'test@example.com',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
      });

      // Check that variables were imported
      const alt = await prisma.alt.findUnique({
        where: { id: response.body.data.id },
        include: { variables: true }
      });

      expect(alt?.variables).toHaveLength(1);
      expect(alt?.variables[0]).toMatchObject({
        name: 'Server Memory',
        envVariable: 'SERVER_MEMORY',
        defaultValue: '1024',
        userViewable: true,
        userEditable: true,
      });
    });

    it('should reject import by non-admin user', async () => {
      const requestData = {
        ctrlId: testCtrlId,
        altData: { name: 'Test', author: 'test' }
      };

      await request(app)
        .post('/api/alts/import')
        .set('Authorization', `Bearer ${userToken}`)
        .send(requestData)
        .expect(403);
    });
  });

  describe('GET /api/alts/:id/export', () => {
    let testAltId: string;

    beforeEach(async () => {
      await prisma.altVariable.deleteMany({});
      await prisma.alt.deleteMany({});

      // Create test alt with variables
      const alt = await prisma.alt.create({
        data: {
          name: 'Test Alt',
          author: 'test@example.com',
          startup: 'java -jar server.jar',
          scriptEntry: './start.sh',
          scriptContainer: './entrypoint.sh',
          ctrlId: testCtrlId,
          dockerImages: { java: 'openjdk:17' },
          configStartup: { done: 'Server started' },
        },
      });

      await prisma.altVariable.create({
        data: {
          name: 'Test Variable',
          description: 'Test variable description',
          envVariable: 'TEST_VAR',
          defaultValue: 'test_value',
          userViewable: true,
          userEditable: true,
          rules: 'required',
          altId: alt.id,
        },
      });

      testAltId = alt.id;
    });

    it('should export alt as pterodactyl egg format', async () => {
      const response = await request(app)
        .get(`/api/alts/${testAltId}/export`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Alt',
        author: 'test@example.com',
        startup: 'java -jar server.jar',
        docker_images: { java: 'openjdk:17' },
        config: {
          startup: { done: 'Server started' }
        },
        variables: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Variable',
            env_variable: 'TEST_VAR',
            default_value: 'test_value',
            user_viewable: true,
            user_editable: true,
          })
        ])
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/alts/${testAltId}/export`)
        .expect(401);
    });

    it('should return 404 for non-existent alt', async () => {
      await request(app)
        .get('/api/alts/non-existent-id/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
