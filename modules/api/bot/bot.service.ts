import { CreateBotType, UpdateBotType } from "./bot.schema";
import { Bot, Exchange, Token, Network } from "../../database/entities/Bot.entity";
import { BotRepository } from "../../database/repository/Bot.repository";

export class BotService {
  private botRepository: BotRepository;

  constructor() {
    this.botRepository = new BotRepository();
  }

  async createBot(data: CreateBotType): Promise<Bot> {
    const botData: Partial<Bot> = {
      name: data.name,
      status: "stopped",
      exchange1: data.exchange1 as Exchange,
      exchange2: data.exchange2 as Exchange,
      token1: data.token1 as Token,
      token2: data.token2 as Token,
      network: data.network as Network,
    };

    // Map string values to enum values if present
    if (data.exchange1) botData.exchange1 = Exchange[data.exchange1.toUpperCase() as keyof typeof Exchange];
    if (data.exchange2) botData.exchange2 = Exchange[data.exchange2.toUpperCase() as keyof typeof Exchange];
    if (data.token1) botData.token1 = Token[data.token1.toUpperCase() as keyof typeof Token];
    if (data.token2) botData.token2 = Token[data.token2.toUpperCase() as keyof typeof Token];
    if (data.network) botData.network = Network[data.network.toUpperCase() as keyof typeof Network];
    return await this.botRepository.createBot(botData);
  }

  async getAllBots(): Promise<Bot[]> {
    return await this.botRepository.getAllBots();
  }

  async getBotById(id: string): Promise<Bot | null> {
    return await this.botRepository.getBotById(id);
  }

  async updateBot(id: string, updates: UpdateBotType): Promise<Bot | null> {
    const botUpdates: Partial<Bot> = {};

    // Add individual properties to avoid type issues
    if (updates.name) botUpdates.name = updates.name;

    // Map string values to enum values if present
    if (updates.exchange1) botUpdates.exchange1 = Exchange[updates.exchange1.toUpperCase() as keyof typeof Exchange];
    if (updates.exchange2) botUpdates.exchange2 = Exchange[updates.exchange2.toUpperCase() as keyof typeof Exchange];
    if (updates.token1) botUpdates.token1 = Token[updates.token1.toUpperCase() as keyof typeof Token];
    if (updates.token2) botUpdates.token2 = Token[updates.token2.toUpperCase() as keyof typeof Token];
    if (updates.network) botUpdates.network = Network[updates.network.toUpperCase() as keyof typeof Network];

    return await this.botRepository.updateBot(id, botUpdates);
  }

  async deleteBot(id: string): Promise<boolean> {
    return await this.botRepository.deleteBot(id);
  }
}
