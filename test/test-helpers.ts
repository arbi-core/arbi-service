import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { buildTestAppWithoutWebsocket } from './mock-app';
import { testConfig } from './config';
import { testDataSource } from './db';
import { Bot } from '../modules/database/entities/Bot.entity';
import { BotRepository } from '../modules/database/repository/Bot.repository';

// Create and initialize a test app
export async function createTestApp(): Promise<FastifyInstance> {
  // In Docker, use the app without WebSocket
  const isInDocker = process.env.RUNNING_IN_DOCKER === 'true';

  // Choose the appropriate app builder based on environment
  const app = isInDocker ?
    await buildTestAppWithoutWebsocket() :
    await buildApp();

  // Listen on a different port
  await app.listen({ port: testConfig.apiPort });
  return app;
}

// Close app properly
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  if (app) {
    await app.close();
  }
}

// Helper function to create test bots
export async function createTestBot(data: Partial<Bot> = {}): Promise<Bot> {
  const botRepository = new BotRepository();
  return await botRepository.createBot({
    name: `Test Bot ${Date.now()}`,
    type: 'test',
    status: 'stopped',
    config: {},
    ...data
  });
}

// Helper function to clean up test bots
export async function cleanTestBots(): Promise<void> {
  await testDataSource.getRepository(Bot).clear();
}