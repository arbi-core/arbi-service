import fastify from "fastify";
import { botRoutes } from "./modules/api/bots/bot.routes";
import { connectToDatabase } from "./modules/database/db";

export async function buildApp() {
  const app = fastify();

  await connectToDatabase();
  app.register(botRoutes, { prefix: "/api" });

  app.addHook("onRequest", async (request, reply) => {
    // console.log("request", request);
  });

  return app;
}
