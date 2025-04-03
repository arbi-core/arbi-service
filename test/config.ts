export const testConfig = {
  database: {
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'arbi_test',
  },
  apiPort: parseInt(process.env.TEST_API_PORT || '8081', 10),
};