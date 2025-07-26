import { cleanupTestDatabase } from './setup';

export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  // Clean the database before tests start
  try {
    await cleanupTestDatabase();
    console.log('✅ Global test setup completed');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}
