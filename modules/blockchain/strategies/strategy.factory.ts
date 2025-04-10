import { Bot } from "../../database/entities/Bot.entity";
import { WorkerBlockchainProvider } from "../worker-blockchain.provider";
import { ArbitrageStrategyConfig } from "./arbitrage.strategy";
import { BotStrategy } from "./strategy";
import { ArbitrageStrategy } from "./arbitrage.strategy";

/**
 * Factory for creating bot strategies
 * This class selects appropriate strategy based on bot configuration
 */
export class BotStrategyFactory {
  private workerBlockchainProvider: WorkerBlockchainProvider;
  private arbitrageConfig: ArbitrageStrategyConfig;
  private strategies: Map<string, BotStrategy> = new Map();

  /**
   * Create a new BotStrategyFactory
   * @param workerBlockchainProvider The blockchain provider for the worker
   * @param arbitrageConfig Configuration for arbitrage strategies
   */
  constructor(workerBlockchainProvider: WorkerBlockchainProvider, arbitrageConfig: ArbitrageStrategyConfig) {
    this.workerBlockchainProvider = workerBlockchainProvider;
    this.arbitrageConfig = arbitrageConfig;
  }

  /**
   * Get a strategy for a given bot
   * If the strategy already exists for the bot, it will be reused
   * @param bot The bot to get a strategy for
   * @returns The strategy for the bot
   */
  public getStrategy(bot: Bot): BotStrategy {
    // Check if we already have a strategy for this bot
    if (this.strategies.has(bot.id)) {
      return this.strategies.get(bot.id)!;
    }

    // Create a new strategy for the bot
    if (!this.workerBlockchainProvider || !this.arbitrageConfig) {
      throw new Error("Worker blockchain provider or arbitrage config is not initialized");
    }

    // For now, we only have one strategy type
    const strategy = new ArbitrageStrategy(
      this.workerBlockchainProvider,
      bot,
      this.arbitrageConfig
    );

    // Store the strategy for reuse
    this.strategies.set(bot.id, strategy);
    return strategy;
  }

  /**
   * Clean up all strategies and resources
   */
  public cleanup(): void {
    // Clean up all strategies
    for (const [botId, strategy] of this.strategies.entries()) {
      if (strategy.cleanup) {
        strategy.cleanup();
      }
      console.log(`Stopped strategy for bot ${botId}`);
    }
    this.strategies.clear();

    // Clean up the blockchain provider
    if (this.workerBlockchainProvider) {
      this.workerBlockchainProvider.cleanup();
    }
  }
}