import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BotService } from "./bot.service";
import {
  CreateBotSchema,
  UpdateBotSchema,
  GetBotByIdSchema,
  GetAllBotsSchema,
  DeleteBotSchema
} from "./bot.schema";
import { FastifySchema } from "fastify";

export class BotController {
  private service: BotService;

  constructor() {
    this.service = new BotService();
  }

  registerRoutes(server: FastifyInstance): void {
    // Add Swagger tags to the main server instance
    if (!server.swagger) {
      server.decorateReply('swagger', {});
    }

    server.post(
      "/bots",
      { schema: CreateBotSchema as FastifySchema },
      this.createBot.bind(this),
    );

    server.get(
      "/bots",
      { schema: GetAllBotsSchema as FastifySchema },
      this.getAllBots.bind(this)
    );

    server.get(
      "/bots/:id",
      { schema: GetBotByIdSchema as FastifySchema },
      this.getBotById.bind(this)
    );

    server.put(
      "/bots/:id",
      { schema: UpdateBotSchema as FastifySchema },
      this.updateBot.bind(this),
    );

    server.delete(
      "/bots/:id",
      { schema: DeleteBotSchema as FastifySchema },
      this.deleteBot.bind(this)
    );
  }

  async createBot(
    request: FastifyRequest<{ Body: { name: string; type: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { name, type } = request.body;
      const bot = await this.service.createBot({ name, type });
      reply.code(201).send(bot);
    } catch (error) {
      reply.code(400).send({ message: "Failed to create bot" });
    }
  }

  async getAllBots(_: FastifyRequest, reply: FastifyReply) {
    try {
      const bots = await this.service.getAllBots();
      reply.code(200).send(bots);
    } catch (error) {
      reply.code(500).send({ message: "Failed to retrieve bots" });
    }
  }

  async getBotById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const bot = await this.service.getBotById(id);

      if (!bot) {
        return reply.code(404).send({ message: "Bot not found" });
      }

      reply.code(200).send(bot);
    } catch (error) {
      reply.code(500).send({ message: "Failed to retrieve bot" });
    }
  }

  async updateBot(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { name?: string; type?: string };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const updates = request.body;
      const updatedBot = await this.service.updateBot(id, updates);

      if (!updatedBot) {
        return reply.code(404).send({ message: "Bot not found" });
      }

      reply.code(200).send(updatedBot);
    } catch (error) {
      reply.code(500).send({ message: "Failed to update bot" });
    }
  }

  async deleteBot(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const success = await this.service.deleteBot(id);

      if (!success) {
        return reply.code(404).send({ message: "Bot not found" });
      }

      reply.code(204).send();
    } catch (error) {
      reply.code(500).send({ message: "Failed to delete bot" });
    }
  }
}
