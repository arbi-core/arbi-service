import { Bot } from "../../database/entities/Bot.entity";
import { BotRepository } from "../../database/repository/Bot.repository";

export class BotManagerService {
  private static instance: BotManagerService;
  private botRepository: BotRepository;
  private runningBots: Map<string, any> = new Map(); // Здесь храним ссылки на запущенные экземпляры ботов

  private constructor() {
    this.botRepository = new BotRepository();
    console.log("BotManagerService initialized as singleton");
  }

  /**
   * Получить экземпляр BotManagerService (реализация паттерна Singleton)
   */
  public static getInstance(): BotManagerService {
    if (!BotManagerService.instance) {
      BotManagerService.instance = new BotManagerService();
    }
    return BotManagerService.instance;
  }

  /**
   * Запустить бота по его ID
   */
  async startBot(botId: string): Promise<Bot | null> {
    try {
      // Получаем информацию о боте из БД
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status === "active") {
        throw new Error(`Bot ${botId} is already running`);
      }

      // Здесь должна быть логика запуска конкретного типа бота
      // В зависимости от bot.type можно запускать разные реализации

      // Обновляем статус бота в БД
      const updatedBot = await this.botRepository.updateBot(botId, { status: "active" });

      // Сохраняем ссылку на запущенный экземпляр бота
      this.runningBots.set(botId, { /* ссылка на запущенный экземпляр бота */ });

      return updatedBot;
    } catch (error) {
      console.error(`Error starting bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Остановить бота по его ID
   */
  async stopBot(botId: string): Promise<Bot | null> {
    try {
      // Получаем информацию о боте из БД
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      if (bot.status !== "active") {
        throw new Error(`Bot ${botId} is not running`);
      }

      // Здесь должна быть логика остановки бота

      // Удаляем бота из списка запущенных
      this.runningBots.delete(botId);

      // Обновляем статус бота в БД
      return await this.botRepository.updateBot(botId, { status: "stopped" });
    } catch (error) {
      console.error(`Error stopping bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Получить статус бота по его ID
   */
  async getBotStatus(botId: string): Promise<{ botId: string; status: string; details?: any }> {
    try {
      // Получаем информацию о боте из БД
      const bot = await this.botRepository.getBotById(botId);

      if (!bot) {
        throw new Error(`Bot with ID ${botId} not found`);
      }

      // Если бот запущен, можно получить дополнительную информацию
      const details = this.runningBots.get(botId);

      return {
        botId: bot.id,
        status: bot.status,
        details: details || undefined
      };
    } catch (error) {
      console.error(`Error getting bot status ${botId}:`, error);
      throw error;
    }
  }
}