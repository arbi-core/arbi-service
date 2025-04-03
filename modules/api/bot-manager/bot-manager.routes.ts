import { FastifyInstance } from "fastify";
import { BotManagerController } from "./bot-manager.controller";

export async function botManagerRoutes(server: FastifyInstance): Promise<void> {
  const controller = new BotManagerController();
  controller.registerRoutes(server);
}