import { DataSource } from 'typeorm';
import { testConfig } from './config';
import { Bot } from '../modules/database/entities/Bot.entity';

// Log connection details for debugging
console.log('Test database connection details:', {
  host: testConfig.database.host,
  port: testConfig.database.port,
  database: testConfig.database.database
});

// Create a separate data source for testing
export const testDataSource = new DataSource({
  type: 'postgres',
  host: testConfig.database.host,
  port: testConfig.database.port,
  username: testConfig.database.username,
  password: testConfig.database.password,
  database: testConfig.database.database,
  entities: [Bot],
  synchronize: true,
  logging: false,
  // Add retries for Docker environments where DB might not be immediately available
  connectTimeoutMS: 10000,
  maxQueryExecutionTime: 5000,
});

// Override the AppDataSource for testing
import { AppDataSource } from '../modules/database/db';
Object.defineProperty(AppDataSource, 'isInitialized', {
  get: () => testDataSource.isInitialized
});

AppDataSource.initialize = async () => {
  if (!testDataSource.isInitialized) {
    // Add retry logic for Docker environments
    let retries = 5;
    while (retries > 0) {
      try {
        await testDataSource.initialize();
        break;
      } catch (error) {
        console.error(`Failed to connect to test database, retries left: ${retries}`, error);
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return testDataSource;
};

AppDataSource.getRepository = (entity) => {
  return testDataSource.getRepository(entity);
};

export async function setupTestDatabase() {
  try {
    if (!testDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Only create tables if they don't exist
    try {
      // Clear all data from tables
      await testDataSource.query('TRUNCATE TABLE bots CASCADE');
      console.log('✅ Test database tables cleared');
    } catch (error) {
      console.log('Tables might not exist yet, will be created by synchronize');
    }

    console.log('✅ Test database initialized and cleaned');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
}

export async function closeTestDatabase() {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
    console.log('✅ Test database connection closed');
  }
}