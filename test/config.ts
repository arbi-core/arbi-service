// Generate random port numbers for tests to avoid conflicts
function getRandomPort(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Use environment port if specified, otherwise use a random port in the 8100-8900 range
const randomApiPort = getRandomPort(8100, 8900);

export const testConfig = {
  database: {
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'arbi_test',
  },
  apiPort: parseInt(process.env.TEST_API_PORT || randomApiPort.toString(), 10),
};