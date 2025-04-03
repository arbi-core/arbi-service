import { execSync } from 'child_process';
import { closeTestDatabase } from './db';

export default async function () {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Close database connections
    await closeTestDatabase();

    // Check if we're running inside Docker
    const isRunningInDocker = process.env.RUNNING_IN_DOCKER === 'true';

    // Optionally stop the test database, but only if not running in Docker
    if (process.env.KEEP_TEST_DB !== 'true' && !isRunningInDocker) {
      console.log('🛑 Stopping test database...');
      execSync('docker compose -f docker-compose.test.yml down', { stdio: 'inherit' });
    }

    console.log('✅ Test environment cleanup complete');

    // Force exit to avoid hanging
    setTimeout(() => {
      console.log('🔄 Forcing exit to avoid hanging process');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('❌ Error cleaning up test environment:', error);
    process.exit(1);
  }
}