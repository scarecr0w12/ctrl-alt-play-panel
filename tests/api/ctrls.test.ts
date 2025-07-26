import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import ctrlsRoutes from '../../src/routes/ctrls';
import { authenticateToken } from '../../src/middlewares/auth';

// Create test app
const app = express();
app.use(express.json());
app.use(authenticateToken); // Add auth middleware
app.use('/api/ctrls', ctrlsRoutes);

const prisma = new PrismaClient();

// Test user tokens
let adminToken: string;
let userToken: string;
let testUserId: string;
let testAdminId: string;

describe('Ctrls API', () => {
  beforeAll(async () => {
    // Create test users with unique identifiers
    const testAdmin = await prisma.user.create({
      data: {
        username: 'testadmin-ctrls',
        email: 'admin-ctrls@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        password: 'hashedpassword',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const testUser = await prisma.user.create({
      data: {
        username: 'testuser-ctrls',
        email: 'user-ctrls@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
      },
    });

    testAdminId = testAdmin.id;
    testUserId = testUser.id;

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

  describe('GET /api/ctrls', () => {
    beforeEach(async () => {
      // Clean up before each test
      await prisma.alt.deleteMany({});
      await prisma.ctrl.deleteMany({});
    });

    it('should return empty array when no ctrls exist', async () => {
      const response = await request(app)
        .get('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all ctrls with alt counts', async () => {
      // Create test ctrl with alts
      const ctrl = await prisma.ctrl.create({
        data: {
          name: 'Test Category',
          description: 'Test description',
        },
      });

      await prisma.alt.create({
        data: {
          name: 'Test Alt',
          author: 'Test Author',
          startup: 'test startup',
          scriptEntry: './start.sh',
          scriptContainer: './entrypoint.sh',
          ctrlId: ctrl.id,
        },
      });

      const response = await request(app)
        .get('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        name: 'Test Category',
        description: 'Test description',
        _count: { alts: 1 },
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/ctrls')
        .expect(401);
    });
  });

  describe('POST /api/ctrls', () => {
    beforeEach(async () => {
      await prisma.alt.deleteMany({});
      await prisma.ctrl.deleteMany({});
    });

    it('should create a new ctrl as admin', async () => {
      const ctrlData = {
        name: 'New Category',
        description: 'New category description',
      };

      const response = await request(app)
        .post('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ctrlData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(ctrlData);
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject creation by non-admin user', async () => {
      const ctrlData = {
        name: 'New Category',
        description: 'New category description',
      };

      await request(app)
        .post('/api/ctrls')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ctrlData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should handle duplicate names', async () => {
      const ctrlData = {
        name: 'Duplicate Category',
        description: 'First category',
      };

      // Create first ctrl
      await request(app)
        .post('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ctrlData)
        .expect(201);

      // Try to create duplicate
      await request(app)
        .post('/api/ctrls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ctrlData)
        .expect(409);
    });
  });

  describe.skip('PUT /api/ctrls/:id', () => {
    let testCtrlId: string;

    beforeEach(async () => {
      await prisma.alt.deleteMany({});
      await prisma.ctrl.deleteMany({});

      const ctrl = await prisma.ctrl.create({
        data: {
          name: 'Test Category',
          description: 'Test description',
        },
      });
      testCtrlId = ctrl.id;
    });

    it('should update ctrl as admin', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/ctrls/${testCtrlId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
    });

    it('should reject update by non-admin user', async () => {
      const updateData = {
        name: 'Updated Category',
      };

      await request(app)
        .put(`/api/ctrls/${testCtrlId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent ctrl', async () => {
      await request(app)
        .put('/api/ctrls/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/ctrls/:id', () => {
    let testCtrlId: string;

    beforeEach(async () => {
      await prisma.alt.deleteMany({});
      await prisma.ctrl.deleteMany({});

      const ctrl = await prisma.ctrl.create({
        data: {
          name: 'Test Category',
          description: 'Test description',
        },
      });
      testCtrlId = ctrl.id;
    });

    it('should delete ctrl as admin', async () => {
      const response = await request(app)
        .delete(`/api/ctrls/${testCtrlId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const ctrl = await prisma.ctrl.findUnique({
        where: { id: testCtrlId },
      });
      expect(ctrl).toBeNull();
    });

    it('should reject deletion by non-admin user', async () => {
      await request(app)
        .delete(`/api/ctrls/${testCtrlId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent deletion of ctrl with alts', async () => {
      // Add an alt to the ctrl
      await prisma.alt.create({
        data: {
          name: 'Test Alt',
          author: 'Test Author',
          startup: 'test startup',
          scriptEntry: './start.sh',
          scriptContainer: './entrypoint.sh',
          ctrlId: testCtrlId,
        },
      });

      await request(app)
        .delete(`/api/ctrls/${testCtrlId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent ctrl', async () => {
      await request(app)
        .delete('/api/ctrls/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
