import { Bot } from "../../database/entities/Bot.entity";
import { BotRepository } from "../../database/repository/Bot.repository";
import { WebSocketService } from "../../websocket/websocket.service";

export class BotManagerService {
  private static instance: BotManagerService;
  private botRepository: BotRepository;
  private wsService: WebSocketService;

  private constructor() {
    this.botRepository = new BotRepository();
    this.wsService = WebSocketService.getInstance();
    console.log("BotManagerService initialized as singleton");
  }

  /**
   * Get BotManagerService instance (Singleton pattern implementation)
   */
  public static getInstance(): BotManagerService {
    if (!BotManagerService.instance) {
      BotManagerService.instance = new BotManagerService();
    }
    return BotManagerService.instance;
  }

  /**
   * Start a bot by its ID
   */
  async startBot(botId: string): Promise<Bot | null> {
    try {
      // Get bot information from database
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status === "active") {
        throw new Error(`Bot ${botId} is already running`);
      }

      const previousStatus = bot.status;

      // Here should be logic for starting a specific bot type
      // Depending on bot.type, different implementations can be launched

      // Update bot status in database
      const updatedBot = await this.botRepository.updateBot(botId, { status: "active" });

      // Notify about status change via WebSocket
      if (updatedBot) {
        this.wsService.emitBotStatusChange(updatedBot, previousStatus);
      }

      return updatedBot;
    } catch (error) {
      // Notify about error via WebSocket
      this.wsService.emitBotError(botId, error as Error);
      throw error;
    }
  }

  /**
   * Stop a bot by its ID
   */
  async stopBot(botId: string): Promise<Bot | null> {
    try {
      // Get bot information from database
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status !== "active") {
        throw new Error(`Bot ${botId} is not running`);
      }

      const previousStatus = bot.status;

      // Here should be logic for stopping the bot

      // Update bot status in database
      const updatedBot = await this.botRepository.updateBot(botId, { status: "stopped" });

      // Notify about status change via WebSocket
      if (updatedBot) {
        this.wsService.emitBotStatusChange(updatedBot, previousStatus);
      }

      return updatedBot;
    } catch (error) {
      // Notify about error via WebSocket
      this.wsService.emitBotError(botId, error as Error);
      throw error;
    }
  }

  /**
   * Get bot status by its ID
   */
  async getBotStatus(botId: string): Promise<{ botId: string; status: string; details?: any }> {
    try {
      // Get bot information from database
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      // Return bot information including status from the database
      return {
        botId: bot.id,
        status: bot.status,
        details: bot.config || undefined
      };
    } catch (error) {
      // Just rethrow the error without logging during tests
      throw error;
    }
  }
}