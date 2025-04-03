import fastify from "fastify";
import { botRoutes } from "./modules/api/bot/bot.routes";
import { botManagerRoutes } from "./modules/api/bot-manager/bot-manager.routes";
import { websocketRoutes } from "./modules/websocket/websocket.routes";
import { connectToDatabase } from "./modules/database/db";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import websocket from "@fastify/websocket";
import path from "path";
import fs from "fs";

export async function buildApp() {
  const app = fastify();

  await connectToDatabase();
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MiB
      clientTracking: true
    }
  });

  // Register Swagger
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Arbi Service API',
        description: 'Arbi Service API documentation',
        version: '1.0.0'
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here'
      },
      host: 'localhost:8080',
      schemes: ['http', 'ws'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Bots', description: 'Bot management endpoints' },
        { name: 'Bot Manager', description: 'Bot runtime management endpoints' },
        { name: 'WebSockets', description: 'Real-time communication endpoints' }
      ],
    }
  });

  // Register Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'],
      displayRequestDuration: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      // Add WebSocket documentation to the Swagger spec
      return swaggerObject;
    },
    transformSpecificationClone: true
  });

  app.register(botRoutes, { prefix: "/api" });
  app.register(botManagerRoutes, { prefix: "/api" });
  app.register(websocketRoutes);

  app.addHook("onRequest", async (request, reply) => {
    // console.log("request", request);
  });

  // Add a route to serve the WebSocket usage documentation
  app.get('/docs/websocket-usage', (_, reply) => {
    const filePath = path.join(__dirname, 'docs/websocket-usage.md');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      reply.type('text/markdown').send(content);
    } catch (error) {
      reply.code(404).send({ message: 'Documentation not found' });
    }
  });

  return app;
}
