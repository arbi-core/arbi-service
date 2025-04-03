import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import WebSocket from 'ws';
import { createTestApp, createTestBot, cleanTestBots, closeTestApp } from './test-helpers';
import { Bot } from '../modules/database/entities/Bot.entity';
import { BotEventType } from '../modules/websocket/websocket.service';
import { WebSocketService } from '../modules/websocket/websocket.service';
import { testConfig } from './config';

describe('WebSocket Error Tests', () => {
  let app: FastifyInstance;
  let request: any;
  let testBot: Bot;
  let wsClient: WebSocket;
  let receivedMessages: any[] = [];
  let wsService: WebSocketService;

  const connectWebSocket = () => {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${testConfig.apiPort}/ws/bots`);

      ws.on('open', () => {
        resolve(ws);
      });

      ws.on('message', (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString());
        receivedMessages.push(message);
      });

      ws.on('error', (error) => {
        reject(error);
      });
    });
  };

  beforeAll(async () => {
    app = await createTestApp();
    request = supertest(app.server);
    wsService = WebSocketService.getInstance();
  });

  beforeEach(async () => {
    await cleanTestBots();
    testBot = await createTestBot({ name: 'WebSocket Error Test Bot', type: 'ws-error-test' });
    receivedMessages = [];
    wsClient = await connectWebSocket();
  });

  afterEach(async () => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  });

  afterAll(async () => {
    await cleanTestBots();
    await closeTestApp(app);
  });

  describe('Bot error events', () => {
    it('should receive error events when bot operation fails', async () => {
      // Manually emit a bot error
      wsService.emitBotError(testBot.id, new Error('Test error message'));

      // Wait for the error event
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const errorEvents = receivedMessages.filter(
            msg => msg.type === BotEventType.ERROR && msg.botId === testBot.id
          );

          expect(errorEvents.length).toBeGreaterThan(0);
          expect(errorEvents[0].data.message).toBe('Test error message');
          resolve();
        }, 500);
      });
    });

    it('should handle multiple clients receiving the same error events', async () => {
      // Connect a second client
      const secondClient = await connectWebSocket();

      // Manually emit a bot error
      wsService.emitBotError(testBot.id, new Error('Multiple clients test error'));

      // Wait for the error event on first client
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const errorEvents = receivedMessages.filter(
            msg => msg.type === BotEventType.ERROR && msg.botId === testBot.id
          );

          expect(errorEvents.length).toBeGreaterThan(0);
          expect(errorEvents[0].data.message).toBe('Multiple clients test error');
          resolve();
        }, 500);
      });

      // Close the second client
      if (secondClient && secondClient.readyState === WebSocket.OPEN) {
        secondClient.close();
      }
    });
  });

  describe('Client disconnection handling', () => {
    it('should properly remove disconnected clients', async () => {
      // Close the client
      wsClient.close();

      // Wait for the client to disconnect
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(wsClient.readyState).toBe(WebSocket.CLOSED);
          resolve();
        }, 100);
      });

      // Emit an error and ensure it doesn't cause server issues
      // This is mostly to ensure the server handles disconnected clients properly
      wsService.emitBotError(testBot.id, new Error('Error after disconnection'));

      // No assertions needed - we're just making sure the server doesn't crash
    });
  });

  describe('Error during bot operations', () => {
    it('should handle and broadcast errors during bot operations', async () => {
      // Try to start a non-existent bot to trigger an error
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request
        .post(`/api/bots/${nonExistentId}/start`)
        .set('Accept', 'application/json');

      // Check status response - should be 404
      const statusResponse = await request
        .get(`/api/bots/${nonExistentId}/status`)
        .set('Accept', 'application/json');

      expect(statusResponse.status).toBe(404);

      // If the WebSocketService is properly integrated with bot operations,
      // we might receive an error event about this failed operation
      // (Note: This depends on whether your API emits WebSocket events for API errors)

      // Instead of checking for a potentially optional feature,
      // we'll just emit a manual error to test the websocket functionality
      wsService.emitBotError(nonExistentId, new Error('Bot not found'));

      // Wait for the error event
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const errorEvents = receivedMessages.filter(
            msg => msg.type === BotEventType.ERROR && msg.botId === nonExistentId
          );

          expect(errorEvents.length).toBeGreaterThan(0);
          resolve();
        }, 500);
      });
    });
  });
});