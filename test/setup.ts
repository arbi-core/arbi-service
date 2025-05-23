// Load environment variables from .env files for testing
import 'dotenv/config';
import { setupTestDatabase } from './db';

// Run before each test file
beforeAll(async () => {
  await setupTestDatabase();
});

// Increase the test timeout
jest.setTimeout(30000);