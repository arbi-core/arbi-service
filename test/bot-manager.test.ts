import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createTestApp, createTestBot, cleanTestBots, closeTestApp } from './test-helpers';
import { Bot } from '../modules/database/entities/Bot.entity';

describe('Bot Manager API Tests', () => {
  let app: FastifyInstance;
  let request: any; // Use any to avoid typing issues with supertest
  let testBot: Bot;

  beforeAll(async () => {
    // Create and start the test application
    app = await createTestApp();
    request = supertest(app.server);
  });

  beforeEach(async () => {
    // Clean up and create a fresh test bot for each test
    await cleanTestBots();
    testBot = await createTestBot({ name: 'Test Bot for Manager', type: 'unit-test' });
  });

  afterAll(async () => {
    // Clean up and close the server
    await cleanTestBots();
    await closeTestApp(app);
  });

  describe('POST /api/bots/:id/start', () => {
    it('should start a bot', async () => {
      const response = await request
        .post(`/api/bots/${testBot.id}/start`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBot.id);
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 400 when trying to start an already running bot', async () => {
      // First, start the bot
      await request.post(`/api/bots/${testBot.id}/start`);

      // Try to start it again
      const response = await request
        .post(`/api/bots/${testBot.id}/start`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already running');
    });

    it('should return 404 when trying to start a non-existent bot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request
        .post(`/api/bots/${nonExistentId}/start`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/bots/:id/stop', () => {
    it('should stop a running bot', async () => {
      // First, start the bot
      await request.post(`/api/bots/${testBot.id}/start`);

      // Then stop it
      const response = await request
        .post(`/api/bots/${testBot.id}/stop`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBot.id);
      expect(response.body).toHaveProperty('status', 'stopped');
    });

    it('should return 400 when trying to stop a bot that is not running', async () => {
      // The bot is stopped by default
      const response = await request
        .post(`/api/bots/${testBot.id}/stop`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('is not running');
    });

    it('should return 404 when trying to stop a non-existent bot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request
        .post(`/api/bots/${nonExistentId}/stop`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/bots/:id/status', () => {
    it('should get status of a bot', async () => {
      const response = await request
        .get(`/api/bots/${testBot.id}/status`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('botId', testBot.id);
      expect(response.body).toHaveProperty('status', 'stopped'); // Default status
    });

    it('should return the correct status for a running bot', async () => {
      // First, start the bot
      await request.post(`/api/bots/${testBot.id}/start`);

      // Then check its status
      const response = await request
        .get(`/api/bots/${testBot.id}/status`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('botId', testBot.id);
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 404 when getting status of a non-existent bot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request
        .get(`/api/bots/${nonExistentId}/status`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Bot lifecycle flow', () => {
    it('should handle a complete bot lifecycle: start -> get status -> stop', async () => {
      // 1. Start the bot
      const startResponse = await request
        .post(`/api/bots/${testBot.id}/start`)
        .set('Accept', 'application/json');

      expect(startResponse.status).toBe(200);
      expect(startResponse.body).toHaveProperty('status', 'active');

      // 2. Get status of the running bot
      const statusResponse = await request
        .get(`/api/bots/${testBot.id}/status`)
        .set('Accept', 'application/json');

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('status', 'active');

      // 3. Stop the bot
      const stopResponse = await request
        .post(`/api/bots/${testBot.id}/stop`)
        .set('Accept', 'application/json');

      expect(stopResponse.status).toBe(200);
      expect(stopResponse.body).toHaveProperty('status', 'stopped');

      // 4. Verify the bot is stopped
      const finalStatusResponse = await request
        .get(`/api/bots/${testBot.id}/status`)
        .set('Accept', 'application/json');

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusResponse.body).toHaveProperty('status', 'stopped');
    });
  });
});