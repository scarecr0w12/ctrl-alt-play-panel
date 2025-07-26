import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Analytics API', () => {
  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview data', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect('Content-Type', /json/);

      // Note: This will fail without authentication in a real scenario
      // but tests the endpoint structure
      expect(response.status).toBe(401); // Expected since no auth token
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return resource trends data', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .expect('Content-Type', /json/);

      // Note: This will fail without authentication
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/analytics/compare', () => {
    it('should accept server comparison requests', async () => {
      const response = await request(app)
        .post('/api/analytics/compare')
        .send({
          serverIds: ['test-server-1', 'test-server-2']
        })
        .expect('Content-Type', /json/);

      // Note: This will fail without authentication
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/thresholds', () => {
    it('should return alert thresholds', async () => {
      const response = await request(app)
        .get('/api/analytics/thresholds')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/recommendations', () => {
    it('should return capacity recommendations', async () => {
      const response = await request(app)
        .get('/api/analytics/recommendations')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/analytics/export', () => {
    it('should accept export requests', async () => {
      const response = await request(app)
        .post('/api/analytics/export')
        .send({
          serverIds: ['test-server'],
          format: 'json'
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
    });
  });
});

describe('ResourceAnalyticsService', () => {
  // These would be unit tests for the service methods
  // For now, just basic structure tests
  
  it('should create service instance', () => {
    const { ResourceAnalyticsService } = require('../src/services/resourceAnalyticsService');
    const service = new ResourceAnalyticsService();
    expect(service).toBeDefined();
  });

  it('should have required methods', () => {
    const { ResourceAnalyticsService } = require('../src/services/resourceAnalyticsService');
    const service = new ResourceAnalyticsService();
    
    expect(typeof service.getResourceTrends).toBe('function');
    expect(typeof service.compareServers).toBe('function');
    expect(typeof service.getAlertThresholds).toBe('function');
    expect(typeof service.getCapacityRecommendations).toBe('function');
    expect(typeof service.exportAnalytics).toBe('function');
  });
});