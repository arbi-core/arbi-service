import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BotManagerService } from "./bot-manager.service";
import { FastifySchema } from "fastify";

// Схемы для валидации запросов
const BotManagerSchema = {
  startBot: {
    description: 'Start a bot by ID',
    tags: ['Bot Manager'],
    summary: 'Start a bot',
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Bot ID' }
      }
    },
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' }
        }
      },
      404: {
        description: 'Bot not found',
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  },
  stopBot: {
    description: 'Stop a bot by ID',
    tags: ['Bot Manager'],
    summary: 'Stop a bot',
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Bot ID' }
      }
    },
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' }
        }
      },
      404: {
        description: 'Bot not found',
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  },
  getBotStatus: {
    description: 'Get bot status by ID',
    tags: ['Bot Manager'],
    summary: 'Get bot status',
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Bot ID' }
      }
    },
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          botId: { type: 'string' },
          status: { type: 'string' },
          details: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      404: {
        description: 'Bot not found',
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  }
};

export class BotManagerController {
  private service: BotManagerService;

  constructor() {
    // Получаем синглтон-экземпляр сервиса
    this.service = BotManagerService.getInstance();
  }

  registerRoutes(server: FastifyInstance): void {
    // Add Swagger tags if they don't exist
    if (!server.swagger) {
      server.decorateReply('swagger', {});
    }

    // Endpoint для запуска бота
    server.post(
      "/bots/:id/start",
      { schema: BotManagerSchema.startBot as FastifySchema },
      this.startBot.bind(this)
    );

    // Endpoint для остановки бота
    server.post(
      "/bots/:id/stop",
      { schema: BotManagerSchema.stopBot as FastifySchema },
      this.stopBot.bind(this)
    );

    // Endpoint для получения статуса бота
    server.get(
      "/bots/:id/status",
      { schema: BotManagerSchema.getBotStatus as FastifySchema },
      this.getBotStatus.bind(this)
    );
  }

  async startBot(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const bot = await this.service.startBot(id);
      reply.code(200).send(bot);
    } catch (error) {
      const err = error as Error;
      // Обработка разных типов ошибок
      if (err.message.includes('not found')) {
        reply.code(404).send({ message: err.message });
      } else if (err.message.includes('already running')) {
        reply.code(400).send({ message: err.message });
      } else {
        reply.code(500).send({ message: `Failed to start bot: ${err.message}` });
      }
    }
  }

  async stopBot(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const bot = await this.service.stopBot(id);
      reply.code(200).send(bot);
    } catch (error) {
      const err = error as Error;
      // Обработка разных типов ошибок
      if (err.message.includes('not found')) {
        reply.code(404).send({ message: err.message });
      } else if (err.message.includes('is not running')) {
        reply.code(400).send({ message: err.message });
      } else {
        reply.code(500).send({ message: `Failed to stop bot: ${err.message}` });
      }
    }
  }

  async getBotStatus(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const status = await this.service.getBotStatus(id);
      reply.code(200).send(status);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        reply.code(404).send({ message: err.message });
      } else {
        reply.code(500).send({ message: `Failed to get bot status: ${err.message}` });
      }
    }
  }
}