import { Repository } from "typeorm";
import { Bot } from "../entities/Bot.entity";
import { AppDataSource } from "../db";

export class BotRepository {
  private repository: Repository<Bot>;

  constructor() {
    this.repository = AppDataSource.getRepository(Bot);
  }

  async createBot(botData: Partial<Bot>): Promise<Bot> {
    const bot = this.repository.create(botData);
    return await this.repository.save(bot);
  }

  async getAllBots(): Promise<Bot[]> {
    return await this.repository.find();
  }

  async getBotById(id: string): Promise<Bot | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | null> {
    const bot = await this.getBotById(id);
    if (!bot) return null;

    Object.assign(bot, data);
    return await this.repository.save(bot);
  }

  async deleteBot(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }
}
