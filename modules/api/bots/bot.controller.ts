import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BotService } from "./bot.service";
import { CreateBotSchema, UpdateBotSchema } from "./bot.schema";
import { FastifySchema } from "fastify";

export class BotController {
  private service: BotService;

  constructor() {
    this.service = new BotService();
  }

  registerRoutes(server: FastifyInstance): void {
    server.post(
      "/bots",
      { schema: CreateBotSchema as FastifySchema },
      this.createBot.bind(this),
    );
    server.get("/bots", this.getAllBots.bind(this));
    server.get("/bots/:id", this.getBotById.bind(this));
    server.put(
      "/bots/:id",
      { schema: UpdateBotSchema as FastifySchema },
      this.updateBot.bind(this),
    );
    server.delete("/bots/:id", this.deleteBot.bind(this));
  }

  async createBot(
    request: FastifyRequest<{ Body: { name: string; type: string } }>,
    reply: FastifyReply,
  ) {
    const { name, type } = request.body;
    const bot = await this.service.createBot({ name, type });
    reply.code(201).send(bot);
  }

  async getAllBots(_: FastifyRequest, reply: FastifyReply) {
    const bots = await this.service.getAllBots();
    reply.code(200).send(bots);
  }

  async getBotById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const bot = await this.service.getBotById(id);

    if (!bot) {
      return reply.code(404).send({ message: "Bot not found" });
    }

    reply.code(200).send(bot);
  }

  async updateBot(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { name?: string; type?: string };
    }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const updates = request.body;
    const updatedBot = await this.service.updateBot(id, updates);

    if (!updatedBot) {
      return reply.code(404).send({ message: "Bot not found" });
    }

    reply.code(200).send(updatedBot);
  }

  async deleteBot(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const success = await this.service.deleteBot(id);

    if (!success) {
      return reply.code(404).send({ message: "Bot not found" });
    }

    reply.code(204).send();
  }
}
