import fastify from "fastify";
import { botRoutes } from "./modules/api/bots/bot.routes";
import { connectToDatabase } from "./modules/database/db";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function buildApp() {
  const app = fastify();

  await connectToDatabase();

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
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Bots', description: 'Bot management endpoints' }
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

  app.addHook("onRequest", async (request, reply) => {
    // console.log("request", request);
  });

  return app;
}
