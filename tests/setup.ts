import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { DatabaseService } from '../src/services/database';

// Global test setup
beforeAll(async () => {
  await DatabaseService.initialize();
});

afterAll(async () => {
  await DatabaseService.disconnect();
});

// Add any global test utilities here
export {};

// Example test helper functions
export const createTestUser = async (userData: any) => {
  // Helper to create test users
};

export const createTestServer = async (serverData: any) => {
  // Helper to create test servers
};

export const getAuthToken = async (email: string, password: string) => {
  // Helper to get JWT token for testing
};

// Mock external dependencies
jest.mock('dockerode');
jest.mock('ws');
