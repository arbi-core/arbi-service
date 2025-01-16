import { CreateBotType, UpdateBotType } from "./bot.schema";
import { Bot } from "../../database/entities/Bot.entity";

export class BotService {
  private bots: Bot[] = [];

  async createBot(data: CreateBotType): Promise<Bot> {
    const newBot: Bot = {
      id: String(this.bots.length + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      ...data,
    };
    this.bots.push(newBot);
    return newBot;
  }

  async getAllBots(): Promise<Bot[]> {
    return this.bots;
  }

  async getBotById(id: string): Promise<Bot | null> {
    return this.bots.find((bot) => bot.id === id) || null;
  }

  async updateBot(id: string, updates: UpdateBotType): Promise<Bot | null> {
    const botIndex = this.bots.findIndex((bot) => bot.id === id);
    if (botIndex === -1) return null;

    this.bots[botIndex] = { ...this.bots[botIndex], ...updates };
    return this.bots[botIndex];
  }

  async deleteBot(id: string): Promise<boolean> {
    const botIndex = this.bots.findIndex((bot) => bot.id === id);
    if (botIndex === -1) return false;

    this.bots.splice(botIndex, 1);
    return true;
  }
}
