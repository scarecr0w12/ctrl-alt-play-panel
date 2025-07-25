import { teardownTestDatabase } from './setup';

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  try {
    await teardownTestDatabase();
    console.log('✅ Global test teardown completed');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw here to avoid masking other test failures
  }
}
