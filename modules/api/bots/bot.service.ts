import { CreateBotType, UpdateBotType } from "./bot.schema";
import { Bot } from "../../database/entities/Bot.entity";
import { BotRepository } from "../../database/repository/Bot.repository";

export class BotService {
  private botRepository: BotRepository;

  constructor() {
    this.botRepository = new BotRepository();
  }

  async createBot(data: CreateBotType): Promise<Bot> {
    const botData: Partial<Bot> = {
      ...data,
      status: "stopped",
      config: {},
    };
    return await this.botRepository.createBot(botData);
  }

  async getAllBots(): Promise<Bot[]> {
    return await this.botRepository.getAllBots();
  }

  async getBotById(id: string): Promise<Bot | null> {
    return await this.botRepository.getBotById(id);
  }

  async updateBot(id: string, updates: UpdateBotType): Promise<Bot | null> {
    return await this.botRepository.updateBot(id, updates);
  }

  async deleteBot(id: string): Promise<boolean> {
    return await this.botRepository.deleteBot(id);
  }
}
