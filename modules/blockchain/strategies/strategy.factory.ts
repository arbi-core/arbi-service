import { Bot } from "../../database/entities/Bot.entity";
import { WorkerBlockchainProvider } from "../worker-blockchain.provider";
import { ArbitrageStrategyConfig } from "./arbitrage.strategy";
import { BotStrategy } from "./strategy";
import { ArbitrageStrategy } from "./arbitrage.strategy";


export class BotStrategyFactory {
  private workerBlockchainProvider: WorkerBlockchainProvider;
  private arbitrageConfig: ArbitrageStrategyConfig;
  private strategies: Map<string, BotStrategy> = new Map();

  constructor(workerBlockchainProvider: WorkerBlockchainProvider, arbitrageConfig: ArbitrageStrategyConfig) {
    this.workerBlockchainProvider = workerBlockchainProvider;
    this.arbitrageConfig = arbitrageConfig;
  }

  public getInstance(): BotStrategyFactory {
    return this;
  }

  public getStrategy(bot: Bot): BotStrategy {
    if (this.strategies.has(bot.id)) {
      return this.strategies.get(bot.id)!;
    }


    if (!this.workerBlockchainProvider || !this.arbitrageConfig) {
      throw new Error("Worker blockchain provider or arbitrage config is not initialized");
    }


    const strategy = new ArbitrageStrategy(
      this.workerBlockchainProvider,
      bot,
      this.arbitrageConfig
    );


    this.strategies.set(bot.id, strategy);
    return strategy;
  }

  public cleanup(): void {
    for (const [botId, strategy] of this.strategies.entries()) {
      if (strategy.cleanup) {
        strategy.cleanup();
      }
      console.log(`Stopped strategy for bot ${botId}`);
    }
    this.strategies.clear();

    if (this.workerBlockchainProvider) {
      this.workerBlockchainProvider.cleanup();
    }
  }
}