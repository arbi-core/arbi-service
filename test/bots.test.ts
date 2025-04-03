import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createTestApp, createTestBot, cleanTestBots, closeTestApp } from './test-helpers';
import { Bot } from '../modules/database/entities/Bot.entity';

describe('Bot API Tests', () => {
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
    testBot = await createTestBot({ name: 'Test Bot', type: 'unit-test' });
  });

  afterAll(async () => {
    // Clean up and close the server
    await cleanTestBots();
    // Use the improved close function
    await closeTestApp(app);
  });

  describe('GET /api/bots', () => {
    it('should return all bots', async () => {
      // Create another bot to test multiple items
      await createTestBot({ name: 'Another Bot', type: 'unit-test' });

      const response = await request.get('/api/bots');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('type');
    });
  });

  describe('GET /api/bots/:id', () => {
    it('should return a bot by ID', async () => {
      const response = await request.get(`/api/bots/${testBot.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBot.id);
      expect(response.body).toHaveProperty('name', testBot.name);
      expect(response.body).toHaveProperty('type', testBot.type);
    });

    it('should return 404 for non-existent bot ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`/api/bots/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Bot not found');
    });
  });

  describe('POST /api/bots', () => {
    it('should create a new bot', async () => {
      const newBot = {
        name: 'New Bot',
        type: 'test-creation'
      };

      const response = await request
        .post('/api/bots')
        .send(newBot)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newBot.name);
      expect(response.body).toHaveProperty('type', newBot.type);
      expect(response.body).toHaveProperty('status', 'stopped');
    });

    it('should return 400 for invalid bot data', async () => {
      const invalidBot = {
        // Missing required 'name' field
        type: 'test-validation'
      };

      const response = await request
        .post('/api/bots')
        .send(invalidBot)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/bots/:id', () => {
    it('should update an existing bot', async () => {
      const updates = {
        name: 'Updated Bot Name',
        type: 'updated-type'
      };

      const response = await request
        .put(`/api/bots/${testBot.id}`)
        .send(updates)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBot.id);
      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('type', updates.type);
    });

    it('should return 404 for updating non-existent bot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updates = { name: 'Updated Name' };

      const response = await request
        .put(`/api/bots/${nonExistentId}`)
        .send(updates)
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Bot not found');
    });
  });

  describe('DELETE /api/bots/:id', () => {
    it('should delete an existing bot', async () => {
      const response = await request.delete(`/api/bots/${testBot.id}`);

      expect(response.status).toBe(204);

      // Verify the bot is deleted
      const getResponse = await request.get(`/api/bots/${testBot.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for deleting non-existent bot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request.delete(`/api/bots/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Bot not found');
    });
  });
});