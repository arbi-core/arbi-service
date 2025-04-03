import { FastifyInstance } from "fastify";
import { BotController } from "./bot.controller";

export async function botRoutes(server: FastifyInstance): Promise<void> {
  const controller = new BotController();
  controller.registerRoutes(server);
}
