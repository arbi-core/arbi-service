import fastify from "fastify";
import { botRoutes } from "../modules/api/bot/bot.routes";
import { botManagerRoutes } from "../modules/api/bot-manager/bot-manager.routes";
import { connectToDatabase } from "../modules/database/db";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import path from "path";
import fs from "fs";

/**
 * Modified version of the app for testing in Docker without WebSocket dependencies
 */
export async function buildTestAppWithoutWebsocket() {
  const app = fastify();

  await connectToDatabase();

  // Register Swagger
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Arbi Service API (Test)',
        description: 'Arbi Service API documentation for testing',
        version: '1.0.0'
      },
      host: 'localhost:8081',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Bots', description: 'Bot management endpoints' },
        { name: 'Bot Manager', description: 'Bot runtime management endpoints' }
      ],
    }
  });

  // Register Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  app.register(botRoutes, { prefix: "/api" });
  app.register(botManagerRoutes, { prefix: "/api" });

  return app;
}