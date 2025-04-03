import { execSync } from 'child_process';

export default async function () {
  console.log('🚀 Setting up test environment...');

  try {
    // Check if we're running inside Docker
    const isRunningInDocker = process.env.RUNNING_IN_DOCKER === 'true';

    if (!isRunningInDocker) {
      // Start the test database with Docker only if we're not already in Docker
      console.log('🐳 Starting test database with Docker...');
      execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });

      // Wait for the database to be ready
      console.log('⏳ Waiting for database to be ready...');
      execSync('docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres -p 5433 || sleep 5', { stdio: 'inherit' });
    } else {
      console.log('📦 Running inside Docker, skipping Docker commands');
      // Wait a bit for the database to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ Test environment is ready');
  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    throw error;
  }
}